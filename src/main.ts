import { invoke } from "@tauri-apps/api/core";

// --- DOM 元素获取 ---
const pathInput = document.getElementById("path-input") as HTMLInputElement;
const patternInput = document.getElementById("pattern-input") as HTMLInputElement;
const searchBtn = document.getElementById("search-btn") as HTMLButtonElement;
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const summaryOutput = document.getElementById("summary-output") as HTMLDivElement;
const resultsOutput = document.getElementById("results-output") as HTMLPreElement;
// 新增：获取主题切换按钮
const themeToggleBtn = document.getElementById("theme-toggle-btn") as HTMLButtonElement;

// --- 类型定义 ---
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

// --- 功能函数 ---

// 清理 UI 显示
const clearResults = () => {
    summaryOutput.textContent = "";
    resultsOutput.textContent = "";
    summaryOutput.style.color = 'var(--secondary-text-color)';
};

// 重置所有输入和输出
const resetAll = () => {
    pathInput.value = "";
    patternInput.value = "";
    clearResults();
    pathInput.focus();
};

// 搜索功能的实现
const performSearch = async () => {
    if (searchBtn.disabled) return;

    const rootPath = pathInput.value;
    const globPattern = patternInput.value;

    if (!rootPath || !globPattern) {
        summaryOutput.style.color = 'var(--error-color)';
        summaryOutput.textContent = "错误: 搜索路径和 Glob 模式不能为空。";
        resultsOutput.textContent = "";
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
            summaryOutput.textContent = `查找完毕！共找到 ${data.count} 个匹配项，耗时 ${data.spent_millis} 毫秒。`;
            resultsOutput.textContent = data.vec.length > 0 ? data.vec.join("\n") : "未找到任何文件。";
        }
    } catch (error) {
        summaryOutput.style.color = 'var(--error-color)';
        summaryOutput.textContent = `发生严重错误，请检查控制台。`;
        resultsOutput.textContent = `${error}`;
        console.error("Invoke error:", error);
    } finally {
        searchBtn.disabled = false;
        resetBtn.disabled = false;
    }
};

// --- 事件监听器绑定 ---

// 搜索按钮
searchBtn.addEventListener("click", performSearch);

// 重置按钮
resetBtn.addEventListener("click", resetAll);

// 回车键
const handleEnterKey = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        event.preventDefault();
        performSearch();
    }
};
pathInput.addEventListener("keyup", handleEnterKey);
patternInput.addEventListener("keyup", handleEnterKey);

// 页面加载时，立即应用保存的主题
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // 默认为 dark
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
});

// 主题切换按钮点击事件
themeToggleBtn.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-theme");
    // 将新的主题选择保存到 localStorage
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});
