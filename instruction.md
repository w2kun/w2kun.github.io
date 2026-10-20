# 页面更新指南

## 本地开发

安装 Node.js 24（使用 nvm 时执行 `nvm use`），然后运行：

```sh
npm ci
npm run dev
```

访问终端显示的本地地址（默认 `http://localhost:8080`）。如果通过 VS Code Remote SSH 开发，在 Ports 面板转发 8080 端口，打开面板显示的本地地址。保存内容、模板和样式后会自动更新。不要直接双击模板文件预览。

```sh
npm run check   # 数据检查的测试 + 静态构建 + 输出链接与引用内容检查
npm run build   # 构建并检查，输出到 _site/
```

`_site/` 和 `node_modules/` 不提交。`package-lock.json` 应提交；日常使用 `npm ci` 安装锁定版本。

## 去哪里修改

| 内容 | 文件 |
| --- | --- |
| 论文、作者顺序、图片、链接和简介 | `src/_data/publications.json` |
| 作者姓名与主页链接 | `src/_data/authors.json` |
| 姓名、头像、联系方式、站点地址和统计 ID | `src/_data/site.json` |
| 个人介绍、研究方向 | `src/_includes/content/*.md` |
| AC、PC 和审稿经历 | `src/_data/activities.json` |
| 学术活动展示布局 | `src/_includes/activities.njk` |
| 论文展示布局 | `src/_includes/publication.njk` |
| 首页各部分的顺序 | `src/index.njk` |
| 公共页面结构 | `src/_includes/layout.njk` |
| 样式与手机适配 | `src/styles.css` |

`site.authorId` 对应的作者会加粗。作者没有主页时省略 `url`，不要写空链接。使用自己的统计 ID；清空 `analyticsId` 可以关闭统计，本地预览也使用这一设置。参考此项目搭建个人主页时，请同时更新姓名、联系方式、`site.url`、`authorId` 和头像。替换不同尺寸的头像时，同步更新 `src/index.njk` 中图片的 `width` 与 `height`，使其符合新图片的原始尺寸。

## 添加论文

1. 将图片放入 `images/<论文ID>/`，引用文件放入 `bibtex/<论文ID>.bib`。
2. 在 `authors.json` 中添加尚未收录的作者，以稳定的 ID 引用作者。
3. 在 `publications.json` 中复制一条记录并修改。首页按年份倒序分组，同一年内保持数组顺序。
4. 运行 `npm run check`，再用 `npm run dev` 查看桌面和手机布局。

示例记录（资源文件和作者 ID 必须真实存在）：

```json
{
  "id": "example",
  "title": "Example Paper",
  "url": "https://arxiv.org/abs/xxxx.xxxxx",
  "authors": [
    { "id": "kun-wang", "equalContribution": true },
    { "id": "jun-li", "corresponding": true }
  ],
  "venue": "CVPR",
  "year": 2026,
  "images": [
    { "src": "/images/example/figure.png", "alt": "Overview of the proposed method" }
  ],
  "imageLayout": "stack",
  "links": [
    { "label": "Github", "url": "https://github.com/owner/repository" }
  ],
  "bibtex": "/bibtex/example.bib",
  "summary": "A short description of the work."
}
```

- `id` 只使用小写字母、数字、连字符和下划线，必须唯一；同时用于首页锚点、引用页面和 `.bib` 文件名。
- `equalContribution` 和 `corresponding` 属于每篇论文中的作者记录，分别显示 `*` 和 `✉`；没有标记时省略字段。
- `imageLayout: "stack"` 将图片上下排列；`"swap"` 必须有两张图片，桌面悬停或键盘聚焦时切换，窄屏或触屏上显示两张。
- 没有图片或额外链接时分别使用 `images: []` 和 `links: []`。
- 可选 `award: "oral"` 显示强调标记。JSON 字段填写纯文本，无需 HTML 标签。
- BibTeX 从现有 `.bib` 文件生成 `/citations/<id>/` 阅读页，并提供原文件下载；不需要重复填写引用文本。

资源 URL 使用 `/images/...`、`/bibtex/...` 和 `/stylesheet.css`。当前配置面向域名根目录，不支持直接部署到 `/repository/` 子路径。

## 维护 Academic Activities

`src/_data/activities.json` 中，`roles` 存放 AC、PC 等任职分类，每条记录包含 `year`、`venue`，以及可选的 `sample`。同一角色内按年份倒序展示；空的 `entries` 不显示该分类。

`sample` 表示是否为示例记录，省略时按 `false` 处理，不显示示例标签；只有 `sample: true` 会显示 **Example only · 示例** 标签。填写真实任职的会议和年份后，可删除 `sample` 字段或设为 `false`。填写时必须使用 JSON 布尔值，不能使用字符串 `"false"` 或 `"true"`。发布前请替换或删除示例记录。

在 `reviewing` 中增删会议或期刊，使用 `abbreviation` 填写简称、`name` 填写全称。

## 发布

首次发布前，在 GitHub 仓库的 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。仓库已有工作流，无需再创建发布模板。

`.github/workflows/pages.yml` 会检查所有 Pull Request；推送到 `main` 后，只有检查通过才上传 `_site/` 并发布。也可以在 Actions 页面手动运行工作流。无需手动提交生成后的 HTML。

检查包括必填字段、重复论文 ID、作者引用、图片/BibTeX 文件、链接协议，以及输出 HTML 中的本地链接、锚点和引用文本。外部网站是否在线不作为构建条件。

### 日常提交与发布步骤

1. 完成内容修改，运行 `npm run dev` 预览。
2. 运行 `npm run check`，修正检查发现的问题。
3. 检查当前分支和改动：

   ```sh
   git branch --show-current
   git status
   git diff
   ```

4. 如果当前分支为 `main`，且所有待提交文件都属于本次更新，执行：

   ```sh
   git add -A
   git diff --cached --stat
   git commit -m "Update website content"
   git push origin main
   ```

   在其他分支工作时，推送该分支并通过 Pull Request 合并到 `main`。

5. 在 GitHub 的 **Actions → Check and deploy website** 中查看执行结果。`build` 和 `deploy` 都成功后，访问站点检查更新；若失败，打开失败步骤的日志，修正后重新提交。

无需手动上传或提交 `_site/`。线上网页由 GitHub Pages 托管，不依赖本地或远程开发服务器持续运行。
