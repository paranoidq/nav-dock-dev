// Integration test against a running Obsidian vault. Only generated scratch notes are edited.
import { execFileSync } from 'node:child_process';
const cli = process.env.OBSIDIAN_CLI || '/Applications/Obsidian.app/Contents/MacOS/obsidian-cli';
const vault = process.env.OBSIDIAN_VAULT || 'my-new-wiki';

async function probe() {
	const p = app.plugins.plugins['nav-dock-dev'];
	if (!p) throw new Error('Enable nav-dock-dev before running the smoke test');
	const original = JSON.parse(JSON.stringify(p.settings));
	const folder = `nav-dock-dev-test-${crypto.randomUUID()}`;
	const results = [];
	const check = (condition, message) => {
		if (!condition) throw new Error(message);
		results.push(message);
	};
	const tick = () => new Promise((resolve) => setTimeout(resolve, 80));
	try {
		p.closePanel();
		await p.closingEditor;
		await app.vault.createFolder(folder);
		const a = await app.vault.create(`${folder}/A.md`, '# Scratch A\n');
		const b = await app.vault.create(`${folder}/B.md`, '# Scratch B\n');
		p.settings.entries = [
			{ id: 'test-a', notePath: a.path, icon: 'inbox', label: 'Scratch A', locked: false },
			{ id: 'test-b', notePath: b.path, icon: 'star', label: 'Scratch A', locked: false },
		];
		p.settings.trigger = 'click';
		p.refreshRibbonIcon();
		const ribbon = app.workspace.leftRibbon;
		const actions = ribbon.items.filter((item) => item.buttonEl && item.id.startsWith('nav-dock-dev:'));
		check(actions.length === 2 && actions.every((item) => item.buttonEl.isConnected),
			'Both shortcuts are attached to the native ribbon even with duplicate labels');
		check(actions.every((item) => item.title === 'Scratch A'), 'Native ribbon menu uses the configured labels');
		check(p.ribbonEls.get('test-a').querySelector('svg')?.outerHTML !== p.ribbonEls.get('test-b').querySelector('svg')?.outerHTML, 'Different icons render independently');
		p.ribbonEls.get('test-a').click();
		await tick();
		check(p.currentFilePath === a.path && p.isEditing(), 'Ribbon click opens the selected file directly in edit mode');
		check(p.panelEl.querySelector('.cm-editor .cm-content'), 'Native CodeMirror editor is mounted');
		check(!p.backdropEl, 'No overlay blocks the background editor');
		const view = p.editorLeaf.view;
		view.editor.setValue('# Scratch A\nSaved immediately on switch.\n');
		p.ribbonEls.get('test-b').click();
		await tick();
		await p.closingEditor;
		check((await app.vault.read(a)).includes('Saved immediately on switch.'), 'Switching files flushes pending edits');
		check(p.currentFilePath === b.path && p.isEditing(), 'Second ribbon opens the second file in edit mode');
		await p.toggleLock();
		const background = document.querySelector('.workspace-split.mod-root');
		background.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		background.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await tick();
		check(!!p.panelEl && p.locked && p.isEditing(), 'Locked editor survives outside clicks and remains editable');
		check(p.panelEl.querySelector('.nav-dock-lock').getAttribute('aria-pressed') === 'true', 'Lock button exposes the locked state');
		p.editorLeaf.view.editor.setValue('# Scratch B\nSaved immediately on close.\n');
		p.panelEl.querySelector('.nav-dock-close').click();
		await p.closingEditor;
		check(!p.panelEl && (await app.vault.read(b)).includes('Saved immediately on close.'), 'Close button saves even a locked editor');
		await p.openPanel({ entryId: 'test-b', placement: 'dock' });
		check(p.locked, 'Each file remembers its lock state');
		await p.toggleLock();
		background.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		await p.closingEditor;
		check(!p.panelEl, 'Unlocked editor closes on an outside click');
		await Promise.all([p.openPanel({ entryId: 'test-a' }), p.openPanel({ entryId: 'test-b' })]);
		check(p.currentFilePath === b.path && document.querySelectorAll('.nav-dock-panel').length === 1, 'Rapid file switching leaves only the latest editor');
		p.closePanel();
		await p.closingEditor;
		check(!document.querySelector('.nav-dock-editor-leaf'), 'Closing cleans up the editor DOM');
		const opening = p.openPanel({ entryId: 'test-a' });
		await Promise.resolve();
		p.closePanel();
		await opening;
		await p.closingEditor;
		check(!p.panelEl && !p.editorLeaf, 'Closing during file loading does not resurrect a popup');
		const movedPath = `${folder}/Renamed.md`;
		await app.fileManager.renameFile(a, movedPath);
		check(p.settings.entries[0].notePath === movedPath, 'File shortcuts follow renamed notes');
		check(!app.workspace.getLeavesOfType('markdown').some((leaf) => leaf.view.file?.path.startsWith(folder)), 'Popup editors do not create workspace tabs');
		return JSON.stringify({ ok: true, checks: results });
	} finally {
		p.closePanel();
		await p.closingEditor;
		p.settings = original;
		p.activeEntryId = original.entries[0]?.id || '';
		p.refreshRibbonIcon();
		await p.saveSettings();
		const scratch = app.vault.getAbstractFileByPath(folder);
		if (scratch) await app.vault.delete(scratch, true);
	}
}

const output = execFileSync(cli, [`vault=${vault}`, 'eval', `code=(${probe.toString()})()`], { encoding: 'utf8', timeout: 30000 });
console.log(output.trim());
if (!output.includes('"ok":true')) process.exitCode = 1;
