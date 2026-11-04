/*
 * 界面语言：中英双语。
 *
 * 设置项 language = 'auto' | 'zh' | 'en'：
 *   auto = 跟随 Obsidian 的语言（moment.locale()， Obsidian 用它反映设置里的语言），
 *          取不到再退 navigator.language，都失败退英文。
 *
 * 用法：插件实例上挂 this.uiLang（loadSettings 时定，setLanguage 时改），
 * 各处用 this.uiStrings() 取当前语言的文案表。文案表用接口 Strings 约束，
 * 两种语言必须键数一致，漏一个 tsc 就报错。
 *
 * ⚠ 新增文案时两个字典都要加；带参数的是函数（如 iconFooter(total, shown)）。
 */

export type Lang = 'zh' | 'en';
export type LangSetting = 'auto' | Lang;

export interface Strings {
	filesTitle: string;
	filesDesc: string;
	addFile: string;
	removeFile: string;
	moveUp: string;
	moveDown: string;
	unnamedFile: (index: number) => string;
	lockPanel: string;
	unlockPanel: string;
	closePanel: string;
	editorError: string;
	saveError: string;
	// ---- 设置页 ----
	setLanguage: string;
	setLanguageDesc: string;
	langAuto: string;
	langZh: string;
	langEn: string;
	setNote: string;
	setNoteDesc: string;
	setNotePlaceholder: string;
	btnUseCurrent: string;
	setTrigger: string;
	setTriggerDesc: string;
	optHover: string;
	optClick: string;
	setIconName: string;
	setIconDesc: (name: string) => string;
	btnPickIcon: string;
	setLabel: string;
	setLabelDesc: string;
	setLabelPlaceholder: string;
	setWidth: string;
	setWidthDesc: string;
	setMaxHeight: string;
	setMaxHeightDesc: string;
	btnAutoHeight: string;
	setResetSize: string;
	setResetSizeDesc: (width: number) => string;
	btnReset: string;
	setShowHeader: string;
	setShowHeaderDesc: string;
	setLinkMode: string;
	setLinkModeDesc: string;
	optNewTab: string;
	optCurrentTab: string;
	setCloseOnLink: string;
	setCloseOnLinkDesc: string;
	// ---- 命令 ----
	cmdToggle: string;
	cmdOpenInTab: string;
	cmdOpenEntry: (title: string) => string;
	// ---- 浮层 ----
	openInTabBtn: string;
	resizeHandle: string;
	triggerHover: string;
	triggerClick: string;
	// ---- 通知 ----
	noticeNoActiveFile: string;
	noticeNoNote: string;
	warnNoFile: (path: string) => string;
	warnNoPath: string;
	// ---- 图标点选器 ----
	iconPickerTitle: string;
	iconSearchPlaceholder: string;
	iconNoMatch: string;
	iconFooter: (total: number, shown: number) => string;
	// ---- 悬停预览来源名（出现在「页面预览」设置里）----
	hoverSourceDisplay: string;
	// ---- ribbon 默认提示（用户没自定义时用）----
	labelDefault: string;
}

const ZH: Strings = {
	filesTitle: '文件入口',
	filesDesc: '每个文件在左侧工具栏有一个独立图标，点击即可编辑。可拖拽面板右下角调整大小。',
	addFile: '添加文件',
	removeFile: '移除入口（不会删除笔记）',
	moveUp: '上移',
	moveDown: '下移',
	unnamedFile: (index) => `文件 ${index}`,
	lockPanel: '锁定弹层：点击其他区域也保持打开',
	unlockPanel: '解除锁定：点击其他区域关闭',
	closePanel: '关闭弹层',
	editorError: 'Nav Dock-dev：无法打开编辑器，请检查笔记后重试。',
	saveError: 'Nav Dock-dev：笔记保存失败，请查看控制台和 Obsidian 文件恢复。',
	setLanguage: '界面语言',
	setLanguageDesc: '切换插件界面语言。选「跟随系统」时按 Obsidian 的语言设置自动选择。',
	langAuto: '跟随系统',
	langZh: '中文',
	langEn: '英文',
	setNote: '笔记路径',
	setNoteDesc: '输入文字筛选笔记，点列表里的条目即可确认。手输完整路径也行。',
	setNotePlaceholder: '输入以筛选，例如 导航、Homepage、00Dashboard',
	btnUseCurrent: '用当前笔记',
	setTrigger: '打开方式',
	setTriggerDesc: '悬停打开：鼠标移到图标上就展开，移开自动收起。点击打开：点图标展开，点外部关闭。锁定后始终保持打开。',
	optHover: '悬停打开',
	optClick: '点击打开',
	setIconName: '图标',
	setIconDesc: (name) => `点右侧按钮从图标库里点选。当前：${name}`,
	btnPickIcon: '选择图标',
	setLabel: '提示文字',
	setLabelDesc: '鼠标悬停在 ribbon 图标上显示的文字。',
	setLabelPlaceholder: '导航',
	setWidth: '浮层宽度',
	setWidthDesc: '单位 px。拖拽浮层右下角也能直接调整，两边会同步。',
	setMaxHeight: '默认高度上限',
	setMaxHeightDesc: '视口高度的百分比。拖拽调整过高度后这里不再生效，可点右侧按钮恢复。',
	btnAutoHeight: '使用默认高度',
	setResetSize: '重置尺寸',
	setResetSizeDesc: (width) => `宽度回到 ${width}px、高度回到 520px。`,
	btnReset: '重置',
	setShowHeader: '显示标题栏',
	setShowHeaderDesc: '显示文件名。关闭后保留精简工具栏，仍可锁定和关闭弹层。',
	setLinkMode: '双链打开位置',
	setLinkModeDesc: '点浮层里的 [[双链]] 时，是在新标签页打开，还是替换当前激活的标签页。按住 Ctrl/Cmd 点击始终在新标签页打开。',
	optNewTab: '新标签页打开',
	optCurrentTab: '当前标签页打开',
	setCloseOnLink: '点击链接后收起',
	setCloseOnLinkDesc: '点浮层里的链接跳到别处后自动关闭浮层。文档内锚点（#标题）不受影响。',
	// ⚠ 命令名不要自己加「Nav Dock-dev：」前缀：Plugin.addCommand() 内部会执行
	// `e.name = manifest.name + ": " + e.name`，命令面板里本来就带插件名前缀。
	cmdToggle: '打开/关闭笔记编辑弹层',
	cmdOpenInTab: '在标签页打开导航文档',
	cmdOpenEntry: (title) => `打开/关闭「${title}」浮窗`,
	openInTabBtn: '在标签页打开',
	resizeHandle: '拖拽调整大小',
	triggerHover: '当前：悬停打开。点击改为点击打开',
	triggerClick: '当前：点击打开。点击改为悬停打开',
	noticeNoActiveFile: '当前没有打开的笔记',
	noticeNoNote: 'Nav Dock-dev：找不到导航文档，请检查插件设置里的路径',
	warnNoFile: (path) => `Nav Dock-dev：找不到文档「${path}」`,
	warnNoPath: 'Nav Dock-dev：请先在插件设置里填写导航文档路径',
	iconPickerTitle: '选择图标',
	iconSearchPlaceholder: '搜索图标名，例如 compass、map、book',
	iconNoMatch: '没有匹配的图标',
	iconFooter: (total, shown) => `共 ${total} 个，已显示 ${shown} 个`,
	hoverSourceDisplay: 'Nav Dock-dev 浮层',
	labelDefault: '导航',
};

const EN: Strings = {
	filesTitle: 'File shortcuts',
	filesDesc: 'Each file gets its own ribbon icon. Click to edit; drag the panel corner to resize.',
	addFile: 'Add file',
	removeFile: 'Remove shortcut (keep note)',
	moveUp: 'Move up',
	moveDown: 'Move down',
	unnamedFile: (index) => `File ${index}`,
	lockPanel: 'Lock panel: keep open when clicking elsewhere',
	unlockPanel: 'Unlock panel: close when clicking elsewhere',
	closePanel: 'Close panel',
	editorError: 'Nav Dock-dev: unable to open editor. Check the note and try again.',
	saveError: 'Nav Dock-dev: saving failed. Check the console and Obsidian file recovery.',
	setLanguage: 'Language',
	setLanguageDesc: 'UI language for this plugin. "Follow system" uses Obsidian\'s language setting.',
	langAuto: 'Follow system',
	langZh: '中文',
	langEn: 'English',
	setNote: 'Note path',
	setNoteDesc: 'Type to filter your notes, then pick from the list. A full path works too.',
	setNotePlaceholder: 'Type to filter, e.g. Navigation, Homepage, 00Dashboard',
	btnUseCurrent: 'Use current note',
	setTrigger: 'Open mode',
	setTriggerDesc: 'Hover: expands when the pointer moves onto the icon, collapses on leave. Click: opens on click and closes on outside click. Lock a panel to keep it open.',
	optHover: 'Hover to open',
	optClick: 'Click to open',
	setIconName: 'Icon',
	setIconDesc: (name) => `Pick from the icon library with the button. Current: ${name}`,
	btnPickIcon: 'Choose icon',
	setLabel: 'Tooltip',
	setLabelDesc: 'Text shown when hovering the ribbon icon.',
	setLabelPlaceholder: 'Nav',
	setWidth: 'Panel width',
	setWidthDesc: 'In px. You can also drag the bottom-right corner of the panel; the two stay in sync.',
	setMaxHeight: 'Default height limit',
	setMaxHeightDesc: 'Percentage of viewport height. Stops applying once you drag the height; use the button to restore.',
	btnAutoHeight: 'Use default height',
	setResetSize: 'Reset size',
	setResetSizeDesc: (width) => `Width back to ${width}px, height back to 520px.`,
	btnReset: 'Reset',
	setShowHeader: 'Show header',
	setShowHeaderDesc: 'Show the file name. When off, a compact toolbar still offers lock and close controls.',
	setLinkMode: 'Link open mode',
	setLinkModeDesc: 'Whether clicking a [[link]] in the panel opens a new tab or replaces the active tab. Ctrl/Cmd-click always opens a new tab.',
	optNewTab: 'New tab',
	optCurrentTab: 'Current tab',
	setCloseOnLink: 'Collapse after clicking a link',
	setCloseOnLinkDesc: 'Auto-close the panel after a link jumps elsewhere. In-document anchors (#heading) are unaffected.',
	// ⚠ 同上：命令名不带插件名前缀，Obsidian 会自动加 "Nav Dock-dev: "。
	cmdToggle: 'Toggle note editor panel',
	cmdOpenInTab: 'Open navigation note in a tab',
	cmdOpenEntry: (title) => `Toggle popup for ${title}`,
	openInTabBtn: 'Open in tab',
	resizeHandle: 'Drag to resize',
	triggerHover: 'Now: hover to open. Click to switch to click.',
	triggerClick: 'Now: click to open. Click to switch to hover.',
	noticeNoActiveFile: 'No note is currently open',
	noticeNoNote: 'Nav Dock-dev: navigation note not found. Check the path in plugin settings.',
	warnNoFile: (path) => `Nav Dock-dev: document "${path}" not found`,
	warnNoPath: 'Nav Dock-dev: set the navigation note path in plugin settings first',
	iconPickerTitle: 'Choose icon',
	iconSearchPlaceholder: 'Search icon names, e.g. compass, map, book',
	iconNoMatch: 'No matching icons',
	iconFooter: (total, shown) => `${total} icons, showing ${shown}`,
	hoverSourceDisplay: 'Nav Dock-dev panel',
	labelDefault: 'Nav',
};

export const STRINGS: Record<Lang, Strings> = { zh: ZH, en: EN };

/**
 * 探测 Obsidian 的界面语言。
 *
 * moment.locale() 反映 Obsidian 设置里的语言（'en' / 'zh-cn' 这种）。
 * Obsidian 1.14 仍捆绑 moment，但没承诺过全局暴露，所以层层兜底：
 * moment → navigator.language → 'en'。
 */
export function detectLang(): Lang {
	try {
		const m = (window as any).moment;
		const loc = m && typeof m.locale === 'function' ? String(m.locale() || '') : '';
		if (loc) return loc.toLowerCase().startsWith('zh') ? 'zh' : 'en';
	} catch {
		/* 继续兜底 */
	}
	try {
		const nav = navigator.language || (navigator.languages && navigator.languages[0]) || '';
		if (nav) return nav.toLowerCase().startsWith('zh') ? 'zh' : 'en';
	} catch {
		/* 继续兜底 */
	}
	return 'en';
}

/** 把设置值（可能是脏数据）解析成具体语言 */
export function resolveLang(setting: string | undefined | null): Lang {
	if (setting === 'zh' || setting === 'en') return setting;
	return detectLang();
}
