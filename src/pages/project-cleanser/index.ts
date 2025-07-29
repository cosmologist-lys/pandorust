import { invoke } from "@tauri-apps/api/core";
import {RpcResponse} from "../../main.ts";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
// @ts-ignore
import FOLDER_ICON_SVG from '../../assets/icons/folder.svg?raw';


// Rust 后端的 CleanResult 结构
interface CleanResult {
    path: string;
    occupied: string; // 例如 "2.1 GB"
    _type: 'Cargo' | 'Maven';
    updated_at: string; // 例如 "2025-07-20"
    total_bytes: number;
}

// Rust 后端的 ProjectCleanserRespond 结构
interface ProjectCleanserRespond {
    vec: CleanResult[];
    occupied: string,
    count: number;
    spent_millis: number;
}

function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export function init() {
    console.log("Project Cleanser page initialized!");

    // --- DOM 元素获取 ---
    const scanPathInput = document.getElementById('scan-path-input') as HTMLInputElement;
    const projectTypeSelector = document.getElementById('project-type-selector') as HTMLSelectElement;
    const scanBtn = document.getElementById('search-btn') as HTMLButtonElement;
    const resetPcBtn = document.getElementById('reset-pc-btn') as HTMLButtonElement;
    const cleanBtn = document.getElementById('clean-btn') as HTMLButtonElement;
    const scanSummary = document.getElementById('scan-summary') as HTMLParagraphElement;
    const selectionSummary = document.getElementById('selection-summary') as HTMLParagraphElement;
    const resultsTableBody = document.getElementById('results-table-body') as HTMLTableSectionElement;
    const selectAllCheckbox = document.getElementById('select-all-checkbox') as HTMLInputElement;

    const dialog = document.getElementById('confirmation-dialog') as HTMLDivElement;
    const dialogMessage = document.getElementById('dialog-message') as HTMLParagraphElement;
    const confirmBtn = document.getElementById('dialog-confirm-btn') as HTMLButtonElement;
    const cancelBtn = document.getElementById('dialog-cancel-btn') as HTMLButtonElement;

    // 用于存储当前扫描结果的完整数据
    let currentResults: CleanResult[] = [];


    // --- 核心功能函数 ---

    const updateSummaryAndActions = () => {
        const selectedCheckboxes = resultsTableBody.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
        const selectedCount = selectedCheckboxes.length;

        if (selectedCount === 0) {
            selectionSummary.textContent = '';
            cleanBtn.disabled = true;
            cleanBtn.textContent = '清理已选项';
        } else {
            let totalSelectedBytes = 0;
            selectedCheckboxes.forEach(cb => {
                // 从 data-size-bytes 属性中读取并累加大小
                totalSelectedBytes += Number(cb.dataset.sizeBytes) || 0;
            });

            // 使用新的辅助函数来格式化总大小
            const formattedSize = formatBytes(totalSelectedBytes);
            selectionSummary.textContent = `已选择 ${selectedCount} 项，预计可释放 ${formattedSize} 空间。`;
            cleanBtn.disabled = false;
            cleanBtn.textContent = `清理已选项 (${selectedCount})`;
        }

        const allCheckboxes = resultsTableBody.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        selectAllCheckbox.checked = allCheckboxes.length > 0 && selectedCount === allCheckboxes.length;
    };

    const renderResults = (occupied: string,data: CleanResult[]) => {
        currentResults = data;
        resultsTableBody.innerHTML = '';

        if (data.length === 0) {
            // 如果没有数据，确保表格是空的
            updateSummaryAndActions();
            return;
        }

        scanSummary.textContent = `扫描完毕！共发现 ${data.length} 个项目垃圾，总占用 ${occupied || 'N/A'}。`;

        data.forEach(item => {
            const row = resultsTableBody.insertRow();
            row.dataset.path = item.path;
            row.innerHTML = `
            <td class="col-checkbox"><input type="checkbox" class="row-checkbox" data-size-bytes="${item.total_bytes}" /></td>
            <td class="col-path" title="${item.path}"><div class="path-cell">${item.path}</div></td>
            <td class="col-size">${item.occupied}</td>
            <td class="col-type">${item._type}</td>
            <td class="col-modified">${item.updated_at}</td>
            <td class="col-actions"><button class="icon-btn action-reveal" title="在文件夹中显示">${FOLDER_ICON_SVG}</button></td>
        `;

            // --- 新增：为新创建的按钮绑定点击事件 ---
            const revealBtn = row.querySelector('.action-reveal');
            if (revealBtn) {
                revealBtn.addEventListener('click', async () => {
                    try {
                        await revealItemInDir(item.path);
                    } catch (e) {
                        console.error(`无法在文件夹中显示: ${item.path}`, e);
                        // 可以考虑一个更温和的错误提示方式，比如一个短暂的 toast
                    }
                });
            }
        });
        updateSummaryAndActions();
    };

    const resetUi = () => {
        scanPathInput.value = '';
        projectTypeSelector.value = 'any';
        scanSummary.textContent = '请先选择目录并开始扫描。';
        selectionSummary.textContent = '';
        resultsTableBody.innerHTML = '';
        cleanBtn.disabled = true;
        cleanBtn.textContent = '清理已选项';
        selectAllCheckbox.checked = false;
        currentResults = [];
        scanPathInput.focus();
    };


    // --- 事件绑定 ---

    // 扫描按钮
    scanBtn.addEventListener('click', async () => {
        const rootPath = scanPathInput.value;
        const projectType = projectTypeSelector.value;

        if (!rootPath) {
            scanSummary.textContent = '错误：扫描根目录不能为空。';
            scanSummary.style.color = 'var(--error-color)';
            return;
        }

        resetUi();
        // 上面清空了输入栏，显得很奇怪，这里再赋值回去
        scanPathInput.value = rootPath;
        scanSummary.textContent = '正在扫描中，请稍候...';
        scanSummary.style.color = 'var(--secondary-text-color)';
        scanBtn.disabled = true;
        resetPcBtn.disabled = true;

        try {
            const response: RpcResponse<ProjectCleanserRespond> = await invoke("scan_projects", {
                rootPath,
                projectType,
            });

            if (response.status === 0) {
                const data = response.data;
                scanSummary.textContent = `扫描完毕！共发现 ${data.count} 个项目垃圾。`;
                scanSummary.style.color = 'var(--success-color)';
                renderResults(data.occupied, data.vec);
            } else {
                scanSummary.textContent = `扫描错误: ${response.error}`;
                scanSummary.style.color = 'var(--error-color)';
            }
        } catch (error) {
            scanSummary.textContent = `发生严重错误: ${error}`;
            scanSummary.style.color = 'var(--error-color)';
        } finally {
            scanBtn.disabled = false;
            resetPcBtn.disabled = false;
        }
    });

    // 清理按钮
    cleanBtn.addEventListener('click', () => {
        const selectedRows = resultsTableBody.querySelectorAll<HTMLTableRowElement>('input[type="checkbox"]:checked');
        if (selectedRows.length === 0) return;

        // 构造待清理列表
        const selectedPaths = Array.from(selectedRows).map(cb => (cb.closest('tr') as HTMLTableRowElement).dataset.path as string);
        const itemsToClean = currentResults.filter(item => selectedPaths.includes(item.path));
        const selectedCount = selectedRows.length;

        // --- 使用我们自己的对话框 ---

        // 1. 设置对话框消息
        dialogMessage.textContent = `您确定要永久删除这 ${selectedCount} 个项目构建目录吗？此操作不可恢复！`;

        // 2. 显示对话框
        dialog.classList.remove('hidden');

        // 3. 为“确认”和“取消”按钮设置一次性事件监听器
        cancelBtn.addEventListener('click', () => {
            dialog.classList.add('hidden');
        }, { once: true }); // once: true 确保事件只触发一次后自动移除

        confirmBtn.addEventListener('click', async () => {
            dialog.classList.add('hidden'); // 先隐藏对话框

            cleanBtn.disabled = true;
            cleanBtn.textContent = '正在清理...';

            try {
                const response: RpcResponse<ProjectCleanserRespond> = await invoke("remove_targets", {
                    targets: itemsToClean,
                });

                if (response.status === 0) {
                    const data = response.data;
                    scanSummary.textContent = `清理完毕！成功删除 ${data.count} 个项目。`;
                    selectionSummary.textContent = '';
                    const remainingItems = currentResults.filter(item => !selectedPaths.includes(item.path));
                    renderResults(data.occupied, remainingItems);
                } else {
                    scanSummary.textContent = `清理时发生错误: ${response.error}`;
                    scanSummary.style.color = 'var(--error-color)';
                }
            } catch (error) {
                scanSummary.textContent = `发生严重错误: ${error}`;
                scanSummary.style.color = 'var(--error-color)';
            } finally {
                updateSummaryAndActions();
            }

        }, { once: true });
    });

    // 重置按钮
    resetPcBtn.addEventListener('click', resetUi);

    // 全选框
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = resultsTableBody.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = selectAllCheckbox.checked);
        updateSummaryAndActions();
    });

    // 表格内容事件委托
    resultsTableBody.addEventListener('change', (e) => {
        if ((e.target as HTMLElement).classList.contains('row-checkbox')) {
            updateSummaryAndActions();
        }
    });
}