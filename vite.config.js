import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, 'node_modules', '.vite-build')

const ROOT_STATIC_FILES = new Map([
    ['/App.webmanifest', 'application/manifest+json; charset=utf-8'],
    ['/favicon.ico', 'image/x-icon'],
    ['/databuilder.png', 'image/png'],
    ['/web-app-manifest-192x192.png', 'image/png'],
    ['/web-app-manifest-512x512.png', 'image/png'],
    ['/sw.js', 'application/javascript; charset=utf-8'],
])

function rootStaticMiddleware(req, res, next) {
    const urlPath = (req.url || '').split('?')[0]
    const contentType = ROOT_STATIC_FILES.get(urlPath)
    if (!contentType) return next()

    const filePath = path.resolve(__dirname, urlPath.slice(1))
    if (!fs.existsSync(filePath)) return next()

    res.setHeader('Content-Type', contentType)
    fs.createReadStream(filePath).pipe(res)
}

function serveRootStaticAssets() {
    return {
        name: 'serve-root-static-assets',
        configureServer(server) {
            server.middlewares.use(rootStaticMiddleware)
        },
        configurePreviewServer(server) {
            server.middlewares.use(rootStaticMiddleware)
        },
    }
}

function computeInlineScriptHashes(html) {
    const hashes = []
    const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
    for (const match of html.matchAll(scriptRegex)) {
        const attrs = match[1] || ''
        if (/\bsrc\s*=/i.test(attrs)) continue
        const body = (match[2] || '').replace(/\r\n?/g, '\n')
        if (!body) continue
        const digest = crypto.createHash('sha256').update(body, 'utf8').digest('base64')
        hashes.push(`'sha256-${digest}'`)
    }
    return hashes
}

function syncHeadersCspScriptHashes(headersPath, hashes) {
    if (!fs.existsSync(headersPath) || hashes.length === 0) return

    const content = fs.readFileSync(headersPath, 'utf8')
    const updated = content.replace(/(script-src\s+)([^;\r\n]+)/, (_, prefix, directiveValue) => {
        const tokens = directiveValue
            .trim()
            .split(/\s+/)
            .filter((token) => token && !/^'sha256-[A-Za-z0-9+/=]+'$/.test(token))

        const selfIdx = tokens.indexOf("'self'")
        const insertAt = selfIdx >= 0 ? selfIdx + 1 : 0
        tokens.splice(insertAt, 0, ...hashes)
        return `${prefix}${tokens.join(' ')}`
    })

    if (updated !== content) {
        fs.writeFileSync(headersPath, updated, 'utf8')
    }
}

function copySingleFileAndSyncCsp() {
    return {
        name: 'copy-singlefile-and-sync-csp',
        apply: 'build',
        closeBundle() {
            const builtHtmlPath = path.resolve(distDir, 'index.html')
            const targetHtmlPath = path.resolve(__dirname, 'index.html')
            const headersPath = path.resolve(__dirname, '_headers')

            if (!fs.existsSync(builtHtmlPath)) return

            const html = fs.readFileSync(builtHtmlPath, 'utf8')
            fs.writeFileSync(targetHtmlPath, html, 'utf8')
            console.log('✓ Copied single-file build to ./index.html')

            const hashes = computeInlineScriptHashes(html)
            syncHeadersCspScriptHashes(headersPath, hashes)
            console.log(`✓ Synced ${hashes.length} inline script SHA-256 hash(es) to ./_headers`)
        },
    }
}

export default defineConfig({
    root: path.resolve(__dirname, 'src'),
    base: './',
    publicDir: false,
    plugins: [
        vue(),
        tailwindcss(),
        viteSingleFile({
            removeViteModuleLoader: true,
        }),
        serveRootStaticAssets(),
        copySingleFileAndSyncCsp(),
    ],
    build: {
        outDir: distDir,
        emptyOutDir: true,
        target: 'es2020',
        minify: 'esbuild',
        sourcemap: false,
    },
})
