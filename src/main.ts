
import router from "./router.ts";



const appContainer = document.getElementById('app-container');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const sidebar = document.getElementById('sidebar');
const themeToggleBtn = document.getElementById("theme-toggle-btn") as HTMLButtonElement;

if (sidebarToggleBtn && appContainer) {
    sidebarToggleBtn.addEventListener('click', () => {
        appContainer.classList.toggle('sidebar-expanded');
    });
}

document.addEventListener('click', (event) => {
    // 检查 appContainer 和 sidebar 元素是否存在，确保代码健壮性
    if (!appContainer || !sidebar || !sidebarToggleBtn) return;

    // 1. 只在侧边栏是展开状态时，才进行后续判断
    if (appContainer.classList.contains('sidebar-expanded')) {

        // 2. 判断点击事件的目标是否在侧边栏内部，或者是否就是那个切换按钮
        const isClickInsideSidebar = sidebar.contains(event.target as Node);
        const isClickOnToggleButton = sidebarToggleBtn.contains(event.target as Node);

        // 3. 如果点击既不在侧边栏内部，也不是点击切换按钮本身，则收起侧边栏
        if (!isClickInsideSidebar && !isClickOnToggleButton) {
            appContainer.classList.remove('sidebar-expanded');
        }
    }
});

// 导航项的点击（目前只做视觉反馈，不切换页面）
/*const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault(); // 阻止 a 标签的默认跳转行为

        // 移除其他项的 active class
        navItems.forEach(i => i.classList.remove('active'));
        // 为当前点击项添加 active class
        item.classList.add('active');

        const page = (item as HTMLElement).dataset.page;
        console.log(`Navigating to: ${page}`); // 之后这里会是路由切换的逻辑
    });
});*/
// --- 功能函数 ---


// 主题切换 (持久化版本)
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
});
themeToggleBtn.addEventListener("click", () => {
    const isLight = document.body.classList.toggle("light-theme");
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});


// 打印路由实例，方便调试
console.log("Router initialized:", router);
