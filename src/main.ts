import { invoke } from "@tauri-apps/api/core";


// 获取 DOM 元素的引用
const pathInput = document.getElementById("path-input") as HTMLInputElement;
const patternInput = document.getElementById("pattern-input") as HTMLInputElement;
const searchBtn = document.getElementById("search-btn") as HTMLButtonElement;
const resultsOutput = document.getElementById("results-output") as HTMLPreElement;

interface RpcResponse<T> {
    status: number;
    data: T;
    error: string | null; // Rust 的 Option<String> 映射为 null 或 string
}

interface QuickFindRespond {
    vec: string[];
    count: number;
    spent_millis: number; // Rust 的 u128 在 JS 中用 number 表示（需注意范围）
}

// 为搜索按钮添加点击事件监听器
searchBtn.addEventListener("click", async () => {
    if (!pathInput.value || !patternInput.value) {
        resultsOutput.textContent = "错误: 搜索路径和 Glob 模式不能为空。";
        return;
    }

    // 更新 UI，告知用户搜索已开始
    resultsOutput.textContent = "正在搜索中，请稍候...";
    searchBtn.disabled = true;

    try {
        // 使用 invoke 调用 Rust 后端的 'search' 命令
        // 参数以对象形式传递，键名必须与 Rust 函数的参数名完全匹配
        const results: RpcResponse<QuickFindRespond> = await invoke("quick_find_search", {
            rootPath: pathInput.value,
            globPattern: patternInput.value,
        });

        // 处理返回结果
        if (results.status !== 0) {
            resultsOutput.textContent = "查询错误:" + results.error;
        } else {
            const data = results.data;
            const lst: string = data.vec.join("\n");
            lst.concat("count : " + data.count)
                .concat("spent-millis : " + data.spent_millis);
            resultsOutput.textContent = lst
        }
    } catch (error) {
        // 如果 Rust 函数返回 Err, 它会在这里被捕获为 error
        resultsOutput.textContent = `发生错误:\n${error}`;
    } finally {
        // 无论成功还是失败，都重新启用按钮
        searchBtn.disabled = false;
    }
});