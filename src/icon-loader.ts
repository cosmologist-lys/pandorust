
/*
通过：<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path><line x1="12" y1="22" x2="12" y2="12"></line></svg>
和
放到：/pandorust/src/assets/icons/里，再通过<img>标签引入
这两种方式ui呈现的效果不一样。
那是因为通过<img>标签导入的svg就失去了内联的作用，它就像被画框框住了，对于其样式的修改只能作用于<img>而无法作用到其中的内容。
于是就得使用vite的?raw功能，把svg作为原始文本导入，再用js进行动态注入
*/

// @ts-ignore
import arrowLeft from './assets/icons/arrow-left.svg?raw';
// @ts-ignore
import search from './assets/icons/search.svg?raw';
// @ts-ignore
import project_cleanser_tag from './assets/icons/project-cleanser-tag.svg?raw';
// @ts-ignore
import light from './assets/icons/light.svg?raw';
// @ts-ignore
import dark from './assets/icons/dark.svg?raw';
// @ts-ignore
import alertTriangle from './assets/icons/alert-triangle.svg?raw';
// @ts-ignore
import folder from './assets/icons/folder.svg?raw';

// 创建一个图标 ID 到 SVG 文本的映射
const icons = {
    'arrow-left': arrowLeft,
    'search': search,
    'project-cleanser-tag': project_cleanser_tag,
    'light': light,
    'dark': dark,
    'alert-triangle': alertTriangle,
    'folder': folder,
};

// 导出一个初始化函数
export function loadIcons() {
    // 查找所有带 data-icon-id 属性的占位符
    const placeholders = document.querySelectorAll<HTMLElement>('[data-icon-id]');

    placeholders.forEach(placeholder => {
        const iconId = placeholder.dataset.iconId as keyof typeof icons;
        if (icons[iconId]) {
            // 将对应的 SVG 文本注入到占位符中
            placeholder.innerHTML = icons[iconId];
        }
    });
}