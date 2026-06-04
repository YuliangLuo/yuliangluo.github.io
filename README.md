# Yuliang Luo 技术博客模板

这是一个基于 VitePress + GitHub Pages 的个人技术博客模板，分享写白盒测试 Agent、机器学习基础理解、Agent 工程趋势、测试自动化和工程化实践笔记。


然后进入 GitHub 仓库：

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

之后每次 push 到 `main` 分支都会自动部署。

## 新增文章

在 `docs/posts/` 下创建 Markdown 文件，例如：

```text
docs/posts/new-post.md
```

然后在 `docs/posts/index.md` 和 `docs/.vitepress/config.mjs` 的 sidebar 里添加链接。

## 当前内置文章

```text
docs/posts/whitebox-test-agent.md
docs/posts/backpropagation-understanding.md
docs/posts/agent-trends-2026.md
```

## 目录规划

```text
docs/
├── index.md
├── about.md
├── posts/
│   ├── index.md
│   ├── whitebox-test-agent.md
│   ├── backpropagation-understanding.md
│   └── agent-trends-2026.md
└── .vitepress/
    ├── config.mjs
    └── theme/
        ├── index.js
        └── custom.css
```
