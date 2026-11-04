/*
 * 设置页。
 *
 * 所有面向用户的字符串都取自 this.plugin.uiStrings()（见 i18n.ts），
 * 这个文件里不写死任何一种语言。切语言时整页 display() 重画即可。
 */
import { PluginSettingTab, Setting, Notice, setIcon, debounce } from 'obsidian';
import { DEFAULT_SETTINGS, createEntry, type NoteEntry } from './constants';
import { attachFileSuggest } from './file-suggest';
import { IconPickerModal, iconDisplayName } from './icon-picker';

/** obsidian.d.ts 的 PluginSettingTab 没声明 plugin（构造函数收下但类型里没有），
  * 用 interface 合并补上，类体保持原样搬运。
  * ⚠ interface 必须和 class 一样是 exported，否则合并报 TS2395 */
export interface NavDockSettingTab {
	plugin: any;
}

export class NavDockSettingTab extends PluginSettingTab {
	constructor(app, plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		const S = this.plugin.uiStrings();

		// ---------- 界面语言（放第一项：切换后整页按新语言重画） ----------
		new Setting(containerEl)
			.setName(S.setLanguage)
			.setDesc(S.setLanguageDesc)
			.addDropdown((dd) =>
				dd
					.addOption('auto', S.langAuto)
					.addOption('zh', S.langZh)
					.addOption('en', S.langEn)
					.setValue(this.plugin.settings.language || 'auto')
					.onChange(async (value) => {
						await this.plugin.setLanguage(value);
						this.display();   // 用新语言重画整页
					})
			);

		new Setting(containerEl)
			.setName(S.filesTitle)
			.setDesc(S.filesDesc)
			.addButton((btn) => btn.setButtonText(S.addFile).setCta().onClick(async () => {
				this.plugin.settings.entries.push(createEntry());
				await this.plugin.saveSettings();
				this.plugin.refreshRibbonIcon();
				this.display();
			}));

		this.plugin.settings.entries.forEach((entry: NoteEntry, index: number) => {
			const card = containerEl.createDiv({ cls: 'nav-dock-entry-card' });
			new Setting(card)
				.setName(entry.label || entry.notePath.split('/').pop()?.replace(/\.md$/i, '') || S.unnamedFile(index + 1))
				.addExtraButton((btn) => btn.setIcon('arrow-up').setTooltip(S.moveUp).setDisabled(index === 0).onClick(() => this.moveEntry(index, -1)))
				.addExtraButton((btn) => btn.setIcon('arrow-down').setTooltip(S.moveDown).setDisabled(index === this.plugin.settings.entries.length - 1).onClick(() => this.moveEntry(index, 1)))
				.addExtraButton((btn) => btn.setIcon('trash-2').setTooltip(S.removeFile).onClick(async () => {
					this.plugin.settings.entries.splice(index, 1);
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcon();
					this.display();
				}));

			const updatePath = async (path: string) => {
				if (entry.notePath !== path && this.plugin.activeEntryId === entry.id) this.plugin.closePanel();
				entry.notePath = path;
				await this.plugin.saveSettings();
				this.plugin.refreshRibbonIcon();
			};
			new Setting(card).setName(S.setNote).setDesc(S.setNoteDesc)
				.addText((text) => {
					text.setPlaceholder(S.setNotePlaceholder).setValue(entry.notePath);
					attachFileSuggest(this.app, text.inputEl, async (file) => {
						text.setValue(file.path);
						await updatePath(file.path);
					});
					const saveSoon = debounce((value: string) => void updatePath(value.trim()), 400, true);
					text.onChange((value) => saveSoon(value));
				})
				.addButton((btn) => btn.setButtonText(S.btnUseCurrent).onClick(async () => {
					const file = this.app.workspace.getActiveFile();
					if (!file || file.extension !== 'md') { new Notice(S.noticeNoActiveFile); return; }
					await updatePath(file.path);
					this.display();
				}));

			const iconSetting = new Setting(card).setName(S.setIconName).setDesc(S.setIconDesc(iconDisplayName(entry.icon)));
			const preview = iconSetting.controlEl.createDiv({ cls: 'nav-dock-icon-preview' });
			setIcon(preview, entry.icon);
			iconSetting.addButton((btn) => btn.setButtonText(S.btnPickIcon).onClick(() => {
				new IconPickerModal(this.app, entry.icon, async (icon: string) => {
					entry.icon = icon;
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcon();
					setIcon(preview, icon);
					iconSetting.setDesc(S.setIconDesc(iconDisplayName(icon)));
				}, S).open();
			}));

			new Setting(card).setName(S.setLabel).setDesc(S.setLabelDesc)
				.addText((text) => text.setPlaceholder(S.setLabelPlaceholder).setValue(entry.label).onChange(async (value) => {
					entry.label = value.trim();
					await this.plugin.saveSettings();
					this.plugin.refreshRibbonIcon();
				}));
		});

		new Setting(containerEl)
			.setName(S.setTrigger)
			.setDesc(S.setTriggerDesc)
			.addDropdown((dd) =>
				dd
					.addOption('hover', S.optHover)
					.addOption('click', S.optClick)
					.setValue(this.plugin.settings.trigger)
					.onChange(async (value) => {
						await this.plugin.setTrigger(value);
					})
			);

		new Setting(containerEl)
			.setName(S.setWidth)
			.setDesc(S.setWidthDesc)
			.addSlider((slider) =>
				slider
					.setLimits(280, 720, 10)
					.setValue(this.plugin.settings.width)
					.onChange(async (value) => {
						this.plugin.settings.width = value;
						await this.plugin.saveSettings();
						this.plugin.applySize();
						this.plugin.reposition();
					})
			);

		new Setting(containerEl)
			.setName(S.setMaxHeight)
			.setDesc(S.setMaxHeightDesc)
			.addSlider((slider) =>
				slider
					.setLimits(40, 95, 1)
					.setValue(this.plugin.settings.maxHeightVh)
					.onChange(async (value) => {
						this.plugin.settings.maxHeightVh = value;
						await this.plugin.saveSettings();
						this.plugin.applySize();
						this.plugin.reposition();
					})
			)
			.addButton((btn) =>
				btn.setButtonText(S.btnAutoHeight).onClick(async () => {
					this.plugin.settings.height = 0;
					await this.plugin.saveSettings();
					this.plugin.applySize();
					this.plugin.reposition();
				})
			);

		new Setting(containerEl)
			.setName(S.setResetSize)
			.setDesc(S.setResetSizeDesc(DEFAULT_SETTINGS.width))
			.addButton((btn) =>
				btn.setButtonText(S.btnReset).onClick(async () => {
					this.plugin.settings.width = DEFAULT_SETTINGS.width;
					this.plugin.settings.height = DEFAULT_SETTINGS.height;
					await this.plugin.saveSettings();
					this.plugin.applySize();
					this.plugin.reposition();
					this.display();
				})
			);

		new Setting(containerEl)
			.setName(S.setShowHeader)
			.setDesc(S.setShowHeaderDesc)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showHeader).onChange(async (value) => {
					this.plugin.settings.showHeader = value;
					await this.plugin.saveSettings();
					this.plugin.panelEl?.querySelector('.nav-dock-header')?.toggleClass('is-compact', !value);
				})
			);

		new Setting(containerEl)
			.setName(S.setLinkMode)
			.setDesc(S.setLinkModeDesc)
			.addDropdown((dd) =>
				dd
					.addOption('new-tab', S.optNewTab)
					.addOption('current-tab', S.optCurrentTab)
					.setValue(this.plugin.settings.linkOpenMode)
					.onChange(async (value) => {
						this.plugin.settings.linkOpenMode = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(S.setCloseOnLink)
			.setDesc(S.setCloseOnLinkDesc)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.closeOnLink).onChange(async (value) => {
					this.plugin.settings.closeOnLink = value;
					await this.plugin.saveSettings();
				})
			);
	}
	async moveEntry(index: number, offset: number) {
		const entries = this.plugin.settings.entries;
		const next = index + offset;
		if (next < 0 || next >= entries.length) return;
		[entries[index], entries[next]] = [entries[next], entries[index]];
		await this.plugin.saveSettings();
		this.plugin.refreshRibbonIcon();
		this.display();
	}

}
