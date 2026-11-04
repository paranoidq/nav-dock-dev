# Nav Dock-dev

A local development fork of [Nav Dock](https://github.com/ichris007/nav-dock), under the original MIT license. See [中文说明](README_ZH.md).

- Add multiple note shortcuts, each with its own ribbon icon and tooltip.
- Choose icons from a searchable grid, with common icons listed first.
- Open notes directly in a native Markdown live-preview editor, with autosave and a final save on switch/close.
- Lock a panel to keep it open while working elsewhere. Lock state is remembered per note.
- Close explicitly with Esc, the close button, or the same ribbon icon. Another shortcut switches files.
- One popup at a time; no workspace tabs or background-blocking overlay.
- Resize from the bottom-right corner; shortcuts follow renamed notes.

Configure shortcuts in **Settings → Nav Dock-dev → File shortcuts → Add file**. Removing a shortcut never deletes its note.

## Build

```sh
npm ci
npm run check
npm run build
```

Copy `manifest.json`, `main.js`, and `styles.css` into `<vault>/.obsidian/plugins/nav-dock-dev/`, then enable Nav Dock-dev. Its ID and URI scheme are `nav-dock-dev`. An upstream `data.json` is migrated from its single-note configuration on first load.

## Integration checks

With Obsidian CLI enabled in the target vault:

```sh
OBSIDIAN_VAULT=my-new-wiki npm run test:smoke
```

Override `OBSIDIAN_CLI` to set the executable path. The test uses temporary notes and restores the original settings in a finally block. It checks shortcuts, icons, initial editing mode, locking, immediate save, rapid switching, closing during load, rename tracking, and editor cleanup.

The detached `WorkspaceLeaf` constructor is an internal API. Verified against Obsidian 1.13.7.
