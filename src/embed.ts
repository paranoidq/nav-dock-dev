/* Native MarkdownView in a detached leaf: stays editable when focus moves elsewhere.
 * Unlike MarkdownEmbed, this is a full editor and never changes to preview on blur.
 */
import { Notice, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { wsInternal } from './shims';

export const embedMethods = {
async renderPanelContent(this: any, containerEl: HTMLElement, file, request: number, focus: boolean) {
	const leaf = new (WorkspaceLeaf as any)(this.app) as WorkspaceLeaf & { containerEl: HTMLElement };
	this.editorLeaf = leaf;
	leaf.containerEl.addClass('nav-dock-editor-leaf');
	containerEl.appendChild(leaf.containerEl);
	try {
		this.editorReady = leaf.openFile(file, { active: false, state: { mode: 'source', source: false } });
		await this.editorReady;
		if (request !== this.openRequest || this.editorLeaf !== leaf) return;
		if (!(leaf.view instanceof MarkdownView)) throw new Error('Markdown editor unavailable');
		const view = leaf.view;
		const workspace = wsInternal(this.app);
		// Obsidian won't activate a detached leaf, and its activeEditor setter
		// ignores MarkdownView. Route editor commands while this view owns focus.
		leaf.containerEl.addEventListener('focusin', () => {
			if (this.editorLeaf === leaf) workspace._activeEditor = view;
		});
		this.panelEl?.addClass('is-editing');
		if (focus) view.editor?.focus();
		leaf.onResize();
	} catch (error) {
		console.error('[nav-dock-dev] Editor could not be opened', error);
		if (request === this.openRequest) {
			new Notice(this.uiStrings().editorError);
			this.closePanel();
		}
	}
},

/** Capture the old leaf before a new panel is opened, and flush edits before detach. */
async teardownEmbed(this: any) {
	const leaf = this.editorLeaf;
	const ready = this.editorReady;
	this.editorLeaf = null;
	this.editorReady = null;
	if (!leaf) return;
	if (leaf.view instanceof MarkdownView) wsInternal(this.app).unsetActiveEditor(leaf.view);
	try {
		// A fast outside click may close the popup before openFile has finished.
		// Detaching early would leave that pending load with an orphaned editor.
		await ready?.catch(() => undefined);
		const view = leaf.view as MarkdownView;
		// Native autosave can already be writing. Let it finish before the final flush.
		while ((view as any).saving) await new Promise((resolve) => window.setTimeout(resolve, 20));
		if (view instanceof MarkdownView) await view.save();
		if (this.app.workspace.activeLeaf === leaf) {
			const previous = this.getActiveMainLeaf();
			if (previous && previous !== leaf) this.app.workspace.setActiveLeaf(previous, { focus: false });
		}
		leaf.detach();
	} catch (error) {
		// Obsidian's native save also stores a recovery backup when writing fails.
		console.error('[nav-dock-dev] Editor save failed', error);
		new Notice(this.uiStrings().saveError, 0);
	}
},

isEditing(this: any) {
	return this.editorLeaf?.view instanceof MarkdownView && this.editorLeaf.view.getMode() === 'source';
},

isEditorAuxiliaryTarget(this: any, target: Element) {
	return !!target.closest('.modal-container, .suggestion-container, .menu, .popover');
},

hasEditorDialog(this: any) {
	return !!this.editorLeaf
		&& this.app.workspace.activeEditor === this.editorLeaf.view
		&& !!document.querySelector('.modal-container');
},
};
