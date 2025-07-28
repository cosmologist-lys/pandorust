import Navigo from "navigo";
import { init as initQuickFind } from "./pages/quick-find";
import { init as initProjectCleanser } from "./pages/project-cleanser";

const router = new Navigo("/");
const mainContent = document.getElementById("main-content");

// --- 核心修正：使用 <link> 标签来动态加载和卸载 CSS ---
let currentPageStyleLink: HTMLLinkElement | null = null;

// 页面加载函数
const loadPage = async (templatePath: string, stylePath: string, pageModule: { init: () => void }) => {
    if (!mainContent) return;

    // 1. 如果存在上一页的样式链接，先将其从 head 中移除
    if (currentPageStyleLink) {
        document.head.removeChild(currentPageStyleLink);
    }

    // 2. 为新页面创建新的 <link> 标签
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = stylePath;

    // 3. 将新的 <link> 标签添加到 head 中，浏览器会自动加载并应用它
    document.head.appendChild(link);
    currentPageStyleLink = link; // 保存对当前样式链接的引用，以便下次移除

    // 4. 加载并插入 HTML
    const response = await fetch(templatePath);
    const html = await response.text();
    mainContent.innerHTML = html;

    // 5. 执行该页面的初始化脚本
    pageModule.init();
};

router
    .on("/quick-find", async () => {
        // 当 Project Cleanser 还没有样式时，可以传一个空字符串或一个空的 css 文件
        await loadPage(
            "/src/pages/quick-find/template.html",
            "/src/pages/quick-find/style.css",
            { init: initQuickFind }
        );
    })
    .on("/project-cleanser", async () => {
        // 注意：确保 project-cleanser/style.css 文件存在，即使是空的
        await loadPage(
            "/src/pages/project-cleanser/template.html",
            "/src/pages/project-cleanser/style.css",
            { init: initProjectCleanser }
        );
    })
    .on("/", () => {
        router.navigate("/quick-find");
    })
    .resolve();

// 导航时更新侧边栏的 active 状态 (此部分逻辑不变)
router.hooks({
    after(match) {
        const path = match.route.path;
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            const link = item.querySelector('a');
            if (link && link.getAttribute('href') === path) {
                item.classList.add('active');
            }
        });
    }
});

export default router;