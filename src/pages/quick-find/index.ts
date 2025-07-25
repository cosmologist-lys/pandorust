import { invoke } from "@tauri-apps/api/core";
// 新增：从 Tauri API 中导入 shell.open 和 path.dirname
import { revealItemInDir } from "@tauri-apps/plugin-opener";



// --- 类型定义 (无变化) ---
interface RpcResponse<T> {
    status: number;
    data: T;
    error: string | null;
}
interface QuickFindRespond {
    vec: string[];
    count: number;
    spent_millis: number;
}


const convert_millis = (millis: number) => {
    if (millis < 1000) {
        return `${millis}毫秒`;
    }

    const seconds = Math.floor(millis / 1000);
    const remainingMillis = millis % 1000;

    if (seconds < 60) {
        return `${seconds}.${remainingMillis}秒`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}分${remainingSeconds}.${remainingMillis}秒`;
};



export function init(){
    const pathInput = document.getElementById("path-input") as HTMLInputElement;
    const patternInput = document.getElementById("pattern-input") as HTMLInputElement;
    const searchBtn = document.getElementById("search-btn") as HTMLButtonElement;
    const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
    const summaryOutput = document.getElementById("summary-output") as HTMLDivElement;
// 注意：现在 resultsOutput 是一个 Div 元素
    const resultsOutput = document.getElementById("results-output") as HTMLDivElement;
    const FOLDER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;


// 修改：清理结果时，使用 innerHTML
    const clearResults = () => {
        summaryOutput.textContent = "";
        // 使用 innerHTML = '' 清空所有动态创建的子元素
        resultsOutput.innerHTML = '';
        summaryOutput.style.color = 'var(--secondary-text-color)';
    };

    const resetAll = () => {
        pathInput.value = "";
        patternInput.value = "";
        clearResults();
        pathInput.focus();
    };

    const performSearch = async () => {
        if (searchBtn.disabled) return;

        const rootPath = pathInput.value;
        const globPattern = patternInput.value;

        if (!rootPath || !globPattern) {
            summaryOutput.style.color = 'var(--error-color)';
            summaryOutput.textContent = "错误: 搜索路径和 Glob 模式不能为空。";
            resultsOutput.innerHTML = "";
            return;
        }

        clearResults();

        summaryOutput.textContent = "正在搜索中，请稍候...";
        searchBtn.disabled = true;
        resetBtn.disabled = true;

        try {
            const results: RpcResponse<QuickFindRespond> = await invoke("quick_find_search", {
                rootPath,
                globPattern,
            });

            if (results.status !== 0) {
                summaryOutput.style.color = 'var(--error-color)';
                summaryOutput.textContent = `查询错误: ${results.error || '未知错误'}`;
            } else {
                const data = results.data;
                summaryOutput.style.color = 'var(--success-color)';
                const time_spent: string = convert_millis(data.spent_millis);
                summaryOutput.textContent = `查找完毕！共找到 ${data.count} 个匹配项，耗时 ${time_spent} 。`;

                // --- 核心改动：动态创建结果列表 ---
                if (data.vec.length === 0) {
                    resultsOutput.textContent = "未找到任何文件。";
                } else {
                    // 遍历每一个文件路径
                    for (const filePath of data.vec) {
                        // 1. 创建容器 div
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'result-item';

                        // 2. 创建路径文本 span
                        const pathSpan = document.createElement('span');
                        pathSpan.className = 'path-text';
                        pathSpan.textContent = filePath;
                        pathSpan.title = filePath; // 鼠标悬浮时显示完整路径

                        // 3. 创建 "打开文件夹" 按钮
                        const openBtn = document.createElement('button');
                        openBtn.className = 'open-folder-btn';
                        openBtn.innerHTML = FOLDER_ICON_SVG; // 设置图标

                        // 4. 为按钮绑定点击事件
                        // 新的、正确且简单的方式
                        openBtn.addEventListener('click', async () => {
                            try {
                                // 直接调用 reveal，它会自动打开文件夹并选中文件
                                await revealItemInDir(filePath);
                            } catch (e) {
                                console.error(`无法在文件夹中显示: ${filePath}`, e);
                                summaryOutput.style.color = 'var(--error-color)';
                                summaryOutput.textContent = `错误：无法定位文件 ${filePath}`;
                            }
                        });

                        // 5. 将文本和按钮添加到容器 div 中
                        itemDiv.appendChild(pathSpan);
                        itemDiv.appendChild(openBtn);

                        // 6. 将完整的列表项添加到结果区域
                        resultsOutput.appendChild(itemDiv);
                    }
                }
            }
        } catch (error) {
            summaryOutput.style.color = 'var(--error-color)';
            summaryOutput.textContent = `发生严重错误，请检查控制台。`;
            resultsOutput.innerHTML = `${error}`;
            console.error("Invoke error:", error);
        } finally {
            searchBtn.disabled = false;
            resetBtn.disabled = false;
        }
    };

// --- 事件监听器绑定 (这部分代码保持不变) ---
    searchBtn.addEventListener("click", performSearch);
    resetBtn.addEventListener("click", resetAll);
    const handleEnterKey = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
            event.preventDefault();
            performSearch();
        }
    };
    pathInput.addEventListener("keyup", handleEnterKey);
    patternInput.addEventListener("keyup", handleEnterKey);
}