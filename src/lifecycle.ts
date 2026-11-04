/*
 * 生命周期与入口编排：onunload、设置读写、ribbon 图标、悬停/点击触发、命令与 URI。
 * onload 本身在 main.ts 的类里（要按顺序组装各子系统），这里放其余生命周期方法。
 */
import { Notice, Platform, setIcon, type Command } from 'obsidian';
import { DEFAULT_SETTINGS, HOVER_SOURCE, createEntry, type NoteEntry } from './constants';
import { STRINGS, resolveLang, type LangSetting, type Strings } from './i18n';
import { wsInternal } from './shims';

export const lifecycleMethods = {
onunload(this: any) {
	this.disposed = true;
	this.closePanel();
	this.unregisterHoverSource();
	for (const id of this.ribbonEls.keys()) this.removeRibbonIcon(id);
},

/**
 * 注册悬停预览来源。
 *
 * 「页面预览」（page-preview）内部插件在 onEnable 里订阅 workspace 的
 * `hover-link` 事件，拿到 { hoverParent, targetEl, linktext, sourcePath }
 * 就创建预览浮层。它认哪些来源、是否需要按 Cmd，来自两处：
 *   1. 插件自己 data.json 里的 options（用户在设置页改过的）
 *   2. workspace.hoverLinkSources 里注册的 defaultMod
 * 注册后「页面预览」设置页会多一行开关，用户可以自己改，行为与原生一致。
 */
registerHoverSource(this: any) {
	const ws = this.app.workspace;
	if (!ws || typeof ws.registerHoverLinkSource !== 'function') return;
	try {
		ws.registerHoverLinkSource(HOVER_SOURCE, {
			display: this.uiStrings().hoverSourceDisplay,
			defaultMod: false,   // 不用按 Cmd，悬停即预览
		});
		this.hoverSourceRegistered = true;
	} catch {
		/* 老版本没有这个 API：不注册也不会崩，只是没有预览 */
	}
},

unregisterHoverSource(this: any) {
	const ws = this.app.workspace;
	if (!this.hoverSourceRegistered) return;
	this.hoverSourceRegistered = false;
	if (typeof ws.unregisterHoverLinkSource !== 'function') return;
	try {
		ws.unregisterHoverLinkSource(HOVER_SOURCE);
	} catch {
		/* 忽略 */
	}
},

async loadSettings(this: any) {
	const data = await this.loadData() || {};
	this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	// 首次从原版迁移单文件配置；空数组表示用户主动移除了全部入口。
	const entries = Array.isArray(data.entries) ? data.entries : [{
		...createEntry(), notePath: data.notePath || '', icon: data.icon || 'compass', label: data.label || '',
	}];
	const ids = new Set<string>();
	this.settings.entries = entries.filter((entry) => entry && typeof entry === 'object').map((entry) => {
		const id = typeof entry.id === 'string' && entry.id && !ids.has(entry.id) ? entry.id : createEntry().id;
		ids.add(id);
		return { id, notePath: typeof entry.notePath === 'string' ? entry.notePath : '',
			icon: typeof entry.icon === 'string' && entry.icon ? entry.icon : 'file-text',
			label: typeof entry.label === 'string' ? entry.label : '', locked: entry.locked === true };
	});
	delete this.settings.notePath;
	delete this.settings.icon;
	delete this.settings.label;
	// data.json 里可能有脏值，兜底回悬停
	if (this.settings.trigger !== 'hover' && this.settings.trigger !== 'click') {
		this.settings.trigger = 'click';
	}
	if (this.settings.linkOpenMode !== 'new-tab' && this.settings.linkOpenMode !== 'current-tab') {
		this.settings.linkOpenMode = 'new-tab';
	}
	if (this.settings.language !== 'auto' && this.settings.language !== 'zh' && this.settings.language !== 'en') {
		this.settings.language = 'auto';
	}
	// 旧版本存过 dedupeScope，现在已经没有这个开关了，清掉免得 data.json 里留垃圾
	delete this.settings.dedupeScope;
	// 界面语言在这一步定下来：auto 就按 Obsidian 的语言探测
	this.uiLang = resolveLang(this.settings.language);
},

/** 当前界面语言对应的文案表。所有面向用户的字符串都从这里取，不写字面量 */
uiStrings(this: any): Strings {
	return STRINGS[this.uiLang] || STRINGS.zh;
},

/**
 * 切换界面语言：立即生效，不用重载插件。
 *
 * 生效范围：命令名（Obsidian 命令面板每次打开都从命令对象读 name，直接改对象即可）、
 * ribbon 提示（仅在该设置还是某语言默认值或为空时才跟着换，用户自定义过的不动）、
 * 悬停预览来源名（注销后按新语言重注册）、已打开浮层上的按钮文案。
 * 设置页整体重画由调用方负责（this.display()）。
 */
async setLanguage(this: any, value: LangSetting) {
	if (value !== 'auto' && value !== 'zh' && value !== 'en') value = 'auto';
	this.settings.language = value;
	this.applyLanguage();
	await this.saveSettings();
},

applyLanguage(this: any) {
	const lang = resolveLang(this.settings.language);
	this.uiLang = lang;
	const S = STRINGS[lang] || STRINGS.zh;

	// 命令名：命令面板展示的是命令对象的 name 字段，改对象即生效。
	// ⚠ addCommand() 注册时会把 name 改成 `manifest.name + ": " + name`；
	// 这里直接赋 S.cmdToggle 会把那个前缀抹掉，所以必须按同样格式自己补回来。
	const cmdPrefix = `${this.manifest.name}: `;
	if (this.cmdToggle) this.cmdToggle.name = cmdPrefix + S.cmdToggle;
	if (this.cmdOpenInTab) this.cmdOpenInTab.name = cmdPrefix + S.cmdOpenInTab;

	this.refreshRibbonIcon();

	// 悬停预览来源名跟着换（source id 不变，「页面预览」的用户开关不受影响）
	this.unregisterHoverSource();
	this.registerHoverSource();

	// 已打开浮层上的按钮 / 拖拽柄文案
	const panel = this.panelEl;
	if (panel) {
		const triggerBtn = panel.querySelector('.nav-dock-trigger');
		if (triggerBtn) this.decorateTriggerButton(triggerBtn);
		this.decorateLockButton();
		const closeBtn = panel.querySelector('.nav-dock-close');
		if (closeBtn) closeBtn.setAttribute('aria-label', S.closePanel);
		const openBtn = panel.querySelector('.nav-dock-open');
		if (openBtn) openBtn.setAttribute('aria-label', S.openInTabBtn);
		const resize = panel.querySelector('.nav-dock-resize');
		if (resize) resize.setAttribute('aria-label', S.resizeHandle);
	}
},

async saveSettings(this: any) {
	await this.saveData(this.settings);
},

/** 每个文件独立的 ribbon 入口，增删和换图标立即生效。 */
getEntry(this: any, id = this.activeEntryId): NoteEntry | undefined {
	return this.settings.entries.find((entry: NoteEntry) => entry.id === id) || this.settings.entries[0];
},

removeRibbonIcon(this: any, id: string) {
	wsInternal(this.app).leftRibbon.removeRibbonAction(`${this.manifest.id}:${id}`);
	this.ribbonEls.get(id)?.remove();
	this.ribbonEls.delete(id);
},

refreshRibbonIcon(this: any) {
	const ribbon = wsInternal(this.app).leftRibbon;
	const entries: NoteEntry[] = this.settings.entries;
	const ids = new Set(entries.map((entry) => entry.id));
	for (const id of this.entryCommands.keys()) {
		if (!ids.has(id)) {
			this.removeCommand(`open-entry-${id}`);
			this.entryCommands.delete(id);
		}
	}
	for (const id of this.ribbonEls.keys()) {
		if (!ids.has(id)) {
			this.removeRibbonIcon(id);
			if (id === this.activeEntryId) this.closePanel();
		}
	}
	let previous: HTMLElement | null = null;
	for (const [index, entry] of entries.entries()) {
		const filename = entry.notePath.split('/').pop()?.replace(/\.md$/i, '');
		const title = entry.label || filename || this.uiStrings().labelDefault;
		this.refreshEntryCommand(entry.id, title, index);
		const ribbonId = `${this.manifest.id}:${entry.id}`;
		let el = this.ribbonEls.get(entry.id);
		if (!el) {
			// addRibbonIcon derives its ID from the title. Use the persistent entry ID
			// so duplicate labels and file renames cannot replace another button.
			el = ribbon.addRibbonItemButton(ribbonId, entry.icon, title, () => {
				if (this.panelEl && this.activeEntryId === entry.id) this.closePanel();
				else void this.openPanel({ entryId: entry.id, pinned: true, placement: 'dock' });
			});
			el.addClass('nav-dock-ribbon');
			el.dataset.navDockEntry = entry.id;
			this.ribbonEls.set(entry.id, el);
			this.registerDomEvent(el, 'mouseenter', () => {
				if (this.settings.trigger !== 'hover') return;
				this.cancelClose();
				this.openByHover(entry.id);
			});
			this.registerDomEvent(el, 'mouseleave', () => this.scheduleClose());
		}
		const item = ribbon.items.find((action) => action.id === ribbonId);
		if (item) {
			item.title = title;
			item.icon = entry.icon;
		}
		el.setAttribute('aria-label', title);
		el.setAttribute('data-tooltip-position', 'right');
		setIcon(el, entry.icon);
		if (previous && previous.nextSibling !== el) previous.after(el);
		previous = el;
	}
	this.ribbonEl = this.ribbonEls.get(this.activeEntryId) || this.ribbonEls.values().next().value || null;
},

refreshEntryCommand(this: any, entryId: string, title: string, index: number) {
	const id = `open-entry-${entryId}`;
	const name = this.uiStrings().cmdOpenEntry(title);
	const key = index < 9 ? String(index + 1) : undefined;
	const command: Command | undefined = this.entryCommands.get(entryId);
	if (command && command.hotkeys?.[0]?.key === key) {
		command.name = `${this.manifest.name}: ${name}`;
		return;
	}
	// Keep the same command ID so Obsidian's custom hotkeys follow the entry.
	if (command) this.removeCommand(id);
	this.entryCommands.set(entryId, this.addCommand({
		id,
		name,
		hotkeys: key ? [{ modifiers: [Platform.isMacOS ? 'Mod' : 'Alt'], key }] : [],
		callback: () => {
			if (this.panelEl && this.activeEntryId === entryId) {
				this.closePanel();
				return;
			}
			void this.openPanel({ entryId, pinned: true, placement: 'dock', focus: false });
		},
	}));
},

/** 锁定与打开方式独立，锁定后允许继续操作背景编辑区。 */
decorateLockButton(this: any) {
	const btn = this.panelEl?.querySelector('.nav-dock-lock');
	if (!btn) return;
	setIcon(btn, this.locked ? 'lock' : 'lock-open');
	btn.setAttribute('aria-label', this.locked ? this.uiStrings().unlockPanel : this.uiStrings().lockPanel);
	btn.setAttribute('aria-pressed', String(this.locked));
	btn.toggleClass('is-active', this.locked);
	this.panelEl.toggleClass('is-locked', this.locked);
},

async toggleLock(this: any) {
	this.locked = !this.locked;
	this.cancelClose();
	const entry = this.getEntry();
	if (entry) entry.locked = this.locked;
	this.decorateLockButton();
	await this.saveSettings();
},

/** 按当前打开方式设置按钮图标与提示 */
decorateTriggerButton(this: any, btn) {
	const S = this.uiStrings();
	const isHover = this.settings.trigger === 'hover';
	setIcon(btn, isHover ? 'mouse-pointer-2' : 'mouse-pointer-click');
	btn.setAttribute('aria-label', isHover ? S.triggerHover : S.triggerClick);
},

/** 切换打开方式：立即生效并持久化 */
async setTrigger(this: any, trigger) {
	this.settings.trigger = trigger;
	await this.saveSettings();

	// 切到点击模式时把当前浮层固定住，鼠标移开不会立刻收
	this.pinned = trigger === 'click';

	const btn = this.panelEl && this.panelEl.querySelector('.nav-dock-trigger');
	if (btn) this.decorateTriggerButton(btn);
},

/** 悬停打开：不固定，鼠标离开就收。已打开时不动状态（可能是快捷键固定住的） */
openByHover(this: any, entryId: string) {
	if (this.panelEl) return;
	void this.openPanel({ entryId, pinned: false, placement: 'dock' });
},

/** 命令 / 快捷键：在屏幕中央打开并固定，再触发一次关闭 */
togglePinned(this: any, entryId?: string) {
	if (this.panelEl) {
		this.closePanel();
		return;
	}
	void this.openPanel({ entryId, pinned: true, placement: 'center' });
},

/** 命令：直接在标签页打开导航文档 */
openInTab(this: any) {
	const file = this.resolveFile();
	if (!file) {
		new Notice(this.uiStrings().noticeNoNote);
		return;
	}
	this.openFileBeside(file);
	this.closePanel();
},

/**
 * 判断叶子还活着、并且在主区域（不在左右侧边栏里）。
 *
 * 为什么要查 parent / isConnected：`activeLeaf` 可能指向一个已经被关掉的叶子
 * （parent 为 null、容器已从 DOM 摘除）。这种叶子拿去 createLeafInTabGroup
 * 会插进一个不存在的分组，最后静默回落到 Obsidian 的默认行为 —— 表现就是
 * 「新标签页又开在左边」。
 */
};
