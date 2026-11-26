<template>
<div v-if="!isPrinting" class="flex flex-col sm:flex-row bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
    <div class="flex sm:flex-row flex-wrap w-full sm:flex-1">
        <div class="flex w-full relative">
            <input
                type="text"
                v-model="currentStorageKey"
                list="storage-key-options"
                @change="changeStorageKey"
                @focus="onKeyFocus" @blur="onKeyBlur"
                :placeholder="translate('Select or create a workspace')"
                class="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-base bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            >
            <datalist id="storage-key-options">
                <option v-for="key in savedKeysList" :key="key" :value="key"></option>
            </datalist>
            <button
                type="button"
                @click.stop="isWorkspaceMenuOpen = !isWorkspaceMenuOpen"
                class="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:bg-indigo-100 dark:active:bg-gray-700 px-3 sm:py-2 rounded transition-colors font-bold leading-none rotate-90 outline-none relative"
            >•••</button>
            <div
                v-if="isWorkspaceMenuOpen"
                @click="isWorkspaceMenuOpen = false"
                class="fixed inset-0 z-40 cursor-pointer"
                style="-webkit-tap-highlight-color: transparent"
            ></div>
            <div
                v-if="isWorkspaceMenuOpen"
                class="absolute right-0 top-full w-[160px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-xl rounded-md z-[99] flex flex-col overflow-hidden transform origin-top-right"
            >
                <button type="button" @click="openWorkspaceModal('add')" class="px-3 py-3 sm:py-2 text-base sm:text-sm text-gray-700 dark:text-gray-200 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors">➕ {{ translate('Add') }}</button>
                <button type="button" @click="openWorkspaceModal('rename')" class="px-3 py-3 sm:py-2 text-base sm:text-sm text-gray-700 dark:text-gray-200 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors">✏️ {{ translate('Rename') }}</button>
                <button type="button" @click="deleteWorkspace" class="px-3 py-3 sm:py-2 text-base sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 text-left flex items-center gap-2 transition-colors">✖ {{ translate('Delete') }}</button>
            </div>
        </div>

    </div>

</div>

<div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300 print:mb-8 print:border-none print:shadow-none" v-show="hasNumberColumn">
    <div v-if="!isPrinting"
        @click="toggleChart"
        class="px-2 text-lg font-bold text-gray-700 dark:text-gray-300 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
    >
        <span class="flex items-center">📊 {{ translate('Summary') }}</span>
        <div class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-gray-600 transition-all">
            <span class="transform transition-transform duration-300" :class="isChartOpen ? 'rotate-180' : 'rotate-0'">▼</span>
        </div>
    </div>
    <div ref="chartContainer" v-show="columns.length && isChartOpen" class="w-full mt-2"
        :style="!isPrinting && lockedChartMinHeight ? { minHeight: lockedChartMinHeight + 'px' } : undefined">
        <div v-if="hasDateColumn" class="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-50 dark:border-gray-700 shadow-sm flex flex-wrap gap-2 items-center justify-center pb-2">
            <div v-if="hasDateColumn && yearFilters.length > 1" class="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-50 dark:border-gray-700 shadow-sm flex flex-wrap gap-2 items-center justify-center">
                <span class="text-gray-500 dark:text-gray-400 text-sm font-bold flex items-center mr-2">📅 {{ translate('Year') }}:</span>
                <button
                    v-for="y in yearFilters" :key="y.year"
                    @click="toggleFilter('year', y.year)"
                    class="px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 border select-none active:scale-95"
                    :class="y.active ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700 shadow-sm' : 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700 opacity-50 grayscale'"
                >
                    {{ y.year }}
                </button>
            </div>
            <span class="text-gray-500 dark:text-gray-400 text-sm font-bold flex items-center mr-2">📅 {{ translate('Month') }}:</span>
            <button
                v-for="m in monthFilters" :key="m.month"
                @click="toggleFilter('month', m.month)"
                class="px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 border select-none active:scale-95"
                :class="m.active ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700 shadow-sm' : 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:border-gray-700 opacity-50 grayscale'"
            >
                {{ m.month }}
            </button>
        </div>
        <div class="flex w-full my-2 mx-auto" :class="isPrinting ? 'flex-col max-w-full gap-4' : 'flex-col md:flex-row max-w-[95%] md:max-w-[70%]'">
            <div v-if="chartViewModes.length > 1" class="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg relative h-10 cursor-pointer select-none mx-auto shadow-inner mb-4 print:hidden"
                :class="chartViewModes.length === 3 ? 'w-60' : 'w-40'">
                <div class="absolute top-1 bottom-1 left-1 bg-white dark:bg-gray-600 rounded-md shadow transition-transform duration-300 ease-out"
                    :class="[
                        chartViewModes.length === 3 ? 'w-[calc(33.333%-2.67px)]' : 'w-[calc(50%-4px)]',
                        activeChartViewIndex === 0 ? 'translate-x-0' : (activeChartViewIndex === 1 ? 'translate-x-full' : 'translate-x-[200%]')
                    ]"></div>
                <div v-if="hasBudgetCategories" @click="debouncedUpdateChart(null, 'budget')"
                    :class="chartViewMode === 'budget' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'"
                    class="flex-1 flex justify-center items-center z-10 text-xs font-bold transition-colors duration-300 text-nowrap">
                    {{ translate('Budget') }}
                </div>
                <div @click="debouncedUpdateChart(null, 'expense')" class="flex-1 flex justify-center items-center z-10 text-xs font-bold transition-colors duration-300 text-nowrap"
                    :class="chartViewMode === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'">
                    ➖ {{ translate('Expense') }}
                </div>
                <div v-if="hasIncomeCategories" @click="debouncedUpdateChart(null, 'income')" class="flex-1 flex justify-center items-center z-10 text-xs font-bold transition-colors duration-300 text-nowrap"
                    :class="chartViewMode === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'">
                    ➕ {{ translate('Income') }}
                </div>
            </div>
            <div class="relative w-full mx-auto pb-2" :class="isPrinting ? 'h-[250px] max-w-[250px]' : 'h-[300px] md:h-[400px]'">
                <canvas id="expenseChart" class="z-10"></canvas>
            </div>
            <div class="w-full flex flex-col" :class="isPrinting ? 'overflow-visible h-auto max-h-none' : 'overflow-y-auto ' + (customLegendItems.length > 9 ? 'h-100' : '')">

                <div
                    v-for="item in customLegendItems"
                    :key="item.index"
                    @click="toggleLegend(item.index)"
                    class="flex items-center justify-between rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                    :class="{'opacity-40 grayscale': item.hidden}"
                >
                    <div class="flex items-center space-x-3 overflow-hidden w-full">
                        <span
                            class="w-4 h-4 rounded-full flex-shrink-0"
                            :style="{backgroundColor: item.color}"
                        ></span>

                        <span
                            class="flex items-center gap-2 w-full truncate"
                            :class="{ 'line-through opacity-50': item.hidden }"
                            :data-tooltip="item.text"
                        >
                            <span class="text-gray-700 dark:text-gray-200 font-medium truncate">{{ item.text }}</span>

                            <span class="text-xs bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 px-1.5 py-0.5 rounded-md font-normal flex-shrink-0 shadow-sm">
                                {{ item.count }} {{ translate('Items') }}
                            </span>
                        </span>
                    </div>
                    <div v-if="item.budget > 0" class="w-full bg-gray-200 dark:bg-gray-600 h-1.5 rounded-full mt-2 overflow-hidden flex">
                        <div class="h-full rounded-full transition-all duration-500"
                            :class="[
                                Math.abs(item.value) > item.budget ? 'bg-red-500' : 'bg-emerald-500',
                                item.isFallback ? 'bg-[length:10px_10px] bg-[linear-gradient(45deg,rgba(255,255,255,.15)25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)50%,rgba(255,255,255,.15)75%,transparent_75%,transparent)]' : ''
                            ]"
                            :style="{
                                width: item.budget > 0 ? Math.min((Math.abs(item.value) / item.budget) * 100, 100) + '%' : (Math.abs(item.value) > 0 ? '100%' : '0%')
                            }"
                            :data-tooltip="item.budget > 0 ? item.budget.toLocaleString() +' ('+ ((Math.abs(item.value) / item.budget) * 100).toFixed(1) + '%)' : translate('Over!')">
                        </div>

                    </div>
                    <div class="text-right pl-4">
                        <div class="text-gray-900 dark:text-white font-bold tracking-tight text-nowrap" :data-tooltip="item.value.toLocaleString()">
                            {{ formatNumber(item.value) }}
                            <span v-if="item.budget" class="text-xs text-gray-400 font-normal ml-1">/ {{ formatNumber(item.budget) }}</span>
                        </div>
                        <div class="text-xs text-gray-400 dark:text-gray-500 font-medium">
                            {{ item.percentage }}%
                        </div>
                    </div>
                </div>
            </div>

        </div>
        <div v-if="!isPrinting" class="w-full flex flex-col sm:w-auto sm:flex-row justify-center items-center mx-auto bg-gray-50 dark:bg-gray-700/30 p-3 sm:py-2 sm:px-4 rounded-lg text-sm border border-gray-100 dark:border-gray-700 gap-3 ">

            <div class="flex items-center justify-between w-full sm:w-auto sm:border-r border-gray-200 dark:border-gray-600 sm:pr-4">
                <span class="text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">🏷️ {{ translate('Label') }}:</span>
                <select v-model="selectedChartCatColId" class="ml-3 w-full sm:w-auto bg-white dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded px-2 py-1 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-gray-700">
                    <option v-for="col in columns.filter(c => ['text', 'category'].includes(c.type))" :key="col.id" :value="col.id">
                        {{ col.label }}
                    </option>
                </select>
            </div>

            <div v-if="hasDateColumn" class="flex items-center justify-between w-full sm:w-auto sm:border-r border-gray-200 dark:border-gray-600 sm:px-4">
                <span class="text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">📈 {{ translate('Timeline') }}:</span>
                <select v-model="selectedChartDateColId" class="ml-3 w-full sm:w-auto bg-white dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded px-2 py-1 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-gray-700">
                    <option value="">{{ translate('None') }}</option>
                    <option v-for="col in columns.filter(c => c.type === 'date')" :key="col.id" :value="col.id">
                        {{ col.label }}
                    </option>
                </select>
            </div>

            <div class="flex items-center justify-between w-full sm:w-auto sm:pl-4">
                <span class="text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">💰 {{ translate('Value') }}:</span>
                <select v-model="selectedChartNumColId" class="ml-3 w-full sm:w-auto bg-white dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded px-2 py-1 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-gray-700">
                    <option v-for="col in columns.filter(c => isNumericType(c.type))" :key="col.id" :value="col.id">
                        {{ col.label }}
                    </option>
                </select>
            </div>

            <div class="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg relative w-48 cursor-pointer select-none mx-auto sm:mx-0 shadow-inner" v-if="hasDateColumn">
                <div class="absolute top-1 bottom-1 left-1 w-[calc(33.333%-2.67px)] bg-white dark:bg-gray-600 rounded-md shadow transition-transform duration-300 ease-out"
                    :class="trendChartType === 'bar' ? 'translate-x-0' : (trendChartType === 'line' ? 'translate-x-full' : 'translate-x-[200%]')"></div>

                <div @click="toggleTrendChartType('bar')" class="flex-1 flex justify-center items-center z-10 text-xs font-bold transition-colors duration-300 text-nowrap"
                    :class="trendChartType === 'bar' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'">📊 {{ translate('Bar') }}</div>
                <div @click="toggleTrendChartType('line')" class="flex-1 flex justify-center items-center z-10 text-xs font-bold transition-colors duration-300 text-nowrap"
                    :class="trendChartType === 'line' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'">📈 {{ translate('Line') }}</div>
                <div @click="toggleTrendChartType('total')" class="flex-1 flex justify-center items-center z-10 text-xs font-bold transition-colors duration-300 text-nowrap"
                    :class="trendChartType === 'total' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'">∑ {{ translate('Total') }}</div>
            </div>
            <div class="flex justify-end ml-2 space-x-1 text-nowrap" v-if="hasDateColumn">
                <button @click="debouncedUpdateChart('day')"
                        :class="timeUnit === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                        class="px-3 py-1 text-xs rounded-md transition-colors">
                    {{ translate('Daily') }}
                </button>
                <button @click="debouncedUpdateChart('week')"
                        :class="timeUnit === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                        class="px-3 py-1 text-xs rounded-md transition-colors">
                    {{ translate('Weekly') }}
                </button>
                <button v-if="monthFilters.length > 1" @click="debouncedUpdateChart('month')"
                        :class="timeUnit === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                        class="px-3 py-1 text-xs rounded-md transition-colors">
                    {{ translate('Monthly') }}
                </button>
                <button v-if="monthFilters.length > 3" @click="debouncedUpdateChart('quarter')"
                        :class="timeUnit === 'quarter' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                        class="px-3 py-1 text-xs rounded-md transition-colors">
                    {{ translate('Quarterly') }}
                </button>
                <button v-if="monthFilters.length > 5" @click="debouncedUpdateChart('halfyear')"
                        :class="timeUnit === 'halfyear' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                        class="px-3 py-1 text-xs rounded-md transition-colors">
                    {{ translate('Half-Yearly') }}
                </button>
                <button v-if="yearFilters.length > 1" @click="debouncedUpdateChart('year')"
                        :class="timeUnit === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                        class="px-3 py-1 text-xs rounded-md transition-colors">
                    {{ translate('Yearly') }}
                </button>
            </div>
        </div>
        <div v-show="selectedChartDateColId && hasTrendData" class="w-full bg-white dark:bg-gray-800 p-6 print:p-2 print:shadow-none print:border-none rounded-xl border border-gray-50 dark:border-gray-700 shadow-sm mt-2 print:break-inside-avoid">
            <h4 class="text-gray-500 dark:text-gray-400 text-sm font-bold mb-4 print:mb-2 flex items-center">📈 {{ translate('Trend') }}</h4>
            <div class="relative w-full h-64 print:h-[180px] print:w-[100%] print:mx-auto">
                <canvas id="trendChart" class="print:!max-h-[180px] print:!max-w-full print:!w-full"></canvas>
            </div>
        </div>
        <div v-show="selectedChartDateColId && hasTrendData" class="bg-white dark:bg-gray-800 py-4 mx-[-40px] px-0 xl:px-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 mt-2 overflow-x-auto print:overflow-visible print:mx-0 print:px-0 print:shadow-none print:border-none" ref="heatmapScrollContainer">
            <div class="relative mx-auto w-[1080px] print:!w-full print:mx-0">
                <canvas ref="heatmapCanvas"></canvas>
            </div>
        </div>
    </div>
</div>

<h3 v-if="isPrinting" class="font-bold text-center">{{ currentStorageKey }}</h3>

<div ref="tableContainer"
        @scroll="handleTableScroll"
        :style="!isPrinting && lockedTableMinHeight ? { minHeight: lockedTableMinHeight + 'px' } : undefined"
        class="[overflow-anchor:none] mb-2 border-none sm:border border-gray-300 dark:border-gray-700 sm:rounded shadow-none sm:shadow-sm bg-gray-50 dark:bg-gray-800/50 sm:bg-transparent dark:sm:bg-transparent transition-colors duration-300 max-h-[80vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overflow-y-auto overflow-x-hidden sm:overflow-x-auto print:overflow-visible print:block print:h-auto print:max-h-none"
    >
    <table :key="currentStorageKey" class="w-full min-w-full border-collapse relative print:w-full block sm:table print:table" @click="openGlobalMenu">
        <thead class="hidden sm:table-header-group print:table-header-group bg-gray-100 dark:bg-gray-700 print:bg-gray-100 transition-colors">
            <tr class="print:break-inside-avoid">
                <th class="sticky top-0 left-0 z-20 print:static bg-gray-200 dark:bg-gray-800 print:bg-gray-100 border border-gray-300 dark:border-gray-600 px-4 py-2 w-20 text-center text-gray-600 dark:text-gray-300 font-semibold shadow-[2px_0_4px_rgba(0,0,0,0.05)] print:shadow-none print:w-12" :data-tooltip="translate('Total')">#<span v-if="!isPrinting">{{ filteredRows.length }}</span></th>
                <th v-for="(col, index) in columns" :key="col.id" :data-col-index="index" class="group pr-8 sticky top-0 z-20 print:static border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-nowrap font-semibold cursor-grab transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 print:text-black print:min-w-0 print:bg-gray-100 select-none [-webkit-touch-callout:none] md:touch-none landscape:touch-none active:scale-[0.98] active:bg-gray-200 dark:active:bg-gray-600 active:shadow-inner active:cursor-grabbing"
                    :class="[['number', 'date', 'time', 'multiply', 'multiply3', 'minus', 'add', 'divide', 'category', 'photo', 'checkbox', 'color'].includes(col.type) ? 'max-w-[70px]' : 'min-w-[140px]',
                        editingColId === col.id ? 'cursor-text active:cursor-text' : ''
                    ]" @pointerdown.stop.prevent="startDragging('columns', index, $event)">

                    <span v-if="!isPrinting" class="text-gray-400 dark:text-gray-500 mr-1 text-xs select-none active:scale-90 active:bg-gray-200 dark:active:bg-gray-600 active:rounded transition-all cursor-grab active:cursor-grabbing">⋮</span>

                    <span v-if="editingColId !== col.id"
                        @click="startEditingCol(col.id)"
                        class="cursor-pointer border border-transparent hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        :data-tooltip="col.label">
                        {{ col.label }}
                    </span>

                    <input v-else
                        :id="'edit-col-' + col.id"
                        v-model="col.label"
                        type="text"
                        @blur="stopEditingCol"
                        @keyup.enter="stopEditingCol"
                        class="w-24 px-1 py-0.5 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 border border-blue-400 dark:border-blue-500 rounded outline-none shadow-inner"
                    >

                    <span v-if="!isPrinting" class="text-xs font-normal ml-1 select-none whitespace-nowrap" :class="isCalcType(col.type) ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'">({{ getColumnTypeLabel(col.type) }})</span>

                    <button v-if="!isPrinting" @click="removeColumn(col.id)" class="absolute top-1/2 -translate-y-1/2 right-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-100 [@media(any-hover:hover)]:opacity-0 [@media(any-hover:hover)]:group-hover:opacity-100 transition-opacity p-1" :data-tooltip="translate('Remove column')">✖</button>
                </th>
                <th v-if="!isPrinting" class="sticky top-0 z-10 print:static bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-4 py-2 w-px text-center whitespace-nowrap text-gray-600 dark:text-gray-300 font-semibold">{{ translate('Action') }}</th>
            </tr>
        </thead>

        <tbody v-if="!isPrinting" key="spacer-top" class="block sm:table-row-group print:hidden">
            <tr>
                <td :colspan="columns.length + 2" class="p-0 border-none m-0">
                    <div :style="{ height: paddingTop + 'px' }"></div>
                </td>
            </tr>
        </tbody>

        <tbody v-for="(row, index) in visibleRows"
            :key="'data-' + currentStorageKey + '-' + row.id + '-' + (windowStart + index)"
            :ref="(el) => observeRow(el, row.id)"
            class="block sm:table-row-group print:table-row-group mb-4 sm:mb-0 print:mb-0 bg-white dark:bg-gray-800 sm:bg-transparent dark:sm:bg-transparent print:bg-transparent rounded-lg shadow-sm sm:shadow-none print:shadow-none border border-gray-200 dark:border-gray-700 sm:border-none print:border-none relative select-none print:break-inside-avoid">
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 print:hover:bg-transparent transition-colors group block sm:table-row print:table-row relative" :data-id="row.id">

                <td class="text-nowrap left-0 z-10 print:static bg-gray-100 sm:bg-gray-50 dark:bg-gray-700 dark:sm:bg-gray-800 print:bg-transparent border-b sm:border print:border border-gray-200 sm:border-gray-300 dark:border-gray-700 px-4 sm:px-2 py-2 sm:text-center print:text-center text-gray-600 sm:text-gray-500 dark:text-gray-300 font-bold sm:font-medium shadow-none sm:shadow-[2px_0_4px_rgba(0,0,0,0.02)] print:shadow-none cursor-grab sm:active:scale-90 sm:active:bg-gray-200 sm:dark:active:bg-gray-600 sm:active:rounded sm:active:cursor-grabbing transition-all print:cursor-auto select-none [-webkit-touch-callout:none] md:touch-none landscape:touch-none block sm:table-cell print:table-cell rounded-t-lg sm:rounded-none"
                    @pointerdown="startDragging('rows', row.id, $event)">

                    <span v-if="!isPrinting" class="text-gray-400 dark:text-gray-500 mr-2 sm:mr-1 text-xs">⋮</span>
                    <span v-if="!isPrinting" class="sm:hidden mr-1 text-gray-400 dark:text-gray-500 text-nowrap">#</span>{{ (isPrinting ? 0 : windowStart) + index + 1 }}
                </td>

                <td v-for="(col, colIndex) in columns" :key="col.id"
                    @mousedown="handleMouseDown(windowStart + index, colIndex, $event)"
                    @mouseenter="handleMouseEnter(windowStart + index, colIndex)"
                    v-bind="getSelectionStyles(windowStart + index, colIndex)"
                    class="cursor-cell group/cell border-b sm:border print:border border-gray-100 sm:border-gray-300 dark:border-gray-700 px-4 sm:px-0 bg-white dark:bg-gray-800 print:bg-transparent group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50 print:group-hover:bg-transparent transition-colors flex items-center justify-between sm:table-cell print:table-cell last:border-b-0 sm:last:border-b print:last:border-b">

                    <label v-if="!isPrinting"
                        @click.stop="openGlobalMenu($event, row, col)"
                        class="sm:hidden text-gray-500 dark:text-gray-400 font-bold text-sm mr-4 whitespace-nowrap flex-shrink-0 transition-colors"
                        :class="{'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400': col.type === 'category'}"
                    >
                        {{ col.label }}
                        <span v-if="['category', 'number'].includes(col.type)" class="text-xs ml-1 opacity-50">▼</span>
                    </label>

                    <div v-if="col.type === 'checkbox'" class="flex items-center justify-end sm:justify-center print:justify-center w-full py-1">
                        <input v-if="!isPrinting"
                            :ref="(el) => { if (el) inputRefs[`${row.id}-${col.id}`] = el; else delete inputRefs[`${row.id}-${col.id}`] }"
                            type="checkbox"
                            v-model="row[col.id]"
                            @keydown="focusNextInput($event, row.id, col.id)"
                            @change="onDataEdited('rows')"
                            class="w-6 h-6 sm:w-5 sm:h-5 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 cursor-pointer transition-all active:scale-90"
                        >
                        <span class="hidden print:inline-block text-xl leading-none text-gray-800">
                            {{ row[col.id] ? '☑' : '☐' }}
                        </span>
                    </div>

                    <div v-else-if="isCalcType(col.type)"
                        class="w-auto sm:w-full print:w-full p-2 mr-6 print:text-black print:bg-transparent rounded text-right sm:text-right print:text-right text-base print:py-0 print:px-0 print:text-sm print:!text-center"
                        :class="col.type === 'minus' ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-900/30' : (col.type === 'divide' ? 'text-violet-700 dark:text-violet-300 font-semibold bg-violet-50/50 dark:bg-violet-900/30' : 'text-blue-700 dark:text-blue-300 font-semibold bg-blue-50/50 dark:bg-blue-900/30')"
                        :data-tooltip="getRowNumericValue(row, col).toLocaleString()"
                        @click="speakFeedback($event.target.innerText)">
                        {{ formatNumber(getRowNumericValue(row, col)) }}
                    </div>
                    <div v-else-if="col.type === 'rating'" class="flex items-center justify-end sm:justify-center print:justify-center w-full py-1 px-1 gap-0.5 select-none">
                        <template v-if="isPrinting">
                            <span class="text-sm text-gray-800">{{ '★'.repeat(Math.min(5, Math.max(0, Math.round(Number(row[col.id]) || 0)))) + '☆'.repeat(5 - Math.min(5, Math.max(0, Math.round(Number(row[col.id]) || 0)))) }}</span>
                        </template>
                        <template v-else>
                            <button
                                v-for="star in 5"
                                :key="star"
                                type="button"
                                @click.stop="setRating(row, col.id, star)"
                                class="text-xl sm:text-lg leading-none transition-transform active:scale-90 hover:scale-110 focus:outline-none"
                                :class="star <= (Number(row[col.id]) || 0) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'"
                                :title="`${star} / 5`"
                            >★</button>
                        </template>
                    </div>
                    <div v-else-if="col.type === 'progress'" class="flex items-center justify-end sm:justify-start print:justify-center w-full gap-2 px-2 py-1">
                        <template v-if="isPrinting">
                            <span class="text-sm font-medium text-gray-800">{{ clampProgress(row[col.id]) }}%</span>
                        </template>
                        <template v-else>
                            <div class="relative flex-1 min-w-[72px] h-5 flex items-center">
                                <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div class="h-full transition-all duration-150 rounded-full"
                                        :class="getProgressBarColor(clampProgress(row[col.id]))"
                                        :style="{ width: clampProgress(row[col.id]) + '%' }"></div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    :value="clampProgress(row[col.id])"
                                    @input="row[col.id] = clampProgress($event.target.value)"
                                    @change="onDataEdited('rows')"
                                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                >
                            </div>
                            <span class="text-xs font-bold tabular-nums w-9 text-right shrink-0" :class="clampProgress(row[col.id]) === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'">
                                {{ clampProgress(row[col.id]) }}%
                            </span>
                        </template>
                    </div>
                    <div v-else-if="col.type === 'tags'" class="flex flex-wrap items-center justify-end sm:justify-start print:justify-start w-full gap-1 px-1.5 py-1 min-h-[36px]">
                        <template v-if="isPrinting">
                            <span class="text-sm text-gray-800">{{ normalizeTags(row[col.id]).join(', ') }}</span>
                        </template>
                        <template v-else>
                            <span
                                v-for="(tag, tIdx) in normalizeTags(row[col.id])"
                                :key="tIdx"
                                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/60 max-w-full"
                            >
                                <span class="truncate">{{ tag }}</span>
                                <button type="button" tabindex="-1" @click.stop="removeTagFromRow(row, col.id, tIdx)" class="text-indigo-400 hover:text-red-500 leading-none">×</button>
                            </span>
                            <input
                                :ref="(el) => { if (el) inputRefs[`${row.id}-${col.id}`] = el; else delete inputRefs[`${row.id}-${col.id}`] }"
                                v-model="tagDrafts[`${row.id}-${col.id}`]"
                                type="text"
                                :placeholder="'+ ' + translate('Tags')"
                                class="min-w-[56px] flex-1 bg-transparent outline-none text-sm text-right sm:text-left text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 py-0.5"
                                @keydown.enter.prevent="addTagToRow(row, col.id)"
                                @keydown.comma.prevent="addTagToRow(row, col.id)"
                                @keydown.backspace="handleTagBackspace($event, row, col.id)"
                                @blur="addTagToRow(row, col.id)"
                            >
                        </template>
                    </div>
                    <div v-else-if="col.type === 'color'" class="flex items-center justify-end sm:justify-start print:justify-center w-full gap-1.5 px-1.5 py-1">
                        <span
                            class="inline-block w-5 h-5 rounded border border-gray-300 dark:border-gray-600 shrink-0 relative overflow-hidden shadow-sm"
                            :style="{ backgroundColor: isValidHexColor(row[col.id]) ? row[col.id] : '#3b82f6' }"
                        >
                            <input
                                v-if="!isPrinting"
                                type="color"
                                :value="isValidHexColor(row[col.id]) ? row[col.id] : '#3b82f6'"
                                @input="row[col.id] = $event.target.value"
                                @change="onDataEdited('rows')"
                                class="absolute -top-2 -left-2 w-10 h-10 opacity-0 cursor-pointer"
                            >
                        </span>
                        <span v-if="isPrinting" class="text-xs font-mono text-gray-800">{{ row[col.id] || '' }}</span>
                        <input
                            v-else
                            :ref="(el) => { if (el) inputRefs[`${row.id}-${col.id}`] = el; else delete inputRefs[`${row.id}-${col.id}`] }"
                            v-model="row[col.id]"
                            type="text"
                            placeholder="#3b82f6"
                            spellcheck="false"
                            class="w-20 min-w-0 bg-transparent outline-none text-xs font-mono text-gray-700 dark:text-gray-200 placeholder-gray-400"
                            @change="onDataEdited('rows')"
                            @keydown="focusNextInput($event, row.id, col.id)"
                        >
                    </div>
                    <div v-else-if="col.type === 'photo'" class="flex items-center sm:justify-center print:justify-start w-full gap-2 overflow-x-auto max-w-full" :class="{'justify-end': !row[col.id]?.length}">

                        <template v-if="row[col.id]?.length">

                            <div v-for="(imgSrc, idx) in row[col.id]" :key="idx" class="relative group/photo inline-block shrink-0">
                                <img :src="imgSrc" @click="viewPhoto(row[col.id], idx)" class="h-10 object-cover rounded border border-gray-200 dark:border-gray-600 cursor-pointer shadow-sm active:scale-95 transition-transform" alt="" />
                                <button v-if="!isPrinting" @click.stop="removePhoto(row, col.id, idx)" class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-100 sm:opacity-0 group-hover/photo:opacity-100 transition-opacity shadow z-10">✖</button>
                            </div>

                            <button v-if="!isPrinting" @click="triggerPhotoUpload(row, col.id)" class="shrink-0 w-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border border-dashed border-gray-300 dark:border-gray-500 rounded text-gray-400 hover:text-indigo-500 transition-colors active:scale-95">
                                ➕
                            </button>
                        </template>

                        <template v-else>
                            <button v-if="!isPrinting" @click="triggerPhotoUpload(row, col.id)" class="px-3 py-1.5 sm:py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700/50 rounded-md text-sm transition-colors flex items-center gap-1 shadow-sm active:scale-95 shrink-0">
                                📷 <span class="hidden sm:inline">{{ translate('Photo') }}</span>
                            </button>
                        </template>
                    </div>

                    <div v-else class="flex items-center w-full h-full relative justify-end sm:justify-start print:justify-start">
                        <template v-if="!isPrinting && col.type === 'category' && col.id === mainCatColId && rowRunningBudgetMap.has(row)">
                            <div class="absolute left-0 top-0 h-full transition-all duration-500 ease-out opacity-20 dark:opacity-30 rounded pointer-events-none"
                                :class="[
                                    rowRunningBudgetMap.get(row).isOver ? 'bg-red-500' : '',
                                    rowRunningBudgetMap.get(row).isFallback ? 'bg-[length:20px_20px] bg-[linear-gradient(45deg,rgba(255,255,255,.15)25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)50%,rgba(255,255,255,.15)75%,transparent_75%,transparent)]' : ''
                                ]"
                                :style="{
                                    width: rowRunningBudgetMap.get(row).percentage + '%',
                                    backgroundColor: rowRunningBudgetMap.get(row).isOver ? undefined : rowRunningBudgetMap.get(row).color
                                }"></div>

                            <span class="absolute left-2 sm:left-auto right-auto sm:right-6 z-10 text-xs font-bold pointer-events-none"
                                :class="rowRunningBudgetMap.get(row).isOver ? 'text-red-600 dark:text-red-400' : 'text-gray-500'">
                                {{ rowRunningBudgetMap.get(row).displayString }}
                            </span>
                        </template>

                        <span v-if="isPrinting" class="w-full text-right sm:text-left text-gray-800 text-sm whitespace-pre-wrap print:!text-center">
                            {{ col.type === 'password' ? (row[col.id] ? '••••••••' : '') : row[col.id] }}{{ col.type === 'date' && row[col.id] ? getWeekdayStr(row[col.id]) : '' }}
                        </span>

                        <template v-else>
                            <div class="relative w-full flex items-center justify-end sm:justify-start print:!text-center">
                                <input
                                    :ref="(el) => { if (el) inputRefs[`${row.id}-${col.id}`] = el; else delete inputRefs[`${row.id}-${col.id}`] }"
                                    v-model="row[col.id]"
                                    :type="['date', 'time', 'url', 'tel', 'email'].includes(col.type) ? col.type : 'text'"
                                    :inputmode="(isScannerOpen && 'none') || (col.type === 'number' && 'decimal') || (col.type === 'tel' && 'tel') || (col.type === 'email' && 'email') || (col.type === 'url' && 'url') || undefined"
                                    :autocomplete="col.type === 'password' ? 'off' : undefined"
                                    :spellcheck="['password', 'url', 'email'].includes(col.type) ? false : undefined"
                                    :data-tooltip="col.type === 'password' ? '' : row[col.id]"
                                    :placeholder="col.type === 'number' ? '0' : (col.type === 'url' ? 'https://...' : (col.type === 'email' ? 'name@example.com' : (col.type === 'tel' ? '0912-345-678' : '...')))"
                                    class="peer relative z-10 w-full text-right bg-transparent focus:border-blue-500 outline-none px-1 py-2 sm:py-0 text-base print:py-0 print:text-sm"
                                    :class="{
                                        'text-gray-700 dark:text-gray-300 cursor-pointer': ['date', 'time'].includes(col.type),
                                        'text-blue-700 dark:text-blue-400 font-medium': col.type === 'category',
                                        'text-indigo-600 dark:text-indigo-400 underline decoration-indigo-300 dark:decoration-indigo-700': col.type === 'url' && row[col.id],
                                        'border-gray-300 dark:border-gray-600 transition-colors text-transparent focus:text-gray-800 dark:focus:text-white caret-blue-500': !isKeyboardOpen && col.type === 'number',
                                        'min-w-0 sm:text-left print:text-left truncate text-gray-800 dark:text-white dark:placeholder-gray-500': isKeyboardOpen || col.type !== 'number',
                                        'pr-8 sm:pr-0 sm:pl-10': col.type === 'date' && row[col.id],
                                        'pr-6': (col.type === 'url' && getSafeUrl(row[col.id])) || (col.type === 'tel' && getSafeTel(row[col.id])) || (col.type === 'email' && getSafeEmail(row[col.id])),
                                        '[&:not(:focus)]:[-webkit-text-security:disc]': col.type === 'password'
                                    }"
                                    @paste="handlePaste($event, windowStart + index, col.id)"
                                    @input="formatNumberInput(row, col)"
                                    @click.stop="enterInput(row, col, $event)"
                                    @focus="openGlobalMenu($event, row, col)"
                                    @blur="saveInput(row, col)"
                                    @keydown="focusNextInput($event, row.id, col.id)"
                                >
                                <span v-if="!isKeyboardOpen && col.type === 'number'" class="absolute z-0 px-1 right-0 text-gray-800 dark:text-gray-200 pointer-events-none transition-opacity duration-150 peer-focus:opacity-0">
                                    {{ toLocaleString(row[col.id]) }}
                                </span>
                                <span v-if="col.type === 'date' && row[col.id]"
                                    class="absolute z-0 text-gray-400 dark:text-gray-500 text-sm pointer-events-none select-none right-1 sm:right-auto sm:left-1">
                                    {{ getWeekdayStr(row[col.id]) }}
                                </span>
                            </div>
                            <a v-if="!isPrinting && col.type === 'url' && getSafeUrl(row[col.id])"
                                :href="getSafeUrl(row[col.id])"
                                target="_blank"
                                rel="noopener noreferrer"
                                tabindex="-1"
                                @click.stop
                                class="sm:absolute sm:right-6 shrink-0 flex items-center justify-center p-1 text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 z-10"
                                :data-tooltip="translate('Open Link')"
                            >🔗</a>
                            <a v-else-if="!isPrinting && col.type === 'tel' && getSafeTel(row[col.id])"
                                :href="getSafeTel(row[col.id])"
                                tabindex="-1"
                                @click.stop
                                class="sm:absolute sm:right-0 shrink-0 flex items-center justify-center p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 z-10"
                                :data-tooltip="translate('Phone')"
                            >📞</a>
                            <a v-else-if="!isPrinting && col.type === 'email' && getSafeEmail(row[col.id])"
                                :href="getSafeEmail(row[col.id])"
                                tabindex="-1"
                                @click.stop
                                class="sm:absolute sm:right-0 shrink-0 flex items-center justify-center p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 z-10"
                                :data-tooltip="translate('Email')"
                            >✉️</a>
                            <button v-if="!isPrinting && !['number', 'date', 'time', 'tel', 'email'].includes(col.type)"
                                tabindex="-1"
                                @click.stop="scanningTarget = { row, col }"
                                class="sm:absolute opacity-100 sm:opacity-0 group-hover/cell:opacity-100 focus-within:opacity-100 transition-opacity shrink-0 flex z-10 [@media(pointer:coarse)_and_(orientation:landscape)]:hidden"
                                :class="{'sm:right-0': ['category', 'text', 'password', 'url'].includes(col.type)}"
                            >
                                <span class="icon-mask icon-camera w-5 h-5 bg-current block"></span>
                            </button>
                            <div v-if="!isPrinting && col.type === 'number'" class="sm:absolute justify-center items-center opacity-100 sm:opacity-0 group-hover/cell:opacity-100 focus-within:opacity-100 transition-opacity shrink-0 flex z-10">
                                <div class="flex sm:flex-col border border-gray-200 dark:border-gray-600 rounded overflow-hidden shadow-sm">
                                <button tabindex="-1" @click="adjustNumber(row, col.id, 1)" class="order-2 sm:order-1 w-7 h-7 sm:w-6 sm:h-6 flex top-0 right-0 items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded font-bold leading-none select-none shadow-sm focus:outline-none">+</button>
                                <button tabindex="-1" @click="adjustNumber(row, col.id, -1)" class="order-1 sm:order-2 w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded font-bold leading-none select-none shadow-sm focus:outline-none">−</button>
                                </div>
                            </div>

                        </template>
                    </div>
                </td>

                <td v-if="!isPrinting" class="absolute sm:relative top-1 sm:top-auto right-1 sm:right-auto sm:border border-gray-300 dark:border-gray-700 px-2 text-center bg-transparent sm:bg-white dark:sm:bg-gray-800 transition-colors block sm:table-cell">
                    <div class="flex items-center justify-center space-x-2">
                        <button
                            @click="toggleActionMenu($event, row)"
                            class="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 active:bg-indigo-100 dark:active:bg-gray-700 px-3 py-2 rounded transition-colors font-bold leading-none rotate-90 outline-none relative"
                            :class="{'text-indigo-600 dark:text-indigo-400': row.note && row.note.trim() !== '' && !row.isExpanded}"
                        >•••</button>
                    </div>

                </td>
            </tr>

            <tr v-if="(isPrinting && row.isExpanded && row.note) || (!isPrinting && row.isExpanded)" class="block sm:table-row print:table-row bg-blue-50/30 dark:bg-indigo-900/20 print:bg-transparent rounded-b-lg sm:rounded-none">
                <td class="hidden sm:table-cell print:table-cell left-0 z-10 print:static bg-blue-50/80 dark:bg-indigo-900/40 print:bg-transparent border sm:border print:border border-gray-300 dark:border-gray-700"><input type="text" v-model="row.label" @change="onDataEdited" @click="speakFeedback($event.target.value)" class="w-full min-w-0 text-right truncate bg-transparent outline-none focus:border-blue-500 p-2 text-base print:py-0 print:text-sm text-gray-800 dark:text-white dark:placeholder-gray-500"></td>
                <td :colspan="columns.length + 1" class="block sm:table-cell print:table-cell border-t sm:border print:border border-gray-200 sm:border-gray-300 dark:border-gray-700 px-4 py-3 sm:py-2 shadow-inner dark:shadow-none">
                    <div class="flex flex-col">
                        <div v-if="isPrinting" class="text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {{ row.note }}
                        </div>
                        <textarea
                            v-else
                            :id="'note-' + row.id"
                            v-model="row.note"
                            rows="1"
                            class="w-full border-gray-300 dark:border-gray-600 rounded p-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-base bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 [field-sizing:content]"
                            :placeholder="translate('Enter details here...')"
                            @input="autoHeight($event.target)"
                            @change="onDataEdited"
                            @click="speakFeedback($event.target.value)"
                        ></textarea>
                        <button
                            tabindex="-1"
                            @click.stop="scanningTarget = { row, col: {id: 'note'} }"
                            type="button"
                            class="absolute flex right-2 print:hidden [@media(pointer:coarse)_and_(orientation:landscape)]:hidden"
                        >
                            <span class="icon-mask icon-camera w-5 h-5 bg-current block"></span>
                        </button>
                    </div>
                </td>
            </tr>
        </tbody>

        <tbody v-if="!isPrinting" key="spacer-bottom" class="block sm:table-row-group print:hidden">
            <tr>
                <td :colspan="columns.length + 2" style="padding: 0; border: none; margin: 0;">
                    <div :style="{ height: paddingBottom + 'px' }"></div>
                </td>
            </tr>
        </tbody>

        <tbody v-if="!isPrinting" key="action-add-row" class="block sm:table-row-group">
            <tr class="flex sm:table-row bg-white dark:bg-gray-800 sm:bg-transparent dark:sm:bg-transparent border border-gray-200 dark:border-gray-700 sm:border-none rounded-lg sm:rounded-none overflow-hidden">
                <td @click="addRow" class="left-0 sm:border-0 border-gray-300 dark:border-gray-700 p-0 text-center cursor-pointer bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors group shadow-[2px_0_4px_rgba(0,0,0,0.02)] flex-shrink-0 flex items-center justify-center w-16 sm:w-auto">
                    <button class="w-full h-full min-h-[50px] sm:min-h-[40px] flex items-center justify-center focus:outline-none outline-none">
                        <span class="text-green-600 dark:text-green-500 font-bold text-2xl sm:text-xl group-hover:scale-125 transition-transform">+</span>
                    </button>
                </td>
                <td :colspan="columns.length + 1" class="border-l sm:border-l-0 border-gray-200 sm:border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-0 flex-grow flex items-center sm:table-cell">
                    <button @click="addRow" class="w-full h-full min-h-[50px] sm:min-h-[40px] text-left pl-4 focus:outline-none outline-none">
                        <span class="text-base sm:text-sm text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors">← {{ translate('Click to add a row') }}</span>
                    </button>
                </td>
            </tr>
        </tbody>
        <tfoot class="hidden print:table-row-group border border-gray-800 bg-gray-100">
            <tr>
                <td class="px-4 py-2 font-bold text-center text-gray-800 border border-gray-300">{{ translate('Total') }}</td>
                <td v-for="col in columns" :key="'print-total-' + col.id"
                    class="px-4 py-2 font-bold text-gray-800 border border-gray-300"
                    :class="isNumericType(col.type) ? 'text-right' : 'text-left'">
                    <span v-if="isNumericType(col.type)">
                        {{ formatNumber(columnTotals[col.id]) }}
                    </span>
                    <span v-else-if="col.type === 'checkbox'">
                        {{ `${columnTotals[col.id]} (${getCheckboxProgressPercent(columnTotals[col.id])}%)` || '0 / 0' }}
                    </span>
                    <span v-else-if="col.type === 'rating'">
                        {{ columnTotals[col.id] ? `${columnTotals[col.id]} ★` : '' }}
                    </span>
                    <span v-else-if="col.type === 'progress'">
                        {{ columnTotals[col.id] !== undefined ? `${columnTotals[col.id]}%` : '' }}
                    </span>
                    <span v-else class="text-sm text-gray-600 font-normal">
                        {{ columnFilters[col.id] || '' }}
                    </span>
                </td>
            </tr>
        </tfoot>
    </table>
    <Teleport to="body">
    <ul
        v-for="col in columns"
        v-show="activeRow?.col.id === col.id"
        :style="menuStyle"
        class="absolute w-full mt-1 bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-y-auto transform-gpu translate-z-0 z-50"
    >
        <li
            v-if="col.type === 'category'"
            v-for="(val, index) in getUniqueValues(col.id)"
            :key="val"
            @mousedown="selectOption(val)"
            @mouseover="activeDropdownIndex = index"
            class="text-right p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            :class="{
                'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold dropdown-active-item': activeDropdownIndex === index && activeRow?.col.id === col.id,
                'hover:bg-gray-100 dark:hover:bg-gray-700': activeDropdownIndex !== index
            }"
            >
            {{ val }}
        </li>
    </ul>
    </Teleport>
</div>
<div
    v-show="isKeyboardOpen"
    :style="menuStyle"
    class="sm:w-[40%] left-1/2 -translate-x-1/2 absolute w-full p-2 pb-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] transition-transform duration-300 bg-gray-200 dark:bg-gray-800 dark:shadow-[0_-4px_10px_rgba(0,0,0,0.5)] z-10"
>
    <div class="touch-manipulation grid grid-cols-4 gap-2 h-64">
        <button @click="clearAll" class="touch-manipulation rounded-lg text-xl font-medium transition-colors bg-red-100 text-red-600 active:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:active:bg-red-900/60">AC</button>
        <button @click="backspace" class="touch-manipulation rounded-lg text-xl transition-colors bg-gray-300 text-gray-700 active:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:active:bg-gray-600">⌫</button>
        <button @click="append('%')" class="touch-manipulation rounded-lg text-2xl transition-colors bg-indigo-100 text-indigo-600 active:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:active:bg-indigo-900/60">%</button>
        <button @click="append('/')" class="touch-manipulation rounded-lg text-2xl transition-colors bg-indigo-100 text-indigo-600 active:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:active:bg-indigo-900/60">÷</button>
        <button @click="append('7')" class="touch-manipulation rounded-lg text-2xl shadow-sm transition-colors bg-white text-gray-800 active:bg-gray-100 dark:bg-gray-600 dark:text-gray-100 dark:active:bg-gray-500">7</button>
        <button @click="append('8')" class="touch-manipulation rounded-lg text-2xl shadow-sm transition-colors bg-white text-gray-800 active:bg-gray-100 dark:bg-gray-600 dark:text-gray-100 dark:active:bg-gray-500">8</button>
        <button @click="append('9')" class="touch-manipulation rounded-lg text-2xl shadow-sm transition-colors bg-white text-gray-800 active:bg-gray-100 dark:bg-gray-600 dark:text-gray-100 dark:active:bg-gray-500">9</button>
        <button @click="append('*')" class="touch-manipulation rounded-lg text-2xl transition-colors bg-indigo-100 text-indigo-600 active:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:active:bg-indigo-900/60">×</button>
        <button @click="append('4')" class="touch-manipulation rounded-lg text-2xl shadow-sm transition-colors bg-white text-gray-800 active:bg-gray-100 dark:bg-gray-600 dark:text-gray-100 dark:active:bg-gray-500">4</button>
        <button @click="append('5')" class="touch-manipulation rounded-lg text-2xl shadow-sm transition-colors bg-white text-gray-800 active:bg-gray-100 dark:bg-gray-600 dark:text-gray-100 dark:active:bg-gray-500">5</button>
        <button @click="append('6')" class="touch-manipulation rounded-lg text-2xl shadow-sm transition-colors bg-white text-gray-800 active:bg-gray-100 dark:bg-gray-600 dark:text-gray-100 dark:active:bg-gray-500">6</button>
        <button @click="append('-')" class="touch-manipulation rounded-lg text-2xl transition-colors bg-indigo-100 text-indigo-600 active:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:active:bg-indigo-900/60">−</button>
        <button @click="append('1')" class="touch-manipulation rounded-lg text-2xl shadow-sm transition-colors bg-white text-gray-800 active:bg-gray-100 dark:bg-gray-600 dark:text-gray-100 dark:active:bg-gray-500">1</button>
        <button @click="append('2')" class="touch-manipulation rounded-lg text-2xl shadow-sm transition-colors bg-white text-gray-800 active:bg-gray-100 dark:bg-gray-600 dark:text-gray-100 dark:active:bg-gray-500">2</button>
        <button @click="append('3')" class="touch-manipulation rounded-lg text-2xl shadow-sm transition-colors bg-white text-gray-800 active:bg-gray-100 dark:bg-gray-600 dark:text-gray-100 dark:active:bg-gray-500">3</button>
        <button @click="append('+')" class="touch-manipulation rounded-lg text-2xl transition-colors bg-indigo-100 text-indigo-600 active:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 dark:active:bg-indigo-900/60">+</button>
        <button @click="append('0')" class="col-span-2 rounded-lg text-2xl shadow-sm transition-colors bg-white text-gray-800 active:bg-gray-100 dark:bg-gray-600 dark:text-gray-100 dark:active:bg-gray-500">0</button>
        <button @click="append('.')" class="touch-manipulation rounded-lg text-2xl shadow-sm transition-colors bg-white text-gray-800 active:bg-gray-100 dark:bg-gray-600 dark:text-gray-100 dark:active:bg-gray-500">.</button>
        <button @click="doCalc" class="touch-manipulation rounded-lg text-xl font-medium shadow-sm transition-colors bg-green-500 text-white active:bg-green-600 dark:bg-green-600 dark:active:bg-green-700">=</button>
    </div>
</div>
<div class="absolute" :style="menuStyle">
    <div
        v-if="activeMenuRow"
        @click="closeActionMenu"
        class="fixed inset-0 z-40 cursor-pointer"
        style="-webkit-tap-highlight-color: transparent"
    ></div>
    <div
        v-if="activeMenuRow"
        class="absolute right-2 w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-xl rounded-md z-[99] flex flex-col overflow-hidden transform origin-top-right"
    >
        <button @click="ExpandNote"
            :class="[
                activeMenuRow.isExpanded ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-gray-700' :
                activeMenuRow.note && activeMenuRow.note.trim() !== '' ? 'text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-sm' : 'text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
            ]"
            class="px-3 py-3 sm:py-2 text-base sm:text-sm text-left flex items-center transition-colors">📝 {{ activeMenuRow.note && activeMenuRow.note.trim() !== '' && !activeMenuRow.isExpanded ? translate('Note (*)') : translate('Note') }}</button>
        <button @click="addRow()" class="px-3 py-3 sm:py-2 text-base sm:text-sm text-gray-700 dark:text-gray-200 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors">➕ {{ translate('Add') }}</button><button @click="copyRow(0)" class="px-3 py-3 sm:py-2 text-base sm:text-sm text-gray-700 dark:text-gray-200 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors">📄 {{ translate('Copy') }}</button>
        <button v-if="hasDateColumn" @click="copyRow(1)" class="px-3 py-3 sm:py-2 text-base sm:text-sm text-gray-700 dark:text-gray-200 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors">📄 {{ translate('Copy (no date)') }}</button>
        <button @click="shareRow" class="px-3 py-3 sm:py-2 text-base sm:text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 text-left flex items-center transition-colors font-medium">🔗 {{ translate('Share') }}</button>
        <button @click="removeRow()" class="px-3 py-3 sm:py-2 text-base sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 text-left flex items-center transition-colors">✖ {{ translate('Delete') }}</button>
    </div>
</div>
<div v-if="scanningTarget" class="fixed bottom-0 left-0 z-50 w-full bg-white dark:bg-gray-900 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
    <div class="relative flex justify-center items-center pt-4 pb-2">
        <button @click="closeScanner" class="absolute right-4 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors bg-gray-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-gray-700 p-1.5 rounded-full focus:outline-none">✖</button>
    </div>
    <div class="px-0 py-2 flex flex-col">
        <div v-if="!isScannerOpen" class="w-full flex flex-col gap-1">
            <button
                v-for="option in scanModeOptions"
                :key="option.id"
                @click="selectedScanMode = option.id"
                class="flex items-center p-1 border-2 rounded-xl transition-all text-left group focus:outline-none"
                :class="selectedScanMode === option.id
                    ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/30'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-gray-500'"
            >
                <div class="flex-1">
                    <div class="font-bold transition-colors"
                        :class="selectedScanMode === option.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-200'">
                        {{ option.label }}
                    </div>
                    <div class="text-xs mt-0.5 transition-colors"
                        :class="selectedScanMode === option.id ? 'text-indigo-500/80 dark:text-indigo-300/80' : 'text-gray-500 dark:text-gray-400'">
                        {{ option.description }}
                    </div>
                </div>
                <div v-if="selectedScanMode === option.id" class="text-indigo-600 dark:text-indigo-400 shrink-0 ml-3">
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
                </div>
            </button>

            <div class="flex flex-col gap-3 mt-3">
                <button
                    @click="triggerQRFileUpload"
                    class="flex-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 py-3.5 rounded-xl font-bold shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all flex items-center justify-center gap-2 focus:outline-none"
                >🖼️</button>
                <button
                    @click="openScanner"
                    class="flex-[2] bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 focus:outline-none"
                >🚀</button>
            </div>
        </div>

        <div v-if="selectedScanMode === 'OCR_PLATE'" class="mt-4 border-2 border-red-500 p-2">
            <p class="text-red-500 text-xs">🔍 {{ translate('The final image sent by OCR to Tesseract') }}:</p>
            <img v-if="debugImageUrl" :src="debugImageUrl" class="w-full max-w-sm" />
        </div>
        <div v-if="isScannerOpen && selectedScanMode === 'OCR_PLATE'" class="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl mt-2 border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
            <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-gray-800 dark:text-gray-200">🤖 {{ translate('Edge AI Automatic Capture') }}</span>
                <span class="text-xs text-gray-500 hidden sm:inline">{{ translate('Aim at the target and hold for 1 second to automatically take a picture.') }}</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="isAutoScanEnabled" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
        </div>
        <div v-show="isScannerOpen" class="relative w-full h-[30vh] rounded-xl overflow-hidden bg-black shadow-inner border border-gray-200 dark:border-gray-700 mt-2">
            <div class="absolute top-1/2 left-0 w-full transform -translate-y-1/2">
                <div id="reader" class="w-full"></div>
            </div>

            <div v-if="selectedScanMode.startsWith('1D_')"
                class="absolute top-1/2 left-[10%] right-[10%] h-[2px] bg-red-500 shadow-[0_0_12px_4px_rgba(239,68,68,0.8)] z-50 pointer-events-none animate-pulse transform -translate-y-1/2">
            </div>
            <button
                v-if="selectedScanMode === 'OCR_PLATE'"
                @click="captureForOCR"
                :disabled="isProcessing"
                class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 text-indigo-600 dark:bg-gray-800/90 dark:text-indigo-400 px-6 py-3 rounded-full font-extrabold shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center justify-center gap-2 z-50 active:scale-95 transition-all backdrop-blur-sm border border-gray-200 dark:border-gray-600 disabled:opacity-50"
            >
                <span v-if="!isProcessing">📸 {{ translate('Photo recognition') }}</span>
                <span v-else>⏳ {{ translate('Recognition in progress...') }}</span>
            </button>
            <div
                v-if="isZoomSupported"
                class="absolute right-0 top-1/2 transform -translate-y-1/2 z-50 flex flex-col items-center gap-2 bg-black/40 backdrop-blur-sm p-2 rounded-full border border-white/20"
            >
                <span class="text-white text-[10px] font-bold">{{ maxZoom }}x</span>
                <div class="h-24 w-4 relative my-2 flex justify-center">
                    <input
                        type="range"
                        v-model.number="currentZoom"
                        :min="minZoom"
                        :max="maxZoom"
                        step="0.1"
                        class="w-24 h-1 absolute top-[45%] origin-center -rotate-90 appearance-none bg-gray-300 rounded-lg outline-none accent-indigo-500 cursor-ns-resize"
                    >
                </div>
                <span class="text-white text-[10px] font-bold">1x</span>
            </div>
        </div>
        <button
            v-if="isTorchSupported"
            @click="toggleTorch"
            type="button"
            class="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md shadow-lg transition-all duration-300 border"
            :class="isTorchOn ? 'bg-yellow-400 text-black border-yellow-300 shadow-yellow-500/50' : 'bg-black/50 text-white border-white/20'"
        >
            <span class="text-lg">{{ isTorchOn ? '💡' : '🔦' }}</span>
        </button>
    </div>
</div>

<div ref="filterContainer" @scroll="handleFilterScroll" @focusin="onFilterFocusIn" @focusout="onFilterFocusOut" class="font-semibold text-gray-700 dark:text-gray-200 print:hidden mt-4 sm:mt-0 bg-white dark:bg-gray-800 sm:bg-transparent dark:sm:bg-transparent rounded-lg border border-gray-200 dark:border-gray-700 sm:border-none shadow-sm sm:shadow-none p-2 sm:p-0 flex flex-col w-full overflow-x-auto">
    <div class="flex flex-col items-center sm:flex-row w-full print:flex-row">

        <div class="py-1 bg-gray-100 sm:bg-gray-200 dark:bg-gray-700 dark:sm:bg-gray-800 border-b sm:border-t-2 sm:border border-gray-200 sm:border-gray-300 dark:border-gray-600 text-left sm:text-center shadow-[2px_0_4px_rgba(0,0,0,0.05)] rounded-t-lg sm:rounded-none shrink-0 w-full sm:w-[var(--col-width)]"
            :style="{'--col-width': colWidths[0] ? colWidths[0] + 'px' : 'auto'}"
            :data-tooltip="filteredRows.length">
            {{ translate('Total') }}
        </div>

        <div v-for="(col, index) in columns" :key="'total-' + col.id"
            class="w-full sm:flex-none flex shrink-0 sm:w-[var(--col-width)] bottom-0 sm:border border-gray-100 sm:border-gray-300 dark:border-gray-600 bg-white sm:bg-gray-100 dark:bg-gray-800 items-center sm:items-start justify-between last:border-b-0 sm:last:border-b"
            :style="{'--col-width': colWidths[index + 1] ? colWidths[index + 1] + 'px' : 'auto'}"
            :class="[
                isCalcType(col.type) ? 'sm:justify-end' : 'sm:justify-start'
            ]">

            <span v-if="!isPrinting" class="sm:hidden text-gray-500 dark:text-gray-400 font-bold text-sm mr-4 whitespace-nowrap">{{ col.label }}</span>

            <div class="relative w-full" :class="{'text-right': isNumericType(col.type)}">

                <div v-if="isNumericType(col.type) && !isPrinting" class="relative text-blue-700 dark:text-blue-400 font-bold" :data-tooltip="(columnTotals[col.id] || 0).toLocaleString()">
                    <div v-if="dateRangeOpenState[col.id]"
                        @click.stop="toggleDateFilter($event, col.id, false)"
                        class="fixed inset-0 cursor-default"
                        style="-webkit-tap-highlight-color: transparent">
                    </div>
                    <div class="relative flex">
                        <input
                            type="text"
                            inputmode="decimal"
                            :value="(dateRangeOpenState[col.id] || (dateRangeFilters[col.id] && (dateRangeFilters[col.id].start !== '' || dateRangeFilters[col.id].end !== ''))) ? (dateRangeFilters[col.id]?.start || '') : formatNumber(columnTotals[col.id])"
                            @input="updateDateRange(col.id, 'start', $event.target.value)"
                            @focus="toggleDateFilter($event, col.id, true)"
                            @click.stop="toggleDateFilter($event, col.id, true)"
                            :placeholder="dateRangeOpenState[col.id] ? 'Min...' : ''"
                            class="sm:w-full text-sm px-2 py-1.5 bg-white dark:bg-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-right transition-colors shadow-inner pr-8 w-full"
                            :class="dateRangeFilters[col.id]?.start !== '' || dateRangeFilters[col.id]?.end !== '' ? 'text-gray-900 dark:text-white' : 'text-blue-700 dark:text-blue-400'"
                        >
                        <button
                            v-show="dateRangeFilters[col.id] && (dateRangeFilters[col.id].start !== '' || dateRangeFilters[col.id].end !== '')"
                            @click.stop="clearDateRange(col.id)"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-white dark:bg-gray-700 rounded-full"
                            :title="translate('Clear filter')"
                        >✖</button>
                    </div>
                    <Teleport to="body">
                    <div v-if="dateRangeOpenState[col.id]"
                        class="absolute top-full left-0 w-[160px] p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-2xl rounded-lg sm:rounded-none origin-top-left transition-all"
                        :style="menuStyle"
                    >
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400">
                                {{ translate('To') }}
                            </label>
                            <button
                                @click.stop="filterMatchMode[col.id] = (filterMatchMode[col.id] === 'range' ? 'exact' : 'range')"
                                class="text-[10px] px-1.5 py-0.5 rounded font-bold border transition-colors select-none whitespace-nowrap ml-2"
                                :class="filterMatchMode[col.id] === 'range' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'"
                            >
                                {{ filterMatchMode[col.id] === 'range' ? '≧ Min' : '＝ Exact' }}
                            </button>
                        </div>
                        <input
                            type="text"
                            inputmode="decimal"
                            :value="dateRangeFilters[col.id]?.end || ''"
                            @input="updateDateRange(col.id, 'end', $event.target.value)"
                            class="w-full text-sm px-2 py-1.5 bg-white dark:bg-gray-50 dark:bg-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700 dark:text-gray-200 transition-colors shadow-inner text-left"
                            :placeholder="translate('Max') +'...'"
                        >
                    </div>
                    </Teleport>
                </div>

                <div v-else-if="['text', 'category', 'url', 'tel', 'email', 'tags', 'color'].includes(col.type) && !isPrinting" class="relative flex">
                    <input
                        type="text"
                        enterkeyhint="search"
                        v-model="columnFilters[col.id]"
                        @click.stop="openGlobalMenu($event, null, col)"
                        :placeholder="'🔍 ' + translate('Filter...')"
                        class="sm:w-full w-full text-sm px-2 py-1.5 bg-white dark:bg-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors shadow-inner pr-8"
                    >
                    <button
                        tabindex="-1"
                        @click.stop="scanningTarget = { row: null, col }"
                        class="absolute opacity-100 group-hover/cell:opacity-100 focus-within:opacity-100 transition-opacity shrink-0 right-2 top-1/2 -translate-y-1/2 [@media(pointer:coarse)_and_(orientation:landscape)]:hidden"
                    >
                        <span class="icon-mask icon-camera w-5 h-5 bg-current block"></span>
                    </button>
                    <button
                        v-show="columnFilters[col.id]"
                        @click="clearFilter(col.id)"
                        class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        :title="translate('Clear filter')"
                    >✖</button>
                </div>

                <div v-else-if="['date', 'time'].includes(col.type) && !isPrinting" class="relative">
                    <div v-if="dateRangeOpenState[col.id]"
                        @click.stop="toggleDateFilter($event, col.id, false)"
                        class="fixed inset-0 cursor-default"
                        style="-webkit-tap-highlight-color: transparent">
                    </div>
                    <div class="relative">
                        <input
                            :type="col.type"
                            :value="dateRangeFilters[col.id]?.start || ''"
                            @input="updateDateRange(col.id, 'start', $event.target.value)"
                            @click.stop="toggleDateFilter($event, col.id, true)"
                            class="text-sm px-2 py-1.5 bg-white dark:bg-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700 dark:text-gray-200 transition-colors shadow-inner sm:w-full cursor-pointer"
                        >
                        <button
                            v-show="dateRangeFilters[col.id]?.start || dateRangeFilters[col.id]?.end"
                            @click.stop="clearDateRange(col.id)"
                            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-white dark:bg-gray-700 rounded-full"
                            :title="translate('Clear filter')"
                        >✖</button>
                    </div>
                    <Teleport to="body">
                    <div v-if="dateRangeOpenState[col.id]"
                        class="absolute top-full left-0 mt-2 w-[160px] p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-2xl rounded-lg sm:rounded-none origin-top-left transition-all"
                        :style="menuStyle"
                    >
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-xs font-bold text-gray-500 dark:text-gray-400">
                                {{ translate('To') }}
                            </label>
                            <button
                                @click.stop="filterMatchMode[col.id] = (filterMatchMode[col.id] === 'range' ? 'exact' : 'range')"
                                class="text-[10px] px-1.5 py-0.5 rounded font-bold border transition-colors select-none whitespace-nowrap ml-2"
                                :class="filterMatchMode[col.id] === 'range' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400'"
                            >
                                {{ filterMatchMode[col.id] === 'range' ? '≧ Min' : '＝ Exact' }}
                            </button>
                        </div>
                        <input
                            :type="col.type"
                            :min="dateRangeFilters[col.id]?.start || ''"
                            :value="dateRangeFilters[col.id]?.end || ''"
                            @input="updateDateRange(col.id, 'end', $event.target.value)"
                            class="w-full text-sm px-2 py-1.5 bg-gray-50 dark:bg-gray-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700 dark:text-gray-200 transition-colors shadow-inner cursor-pointer"
                        >
                    </div>
                    </Teleport>
                </div>

                <div v-else-if="col.type === 'photo' && !isPrinting" class="relative">
                    <select
                        v-model="columnFilters[col.id]"
                        class="w-full text-sm px-2 py-1.5 bg-white dark:bg-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-gray-700 dark:text-gray-200 transition-colors shadow-inner pr-8 cursor-pointer"
                    >
                        <option value="">{{ translate('All') }}</option>
                        <option value="has_photo">🖼️ {{ translate('Photo') }}</option>
                        <option value="no_photo">🚫 {{ translate('No Photo') }}</option>
                    </select>
                    <button
                        v-show="columnFilters[col.id]"
                        @click="clearFilter(col.id)"
                        class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-white dark:bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center"
                        :title="translate('Clear filter')"
                    >✖</button>
                </div>

                <div v-else-if="col.type === 'checkbox' && !isPrinting" class="relative w-full sm:w-auto"
                    :data-tooltip="`${columnTotals[col.id]} (${getCheckboxProgressPercent(columnTotals[col.id])}%)` || '0 / 0'">
                    <div class="relative w-full bg-white dark:bg-gray-700 overflow-hidden shadow-inner focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors">
                        <div class="absolute left-0 top-0 h-full transition-all duration-500 ease-out opacity-20 dark:opacity-30 pointer-events-none"
                            :class="getProgressBarColor(getCheckboxProgressPercent(columnTotals[col.id]))"
                            :style="{ width: getCheckboxProgressPercent(columnTotals[col.id]) + '%' }">
                        </div>
                        <select
                            v-model="columnFilters[col.id]"
                            class="relative w-full text-sm px-2 py-1.5 bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 cursor-pointer pr-8 appearance-none"
                        >
                            <option value="" class="bg-white dark:bg-gray-700">{{ translate('All') }}</option>
                            <option value="true" class="bg-white dark:bg-gray-700">✅ {{ translate('Checked') }}</option>
                            <option value="false" class="bg-white dark:bg-gray-700">⬜ {{ translate('Unchecked') }}</option>
                        </select>
                        <button
                            v-show="columnFilters[col.id]"
                            @click="clearFilter(col.id)"
                            class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-white dark:bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center shadow-sm"
                            :title="translate('Clear filter')"
                        >✖</button>
                    </div>
                </div>

                <div v-else-if="col.type === 'rating' && !isPrinting" class="relative w-full sm:w-auto"
                    :data-tooltip="columnTotals[col.id] ? `${columnTotals[col.id]} ★` : '0 ★'">
                    <select
                        v-model="columnFilters[col.id]"
                        class="w-full text-sm px-2 py-1.5 bg-white dark:bg-gray-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-amber-600 dark:text-amber-400 font-medium transition-colors shadow-inner pr-8 cursor-pointer"
                    >
                        <option value="" class="bg-white dark:bg-gray-700">{{ columnTotals[col.id] ? `★ ${columnTotals[col.id]}` : translate('All') }}</option>
                        <option value="5" class="bg-white dark:bg-gray-700">★★★★★ (5)</option>
                        <option value="4" class="bg-white dark:bg-gray-700">★★★★+ (4+)</option>
                        <option value="3" class="bg-white dark:bg-gray-700">★★★+ (3+)</option>
                        <option value="2" class="bg-white dark:bg-gray-700">★★+ (2+)</option>
                        <option value="1" class="bg-white dark:bg-gray-700">★+ (1+)</option>
                        <option value="0" class="bg-white dark:bg-gray-700">☆ (0)</option>
                    </select>
                    <button
                        v-show="columnFilters[col.id]"
                        @click="clearFilter(col.id)"
                        class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-white dark:bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center"
                        :title="translate('Clear filter')"
                    >✖</button>
                </div>

                <div v-else-if="col.type === 'progress' && !isPrinting" class="relative w-full sm:w-auto"
                    :data-tooltip="`${columnTotals[col.id] || 0}%`">
                    <div class="relative w-full bg-white dark:bg-gray-700 overflow-hidden shadow-inner focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors">
                        <div class="absolute left-0 top-0 h-full transition-all duration-500 ease-out opacity-20 dark:opacity-30 pointer-events-none"
                            :class="getProgressBarColor(columnTotals[col.id] || 0)"
                            :style="{ width: (columnTotals[col.id] || 0) + '%' }">
                        </div>
                        <select
                            v-model="columnFilters[col.id]"
                            class="relative w-full text-sm px-2 py-1.5 bg-transparent border-none outline-none text-gray-700 dark:text-gray-200 cursor-pointer pr-8 appearance-none"
                        >
                            <option value="" class="bg-white dark:bg-gray-700">{{ `${columnTotals[col.id] || 0}%` }}</option>
                            <option value="done" class="bg-white dark:bg-gray-700">✅ 100%</option>
                            <option value="in_progress" class="bg-white dark:bg-gray-700">⏳ 1% – 99%</option>
                            <option value="not_started" class="bg-white dark:bg-gray-700">⬜ 0%</option>
                        </select>
                        <button
                            v-show="columnFilters[col.id]"
                            @click="clearFilter(col.id)"
                            class="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-white dark:bg-gray-700 rounded-full w-4 h-4 flex items-center justify-center shadow-sm"
                            :title="translate('Clear filter')"
                        >✖</button>
                    </div>
                </div>

                <div v-else-if="isNumericType(col.type) || col.type === 'checkbox'" class="relative text-gray-800 dark:text-gray-200 font-semibold">
                    <template v-if="col.type === 'checkbox'">
                        <span class="text-sm font-medium" :class="getCheckboxProgressClass(columnTotals[col.id])">{{ columnTotals[col.id] || '0 / 0' }}</span>
                    </template>
                    <template v-else>
                        <span class="text-lg font-bold text-blue-700 dark:text-blue-400">
                            {{ activeFilterCol === col.id ? draftFilterText : (columnFilters[col.id] || formatNumber(columnTotals[col.id])) }}
                        </span>
                    </template>
                </div>
            </div>
        </div>

        <div v-if="!isPrinting" class="flex items-center justify-center bottom-0 right-0 border-gray-300 dark:border-gray-600 px-4 min-h-[38px] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shrink-0 w-full sm:flex-1"
            :style="{'--col-width': colWidths[columns.length + 1] ? colWidths[columns.length + 1] + 'px' : 'auto'}">
            <button
                v-show="isAnyFilterActive"
                @click.stop="clearAllFilters"
                class="flex items-center justify-center gap-1 mx-auto text-sm sm:text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors px-3 py-2 sm:py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 rounded-md border border-red-200 dark:border-red-800 shadow-sm active:scale-95 w-full"
                :title="translate('Clear All Filters')"
            >✖</button>
        </div>
    </div>

    <div v-if="!isPrinting" class="flex flex-col sm:flex-row w-full">
        <div class="border-b sm:border border-gray-100 sm:border-gray-300 dark:border-gray-600 p-0 bg-white sm:bg-gray-100 dark:bg-gray-800 flex-1 relative min-w-0">
            <div class="flex w-full h-full relative">
                <input
                    type="text"
                    enterkeyhint="search"
                    v-model="columnFilters['note']"
                    :placeholder="'🔍 ' + translate('Note') + translate('Filter...')"
                    class="w-full h-full min-h-[44px] px-4 py-2 bg-transparent outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-colors pr-10"
                >
                <button
                    v-show="columnFilters['note']"
                    @click="columnFilters['note'] = ''"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    :title="translate('Clear filter')"
                >✖</button>
            </div>
        </div>
    </div>
</div>

<div v-if="!isPrinting || isPrinting && globalNotes">
    <div v-if="isPrinting" class="text-sm text-gray-700 whitespace-pre-wrap break-words">
        {{ globalNotes }}
    </div>
    <textarea
        v-else
        id="global-notes"
        v-model="globalNotes"
        rows="1"
        class="w-full border-gray-300 dark:border-gray-600 rounded p-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-base bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 [field-sizing:content]"
        :placeholder="translate('Enter details here...')"
        @input="autoHeight($event.target)"
        @change="onDataEdited"
        @click="speakFeedback($event.target.value)"
    ></textarea>
    <button v-if="!isPrinting"
        tabindex="-1"
        @click.stop="scanningTarget = { row: null, col: null }"
        class="absolute opacity-100 group-hover/cell:opacity-100 focus-within:opacity-100 transition-opacity shrink-0 right-0 [@media(pointer:coarse)_and_(orientation:landscape)]:hidden"
    >
        <span class="icon-mask icon-camera w-5 h-5 bg-current block"></span>
    </button>
</div>

<div v-if="!isPrinting" class="flex flex-col p-2 gap-2 mt-4 print:hidden">
    <div class="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300" v-show="!isPrinting || isBudgetOpen">
        <div
            @click="toggleBudget"
            class="p-2 text-lg font-bold text-gray-700 dark:text-gray-300 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer select-none"
        >
            <span class="flex items-center">💰 {{ translate('Budget') }}</span>
            <div class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-gray-600 transition-all">
                <span class="transform transition-transform duration-300" :class="isBudgetOpen ? 'rotate-180' : 'rotate-0'">▼</span>
            </div>
        </div>
        <div v-if="isBudgetOpen" class="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700" :class="{'print:hidden': !isBudgetOpen}">
            <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <table class="w-full border-collapse bg-white dark:bg-gray-800 text-sm">
                    <thead class="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        <tr>
                            <th class="p-3 text-left font-semibold border-b border-gray-200 dark:border-gray-600">{{ translate('Category') }}</th>
                            <th class="p-3 text-center font-semibold border-b border-gray-200 dark:border-gray-600 w-16">🎨</th>
                            <th class="p-3 text-center font-semibold border-b border-gray-200 dark:border-gray-600 w-24">
                                <select
                                    @change="applyTypeToAll($event.target.value); $event.target.value = ''"
                                    class="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 outline-none font-bold transition-colors cursor-pointer bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 w-full"
                                >
                                    <option value="" disabled selected>{{ translate('Type') }} ▼</option>
                                    <option value="expense">{{ translate('Expense') }} ({{ translate('All') }})</option>
                                    <option value="income">{{ translate('Income') }} ({{ translate('All') }})</option>
                                </select>
                            </th>
                            <th class="p-3 text-right font-semibold border-b border-gray-200 dark:border-gray-600 w-40">
                                <input
                                    type="text"
                                    :placeholder="translate('Budget amount') + ' ($) ▼'"
                                    @change="applyAmountToAll($event.target.value); $event.target.value = ''"
                                    class="w-full text-right bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded outline-none px-2 py-1 text-gray-700 dark:text-gray-200 transition-colors text-xs font-bold shadow-inner"
                                    :title="translate('Apply to all')"
                                >
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="stat in budgetStats" :key="stat.name" class="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td class="p-3 text-gray-800 dark:text-gray-200 font-bold">
                                <label
                                    class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 flex items-center select-none"
                                    @click.stop="openGlobalMenu($event, stat.budget, { id: 'amount', type: 'number' })"
                                >
                                    {{ stat.name }}
                                    <span class="text-xs ml-2 opacity-50">▼</span>
                                </label>
                            </td>
                            <td class="p-3 text-center">
                                <div class="relative w-7 h-7 mx-auto rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 shadow-sm hover:scale-110 transition-transform cursor-pointer">
                                    <input
                                        type="color"
                                        v-model="stat.budget.color"
                                        @change="onDataEdited()"
                                        class="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
                                        :title="translate('Change Color')"
                                    >
                                </div>
                            </td>
                            <td class="p-3 text-center">
                                <select
                                    v-model="stat.budget.type"
                                    @change="stat.budget.type = $event.target.value; onDataEdited()"
                                    class="text-xs px-2 py-1 rounded border outline-none font-bold transition-colors cursor-pointer"
                                    :class="(!stat.budget.type || stat.budget.type === 'expense') ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'"
                                >
                                    <option value="expense">{{ translate('Expense') }}</option>
                                    <option value="income">{{ translate('Income') }}</option>
                                </select>
                            </td>

                            <td class="group w-100 p-3 text-right relative">
                                <input
                                    :ref="(el) => { if (el) inputRefs[`${stat.budget.id}-amount`] = el; else delete inputRefs[`${stat.budget.id}-amount`] }"
                                    type="text"
                                    :value="stat.budget.amount"
                                    @change="stat.budget.amount = calcValue($event.target.value); onDataEdited()"
                                    class="w-full text-right bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-indigo-500 outline-none px-1 py-1 text-gray-700 dark:text-gray-200 transition-colors font-mono"
                                    :placeholder="translate('e.g., 5000 or 12000/12')"
                                >
                                <button @click="deleteCategoryBudget(stat.name)"
                                    class="absolute left-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100">✖</button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="p-3 bg-gray-50 dark:bg-gray-700/30 flex gap-2 items-center border-t border-gray-200 dark:border-gray-700">
                    <input
                        v-model="newCategoryInput"
                        type="text"
                        @keyup.enter="addNewCategory"
                        :placeholder="translate('New Category')"
                        class="flex-1 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm"
                    >
                    <button
                        @click="addNewCategory"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md transition-colors font-bold shadow-sm active:scale-95 text-sm whitespace-nowrap"
                    >
                        ➕ {{ translate('Add') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div class="w-full bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div @click="isFeaturesOpen = !isFeaturesOpen; outputToScreen = ''" class="flex items-center justify-between cursor-pointer group select-none">
            <h3 class="font-extrabold text-lg flex items-center gap-2 text-gray-800 dark:text-white transition-colors">🛠️ {{ translate('Features') }}</h3>
            <div class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-gray-600 transition-all">
                <span class="transform transition-transform duration-300" :class="isFeaturesOpen ? 'rotate-180' : 'rotate-0'">▼</span>
            </div>
        </div>
        <div class="grid transition-all duration-500 ease-in-out" :class="isFeaturesOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'">
            <div class="flex flex-wrap gap-3 overflow-hidden">
                <input type="file" ref="fileInput" accept=".json,.csv" multiple class="hidden" @change="handleFileUpload">

                <button @click="triggerFileUpload" class="flex bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl transition-all font-bold shadow-sm active:scale-95 w-full sm:w-auto items-center justify-center gap-2">📂 {{ translate('Upload (JSON/CSV)') }}</button>
                <button @click="exportJson" class="flex bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white px-5 py-2.5 rounded-xl transition-all font-bold shadow-sm active:scale-95 w-full sm:w-auto items-center justify-center gap-2">{} {{ translate('Export JSON') }}</button>
                <button @click="exportCsv" class="flex bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all font-bold shadow-sm active:scale-95 w-full sm:w-auto items-center justify-center gap-2">⊞ {{ translate('Export CSV') }}</button>
                <button @click="generateShareLink" class="flex bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all font-bold shadow-sm active:scale-95 items-center justify-center gap-2 w-full sm:w-auto">🔗 {{ translate('Share Link & QRCode') }}</button>
                <button @click="copyQuickAddLink" class="flex bg-pink-500 hover:bg-pink-600 dark:bg-pink-600 dark:hover:bg-pink-700 text-white px-5 py-2.5 rounded-xl transition-all font-bold shadow-sm active:scale-95 w-full sm:w-auto items-center justify-center gap-2">⚡ {{ translate('Quick Add Link') }}</button>
                <button @click="triggerPrint" :disabled="isProcessing" class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-xl transition-all font-bold shadow-sm active:scale-95 w-full sm:w-auto items-center justify-center gap-2">🖨️ {{ translate('Print') }}</button>
                <div class="flex w-full gap-2">
                    <button @click="backupToGist" :disabled="isProcessing || !githubToken || !isOnline" class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-all font-bold shadow-sm active:scale-95 flex items-center justify-center gap-2">
                        <span v-if="isProcessing == -1" class="animate-spin text-xl">⏳</span>
                        <span v-else>⬆️ {{ translate('Push to gists') }}</span>
                    </button>
                    <button @click="restoreFromGist" :disabled="isProcessing || !gistId || !isOnline" class="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-all font-bold shadow-sm active:scale-95 flex items-center justify-center gap-2">
                        <span v-if="isProcessing == -2" class="animate-spin text-xl">⏳</span>
                        <span v-else>⬇️ {{ translate('Pull from gists') }}</span>
                    </button>
                    <button
                        @click="exportToGoogleSheets"
                        :disabled="isProcessing || !sheetImportUrl || !isOnline"
                        class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-all font-bold shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span v-if="isProcessing == -3" class="animate-spin text-lg">⏳</span>
                        <span v-else>⬆️ {{ translate('Push to Sheets') }}</span>
                    </button>
                    <button
                        @click="importFromGoogleSheets"
                        :disabled="isProcessing || !sheetImportUrl || !isOnline"
                        class="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-all font-bold shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span v-if="isProcessing == -4" class="animate-spin text-lg">⏳</span>
                        <span v-else>⬇️ {{ translate('Pull from Sheets') }}</span>
                    </button>
                </div>
                <div class="w-full text-right sm:text-left flex flex-wrap justify-center sm:justify-end gap-1">
                    <button @click="mergeDuplicates" class="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline transition-colors p-2 whitespace-nowrap">
                        {{ translate('Merge Duplicates') }}
                    </button>
                    <button @click="toggleAllNotes" class="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors p-2 whitespace-nowrap">
                        {{ areAllExpanded ? translate('Collapse All Notes') : translate('Expand All Notes') }}
                    </button>
                    <button @click="clearStorage" class="text-sm text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 underline transition-colors p-2 whitespace-nowrap">
                        {{ translate('Clear Data') }}
                    </button>
                </div>
            </div>

            <div v-if="outputToScreen" class="flex flex-col mt-4 gap-3">
                <div
                    class="bg-gray-900 text-green-400 p-4 overflow-auto shadow-inner border border-gray-700 group transition-all duration-300"
                    :class="isFullscreen
                        ? 'fixed inset-0 z-[9999] w-screen h-screen rounded-none'
                        : 'relative h-64 rounded-xl'"
                >
                    <button
                        @click="toggleFullscreen"
                        class="absolute top-3 right-3 p-2 bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-all opacity-50 group-hover:opacity-100 z-10"
                    >
                        <svg v-if="!isFullscreen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
                        </svg>
                        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4l5 5M5 9h4V5 M20 4l-5 5M19 9h-4V5 M4 20l5-5M5 15h4v4 M20 20l-5-5M19 15h-4v4"></path>
                        </svg>
                    </button>

                    <pre class="text-xs sm:text-sm font-mono whitespace-pre-wrap pr-12 mt-2"><code contenteditable class="focus:outline-none" @input="outputToScreen = $event.target.innerText">{{ outputToScreen }}</code></pre>
                </div>

                <button class="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 px-5 py-2.5 rounded-xl transition-all font-bold shadow-sm active:scale-95 w-full sm:w-auto flex items-center justify-center gap-2" @click="downloadFile(outputToScreen)">
                    📥 {{ translate('Download') }}
                </button>
            </div>
        </div>
    </div>
    <div class="w-full bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div @click="isSettingsOpen = !isSettingsOpen" class="flex items-center justify-between cursor-pointer group select-none">
            <h3 class="font-extrabold text-lg flex items-center gap-2 text-gray-800 dark:text-white transition-colors">⚙️ {{ translate('Settings') }}</h3>
            <div class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-gray-600 transition-all">
                <span class="transform transition-transform duration-300" :class="isSettingsOpen ? 'rotate-180' : 'rotate-0'">▼</span>
            </div>
        </div>
        <div class="grid transition-all duration-500 ease-in-out" :class="isSettingsOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'">
            <div class="overflow-hidden">

                <div v-if="!isPrinting" class="flex gap-4 mb-4">
                    <button
                        @click="toggleDarkMode"
                        class="p-1 w-10 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none"
                        :data-tooltip="isDark ? translate('Switch to Light Mode') : translate('Switch to Dark Mode')"
                    >
                        {{ isDark ? '🌞' : '🌙' }}
                    </button>
                    <select v-model="currentLanguage" class="w-full border border-gray-300 dark:border-gray-600 px-2 py-1 rounded text-gray-600 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700">
                        <option value="en">English</option>
                        <option value="zh-TW">繁體中文</option>
                        <option value="zh-CN">简体中文</option>
                        <option value="ja">日本語</option>
                        <option value="ko">한국어</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="nl">Nederlands</option>
                        <option value="hi">हिन्दी</option>
                        <option value="tl">Tagalog</option>
                        <option value="vi">Tiếng Việt</option>
                        <option value="th">ภาษาไทย</option>
                        <option value="id">Bahasa Indonesia</option>
                        <option value="ms">Bahasa Melayu</option>
                        <option value="ru">Русский</option>
                        <option value="pt">Português</option>
                        <option value="es">Español</option>
                        <option value="it">Italiano</option>
                        <option value="pl">Polski</option>
                        <option value="tr">Türkçe</option>
                        <option value="sv">Svenska</option>
                        <option value="cs">Czech</option>
                        <option value="ta">Tamil</option>
                        <option value="uk">Українська</option>
                        <option value="ar">العربية</option>
                    </select>
                </div>
                <div class="flex flex-col md:flex-row md:items-end gap-4 mb-4 w-full px-1">
                    <div class="flex flex-col flex-1 min-w-0">
                        <span class="text-sm text-gray-600 dark:text-gray-400 mb-1">{{ translate('Column Name') }}</span>
                        <input v-model="newColLabel" type="text" :placeholder="translate('e.g., Discount')" class="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400">
                    </div>
                    <div class="flex flex-col flex-1 min-w-0">
                        <span class="text-sm text-gray-600 dark:text-gray-400 mb-1">{{ translate('Data Type') }}</span>
                        <select v-model="newColType" class="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white text-base">
                            <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                    </div>
                    <div v-if="isCalcType(newColType)" class="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-2 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 flex-[1.5] min-w-0">
                        <select v-model="formulaA" class="flex-1 min-w-0 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white text-base">
                            <option value="" disabled>{{ translate('Column A') }}</option>
                            <option v-for="c in numberColumns" :key="'A'+c.id" :value="c.id">{{ c.label }}</option>
                        </select>
                        <span class="text-gray-500 dark:text-gray-400 font-bold shrink-0">{{ newColType === 'add' ? '+' : (newColType === 'minus' ? '−' : (newColType === 'divide' ? '÷' : '×')) }}</span>
                        <select v-model="formulaB" class="flex-1 min-w-0 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white text-base">
                            <option value="" disabled>{{ translate('Column B') }}</option>
                            <option v-for="c in numberColumns" :key="'B'+c.id" :value="c.id">{{ c.label }}</option>
                        </select>
                        <span v-if="newColType === 'multiply3'" class="flex items-center gap-2 flex-1 min-w-0">
                            <span class="text-gray-500 dark:text-gray-400 font-bold shrink-0">×</span>
                            <select v-model="formulaC" class="flex-1 min-w-0 border border-gray-300 dark:border-gray-600 py-1 px-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:text-white text-base">
                                <option value="" disabled>{{ translate('Column C') }}</option>
                                <option v-for="c in numberColumns" :key="'C'+c.id" :value="c.id">{{ c.label }}</option>
                            </select>
                        </span>
                    </div>
                    <div class="shrink-0 w-full md:w-auto">
                        <button @click="addColumn" class="w-full bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap px-5 py-2 rounded-md transition-colors font-medium shadow-sm h-[42px]">
                            {{ translate('Add') }}
                        </button>
                    </div>
                </div>
                <h3 class="font-extrabold text-lg flex items-center gap-2 text-gray-800 dark:text-white transition-colors">🐙 {{ translate('GitHub Gist Sync Settings') }}</h3>
                <div class="mt-4 p-6 dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div class="flex flex-col">
                            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{{ translate('GitHub Personal Access Token (PAT)') }}</label>
                            <div class="relative w-full flex items-center">
                                <input v-model="githubToken" type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" class="w-full border border-gray-300 dark:border-gray-600 pl-3 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors shadow-inner">
                                <div class="absolute right-2 flex items-center h-full">
                                    <button
                                        v-if="githubToken"
                                        @click="githubToken = ''"
                                        class="text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                                        :title="translate('Clear')"
                                    >✖</button>
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col">
                            <label class="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{{ translate('Gist ID (Leave blank to create new)') }}</label>
                            <div class="relative w-full flex items-center">
                                <input v-model="gistId" type="text" placeholder="e.g., 9a8b7c6d5e4f3g2h1i0j" class="[&:not(:focus)]:[-webkit-text-security:disc] w-full border border-gray-300 dark:border-gray-600 pl-3 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors shadow-inner">
                                <div class="absolute right-2 flex items-center h-full">
                                    <button
                                        v-if="gistId"
                                        @click="gistId = ''"
                                        class="text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                                        :title="translate('Clear')"
                                    >✖</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="text-gray-600 dark:text-gray-300 text-sm mt-2 space-y-2 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p class="font-bold text-gray-800 dark:text-gray-200">💡 {{ translate('How to get a Token?') }}</p>
                        <ol class="list-decimal ml-5 space-y-1.5 marker:text-gray-400">
                            <li><a href="https://github.com/settings/tokens" class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium underline underline-offset-2 transition-colors" target="_blank">{{ translate('Go to GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic).') }}</a></li>
                            <li>{{ translate('Click "Generate new token (classic)".') }}</li>
                            <li>{{ translate('Set Expiration to "No expiration" (to prevent future backup failures).') }}</li>
                            <li>{{ translate('Under Scopes, make sure to check "gist".') }}</li>
                            <li>{{ translate('If this is your first time using it, please leave the Gist ID blank.') }}</li>
                            <li>{{ translate('The size limit for Gist is 1 MB.') }}</li>
                        </ol>
                    </div>
                </div>

                <div class="mt-4 p-6 dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {{ translate('Google Client ID (OAuth)') }}
                    </label>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div class="relative flex-1 min-w-0">
                            <input
                                type="text"
                                v-model="sheetImportUrl"
                                :placeholder="translate('Google Sheet Import URL')"
                                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-10 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                            >
                            <button v-if="sheetImportUrl" @click="sheetImportUrl = ''" class="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center" :title="translate('Clear')">✖</button>
                        </div>
                        <div class="relative flex-1 min-w-0">
                            <input
                                type="password"
                                v-model="googleClientId"
                                placeholder="e.g., xxxxxxxx.apps.googleusercontent.com"
                                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-10 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                            >
                            <button v-if="googleClientId" @click="googleClientId = ''" class="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center" :title="translate('Clear')">✖</button>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">
                        {{ translate('Private key will be stored safely in your browser.') }}
                    </p>
                    <div class="flex items-center justify-between pt-3">
                        <div>
                            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center">
                                <svg class="w-4 h-4 mr-1.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                {{ translate('Daily Auto Sync') }}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 mr-4 leading-relaxed">
                                {{ translate('When enabled, the system will automatically perform a background two-way sync with Google Sheets on your first edit each day to prevent data loss.') }}
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" :disabled="!sheetImportUrl" v-model="isAutoSyncEnabled" class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-500"></div>
                        </label>
                    </div>
                    <div class="flex items-center justify-between pt-3 hidden">
                        <div>
                            <div class="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center">
                                <span class="icon-mask icon-calendar-push w-5 h-5 bg-current block mr-1"></span>
                                {{ translate('Push to Google Calendar') }}
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                            <input type="checkbox" :disabled="!googleClientId" v-model="isCalendarPushEnabled" class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-500"></div>
                        </label>
                    </div>
                    <div v-if="isAutoSyncEnabled && displayLastSync" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <svg class="w-3.5 h-3.5 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        {{ translate('Last background sync') }}: {{ displayLastSync }}
                    </div>
                </div>

                <div class="mt-4 p-6 dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-bold text-sm text-gray-700 dark:text-gray-300">👁️ {{ translate('Google Vision API') }} {{ translate('Text recognized') }}</h4>
                    </div>
                    <div class="relative w-full flex items-center">
                        <input v-model="googleVisionKey" type="password" placeholder="AIzaSy..." class="w-full border border-gray-300 dark:border-gray-600 pl-3 pr-10 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 shadow-inner">
                        <button
                            v-if="googleVisionKey"
                            @click="googleVisionKey = ''"
                            class="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                            :title="translate('Clear')"
                        >✖</button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">{{ translate('Get your API key from Google Cloud Console.') }} ({{ translate('There are 1000 free uses per month.') }})</p>
                </div>

                <div class="mt-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-white">{{ translate('Voice settings') }}</h3>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" v-model="isVoiceEnabled" class="sr-only peer">
                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                    <div class="space-y-4 transition-opacity duration-300" :class="isVoiceEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'">
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <label class="text-gray-700 dark:text-gray-300">{{ translate('Rate') }}</label>
                                <span class="text-indigo-600 font-medium">{{ voiceSettings.rate }}x</span>
                            </div>
                            <input type="range" v-model.number="voiceSettings.rate" min="0.5" max="2.0" step="0.1"
                                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                        </div>
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <label class="text-gray-700 dark:text-gray-300">{{ translate('Pitch') }}</label>
                                <span class="text-indigo-600 font-medium">{{ voiceSettings.pitch }}</span>
                            </div>
                            <input type="range" v-model.number="voiceSettings.pitch" min="0" max="2.0" step="0.1"
                                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                        </div>
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <label class="text-gray-700 dark:text-gray-300">{{ translate('Volume') }}</label>
                                <span class="text-indigo-600 font-medium">{{ Math.round(voiceSettings.volume * 100) }}%</span>
                            </div>
                            <input type="range" v-model.number="voiceSettings.volume" min="0" max="1.0" step="0.1"
                                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                        </div>
                        <button @click="playTestSound"
                                class="mt-4 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition-colors border border-indigo-200 dark:bg-gray-700 dark:text-indigo-300 dark:border-gray-600 dark:hover:bg-gray-600">
                            ▶️ {{ translate('Play test sound') }}
                        </button>
                    </div>
                </div>

            </div>

        </div>

    </div>
</div>
<div v-if="confirmModal.isOpen"
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    @click.self="onConfirmCancel">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 transform transition-all flex flex-col max-h-[95vh]">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center flex-shrink-0">
            <span class="mr-2 text-indigo-500">💡</span> {{ translate('Tips') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-300 mb-6 whitespace-pre-line overflow-y-auto flex-1">
            {{ confirmModal.message }}
        </p>
        <div class="flex justify-end space-x-3 flex-shrink-0">
            <button v-if="!confirmModal.onlyOK"
                ref="confirmCancelBtnRef"
                @click="onConfirmCancel"
                accesskey="n"
                class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-gray-200 transition-colors"
            >{{ translate('Cancel') }}</button>
            <button
                @click="onConfirmOk"
                accesskey="y"
                class="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >{{ translate('OK') }}</button>
        </div>
    </div>
</div>
<div v-if="workspaceModal.isOpen"
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    @click.self="closeWorkspaceModal">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6 transform transition-all flex flex-col">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <span class="mr-2">{{ workspaceModal.mode === 'add' ? (workspaceModal.isBlank ? '📄' : '➕') : '✏️' }}</span>
            {{ workspaceModal.mode === 'add' ? (workspaceModal.isBlank ? translate('Add Blank Workspace') : translate('Add Workspace')) : translate('Rename Workspace') }}
        </h3>
        <input
            ref="workspaceInputRef"
            v-model="workspaceModal.inputValue"
            type="text"
            :placeholder="translate('Workspace Name')"
            @input="workspaceModal.error = ''"
            @keyup.enter="submitWorkspaceModal"
            @keyup.escape="closeWorkspaceModal"
            class="border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full text-base bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        >
        <label v-if="workspaceModal.mode === 'add'" class="flex items-center gap-2 mt-3 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
            <input
                type="checkbox"
                v-model="workspaceModal.isBlank"
                class="w-4 h-4 text-indigo-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 cursor-pointer"
            >
            <span>{{ translate('Start with blank workspace (no columns)') }}</span>
        </label>
        <p v-if="workspaceModal.error" class="text-xs text-red-500 dark:text-red-400 mt-2">
            {{ workspaceModal.error }}
        </p>
        <div class="flex justify-end space-x-3 mt-6">
            <button
                type="button"
                @click="closeWorkspaceModal"
                class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >{{ translate('Cancel') }}</button>
            <button
                type="button"
                @click="submitWorkspaceModal"
                class="px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >{{ translate('OK') }}</button>
        </div>
    </div>
</div>
<div v-if="photoViewer.isOpen"
    class="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-pointer select-none"
    @click="photoViewer.isOpen = false">

    <button
        v-if="photoViewer.currentIndex > 0"
        @click.stop="photoViewer.currentIndex--"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-blue-400 transition-colors bg-black/40 hover:bg-black/70 rounded-full p-2 z-10"
    >
        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
    </button>

    <img
        :src="photoViewer.urls[photoViewer.currentIndex]"
        class="max-w-full max-h-[90vh] object-contain rounded shadow-2xl cursor-default"
        @click.stop
        alt=""
    />

    <button
        v-if="photoViewer.currentIndex < photoViewer.urls.length - 1"
        @click.stop="photoViewer.currentIndex++"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-blue-400 transition-colors bg-black/40 hover:bg-black/70 rounded-full p-2 z-10"
    >
        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
    </button>

    <button class="absolute top-4 right-4 text-white hover:text-red-400 transition-colors z-10" @click.stop="photoViewer.isOpen = false">✖</button>

    <div
        v-if="photoViewer.urls.length > 1"
        class="absolute bottom-6 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-1 rounded-full text-sm tracking-widest cursor-default"
        @click.stop
    >
        {{ photoViewer.currentIndex + 1 }} / {{ photoViewer.urls.length }}
    </div>
</div>
<div v-if="!isPrinting"
    @mouseenter="onScrollBtnsEnter"
    @mouseleave="onScrollBtnsLeave"
    class="fixed bottom-8 right-6 flex flex-col gap-3 z-50 hover:opacity-100 transition-opacity duration-300"
    :class="isScrolling ? 'opacity-40 hover:opacity-100 translate-x-0' : 'opacity-0 pointer-events-none translate-x-12'">

    <button v-if="googleClientId && isOnline"
        @click="checkAndAutoSync(1)"
        class="w-10 h-10 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all active:scale-90"
        :data-tooltip="translate('Sync to sheets')"
    >
        <span class="leading-none">🔄</span>
    </button>
    <button
        @click="addRow"
        class="w-10 h-10 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all active:scale-90"
        :data-tooltip="translate('Click to add a row')"
    >
        <span class="text-green-600 dark:text-green-500 font-bold text-2xl group-hover:scale-125 transition-transform">+</span>
    </button>
    <button
        v-show="!isAtTop"
        @click="scrollToPosition('top')"
        class="w-10 h-10 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all active:scale-90"
        :data-tooltip="translate('Scroll to Top')"
    >
        <span class="leading-none">⌅</span>
    </button>

    <button
        v-show="!isAtBottom"
        @click="scrollToPosition"
        class="w-10 h-10 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all active:scale-90"
        :data-tooltip="translate('Scroll to Bottom')"
    >
        <span class="leading-none rotate-180">⌅</span>
    </button>
</div>
<footer v-if="!isPrinting" class="items-center text-center text-sm text-gray-600 dark:text-gray-400 mt-4 mb-4 transition-colors">
    &copy; {{ new Date().getFullYear() }} <a href="https://ty-db.pages.dev" class="hover:text-gray-800 dark:hover:text-gray-200">{{ translate("TY Data Builder") }}<template v-if="showBadges && !failedBadges.version">&nbsp;<img @error="failedBadges.version = true" class="inline pb-1" src="https://img.shields.io/github/commit-activity/t/tyroneyeh/DataBuilder?logoColor=%23fff&label=Ver.&labelColor=%23fff&color=%23fff" alt="Version" referrerpolicy="no-referrer"></template></a>
    <div v-if="showBadges && (!failedBadges.lastCommit || !failedBadges.jsdelivr)" class="flex w-full justify-end">
    <a href="https://github.com/tyroneyeh/DataBuilder/" class="flex" target="_blank" rel="noopener noreferrer">
        <img v-if="!failedBadges.lastCommit" @error="failedBadges.lastCommit = true" src="https://img.shields.io/github/last-commit/tyroneyeh/DataBuilder?logo=github" alt="GitHub last commit" referrerpolicy="no-referrer" class="dark:invert"/>
        <img v-if="!failedBadges.jsdelivr" @error="failedBadges.jsdelivr = true" src="https://data.jsdelivr.com/v1/package/gh/tyroneyeh/DataBuilder/badge?style=rounded" alt="JSDelivr CDN" referrerpolicy="no-referrer" style="object-fit:cover;object-position:-51px" />
    </a>
    </div>
</footer>
<div class="fixed pointer-events-none z-[100] transition-opacity duration-200"
 :style="{
     left: '0px',
     top: '0px',
     opacity: tooltipState.show ? '1' : '0',
     transform: `translate3d(calc(-50% + ${tooltipState.x}px), calc(-100% + ${tooltipState.y - 15}px), 0)`
 }">
    <div class="bg-[rgba(0,0,0,0.7)] text-white text-xs rounded px-3 py-2 font-sans shadow-lg max-w-xs break-words text-center">
        <div class="text-sm font-bold mt-1">{{ tooltipState.text }}</div>
    </div>
</div>
       <div v-if="shareModal.isOpen"
    class="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 transition-opacity"
    @click.self="shareModal.isOpen = false">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform transition-all flex flex-col items-center relative border border-gray-200 dark:border-gray-700">
        <button @click="shareModal.isOpen = false" class="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none">✖</button>
        <h3 class="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-2">🔗 {{ shareModal.title }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center" v-html="shareModal.desc"></p>

        <div class="bg-white p-3 rounded-2xl shadow-inner border border-gray-100 mb-6">
            <img :src="shareModal.qrUrl" alt="Share QR Code" class="w-56 h-56 sm:w-64 sm:h-64 pointer-events-none">
        </div>
        <div class="w-full bg-indigo-50 dark:bg-gray-900 border border-indigo-100 dark:border-gray-700 rounded-lg p-4 text-gray-600 dark:text-gray-400 text-sm break-all select-all cursor-text shadow-inner mb-6 h-24 overflow-y-auto custom-scrollbar">
            {{ shareModal.link }}
        </div>
        <button @click="copyShareLink" class="w-full bg-indigo-600 text-white py-3.5 rounded-xl text-lg font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
            📋
        </button>
    </div>
</div>
</template>

<script>
import { translations } from './locale.js'
import { ref, reactive, shallowRef, triggerRef, computed, watch, nextTick, markRaw, toRaw, onMounted, onUnmounted } from 'vue'
import { Workbox } from 'workbox-window'

const loadedScripts = new Map()
const loadScript = (src) => {
    if (loadedScripts.has(src)) {
        return loadedScripts.get(src)
    }
    const promise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`)
        if (existing && existing.dataset.loaded === 'true') {
            return resolve()
        }
        const script = document.createElement('script')
        script.src = src
        script.onload = () => {
            script.dataset.loaded = 'true'
            resolve()
        }
        script.onerror = (err) => {
            loadedScripts.delete(src)
            script.remove()
            reject(err)
        }
        document.head.appendChild(script)
    })
    loadedScripts.set(src, promise)
    return promise
}

const lowerLang = navigator.language.toLowerCase()

let initialLang = 'en'

const exactMatch = Object.keys(translations).find(key => key.toLowerCase() === lowerLang)
const fuzzyMatch = Object.keys(translations).find(key => lowerLang.startsWith(key.toLowerCase().split('-')[0]))

if (exactMatch) {
    initialLang = exactMatch
} else if (fuzzyMatch) {
    initialLang = fuzzyMatch
}

const currentLanguage = ref(localStorage.getItem('lang') || initialLang)
document.documentElement.lang = currentLanguage.value
// const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

const translate = (key, params = null) => {
    const dict = translations[currentLanguage.value]
    let text = (dict && dict[key]) ? dict[key] : key
    if (params) {
        if (Array.isArray(params)) {
            params.forEach((val, i) => {
                text = text.replace(new RegExp(String.raw`\{${i}\}`, 'g'), val)
            })
        } else if (typeof params === 'object') {
            Object.keys(params).forEach(k => {
                text = text.replace(new RegExp(String.raw`\{${k}\}`, 'g'), params[k])
            })
        }
    }
    return text
}

const debounce = (func, delay) => {
    let timer = null
    const debounced = (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            func(...args)
        }, delay)
    }
    debounced.cancel = () => {
        clearTimeout(timer)
        timer = null
    }
    return debounced
}

class SimpleDB {
    constructor(storeName = 'ty-db', dbName = 'ty-db') {
        this.dbName = dbName
        this.storeName = storeName
        this.db = null
    }

    async _openDB(version) {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.dbName, version)

            req.onupgradeneeded = () => {
                const db = req.result
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, {keyPath: 'key'})
                }
            }

            req.onsuccess = () => resolve(req.result)
            req.onerror = () => reject(req.error)
        })
    }

    async init() {
        if (this.db) return this.db

        let version = 1
        try {
            const tmp = await this._openDB()
            version = tmp.version
            const hasStore = tmp.objectStoreNames.contains(this.storeName)
            tmp.close()
            if (!hasStore) version += 1
        } catch {}

        this.db = await this._openDB(version)
        return this.db
    }

    async get(key) {
        const db = await this.init()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite')
            const store = tx.objectStore(this.storeName)
            const req = store.get(key)

            req.onsuccess = () => {
                const item = req.result
                if (!item) return resolve(null)
                resolve(item.value)
            }

            req.onerror = () => reject(req.error)
        })
    }

    async set(key, value) {
        const db = await this.init()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite')
            const store = tx.objectStore(this.storeName)

            const req = store.put({
                key,
                value
            })

            req.onsuccess = () => resolve(true)
            req.onerror = () => reject(req.error)
        })
    }

    async remove(key) {
        const db = await this.init()
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite')
            const store = tx.objectStore(this.storeName)
            const req = store.delete(key)

            req.onsuccess = () => resolve(true)
            req.onerror = () => reject(req.error)
        })
    }

}

const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e', '#84cc16']

export default {
    setup() {
        const window = globalThis
        let scrollTimer = null

        const tooltipState = ref({
            show: false,
            text: '',
            x: 0,
            y: 0
        })

        const isProcessing = ref(0)
        const db = new SimpleDB()
        const currentStorageKey = ref('')
        const columnFilters = ref({})
        const appliedFilters = ref({})
        const savedKeysList = ref([])
        const tempKey = ref('')

        const colCount = ref(0)
        const columns = shallowRef([])
        const rows = shallowRef([])
        const inputRefs = ref({})
        const hasDateColumn = ref(false)
        const hasNumberColumn = ref(false)

        const activeMenuRow = ref(null)
        const isWorkspaceMenuOpen = ref(false)
        const workspaceInputRef = ref(null)
        const workspaceModal = ref({
            isOpen: false,
            mode: 'add',
            isBlank: false,
            inputValue: '',
            error: ''
        })

        const editingColId = ref(null)
        const newColLabel = ref('')
        const newColType = ref('text')
        const formulaA = ref('')
        const formulaB = ref('')
        const formulaC = ref('')
        const outputToScreen = ref('')
        const outputType = ref('json')
        const fileInput = ref(null)

        const isChartOpen = ref(localStorage.getItem('ty_chart_open'))
        const isTitleOpen = ref(localStorage.getItem('ty_title_open'))
        const customLegendItems = ref([])
        const hiddenCategoryNames = ref([])
        const selectedChartCatColId = ref(null)
        const selectedChartNumColId = ref(null)
        const selectedChartDateColId = ref('')
        const hasTrendData = ref(false)
        const trendChartType = ref('line')
        const chartViewMode = ref('expense')
        const yearFilters = ref([])
        const monthFilters = ref([])

        const confirmModal = ref({
            isOpen: false,
            title: '',
            message: '',
            onlyOK: 0,
            resolvePromise: null
        })
        const confirmCancelBtnRef = ref(null)
        const CALC_TYPES = new Set(['multiply', 'multiply3', 'minus', 'add', 'divide'])
        const isCalcType = (type) => CALC_TYPES.has(type)
        const isNumericType = (type) => type === 'number' || CALC_TYPES.has(type)
        const getSafeUrl = (raw) => {
            const val = String(raw || '').trim()
            if (!val) return ''
            if (/^https?:\/\//i.test(val)) return val
            if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?#].*)?$/.test(val)) return `https://${val}`
            return ''
        }
        const getSafeTel = (raw) => {
            const val = String(raw || '').trim()
            return val && /^[+\d\s\-().#*,;]+$/.test(val) ? `tel:${val.replace(/\s+/g, '')}` : ''
        }
        const getSafeEmail = (raw) => {
            const val = String(raw || '').trim()
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? `mailto:${val}` : ''
        }
        const isValidHexColor = (val) => /^#[0-9a-fA-F]{6}$/.test(String(val || '').trim())
        const normalizeTags = (val) => {
            if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean)
            if (typeof val === 'string' && val.trim()) return val.split(/[,，]/).map(v => v.trim()).filter(Boolean)
            return []
        }
        const tagDrafts = reactive({})
        const addTagToRow = (row, colId, rawValue) => {
            const draftKey = `${row.id}-${colId}`
            const text = (rawValue !== undefined ? String(rawValue) : (tagDrafts[draftKey] || '')).trim()
            if (!text) return
            const current = normalizeTags(row[colId])
            const newTags = text.split(/[,，]/).map(t => t.trim()).filter(t => t && !current.includes(t))
            if (newTags.length > 0) {
                row[colId] = [...current, ...newTags]
                onDataEdited('rows')
            }
            tagDrafts[draftKey] = ''
        }
        const removeTagFromRow = (row, colId, idx) => {
            const current = normalizeTags(row[colId])
            current.splice(idx, 1)
            row[colId] = current
            onDataEdited('rows')
        }
        const handleTagBackspace = (event, row, colId) => {
            const draftKey = `${row.id}-${colId}`
            if (!tagDrafts[draftKey]) {
                const current = normalizeTags(row[colId])
                if (current.length > 0) {
                    event.preventDefault()
                    current.pop()
                    row[colId] = current
                    onDataEdited('rows')
                }
            }
        }
        const setRating = (row, colId, star) => {
            row[colId] = Number(row[colId]) === star ? 0 : star
            onDataEdited('rows')
        }
        const clampProgress = (val) => {
            const num = Number(val)
            if (!Number.isFinite(num)) return 0
            return Math.min(100, Math.max(0, Math.round(num)))
        }
        const getColumnTypeLabel = (type) => {
            if (isCalcType(type)) return translate('Calc')
            const labelMap = {
                date: 'Date',
                time: 'Time',
                checkbox: 'Checkbox',
                category: 'Category',
                photo: 'Photo',
                password: 'Password',
                url: 'URL',
                tel: 'Phone',
                email: 'Email',
                rating: 'Rating',
                progress: 'Progress',
                tags: 'Tags',
                color: 'Color',
                number: 'Number',
                text: 'Text'
            }
            return translate(labelMap[type] || 'Text')
        }

        const typeOptions = computed(() => {
            const opts = [
                {value: 'category', label: translate('Category')},
                {value: 'text', label: translate('Text')},
                {value: 'password', label: translate('Password')},
                {value: 'url', label: translate('URL')},
                {value: 'tel', label: translate('Phone')},
                {value: 'email', label: translate('Email')},
                {value: 'number', label: translate('Number')},
                {value: 'rating', label: translate('Rating')},
                {value: 'progress', label: translate('Progress')},
                {value: 'tags', label: translate('Tags')},
                {value: 'color', label: translate('Color')},
                {value: 'date', label: translate('Date')},
                {value: 'time', label: translate('Time')},
                {value: 'checkbox', label: translate('Checkbox')},
                {value: 'photo', label: translate('Photo')}
            ]
            const numCount = columns.value.filter(col => col.type === 'number').length
            if (numCount > 1) {
                opts.push(
                    {value: 'add', label: translate('Add (A + B)')},
                    {value: 'minus', label: translate('Minus (A - B)')},
                    {value: 'multiply', label: translate('Multiply (A × B)')},
                    {value: 'divide', label: translate('Divide (A ÷ B)')}
                )
            }
            if (numCount > 2) {
                opts.push({value: 'multiply3', label: translate('Multiply (A × B x C)')})
            }
            return opts
        })
        const tableContainer = ref(null)
        const isAtTop = ref(true)
        const isAtBottom = ref(false)
        const isScrolling = ref(false)
        const expenseChart = shallowRef(null)
        const trendChart = shallowRef(null)

        const editableTypes = new Set(['text', 'password', 'url', 'tel', 'email', 'tags', 'color', 'date', 'time', 'number', 'checkbox', 'category'])
        const windowStart = ref(0)
        const windowEnd = ref(50)
        const bottomSentinel = ref(null)
        const isPrinting = ref(false)
        const isDark = ref(
            localStorage.getItem('theme') === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
        )
        const githubToken = ref(localStorage.getItem('ty_github_token') || '')
        const gistId = ref(localStorage.getItem('ty_gist_id') || '')
        const isFeaturesOpen = ref(false)
        const isSettingsOpen = ref(false)
        const timeUnit = ref('month')
        const selectedChartDate = ref(null)
        const globalNotes = ref('')
        const isScannerOpen = ref(false)
        const scanningTarget = ref(null)
        const googleVisionKey = ref(localStorage.getItem('ty_google_vision_key') || '')
        const isAutoScanEnabled = ref(false)
        const isZoomSupported = ref(false)
        const minZoom = ref(1)
        const maxZoom = ref(3)
        const currentZoom = ref(1)
        const isTorchSupported = ref(false)
        const isTorchOn = ref(false)
        const isBudgetOpen = ref(localStorage.getItem('ty_budget_open') === 'true')
        const categoryBudgets = ref({})
        const categoryCounts = ref({})
        const googleClientId = ref(localStorage.getItem('TY_GOOGLE_CLIENT_ID') || '')
        const sheetImportUrl = ref(localStorage.getItem('TY_SHEET_IMPORT_URL') || '')
        const googleTokenExpiresAt = ref(parseInt(localStorage.getItem('TY_GOOGLE_TOKEN_EXPIRES_AT')) || 0)
        const googleAccessToken = ref(localStorage.getItem('TY_GOOGLE_ACCESS_TOKEN') || '')
        const clearGoogleToken = () => {
            googleAccessToken.value = ''
            googleTokenExpiresAt.value = 0
            localStorage.removeItem('TY_GOOGLE_TOKEN_EXPIRES_AT')
            localStorage.removeItem('TY_GOOGLE_ACCESS_TOKEN')
        }
        const newCategoryInput = ref('')
        const isAutoSyncEnabled = ref(localStorage.getItem('ty_auto_sync') && sheetImportUrl.value != '')
        const isCalendarPushEnabled = ref(localStorage.getItem('ty_calendar_sync') && sheetImportUrl.value != '')
        const lastSyncDate = ref(localStorage.getItem(`${currentStorageKey.value}_last_sync_time`) || '')
        const updatedAt = ref('')
        const heatmapScrollContainer = ref(null)
        const heatmapCanvas = ref(null)

        const ensureCategoryBudgets = () => {
            const defaultPalette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
            uniqueCategories.value.forEach((cat, index) => {
                if (!categoryBudgets.value[cat]) {
                    categoryBudgets.value[cat] = {
                        id: 'budget_' + cat,
                        amount: null,
                        type: 'expense',
                        color: defaultPalette[index % defaultPalette.length]
                    }
                } else {
                    if (!categoryBudgets.value[cat].type) {
                        categoryBudgets.value[cat].type = 'expense'
                    }
                    if (!categoryBudgets.value[cat].color) {
                        categoryBudgets.value[cat].color = defaultPalette[index % defaultPalette.length]
                    }
                    if (!categoryBudgets.value[cat].id) {
                        categoryBudgets.value[cat].id = 'budget_' + cat
                    }
                }
            })
        }

        const toggleBudget = () => {
            isBudgetOpen.value = !isBudgetOpen.value
            if (isBudgetOpen.value) {
                ensureCategoryBudgets()
                localStorage.setItem('ty_budget_open', 'true')
            } else {
                localStorage.removeItem('ty_budget_open')
            }
        }

        const applyTypeToAll = async (typeValue) => {
            if (!typeValue) return
            if (await showConfirm(translate('Are you sure you want to set all categories to {type}?', {type: typeValue === 'income' ? translate('Income') : translate('Expense')}))) {
                ensureCategoryBudgets()
                uniqueCategories.value.forEach(cat => {
                    if (categoryBudgets.value[cat]) {
                        categoryBudgets.value[cat].type = typeValue
                    }
                })
                onDataEdited()
            }
        }

        const applyAmountToAll = async (rawAmount) => {
            if (!rawAmount || String(rawAmount).trim() === '') return
            const amountValue = calcValue(rawAmount)
            if (await showConfirm(translate('Are you sure you want to set all categories budget to {amount} for empty categories?', {amount: amountValue}))) {
                ensureCategoryBudgets()
                uniqueCategories.value.forEach(cat => {
                    const budgetConfig = categoryBudgets.value[cat]
                    if (budgetConfig && !budgetConfig.amount) {
                        budgetConfig.amount = amountValue
                    }
                })
                onDataEdited()
            }
        }

        const addNewCategory = () => {
            const catName = newCategoryInput.value.trim()
            if (!catName) return
            if (categoryBudgets.value[catName]) {
                showConfirm(translate('Category already exists!'), 1)
                return
            }
            const defaultPalette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
            const colorIndex = Object.keys(categoryBudgets.value).length
            categoryBudgets.value[catName] = {
                id: 'budget_' + catName,
                amount: null,
                type: 'expense',
                color: defaultPalette[colorIndex % defaultPalette.length]
            }
            newCategoryInput.value = ''
        }

        const mainCatColId = computed(() => {
            return selectedChartCatColId.value || columns.value.find(c => c.type === 'category')?.id
        })

        const uniqueCategories = computed(() => {
            const cats = new Set()
            const colId = mainCatColId.value
            if (colId) {
                chartBaseRows.value.forEach(row => {
                    const val = row[colId]
                    if (val && String(val).trim() !== '') {
                        cats.add(String(val).trim())
                    }
                })
            }
            Object.keys(categoryBudgets.value || {}).forEach(k => cats.add(k))
            return Array.from(cats)
        })

        const budgetStats = computed(() => {
            const defaultPalette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
            return uniqueCategories.value.map((cat, index) => ({
                name: cat,
                budget: categoryBudgets.value[cat] || {
                    id: 'budget_' + cat,
                    amount: null,
                    type: 'expense',
                    color: defaultPalette[index % defaultPalette.length]
                }
            }))
        })

        const scanModeOptions = computed(() => [
            {
                id: 'ALL',
                label: translate('Default (Auto-Detect All)'),
                description: translate('Supports all formats, but consumes more power')
            },
            {
                id: '1D_PRODUCT',
                label: translate('Product Barcode (1D)'),
                description: translate('EAN/UPC, optimized for retail inventory')
            },
            {
                id: '1D_LOGISTICS',
                label: translate('Logistics Barcode (1D)'),
                description: translate('Code 128 / Code 39, optimized for parcels')
            },
            {
                id: '2D_QR',
                label: translate('QR Code (2D)'),
                description: translate('Scans square QR codes only')
            },
            {
                id: 'OCR_PLATE',
                label: '🪪 '+ translate('OCR'),
                description: translate('Manually capture and identify images. You can set a Google Vision API Key or use Tesseract.js')
            }
        ])

        const debugImageUrl = ref('')

        const selectedScanMode = ref('ALL')
        const lastScannedText = ref('')
        const photoViewer = ref({ isOpen: false, urls: [], currentIndex: 0 })
        const dateRangeFilters = ref({})
        const dateRangeOpenState = ref({})
        const filterMatchMode = ref({})
        const activeFilterCol = ref(null)
        const draftFilterText = ref('')
        const shareModal = ref({
            isOpen: false,
            qrUrl: '',
            link: '',
            title: '',
            desc: ''
        })

        const isVoiceEnabled = ref(localStorage.getItem('ty_voice_enabled'))
        const voiceSettings = reactive(localStorage.getItem('ty_voice_settings') ? JSON.parse(localStorage.getItem('ty_voice_settings')) :
        {
            rate: 1.3,
            pitch: 1.1,
            volume: 1
        })
        const activeRow = ref(null)
        const menuStyle = ref({})
        const isKeyboardOpen = ref(false)
        const paddingTop = ref(0)
        const paddingBottom = ref(0)
        const activeDropdownIndex = ref(-1)
        const screenTarget = ref(null)
        const isFullscreen = ref(false)
        const isDragging = ref(false)
        const startCell = ref(null)
        const endCell = ref(null)
        const isCopied = ref(false)
        const observedRows = new WeakSet()
        const colWidths = ref({})
        const filterContainer = ref(null)
        const chartContainer = ref(null)
        const lockedTableMinHeight = ref(0)
        const lockedChartMinHeight = ref(0)
        const isFilterFocused = ref(false)
        let pendingFilterAnchorTop = null

        const isFilterInteractionActive = () => {
            const hasOpenRange = Object.values(dateRangeOpenState.value).some(Boolean)
            return isFilterFocused.value || hasOpenRange || Boolean(activeRow.value && !activeRow.value.row)
        }

        const lockLayoutForFilter = () => {
            if (tableContainer.value) {
                const h = Math.round(tableContainer.value.getBoundingClientRect().height)
                if (h > lockedTableMinHeight.value) lockedTableMinHeight.value = h
            }
            if (isChartOpen.value && chartContainer.value) {
                const ch = Math.round(chartContainer.value.getBoundingClientRect().height)
                if (ch > lockedChartMinHeight.value) lockedChartMinHeight.value = ch
            }
        }

        const releaseFilterLayoutLock = () => {
            lockedTableMinHeight.value = 0
            lockedChartMinHeight.value = 0
        }

        const captureFilterAnchor = () => {
            if (!filterContainer.value || !isFilterInteractionActive()) return
            lockLayoutForFilter()
            if (pendingFilterAnchorTop === null) {
                pendingFilterAnchorTop = filterContainer.value.getBoundingClientRect().top
            }
        }

        const restoreFilterAnchor = () => {
            if (pendingFilterAnchorTop === null || !filterContainer.value) return
            const targetTop = pendingFilterAnchorTop
            pendingFilterAnchorTop = null
            const currentTop = filterContainer.value.getBoundingClientRect().top
            const delta = currentTop - targetTop
            if (Math.abs(delta) > 1) {
                window.scrollBy(0, delta)
            }
            if (activeRow.value && !activeRow.value.row && activeRow.value.target) {
                const rect = activeRow.value.target.getBoundingClientRect()
                menuStyle.value = {
                    top: `${rect.bottom + window.scrollY}px`,
                    left: `${rect.left + window.scrollX}px`,
                    width: `${rect.width}px`
                }
            }
        }

        const onFilterFocusIn = () => {
            isFilterFocused.value = true
            lockLayoutForFilter()
        }

        const onFilterFocusOut = (e) => {
            if (filterContainer.value && e.relatedTarget && filterContainer.value.contains(e.relatedTarget)) {
                return
            }
            isFilterFocused.value = false
            if (!isFilterInteractionActive() && !isAnyFilterActive.value) {
                releaseFilterLayoutLock()
            }
        }

        let isInitializing = true
        let scrollRAF
        let heightCache = {}
        let averageRowHeight = 53
        let dragSource = { id: null, index: -1, element: null, type: null }
        let isSwapping = false
        let resizeObserver
        let legendClickTimer
        let legendClickCount = 0
        let filterClickTimer
        let filterClickCount = 0
        let lastFilterClick
        let isCenterTooltipVisible = false
        let cachedTotalSum = 0
        let html5QrCode
        let audioCtx
        let sharedFileInput
        let scrollHideTimer
        let aiModel
        let detectionLoopId
        let stableFrames = 0
        let emptyFrames = 0
        let isCarLocked = false
        let cameraTrack
        let scanCooldownTimer
        let currentMaxRowId = 0
        let tokenClient = null
        let pendingTokenResolve = null
        let pendingTokenReject = null
        let heatmapChartInstance = null

        const debouncedSave = debounce(() => {
            try {
                if (!currentStorageKey.value) return
                if (!colCount.value) colCount.value = columns.value.length
                const data = {title: currentStorageKey.value, colCount: colCount.value, columns: toRaw(columns.value), rows: toRaw(rows.value), note: globalNotes.value, budgets: toRaw(categoryBudgets.value), isBlank: columns.value.length === 0, updatedAt: Date.now()}
                if (data.budgets) data.budgets = JSON.parse(JSON.stringify(data.budgets))
                db.set(currentStorageKey.value, data)
            } catch (e) {
                showConfirm(e.message, 1)
            }
        }, 500)

        watch([githubToken, gistId], () => {
            localStorage.setItem('ty_github_token', githubToken.value.trim())
            if (gistId.value.includes('/')) {
                gistId.value = gistId.value.split('/').pop()
            }
            localStorage.setItem('ty_gist_id', gistId.value.trim())
        })
        watch([columns, rows, globalNotes], () => {
            if (isInitializing) return
            debouncedSave()
            updateTitle()
            refreshYearFilters()
            nextTick(() => {
                syncColumnWidths()
            })
        }, { flush: 'post' })
        watch(columns, () => {
            if (isInitializing) return
            if (isChartOpen.value) {
                debouncedUpdateChart.cancel()
                debouncedUpdateChart()
            }
        }, { flush: 'post' })
        watch(categoryBudgets, () => {
            if (isInitializing) return
            debouncedSave()
            if (isChartOpen.value) {
                debouncedUpdateChart.cancel()
                debouncedUpdateChart()
            }
        }, { deep: true, flush: 'post' })
        watch([uniqueCategories, isBudgetOpen], ([_, open]) => {
            if (open) ensureCategoryBudgets()
        })
        watch(newColType, (newVal) => {
            const matched = typeOptions.value.find(opt => opt.value === newVal)
            if (matched) newColLabel.value = matched.label
        })
        watch([selectedChartCatColId, selectedChartNumColId, selectedChartDateColId], () => {
            if (isInitializing) return
            if (selectedChartCatColId.value) localStorage.setItem(`${currentStorageKey.value}_chartCatColId`, selectedChartCatColId.value)
            if (selectedChartNumColId.value) localStorage.setItem(`${currentStorageKey.value}_chartNumColId`, selectedChartNumColId.value)
            selectedChartDateColId.value ? localStorage.setItem(`${currentStorageKey.value}_chartDateColId`, selectedChartDateColId.value) : localStorage.removeItem(`${currentStorageKey.value}_chartDateColId`)
            if (isChartOpen.value) {
                debouncedUpdateChart.cancel()
                debouncedUpdateChart()
            }
        })

        watch(isDark, (val) => {
            if (val) {
                document.documentElement.classList.add('dark')
                localStorage.setItem('theme', 'dark')
            } else {
                document.documentElement.classList.remove('dark')
                localStorage.setItem('theme', 'light')
            }
            nextTick(() => {
                if (expenseChart.value) expenseChart.value.update()
                if (trendChart.value) trendChart.value.update()
            })
        }, { immediate: true })

        watch(currentLanguage, (newVal) => {
            localStorage.setItem('lang', newVal)
            document.documentElement.lang = newVal
        })

        watch(googleVisionKey, (newVal) => {
            localStorage.setItem('ty_google_vision_key', newVal.trim())
        })

        watch(isAutoScanEnabled, async (newVal) => {
            if (newVal) {
                await initEdgeAI()
            } else {
                stopAutoCaptureLoop()
            }
        })

        watch([selectedScanMode, isScannerOpen], ([newMode, newIsOpen]) => {
            if (newMode !== 'OCR_PLATE' || !newIsOpen) {
                isAutoScanEnabled.value = false
                stopAutoCaptureLoop()
            }
        })

        watch(currentZoom, async (newZoom) => {
            if (cameraTrack && isZoomSupported.value) {
                try {
                    await cameraTrack.applyConstraints({
                        advanced: [{ zoom: newZoom }]
                    })
                } catch (error) {
                    console.error('變焦失敗:', error)
                }
            }
        })

        watch(isVoiceEnabled, (newVal) => {
            newVal ? localStorage.setItem('ty_voice_enabled', 'true') : localStorage.removeItem('ty_voice_enabled')
        })

        watch(voiceSettings, (newVal) => {
            newVal ? localStorage.setItem('ty_voice_settings', JSON.stringify(newVal)) : localStorage.removeItem('ty_voice_settings')
        })

        watch(() => {
            if (!activeRow.value || !activeRow.value.col) return null
            return activeRow.value.row
                ? activeRow.value.row[activeRow.value.col.id]
                : columnFilters.value[activeRow.value.col.id]
        }, (newValue, oldValue) => {
            activeDropdownIndex.value = -1
        })

        watch(sheetImportUrl, (newVal) => {
            localStorage.setItem('TY_SHEET_IMPORT_URL', newVal.trim())
        })

        watch(googleClientId, (newVal) => {
            localStorage.setItem('TY_GOOGLE_CLIENT_ID', newVal.trim())
            tokenClient = null
            clearGoogleToken()
        })

        watch(isAutoSyncEnabled, (newVal) => {
            newVal ? localStorage.setItem('ty_auto_sync', 1) : localStorage.removeItem('ty_auto_sync')
        })

        watch(isCalendarPushEnabled, (newVal) => {
            newVal ? localStorage.setItem('ty_calendar_sync', 1) : localStorage.removeItem('ty_calendar_sync')
        })

        watch(columnFilters, (newVal) => {
            syncFilters(newVal)
        }, { deep: true })

        const toggleDarkMode = () => {
            isDark.value = !isDark.value
            if (heatmapCanvas.value && typeof Chart !== 'undefined' && isChartOpen.value && hasTrendData.value) {
                renderHeatmap(heatmapCanvas.value.getContext('2d'))
            }
        }

        const numberColumns = computed(() => columns.value.filter(col => col.type === 'number'))

        const areAllExpanded = computed(() => {
            if (rows.value.length === 0) return false
            return rows.value.every(row => row.isExpanded)
        })

        const dateFilteredRows = computed(() => {
            if (!selectedChartDateColId.value) return [...rows.value]
            const inactiveMonths = new Set(monthFilters.value.filter(m => !m.active).map(m => m.month))
            const inactiveYears = new Set(yearFilters.value.filter(y => !y.active).map(y => y.year))
            if (inactiveMonths.size === 0 && inactiveYears.size === 0) return [...rows.value]
            return rows.value.filter(row => {
                const dateVal = row[selectedChartDateColId.value]
                if (!dateVal) return true
                const dateObj = new Date(dateVal)
                if (isNaN(dateObj.getTime())) return true
                if (inactiveMonths.has(dateObj.getMonth() + 1)) return false
                if (inactiveYears.has(dateObj.getFullYear())) return false
                return true
            })
        })

        const parseFilterCondition = (inputText) => {
            const text = inputText.trim()
            if (!text) return null
            const regex = /^([<>]=?|=)?\s*(-?\d+(?:\.\d+)?)$/
            const match = text.match(regex)
            if (!match) return null
            return {
                operator: match[1] || '===',
                value: parseFloat(match[2])
            }
        }

        const getRowNumericValue = (row, colDef) => {
            if (!row || !colDef) return 0
            if (colDef.type === 'number') return calcValue(row[colDef.id])
            if (colDef.type === 'multiply') return calcValue(row[colDef.opA]) * calcValue(row[colDef.opB])
            if (colDef.type === 'multiply3') return calcValue(row[colDef.opA]) * calcValue(row[colDef.opB]) * calcValue(row[colDef.opC])
            if (colDef.type === 'minus') return calcValue(row[colDef.opA]) - calcValue(row[colDef.opB])
            if (colDef.type === 'add') return calcValue(row[colDef.opA]) + calcValue(row[colDef.opB])
            if (colDef.type === 'divide') {
                const denom = calcValue(row[colDef.opB])
                if (denom === 0) return 0
                return Math.round((calcValue(row[colDef.opA]) / denom) * 100) / 100
            }
            return 0
        }

        const getHistoricalSpent = (catId) => {
            const amountColId = selectedChartNumColId.value || columns.value.find(c => isNumericType(c.type))?.id
            const dateColId = selectedChartDateColId.value || columns.value.find(c => c.type === 'date')?.id
            const catColId = mainCatColId.value
            const amountColDef = columns.value.find(c => c.id === amountColId)

            if (!amountColDef || !catColId || !dateColId) return 0

            const targetCat = String(catId).trim()
            const now = new Date()
            const targetYear = now.getFullYear()
            const targetMonth = now.getMonth()

            const parseDate = (value) => {
                if (!value) return null
                if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
                const date = new Date(value)
                return Number.isNaN(date.getTime()) ? null : date
            }

            let lastYearSum = 0
            const allLastYearMonths = new Set()

            let previousMonthsSum = 0
            const allPreviousMonths = new Set()

            let currentMonthSum = 0
            const allCurrentMonthDays = new Set()

            let otherSum = 0
            const allOtherMonths = new Set()

            rows.value.forEach(row => {
                if (!row) return

                const amount = getRowNumericValue(row, amountColDef)
                if (!Number.isFinite(amount) || amount === 0) return

                const rowDate = parseDate(row[dateColId])
                if (!rowDate) return

                const rowYear = rowDate.getFullYear()
                const rowMonth = rowDate.getMonth()
                const rowDay = rowDate.getDate()
                const isTargetCat = String(row[catColId] ?? '').trim() === targetCat
                const val = Math.abs(amount)

                if (rowYear === targetYear - 1) {
                    allLastYearMonths.add(rowMonth)
                    if (isTargetCat) lastYearSum += val
                } else if (rowYear === targetYear && rowMonth < targetMonth) {
                    allPreviousMonths.add(rowMonth)
                    if (isTargetCat) previousMonthsSum += val
                } else if (rowYear === targetYear && rowMonth === targetMonth) {
                    allCurrentMonthDays.add(rowDay)
                    if (isTargetCat) currentMonthSum += val
                } else {
                    allOtherMonths.add(`${rowYear}-${rowMonth}`)
                    if (isTargetCat) otherSum += val
                }
            })

            if (lastYearSum > 0 && allLastYearMonths.size > 0) {
                return Math.round(lastYearSum / allLastYearMonths.size)
            }
            if (previousMonthsSum > 0 && allPreviousMonths.size > 0) {
                return Math.round(previousMonthsSum / allPreviousMonths.size)
            }
            if (currentMonthSum > 0 && allCurrentMonthDays.size > 0) {
                const elapsedDays = Math.max(now.getDate(), allCurrentMonthDays.size)
                return Math.round((currentMonthSum / elapsedDays) * 30)
            }
            if (otherSum > 0 && allOtherMonths.size > 0) {
                return Math.round(otherSum / allOtherMonths.size)
            }
            return 0
        }

        const syncFilters = debounce((newVal) => {
            appliedFilters.value = { ...newVal }
        }, 400)

        const coreFilteredRows = computed(() => {
            let result = dateFilteredRows.value

            const activeDateFilters = Object.entries(dateRangeFilters.value).filter(([_, range]) => range.start !== '' || range.end !== '')
            if (activeDateFilters.length > 0) {
                result = result.filter(row => {
                    return activeDateFilters.every(([colId, range]) => {
                        const rawVal = row[colId]
                        const colDef = columns.value.find(c => c.id === colId)
                        if (!colDef) return true
                        const matchMode = filterMatchMode.value[colId] || 'exact'

                        if (isNumericType(colDef.type)) {
                            const numVal = getRowNumericValue(row, colDef)

                            if (range.start !== '' && range.end !== '') return numVal >= parseFloat(range.start) && numVal <= parseFloat(range.end)
                            else if (range.start !== '') return matchMode === 'range' ? numVal >= parseFloat(range.start) : numVal === parseFloat(range.start)
                            else if (range.end !== '') return numVal <= parseFloat(range.end)
                            return true
                        }

                        if (!rawVal) return false
                        let compareVal = rawVal
                        if (colDef.type === 'time') compareVal = normalizeTimeString(rawVal) || rawVal

                        if (range.start && range.end) return compareVal >= range.start && compareVal <= range.end
                        else if (range.start) return matchMode === 'range' ? compareVal >= range.start : compareVal === range.start
                        else if (range.end) return compareVal <= range.end
                        return true
                    })
                })
            }

            const activeFilters = Object.entries(appliedFilters.value).filter(([_, val]) => val && String(val).trim() !== '')
            if (activeFilters.length > 0) {
                result = result.filter(row => {
                    return activeFilters.every(([colId, filterText]) => {
                        const filterTextStr = String(filterText).toLowerCase().trim()
                        const rawValue = colId === 'note' ? row.note : row[colId]
                        const isEmptyCell = rawValue === null || rawValue === undefined || String(rawValue).trim() === ''

                        if (filterTextStr === translate('empty') || filterTextStr === '""' || filterTextStr === "''") return isEmptyCell

                        const checkMultiConditions = (val, filterStr, isCategory = false) => {
                            const cellText = String(val).toLowerCase()
                            const orGroups = filterStr.split(/(?:\s+or\s+|\|)/i).filter(g => g.trim().length > 0)

                            return orGroups.some(groupStr => {
                                const tokens = groupStr.split(/\s+/).filter(t => t.length > 0)

                                if (isCategory) {
                                    const includeTokens = tokens.filter(t => !t.startsWith('-'))
                                    const excludeTokens = tokens.filter(t => t.startsWith('-') && t.length > 1)

                                    const passExclude = excludeTokens.every(t => !cellText.includes(t.substring(1)))
                                    if (!passExclude) return false
                                    if (includeTokens.length === 0) return true
                                    return includeTokens.some(t => cellText.includes(t))

                                } else {
                                    return tokens.every(token => {
                                        if (token.startsWith('-') && token.length > 1) {
                                            return !cellText.includes(token.substring(1))
                                        }
                                        return cellText.includes(token)
                                    })
                                }
                            })
                        }

                        if (colId === 'note') {
                            if (isEmptyCell) return false
                            return checkMultiConditions(rawValue, filterTextStr)
                        }

                        const colDef = columns.value.find(c => c.id === colId)
                        if (!colDef) return true
                        if (colDef.type === 'photo') {
                            const hasPhoto = Array.isArray(rawValue) && rawValue.length > 0
                            if (filterTextStr === 'has_photo') return hasPhoto
                            if (filterTextStr === 'no_photo') return !hasPhoto
                            return true
                        }
                        if (colDef.type === 'checkbox') {
                            const isChecked = Boolean(rawValue)
                            if (filterTextStr === 'true') return isChecked === true
                            if (filterTextStr === 'false') return isChecked === false
                            return true
                        }
                        if (colDef.type === 'rating') {
                            const starVal = Math.round(Number(rawValue) || 0)
                            const targetStar = Number(filterTextStr)
                            if (targetStar === 0) return starVal === 0
                            if (Number.isFinite(targetStar)) return starVal >= targetStar
                            return true
                        }
                        if (colDef.type === 'progress') {
                            const pct = clampProgress(rawValue)
                            if (filterTextStr === 'done') return pct === 100
                            if (filterTextStr === 'in_progress') return pct > 0 && pct < 100
                            if (filterTextStr === 'not_started') return pct === 0
                            return true
                        }
                        if (colDef.type === 'tags') {
                            const tagStr = normalizeTags(rawValue).join(', ')
                            if (!tagStr) return false
                            return checkMultiConditions(tagStr, filterTextStr)
                        }
                        if (isNumericType(colDef.type)) {
                            const condition = parseFilterCondition(filterText)
                            if (condition) {
                                if (colDef.type === 'number' && isEmptyCell) return false
                                const cellValue = getRowNumericValue(row, colDef)
                                if (isNaN(cellValue)) return false
                                switch (condition.operator) {
                                    case '>':  return cellValue > condition.value
                                    case '>=': return cellValue >= condition.value
                                    case '<':  return cellValue < condition.value
                                    case '<=': return cellValue <= condition.value
                                    case '=':
                                    case '===': return cellValue === condition.value
                                    default: return true
                                }
                            }
                        }
                        if (isEmptyCell) return false
                        return checkMultiConditions(rawValue, filterTextStr, colDef.type === 'category')
                    })
                })
            }

            return result
        })

        const chartBaseRows = computed(() => {
            let result = coreFilteredRows.value
            const chartDate = selectedChartDate.value

            if (chartDate) {
                result = result.filter(row => {
                    const rowDate = row[selectedChartDateColId.value]
                    if (!rowDate) return false
                    if (chartDate.includes('-Q')) return getDateGroupKey(rowDate, 'quarter') === chartDate
                    if (chartDate.includes('-H')) return getDateGroupKey(rowDate, 'halfyear') === chartDate
                    if (chartDate.includes('-W')) return getDateGroupKey(rowDate, 'week') === chartDate
                    if (chartDate.length === 4) return getDateGroupKey(rowDate, 'year') === chartDate
                    if (chartDate.length === 7) return getDateGroupKey(rowDate, 'month') === chartDate
                    return getDateGroupKey(rowDate, 'day') === chartDate
                })
            }

            return result
        })

        const filteredRows = computed(() => {
            let result = chartBaseRows.value
            const catColId = selectedChartCatColId.value

            if (catColId && hiddenCategoryNames.value.length > 0) {
                const hiddenCategories = new Set(hiddenCategoryNames.value)
                if (hiddenCategories.size > 0) {
                    result = result.filter(row => {
                        const rawVal = row[catColId]
                        const catValue = rawVal && String(rawVal).trim() !== ''
                            ? String(rawVal).trim()
                            : translate('Uncategorized')
                        return !hiddenCategories.has(catValue)
                    })
                }
            }

            return result
        })

        const hasIncomeCategories = computed(() => {
            if (!categoryBudgets.value) return false
            return Object.values(categoryBudgets.value).some(config => config && config.type === 'income')
        })

        const hasBudgetCategories = computed(() => {
            if (!categoryBudgets.value) return false
            return Object.values(categoryBudgets.value).some(config => config && config.type !== 'income' && calcValue(config.amount) > 0)
        })

        const chartViewModes = computed(() => {
            const modes = []
            if (hasBudgetCategories.value) modes.push('budget')
            modes.push('expense')
            if (hasIncomeCategories.value) modes.push('income')
            return modes
        })

        const activeChartViewIndex = computed(() => {
            const idx = chartViewModes.value.indexOf(chartViewMode.value)
            return idx >= 0 ? idx : 0
        })

        watch(chartViewModes, (modes) => {
            if (!modes.includes(chartViewMode.value)) {
                chartViewMode.value = 'expense'
                if (isChartOpen.value) debouncedUpdateChart()
            }
        })

        const currentBudgetMultiplier = computed(() => {
            switch (timeUnit.value) {
                case 'day': return 1 / 30
                case 'week': return 1 / 4.33
                case 'quarter': return 3
                case 'halfyear': return 6
                case 'year': return 12
                case 'month':
                default:
                    return 1
            }
        })

        const categoryBudgetMap = computed(() => {
            const map = Object.create(null)
            const currentPeriodSpent = Object.create(null)

            const displayRows = Array.isArray(rows.value) ? rows.value : []
            const columnList = Array.isArray(columns.value) ? columns.value : []

            const amountColId = selectedChartNumColId.value || columnList.find(c => isNumericType(c.type))?.id
            const amountColDef = columnList.find(c => c.id === amountColId)
            const dateColId = selectedChartDateColId.value || columnList.find(c => c.type === 'date')?.id
            const catColId = mainCatColId.value

            const hasDateCol = dateColId !== null && dateColId !== undefined && dateColId !== ''

            let targetDateKey = selectedChartDate.value
            if (!targetDateKey && hasDateCol) {
                let maxTimestamp = 0
                for (let i = 0; i < displayRows.length; i++) {
                    const d = displayRows[i][dateColId]
                    if (d) {
                        const t = new Date(d).getTime()
                        if (!Number.isNaN(t) && t > maxTimestamp) maxTimestamp = t
                    }
                }
                if (maxTimestamp > 0) {
                    const maxDate = new Date(maxTimestamp)
                    const fallbackStr = [maxDate.getFullYear(), String(maxDate.getMonth() + 1).padStart(2, '0'), String(maxDate.getDate()).padStart(2, '0')].join('-')
                    targetDateKey = getDateGroupKey(fallbackStr, timeUnit.value)
                } else {
                    const now = new Date()
                    const todayStr = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
                    targetDateKey = getDateGroupKey(todayStr, timeUnit.value)
                }
            }

            displayRows.forEach(row => {
                if (!row || catColId == null || catColId === '') return

                const cat = row[catColId]
                if (cat === null || cat === undefined || String(cat).trim() === '') return
                const catKey = String(cat).trim()

                if (!amountColDef) return

                if (hasDateCol) {
                    const rowDate = row[dateColId]
                    if (!rowDate) return

                    const rowDateKey = getDateGroupKey(rowDate, timeUnit.value)
                    if (rowDateKey !== targetDateKey) {
                        return
                    }
                }

                const amount = getRowNumericValue(row, amountColDef)
                if (!Number.isFinite(amount)) return

                currentPeriodSpent[catKey] = (currentPeriodSpent[catKey] || 0) + Math.abs(amount)
            })

            const budgetSettingsMap = categoryBudgets.value || {}

            const allCategoriesToProcess = new Set([
                ...Object.keys(currentPeriodSpent),
                ...Object.keys(budgetSettingsMap)
            ])

            const rawMultiplier = Number(currentBudgetMultiplier.value)
            const multiplier = Number.isFinite(rawMultiplier) && rawMultiplier >= 0 ? rawMultiplier : 1

            allCategoriesToProcess.forEach((catKey) => {
                const rawSettings = budgetSettingsMap[catKey]
                const settings = rawSettings !== null && typeof rawSettings === 'object' ? rawSettings : {}
                let explicitBudget = 0

                if (
                    rawSettings !== null &&
                    rawSettings !== undefined &&
                    typeof rawSettings !== 'object'
                ) {
                    const value = Number(rawSettings)

                    if (Number.isFinite(value) && value > 0) {
                        explicitBudget = value
                    }
                } else {
                    const candidates = [
                        settings.budget,
                        settings.amount
                    ]

                    for (const candidate of candidates) {
                        if (
                            candidate === null ||
                            candidate === undefined ||
                            candidate === ''
                        ) continue

                        const value = Number(candidate)

                        if (Number.isFinite(value) && value > 0) {
                            explicitBudget = value
                            break
                        }
                    }
                }

                let monthlyBudget = null

                if (
                    timeUnit.value === 'month' &&
                    typeof targetDateKey === 'string' &&
                    /^\d{4}-\d{2}$/.test(targetDateKey)
                ) {
                    const rawMonthlyBudget =
                        settings.monthlyBudgets?.[targetDateKey]

                    if (
                        rawMonthlyBudget !== null &&
                        rawMonthlyBudget !== undefined &&
                        rawMonthlyBudget !== ''
                    ) {
                        const value = Number(rawMonthlyBudget)

                        if (Number.isFinite(value) && value >= 0) {
                            monthlyBudget = value
                        }
                    }
                }

                const isMonthlyOverride = monthlyBudget !== null
                const isFallback = !isMonthlyOverride && explicitBudget === 0

                let baseBudget

                if (isMonthlyOverride) {
                    baseBudget = monthlyBudget
                } else if (explicitBudget > 0) {
                    baseBudget = explicitBudget
                } else {
                    baseBudget = getHistoricalSpent(catKey)
                }

                const dynamicBudget =
                    Number.isFinite(baseBudget) && baseBudget > 0
                        ? Math.round(baseBudget * multiplier)
                        : 0

                const spent = currentPeriodSpent[catKey] || 0

                const percentageNum =
                    dynamicBudget > 0
                        ? (spent / dynamicBudget) * 100
                        : 0

                const isOver =
                    dynamicBudget > 0 && spent > dynamicBudget

                let displayStr = ''

                if (dynamicBudget === 0 && spent > 0) {
                    displayStr = translate('No budget')
                } else if (dynamicBudget > 0) {
                    displayStr = Math.round(percentageNum) + '%'
                } else {
                    displayStr = '0%'
                }

                map[catKey] = {
                    budget: dynamicBudget,
                    spent: spent,
                    percentage: Math.min(Math.max(percentageNum, 0), 100),
                    isOver: isOver,
                    isFallback: isFallback,
                    displayString: displayStr,
                    color: settings.color || '#9ca3af'
                }
            })

            return map
        })

        const rowRunningBudgetMap = computed(() => {
            const stats = new WeakMap()
            const spentTracker = Object.create(null)

            const dateColId = selectedChartDateColId.value
            const catColId = mainCatColId.value
            const amountColId = selectedChartNumColId.value
            const amountColDef = columns.value.find(c => c.id === amountColId)

            if (!dateColId || !catColId || !amountColDef) return stats

            const sortedRows = [...rows.value].filter(r => r[dateColId]).sort((a, b) => {
                return new Date(a[dateColId]).getTime() - new Date(b[dateColId]).getTime()
            })

            sortedRows.forEach(row => {
                const cat = row[catColId]
                if (!cat || String(cat).trim() === '') return
                const catKey = String(cat).trim()

                const rowDate = row[dateColId]
                const periodKey = getDateGroupKey(rowDate, timeUnit.value)

                const amount = getRowNumericValue(row, amountColDef)
                if (!Number.isFinite(amount)) return

                const trackingKey = `${periodKey}_${catKey}`

                spentTracker[trackingKey] = (spentTracker[trackingKey] || 0) + Math.abs(amount)

                const catBudgetInfo = categoryBudgetMap.value[catKey]

                if (catBudgetInfo && catBudgetInfo.budget > 0) {
                    const runningSpent = spentTracker[trackingKey]
                    const percentageNum = (runningSpent / catBudgetInfo.budget) * 100
                    const isOver = runningSpent > catBudgetInfo.budget

                    stats.set(row, {
                        percentage: Math.min(Math.max(percentageNum, 0), 100),
                        isOver: isOver,
                        isFallback: catBudgetInfo.isFallback,
                        displayString: `${Math.round(percentageNum)}%`,
                        color: catBudgetInfo.color
                    })
                }
            })

            return stats
        })

        const debouncedUpdateChart = debounce((unit, mode) => {
            if (isInitializing) return
            mode && (chartViewMode.value = mode)
            updateChart(unit)
        }, 300)

        watch([filteredRows, hasTrendData, customLegendItems], () => {
            captureFilterAnchor()
            nextTick(() => {
                restoreFilterAnchor()
            })
        }, { flush: 'pre' })

        watch(filteredRows, () => {
            const total = filteredRows.value.length

            if (windowStart.value >= total || total === 0) {
                windowStart.value = 0
                windowEnd.value = Math.min(50, total)
                paddingTop.value = 0
                paddingBottom.value = 0
            }

            if (isChartOpen.value) {
                debouncedUpdateChart.cancel()
                debouncedUpdateChart()
            }

            nextTick(() => {
                if (!tableContainer.value) return

                const maxScroll = Math.max(0, tableContainer.value.scrollHeight - tableContainer.value.clientHeight)
                if (tableContainer.value.scrollTop > maxScroll + 50) {
                    tableContainer.value.scrollTop = 0
                }

                handleTableScroll({ target: tableContainer.value }, true)
                restoreFilterAnchor()
            })
        }, {
            flush: 'post'
        })

        const visibleRows = computed(() => {
            if (isPrinting.value) return filteredRows.value
            return filteredRows.value.slice(windowStart.value, windowEnd.value)
        })

        const columnTotals = computed(() => {
            const totals = {}
            const catColId = selectedChartCatColId.value || columns.value.find(c => ['category', 'text'].includes(c.type))?.id

            columns.value.forEach(col => {
                if (col.type === 'checkbox') {
                    const checkedCount = filteredRows.value.filter(row => Boolean(row[col.id])).length
                    totals[col.id] = `${checkedCount} / ${filteredRows.value.length}`
                    return
                }
                if (col.type === 'rating') {
                    const rated = filteredRows.value.map(row => Number(row[col.id]) || 0).filter(v => v > 0)
                    totals[col.id] = rated.length ? Number((rated.reduce((s, v) => s + v, 0) / rated.length).toFixed(1)) : 0
                    return
                }
                if (col.type === 'progress') {
                    if (!filteredRows.value.length) {
                        totals[col.id] = 0
                    } else {
                        const sum = filteredRows.value.reduce((s, row) => s + clampProgress(row[col.id]), 0)
                        totals[col.id] = Math.round(sum / filteredRows.value.length)
                    }
                    return
                }

                if (isNumericType(col.type)) {
                    let sum = 0
                    filteredRows.value.forEach(row => {
                        let val = getRowNumericValue(row, col)

                        if (col.id === selectedChartNumColId.value && catColId) {
                            const rawCat = row[catColId]
                            const catLabel = rawCat && String(rawCat).trim() !== '' ? String(rawCat).trim() : translate('Uncategorized')
                            const budgetConfig = categoryBudgets.value[catLabel]
                            if (val !== 0) {
                                const isExpense = !budgetConfig || budgetConfig.type === 'expense'
                                val = isExpense ? -Math.abs(val) : Math.abs(val)
                            }
                        }
                        sum += val
                    })
                    totals[col.id] = sum
                }
            })
            return totals
        })

        const selectedBox = computed(() => {
            if (!startCell.value || !endCell.value) return null
            return {
                minRow: Math.min(startCell.value.row, endCell.value.row),
                maxRow: Math.max(startCell.value.row, endCell.value.row),
                minCol: Math.min(startCell.value.col, endCell.value.col),
                maxCol: Math.max(startCell.value.col, endCell.value.col),
            }
        })

        const isAnyFilterActive = computed(() => {
            const hasTextFilter = Object.values(columnFilters.value).some(val => val && String(val).trim() !== '')
            const hasDateFilter = Object.values(dateRangeFilters.value).some(range => range.start !== '' || range.end !== '')
            const hasChartDateFilter = selectedChartDate.value !== null
            const hasLegendFilter = hiddenCategoryNames.value.length > 0
            return hasTextFilter || hasDateFilter || hasChartDateFilter || hasLegendFilter
        })

        watch(isAnyFilterActive, (active) => {
            if (!active && !isFilterInteractionActive()) {
                releaseFilterLayoutLock()
            }
        })

        const displayLastSync = computed(() => {
            if (!lastSyncDate.value) return translate('Never synced')
            const dateObj = new Date(lastSyncDate.value)
            return dateObj.toLocaleString(undefined, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            })
        })

        const onDataEdited = (target = 'rows') => {
            if (isInitializing) return
            if (target === 'rows' || target === 'both') {
                triggerRef(rows)
            }
            if (target === 'columns' || target === 'both') {
                triggerRef(columns)
            }
            debouncedSave()
        }

        const loadChartCols = () => {
            selectedChartCatColId.value = localStorage.getItem(`${currentStorageKey.value}_chartCatColId`)
            selectedChartNumColId.value = localStorage.getItem(`${currentStorageKey.value}_chartNumColId`)
            selectedChartDateColId.value = localStorage.getItem(`${currentStorageKey.value}_chartDateColId`) || ''
        }

        const updateTitle = () => {
            document.title = (currentStorageKey.value || translate('My Data Sheets')) + ` - ${translate("TY Data Builder")}`
        }

        const initStorageKeys = () => {
            try {
                const listStr = localStorage.getItem('TY_TABLE_MASTER_KEY_LIST')
                if (listStr) {
                    savedKeysList.value = JSON.parse(listStr)
                    if (!Array.isArray(savedKeysList.value) || savedKeysList.value.length == 0) {
                        savedKeysList.value = ['ty-db']
                    }
                } else {
                    savedKeysList.value = ['ty-db']
                    localStorage.setItem('TY_TABLE_MASTER_KEY_LIST', JSON.stringify(savedKeysList.value))
                }
            } catch (e) {
                savedKeysList.value = ['ty-db']
            }
            const hashStr = window.location.hash.slice(1)
            if (hashStr && hashStr.startsWith('ws:')) {
                let wsRaw = hashStr.slice(3)
                if (wsRaw.endsWith('/add')) wsRaw = wsRaw.slice(0, -4)
                const wsName = decodeURIComponent(wsRaw)
                if (wsName) {
                    currentStorageKey.value = wsName
                    savedKeysList.value = savedKeysList.value.filter(key => key !== wsName)
                    savedKeysList.value.unshift(wsName)
                    localStorage.setItem('TY_TABLE_MASTER_KEY_LIST', JSON.stringify(savedKeysList.value))
                }
            } else {
                currentStorageKey.value = savedKeysList.value[0]
            }
            if (!window.location.hash.endsWith('/add')) {
                window.history.replaceState(null, null, '#ws:' + encodeURIComponent(currentStorageKey.value))
            }
            currentStorageKey.value = savedKeysList.value[0]
            loadChartCols()
        }

        initStorageKeys()

        const changeStorageKey = async (options = {}) => {
            const isBlankNew = Boolean(options && typeof options === 'object' && options.blank)
            isInitializing = true

            windowStart.value = 0
            releaseFilterLayoutLock()
            isFilterFocused.value = false
            isDragging.value = false
            startCell.value = null
            endCell.value = null
            activeDropdownIndex.value = -1
            if (activeRow !== undefined) activeRow.value = null
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                document.activeElement.blur()
            }

            let newKey = currentStorageKey.value.trim()
            if (!newKey) {
                newKey = 'ty-db'
                currentStorageKey.value = newKey
            }

            savedKeysList.value = savedKeysList.value.filter(key => key !== newKey)
            savedKeysList.value.unshift(newKey)
            localStorage.setItem('TY_TABLE_MASTER_KEY_LIST', JSON.stringify(savedKeysList.value))

            window.history.replaceState(null, null, '#ws:' + encodeURIComponent(newKey))

            loadChartCols()

            rows.value = []
            if (isBlankNew) {
                columns.value = []
                colCount.value = 0
                categoryBudgets.value = {}
                globalNotes.value = ''
                columnFilters.value = {}
                appliedFilters.value = {}
                dateRangeFilters.value = {}
                selectedChartDate.value = null
                hiddenCategoryNames.value = []
                await db.set(newKey, {
                    title: newKey,
                    colCount: 0,
                    columns: [],
                    rows: [],
                    note: '',
                    budgets: {},
                    isBlank: true,
                    updatedAt: Date.now()
                })
                isSettingsOpen.value = true
            }

            await nextTick()
            await loadData(1)

            isInitializing = false

            if (isChartOpen.value) {
                debouncedUpdateChart.cancel()
                debouncedUpdateChart()
            }
            checkAndAutoSync()
        }

        const WORKSPACE_STORAGE_SUFFIXES = ['_chartCatColId', '_chartNumColId', '_chartDateColId', '_scrollTop', '_last_sync_time']

        const saveCurrentWorkspaceNow = async (targetKey = currentStorageKey.value) => {
            if (!targetKey) return
            debouncedSave.cancel()
            if (!colCount.value) colCount.value = columns.value.length
            const data = {
                title: targetKey,
                colCount: colCount.value,
                columns: toRaw(columns.value),
                rows: toRaw(rows.value),
                note: globalNotes.value,
                budgets: categoryBudgets.value ? JSON.parse(JSON.stringify(toRaw(categoryBudgets.value))) : {},
                isBlank: columns.value.length === 0,
                updatedAt: updatedAt.value || Date.now()
            }
            await db.set(targetKey, data)
        }

        const openWorkspaceModal = async (mode, isBlank = false) => {
            isWorkspaceMenuOpen.value = false
            workspaceModal.value = {
                isOpen: true,
                mode,
                isBlank: mode === 'add' ? Boolean(isBlank) : false,
                inputValue: mode === 'rename' ? currentStorageKey.value : '',
                error: ''
            }
            await nextTick()
            if (workspaceInputRef.value) {
                workspaceInputRef.value.focus()
                if (mode === 'rename') {
                    workspaceInputRef.value.select()
                }
            }
        }

        const closeWorkspaceModal = () => {
            workspaceModal.value.isOpen = false
            workspaceModal.value.error = ''
        }

        const submitWorkspaceModal = async () => {
            const newName = workspaceModal.value.inputValue.trim()
            if (!newName) {
                workspaceModal.value.error = translate('Please enter a workspace name!')
                return
            }

            if (workspaceModal.value.mode === 'add') {
                if (savedKeysList.value.includes(newName)) {
                    workspaceModal.value.error = translate('Workspace already exists!')
                    return
                }
                const createBlank = workspaceModal.value.isBlank
                await saveCurrentWorkspaceNow()
                closeWorkspaceModal()
                currentStorageKey.value = newName
                await changeStorageKey({ blank: createBlank })
                return
            }

            const oldKey = currentStorageKey.value
            if (newName === oldKey) {
                closeWorkspaceModal()
                return
            }
            if (savedKeysList.value.includes(newName)) {
                workspaceModal.value.error = translate('Workspace already exists!')
                return
            }

            await saveCurrentWorkspaceNow(newName)
            await db.remove(oldKey)

            WORKSPACE_STORAGE_SUFFIXES.forEach(suffix => {
                const val = localStorage.getItem(`${oldKey}${suffix}`)
                if (val !== null) {
                    localStorage.setItem(`${newName}${suffix}`, val)
                    localStorage.removeItem(`${oldKey}${suffix}`)
                }
            })

            const idx = savedKeysList.value.indexOf(oldKey)
            if (idx !== -1) {
                savedKeysList.value.splice(idx, 1, newName)
            } else {
                savedKeysList.value.unshift(newName)
            }
            localStorage.setItem('TY_TABLE_MASTER_KEY_LIST', JSON.stringify(savedKeysList.value))

            currentStorageKey.value = newName
            tempKey.value = newName
            window.history.replaceState(null, null, '#ws:' + encodeURIComponent(newName))
            updateTitle()
            closeWorkspaceModal()
        }

        const deleteWorkspace = async () => {
            isWorkspaceMenuOpen.value = false
            const targetKey = currentStorageKey.value
            if (!targetKey) return

            if (!await showConfirm(translate('Are you sure you want to delete workspace "{name}"?', { name: targetKey }))) {
                return
            }

            debouncedSave.cancel()
            await db.remove(targetKey)
            WORKSPACE_STORAGE_SUFFIXES.forEach(suffix => {
                localStorage.removeItem(`${targetKey}${suffix}`)
            })

            savedKeysList.value = savedKeysList.value.filter(key => key !== targetKey)
            if (savedKeysList.value.length === 0) {
                savedKeysList.value = ['ty-db']
            }
            localStorage.setItem('TY_TABLE_MASTER_KEY_LIST', JSON.stringify(savedKeysList.value))

            isInitializing = true
            currentStorageKey.value = savedKeysList.value[0]
            tempKey.value = currentStorageKey.value
            colCount.value = 0
            columns.value = []
            rows.value = []
            globalNotes.value = ''
            categoryBudgets.value = {}
            heightCache = {}
            windowStart.value = 0
            releaseFilterLayoutLock()
            isFilterFocused.value = false
            windowEnd.value = 50
            paddingTop.value = 0
            paddingBottom.value = 0

            window.history.replaceState(null, null, '#ws:' + encodeURIComponent(currentStorageKey.value))
            loadChartCols()

            if (tableContainer.value) {
                tableContainer.value.scrollTop = 0
            }

            await nextTick()
            await loadData(0)
            isInitializing = false

            if (isChartOpen.value) {
                debouncedUpdateChart.cancel()
                debouncedUpdateChart()
            }
            if (tableContainer.value) {
                handleTableScroll({ target: tableContainer.value })
            }
        }

        const toggleActionMenu = (event, row) => {
            if (row) {
                activeMenuRow.value = row
            }

            const rect = event.target.getBoundingClientRect()

            menuStyle.value = {
                top: `${rect.bottom + window.scrollY}px`,
                left: `${rect.left + window.scrollX}px`
            }
        }

        const closeActionMenu = () => {
            activeMenuRow.value = null
        }

        const ExpandNote = async () => {
            const row = activeMenuRow.value
            if (!row) return
            row.isExpanded = !row.isExpanded
            closeActionMenu()
            onDataEdited()
            if (row.isExpanded) {
                await nextTick()
                const targetTextarea = document.getElementById(`note-${row.id}`)
                if (targetTextarea) {
                    autoHeight(targetTextarea)
                    targetTextarea.focus()
                    const textLength = targetTextarea.value.length
                    targetTextarea.setSelectionRange(textLength, textLength)
                }
            }
        }

        const onKeyFocus = () => {
            tempKey.value = currentStorageKey.value
            currentStorageKey.value = ''
        }

        const onKeyBlur = () => {
            if (currentStorageKey.value.trim() === '') {
                currentStorageKey.value = tempKey.value
            }
        }

        const toggleAllNotes = () => {
            const newState = !areAllExpanded.value
            rows.value.forEach(row => {
                row.isExpanded = newState
            })
            onDataEdited()
        }

        const syncMaxRowId = (forceReindexAll = false) => {
            if (!rows.value || rows.value.length === 0) {
                currentMaxRowId = 0
                return
            }

            let hasLegacy = false
            let currentMax = 0

            for (let i = 0; i < rows.value.length; i++) {
                const idVal = rows.value[i].id
                const isNumeric = typeof idVal === 'number' || (typeof idVal === 'string' && /^\d+$/.test(idVal))

                if (forceReindexAll || !isNumeric || idVal === undefined || idVal === null) {
                    hasLegacy = true
                } else {
                    const num = Number(idVal)
                    if (num > currentMax) currentMax = num
                }
            }

            if (hasLegacy) {
                let nextId = currentMax
                let modified = false

                rows.value = rows.value.map((row, index) => {
                    const idVal = row.id
                    const isNumeric = typeof idVal === 'number' || (typeof idVal === 'string' && /^\d+$/.test(idVal))

                    if (forceReindexAll) {
                        modified = true
                        return { ...row, id: index + 1 }
                    }

                    if (!isNumeric || idVal === undefined || idVal === null) {
                        modified = true
                        return { ...row, id: ++nextId }
                    }

                    return row
                })

                if (forceReindexAll) {
                    currentMax = rows.value.length
                } else {
                    currentMax = nextId
                }

                if (modified) {
                    if (heightCache !== undefined) {
                        Object.keys(heightCache).forEach(k => delete heightCache[k])
                    }
                    if (inputRefs !== undefined) {
                        inputRefs.value = {}
                    }
                    if (typeof onDataEdited === 'function') {
                        onDataEdited()
                    }
                }
            }

            currentMaxRowId = currentMax
        }

        const generateId = () => {
            return ++currentMaxRowId
        }

        const mergeDuplicates = async (isSilent = false) => {

            if (!isSilent && !await showConfirm(translate('Are you sure you want to merge duplicates?'))) {
                return
            }

            const keyCol = columns.value.find(col => ['text', 'category'].includes(col.type))
            if (!keyCol) {
                if (!isSilent) showConfirm(translate('Cannot find a text column to merge by.'), 1)
                return
            }

            const mergeNumber = await showConfirm(translate('Do you want to merge numbers?'))

            const priceKeywords = ['price', translate('Price').toLowerCase()]
            const isPriceCol = (colLabel) => {
                const lowerLabel = colLabel.toLowerCase()
                return priceKeywords.some(kw => lowerLabel.includes(kw))
            }

            const mergedMap = new Map()

            rows.value.forEach(row => {
                const keyValue = String(row[keyCol.id] || '').trim()

                if (mergedMap.has(keyValue)) {
                    const existingRow = mergedMap.get(keyValue)

                    mergeNumber && columns.value.forEach(col => {
                        if (col.type === 'number' && !isPriceCol(col.label)) {
                            const val1 = parseFloat(existingRow[col.id]) || 0
                            const val2 = parseFloat(row[col.id]) || 0
                            existingRow[col.id] = val1 + val2
                        }
                    })

                    const currentRemark = (existingRow.note || '').trim()
                    const incomingRemark = (row.note || '').trim()
                    if (incomingRemark !== '') {
                        if (currentRemark === '') {
                            existingRow.note = incomingRemark
                        } else {
                            existingRow.note = currentRemark + ' ' + incomingRemark
                        }
                        existingRow.isExpanded = true
                    }
                } else {
                    mergedMap.set(keyValue, { ...row })
                }
            })

            rows.value = Array.from(mergedMap.values()).map(r => {
                return { ...r, id: generateId() }
            })

            if (!isSilent) {
                showConfirm(translate('Items merged successfully!'), 1)
            }
        }

        const getUniqueValues = (colId) => {
            const timeColumn = columns.value.find(c => c.type === 'time')
            const actualTimeColId = timeColumn ? timeColumn.id : null

            const parseTimeToMins = (timeString) => {
                if (!timeString || String(timeString).trim() === '') {
                    return null
                }
                const match = String(timeString).trim().match(/(\d{1,2}):(\d{2})/)
                if (match) {
                    const h = parseInt(match[1], 10)
                    const m = parseInt(match[2], 10)
                    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                        return h * 60 + m
                    }
                }
                return null
            }

            const now = new Date()
            let currentMins = now.getHours() * 60 + now.getMinutes()

            if (actualTimeColId && activeRow.value && activeRow.value.row) {
                const currentTimeStr = activeRow.value.row[actualTimeColId]
                const parsedMins = parseTimeToMins(currentTimeStr)
                if (parsedMins !== null) {
                    currentMins = parsedMins
                }
            }

            const timeDiffMap = {}
            const frequencyMap = {}
            const validValues = []

            const isMainCategoryCol = (colId === mainCatColId.value)
            if (isMainCategoryCol && categoryBudgets.value) {
                Object.keys(categoryBudgets.value).forEach(cat => {
                    if (cat.trim() !== '') validValues.push(cat)
                })
            }

            rows.value.forEach(row => {
                const val = row[colId]
                if (val !== null && val !== undefined && String(val).trim() !== '') {
                    const strVal = String(val).trim()

                    frequencyMap[strVal] = (frequencyMap[strVal] || 0) + 1
                    validValues.push(strVal)

                    if (actualTimeColId) {
                        const rowMins = parseTimeToMins(row[actualTimeColId])
                        if (rowMins !== null) {
                            let diff = Math.abs(currentMins - rowMins)
                            if (diff > 12 * 60) diff = 24 * 60 - diff

                            if (timeDiffMap[strVal] === undefined || diff < timeDiffMap[strVal]) {
                                timeDiffMap[strVal] = diff
                            }
                        }
                    }
                }
            })

            const uniqueValues = [...new Set(validValues)]
            const TIME_THRESHOLD = 60

            const sortedValues = uniqueValues.sort((a, b) => {
                const freqA = frequencyMap[a] || 0
                const freqB = frequencyMap[b] || 0

                if (actualTimeColId) {
                    const diffA = timeDiffMap[a] === undefined ? Infinity : timeDiffMap[a]
                    const diffB = timeDiffMap[b] === undefined ? Infinity : timeDiffMap[b]

                    const isAMatch = diffA <= TIME_THRESHOLD
                    const isBMatch = diffB <= TIME_THRESHOLD

                    if (isAMatch && !isBMatch) return -1
                    if (!isAMatch && isBMatch) return 1
                    if (freqA !== freqB) {
                        return freqB - freqA
                    }

                    return diffA - diffB
                }

                return freqB - freqA
            })

            if (activeRow.value && activeRow.value.row) {
                const currentInput = String(activeRow.value.row[colId] || '').trim().toLowerCase()
                if (currentInput) {
                    return sortedValues.filter(option => {
                        return String(option).toLowerCase().includes(currentInput)
                    })
                }
            }

            return sortedValues
        }

        const decompressFromBase64 = async (base64) => {
            const binaryString = atob(base64)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.codePointAt(i)
            }
            const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))
            const decompressedBlob = await new Response(stream).blob()
            return await decompressedBlob.text()
        }

        const updateColumns = () => {
            if (columns.value.length === 0) return
            columns.value.forEach(col => {
                if (columnFilters.value[col.id] === undefined) {
                    columnFilters.value[col.id] = ''
                }
            })

            hasDateColumn.value = columns.value.some(column => column.type === 'date')
            hasNumberColumn.value = columns.value.some(column => column.type === 'number')
        }


        const normalizeTimeString = (val) => {
            if (!val) return ''
            const str = String(val).trim()

            const ampmMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i)
            if (ampmMatch) {
                let hours = parseInt(ampmMatch[1], 10)
                const minutes = ampmMatch[2]
                const period = ampmMatch[3].toUpperCase()

                if (period === 'PM' && hours < 12) hours += 12
                if (period === 'AM' && hours === 12) hours = 0

                return `${String(hours).padStart(2, '0')}:${minutes}`
            }

            const match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
            if (match) {
                const hours = match[1].padStart(2, '0')
                const minutes = match[2]
                return `${hours}:${minutes}`
            }

            return str
        }

        const fetchGoogleSheetsData = async (url) => {
            const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
            if (!match) throw new Error('Invalid URL format')
            const spreadsheetId = match[1]

            const token = await getValidGoogleToken()
            const tabName = `'${currentStorageKey.value}'`

            const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (res.status === 404 || res.status === 400) {
                return { rows: [] }
            }
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

            const data = await res.json()
            const values = data.values

            if (!values || values.length < 2) return { rows: [] }

            const headers = values[0]
            const fetchedRows = []

            for (let i = 1; i < values.length; i++) {
                const rowArray = values[i]
                if (rowArray[0] === translate('Total')) continue

                const idIndex = headers.indexOf('ID')
                const rowId = (idIndex !== -1 && rowArray[idIndex]) ? rowArray[idIndex] : generateId()
                const newRow = { id: rowId, note: '', isExpanded: false }

                columns.value.forEach(col => {
                    const colIndex = headers.indexOf(col.label)
                    if (colIndex !== -1 && rowArray[colIndex] !== undefined && rowArray[colIndex] !== '') {
                        let val = rowArray[colIndex]
                        if (col.type === 'number') {
                            val = parseFloat(val.toString().replace(/,/g, '')) || null
                        } else if (col.type === 'photo') {
                            val = []
                        } else if (col.type === 'tags') {
                            val = normalizeTags(val)
                        } else if (col.type === 'rating') {
                            val = Math.min(5, Math.max(0, Math.round(Number(val) || 0)))
                        } else if (col.type === 'progress') {
                            val = clampProgress(val)
                        } else if (col.type === 'time') {
                            val = normalizeTimeString(val)
                        } else if (col.type === 'checkbox') {
                            val = (val === true || String(val).trim().toUpperCase() === 'TRUE')
                        }
                        newRow[col.id] = val
                    } else {
                        if (col.type === 'number') newRow[col.id] = null
                        else if (col.type === 'photo' || col.type === 'tags') newRow[col.id] = []
                        else if (col.type === 'rating' || col.type === 'progress') newRow[col.id] = 0
                        else if (col.type === 'color') newRow[col.id] = '#3b82f6'
                        else newRow[col.id] = ''
                    }
                })

                const noteIndex = headers.indexOf(translate('Note'))
                if (noteIndex !== -1 && rowArray[noteIndex]) {
                    newRow.note = rowArray[noteIndex]
                }

                fetchedRows.push(newRow)
            }

            return { rows: fetchedRows }
        }

        const pushToGoogleSheets = async (url) => {
            const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
            if (!match) throw new Error('Invalid URL format')
            const spreadsheetId = match[1]

            const token = await getValidGoogleToken()
            const tabName = `'${currentStorageKey.value}'`
            const safeRange = `${tabName}!A1`

            const headers = ['ID', ...columns.value.map(c => c.label), translate('Note')]

            const rows2D = rows.value.map(row => {
                const rowArray = [row.id]
                columns.value.forEach(c => {
                    if (isCalcType(c.type)) {
                        rowArray.push(getRowNumericValue(row, c))
                    } else if (c.type === 'tags') {
                        rowArray.push(normalizeTags(row[c.id]).join(', '))
                    } else {
                        rowArray.push(row[c.id] ?? '')
                    }
                })
                rowArray.push(row.note || '')
                return rowArray
            })

            const getColumnLetter = (index) => {
                let letter = ''
                let temp = index
                while (temp >= 0) {
                    letter = String.fromCodePoint((temp % 26) + 65) + letter
                    temp = Math.floor(temp / 26) - 1
                }
                return letter
            }
            const startRow = 2
            const endRow = rows.value.length + 1

            if (columns.value.some(col => isNumericType(col.type))) {
                const totalRow = [translate('Total')]
                columns.value.forEach((col, index) => {
                    if (isNumericType(col.type)) {
                        const colIndex = index + 1
                        const colLetter = getColumnLetter(colIndex)
                        totalRow.push(`=SUM(${colLetter}${startRow}:${colLetter}${endRow})`)
                    } else {
                        totalRow.push('')
                    }
                })
                totalRow.push('')
                rows2D.push(totalRow)
            }

            const sheetDataValues = [headers, ...rows2D]

            const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!metaRes.ok) throw new Error(`Metadata error (${metaRes.status})`)

            const metaData = await metaRes.json()
            const sheetExists = (metaData.sheets || []).some(s => s.properties.title === currentStorageKey.value)

            if (!sheetExists) {
                const addSheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requests: [{ addSheet: { properties: { title: currentStorageKey.value } } }]
                    })
                })
                if (!addSheetRes.ok) throw new Error('Failed to create new worksheet')
            } else {
                await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(currentStorageKey.value)}:clear`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            }

            const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(safeRange)}?valueInputOption=USER_ENTERED`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ range: safeRange, majorDimension: 'ROWS', values: sheetDataValues })
            })

            if (!updateRes.ok) throw new Error(`Write data error (${updateRes.status})`)
            return true
        }

        const executeExportToSheets = async () => {
            try {
                if (!sheetImportUrl.value || !sheetImportUrl.value.includes('/d/')) {
                    const token = await getValidGoogleToken()
                    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            properties: { title: 'TY-DB' },
                            sheets: [{ properties: { title: currentStorageKey.value } }]
                        })
                    })
                    if (!createRes.ok) throw new Error('Failed to create new spreadsheet')
                    const createData = await createRes.json()
                    sheetImportUrl.value = `https://docs.google.com/spreadsheets/d/${createData.spreadsheetId}/edit`
                }

                await pushToGoogleSheets(sheetImportUrl.value)
                lastSyncDate.value = Date.now()
                localStorage.setItem(`${currentStorageKey.value}_last_sync_time`, lastSyncDate.value.toString())

                showConfirm('🚀 '+ translate('Successfully synced TO Google Sheets!'), 1)

            } catch (error) {
                console.error('Google Sheets Push Error:', error)
                showConfirm(`Sync failed: ${error.message || error}`, 1)
                clearGoogleToken()
            } finally {
                isProcessing.value = 0
            }
        }

        const executeImportFromSheets = async (spreadsheetId) => {
            try {
                const urlToFetch = spreadsheetId
                    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
                    : sheetImportUrl.value

                const cloudData = await fetchGoogleSheetsData(urlToFetch)

                if (!cloudData || cloudData.rows.length === 0) {
                    return showConfirm(translate('No sufficient data found in the spreadsheet!'), 1)
                }

                rows.value = cloudData.rows
                syncMaxRowId()
                onDataEdited('both')

                showConfirm('🎉 '+ translate('Successfully synced data from Google Sheets!'), 1)

            } catch (error) {
                console.error('Google Sheets Import Error:', error)
                showConfirm('Sync failed. You might not have permission, or token expired.', 1)
                clearGoogleToken()
            } finally {
                isProcessing.value = 0
            }
        }

        const initGoogleClient = async () => {
            if (!googleClientId.value.trim()) {
                showConfirm(translate('Please enter Google Client ID.'), 1)
                return false
            }
            if (tokenClient) return true

            let scopes = 'https://www.googleapis.com/auth/spreadsheets'
            if (isCalendarPushEnabled.value) {
                scopes += ' https://www.googleapis.com/auth/calendar.events'
            }

            return new Promise((resolve) => {
                loadScript('https://accounts.google.com/gsi/client')
                    .then(() => {
                        tokenClient = google.accounts.oauth2.initTokenClient({
                            client_id: googleClientId.value.trim(),
                            scope: scopes,
                            callback: (tokenResponse) => {
                                if (tokenResponse && tokenResponse.access_token) {
                                    googleAccessToken.value = tokenResponse.access_token

                                    const expiresInMs = (tokenResponse.expires_in || 3600) * 1000
                                    googleTokenExpiresAt.value = Date.now() + expiresInMs - 120000
                                    localStorage.setItem('TY_GOOGLE_TOKEN_EXPIRES_AT', googleTokenExpiresAt.value.toString())

                                    if (pendingTokenResolve) {
                                        pendingTokenResolve(tokenResponse.access_token)
                                        pendingTokenResolve = null
                                        pendingTokenReject = null
                                    }
                                } else if (tokenResponse && tokenResponse.error) {
                                    console.warn('GIS Token Callback Error:', tokenResponse)
                                    if (pendingTokenReject) {
                                        pendingTokenReject(new Error(tokenResponse.error))
                                        pendingTokenResolve = null
                                        pendingTokenReject = null
                                    }
                                }
                            },
                            error_callback: (err) => {
                                console.error('GIS Client Error:', err)
                                if (pendingTokenReject) {
                                    pendingTokenReject(err)
                                    pendingTokenResolve = null
                                    pendingTokenReject = null
                                }
                            }
                        })
                        resolve(true)
                    })
                    .catch((err) => {
                        console.error('Failed to load Google GIS script:', err)
                        showConfirm(translate('Failed to load Google GIS.'), 1)
                        resolve(false)
                    })
            })
        }

        const requestGisToken = (promptType = '') => {
            return new Promise((resolve, reject) => {
                pendingTokenResolve = resolve
                pendingTokenReject = reject
                tokenClient.requestAccessToken({ prompt: promptType })
            })
        }

        const getValidGoogleToken = async () => {
            const isReady = await initGoogleClient()
            if (!isReady) throw new Error('Google Client not initialized.')

            if (googleAccessToken.value && Date.now() < googleTokenExpiresAt.value) {
                return googleAccessToken.value
            }

            try {
                const token = await requestGisToken('')
                localStorage.setItem('TY_GOOGLE_ACCESS_TOKEN', token)
                return token
            } catch (silentErr) {
                if (silentErr?.type === 'popup_closed') {
                    throw new Error('Google authorization was cancelled or failed.')
                }
                console.warn('Silent token refresh failed, falling back to interactive consent:', silentErr)
            }

            try {
                const token = await requestGisToken('consent')
                localStorage.setItem('TY_GOOGLE_ACCESS_TOKEN', token)
                return token
            } catch (interactiveErr) {
                throw new Error('Google authorization was cancelled or failed.')
            }
        }

        const exportToGoogleSheets = async () => {
            try {
                isProcessing.value = -3
                await executeExportToSheets()
            } catch (err) {
                console.error('Export Action Failed:', err)
            }
        }

        const importFromGoogleSheets = async () => {
            if (!sheetImportUrl.value) return showConfirm(translate('Please enter a Google Sheets URL first!'), 1)
            const match = sheetImportUrl.value.match(/\/d\/([a-zA-Z0-9-_]+)/)
            if (!match) return showConfirm(translate('Invalid Google Sheets URL!'), 1)
            if (!await showConfirm(translate('This will overwrite your current local data. Continue?'))) return

            try {
                isProcessing.value = -4
                await executeImportFromSheets(match[1])
            } catch (err) {
                console.error('Import Action Failed:', err)
            }
        }

        const checkAndAutoSync = async (force = false) => {
            if (isProcessing.value === 1 || !navigator.onLine || !isAutoSyncEnabled.value || !sheetImportUrl.value.trim()) return false

            lastSyncDate.value = parseInt(localStorage.getItem(`${currentStorageKey.value}_last_sync_time`)) || 0

            if (force || (updatedAt.value > lastSyncDate.value && Date.now() > lastSyncDate.value + 86400000)) {
                isProcessing.value = 1

                try {
                    if (!Boolean(googleAccessToken.value && googleTokenExpiresAt.value > 0 && Date.now() < googleTokenExpiresAt.value)) {
                        const isReady = await initGoogleClient()
                        if (!isReady) return false

                        if (!force && !await showConfirm('🔄 ' + translate('Start automatically syncing data from Google Sheets...'))) return false

                        await getValidGoogleToken()
                    } else {
                        showConfirm('🔄 ' + translate('Start automatically syncing data from Google Sheets...'), 1)
                    }

                    const cloudData = await fetchGoogleSheetsData(sheetImportUrl.value)

                    if (cloudData && cloudData.rows && cloudData.rows.length > 0) {
                        const mergedMap = new Map()

                        rows.value.forEach(r => mergedMap.set(String(r.id), r))

                        cloudData.rows.forEach(r => {
                            const existing = mergedMap.get(String(r.id)) || {}
                            mergedMap.set(String(r.id), { ...existing, ...r })
                        })

                        rows.value = Array.from(mergedMap.values())

                        syncMaxRowId()
                    }

                    await pushToGoogleSheets(sheetImportUrl.value)

                    const syncTs = Date.now()
                    lastSyncDate.value = syncTs
                    localStorage.setItem(`${currentStorageKey.value}_last_sync_time`, syncTs.toString())

                } catch (error) {
                    showConfirm('❌ '+ translate('Failed to sync TO Google Sheets!') + error, 1)
                    if (error.message.includes('authorization') || error.message.includes('token')) {
                        clearGoogleToken()
                    }
                    return false
                } finally {
                    isProcessing.value = 0
                }
            }
        }

        const addToCalendar = async (date, title, desc) => {
            if (!navigator.onLine) return
            const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
            const eventBody = {
                summary: title,
                description: desc,
                start: { date: date },
                end: { date: date },
                colorId: '11'
            }

            const token = await getValidGoogleToken()

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventBody)
                })
                const data = await response.json()
                console.log('成功加入日曆！連結：', data.htmlLink)
            } catch (error) {
                console.error('寫入日曆失敗', error)
            }
        }

        const loadData = async (noDefulat = 0) => {
            let hashData = null

            let localData = await db.get(currentStorageKey.value)
            if (localData) {
                if (typeof localData === 'string') {
                    try {
                        localData = JSON.parse(localData)
                        db.set(currentStorageKey.value, localData)
                    } catch (e) {
                        localData = { title: '', columns: [], rows: [], note: '' }
                        console.error('Local data error', e)
                    }
                }
            } else {
                localData = { title: '', columns: [], rows: [], note: '' }
            }

            const hashStr = window.location.hash.slice(1)
            if (hashStr) {
                try {
                    if (hashStr.startsWith('data:')) {
                        const safeBase64 = decodeURIComponent(hashStr.slice(5))
                        const jsonString = await decompressFromBase64(safeBase64)
                        hashData = JSON.parse(jsonString)
                        window.history.replaceState(null, null, '#ws:' + encodeURIComponent(hashData?.workspace || currentStorageKey.value))
                    } else if (hashStr.startsWith('gist:')) {
                        gistId.value = hashStr.slice(5)
                        window.history.replaceState(null, null, '#ws:' + encodeURIComponent(hashData?.workspace || currentStorageKey.value))
                        restoreFromGist()
                        return
                    }
                } catch (e) {
                    console.info('Hash error', e)
                    return
                }
            }

            if (hashData) {
                currentStorageKey.value = hashData.workspace || currentStorageKey.value
                columns.value = (hashData.columns && hashData.columns.length > 0) ? hashData.columns : (localData.columns || [])
                const localRows = localData.rows || []
                const incomingRows = hashData.rows || []

                rows.value = [...localRows, ...incomingRows].map(row => {
                    return { ...row, id: generateId() }
                })

                if (await showConfirm(translate('Do you want to merge duplicates?'))) mergeDuplicates(true)
                showConfirm(translate('Successfully loaded data from the link!'), 1)

            } else if (localData.columns && localData.columns.length > 0) {
                columns.value = localData.columns
                rows.value = localData.rows
            } else if (localData.isBlank) {
                columns.value = []
                rows.value = []
                colCount.value = 0
            } else if (noDefulat) {
                rows.value = []
            } else {
                columns.value = [
                    {id: 'col_1', label: translate('Item'), type: 'category'},
                    {id: 'col_2', label: translate('Price'), type: 'number'},
                    {id: 'col_3', label: translate('Quantity'), type: 'number'},
                    {id: 'col_4', label: translate('Subtotal'), type: 'multiply', opA: 'col_2', opB: 'col_3'}
                ]
                if (currentStorageKey.value === 'ty-db') {
                    rows.value = [{id: 'row_1', col_1: translate('Text'), col_2: 100, col_3: 1, note: '', isExpanded: false}]
                    isChartOpen.value = true
                } else {
                    rows.value = [{id: 'row_1', col_1: '', col_2: 0, col_3: 0, note: '', isExpanded: false}]
                }
                colCount.value = columns.value.length
            }

            hasDateColumn.value = columns.value.some(column => column.type === 'date')
            hasNumberColumn.value = columns.value.some(column => column.type === 'number')
            globalNotes.value = hashData?.note || localData.note || ''
            updatedAt.value = hashData?.updatedAt || localData?.updatedAt
            categoryBudgets.value = hashData?.budgets || localData.budgets || {}

            if (!colCount.value || colCount.value < columns.value.length) colCount.value = columns.value.length

            updateColumns()
            updateTitle()
            syncMaxRowId()
            onDataEdited('both')

            const seenIds = new Set()
            let hasFixed = false

            rows.value.forEach(row => {
                if (!row.id || seenIds.has(row.id)) {
                    row.id = generateId()
                    hasFixed = true
                }
                seenIds.add(row.id)
            })

            if (hasFixed) {
                debouncedSave()
            }

            await nextTick()
            restoreScrollPosition()
        }

        const startDragging = (type, identifier, event) => {
            if (window.matchMedia("(max-width: 768px) and (orientation: portrait)").matches) return
            const isCol = type === 'columns'
            dragSource = {
                id: isCol ? null : identifier,
                index: isCol ? identifier : -1,
                element: event.target.closest(isCol ? 'th' : 'tr'),
                type
            }
            document.body.classList.add('select-none')
            if (isCol) document.body.classList.add('cursor-col-resize')
            if (dragSource.element) {
                dragSource.element.classList.add('opacity-50', 'bg-indigo-50')
                if (!isCol) dragSource.element.classList.add('shadow-lg')
            }
            window.addEventListener('pointermove', handleDragging, { passive: false })
            window.addEventListener('pointerup', stopDragging)
            window.addEventListener('pointercancel', stopDragging)
        }

        const handleDragging = async (event) => {
            const { type, id, index } = dragSource
            if ((type === 'rows' ? !id : index === -1) || isSwapping) return

            event.preventDefault()
            const target = document.elementFromPoint(event.clientX, event.clientY)
            if (!target) return

            const isCol = type === 'columns'
            const targetContainer = target.closest(isCol ? 'th[data-col-index]' : 'tr[data-id]')
            if (!targetContainer) return

            const targetId = isCol ? parseInt(targetContainer.dataset.colIndex, 10) : targetContainer.dataset.id
            const sourceId = isCol ? dragSource.index : dragSource.id

            if (targetId !== undefined && String(targetId) !== String(sourceId)) {
                const dataList = type === 'rows' ? rows : columns
                const sourceIdx = isCol ? dragSource.index : dataList.value.findIndex(r => String(r.id) === String(sourceId))
                const targetIdx = isCol ? targetId : dataList.value.findIndex(r => String(r.id) === String(targetId))
                if (sourceIdx !== -1 && targetIdx !== -1) {
                    isSwapping = true
                    const newList = [...dataList.value]
                    const [movedItem] = newList.splice(sourceIdx, 1)
                    newList.splice(targetIdx, 0, movedItem)
                    dataList.value = newList
                    if (isCol) dragSource.index = targetIdx
                    onDataEdited(type)
                    await nextTick()
                    isSwapping = false
                }
            }
        }

        const stopDragging = () => {
            if (dragSource.element) {
                dragSource.element.classList.remove('opacity-50', 'bg-indigo-50', 'shadow-lg')
            }
            document.body.classList.remove('select-none', 'cursor-col-resize')
            window.removeEventListener('pointermove', handleDragging)
            window.removeEventListener('pointerup', stopDragging)
            window.removeEventListener('pointercancel', stopDragging)
            dragSource = { id: null, index: -1, element: null, type: null }
            isSwapping = false
        }

        const addColumn = async () => {
            if (!newColLabel.value.trim()) return showConfirm(translate('Please enter a column name!'), 1)
            const existingCol = columns.value.find(col => col.label.toLowerCase() === newColLabel.value.toLowerCase())
            if (existingCol && await showConfirm(translate('This column already exists. Do you want to overwrite it?'))) {
                existingCol.type = newColType.value
                if (isCalcType(newColType.value) && newColType.value !== 'multiply3') {
                    existingCol.opA = formulaA.value
                    existingCol.opB = formulaB.value
                }
                else if (newColType.value === 'multiply3') {
                    existingCol.opA = formulaA.value
                    existingCol.opB = formulaB.value
                    existingCol.opC = formulaC.value
                }
                onDataEdited('both')
                return
            }
            if (isCalcType(newColType.value)) {
                if (newColType.value === 'multiply3' && !formulaC.value) return showConfirm(translate('Please select columns A, B and C!'), 1)
                else if (!formulaA.value || !formulaB.value) return showConfirm(translate('Please select columns A and B!'), 1)
                if (
                    formulaA.value === formulaB.value ||
                    (newColType.value === 'multiply3' && (formulaA.value === formulaC.value || formulaB.value === formulaC.value))
                ) {
                    return showConfirm(translate('Source columns cannot be the same!'), 1)
                }
            }

            if (!colCount.value || colCount.value < columns.value.length) colCount.value = columns.value.length
            colCount.value++
            const newColId = `col_${colCount.value}`
            const newColData = { id: newColId, label: newColLabel.value.trim(), type: newColType.value }
            if (isCalcType(newColType.value) && newColType.value !== 'multiply3') {
                newColData.opA = formulaA.value
                newColData.opB = formulaB.value
            }
            else if (newColType.value === 'multiply3') {
                newColData.opA = formulaA.value
                newColData.opB = formulaB.value
                newColData.opC = formulaC.value
            }

            columns.value = [...columns.value, newColData]
            if (!isCalcType(newColType.value)) {
                rows.value.forEach(row => {
                    if (newColType.value === 'number') row[newColId] = null
                    else if (newColType.value === 'checkbox') row[newColId] = false
                    else if (newColType.value === 'photo' || newColType.value === 'tags') row[newColId] = []
                    else if (newColType.value === 'rating' || newColType.value === 'progress') row[newColId] = 0
                    else if (newColType.value === 'color') row[newColId] = '#3b82f6'
                    else row[newColId] = ''
                })
            }
            updateColumns()
            onDataEdited('both')
            newColLabel.value = ''
            newColType.value = 'text'
            formulaA.value = ''
            formulaB.value = ''
            formulaC.value = ''
            if (newColData.type === 'date') hasDateColumn.value = true
        }

        const getDate = () => {
            const now = new Date()
            const localOffset = now.getTimezoneOffset() * 60000
            const localDate = new Date(now.getTime() - localOffset)
            return {todayDate: localDate.toISOString().slice(0, 10), currentTime: localDate.toISOString().slice(11, 16)}
        }

        const scrollToPosition = async (direction) => {
            if (!tableContainer.value) return
            if (direction === 'top') {
                tableContainer.value.scrollTop = 0
                return
            }

            await nextTick()
            tableContainer.value.scrollTop = tableContainer.value.scrollHeight
        }

        const addRow = async () => {

            const newRowId = generateId()
            const newRow = {id: newRowId, note: '', isExpanded: areAllExpanded.value}
            const {todayDate, currentTime} = getDate()
            const isAppending = !activeMenuRow.value

            columns.value.forEach(col => {
                if (col.type === 'date') newRow[col.id] = todayDate
                else if (col.type === 'time') newRow[col.id] = currentTime
                else if (col.type === 'photo' || col.type === 'tags') newRow[col.id] = []
                else if (col.type === 'rating' || col.type === 'progress') newRow[col.id] = 0
                else if (col.type === 'color') newRow[col.id] = '#3b82f6'
                else if (col.type === 'checkbox') newRow[col.id] = false
                else if (!isCalcType(col.type)) newRow[col.id] = col.type === 'number' ? null : ''
            })

            Object.keys(columnFilters.value).forEach(key => columnFilters.value[key] = '')

            if (activeMenuRow.value && activeMenuRow.value.id) {
                const index = rows.value.findIndex(r => r.id === activeMenuRow.value.id)
                if (index !== -1) {
                    rows.value = [
                        ...rows.value.slice(0, index + 1),
                        newRow,
                        ...rows.value.slice(index + 1)
                    ]
                } else {
                    rows.value = [...rows.value, newRow]
                }
                activeMenuRow.value = null
            } else {
                rows.value = [...rows.value, newRow]
            }
            onDataEdited()
            if (isAppending) {
                const total = rows.value.length
                windowEnd.value = total
                windowStart.value = Math.max(0, total - 50)

                if (tableContainer.value) {
                    tableContainer.value.scrollTop = tableContainer.value.scrollHeight
                }
            } else {
                windowEnd.value += 1
            }

            await nextTick()
            const firstInputCol = columns.value.find(col => editableTypes.has(col.type))
            if (firstInputCol) {
                const targetInput = inputRefs.value[`${newRowId}-${firstInputCol.id}`]
                if (targetInput) {
                    targetInput.focus({ preventScroll: true })
                    if (scrollTimer) clearTimeout(scrollTimer)
                    scrollTimer = setTimeout(() => {
                        targetInput.scrollIntoView({ behavior: 'instant', block: 'center' })
                        if (firstInputCol.type === 'category') {
                            const reactiveRow = rows.value.find(r => r.id === newRowId)
                            if (reactiveRow) {
                                openGlobalMenu(null, reactiveRow, firstInputCol)
                            }
                        }
                    }, 50)
                }
            }
        }

        const formatNumberInput = (row, col) => {
            if (col.type === 'number' && row[col.id] != null) {
                const rawStr = String(row[col.id])
                let valStr = rawStr
                const matches = valStr.match(/[0-9+\-*/.%()^]+/g)
                if (matches) valStr = matches.join('+')
                const cleaned = valStr.replaceAll(/[^0-9+\-*/.%()^]/g, '')
                row[col.id] = cleaned
                if (cleaned !== rawStr) {
                    const inputEl = inputRefs.value[`${row.id}-${col.id}`]
                    if (inputEl) inputEl.value = cleaned
                }
            }
        }

        const adjustNumber = (row, colId, delta) => {
            let currentVal = parseFloat(row[colId])
            if (isNaN(currentVal)) currentVal = 0
            let newVal = currentVal + delta
            newVal = Number(newVal.toFixed(4))
            row[colId] = String(newVal)
            triggerRef(rows)
        }

        const evaluateMathExpression = (expr) => {
            const tokens = []
            let i = 0
            while (i < expr.length) {
                const ch = expr[i]
                if (/\s/.test(ch)) {
                    i++
                    continue
                }
                if (/[0-9.]/.test(ch)) {
                    const match = expr.slice(i).match(/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/)
                    if (!match) return NaN
                    tokens.push({ type: 'num', value: Number(match[0]) })
                    i += match[0].length
                    continue
                }
                if (ch === '*' && expr[i + 1] === '*') {
                    tokens.push({ type: 'op', value: '**' })
                    i += 2
                    continue
                }
                if ('+-*/%^()'.includes(ch)) {
                    tokens.push({ type: 'op', value: ch })
                    i++
                    continue
                }
                return NaN
            }
            if (tokens.length === 0) return NaN

            let pos = 0
            const peek = () => tokens[pos]
            const consume = () => tokens[pos++]

            const parseExpr = () => {
                let left = parseTerm()
                while (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
                    const op = consume().value
                    const right = parseTerm()
                    left = op === '+' ? left + right : left - right
                }
                return left
            }

            const parseTerm = () => {
                let left = parseFactor()
                while (peek()?.type === 'op' && (peek().value === '*' || peek().value === '/' || peek().value === '%')) {
                    const op = consume().value
                    const right = parseFactor()
                    if (op === '*') left *= right
                    else if (op === '/') left /= right
                    else left %= right
                }
                return left
            }

            const parseFactor = () => {
                if (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
                    const op = consume().value
                    const val = parseFactor()
                    return op === '-' ? -val : val
                }
                return parsePower()
            }

            const parsePower = () => {
                const base = parsePrimary()
                if (peek()?.type === 'op' && (peek().value === '^' || peek().value === '**')) {
                    consume()
                    const exp = parseFactor()
                    return Math.pow(base, exp)
                }
                return base
            }

            const parsePrimary = () => {
                const token = peek()
                if (!token) return NaN
                if (token.type === 'num') {
                    consume()
                    return token.value
                }
                if (token.type === 'op' && token.value === '(') {
                    consume()
                    const val = parseExpr()
                    if (peek()?.type !== 'op' || peek().value !== ')') return NaN
                    consume()
                    return val
                }
                return NaN
            }

            const result = parseExpr()
            return pos === tokens.length ? result : NaN
        }

        const calculateInlineMath = (safeString) => {
            if (safeString === null || safeString === undefined || safeString === '') return ''
            const originalString = String(safeString)
            const normalized = originalString.replaceAll(/%(?![0-9(eE])/g, '/100')
            const result = evaluateMathExpression(normalized)
            if (!Number.isFinite(result)) return originalString
            return Number(result.toFixed(0))
        }

        const calcValue = (val) => {
            if (val === null || val === undefined || val === '') return 0
            if (typeof val === 'number') return val
            const strVal = String(val).trim().replace(/[+\-*/.]+$/, '')
            try {
                const res = calculateInlineMath(strVal)
                return Number(res) || 0
            } catch (e) {
                return 0
            }
        }

        const scrollToActive = async () => {
            await nextTick()
            const activeEl = document.querySelector('.dropdown-active-item')
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest' })
            }
        }

        const focusNextInput = async (event, rowId, colId) => {
            if (event.isComposing) return
            const allowedKeys = ['Enter', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Backspace']

            if (event.key === 'Escape') {
                activeRow.value = null
                activeDropdownIndex.value = -1
                return
            }

            if (!allowedKeys.includes(event.key)) return

            const isDropdownActive = activeRow.value !== null
            const options = isDropdownActive ? getUniqueValues(activeRow.value.col.id) : []

            if (isDropdownActive && options.length > 0) {
                if (event.key === 'ArrowDown') {
                    event.preventDefault()
                    activeDropdownIndex.value = (activeDropdownIndex.value + 1) % options.length
                    scrollToActive()
                    return
                }
                else if (event.key === 'ArrowUp') {
                    event.preventDefault()
                    activeDropdownIndex.value = activeDropdownIndex.value <= 0 ? options.length - 1 : activeDropdownIndex.value - 1
                    scrollToActive()
                    return
                }
                else if (event.key === 'Enter' && activeDropdownIndex.value >= 0) {
                    event.preventDefault()
                    selectOption(options[activeDropdownIndex.value])
                    activeDropdownIndex.value = -1
                    return
                }
            }

            const target = event.target
            const currentIndex = columns.value.findIndex(col => col.id === colId)
            const firstEditableCol = columns.value.findIndex(c => editableTypes.has(c.type))

            if (event.key === 'Backspace') {
                if (currentIndex === firstEditableCol && target.value === '') {
                    event.preventDefault()

                    if (rows.value.length > 1) {
                        const currentRowIndex = rows.value.findIndex(row => row.id === rowId)
                        const nextFocusRow = rows.value[currentRowIndex - 1] || rows.value[currentRowIndex + 1]
                        if (await showConfirm(translate('Are you sure you want to delete this row?'))) {
                            removeRow(rowId)
                            await nextTick()
                            if (nextFocusRow) {
                                inputRefs.value[`${nextFocusRow.id}-${colId}`]?.focus({ preventScroll: true })
                            }
                        }
                    }
                }
                return
            }

            let direction = 1
            let isHorizontal = false
            let isVertical = false
            let shouldMove = false

            tempKey.value = target.value

            if (event.key === 'ArrowLeft') {
                if (target.selectionStart > 0) return
                direction = -1
                isHorizontal = true
                shouldMove = true
            } else if (event.key === 'ArrowRight') {
                if (target.selectionEnd < target.value.length) return
                isHorizontal = true
                shouldMove = true
            } else if (event.key === 'Enter') {
                direction = event.shiftKey ? -1 : 1
                isVertical = true
                shouldMove = true
                if (columns.value[currentIndex].type === 'number') {
                    const row = rows.value.find(r => r.id === rowId)
                    row[colId] = calculateInlineMath(event.target.value)
                    target.value = row[colId]
                    target.dispatchEvent(new Event('input'))
                }
            } else if (event.key === 'ArrowUp') {
                direction = -1
                isVertical = true
                if (!['date', 'time', 'number'].includes(columns.value[currentIndex].type)) shouldMove = true
                if (columns.value[currentIndex].type === 'number') adjustNumber(rows.value.find(r => r.id === rowId), colId, 1)
            } else if (event.key === 'ArrowDown') {
                isVertical = true
                if (!['date', 'time', 'number'].includes(columns.value[currentIndex].type)) shouldMove = true
                if (columns.value[currentIndex].type === 'number') adjustNumber(rows.value.find(r => r.id === rowId), colId, -1)
            }

            if (!shouldMove) return

            event.preventDefault()

            if (isHorizontal) {
                let nextIndex = currentIndex

                for (const _ of columns.value) {
                    nextIndex += direction

                    if (event.shiftKey || nextIndex >= columns.value.length) {
                        if (event.key === 'Enter') {
                            addRow()
                            await nextTick()
                            const newRowId = rows.value[rows.value.length - 1].id
                            const firstCol = columns.value.find(c => editableTypes.has(c.type))
                            if (firstCol) {
                                const nextInput = inputRefs.value[`${newRowId}-${firstCol.id}`]
                                if (nextInput) {
                                    nextInput.focus()
                                    nextInput.select()
                                }
                            }
                            return
                        }
                        nextIndex = 0
                    } else if (nextIndex < 0) {
                        nextIndex = columns.value.length - 1
                    }

                    const nextCol = columns.value[nextIndex]
                    if (editableTypes.has(nextCol.type)) {
                        const nextInput = inputRefs.value[`${rowId}-${nextCol.id}`]
                        if (nextInput) {
                            nextInput.focus()
                            await nextTick()
                            nextInput.select()
                        }
                        break
                    }
                }
            }
            else if (isVertical) {
                const currentRowIndex = filteredRows.value.findIndex(r => r.id === rowId)
                const nextRowIndex = currentRowIndex + direction

                if (event.key === 'Enter' && direction > 0 && nextRowIndex >= filteredRows.value.length && !isAnyFilterActive.value) {
                    addRow()
                    await nextTick()
                    const newRowIndex = filteredRows.value.length - 1
                    const newRowId = filteredRows.value[newRowIndex]?.id
                    if (newRowId) {
                        startCell.value = { row: newRowIndex, col: currentIndex }
                        endCell.value = { row: newRowIndex, col: currentIndex }
                        const nextInput = inputRefs.value[`${newRowId}-${colId}`]
                        if (nextInput) {
                            nextInput.focus()
                            await nextTick()
                            nextInput.select?.()
                        }
                    }
                    return
                }

                if (nextRowIndex >= 0 && nextRowIndex < filteredRows.value.length) {
                    const nextRowId = filteredRows.value[nextRowIndex].id
                    startCell.value = { row: nextRowIndex, col: currentIndex }
                    endCell.value = { row: nextRowIndex, col: currentIndex }
                    const nextInput = inputRefs.value[`${nextRowId}-${colId}`]
                    if (nextInput) {
                        nextInput.focus()
                        await nextTick()
                        nextInput.select?.()
                    }
                }
            }
        }

        const removeColumn = async (idToRemove) => {
            if (columns.value.some(col => isCalcType(col.type) && (col.opA === idToRemove || col.opB === idToRemove || col.opC === idToRemove))) {
                return showConfirm(translate("Cannot delete! Other 'Calculate' columns depend on this."), 1)
            }
            if (!await showConfirm(translate("Are you sure you want to delete this column?"))) return

            columns.value = columns.value.filter(col => col.id !== idToRemove).map(col => toRaw(col))
            if (!columns.value.length) colCount.value = 0
            updateColumns()
            rows.value.forEach(row => delete row[idToRemove])
            onDataEdited()
        }

        const copyRow = async (ignoreDate = 0) => {
            if (!activeMenuRow.value) return
            const index = rows.value.findIndex(row => row.id === activeMenuRow.value.id)
            const originalRow = rows.value[index]
            closeActionMenu()

            if (!originalRow) return

            const clonedRow = structuredClone(originalRow)
            clonedRow.id = generateId()
            const isAppendToEnd = ignoreDate || !columns.value.some(col => col.type === 'date')

            if (isAppendToEnd) {
                const {todayDate, currentTime} = getDate()
                for (const column of columns.value) {
                    if (column.type === 'date') clonedRow[column.id] = todayDate
                    else if (column.type === 'time') clonedRow[column.id] = currentTime
                }
                rows.value = [...rows.value, clonedRow]
            } else {
                rows.value = [
                    ...rows.value.slice(0, index + 1),
                    clonedRow,
                    ...rows.value.slice(index + 1)
                ]
            }

            onDataEdited()
            if (isAppendToEnd) {
                const total = rows.value.length
                windowEnd.value = total
                windowStart.value = Math.max(0, total - 50)

                await nextTick()
                if (tableContainer.value) {
                    tableContainer.value.scrollTop = tableContainer.value.scrollHeight
                }
            } else {
                windowEnd.value += 1
            }
            await nextTick()
            const firstEditableCol = columns.value.find(c => editableTypes.has(c.type))
            if (firstEditableCol) {
                setTimeout(() => {
                    const targetInput = inputRefs.value[`${clonedRow.id}-${firstEditableCol.id}`]
                    if (targetInput) {
                        targetInput.focus({ preventScroll: !ignoreDate })
                        targetInput.select()
                    }
                }, 150)
            }
        }

        const removeRow = (idToRemove) => {
            if (!idToRemove) idToRemove = activeMenuRow.value?.id
            if (!idToRemove) return
            rows.value = rows.value.filter(row => row.id !== idToRemove).map(row => toRaw(row))
            onDataEdited()
            closeActionMenu()
        }

        const compressToBase64 = async (text) => {
            const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate'))
            const compressedBlob = await new Response(stream).blob()
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    resolve(reader.result.split(',')[1])
                }
                reader.readAsDataURL(compressedBlob)
            })
        }

        const downloadFile = (fileContent) => {
            const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
            const blob = new Blob([bom, fileContent], { type: `text/${outputType.value};charset=utf-8;` })

            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            const nowDate = new Date().toISOString().slice(0, 10)
            link.download = `${currentStorageKey.value}_${nowDate}.${outputType.value}`
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            link.remove()
            setTimeout(() => URL.revokeObjectURL(url), 1000)
        }

        const getCleanData = () => rows.value.map(row => {
            const cleanRow = {}
            columns.value.forEach(col => {
                if (col.type === 'number') {
                    cleanRow[col.label] = row[col.id] || 0
                } else if (isCalcType(col.type)) {
                    cleanRow[col.label] = getRowNumericValue(row, col)
                } else if (col.type === 'checkbox') {
                    cleanRow[col.label] = row[col.id] ? 1 : 0
                } else if (col.type === 'rating') {
                    cleanRow[col.label] = Math.min(5, Math.max(0, Math.round(Number(row[col.id]) || 0)))
                } else if (col.type === 'progress') {
                    cleanRow[col.label] = clampProgress(row[col.id])
                } else if (col.type === 'tags') {
                    cleanRow[col.label] = normalizeTags(row[col.id])
                } else if (col.type === 'date' || col.type === 'time') {
                    cleanRow[col.label] = row[col.id] || ''
                } else {
                    cleanRow[col.label] = row[col.id] || ''
                }
            })
            cleanRow[translate('Note')] = row.note?.trim() || ''
            return cleanRow
        })

        const exportJson = () => {

            const payload = {
                title: currentStorageKey.value,
                columns: columns.value,
                rows: getCleanData(),
                note: globalNotes.value,
                budgets: categoryBudgets.value
            }

            outputToScreen.value = JSON.stringify(payload, null, 2)
            outputType.value = 'json'
        }

        const exportCsv = () => {
            const escapeCsv = (val) => {
                if (val === null || val === undefined) return ''
                const str = String(val)
                if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str.replaceAll('"', '""')}"`
                return str
            }

            let csvContent = ""

            const schemaHeaders = columns.value.map(c => {
                let meta = c.type
                if (isCalcType(c.type)) {
                    const colA = columns.value.find(col => col.id === c.opA)
                    const colB = columns.value.find(col => col.id === c.opB)
                    meta += `|${colA?.label || ''}|${colB?.label || ''}`
                    if (c.type === 'multiply3') {
                        const colC = columns.value.find(col => col.id === c.opC)
                        meta += `|${colC?.label || ''}`
                    }
                }
                return `${c.label} [${meta}]`
            })

            const headers = ['#', ...schemaHeaders, translate('Note')]
            csvContent += headers.map(escapeCsv).join(',') + '\n'

            rows.value.forEach((row, idx) => {
                const rowData = [idx + 1]
                columns.value.forEach(col => {
                    if (col.type === 'number') {
                        rowData.push(row[col.id])
                    } else if (isCalcType(col.type)) {
                        rowData.push(getRowNumericValue(row, col))
                    } else if (col.type === 'checkbox') {
                        rowData.push(row[col.id] ? 1 : 0)
                    } else if (col.type === 'rating') {
                        rowData.push(Math.min(5, Math.max(0, Math.round(Number(row[col.id]) || 0))))
                    } else if (col.type === 'progress') {
                        rowData.push(clampProgress(row[col.id]))
                    } else if (col.type === 'tags') {
                        rowData.push(normalizeTags(row[col.id]).join(', '))
                    } else {
                        rowData.push(row[col.id] || '')
                    }
                })
                rowData.push(row.note || '')
                csvContent += rowData.map(escapeCsv).join(',') + '\n'
            })

            const totalRow = [translate('Total')]
            columns.value.forEach(col => {
                if (isNumericType(col.type)) totalRow.push(columnTotals.value[col.id] || 0)
                else totalRow.push('')
            })
            totalRow.push('')
            csvContent += totalRow.map(escapeCsv).join(',') + '\n'
            outputToScreen.value = csvContent
            outputType.value = 'csv'
        }

        const clearStorage = async () => {
            if(await showConfirm(translate('Are you sure you want to clear all data?') +' '+ currentStorageKey.value)) {
                localStorage.removeItem(`${currentStorageKey.value}_scrollTop`)
                await db.remove(currentStorageKey.value)

                if (rows.value.length === 0) {
                    savedKeysList.value = savedKeysList.value.filter(key => key !== currentStorageKey.value)
                    if (savedKeysList.value.length === 0) savedKeysList.value = ['ty-db']
                    localStorage.setItem('TY_TABLE_MASTER_KEY_LIST', JSON.stringify(savedKeysList.value))
                    currentStorageKey.value = savedKeysList.value[0]
                    colCount.value = 0
                    columns.value = []
                }

                rows.value = []
                window.history.replaceState(null, null, '#ws:' + encodeURIComponent(currentStorageKey.value))
                heightCache = {}
                windowStart.value = 0
                releaseFilterLayoutLock()
                isFilterFocused.value = false
                windowEnd.value = 50
                paddingTop.value = 0
                paddingBottom.value = 0

                if (tableContainer.value) {
                    tableContainer.value.scrollTop = 0
                }
                await loadData(1)
                if (tableContainer.value) {
                    handleTableScroll({ target: tableContainer.value })
                }

            }
        }

        const startEditingCol = async (colId) => {
            editingColId.value = colId
            await nextTick()
            const input = document.getElementById(`edit-col-${colId}`)
            if (input) {
                input.focus()
                input.select()
            }
        }

        const stopEditingCol = () => {
            const col = columns.value.find(c => c.id === editingColId.value)
            if (col && !col.label.trim()) {
                col.label = translate('Column Name')
            }
            editingColId.value = null
            onDataEdited('columns')
        }

        const processImportText = async(rawText) => {
            let dataList = []
            let isJSON = false
            let parsedColumnMeta = {}

            try {
                const trimmedText = rawText.trim()
                if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
                    const parsed = JSON.parse(rawText)
                    if (parsed.columns && parsed.rows) {
                        parsed.columns.forEach(c => { parsedColumnMeta[c.label] = c })
                    }
                    dataList = Array.isArray(parsed) ? parsed : (parsed.rows || parsed.data || [])
                    isJSON = true
                }
            } catch(e) {
            }

            if (!isJSON) {
                const lines = rawText.split(/\r?\n/).filter(l => l.trim() !== '')
                if (lines.length > 1) {
                    const separator = lines[0].includes('\t') ? '\t' : ','
                    const re = new RegExp(`${separator}(?=(?:(?:[^"]*"){2})*[^"]*$)`)
                    const parseCSVLine = (text) => {
                        return text.split(re).map(v => {
                            let s = v.trim()
                            if(s.startsWith('"') && s.endsWith('"')) s = s.substring(1, s.length - 1).replaceAll('""', '"')
                            return s
                        })
                    }

                    let rawHeaders = parseCSVLine(lines[0])
                    const headers = rawHeaders.map(h => {
                        const match = h.match(/(.+) \[([^\]]+)\]$/)
                        if (match) {
                            const label = match[1].trim()
                            const meta = match[2]
                            parsedColumnMeta[label] = { type: meta }
                            return label
                        }
                        return h
                    })

                    for (let i = 1; i < lines.length; i++) {
                        const values = parseCSVLine(lines[i])
                        let obj = {}
                        headers.forEach((h, idx) => { obj[h] = values[idx] })
                        dataList.push(obj)
                    }
                }
            }

            if(dataList.length === 0) return 0

            const allKeys = new Set()
            dataList.forEach(item => Object.keys(item).forEach(k => allKeys.add(k)))

            const ignoreKeys = new Set(['#', translate('Total'), 'Total'])
            let dateColId

            allKeys.forEach(key => {
                if (ignoreKeys.has(key)) return
                if (key === translate('Note')) return

                let existingCol = columns.value.find(c => c.label === key)
                if (!existingCol) {
                    let targetType, targetOpA = null, targetOpB = null, targetOpC = null

                    if (parsedColumnMeta[key]) {
                        const metaStr = parsedColumnMeta[key].type
                        const parts = metaStr.split('|')
                        if (isCalcType(parts[0])) {
                            targetType = parts[0]
                            targetOpA = columns.value.find(col => col.label === parts[1])?.id
                            targetOpB = columns.value.find(col => col.label === parts[2])?.id
                            if (parts[0] === 'multiply3' && parts.length === 4) {
                                targetOpC = columns.value.find(col => col.label === parts[3])?.id
                            }
                        } else {
                            targetType = metaStr
                        }
                    } else if (key.toLowerCase().includes(translate('Date').toLowerCase())) {
                        targetType = 'date'
                    } else if (key.toLowerCase().includes(translate('Time').toLowerCase())) {
                        targetType = 'time'
                    } else if (key.toLowerCase().includes(translate('Checkbox').toLowerCase())) {
                        targetType = 'checkbox'
                    } else if (key.toLowerCase().includes(translate('number'))) {
                        targetType = 'text'
                    } else {
                        let isAllNumbers = dataList.every(item => !item[key] || !isNaN(parseFloat(item[key])))
                        targetType = isAllNumbers ? 'number' : 'text'
                    }

                    if (!colCount.value || colCount.value < columns.value.length) colCount.value = columns.value.length
                    colCount.value++
                    columns.value.push({
                        id: 'col_' + colCount.value,
                        label: key,
                        type: targetType,
                        opA: targetOpA,
                        opB: targetOpB,
                        opC: targetOpC
                    })
                }
            })

            let addCount = 0
            const newRows = []
            dataList.forEach(item => {
                if (item['#'] === translate('Total') || item[Object.keys(item)[0]] === translate('Total')) return
                const newRow = { id: generateId() }
                columns.value.forEach(col => {
                    const val = item[col.label]
                    if (val !== undefined && val !== null && val !== '') {
                        if (isNumericType(col.type)) {
                            newRow[col.id] = val
                            hasNumberColumn.value = true
                        } else if (col.type === 'checkbox') {
                            newRow[col.id] = val === true || val === 1 || ['true', '1', 'yes'].includes(String(val).trim().toLowerCase())
                        } else if (col.type === 'rating') {
                            newRow[col.id] = Math.min(5, Math.max(0, Math.round(Number(val) || 0)))
                        } else if (col.type === 'progress') {
                            newRow[col.id] = clampProgress(val)
                        } else if (col.type === 'tags') {
                            newRow[col.id] = normalizeTags(val)
                        } else if (col.type === 'date') {
                            newRow[col.id] = formatDate(val)
                            if (!dateColId) dateColId = col.id
                            hasDateColumn.value = true
                        } else if (col.type === 'time') {
                            newRow[col.id] = formatTime(val)
                        } else {
                            newRow[col.id] = String(val)
                        }
                    } else if (col.type === 'checkbox') {
                        newRow[col.id] = false
                    } else if (col.type === 'number') {
                        newRow[col.id] = 0
                        hasNumberColumn.value = true
                    } else if (col.type === 'rating' || col.type === 'progress') {
                        newRow[col.id] = 0
                    } else if (col.type === 'tags' || col.type === 'photo') {
                        newRow[col.id] = []
                    } else if (col.type === 'color') {
                        newRow[col.id] = '#3b82f6'
                    } else {
                        newRow[col.id] = ''
                    }
                })

                newRows.push(newRow)
                addCount++

            })

            rows.value = [...rows.value, ...newRows]

            if (dateColId) {
                hasDateColumn.value = true
                rows.value.sort((a, b) => {
                    const aDate = new Date(a[dateColId])
                    const bDate = new Date(b[dateColId])
                    return aDate - bDate
                })
            }
            return addCount
        }

        const triggerFileUpload = () => {
            if (fileInput.value) {
                fileInput.value.click()
            }
        }

        const handleFileUpload = async (event) => {
            const files = event.target.files
            if (!files || !files.length) return

            isProcessing.value = 1

            try {
                let addCount = 0
                for (const file of files) {
                    const text = await file.text()
                    addCount += await processImportText(text)
                }
                if (addCount > 0) {
                    onDataEdited('both')
                    await nextTick()
                    heightCache = {}
                    windowStart.value = 0
                    windowEnd.value = Math.min(50, rows.value.length)
                    paddingTop.value = 0
                    paddingBottom.value = 0

                    if (tableContainer.value) {
                        tableContainer.value.scrollTop = 0
                        handleTableScroll({ target: tableContainer.value })
                    }
                    showConfirm(`${translate('Imported items successfully!')} (${addCount})`, 1)
                }
            } catch (error) {
                console.error(error)
                showConfirm(translate('Failed to read file.'), 1)
            } finally {
                event.target.value = ''
                isProcessing.value = 0
            }
        }

        const initChartColumns = () => {
            const catExists = columns.value.some(c => c.id === selectedChartCatColId.value)
            const numExists = columns.value.some(c => c.id === selectedChartNumColId.value)
            if (!catExists) {
                const defaultCat = columns.value.find(c => c.type === 'category') || columns.value.find(c => c.type === 'text')
                selectedChartCatColId.value = defaultCat ? defaultCat.id : null
            }
            if (!numExists) {
                const defaultNum = columns.value.find(c => isCalcType(c.type)) || columns.value.find(c => c.type === 'number')
                selectedChartNumColId.value = defaultNum ? defaultNum.id : null
            }
        }

        const toggleChart = () => {
            if (!columns.value.length) return
            lockedChartMinHeight.value = 0
            isChartOpen.value = !isChartOpen.value
            isChartOpen.value ? localStorage.setItem('ty_chart_open', 1) : localStorage.removeItem('ty_chart_open')
            if (isChartOpen.value) {
                debouncedUpdateChart.cancel()
                debouncedUpdateChart()
                if (expenseChart.value) expenseChart.value.resize()
            }
        }

        const getChartData = () => {
            const numCol = columns.value.find(c => c.id === selectedChartNumColId.value) || columns.value.find(c => c.type?.startsWith('number'))
            if (!numCol) return null
            selectedChartNumColId.value = numCol.id

            const colId = selectedChartCatColId.value
            if (!colId) return null

            const dateColIdForFilter = selectedChartDateColId.value || columns.value.find(c => c.type === 'date')?.id

            const totals = {}
            const counts = {}
            chartBaseRows.value.forEach(row => {
                if (dateColIdForFilter && row[dateColIdForFilter]) {
                    const dateObj = new Date(row[dateColIdForFilter])
                    if (!isNaN(dateObj.getTime())) {
                        const m = dateObj.getMonth() + 1
                        const mFilter = monthFilters.value.find(x => x.month === m)
                        if (mFilter && !mFilter.active) return

                        const y = dateObj.getFullYear()
                        const yFilter = yearFilters.value.find(x => x.year === y)
                        if (yFilter && !yFilter.active) return
                    }
                }

                const rawVal = row[colId]
                const label = rawVal && String(rawVal).trim() !== ''
                    ? String(rawVal).trim()
                    : translate('Uncategorized')

                const val = getRowNumericValue(row, numCol)

                if (val !== 0) {
                    const budgetConfig = categoryBudgets.value[label]
                    const isExpense = !budgetConfig || budgetConfig.type === 'expense'
                    const adjustedVal = isExpense ? -Math.abs(val) : Math.abs(val)

                    totals[label] = (totals[label] || 0) + adjustedVal
                    counts[label] = (counts[label] || 0) + 1
                }
            })

            categoryCounts.value = counts

            return totals
        }

        const getTrendChartData = (topCategoriesSet) => {
            const numCol = columns.value.find(c => c.id === selectedChartNumColId.value)
            const dateColId = selectedChartDateColId.value
            const catColId = selectedChartCatColId.value

            if (!numCol || !dateColId) return null

            const trendData = {}
            const allCategories = new Set()
            const otherLabel = translate('Others')
            let totalBudgetAmount = 0

            coreFilteredRows.value.forEach(row => {
                const dateVal = row[dateColId]
                if (!dateVal) return
                const dateObj = new Date(dateVal)
                if (!isNaN(dateObj.getTime())) {
                    const m = dateObj.getMonth() + 1
                    const mFilter = monthFilters.value.find(x => x.month === m)
                    if (mFilter && !mFilter.active) return

                    const y = dateObj.getFullYear()
                    const yFilter = yearFilters.value.find(x => x.year === y)
                    if (yFilter && !yFilter.active) return
                }
                const dateLabel = getDateGroupKey(dateVal, timeUnit.value)
                let catLabel = translate('Uncategorized')
                let originalCatLabel = catLabel
                if (catColId) {
                    const rawCat = row[catColId]
                    if (rawCat && String(rawCat).trim() !== '') {
                        originalCatLabel = String(rawCat).trim()
                        catLabel = originalCatLabel
                    }
                }
                if (topCategoriesSet && topCategoriesSet.size > 0 && !topCategoriesSet.has(catLabel)) {
                    catLabel = otherLabel
                }
                const val = getRowNumericValue(row, numCol)
                if (val !== 0) {
                    const budgetConfig = categoryBudgets.value[originalCatLabel]
                    const isExpense = !budgetConfig || budgetConfig.type === 'expense'
                    const adjustedVal = isExpense ? -Math.abs(val) : Math.abs(val)

                    if (!trendData[dateLabel]) trendData[dateLabel] = {}
                    trendData[dateLabel][catLabel] = (trendData[dateLabel][catLabel] || 0) + adjustedVal
                    allCategories.add(catLabel)
                }
            })

            Object.values(categoryBudgets.value).forEach(config => {
                if (config && config.type !== 'income' && config.amount) {
                    const numAmount = calcValue(config.amount)
                    if (numAmount > 0) {
                        totalBudgetAmount += numAmount
                    }
                }
            })

            return {
                trendData,
                categories: Array.from(allCategories),
                totalBudget: totalBudgetAmount
            }
        }

        const compactFormatter = computed(() => new Intl.NumberFormat(currentLanguage.value, {
            notation: 'compact',
            maximumFractionDigits: 2,
            roundingMode: 'trunc'
        }))

        const formatNumber = (num) => {
            if (!num) return ''
            num = Number(num)
            return Math.abs(num) >= 10000 ? compactFormatter.value.format(num) : num.toLocaleString()
        }

        const formatDate = (dateStr) => {
            if (!dateStr || String(dateStr).length !== 8) return dateStr
            return String(dateStr).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3')
        }

        const formatTime = (timeStr) => {
            const str = String(timeStr || '').trim()
            if (str.length === 6) {
                return str.replace(/^(\d{2})(\d{2})(\d{2})$/, '$1:$2:$3')
            }
            if (str.length === 4) {
                return str.replace(/^(\d{2})(\d{2})$/, '$1:$2')
            }
            return str
        }

        const toLocaleString = (num) => {
            if (!num) return '0'
            const numVal = Number(num)
            if (isNaN(numVal)) return num
            return numVal.toLocaleString()
        }

        const centerTextPlugin = {
            id: 'centerText',
            afterDatasetsDraw(chart) {
                const { height, ctx, chartArea: { top, bottom, left, right } } = chart
                ctx.save()
                const dataset = chart.data.datasets[0]
                if (!dataset || !dataset.data || dataset.data.length === 0) {
                    ctx.restore()
                    return
                }

                cachedTotalSum = 0
                const rawData = dataset.rawValues || dataset.data
                rawData.forEach((val, index) => {
                    if (chart.getDataVisibility(index)) {
                        cachedTotalSum += val
                    }
                })
                ctx.textBaseline = 'middle'
                ctx.textAlign = 'center'
                const centerX = (left + right) / 2
                const centerY = (top + bottom) / 2

                const isDarkMode = isDark.value

                const labelFontSize = (height / 240).toFixed(2)
                ctx.font = `500 ${labelFontSize}em sans-serif`
                ctx.fillStyle = isDarkMode ? '#d1d5db' : '#9ca3af'
                const labelText = columns.value.find(c => c.id === selectedChartNumColId.value)?.label || ''
                ctx.fillText(labelText, centerX, centerY - 20)
                const fontSize = (height / 110).toFixed(2)
                ctx.font = `bold ${fontSize}em sans-serif`
                ctx.fillStyle = cachedTotalSum < 0
                    ? (isDarkMode ? '#f87171' : '#dc2626')
                    : (isDarkMode ? '#f3f4f6' : '#1f2937')
                ctx.fillText(formatNumber(cachedTotalSum), centerX, centerY + 15)
                ctx.restore()
            },
            afterEvent(chart, args) {
                const event = args.event
                if (event.type === 'mouseout') {
                    tooltipState.value.show = false
                    isCenterTooltipVisible = false
                    return
                }
                if (event.type === 'mousemove') {
                    const meta = chart.getDatasetMeta(0)
                    if (!meta.data || meta.data.length === 0) return

                    const firstSlice = meta.data[0]
                    const centerX = firstSlice.x
                    const centerY = firstSlice.y
                    const innerRadius = firstSlice.innerRadius
                    const distance = Math.sqrt(Math.pow(event.x - centerX, 2) + Math.pow(event.y - centerY, 2))

                    if (distance < innerRadius) {
                        chart.canvas.style.cursor = 'pointer'
                        tooltipState.value.text = cachedTotalSum.toLocaleString()
                        tooltipState.value.x = args.event.native.clientX
                        tooltipState.value.y = args.event.native.clientY
                        tooltipState.value.show = true
                        isCenterTooltipVisible = true
                    } else {
                        chart.canvas.style.cursor = 'default'
                        if (isCenterTooltipVisible) {
                            tooltipState.value.show = false
                            isCenterTooltipVisible = false
                        }
                    }
                }
            }
        }

        const slicePercentagePlugin = {
            id: 'slicePercentage',
            afterDatasetsDraw(chart) {
                const { ctx, data } = chart
                const dataset = data.datasets[0]
                const total = dataset.data.reduce((sum, val) => sum + val, 0)
                if (total === 0) return
                const meta = chart.getDatasetMeta(0)

                ctx.save()
                ctx.font = 'bold 12px sans-serif'
                ctx.fillStyle = '#ffffff'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
                ctx.shadowBlur = 3
                ctx.shadowOffsetX = 1
                ctx.shadowOffsetY = 1

                dataset.data.forEach((value, index) => {
                    const percentage = (value / total * 100)
                    if (percentage < 4) return
                    const percentageText = percentage.toFixed(1) + '%'
                    const arc = meta.data[index]
                    const centerPoint = arc.tooltipPosition()
                    ctx.fillText(percentageText, centerPoint.x, centerPoint.y)
                })
                ctx.restore()
            }
        }

        const htmlLegendPlugin = {
            id: 'htmlLegend',
            afterUpdate(chart) {
                const dataset = chart.data.datasets[0]
                if (!dataset || !dataset.rawValues) return

                const rawValues = dataset.rawValues

                let total = 0
                chart.data.labels.forEach((_, index) => {
                    if (chart.getDataVisibility(index)) {
                        total += Math.abs(rawValues[index])
                    }
                })
                const getLegendBudgetMultiplier = () => {
                    const dateColId = selectedChartDateColId.value || columns.value.find(c => c.type === 'date')?.id
                    if (!dateColId) return 1

                    if (selectedChartDate.value) {
                        const key = String(selectedChartDate.value)
                        if (/^\d{4}$/.test(key)) return 12
                        if (/^\d{4}-H[12]$/.test(key)) return 6
                        if (/^\d{4}-Q[1-4]$/.test(key)) return 3
                        if (/^\d{4}-\d{2}$/.test(key)) return 1
                        if (/^\d{4}-W\d{2}$/.test(key)) return 1 / 4.33
                        if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return 1 / 30
                        return currentBudgetMultiplier.value
                    }

                    const activeMonths = new Set()
                    chartBaseRows.value.forEach(row => {
                        const rawDate = row?.[dateColId]
                        if (!rawDate) return
                        const dateObj = new Date(rawDate)
                        if (Number.isNaN(dateObj.getTime())) return
                        const m = dateObj.getMonth() + 1
                        const mFilter = monthFilters.value.find(x => x.month === m)
                        if (mFilter && !mFilter.active) return
                        const y = dateObj.getFullYear()
                        const yFilter = yearFilters.value.find(x => x.year === y)
                        if (yFilter && !yFilter.active) return
                        activeMonths.add(`${y}-${m}`)
                    })

                    return Math.max(activeMonths.size, 1)
                }
                const legendBudgetMultiplier = getLegendBudgetMultiplier()

                const rawItems = chart.data.labels.map((label, index) => {
                    let realValue = rawValues[index]

                    let percentage = '0.0'
                    if (chart.getDataVisibility(index) && total > 0) {
                        percentage = ((Math.abs(realValue) / total) * 100).toFixed(1)
                    }

                    const meta = chart.getDatasetMeta(0)
                    const style = meta.controller.getStyle(index)

                    const rawBudget = calcValue(
                        categoryBudgets.value[label]?.amount ||
                        categoryBudgets.value[label]?.budget ||
                        categoryBudgets.value[label] ||
                        0
                    )
                    const isFallback = rawBudget === 0
                    const baseBudget = isFallback ? getHistoricalSpent(label) : rawBudget
                    const budgetAmount = Math.round(baseBudget * legendBudgetMultiplier)

                    return {
                        index: index,
                        text: label,
                        value: realValue,
                        percentage: percentage,
                        color: style.backgroundColor,
                        hidden: !chart.getDataVisibility(index),
                        budget: budgetAmount,
                        isFallback: isFallback,
                        count: categoryCounts.value[label] || 0
                    }
                })

                rawItems.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
                const newItemsStr = JSON.stringify(rawItems)
                if (chart.$lastLegendStr !== newItemsStr) {
                    chart.$lastLegendStr = newItemsStr
                    const currentHidden = rawItems.filter(i => i.hidden).map(i => i.text)
                    Promise.resolve().then(() => {
                        customLegendItems.value = rawItems
                        if (hiddenCategoryNames.value.join(',') !== currentHidden.join(',')) {
                            hiddenCategoryNames.value = currentHidden
                        }
                    })
                }
            }
        }

        const toggleLegend = (index) => {
            legendClickCount++
            if (legendClickCount === 1) {
                legendClickTimer = setTimeout(async () => {
                    legendClickCount = 0
                    if (expenseChart.value) {
                        expenseChart.value.toggleDataVisibility(index)
                        expenseChart.value.update()
                    }
                }, 250)
            } else if (legendClickCount === 2) {
                clearTimeout(legendClickTimer)
                legendClickCount = 0
                if (expenseChart.value) {
                    const chart = expenseChart.value
                    const totalItems = chart.data.labels.length
                    let isAlreadyIsolated = true
                    for (let i = 0; i < totalItems; i++) {
                        const currentVisible = chart.getDataVisibility(i)
                        if (i === index && !currentVisible) isAlreadyIsolated = false
                        if (i !== index && currentVisible) isAlreadyIsolated = false
                    }
                    for (let i = 0; i < totalItems; i++) {
                        const currentVisible = chart.getDataVisibility(i)
                        let targetVisibility
                        if (isAlreadyIsolated) {
                            targetVisibility = true
                        } else {
                            targetVisibility = (i === index)
                        }

                        if (currentVisible !== targetVisibility) {
                            chart.toggleDataVisibility(i)
                        }
                    }
                    chart.update()
                }
            }
        }

        const updateDoughnut = (ctx, labels, values) => {
            const bgColors = labels.map((label, idx) => categoryBudgets.value[label]?.color || defaultColors[idx % defaultColors.length])
            const absValues = values.map(v => Math.abs(v))
            if (expenseChart.value) {
                const currentLabels = expenseChart.value.data.labels || [];
                const isLabelsChanged = currentLabels.length !== labels.length || !currentLabels.every((val, index) => val === labels[index])

                expenseChart.value.data.labels = labels
                expenseChart.value.data.datasets[0].data = absValues
                expenseChart.value.data.datasets[0].rawValues = values
                expenseChart.value.data.datasets[0].backgroundColor = bgColors

                expenseChart.value.update(isLabelsChanged ? undefined : 'active')
            } else {
                expenseChart.value = markRaw(new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: absValues,
                            rawValues: values,
                            backgroundColor: bgColors,
                            borderWidth: 2,
                            borderColor: isDark.value ? '#1f2937' : '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const dataset = context.chart.data.datasets[0]
                                        const realValue = dataset.rawValues ? dataset.rawValues[context.dataIndex] : context.raw
                                        const value = context.raw || 0
                                        const total = dataset.data.reduce((sum, val) => sum + val, 0)
                                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                                        const sign = realValue > 0 ? '+' : ''
                                        return `${sign}${realValue.toLocaleString()} (${percentage}%)`
                                    }
                                }
                            }
                        },
                        animation: { animateScale: true, animateRotate: true }
                    },
                    plugins: [centerTextPlugin, slicePercentagePlugin, htmlLegendPlugin]
                }))
            }
        }

        const updateTrend = (ctx, labels, trendObj) => {
            const isTotalLine = trendChartType.value === 'total'
            const isLine = trendChartType.value === 'line' || isTotalLine
            const chartJsType = isLine ? 'line' : 'bar'
            const bgColors = trendObj.categories.map((label, idx) => categoryBudgets.value[label]?.color || defaultColors[idx % defaultColors.length])

            const datasets = isTotalLine
                ? (() => {
                    const totalColor = '#6366f1'
                    const visibleCategories = trendObj.categories.filter(cat => !hiddenCategoryNames.value.includes(cat))
                    const totalValues = labels.map(dateLabel =>
                        visibleCategories.reduce((sum, cat) => sum + (trendObj.trendData[dateLabel]?.[cat] || 0), 0)
                    )
                    return [{
                        label: translate('Total'),
                        data: totalValues,
                        backgroundColor: 'rgba(99, 102, 241, 0.12)',
                        borderColor: totalColor,
                        borderWidth: 2.5,
                        fill: 'origin',
                        tension: 0.4,
                        pointBackgroundColor: (context) => {
                            const label = context.chart.data.labels[context.dataIndex]
                            return label === selectedChartDate.value ? totalColor : '#fff'
                        },
                        pointBorderColor: totalColor,
                        pointBorderWidth: (context) => {
                            const label = context.chart.data.labels[context.dataIndex]
                            return label === selectedChartDate.value ? 3 : 2
                        },
                        pointRadius: (context) => {
                            const label = context.chart.data.labels[context.dataIndex]
                            return label === selectedChartDate.value ? 6 : 3
                        }
                    }]
                })()
                : trendObj.categories.map((cat, index) => {
                    const color = bgColors[index % bgColors.length]
                    const dataValues = labels.map(dateLabel => {
                        return trendObj.trendData[dateLabel][cat] || 0
                    })
                    return {
                        label: cat,
                        hidden: hiddenCategoryNames.value.includes(cat),
                        data: dataValues,
                        backgroundColor: color,
                        borderColor: color,
                        borderWidth: isLine ? 2 : 0,
                        fill: false,
                        tension: 0.4,
                        borderRadius: isLine ? 0 : 4,
                        pointBackgroundColor: (context) => {
                            const label = context.chart.data.labels[context.dataIndex]
                            return label === selectedChartDate.value ? color : '#fff'
                        },
                        pointBorderColor: color,
                        pointBorderWidth: (context) => {
                            const label = context.chart.data.labels[context.dataIndex]
                            return label === selectedChartDate.value ? 3 : 2
                        },
                        pointRadius: (context) => {
                            const label = context.chart.data.labels[context.dataIndex]
                            return label === selectedChartDate.value ? 6 : 3
                        }
                    }
                })

            if (!hiddenCategoryNames.value.length && trendChartType.value !== 'line') {
                let baseTotalMonthlyBudget = 0
                trendObj.categories.forEach(cat => {
                    const catSettings = categoryBudgets.value[cat]
                    if (catSettings && typeof catSettings === 'object' && catSettings.type === 'income') {
                        return
                    }
                    let explicitBudget = 0
                    if (catSettings !== undefined && catSettings !== null) {
                        const rawVal = typeof catSettings === 'object'
                            ? (catSettings.budget || catSettings.amount || 0)
                            : catSettings
                        const parsed = calcValue(rawVal)
                        if (Number.isFinite(parsed) && parsed > 0) {
                            explicitBudget = parsed
                        }
                    }

                    const baseBudget = explicitBudget === 0
                        ? getHistoricalSpent(cat)
                        : explicitBudget

                    baseTotalMonthlyBudget += baseBudget
                })
                const periodTotalBudget = baseTotalMonthlyBudget * currentBudgetMultiplier.value
                if (periodTotalBudget > 0 && chartViewMode.value !== 'income') {
                    const pointBudget = periodTotalBudget
                    datasets.push({
                        label: translate('Budget'),
                        data: labels.map(() => Math.round(-Math.abs(pointBudget))),
                        type: 'line',
                        borderColor: '#ef4444',
                        backgroundColor: '#ef4444',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: false,
                        tension: 0,
                        order: -1,
                        stack: 'budget_line'
                    })
                }
            }

            if (trendChart.value && trendChart.value.config.type !== chartJsType) {
                trendChart.value.destroy()
                trendChart.value = null
            }
            if (trendChart.value) {
                trendChart.value.data.labels = labels
                trendChart.value.data.datasets = datasets
                trendChart.value.options.scales.x.stacked = !isLine
                trendChart.value.options.scales.y.stacked = !isLine
                trendChart.value.options.scales.y.ticks.color = isDark.value ? '#9ca3af' : '#6b7280'
                trendChart.value.options.scales.y.grid.color = isDark.value ? '#374151' : '#e5e7eb'
                trendChart.value.options.scales.x.ticks.color = isDark.value ? '#9ca3af' : '#6b7280'
                trendChart.value.update()
            } else {
                trendChart.value = markRaw(new Chart(ctx, {
                    type: chartJsType,
                    data: {
                        labels: labels,
                        datasets: datasets
                    },
                    options: {
                        onClick: (e, elements, chart) => {
                            if (elements.length > 0) {
                                const clickedLabel = chart.data.labels[elements[0].index]
                                if (selectedChartDate.value === clickedLabel) {
                                    selectedChartDate.value = null
                                } else {
                                    selectedChartDate.value = clickedLabel
                                    if (clickedLabel.length === 4) {
                                        timeUnit.value = 'month'
                                    } else if (clickedLabel.length === 7 || clickedLabel.includes('-Q') || clickedLabel.includes('-H') || clickedLabel.includes('-W')) {
                                        timeUnit.value = 'day'
                                    }
                                }
                                chart.update()
                            }
                        },
                        onHover: (e, elements) => {
                            e.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default'
                        },
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        scales: {
                            x: {
                                stacked: !isLine,
                                ticks: { color: isDark.value ? '#9ca3af' : '#6b7280', autoSkip: true },
                                grid: { display: false }
                            },
                            y: {
                                stacked: !isLine,
                                beginAtZero: true,
                                ticks: {
                                    callback: (v) => formatNumber(v),
                                    color: isDark.value ? '#9ca3af' : '#6b7280'
                                },
                                grid: { color: isDark.value ? '#374151' : '#e5e7eb' }
                            }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'bottom',
                                labels: {
                                    color: isDark.value ? '#9ca3af' : '#6b7280'
                                }
                            },
                            tooltip: {
                                filter: (tooltipItem) => {
                                    return trendChartType.value === 'total' || tooltipItem.parsed.y !== 0
                                },
                                itemSort: (a, b) => b.parsed.y - a.parsed.y,
                                footerFont: { size: 13, weight: 'bold' },
                                footerMarginTop: 8,
                                callbacks: {
                                    footer: (tooltipItems) => {
                                        if (tooltipItems.length === 0 || trendChartType.value === 'total') return null
                                        let total = 0
                                        tooltipItems.forEach((tooltipItem) => {
                                            if (tooltipItem.dataset.label !== translate('Budget')) total += tooltipItem.parsed.y
                                        })

                                        const sign = total > 0 ? '+' : ''
                                        return translate('Total') +': ' + sign + total.toLocaleString()
                                    }
                                }
                            }
                        }
                    }
                }))
            }
        }

        let currentMaxValue = 0
        const getLocalizedWeekdays = (locale = currentLanguage.value) => {
            const baseDate = new Date(1970, 0, 4)
            const weekdays = []
            for (let i = 0; i < 7; i++) {
                const dayName = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(baseDate)
                weekdays.push(dayName)
                baseDate.setDate(baseDate.getDate() + 1)
            }
            return weekdays
        }

        const getOfficialTimeMatrixData = () => {
            const dataMatrix = []
            currentMaxValue = 0

            const dailySums = {}
            const dateColId = selectedChartDateColId.value
            const amountColId = selectedChartNumColId.value
            const amountColDef = columns.value.find(c => c.id === amountColId)
            chartBaseRows.value.forEach(row => {
                const rawDate = row[dateColId]
                if (!rawDate) return
                const cleanDateStr = String(rawDate).substring(0, 10).replace(/\//g, '-')
                const amt = amountColDef ? getRowNumericValue(row, amountColDef) : 0
                dailySums[cleanDateStr] = (dailySums[cleanDateStr] || 0) + amt
            });

            const availableDates = Object.keys(dailySums).sort()
            const targetYear = availableDates.length > 0
                ? parseInt(availableDates[availableDates.length - 1].substring(0, 4))
                : new Date().getFullYear()

            const startDate = new Date(targetYear, 0, 1)
            const endDate = new Date(targetYear, 11, 31)

            startDate.setDate(startDate.getDate() - startDate.getDay())
            if (endDate.getDay() !== 6) {
                endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))
            }

            const yLabels = getLocalizedWeekdays().reverse()

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dYear = d.getFullYear()
                const dMonth = String(d.getMonth() + 1).padStart(2, '0')
                const dDay = String(d.getDate()).padStart(2, '0')
                const dateStr = `${dYear}-${dMonth}-${dDay}`

                const sum = dailySums[dateStr] || 0
                if (sum > currentMaxValue) currentMaxValue = sum
                const dayOfWeek = d.getDay()
                const y = yLabels[6 - dayOfWeek]

                dataMatrix.push({
                    x: dateStr,
                    y: y,
                    v: sum,
                    date: dateStr
                })
            }

            return { dataMatrix, yLabels };
        }

        const DATE_FNS_LOCALE_MAP = {
            en: 'en-US'
        }

        const getDateFnsLocaleSlug = (lang) => DATE_FNS_LOCALE_MAP[lang] || lang

        const renderHeatmap = (canvasCtx) => {
            const { dataMatrix, yLabels } = getOfficialTimeMatrixData()

            const textColor = isDark.value ? '#9ca3af' : '#6b7280'
            const dateFnsLocaleKey = getDateFnsLocaleSlug(currentLanguage.value).replace('-', '')
            const safeLocale = window.dateFns?.locale?.[dateFnsLocaleKey]
                || window.dateFns?.locale?.enUS
                || window.dateFns?.locale?.zhTW

            if (heatmapChartInstance && heatmapChartInstance.ctx === canvasCtx) {
                heatmapChartInstance.data.datasets[0].data = dataMatrix
                heatmapChartInstance.options.scales.x.adapters.date.locale = safeLocale
                heatmapChartInstance.options.scales.x.ticks.color = textColor
                heatmapChartInstance.options.scales.y.labels = yLabels
                heatmapChartInstance.update('none')
                return
            }

            if (heatmapChartInstance) {
                heatmapChartInstance.destroy()
            }

            heatmapChartInstance = new Chart(canvasCtx, {
                type: 'matrix',
                data: {
                    datasets: [{
                        data: dataMatrix,
                        backgroundColor: (context) => {
                            const value = context.dataset.data[context.dataIndex]?.v || 0
                            if (value === 0) return isDark.value ? 'rgba(31, 41, 55, 1)' : 'rgba(235, 237, 240, 1)'
                            const maxVal = currentMaxValue || 1;
                            const alpha = 0.2 + (value / maxVal) * 0.8
                            return `rgba(99, 102, 241, ${alpha})`;
                        },
                        borderWidth: 0,
                        borderRadius: 2,
                        hoverBackgroundColor: 'rgba(79, 70, 229, 1)',
                        width: 20,
                        height: 20
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            bottom: 10
                        }
                    },
                    onClick: (event, elements, chart) => {
                        if (elements.length > 0) {
                            if (selectedChartDate.value) return selectedChartDate.value = null
                            const dataIndex = elements[0].index
                            const clickedData = chart.data.datasets[0].data[dataIndex]
                            selectedChartDate.value = `${clickedData.date}${getWeekdayStr(clickedData.date)}`
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                title: () => '',
                                label: (context) => {
                                    const item = context.raw;
                                    return `${item.date}${getWeekdayStr(item.date)}: ${formatNumber(item.v)}`
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            position: 'top',
                            offset: true,
                            adapters: {
                                date: {
                                    locale: safeLocale
                                }
                            },
                            time: {
                                unit: 'month',
                                round: 'week',
                                isoWeekday: 0,
                                displayFormats: {
                                    month: 'MMM'
                                }
                            },
                            ticks: {
                                color: textColor
                            },
                            grid: { display: false },
                            border: { display: false }
                        },
                        y: {
                            type: 'category',
                            labels: yLabels,
                            ticks: {
                                display: false
                            },
                            grid: { display: false },
                            border: { display: false },
                            reverse: true
                        }
                    }
                }
            })

            setTimeout(() => {
                if (heatmapScrollContainer.value) {
                    heatmapScrollContainer.value.scrollLeft = heatmapScrollContainer.value.scrollWidth;
                }
            }, 100);
        }

        const updateChart = async (unit) => {
            if (!isChartOpen.value) return
            if (unit) {
                timeUnit.value = unit
                selectedChartDate.value = null
            } else if (selectedChartDateColId.value && filteredRows.value.length > 0) {
                const dates = filteredRows.value
                    .map(row => row[selectedChartDateColId.value])
                    .filter(d => d && !isNaN(new Date(d).getTime()))
                    .map(d => new Date(d).getTime())

                if (dates.length > 0) {
                    const minDate = Math.min(...dates)
                    const maxDate = Math.max(...dates)
                    const diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24)

                    if (diffDays > 90) {
                        timeUnit.value = 'month'
                    } else if (diffDays > 30) {
                        timeUnit.value = 'week'
                    } else {
                        timeUnit.value = 'day'
                    }
                }
            }
            const ctxDoughnut = document.getElementById('expenseChart')
            const ctxLine = document.getElementById('trendChart')
            const categoryData = getChartData()
            let topCategories = new Set()
            let labels = []
            let values = []

            await loadScript('https://cdn.jsdelivr.net/npm/chart.js')
            const dateFnsLocale = getDateFnsLocaleSlug(currentLanguage.value)
            await Promise.all([
                loadScript('https://cdn.jsdelivr.net/npm/chartjs-chart-matrix@3').catch(() => {}),
                loadScript('https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns.bundle.min.js').catch(() => {}),
                loadScript(`https://cdn.jsdelivr.net/npm/date-fns@3/locale/${dateFnsLocale}/cdn.min.js`).catch(() => {})
            ])

            if (categoryData && ctxDoughnut) {
                const MAX_CAT = 12
                const finalData = {}
                if (chartViewMode.value === 'budget') {
                    const budgetEntries = Object.entries(categoryBudgets.value)
                        .filter(([cat, config]) => config && config.type !== 'income' && calcValue(config.amount) > 0)
                        .map(([cat, config]) => [cat, calcValue(config.amount)])
                        .sort((a, b) => b[1] - a[1])
                    budgetEntries.forEach((item, index) => {
                        if (index < MAX_CAT) topCategories.add(item[0])
                        finalData[item[0]] = item[1]
                    })
                } else {
                    const filteredEntries = Object.entries(categoryData).filter(([cat, val]) => {
                        if (chartViewMode.value === 'expense') return val < 0
                        return val > 0
                    })
                    const sortedEntries = filteredEntries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))

                    sortedEntries.forEach((item, index) => {
                        if (index < MAX_CAT) {
                            topCategories.add(item[0])
                        }
                        finalData[item[0]] = item[1]
                    })
                }
                labels = Object.keys(finalData)
                values = Object.values(finalData)
                updateDoughnut(ctxDoughnut, labels, values)
            } else if (expenseChart.value) {
                expenseChart.value.destroy()
                expenseChart.value = null
            }
            if (!values.length) {
                if (trendChart.value) {
                    trendChart.value.destroy()
                    trendChart.value = null
                }
                hasTrendData.value = false
                return
            }
            const trendObj = getTrendChartData(topCategories)
            const nextHasTrendData = Boolean(trendObj && Object.keys(trendObj.trendData).length > 0 && selectedChartDateColId.value)
            hasTrendData.value = nextHasTrendData
            if (nextHasTrendData) {
                const sortedLabels = Object.keys(trendObj.trendData).sort((a, b) => a.localeCompare(b))
                await nextTick()
                updateTrend(ctxLine, sortedLabels, trendObj)
            } else if (trendChart.value) {
                trendChart.value.destroy()
                trendChart.value = null
            }

            if (heatmapCanvas.value) {
                renderHeatmap(heatmapCanvas.value.getContext('2d'))
            }
        }

        const toggleFilter = (type, value) => {
            const currentClick = `${type}-${value}`
            if (lastFilterClick !== currentClick) {
                clearTimeout(filterClickTimer)
                filterClickCount = 0
                lastFilterClick = currentClick
            }
            filterClickCount++
            const targetArray = type === 'month' ? monthFilters.value : yearFilters.value
            const matchKey = type === 'month' ? 'month' : 'year'
            if (filterClickCount === 1) {
                filterClickTimer = setTimeout(async () => {
                    filterClickCount = 0
                    lastFilterClick = null
                    const item = targetArray.find(x => x[matchKey] === value)
                    if (item) {
                        item.active = !item.active
                    }
                }, 250)
            } else if (filterClickCount === 2) {
                clearTimeout(filterClickTimer)
                filterClickCount = 0
                lastFilterClick = null
                const isAlreadyIsolated = targetArray.every(x => {
                    if (x[matchKey] === value) return x.active === true
                    else return x.active === false
                })
                targetArray.forEach(x => {
                    if (isAlreadyIsolated) {
                        x.active = true
                    } else {
                        x.active = (x[matchKey] === value)
                    }
                })
            }
            
            if (isChartOpen.value) {
                debouncedUpdateChart.cancel()
                debouncedUpdateChart()
            }
        }

        const refreshYearFilters = () => {
            const yearsInData = new Set()
            const monthsInData = new Set()
            const dateCols = columns.value.filter(c => c.type === 'date')
            rows.value.forEach(row => {
                dateCols.forEach(col => {
                    if (row[col.id]) {
                        const d = new Date(row[col.id])
                        if (!isNaN(d.getTime())) {
                            yearsInData.add(d.getFullYear())
                            monthsInData.add(d.getMonth() + 1)
                        }
                    }
                })
            })
            const sortedYears = Array.from(yearsInData).sort((a, b) => a - b)
            yearFilters.value = sortedYears.map(y => {
                const existing = yearFilters.value.find(f => f.year === y)
                return { year: y, active: existing ? existing.active : true }
            })
            monthFilters.value = Array.from(monthsInData).map(m => {
                const existing = monthFilters.value.find(f => f.month === m)
                return { month: m, active: existing ? existing.active : true }
            })
        }

        const syncColumnWidths = () => {
            if (!tableContainer.value) return
            const ths = tableContainer.value.querySelectorAll('thead th')
            const newWidths = {}
            ths.forEach((th, idx) => {
                newWidths[idx] = th.getBoundingClientRect().width
            })
            colWidths.value = newWidths
        }

        const showConfirm = (message, onlyOK = 0) => {
            return new Promise((resolve) => {
                confirmModal.value = {
                    isOpen: true,
                    message,
                    onlyOK,
                    resolvePromise: resolve
                }
                nextTick().then(() => {
                    if (confirmCancelBtnRef.value) {
                        confirmCancelBtnRef.value.focus()
                    }
                })
            })
        }

        const onConfirmOk = () => {
            if (confirmModal.value.resolvePromise) {
                confirmModal.value.resolvePromise(true)
            }
            confirmModal.value.isOpen = false
        }

        const onConfirmCancel = () => {
            if (confirmModal.value.resolvePromise) {
                confirmModal.value.resolvePromise(false)
            }
            confirmModal.value.isOpen = false
        }

        const checkScrollState = () => {
            if (!tableContainer.value) return
            const { scrollTop, scrollHeight, clientHeight } = tableContainer.value
            isAtTop.value = scrollTop <= 5
            isAtBottom.value = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 5
        }

        const handleTableScroll = (e, isProgrammatic = false) => {
            if (!isProgrammatic) {
                isScrolling.value = true

                activeRow.value = null
                activeDropdownIndex.value = -1
                isKeyboardOpen.value = false

                clearTimeout(scrollHideTimer)
                scrollHideTimer = setTimeout(() => {
                    isScrolling.value = false
                }, 3000)
            }
            if (scrollRAF) cancelAnimationFrame(scrollRAF)
            const target = e.target
            const scrollTop = target.scrollTop
            const clientHeight = target.clientHeight

            saveScrollPosition(scrollTop)

            scrollRAF = requestAnimationFrame(() => {
                checkScrollState()

                const total = filteredRows.value.length
                if (total <= 50) {
                    if (windowStart.value !== 0) windowStart.value = 0
                    if (windowEnd.value !== total) windowEnd.value = total
                    if (paddingTop.value !== 0) paddingTop.value = 0
                    if (paddingBottom.value !== 0) paddingBottom.value = 0
                    return
                }

                const buffer = 25
                const thead = tableContainer.value.querySelector('thead')
                const headerHeight = thead ? thead.getBoundingClientRect().height : 0
                const safeItemHeight = Math.max(40, averageRowHeight)

                const getRowHeight = (index) => {
                    const rowId = filteredRows.value[index].id
                    return heightCache[rowId] || safeItemHeight
                }

                let currentY = headerHeight
                let start = -1
                let end = total
                let pTopAtStart = 0

                for (let i = 0; i < total; i++) {
                    const h = getRowHeight(i)
                    if (start === -1 && currentY + h > scrollTop) {
                        start = i
                        pTopAtStart = currentY
                    }
                    currentY += h
                    if (start !== -1 && currentY > scrollTop + clientHeight) {
                        end = i + 1
                        break
                    }
                }

                if (start === -1) {
                    end = total
                    const estimatedItems = Math.ceil(clientHeight / safeItemHeight)
                    start = Math.max(0, total - estimatedItems)
                    let preciseTop = currentY
                    for (let i = total - 1; i >= start; i--) {
                        preciseTop -= getRowHeight(i)
                    }
                    pTopAtStart = Math.max(headerHeight, preciseTop)
                }

                const newStart = Math.max(0, start - buffer)
                const newEnd = Math.min(total, end + buffer * 2)

                let pTop = pTopAtStart - headerHeight
                for (let i = start - 1; i >= newStart; i--) {
                    pTop -= getRowHeight(i)
                }
                pTop = Math.max(0, pTop)

                let pBottom = 0
                for (let i = newEnd; i < total; i++) {
                    pBottom += getRowHeight(i)
                }

                if (windowStart.value !== newStart) windowStart.value = newStart
                if (windowEnd.value !== newEnd) windowEnd.value = newEnd
                if (paddingTop.value !== pTop) paddingTop.value = pTop
                if (paddingBottom.value !== pBottom) paddingBottom.value = pBottom
            })
        }

        const handleFilterScroll = (e) => {
            const target = e.target

            if (tableContainer.value && tableContainer.value.scrollLeft !== target.scrollLeft) {
                tableContainer.value.scrollLeft = target.scrollLeft
            }
        }

        const autoHeight = (target) => {
            target.style.height = ''
            target.style.height = target.scrollHeight + 'px'
        }

        const triggerPrint = async () => {
            isProcessing.value = 1
            isPrinting.value = true

            document.documentElement.classList.remove('dark')

            await nextTick()

            setTimeout(() => {
                if (expenseChart.value) expenseChart.value.resize()
                if (trendChart.value) trendChart.value.resize()

                requestAnimationFrame(() => {
                setTimeout(() => {
                    window.print()

                    setTimeout(() => {
                        isPrinting.value = false
                        if (isDark.value) document.documentElement.classList.add('dark')
                        isProcessing.value = 0

                        nextTick(() => {
                            if (expenseChart.value) expenseChart.value.resize()
                            if (trendChart.value) trendChart.value.resize()
                        })
                    }, 800)
                }, 100)
                })
            }, 800)
        }

        const fetchGistAPI = async (method, urlExt = '', body = null) => {

            const timestamp = new Date().getTime()
            const options = {
                method,
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }

            if (githubToken.value.trim()) {
                options.headers['Authorization'] = `Bearer ${githubToken.value.trim()}`
            }

            if (body) options.body = JSON.stringify(body)

            try {
                const response = await fetch(`https://api.github.com/gists${urlExt}?_t=${timestamp}`, options)
                if (!response.ok) {
                    const err = new Error(`HTTP error! status: ${response.status}`)
                    err.status = response.status
                    throw err
                }
                return await response.json()
            } catch (e) {
                if (e.status === 404) {
                    showConfirm(translate('GitHub Gist not found! Please check your Gist ID. If this is your first time using it, please leave the Gist ID blank.'), 1)
                } else {
                    console.error('GitHub API Error:', e)
                    showConfirm(`GitHub API Error: ${e.message}`, 1)
                }
                return null
            }
        }

        const backupToGist = async () => {
            isProcessing.value = -1
            try {
                const rowsValues = rows.value.map(({id, ...rest}) => rest)
                const payload = {
                    title: currentStorageKey.value,
                    columns: toRaw(columns.value),
                    rows: toRaw(rowsValues),
                    note: globalNotes.value,
                    budgets: toRaw(categoryBudgets.value)
                }

                const storageKey = currentStorageKey.value || tempKey.value || 'ty-db'
                const fileContent = await compressToBase64(JSON.stringify(payload, null, 2))
                const sizeInBytes = new Blob([fileContent]).size
                const ONE_MB = 1000 * 1000
                if (sizeInBytes > ONE_MB) {
                    const sizeInMB = (sizeInBytes / ONE_MB).toFixed(2)
                    showConfirm(translate(`Backup failed: Data size (${sizeInMB}MB) exceeds the 1MB limit.`), 1)
                    return
                }

                const gistBody = {
                    description: `TY Data Builder Backup - ${storageKey}`,
                    public: false,
                    files: {
                        [`${storageKey}.json`]: {
                            content: fileContent
                        }
                    }
                }

                const cleanGistId = gistId.value.trim()
                let result
                if (cleanGistId) {
                    result = await fetchGistAPI('PATCH', `/${cleanGistId}`, gistBody)
                } else {
                    result = await fetchGistAPI('POST', '', gistBody)
                    if (result && result.id) {
                        gistId.value = result.id
                    }
                }
                if (result) {
                    showConfirm(translate('Backed up to GitHub Gist successfully!'), 1)
                }
            } catch (error) {
                console.error("Gist backup error:", error)
                showConfirm(translate('Backup failed. Please try again.'), 1)
            } finally {
                isProcessing.value = 0
            }
        }

        const restoreFromGist = async () => {
            const cleanGistId = gistId.value.trim()

            if (!await showConfirm(translate('This will overwrite your current local data. Continue?'))) return
            isProcessing.value = -2

            try {
                const result = await fetchGistAPI('GET', `/${cleanGistId}`)
                if (!result || !result.files) return

                let importedCount = 0
                let lastImportedKey = ''
                let hasCurrentKey = false

                for (const filename in result.files) {
                    if (!filename.endsWith('.json')) continue
                    const storageKey = filename.replace('.json', '')
                    try {
                        const fileObj = result.files[filename]
                        if (!fileObj.content.startsWith('{')) fileObj.content = await decompressFromBase64(fileObj.content)
                        const data = JSON.parse(fileObj.content)
                        let i = 1
                        if (Array.isArray(data.rows)) {
                            data.rows.forEach(row => row.id = i++)
                        }
                        await db.set(storageKey, data)
                        if (!savedKeysList.value.includes(storageKey)) {
                            savedKeysList.value.push(storageKey)
                        }
                        importedCount++
                        lastImportedKey = storageKey
                        if (storageKey === currentStorageKey.value) hasCurrentKey = true

                    } catch (e) {
                        console.warn(`Failed to parse ${filename}:`, e)
                    }
                }
                if (importedCount > 0) {
                    localStorage.setItem('TY_TABLE_MASTER_KEY_LIST', JSON.stringify(savedKeysList.value))
                    if (!hasCurrentKey && lastImportedKey) {
                        currentStorageKey.value = lastImportedKey
                    }
                    const data = await db.get(currentStorageKey.value)
                    if (data) {
                        columns.value = data.columns || []
                        rows.value = data.rows || []
                        globalNotes.value = data.note || ''
                        if (data.budgets) categoryBudgets.value = data.budgets
                        hasDateColumn.value = columns.value.some(column => column.type === 'date')
                        hasNumberColumn.value = columns.value.some(column => column.type === 'number')
                    }
                    syncMaxRowId()
                    onDataEdited('both')
                    showConfirm(translate('Restored from GitHub Gist successfully!'), 1)
                } else {
                    showConfirm(translate('No matching data found in this Gist. Invalid JSON.'), 1)
                }
            } finally {
                isProcessing.value = 0
            }
        }

        const getWeekdayStr = (dateStr) => {
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return ''
            let weekday = new Intl.DateTimeFormat(currentLanguage.value, { weekday: 'short' }).format(d)
            if (currentLanguage.value.startsWith('zh')) {
                weekday = weekday.slice(-1)
            }
            return ` (${weekday})`
        }

        const getDateGroupKey = (dateStr, unit) => {
            if (!dateStr) return translate('Uncategorized')
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return dateStr

            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')

            if (unit === 'month') {
                return `${y}-${m}`
            } else if (unit === 'quarter') {
                const q = Math.ceil((d.getMonth() + 1) / 3)
                return `${y}-Q${q}`
            } else if (unit === 'halfyear') {
                const q = Math.ceil((d.getMonth() + 1) / 6)
                return `${y}-H${q}`
            } else if (unit === 'week') {
                const firstDayOfYear = new Date(y, 0, 1)
                const pastDaysOfYear = (d - firstDayOfYear) / 86400000
                const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
                return `${y}-W${String(weekNum).padStart(2, '0')}`
            } else if (unit === 'year') {
                return `${y}`
            }
            return `${y}-${m}-${day}${getWeekdayStr(dateStr)}`
        }

        const initGlobalTooltip = () => {
            let moveTimer = null

            document.addEventListener('mouseover', (e) => {
                const target = e.target.closest('[data-tooltip]')
                if (!target) return
                const text = target.dataset.tooltip
                if (text) {
                    tooltipState.value.x = e.clientX
                    tooltipState.value.y = e.clientY
                    tooltipState.value.text = text
                    tooltipState.value.show = true
                }
            })

            document.addEventListener('mousemove', (e) => {
                if (tooltipState.value.show && e.target.closest('[data-tooltip]')) {
                    clearTimeout(moveTimer)
                    moveTimer = setTimeout(() => {
                        tooltipState.value.x = e.clientX
                        tooltipState.value.y = e.clientY
                    }, 500)
                }
            })

            document.addEventListener('mouseout', (e) => {
                if (e.target.closest('[data-tooltip]')) {
                    tooltipState.value.show = false
                    clearTimeout(moveTimer)
                }
            })
        }

        const enterInput = async (row, col, event) => {
            const inputEl = inputRefs.value[`${row.id}-${col.id}`]
            if (!inputEl) return
            tempKey.value = inputEl.value
            if (col.type !== 'password') {
                speakFeedback(inputEl.value)
            }
        }

        const saveInput = (row, col) => {
            const inputEl = inputRefs.value[`${row.id}-${col.id}`]
            if (!inputEl) return
            if (inputEl.value !== tempKey.value) onDataEdited()
            tempKey.value = null
        }

        const playBeep = () => {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)()
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume()
            }

            const now = audioCtx.currentTime
            const osc = audioCtx.createOscillator()
            const gain = audioCtx.createGain()

            osc.type = 'sine'
            osc.frequency.setValueAtTime(880, now)
            osc.frequency.setValueAtTime(1320, now + 0.06)

            gain.gain.setValueAtTime(0.001, now)
gain.gain.linearRampToValueAtTime(0.18, now + 0.01)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

            osc.connect(gain)
            gain.connect(audioCtx.destination)

            osc.start(now)
            osc.stop(now + 0.19)
        }

        const getFormatsToSupport = () => {
            switch (selectedScanMode.value) {
                case '1D_PRODUCT':
                    return [
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.UPC_A,
                        Html5QrcodeSupportedFormats.UPC_E
                    ]
                case '1D_LOGISTICS':
                    return [
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39
                    ]
                case '2D_QR':
                    return [ Html5QrcodeSupportedFormats.QR_CODE ]
                case 'ALL':
                default:
                    return undefined
            }
        }

        const closeScanner = () => {
            stopAutoCaptureLoop()
            scanningTarget.value = null
            isScannerOpen.value = false
            if (html5QrCode) {
                html5QrCode.stop().then(() => {
                    html5QrCode.clear()
                    html5QrCode = null
                }).catch(err => {
                    console.error("close scanner error", err)
                    showConfirm("Scanner error: " + err, 1)
                })
            }
        }

        const processScannedText = async (decodedText) => {
            if (isProcessing.value || decodedText === lastScannedText.value) return
            isProcessing.value = 1
            lastScannedText.value = decodedText
            try {
                if (!speakFeedback(decodedText)) playBeep()
                if (!await showConfirm(decodedText)) return
                if (scanningTarget.value) {
                    const { row, col } = scanningTarget.value
                    if (row) {
                        row[col.id] = decodedText
                        const currentIndex = rows.value.findIndex(r => r.id === row.id)
                        if (currentIndex !== -1) {
                            addRow()
                            setTimeout(() => {
                                scanningTarget.value = {
                                    row: rows.value[currentIndex + 1],
                                    col: col
                                }
                            }, 50)
                        }
                    } else if (col) {
                        columnFilters.value[col.id] = decodedText
                    } else {
                        globalNotes.value = decodedText
                    }
                }
            } catch (error) {
                console.error(error)
                showConfirm(error.message, 1)
            } finally {
                setTimeout(() => {
                    isProcessing.value = 0
                }, 300)
                if (scanCooldownTimer) clearTimeout(scanCooldownTimer)
                scanCooldownTimer = setTimeout(() => {
                    lastScannedText.value = ''
                }, 3000)
            }
        }

        const openScanner = async () => {
            isProcessing.value = 1
            await loadScript('https://cdn.jsdelivr.net/npm/html5-qrcode/html5-qrcode.min.js')
            playBeep()

            isScannerOpen.value = true
            lastScannedText.value = ''

            await nextTick()

            html5QrCode = new window.Html5Qrcode("reader", {
                formatsToSupport: getFormatsToSupport()
            })

            const is1D = selectedScanMode.value.startsWith('1D_')
            const idPlate = selectedScanMode.value === 'OCR_PLATE'

            const config = {
                fps: 30,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    const maxHeight = Math.min(window.innerHeight * 0.24, viewfinderHeight * 0.8)
                    let boxWidth = Math.min(viewfinderWidth * 0.85, 400)
                    let boxHeight = boxWidth
                    if (is1D) {
                        boxHeight = Math.min(viewfinderHeight * 0.4, 150)
                    } else if (idPlate) {
                        boxWidth = viewfinderWidth
                    } else {
                        boxHeight = Math.min(boxHeight, maxHeight)
                    }
                    return { width: boxWidth, height: boxHeight }
                },
                videoConstraints: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    advanced: [{ focusMode: "continuous" }]
                },
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                }
            }

            html5QrCode.start(
                { facingMode: "environment" },
                config,
                processScannedText,
                (errorMessage) => { }
            ).then(() => {
                setTimeout(() => {
                    checkCameraCapabilities()
                }, 500)
            }).catch(err => {
                console.error("start scanner error:", err)
                showConfirm("Scanner error: " + err, 1)
                closeScanner()
            }).finally(() => {
                isProcessing.value = 0
            })
        }

        const triggerQRFileUpload = async() => {
            await loadScript('https://cdn.jsdelivr.net/npm/html5-qrcode/html5-qrcode.min.js')

            if (!sharedFileInput) {
                sharedFileInput = document.createElement('input')
                sharedFileInput.type = 'file'
                sharedFileInput.accept = 'image/*'
                sharedFileInput.style.display = 'none'
                document.body.appendChild(sharedFileInput)
            }
            sharedFileInput.multiple = false
            sharedFileInput.onchange = async (e) => {
                const file = e.target.files[0]
                if (!file) return
                isProcessing.value = 0
                let decodedText = null

                try {
                    const isOCRMode = selectedScanMode.value.startsWith('OCR_')

                    if (isOCRMode) {
                        const base64Image = await new Promise((resolve, reject) => {
                            const reader = new FileReader()
                            reader.onload = () => resolve(reader.result)
                            reader.onerror = reject
                            reader.readAsDataURL(file)
                        })
                        decodedText = await processOCR(base64Image)
                    } else {
                        if ('BarcodeDetector' in window) {
                            try {
                                const imageBitmap = await createImageBitmap(file)
                                const detector = new window.BarcodeDetector()
                                const barcodes = await detector.detect(imageBitmap)
                                if (barcodes.length > 0) {
                                    decodedText = barcodes[0].rawValue
                                }
                            } catch (err) {
                                console.warn("Original JS scanner failed:", err)
                            }
                        }
                        if (!decodedText) {
                            const tempScanner = new window.Html5Qrcode("reader")
                            try {
                                decodedText = await tempScanner.scanFile(file, false)
                            } catch (err) {
                                console.warn("Temp scanner failed:", err)
                            } finally {
                                tempScanner.clear()
                            }
                        }
                    }
                    if (decodedText) {
                        await processScannedText(decodedText)
                        scanningTarget.value = null
                        isScannerOpen.value = false
                    } else if (!isOCRMode) {
                        showConfirm(translate('No QR code found in the image.'), 1)
                    }
                } catch (err) {
                    console.error("Image processing error:", err)
                    showConfirm(translate('Failed to process image.'), 1)
                } finally {
                    sharedFileInput.value = ''
                }
            }
            sharedFileInput.click()
        }

        const viewPhoto = (urls, currentIndex) => {
            photoViewer.value = { isOpen: true, urls,  currentIndex }
        }

        const removePhoto = (row, colId, index) => {
            row[colId].splice(index, 1)
            onDataEdited('rows')
        }

        const resizeImage = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.readAsDataURL(file)
                reader.onload = (event) => {
                    const img = new Image()
                    img.src = event.target.result
                    img.onload = () => {
                        const canvas = document.createElement('canvas')
                        const MAX_WIDTH = 1280
                        const MAX_HEIGHT = 1280
                        const ratio = Math.min(
                            MAX_WIDTH / img.width,
                            MAX_HEIGHT / img.height,
                            1
                        )
                        const targetWidth = Math.round(img.width * ratio)
                        const targetHeight = Math.round(img.height * ratio)
                        canvas.width = targetWidth
                        canvas.height = targetHeight
                        const ctx = canvas.getContext('2d')
                        ctx.imageSmoothingEnabled = true
                        ctx.imageSmoothingQuality = 'high'
                        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
                        resolve(canvas.toDataURL('image/jpeg', 0.8))
                    }
                    img.onerror = reject
                }
                reader.onerror = reject
            })
        }

        const triggerPhotoUpload = (row, colId) => {
            if (!sharedFileInput) {
                sharedFileInput = document.createElement('input')
                sharedFileInput.type = 'file'
                sharedFileInput.accept = 'image/*'
                sharedFileInput.style.display = 'none'
                document.body.appendChild(sharedFileInput)
            }
            sharedFileInput.multiple = true

            sharedFileInput.onchange = async (e) => {
                const files = e.target.files
                if (!files || files.length === 0) return
                if (!Array.isArray(row[colId])) {
                    row[colId] = row[colId] ? [row[colId]] : []
                }
                try {
                    for (const element of files) {
                        const base64 = await resizeImage(element)
                        row[colId].push(base64)
                    }
                    onDataEdited('rows')
                } catch (err) {
                    console.error('Image Error:', err)
                    showConfirm(translate('Failed to process image.'), 1)
                } finally {
                    sharedFileInput.value = ''
                }
            }
            sharedFileInput.click()
        }

        const toggleDateFilter = (event, colId, forceState) => {
            if (forceState !== undefined) {
                dateRangeOpenState.value[colId] = forceState
            } else {
                dateRangeOpenState.value[colId] = !dateRangeOpenState.value[colId]
            }
            if (dateRangeOpenState.value[colId]) {
                lockLayoutForFilter()
                Object.keys(dateRangeOpenState.value).forEach(k => {
                    if (k !== colId) dateRangeOpenState.value[k] = false
                })
            } else if (!isFilterInteractionActive() && !isAnyFilterActive.value) {
                releaseFilterLayoutLock()
            }
            const rect = event.target.getBoundingClientRect()
            menuStyle.value = {
                top: `${rect.bottom + window.scrollY}px`,
                left: `${rect.left + window.scrollX}px`
            }
        }

        const updateDateRange = (colId, field, value) => {
            if (!dateRangeFilters.value[colId]) {
                dateRangeFilters.value[colId] = { start: '', end: '' }
            }
            dateRangeFilters.value[colId][field] = value
            if (field === 'start' && value !== '') {
                const currentEnd = dateRangeFilters.value[colId].end
                if (currentEnd !== '') {
                    const colDef = columns.value.find(c => c.id === colId)
                    const isNumber = colDef && isNumericType(colDef.type)
                    if (isNumber) {
                        if (parseFloat(value) > parseFloat(currentEnd)) {
                            dateRangeFilters.value[colId].end = value
                        }
                    } else if (value > currentEnd) {
                        dateRangeFilters.value[colId].end = value
                    }
                }
            }
        }

        const clearDateRange = (colId) => {
            dateRangeOpenState.value[colId] = false
            if (dateRangeFilters.value[colId]) {
                dateRangeFilters.value[colId] = { start: '', end: '' }
            }
        }

        const clearFilter = (colId) => {
            columnFilters.value[colId] = ''
        }

        const clearAllFilters = () => {
            Object.keys(columnFilters.value).forEach(key => {
                columnFilters.value[key] = ''
            })
            Object.keys(dateRangeFilters.value).forEach(key => {
                dateRangeFilters.value[key] = { start: '', end: '' }
            })
            Object.keys(dateRangeOpenState.value).forEach(key => {
                dateRangeOpenState.value[key] = false
            })
            selectedChartDate.value = null
            if (!isFilterInteractionActive()) {
                releaseFilterLayoutLock()
            }
        }

        const toggleTrendChartType = (type) => {
            const types = ['bar', 'line', 'total']
            if (typeof type === 'string' && types.includes(type)) {
                if (trendChartType.value === type) return
                trendChartType.value = type
            } else {
                const nextIndex = (types.indexOf(trendChartType.value) + 1) % types.length
                trendChartType.value = types[nextIndex]
            }
            if (isChartOpen.value) {
                debouncedUpdateChart.cancel()
                debouncedUpdateChart()
            }
        }

        const onScrollBtnsEnter = () => {
            clearTimeout(scrollHideTimer)
            isScrolling.value = true
        }

        const onScrollBtnsLeave = () => {
            scrollHideTimer = setTimeout(() => {
                isScrolling.value = false
            }, 3000)
        }

        const copyShareLink = () => {
            navigator.clipboard.writeText(shareModal.value.link).then(() => {
                showConfirm(translate('Copied to clipboard!'), 1)
            }).catch(() => {})
        }

        const copyQuickAddLink = () => {
            const link = `${window.location.origin}${window.location.pathname}#ws:${encodeURIComponent(currentStorageKey.value)}/add`
            navigator.clipboard.writeText(link).then(() => {
                showConfirm(translate('Quick Add Link copied! Add it to your home screen or bookmarks.'), 1)
            }).catch(() => {
                showConfirm(translate('Failed to copy link.'), 1)
            })
        }

        const generateShareLink = async () => {
            isProcessing.value = 1
            await loadScript('https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js')

            try {
                let link = ''
                const gistValue = gistId.value.trim()
                if (gistValue) {
                    link = `${window.location.origin}${window.location.pathname}#gist:${gistValue}`
                } else {

                    const photoCol = columns.value.find(col => col.type === 'photo')
                    const payload = { workspace: currentStorageKey.value, columns: toRaw(columns.value), rows: toRaw(rows.value), note: globalNotes.value, budgets: toRaw(categoryBudgets.value) }
                    if (photoCol) {
                        payload.rows = payload.rows.map(({[photoCol.id]: photos, ...rest }) => rest)
                    }
                    const jsonString = JSON.stringify(payload)
                    const compressedBase64 = await compressToBase64(jsonString)
                    const encoded = encodeURIComponent(compressedBase64)
                    link = `${window.location.origin}${window.location.pathname}#data:${encoded}`
                }

                QRCode.toDataURL(link, { width: 250, margin: 2, color: { dark: '#3730A3', light: '#FFFFFF' } }, (err, url) => {
                    if (err) return showConfirm(err, 1)
                    shareModal.value = {
                        isOpen: true,
                        qrUrl: url,
                        link: link,
                        title: translate('Share Link & QRCode'),
                        desc: translate('Scan the QRCode below to load data<br>(Ideal for mobile)')
                    }
                })
            } catch (e) {
                showConfirm(translate('Failed to generate link.'), 1)
            } finally {
                isProcessing.value = 0
            }
        }

        const shareRow = async () => {
            const row = activeMenuRow.value
            if (!row) return
            closeActionMenu()
            isProcessing.value = 1
            await loadScript('https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js')

            try {
                const rawRowData = { ...toRaw(row) }
                const photoCol = columns.value.find(col => col.type === 'photo')
                if (photoCol) {
                    delete rawRowData[photoCol.id]
                }
                delete rawRowData.id

                const payload = {
                    columns: toRaw(columns.value),
                    rows: [rawRowData]
                }

                const jsonString = JSON.stringify(payload)
                const compressedBase64 = await compressToBase64(jsonString)
                const encoded = encodeURIComponent(compressedBase64)
                const link = `${window.location.origin}${window.location.pathname}#data:${encoded}`

                QRCode.toDataURL(link, { width: 250, margin: 2, color: { dark: '#3730A3', light: '#FFFFFF' } }, (err, url) => {
                    if (err) return showConfirm(err, 1)
                    shareModal.value = {
                        isOpen: true,
                        qrUrl: url,
                        link: link,
                        title: translate('Share Link & QRCode'),
                        desc: translate('Scan the QRCode below to load data<br>(Ideal for mobile)')
                    }
                })
            } catch (e) {
                showConfirm(translate('Failed to generate link.'), 1)
            } finally {
                isProcessing.value = 0
            }
        }

        const processOCR = async (base64Image) => {
            const apiKey = googleVisionKey.value.trim()
            isProcessing.value = 1
            try {
                const base64Data = base64Image.split(',')[1]
                const payload = {
                    requests: [
                        {
                            image: { content: base64Data },
                            features: [{ type: "TEXT_DETECTION" }]
                        }
                    ]
                }
                let fullText
                if (apiKey) {
                    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                    const result = await response.json()
                    if (result.error) throw new Error(result.error.message)
                    const texts = result.responses?.[0]?.textAnnotations
                    fullText = texts?.[0]?.description || ''
                } else {
                    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/tesseract.min.js')
                    let lang = 'eng'
                    switch(currentLanguage.value) {
                    case 'zh-TW':
                        lang += '+chi_tra'
                        break
                    case 'zh-CN':
                        lang += '+chi_sim'
                        break
                    }
                    const result = await Tesseract.recognize(
                        base64Image,
                        lang
                    )
                    fullText = result.data.text.trim()
                }
                if (!fullText || fullText.length === 0) {
                    showConfirm(translate('No text detected.'))
                    return
                }

                playBeep()
                if (await showConfirm(fullText)) {
                    return fullText
                }
            } catch (error) {
                console.error("OCR API Error:", error)
                showConfirm('OCR API Error:' + error.message, true)
            } finally {
                isProcessing.value = 0
            }
        }

        const startAutoCaptureLoop = async () => {
            if (!isScannerOpen.value || !isAutoScanEnabled.value) {
                stopAutoCaptureLoop()
                return
            }

            const videoEl = document.querySelector('#reader video')
            if (!videoEl || isProcessing.value || videoEl.readyState !== 4) {
                detectionLoopId = requestAnimationFrame(startAutoCaptureLoop)
                return
            }

            try {
                const predictions = await aiModel.detect(videoEl)
                const hasVehicle = predictions.some(p => p.score > 0.5)

                if (hasVehicle) {
                    emptyFrames = 0
                    if (!isCarLocked) {
                        stableFrames++
                        if (stableFrames >= 15) {
                            console.log('🎯 target stable')
                            isCarLocked = true
                            stableFrames = 0
                            await captureForOCR()
                            await new Promise(resolve => setTimeout(resolve, 2000))
                        }
                    }
                } else {
                    stableFrames = 0
                    emptyFrames++
                    if (emptyFrames >= 15) {
                        if (isCarLocked) {
                            console.log('unlocked')
                        }
                        isCarLocked = false
                    }
                }
            } catch (e) {
                console.error("Auto capture loop error:", e)
            }
            detectionLoopId = requestAnimationFrame(startAutoCaptureLoop)
        }

        const stopAutoCaptureLoop = () => {
            if (detectionLoopId) {
                cancelAnimationFrame(detectionLoopId)
                detectionLoopId = null
            }
            stableFrames = 0
            emptyFrames = 0
            isCarLocked = false
        }

        const initEdgeAI = async () => {
            if (aiModel) {
                stopAutoCaptureLoop()
                startAutoCaptureLoop()
                return
            }

            isProcessing.value = 1
            try {
                if (!window.tf) {
                    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs')
                }
                if (!window.cocoSsd) {
                    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd')
                }

                aiModel = await window.cocoSsd.load()
                startAutoCaptureLoop()

            } catch (error) {
                showConfirm(translate('AI Model load failed: ' + error.message), 1)
            } finally {
                isProcessing.value = 0
            }
        }

        const captureForOCR = async () => {
            const videoEl = document.querySelector('#reader video')
            if (!videoEl) {
                showConfirm(translate('No video element found.'), 1)
                return
            }
            playBeep()
            if (document.activeElement && document.activeElement.tagName === 'INPUT') {
                document.activeElement.blur()
            }

            let cropWidth = 600
            let cropHeight = 350
            cropWidth = Math.min(cropWidth, videoEl.videoWidth * 0.9)
            cropHeight = Math.min(cropHeight, videoEl.videoHeight * 0.9)
            const startX = Math.floor((videoEl.videoWidth - cropWidth) / 2)
            const startY = Math.floor((videoEl.videoHeight - cropHeight) / 2)

            const canvas = document.createElement('canvas')
            canvas.width = cropWidth
            canvas.height = cropHeight

            const ctx = canvas.getContext('2d')
            ctx.imageSmoothingEnabled = false

            ctx.drawImage(
                videoEl,
                startX,
                startY,
                cropWidth,
                cropHeight,
                0, 0,
                canvas.width, canvas.height
            )

            const base64Image = canvas.toDataURL('image/jpeg', 0.8)
            debugImageUrl.value = base64Image
            canvas.width = 0
            canvas.height = 0
            const recognizedText = await processOCR(base64Image)
            if (recognizedText) {
                if (recognizedText === lastScannedText.value) {
                    console.warn(`🛡️ ${recognizedText} already exists`)
                    return
                }
                lastScannedText.value = recognizedText
                playBeep()
                if (scanningTarget.value) {
                    const { row, col } = scanningTarget.value
                    if (row) {
                        row[col.id] = recognizedText
                        const currentIndex = rows.value.findIndex(r => r.id === row.id)
                        if (currentIndex !== -1) {
                            addRow()
                            setTimeout(() => {
                                scanningTarget.value = {
                                    row: rows.value[currentIndex + 1],
                                    col: col
                                }
                            }, 50)
                        }
                    } else if (col) {
                        columnFilters.value[col.id] = recognizedText
                    } else {
                        globalNotes.value = recognizedText
                    }
                }
            }
        }

        const checkCameraCapabilities = async () => {
            await nextTick()
            const videoEl = document.querySelector('#reader video')
            if (videoEl && videoEl.srcObject) {
                cameraTrack = videoEl.srcObject.getVideoTracks()[0]
                const capabilities = cameraTrack.getCapabilities()
                const settings = cameraTrack.getSettings()
                if (capabilities && 'zoom' in capabilities) {
                    isZoomSupported.value = true
                    minZoom.value = capabilities.zoom.min
                    maxZoom.value = capabilities.zoom.max
                    currentZoom.value = settings.zoom || capabilities.zoom.min
                }
                if (capabilities && 'torch' in capabilities) {
                    isTorchSupported.value = true
                    isTorchOn.value = settings.torch || false
                    console.log('Torch support detected: ', isTorchSupported.value)
                } else {
                    isTorchSupported.value = false
                }
            }
        }

        const toggleTorch = async () => {
            if (!cameraTrack || !isTorchSupported.value) return

            try {
                isTorchOn.value = !isTorchOn.value
                await cameraTrack.applyConstraints({
                    advanced: [{ torch: isTorchOn.value }]
                })
            } catch (error) {
                console.error("Failed to toggle torch:", error)
                isTorchOn.value = !isTorchOn.value
                showConfirm(translate('Failed to toggle torch. Please check your device settings.'), 1)
            }
        }

        const formatForSpellOut = (text) => {
            const str = String(text).trim()
            if (/^\d+$/.test(str)) {
                return str.split('').join(' ')
            }
            return str
        }

        const speakFeedback = (text, isError = false) => {
            if (!window.speechSynthesis || !isVoiceEnabled.value) return

            window.speechSynthesis.cancel()

            const utterance = new SpeechSynthesisUtterance(formatForSpellOut(text))
            utterance.lang = currentLanguage.value
            utterance.volume = voiceSettings.volume

            if (isError) {
                utterance.rate = Math.max(0.5, voiceSettings.rate - 0.3)
                utterance.pitch = Math.max(0, voiceSettings.pitch - 0.3)
            } else {
                utterance.rate = voiceSettings.rate
                utterance.pitch = voiceSettings.pitch
            }
            window.speechSynthesis.speak(utterance)
            return true
        }

        const playTestSound = () => {
            speakFeedback(translate('This is a test message.'))
        }

        const openGlobalMenu = (event, row, col) => {
            if (!col || !['number', 'category'].includes(col.type)) {
                isKeyboardOpen.value = false
                activeRow.value = null
                activeDropdownIndex.value = -1
                return
            }
            const isLabel = !event || ['LABEL', 'SPAN'].includes(event.target.tagName)
            const target = isLabel ? inputRefs.value[`${row.id}-${col.id}`] : event.target
            activeRow.value = {target, row, col, start: target.selectionStart, end: target.selectionEnd}
            const rect = target.getBoundingClientRect()

            menuStyle.value = {
                top: `${rect.bottom + window.scrollY}px`
            }

            isKeyboardOpen.value = false
            if (col.type !== 'category' && isLabel) {
                target.inputMode = target.inputMode === 'decimal' ? 'none' : 'decimal'
                isKeyboardOpen.value = target.inputMode === 'none'
            } else {
                menuStyle.value.left = `${rect.left + window.scrollX}px`
                menuStyle.value.width = `${rect.width}px`
            }
        }

        const selectOption = (opt) => {
            if (activeRow.value) {
                if (activeRow.value.row) {
                    activeRow.value.row[activeRow.value.col.id] = opt
                    onDataEdited()
                } else {
                    columnFilters.value[activeRow.value.col.id] = opt
                }
                activeRow.value.target.value = opt
            }
            activeRow.value = null
        }

        const append = (char) => {
            const el = activeRow.value?.target
            if (!el) return
            const start = activeRow.value.start
            const end = activeRow.value.end
            el.value = el.value.slice(0, start) + char + el.value.slice(end)
            activeRow.value.row[activeRow.value.col.id] = el.value
            activeRow.value.start = start + 1
            activeRow.value.end = start + 1
        }

        const backspace = () => {
            const el = activeRow.value?.target
            if (!el) return
            const start = activeRow.value.start > 0 ? activeRow.value.start : el.value.length
            const end = activeRow.value.end > 0 ? activeRow.value.end : el.value.length
            el.value = el.value.slice(0, start - 1) + el.value.slice(end)
            activeRow.value.row[activeRow.value.col.id] = el.value
            activeRow.value.start = start - 1
            activeRow.value.end = start - 1
        }

        const clearAll = () => {
            if (!activeRow.value) return
            activeRow.value.target.value = ''
            activeRow.value.row[activeRow.value.col.id] = ''
        }

        const doCalc = () => {
            const el = activeRow.value?.target
            if (!el) return
            isKeyboardOpen.value = false
            el.value = calculateInlineMath(activeRow.value.row[activeRow.value.col.id])
            activeRow.value.row[activeRow.value.col.id] = el.value
            onDataEdited()
        }

        const toggleTitle = () => {
            isTitleOpen.value = !isTitleOpen.value
            isTitleOpen.value ? localStorage.setItem('ty_title_open', 1) : localStorage.removeItem('ty_title_open')
        }

        const saveScrollPosition = debounce((scrollTop) => {
            if (!currentStorageKey.value) return
            localStorage.setItem(`${currentStorageKey.value}_scrollTop`, scrollTop)
        }, 300)

        const restoreScrollPosition = () => {
            if (!tableContainer.value || !currentStorageKey.value) return
            const savedTop = localStorage.getItem(`${currentStorageKey.value}_scrollTop`)
            if (!savedTop) return

            const targetTop = parseFloat(savedTop)
            if (targetTop <= 0) return
            tableContainer.value.scrollTop = targetTop

            setTimeout(() => {
                if (tableContainer.value) {
                    tableContainer.value.scrollTop = targetTop
                }
            }, 50)

            setTimeout(() => {
                if (tableContainer.value) {
                    tableContainer.value.scrollTop = targetTop
                }
            }, 200)
        }

        const selectAllTableCells = () => {
            if (confirmModal.value.isOpen || workspaceModal.value.isOpen || shareModal.value.isOpen || photoViewer.value.isOpen) return false
            if (filteredRows.value.length === 0 || columns.value.length === 0) return false
            startCell.value = { row: 0, col: 0 }
            endCell.value = { row: filteredRows.value.length - 1, col: columns.value.length - 1 }
            isCopied.value = false
            return true
        }

        const handleKeydown = async (e) => {
            const activeEl = document.activeElement
            const activeTag = activeEl?.tagName

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                const isTableInput = activeEl && tableContainer.value?.contains(activeEl) && activeTag === 'INPUT'
                if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
                    if (!isTableInput) return
                    const isTextInput = !['checkbox', 'date', 'time', 'color', 'range'].includes(activeEl.type)
                    const valLen = (activeEl.value || '').length
                    const isAlreadyAllSelected = !isTextInput || valLen === 0 || (activeEl.selectionStart === 0 && activeEl.selectionEnd === valLen)
                    if (!isAlreadyAllSelected) return
                    activeEl.blur()
                }
                if (selectAllTableCells()) {
                    e.preventDefault()
                }
                return
            }

            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return

            if (e.key === 'Escape') {
                if (isWorkspaceMenuOpen.value) {
                    isWorkspaceMenuOpen.value = false
                    return
                }
                if (isFullscreen.value) {
                    toggleFullscreen()
                    return
                }
                if (isCopied.value) {
                    isCopied.value = false
                    return
                }
                if (selectedBox.value) {
                    startCell.value = null
                    endCell.value = null
                    return
                }
            }

            if (e.key === 'Enter' && selectedBox.value) {
                if (e.isComposing || ['BUTTON', 'SELECT', 'A'].includes(activeTag)) return
                e.preventDefault()

                const currentRow = startCell.value ? startCell.value.row : selectedBox.value.minRow
                const currentCol = startCell.value ? startCell.value.col : selectedBox.value.minCol
                const nextRow = currentRow + (e.shiftKey ? -1 : 1)

                if (nextRow >= 0 && nextRow < filteredRows.value.length) {
                    startCell.value = { row: nextRow, col: currentCol }
                    endCell.value = { row: nextRow, col: currentCol }

                    const nextRowData = filteredRows.value[nextRow]
                    const col = columns.value[currentCol]
                    const nextInput = nextRowData && col ? inputRefs.value[`${nextRowData.id}-${col.id}`] : null
                    if (nextInput) {
                        nextInput.focus()
                        nextInput.select?.()
                    } else if (nextRowData) {
                        const tr = tableContainer.value?.querySelector(`tr[data-id="${nextRowData.id}"]`)
                        tr?.scrollIntoView({ block: 'nearest' })
                    }
                }
                return
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBox.value) {
                handleDelete()
                e.preventDefault()
            }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                if (!selectedBox.value) return
                e.preventDefault()

                const { minRow, maxRow, minCol, maxCol } = selectedBox.value
                const tsvLines = []

                for (let r = minRow; r <= maxRow; r++) {
                    const rowData = []
                    for (let c = minCol; c <= maxCol; c++) {
                        const colId = columns.value[c].id
                        let cellValue = filteredRows.value[r] ? filteredRows.value[r][colId] : ''

                        if (cellValue === undefined || cellValue === null) {
                            cellValue = ''
                        } else {
                            cellValue = String(cellValue).replace(/\r?\n/g, ' ')
                        }

                        rowData.push(cellValue)
                    }
                    tsvLines.push(rowData.join('\t'))
                }

                const finalClipboardText = tsvLines.join('\n')

                try {
                    await navigator.clipboard.writeText(finalClipboardText)
                    isCopied.value = true
                    console.log('Copy successful')
                } catch (err) {
                    console.error('Copy failed:', err)
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
                if (!selectedBox.value) return
                e.preventDefault()

                const { minRow, maxRow, minCol, maxCol } = selectedBox.value
                const tsvLines = []

                for (let r = minRow; r <= maxRow; r++) {
                    const rowData = []
                    for (let c = minCol; c <= maxCol; c++) {
                        const colId = columns.value[c].id
                        let cellValue = filteredRows.value[r] ? filteredRows.value[r][colId] : ''

                        if (cellValue === undefined || cellValue === null) {
                            cellValue = ''
                        } else {
                            cellValue = String(cellValue).replace(/\r?\n/g, ' ')
                        }

                        rowData.push(cellValue)
                    }
                    tsvLines.push(rowData.join('\t'))
                }

                const finalClipboardText = tsvLines.join('\n')

                try {
                    await navigator.clipboard.writeText(finalClipboardText)
                    handleDelete()
                    isCopied.value = true
                } catch (err) {
                    console.error('Cut failed:', err)
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                if (!selectedBox.value && !startCell.value) return
                e.preventDefault()

                try {
                    const pasteText = await navigator.clipboard.readText()
                    if (!pasteText) return
                    const mockEvent = {
                        clipboardData: {
                            getData: () => pasteText
                        },
                        preventDefault: () => {}
                    }
                    const targetRowIndex = selectedBox.value ? selectedBox.value.minRow : startCell.value.row
                    const targetColIndex = selectedBox.value ? selectedBox.value.minCol : startCell.value.col
                    const targetColId = columns.value[targetColIndex].id

                    handlePaste(mockEvent, targetRowIndex, targetColId)

                } catch (err) {
                    console.error('Paste failed:', err)
                }
            }

            if (!photoViewer.value.isOpen) return

            if (e.key === 'ArrowRight') {
                if (photoViewer.value.currentIndex < photoViewer.value.urls.length - 1) {
                    photoViewer.value.currentIndex++
                }
            }
            else if (e.key === 'ArrowLeft') {
                if (photoViewer.value.currentIndex > 0) {
                    photoViewer.value.currentIndex--
                }
            }
            else if (e.key === 'Escape') {
                photoViewer.value.isOpen = false
            }
        }

        const toggleFullscreen = async () => {
            isFullscreen.value = !isFullscreen.value
            if (isFullscreen.value) {
                document.body.style.overflow = 'hidden'
            } else {
                document.body.style.overflow = ''
            }
        }

        const handlePaste = (e, index, startColId) => {
            const pasteData = e.clipboardData?.getData('text')
            if (!pasteData) return

            const isMultiSelected = selectedBox.value &&
                (selectedBox.value.minRow !== selectedBox.value.maxRow || selectedBox.value.minCol !== selectedBox.value.maxCol)

            if (!isMultiSelected && !pasteData.includes('\t') && !pasteData.includes('\n')) {
                return
            }

            e.preventDefault()
            const pastedRows = pasteData.split(/\r\n|\n|\r/).filter(row => row.trim() !== '')

            const newRows = [...rows.value]
            let hasChanges = false

            if (isMultiSelected) {
                const { minRow, maxRow, minCol, maxCol } = selectedBox.value
                const isSingleValue = pastedRows.length === 1 && !pastedRows[0].includes('\t')
                const singleValue = pastedRows[0].trim()
                for (let r = minRow; r <= maxRow; r++) {
                    const targetFilteredRow = filteredRows.value[r]
                    if (!targetFilteredRow) continue
                    const actualIndex = newRows.findIndex(row => row.id === targetFilteredRow.id)
                    if (actualIndex === -1) continue

                    newRows[actualIndex] = { ...newRows[actualIndex] }
                    const pasteRowIdx = (r - minRow) % pastedRows.length
                    const cells = pastedRows[pasteRowIdx].split('\t')
                    for (let c = minCol; c <= maxCol; c++) {
                        const colId = columns.value[c].id
                        const colType = columns.value[c].type
                        if (!isCalcType(colType) && colType !== 'photo') {
                            let newVal = ''
                            if (isSingleValue) {
                                newVal = singleValue
                            } else {
                                const pasteColIdx = (c - minCol) % cells.length
                                newVal = (cells[pasteColIdx] || '').trim()
                            }
                            if (colType === 'tags') newVal = normalizeTags(newVal)
                            else if (colType === 'rating') newVal = Math.min(5, Math.max(0, Math.round(Number(newVal) || 0)))
                            else if (colType === 'progress') newVal = clampProgress(newVal)

                            if (newRows[actualIndex][colId] !== newVal) {
                                newRows[actualIndex][colId] = newVal
                                hasChanges = true
                            }
                        }
                    }
                }
            } else {
                const startColIndex = columns.value.findIndex(c => c.id === startColId)
                if (startColIndex === -1) return
                const absoluteStartRow = index
                const { todayDate, currentTime } = getDate()

                pastedRows.forEach((rowString, i) => {
                    const targetFilteredIndex = absoluteStartRow + i
                    let targetFilteredRow = filteredRows.value[targetFilteredIndex]
                    let actualIndex = -1
                    if (targetFilteredRow) {
                        actualIndex = newRows.findIndex(row => row.id === targetFilteredRow.id)
                    } else {
                        const newRow = { id: generateId(), note: '', isExpanded: false }
                        columns.value.forEach(col => {
                            if (col.type === 'number') newRow[col.id] = null
                            else if (col.type === 'photo' || col.type === 'tags') newRow[col.id] = []
                            else if (col.type === 'rating' || col.type === 'progress') newRow[col.id] = 0
                            else if (col.type === 'color') newRow[col.id] = '#3b82f6'
                            else if (col.type === 'checkbox') newRow[col.id] = false
                            else if (col.type === 'date') newRow[col.id] = todayDate
                            else if (col.type === 'time') newRow[col.id] = currentTime
                            else newRow[col.id] = ''
                        })
                        newRows.push(newRow)
                        actualIndex = newRows.length - 1
                    }

                    if (actualIndex === -1) return

                    newRows[actualIndex] = { ...newRows[actualIndex] }
                    const cells = rowString.split('\t')

                    cells.forEach((cellValue, j) => {
                        const targetColIndex = startColIndex + j
                        if (targetColIndex < columns.value.length) {
                            const targetColId = columns.value[targetColIndex].id
                            const colType = columns.value[targetColIndex].type
                            if (!isCalcType(colType) && colType !== 'photo') {
                                let finalVal = cellValue.trim()
                                if (colType === 'tags') {
                                    finalVal = normalizeTags(finalVal)
                                } else if (colType === 'rating') {
                                    finalVal = Math.min(5, Math.max(0, Math.round(Number(finalVal) || 0)))
                                } else if (colType === 'progress') {
                                    finalVal = clampProgress(finalVal)
                                } else if (['text', 'category', 'number'].includes(colType)) {
                                    const mixedMatch = finalVal.match(/^(.*?[^\d\s])\s*(\d+(?:\.\d+)?)\s*$/)
                                    if (mixedMatch) {
                                        const parsedText = mixedMatch[1].trim()
                                        const parsedNumber = mixedMatch[2]
                                        if (colType === 'number') {
                                            finalVal = parsedNumber
                                            const textCol = columns.value.find(c => c.type === 'text') || columns.value.find(c => c.type === 'category') || columns.value.find(c => c.type === 'note')
                                            if (textCol && newRows[actualIndex][textCol.id] !== parsedText) {
                                                newRows[actualIndex][textCol.id] = parsedText
                                                hasChanges = true
                                            }
                                        } else {
                                            finalVal = parsedText
                                            const numCol = columns.value.find(c => c.type === 'number')
                                            if (numCol && newRows[actualIndex][numCol.id] !== parsedNumber) {
                                                newRows[actualIndex][numCol.id] = parsedNumber
                                                hasChanges = true
                                            }
                                        }
                                    }
                                }

                                if (newRows[actualIndex][targetColId] !== finalVal) {
                                    newRows[actualIndex][targetColId] = finalVal
                                    hasChanges = true
                                }
                            }
                        }
                    })
                })
            }

            if (hasChanges) {
                rows.value = newRows
                onDataEdited()
            }
        }

        const getSelectionStyles = (rowIndex, colIndex) => {
            const defaultStyle = {
                class: 'bg-white dark:bg-gray-800',
                style: ''
            }

            if (!selectedBox.value) return defaultStyle

            const { minRow, maxRow, minCol, maxCol } = selectedBox.value

            if (rowIndex < minRow || rowIndex > maxRow || colIndex < minCol || colIndex > maxCol) {
                return defaultStyle
            }

            let classes = 'bg-blue-100 dark:bg-blue-900/40 relative z-10 '

            if (isCopied.value) {
                let bgImages = []
                let bgPositions = []
                let bgSizes = []
                let bgRepeats = []

                const dashColor = '#3b82f6'
                const dashSize = '10px'
                const strokeWidth = '2px'

                if (rowIndex === minRow) {
                    bgImages.push(`linear-gradient(90deg, ${dashColor} 50%, transparent 50%)`)
                    bgPositions.push('top left')
                    bgSizes.push(`${dashSize} ${strokeWidth}`)
                    bgRepeats.push('repeat-x')
                }
                if (rowIndex === maxRow) {
                    bgImages.push(`linear-gradient(90deg, ${dashColor} 50%, transparent 50%)`)
                    bgPositions.push('bottom left')
                    bgSizes.push(`${dashSize} ${strokeWidth}`)
                    bgRepeats.push('repeat-x')
                }
                if (colIndex === minCol) {
                    bgImages.push(`linear-gradient(180deg, ${dashColor} 50%, transparent 50%)`)
                    bgPositions.push('top left')
                    bgSizes.push(`${strokeWidth} ${dashSize}`)
                    bgRepeats.push('repeat-y')
                }
                if (colIndex === maxCol) {
                    bgImages.push(`linear-gradient(180deg, ${dashColor} 50%, transparent 50%)`)
                    bgPositions.push('top right')
                    bgSizes.push(`${strokeWidth} ${dashSize}`)
                    bgRepeats.push('repeat-y')
                }

                return {
                    class: classes,
                    style: bgImages.length > 0 ? `
                        background-image: ${bgImages.join(', ')};
                        background-position: ${bgPositions.join(', ')};
                        background-size: ${bgSizes.join(', ')};
                        background-repeat: ${bgRepeats.join(', ')};
                    ` : ''
                }
            } else {
                let shadows = []
                if (rowIndex === minRow) shadows.push('inset 0 2px 0 0 #3b82f6')
                if (rowIndex === maxRow) shadows.push('inset 0 -2px 0 0 #3b82f6')
                if (colIndex === minCol) shadows.push('inset 2px 0 0 0 #3b82f6')
                if (colIndex === maxCol) shadows.push('inset -2px 0 0 0 #3b82f6')

                return {
                    class: classes,
                    style: shadows.length > 0 ? `box-shadow: ${shadows.join(', ')};` : ''
                }
            }
        }

        const isCellSelected = (rowIndex, colIndex) => {
            if (!selectedBox.value) return false
            const box = selectedBox.value
            return rowIndex >= box.minRow && rowIndex <= box.maxRow &&
                colIndex >= box.minCol && colIndex <= box.maxCol
        }

        const handleMouseDown = (rowIndex, colIndex, e) => {
            isCopied.value = false
            if (e && e.shiftKey) {
                e.preventDefault()
                if (startCell.value) {
                    endCell.value = { row: rowIndex, col: colIndex }
                } else {
                    startCell.value = { row: rowIndex, col: colIndex }
                    endCell.value = { row: rowIndex, col: colIndex }
                }
            } else {
                startCell.value = { row: rowIndex, col: colIndex }
                endCell.value = { row: rowIndex, col: colIndex }
            }

            isDragging.value = true
        }

        const handleMouseEnter = (rowIndex, colIndex) => {
            if (isDragging.value) {
                endCell.value = { row: rowIndex, col: colIndex }
                if (startCell.value.row !== rowIndex || startCell.value.col !== colIndex) {
                    const activeTag = document.activeElement?.tagName
                    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
                        document.activeElement.blur()
                    }
                }
            }
        }

        const handleMouseUp = () => {
            if (isDragging.value) {
                isDragging.value = false
            }
        }

        const handleDelete = () => {
            if (!selectedBox.value) return
            const { minRow, maxRow, minCol, maxCol } = selectedBox.value
            const isWholeRowSelected = minCol === 0 && maxCol === columns.value.length - 1

            if (isWholeRowSelected) {
                const idsToDelete = new Set()
                for (let r = minRow; r <= maxRow; r++) {
                    if (filteredRows.value[r]) idsToDelete.add(filteredRows.value[r].id)
                }
                rows.value = rows.value.filter(row => !idsToDelete.has(row.id))
                startCell.value = null
                endCell.value = null
                isDragging.value = false

            } else {
                for (let r = minRow; r <= maxRow; r++) {
                    for (let c = minCol; c <= maxCol; c++) {
                        const colId = columns.value[c].id
                        const colType = columns.value[c].type
                        if (!isCalcType(colType) && colType !== 'photo' && filteredRows.value[r]) {
                            if (colType === 'tags') filteredRows.value[r][colId] = []
                            else if (colType === 'rating' || colType === 'progress') filteredRows.value[r][colId] = 0
                            else if (colType === 'checkbox') filteredRows.value[r][colId] = false
                            else filteredRows.value[r][colId] = ''
                        }
                    }
                }
            }

            onDataEdited()
        }

        const observeRow = (el, id) => {
            if (el && !observedRows.has(el)) {
                el.dataset.rowId = id
                if (resizeObserver) resizeObserver.observe(el)
                observedRows.add(el)
            }
        }

        const getCheckboxProgressClass = (progressStr) => {
            if (!progressStr || typeof progressStr !== 'string') return 'text-gray-500 dark:text-gray-400 font-medium'
            const [checked, total] = progressStr.split(' / ')
            if (total === '0') return 'text-gray-400 dark:text-gray-500 font-medium'
            if (checked === total) return 'text-emerald-600 dark:text-emerald-400 font-bold'
            if (checked !== '0') return 'text-blue-600 dark:text-blue-400 font-semibold'
            return 'text-gray-500 dark:text-gray-400 font-medium'
        }

        const getCheckboxProgressPercent = (progressStr) => {
            if (!progressStr || typeof progressStr !== 'string') return 0
            const [checked, total] = progressStr.split(' / ').map(Number)
            if (!total || total === 0) return 0
            return Math.round((checked / total) * 100)
        }

        const getProgressBarColor = (percent) => {
            if (percent === 100) return 'bg-emerald-500 dark:bg-emerald-400'
            if (percent > 0) return 'bg-blue-500 dark:bg-blue-400'
            return 'bg-transparent'
        }

        const handleAppResume = () => {
            if (document.visibilityState === 'visible') {
                checkAndAutoSync()
            }
        }

        const deleteCategoryBudget = async (categoryName) => {
            if (!await showConfirm(translate('Are you sure you want to delete the budget for {category}?', {category: categoryName}))) {
                return
            }

            try {
                const updatedBudgets = {...categoryBudgets.value}
                delete updatedBudgets[categoryName]
                categoryBudgets.value = updatedBudgets
            } catch (error) {
                console.error('Failed to delete budget:', error)
            }
        }

        const isOnline = ref(navigator.onLine)
        const showBadges = ref(navigator.onLine)
        const failedBadges = reactive({
            version: false,
            lastCommit: false,
            jsdelivr: false
        })
        const handleOnline = () => {
            isOnline.value = true
            showBadges.value = true
            failedBadges.version = false
            failedBadges.lastCommit = false
            failedBadges.jsdelivr = false
            checkAndAutoSync()
        }
        const handleOffline = () => {
            isOnline.value = false
        }

        onMounted(async () => {
            if (import.meta.env.PROD && globalThis.location.protocol === 'https:' && !document.querySelector('script[src*="cloudflareinsights.com/beacon.min.js"]')) {
                const cfScript = document.createElement('script')
                cfScript.defer = true
                cfScript.src = 'https://static.cloudflareinsights.com/beacon.min.js'
                cfScript.setAttribute('data-cf-beacon', '{"token": "08470c68d5e14ce79f13132ddba0a11f"}')
                document.head.appendChild(cfScript)
            }

            if ('serviceWorker' in navigator && import.meta.env.PROD) {
                const registerSW = () => {
                    const wb = new Workbox('./sw.js')
                    wb.addEventListener('waiting', async () => {
                        if (await showConfirm(translate('A new version is available. Do you want to reload?'))) {
                            wb.messageSkipWaiting()
                        }
                    })
                    wb.addEventListener('controlling', () => {
                        globalThis.location.reload()
                    })
                    wb.register()
                        .then(() => console.log('ServiceWorker registered successfully'))
                        .catch((err) => console.log('ServiceWorker registration failed:', err))
                }
                if (document.readyState === 'complete') {
                    registerSW()
                } else {
                    window.addEventListener('load', registerSW, { once: true })
                }
            }

            window.addEventListener('beforeprint', () => {
                isPrinting.value = true
                document.documentElement.classList.remove('dark')
                setTimeout(() => {
                    if (expenseChart.value) expenseChart.value.resize()
                    if (trendChart.value) trendChart.value.resize()
                }, 10)
            })
            window.addEventListener('afterprint', () => {
                isPrinting.value = false
                if (isDark.value) document.documentElement.classList.add('dark')
            })
            window.addEventListener('keydown', handleKeydown)
            window.addEventListener('mouseup', handleMouseUp)
            window.addEventListener('online', handleOnline)
            window.addEventListener('offline', handleOffline)
            window.addEventListener('hashchange', () => {
                const hashStr = window.location.hash.slice(1)
                if (hashStr.startsWith('ws:')) {
                    const wsName = decodeURIComponent(hashStr.slice(3))
                    if (wsName && wsName !== currentStorageKey.value) {
                        currentStorageKey.value = wsName
                        changeStorageKey()
                    }
                }
            })
            document.addEventListener('visibilitychange', handleAppResume)

            resizeObserver = new ResizeObserver((entries) => {
                let heightChanged = false
                const margin = window.innerWidth < 640 ? 16 : 0

                for (let entry of entries) {
                    const target = entry.target
                    const rowId = target.dataset.rowId
                    if (rowId) {
                        const rectHeight = target.offsetHeight || target.getBoundingClientRect().height
                        if (!rectHeight) continue
                        const newHeight = rectHeight + margin

                        if (heightCache[rowId] !== newHeight) {
                            heightCache[rowId] = newHeight
                            heightChanged = true
                        }
                    }
                }
                if (heightChanged) {
                    const keys = Object.keys(heightCache)
                    if (keys.length > 0) {
                        let sum = 0
                        const sampleSize = Math.min(keys.length, 20)
                        for(let i = 0; i < sampleSize; i++) {
                            sum += heightCache[keys[i]]
                        }
                        averageRowHeight = sum / sampleSize
                    }
                }
                syncColumnWidths()
            })

            await loadData()
            initChartColumns()
            refreshYearFilters()
            initGlobalTooltip()
            checkAndAutoSync()

            if ('speechSynthesis' in globalThis) {
                speechSynthesis.speak(new SpeechSynthesisUtterance(""))
            }

            isInitializing = false
            if (isChartOpen.value) {
                debouncedUpdateChart.cancel()
                debouncedUpdateChart()
            }

            if (window.location.hash.endsWith('/add')) {
                window.history.replaceState(null, null, '#ws:' + encodeURIComponent(currentStorageKey.value))
                setTimeout(() => {
                    addRow()
                }, 400)
            }
        })

        onUnmounted(() => {
            debouncedSave.cancel()
            saveScrollPosition.cancel()
            debouncedUpdateChart.cancel()
            syncFilters.cancel()
            window.removeEventListener('keydown', handleKeydown)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
            document.removeEventListener('visibilitychange', handleAppResume)
            document.body.style.overflow = ''
        })

        return {
            isBudgetOpen,
            toggleBudget,
            categoryBudgets,
            uniqueCategories,
            mainCatColId,
            budgetStats,
            applyTypeToAll,
            applyAmountToAll,
            isProcessing,
            currentLanguage,
            translate,
            currentStorageKey,
            changeStorageKey,
            savedKeysList,
            isWorkspaceMenuOpen,
            workspaceInputRef,
            workspaceModal,
            openWorkspaceModal,
            closeWorkspaceModal,
            submitWorkspaceModal,
            deleteWorkspace,
            activeMenuRow,
            toggleActionMenu,
            closeActionMenu,
            onKeyFocus,
            onKeyBlur,
            columns,
            rows,
            inputRefs,
            hasDateColumn,
            hasNumberColumn,
            newColLabel,
            newColType,
            typeOptions,
            formulaA,
            formulaB,
            formulaC,
            numberColumns,
            outputToScreen,
            outputType,
            downloadFile,
            columnTotals,
            areAllExpanded,
            startDragging,
            addColumn,
            addRow,
            removeColumn,
            copyRow,
            removeRow,
            exportJson,
            exportCsv,
            clearStorage,
            generateShareLink,
            toggleAllNotes,
            mergeDuplicates,
            formatNumberInput,
            focusNextInput,
            editingColId,
            startEditingCol,
            stopEditingCol,
            fileInput,
            triggerFileUpload,
            handleFileUpload,
            adjustNumber,
            getUniqueValues,
            toggleChart,
            isChartOpen,
            toggleTitle,
            isTitleOpen,
            customLegendItems,
            toggleLegend,
            debouncedUpdateChart,
            selectedChartCatColId,
            selectedChartNumColId,
            selectedChartDateColId,
            hasTrendData,
            monthFilters,
            yearFilters,
            toggleFilter,
            confirmModal,
            confirmCancelBtnRef,
            showConfirm,
            onConfirmOk,
            onConfirmCancel,
            tableContainer,
            formatNumber,
            scrollToPosition,
            isAtTop,
            isAtBottom,
            handleTableScroll,
            isScrolling,
            onScrollBtnsEnter,
            onScrollBtnsLeave,
            filteredRows,
            visibleRows,
            bottomSentinel,
            windowStart,
            windowEnd,
            onDataEdited,
            ExpandNote,
            autoHeight,
            paddingTop,
            paddingBottom,
            isPrinting,
            triggerPrint,
            isDark,
            toggleDarkMode,
            githubToken,
            gistId,
            backupToGist,
            restoreFromGist,
            isFeaturesOpen,
            isSettingsOpen,
            timeUnit,
            enterInput,
            saveInput,
            selectedChartDate,
            globalNotes,
            isScannerOpen,
            openScanner,
            closeScanner,
            scanningTarget,
            lastScannedText,
            triggerQRFileUpload,
            scanModeOptions,
            selectedScanMode,
            photoViewer,
            viewPhoto,
            removePhoto,
            triggerPhotoUpload,
            columnFilters,
            activeFilterCol,
            dateRangeFilters,
            toggleDateFilter,
            updateDateRange,
            clearDateRange,
            dateRangeOpenState,
            clearFilter,
            clearAllFilters,
            isAnyFilterActive,
            filterMatchMode,
            draftFilterText,
            toggleTrendChartType,
            trendChartType,
            chartViewMode,
            tooltipState,
            shareModal,
            shareRow,
            copyShareLink,
            copyQuickAddLink,
            googleVisionKey,
            captureForOCR,
            isAutoScanEnabled,
            isZoomSupported,
            currentZoom,
            minZoom,
            maxZoom,
            isTorchSupported,
            toggleTorch,
            isTorchOn,
            isVoiceEnabled,
            voiceSettings,
            speakFeedback,
            playTestSound,
            debugImageUrl,
            activeRow,
            openGlobalMenu,
            selectOption,
            menuStyle,
            isKeyboardOpen,
            append,
            backspace,
            clearAll,
            doCalc,
            activeDropdownIndex,
            screenTarget,
            isFullscreen,
            toggleFullscreen,
            handlePaste,
            getSelectionStyles,
            isDragging,
            startCell,
            endCell,
            isCellSelected,
            handleMouseDown,
            handleMouseEnter,
            isCopied,
            observeRow,
            calcValue,
            hasIncomeCategories,
            hasBudgetCategories,
            chartViewModes,
            activeChartViewIndex,
            categoryBudgetMap,
            rowRunningBudgetMap,
            getWeekdayStr,
            checkAndAutoSync,
            googleClientId,
            sheetImportUrl,
            importFromGoogleSheets,
            exportToGoogleSheets,
            isAutoSyncEnabled,
            isCalendarPushEnabled,
            displayLastSync,
            getCheckboxProgressClass,
            getCheckboxProgressPercent,
            getProgressBarColor,
            newCategoryInput,
            addNewCategory,
            deleteCategoryBudget,
            toLocaleString,
            colWidths,
            filterContainer,
            chartContainer,
            lockedTableMinHeight,
            lockedChartMinHeight,
            onFilterFocusIn,
            onFilterFocusOut,
            handleFilterScroll,
            heatmapScrollContainer,
            heatmapCanvas,
            isOnline,
            showBadges,
            failedBadges,
            isCalcType,
            isNumericType,
            getRowNumericValue,
            getSafeUrl,
            getSafeTel,
            getSafeEmail,
            isValidHexColor,
            normalizeTags,
            tagDrafts,
            addTagToRow,
            removeTagFromRow,
            handleTagBackspace,
            setRating,
            clampProgress,
            getColumnTypeLabel
        }
    }
}
</script>
