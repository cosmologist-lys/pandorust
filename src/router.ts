import Navigo from "navigo";
import { init as initQuickFind } from "./pages/quick-find";
import { init as initProjectCleanser } from "./pages/project-cleanser";

const router = new Navigo("/");
const mainContent = document.getElementById("main-content");

// 页面加载函数
const loadPage = async (pageModule: { init: () => void }, templatePath: string) => {
    if (!mainContent) return;

    // 1. 加载 HTML 模板
    const response = await fetch(templatePath);
    const html = await response.text();

    // 2. 插入到主内容区
    mainContent.innerHTML = html;

    // 3. 执行该页面的初始化脚本
    pageModule.init();
};

router
    .on("/quick-find", async () => {
        await loadPage({ init: initQuickFind }, "/src/pages/quick-find/template.html");
    })
    .on("/project-cleanser", async () => {
        await loadPage({ init: initProjectCleanser }, "/src/pages/project-cleanser/template.html");
    })
    .on("/", () => {
        // 默认路由
        router.navigate("/quick-find");
    })
    .resolve();

// 导航时更新侧边栏的 active 状态
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