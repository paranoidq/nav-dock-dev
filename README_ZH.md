# Nav Dock-dev

基于 [Nav Dock](https://github.com/ichris007/nav-dock) 的本地开发版，保留原项目 MIT 许可。

- 支持多个 Markdown 文件，每个文件在左侧工具栏有独立图标，可增删和调整顺序。
- 每个入口可单独选择图标和提示文字。图标选择器提供网格预览、常用图标和名称搜索。
- 点击图标直接打开原生 Markdown 实时预览编辑器，修改自动保存；切换文件和关闭时立即保存。
- 原生编辑区聚焦命令和 cMenu 操作跟随当前聚焦的浮层，选择弹窗内容后仍保留编辑目标。
- 标题栏锁形按钮可锁定/解锁当前文件的弹层。锁定后点击编辑区、其他区域或移开鼠标均不会关闭，也不会切回预览。
- 每个文件记住自己的锁定状态；关闭按钮、再次点击同一入口或 Esc 仍可主动关闭。点击另一入口切换到对应文件。
- 浮层不添加工作区标签页，也没有阻挡背景操作的遮罩。同一时间显示一个编辑弹层。
- 右下角可拖拽调整大小。笔记重命名时同步更新入口路径。
- 拖动标题栏可移动浮层。所有入口共用最后一次拖动的位置，切换入口、关闭重开或重启 Obsidian 后均保留。

## 使用

打开「设置 → Nav Dock-dev → 文件入口 → 添加文件」，选择笔记路径，再点击「选择图标」。可设置提示文字，并用上下箭头调整入口顺序。移除入口不会删除笔记。

## 构建和安装

```sh
npm ci
npm run check
npm run build
```

将 `manifest.json`、`main.js`、`styles.css` 复制到目标库的 `.obsidian/plugins/nav-dock-dev/`，在第三方插件设置中启用 **Nav Dock-dev**。

插件 ID 和协议入口为 `nav-dock-dev`，不会覆盖原版 `nav-dock`。如果把原版的 `data.json` 放到开发版目录，首次加载会自动迁移原来的笔记、图标、尺寸和其他设置。

## 运行验证

启用目标库的 Obsidian CLI 后：

```sh
OBSIDIAN_VAULT=my-new-wiki npm run test:smoke
OBSIDIAN_VAULT=my-new-wiki npm run test:editor-context
```

可用 `OBSIDIAN_CLI` 指定 CLI 路径。测试仅编辑新建的临时笔记，并在结束时清理测试笔记、恢复原配置。覆盖多文件入口、不同图标、默认编辑、锁定/解锁、关闭/切换时保存、快速切换、加载过程中关闭、重命名和编辑器卸载。

编辑上下文测试还覆盖原生聚焦命令、cMenu 清单插入（安装 cMenu 时）、选择弹窗焦点及切回主编辑区。原生 Markdown 编辑器使用 detached `WorkspaceLeaf` 和活动编辑器内部字段，依赖 Obsidian 的非稳定接口。已在 Obsidian 1.13.7 上实际验证。
