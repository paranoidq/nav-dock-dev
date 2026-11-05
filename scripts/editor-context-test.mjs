// Regression checks against the running vault; only generated scratch notes are edited.
import { execFileSync } from 'node:child_process';
const cli = process.env.OBSIDIAN_CLI || '/Applications/Obsidian.app/Contents/MacOS/obsidian-cli';
const vault = process.env.OBSIDIAN_VAULT || 'my-new-wiki';

async function probe() {
	const { MarkdownView, FileView, View, Modal } = require('obsidian');
	class UnrelatedView extends View {}
	const p = app.plugins.plugins['nav-dock-dev'];
	if (!p) throw new Error('Enable nav-dock-dev before running this test');
	const original = JSON.parse(JSON.stringify(p.settings));
	const previous = app.workspace.activeLeaf;
	const previousUserLeaf = p.lastUserLeaf;
	const popup = p.panelEl ? {
		entryId: p.activeEntryId, pinned: p.pinned, placement: p.placement,
		focus: p.panelEl.contains(document.activeElement),
	} : null;
	const folder = `nav-dock-context-test-${crypto.randomUUID()}`;
	const results = [];
	const check = (condition, message) => {
		if (!condition) throw new Error(message);
		results.push(message);
	};
	const tick = () => new Promise(resolve => setTimeout(resolve, 80));
	let main, modal;
	try {
		p.closePanel();
		await p.closingEditor;
		await app.vault.createFolder(folder);
		const file = await app.vault.create(`${folder}/Popup.md`, 'Popup scratch');
		const background = await app.vault.create(`${folder}/Main.md`, 'Main scratch');
		main = app.workspace.getLeaf('tab');
		await main.openFile(background, { active: true });
		main.view.editor.focus();
		p.settings.entries = [{ id: 'context-test', notePath: file.path, icon: 'inbox', label: 'Context test', locked: false }];
		p.settings.trigger = 'click';
		p.refreshRibbonIcon();
		await p.openPanel({ entryId: 'context-test', pinned: true, focus: false });
		const view = p.editorLeaf.view;
		check(app.workspace.getActiveViewOfType(MarkdownView) === main.view
			&& !p.panelEl.contains(document.activeElement), 'Opening without focus keeps commands on the main editor');
		view.editor.focus();
		view.editor.setCursor(0, 0);
		check(app.workspace.getActiveViewOfType(MarkdownView) === view, 'Clicking into the popup makes it the active Markdown command target');
		check(app.workspace.getActiveViewOfType(FileView) === view, 'Compatible base view types resolve to the popup');
		check(app.workspace.getActiveViewOfType(UnrelatedView) === null, 'Unrelated view types do not resolve to a background view');
		app.commands.executeCommandById('editor:focus');
		check(p.panelEl.contains(document.activeElement), 'Native editor:focus keeps keyboard focus in the popup');
		const command = app.commands.commands['cmenu-plugin:editor:toggle-checklist-status'];
		if (command) {
			app.commands.executeCommandById(command.id);
			await tick(); // cMenu waits before its final editor:focus command.
			check(p.panelEl.contains(document.activeElement), 'cMenu checklist command keeps focus after its delayed callback');
			check(view.editor.getValue() === '- [ ] Popup scratch', 'cMenu inserts the checklist in the popup');
			check(view.editor.getCursor().ch === '- [ ] '.length, 'cMenu restores the cursor at the popup checklist text');
			view.editor.replaceSelection('Typed here ');
			check(view.editor.getValue().includes('Typed here '), 'Typing after cMenu continues in the popup');
		}
		check(main.view.editor.getValue() === 'Main scratch'
			&& main.view.editor.getCursor().ch === 0, 'Popup commands leave the background document and cursor unchanged');
		modal = new Modal(app);
		const input = modal.contentEl.createEl('input');
		modal.open();
		input.focus();
		check(app.workspace.getActiveViewOfType(MarkdownView) === view, 'A picker dialog keeps its originating popup as the command target');
		modal.close();
		modal = null;
		await tick();
		check(p.panelEl.contains(document.activeElement), 'Closing a picker restores focus to the popup');
		p.locked = true;
		main.view.editor.focus();
		check(app.workspace.getActiveViewOfType(MarkdownView) === main.view, 'Focusing the main editor releases popup commands even when locked');
		app.commands.executeCommandById('editor:focus');
		check(!p.panelEl.contains(document.activeElement), 'Native focus commands respect an intentional switch to the main editor');
		p.closePanel();
		await p.closingEditor;
		check(app.workspace.getActiveViewOfType(MarkdownView) === main.view, 'Closing the popup restores normal active-view lookup');
		return JSON.stringify({ ok: true, checks: results });
	} finally {
		modal?.close();
		p.closePanel();
		await p.closingEditor;
		p.settings = original;
		p.refreshRibbonIcon();
		await p.saveSettings();
		main?.detach();
		if (previous) app.workspace.setActiveLeaf(previous, { focus: true });
		p.lastUserLeaf = previousUserLeaf;
		if (popup) await p.openPanel(popup);
		const scratch = app.vault.getAbstractFileByPath(folder);
		if (scratch) await app.vault.delete(scratch, true);
	}
}

const output = execFileSync(cli, [`vault=${vault}`, 'eval', `code=(${probe.toString()})()`], { encoding: 'utf8', timeout: 30000 });
console.log(output.trim());
if (!output.includes('"ok":true')) process.exitCode = 1;
