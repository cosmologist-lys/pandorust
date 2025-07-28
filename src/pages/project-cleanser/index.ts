// 为了演示，我们将使用一些模拟数据
const MOCK_DATA = [
    {path: 'C:\\Users\\dev\\project-a\\target', size: 1280, type: 'Cargo', modified: '2025-07-20'},
    {path: 'D:\\archive\\old-java-app\\build', size: 3560, type: 'Maven', modified: '2023-02-11'},
    {path: 'C:\\Users\\dev\\another-rust-app\\target', size: 890, type: 'Cargo', modified: '2025-06-30'},
];

//import {openPath} from '@tauri-apps/plugin-opener';

const FOLDER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;

export function init() {
    console.log("Project Cleanser page initialized!");

    // 获取所有需要的 DOM 元素
    const scanPathInput = document.getElementById('scan-path-input') as HTMLInputElement;
    const projectTypeSelector = document.getElementById('project-type-selector') as HTMLSelectElement; // <--- 新增获取选择器
    const scanBtn = document.getElementById('search-btn') as HTMLButtonElement;
    const cleanBtn = document.getElementById('clean-btn') as HTMLButtonElement;
    const resetPcBtn = document.getElementById('reset-pc-btn') as HTMLButtonElement; // <--- 新增获取重置按钮
    const scanSummary = document.getElementById('scan-summary') as HTMLParagraphElement;
    const selectionSummary = document.getElementById('selection-summary') as HTMLParagraphElement;
    const resultsTableBody = document.getElementById('results-table-body') as HTMLTableSectionElement;
    const selectAllCheckbox = document.getElementById('select-all-checkbox') as HTMLInputElement;

    // ... (保留核心功能函数：updateSummaryAndActions, renderResults) ...

    // --- 新增：重置函数 ---
    const resetUi = () => {
        scanPathInput.value = '';
        projectTypeSelector.value = 'any';
        scanSummary.textContent = '请先选择目录并开始扫描。';
        selectionSummary.textContent = '';
        resultsTableBody.innerHTML = '';
        cleanBtn.disabled = true;
        cleanBtn.textContent = '清理已选项';
        selectAllCheckbox.checked = false;
        scanPathInput.focus();
    };

    // 新增：为重置按钮绑定点击事件
    resetPcBtn.addEventListener('click', resetUi);

    // --- 核心功能函数 ---

    // 更新统计和清理按钮状态
    const updateSummaryAndActions = () => {
        const selectedCheckboxes = resultsTableBody.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
        const selectedCount = selectedCheckboxes.length;

        if (selectedCount === 0) {
            selectionSummary.textContent = '';
            cleanBtn.disabled = true;
            cleanBtn.textContent = '清理已选项';
        } else {
            // 在真实应用中，我们会从 data-size 属性累加大小
            let totalSize = 0;
            selectedCheckboxes.forEach(cb => {
                totalSize += Number(cb.dataset.size) || 0;
            });
            selectionSummary.textContent = `已选择 ${selectedCount} 项，预计可释放 ${(totalSize / 1024).toFixed(2)} GB 空间。`;
            cleanBtn.disabled = false;
            cleanBtn.textContent = `清理已选项 (${selectedCount})`;
        }

        // 更新全选框状态
        const allCheckboxes = resultsTableBody.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        selectAllCheckbox.checked = allCheckboxes.length > 0 && selectedCount === allCheckboxes.length;
    };

    // 渲染扫描结果
    const renderResults = (data: typeof MOCK_DATA) => {
        resultsTableBody.innerHTML = ''; // 清空旧结果
        if (data.length === 0) {
            scanSummary.textContent = '在指定目录未发现任何项目垃圾。';
            return;
        }

        scanSummary.textContent = `扫描完毕！共发现 ${data.length} 个项目垃圾。`;

        data.forEach(item => {
            const row = resultsTableBody.insertRow();
            row.innerHTML = `
                <td class="col-checkbox"><input type="checkbox" class="row-checkbox" data-size="${(item.size / 1024 / 1024).toFixed(0)}" /></td>
                <td class="col-path" title="${item.path}"><div class="path-cell">${item.path}</div></td>
                <td class="col-size">${(item.size / 1024).toFixed(2)} GB</td>
                <td class="col-type">${item.type}</td>
                <td class="col-modified">${item.modified}</td>
                <td class="col-actions"><button class="icon-btn" title="在文件夹中显示">${FOLDER_ICON_SVG}</button></td>
            `;
        });
        updateSummaryAndActions();
    };

    // 扫描按钮 (目前使用模拟数据)
    scanBtn.addEventListener('click', () => {
        scanSummary.textContent = '正在扫描中，请稍候...';
        // 模拟网络延迟
        setTimeout(() => {
            renderResults(MOCK_DATA);
        }, 1500);
    });

    // 清理按钮 (未来会调用 Tauri API)
    cleanBtn.addEventListener('click', () => {
        const selectedCount = resultsTableBody.querySelectorAll('input[type="checkbox"]:checked').length;
        // 在真实应用中会弹出Tauri确认对话框
        if (confirm(`您确定要永久删除这 ${selectedCount} 个项目吗？`)) {
            console.log('Deletion confirmed - will implement with Tauri backend call');
            // 此处调用后端删除，然后重新扫描或从列表中移除
        }
    });

    // 全选框
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = resultsTableBody.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        updateSummaryAndActions();
    });

    // 事件委托：监听整个表格的点击，处理每一行的选择框
    resultsTableBody.addEventListener('change', (e) => {
        if ((e.target as HTMLElement).classList.contains('row-checkbox')) {
            updateSummaryAndActions();
        }
    });
}