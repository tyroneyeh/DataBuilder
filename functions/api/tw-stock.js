const CODE_PATTERN = /^[0-9]{4,6}[A-Z]{0,2}$/
const FETCH_HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'TY-DataBuilder/1.0 (+https://ty-db.pages.dev)'
}

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
}

const parsePositiveNum = (val) => {
    if (val === null || val === undefined) return null
    const cleaned = String(val).replace(/,/g, '').trim()
    if (!cleaned || cleaned === '-' || cleaned === '--') return null
    const num = Number(cleaned)
    return Number.isFinite(num) && num > 0 ? num : null
}

const parseSignedNum = (val) => {
    if (val === null || val === undefined) return null
    const cleaned = String(val).replace(/,/g, '').trim()
    if (!cleaned || cleaned === '-' || cleaned === '--') return null
    const num = Number(cleaned)
    return Number.isFinite(num) ? num : null
}

const parseMisItem = (item) => {
    const code = String(item?.c || '').trim().toUpperCase()
    if (!code || !CODE_PATTERN.test(code)) return null
    const tradePrice = parsePositiveNum(item.z)
    const prevClose = parsePositiveNum(item.y)
    const price = tradePrice ?? prevClose
    if (!price) return null

    const change = prevClose ? Number((price - prevClose).toFixed(2)) : null
    const changePct = prevClose && change !== null
        ? Number(((change / prevClose) * 100).toFixed(2))
        : null

    return {
        code,
        name: String(item.n || '').trim(),
        market: item.ex === 'otc' ? 'TPEx' : 'TWSE',
        price,
        prevClose,
        change,
        changePct,
        date: String(item.d || '').trim(),
        time: String(item.t || '').trim(),
        isPrevClose: !tradePrice,
        source: 'mis'
    }
}

export async function fetchTwStockQuotes(rawCodes) {
    const validCodes = [...new Set(
        (Array.isArray(rawCodes) ? rawCodes : [])
            .map((c) => String(c || '').trim().toUpperCase())
            .filter((c) => CODE_PATTERN.test(c))
    )].slice(0, 50)

    if (!validCodes.length) {
        return { quotes: {}, fetchedAt: Date.now() }
    }

    const quotes = {}

    // 1. Primary: TWSE/TPEx real-time MIS quotes (supports both 上市 tse_ and 上櫃 otc_)
    const CHUNK_SIZE = 20
    for (let i = 0; i < validCodes.length; i += CHUNK_SIZE) {
        const chunk = validCodes.slice(i, i + CHUNK_SIZE)
        const channels = chunk.flatMap((c) => [`tse_${c}.tw`, `otc_${c}.tw`]).join('|')
        const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${encodeURIComponent(channels)}&json=1&delay=0`
        try {
            const res = await fetch(url, { headers: FETCH_HEADERS })
            if (!res.ok) continue
            const json = await res.json()
            if (Array.isArray(json?.msgArray)) {
                for (const item of json.msgArray) {
                    const parsed = parseMisItem(item)
                    if (!parsed) continue
                    const existing = quotes[parsed.code]
                    if (!existing || (existing.isPrevClose && !parsed.isPrevClose) || (!existing.name && parsed.name)) {
                        quotes[parsed.code] = parsed
                    }
                }
            }
        } catch {
            // Fall through to OpenAPI daily close fallback
        }
    }

    // 2. Fallback: TWSE & TPEx official daily close OpenAPI for any missing codes
    const missing = new Set(validCodes.filter((c) => !quotes[c]))
    if (missing.size > 0) {
        const [twseRes, tpexRes] = await Promise.allSettled([
            fetch('https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL', { headers: FETCH_HEADERS }),
            fetch('https://www.tpex.org.tw/openapi/v1/tpex_mainboard_daily_close_quotes', { headers: FETCH_HEADERS })
        ])

        if (twseRes.status === 'fulfilled' && twseRes.value.ok) {
            try {
                const list = await twseRes.value.json()
                if (Array.isArray(list)) {
                    for (const item of list) {
                        const code = String(item?.Code || '').trim().toUpperCase()
                        if (!missing.has(code)) continue
                        const price = parsePositiveNum(item.ClosingPrice)
                        if (!price) continue
                        const change = parseSignedNum(item.Change)
                        const prevClose = change !== null && price - change > 0
                            ? Number((price - change).toFixed(2))
                            : null
                        const changePct = prevClose && change !== null
                            ? Number(((change / prevClose) * 100).toFixed(2))
                            : null
                        quotes[code] = {
                            code,
                            name: String(item.Name || '').trim(),
                            market: 'TWSE',
                            price,
                            prevClose,
                            change,
                            changePct,
                            date: String(item.Date || '').trim(),
                            time: '',
                            isPrevClose: false,
                            source: 'openapi'
                        }
                        missing.delete(code)
                    }
                }
            } catch {}
        }

        if (missing.size > 0 && tpexRes.status === 'fulfilled' && tpexRes.value.ok) {
            try {
                const list = await tpexRes.value.json()
                if (Array.isArray(list)) {
                    for (const item of list) {
                        const code = String(item?.SecuritiesCompanyCode || '').trim().toUpperCase()
                        if (!missing.has(code)) continue
                        const price = parsePositiveNum(item.Close)
                        if (!price) continue
                        const change = parseSignedNum(item.Change)
                        const prevClose = change !== null && price - change > 0
                            ? Number((price - change).toFixed(2))
                            : null
                        const changePct = prevClose && change !== null
                            ? Number(((change / prevClose) * 100).toFixed(2))
                            : null
                        quotes[code] = {
                            code,
                            name: String(item.CompanyName || '').trim(),
                            market: 'TPEx',
                            price,
                            prevClose,
                            change,
                            changePct,
                            date: String(item.Date || '').trim(),
                            time: '',
                            isPrevClose: false,
                            source: 'openapi'
                        }
                        missing.delete(code)
                    }
                }
            } catch {}
        }
    }

    return { quotes, fetchedAt: Date.now() }
}

export function onRequestOptions() {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function onRequestGet({ request, waitUntil }) {
    const url = new URL(request.url)
    const codesParam = url.searchParams.get('codes') || ''
    const normalizedCodes = [...new Set(
        codesParam
            .split(',')
            .map((c) => c.trim().toUpperCase())
            .filter((c) => CODE_PATTERN.test(c))
    )].sort().slice(0, 50)

    if (!normalizedCodes.length) {
        return new Response(JSON.stringify({ quotes: {}, fetchedAt: Date.now() }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'public, max-age=60',
                ...CORS_HEADERS
            }
        })
    }

    const edgeCache = typeof caches !== 'undefined' && caches?.default ? caches.default : null
    const cacheKey = new Request(`${url.origin}/api/tw-stock?codes=${encodeURIComponent(normalizedCodes.join(','))}`, {
        method: 'GET'
    })

    if (edgeCache) {
        const cached = await edgeCache.match(cacheKey)
        if (cached) {
            const hitHeaders = new Headers(cached.headers)
            hitHeaders.set('X-Cache', 'HIT')
            return new Response(cached.body, {
                status: cached.status,
                headers: hitHeaders
            })
        }
    }

    try {
        const result = await fetchTwStockQuotes(normalizedCodes)
        const hasQuotes = Object.keys(result.quotes || {}).length > 0
        const response = new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': hasQuotes ? 'public, max-age=60, s-maxage=60' : 'no-store',
                'X-Cache': 'MISS',
                ...CORS_HEADERS
            }
        })
        if (edgeCache && hasQuotes) {
            const putPromise = edgeCache.put(cacheKey, response.clone())
            if (typeof waitUntil === 'function') {
                waitUntil(putPromise)
            } else {
                await putPromise
            }
        }
        return response
    } catch (err) {
        return new Response(JSON.stringify({ error: err?.message || 'Failed to fetch stock quotes', quotes: {} }), {
            status: 502,
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Cache-Control': 'no-store',
                ...CORS_HEADERS
            }
        })
    }
}
