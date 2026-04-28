# 上班打卡小程序

基于 Vue 3 + IndexedDB + Element Plus 的上班打卡管理应用，支持自动工资计算、数据可视化、日历视图、日记功能和 Obsidian 双向同步。

## 功能特点

### 打卡管理
- **上下班打卡**：记录每日上下班时间，自动生成时间戳
- **自动状态判断**：根据标准时间自动判断迟到/早退/缺勤
- **补打卡功能**：支持单日和批量补打卡，含预览
- **记录编辑/删除**：修改已有打卡记录（时间、状态、日薪、天气、心情）

### 工资计算
- **灵活配置**：日薪、周末加班倍数、标准上下班时间
- **自动计算**：根据打卡时间和配置自动计算日薪
- **周末倍数**：周末工作按倍数计算工资
- **加班计算**：超过8小时按加班费计算

### 日历 & 日记
- **日历视图**：月度打卡情况一目了然，颜色标记不同状态
- **日记功能**：每日期可写日记 + 记录工作任务
- **图片支持**：支持 Ctrl+V 粘贴图片（base64 嵌入）
- **Obsidian 联动**：日记自动同步为 `.md` 文件到 Obsidian Vault，双向读写

### 数据可视化
- **统计报表**：工资趋势折线图、出勤分布饼图（ECharts）
- **月度统计**：工作天数、总工资、加班天数、迟到/早退天数

### 数据管理
- **本地存储**：IndexedDB 浏览器端数据持久化
- **Obsidian 同步**：日记以 Markdown 文件存储，Obsidian 可直接编辑
- **数据备份**：支持 JSON 格式导出和导入恢复
- **暗黑模式**：跟随系统颜色方案自动切换，全页面适配
- **现代 UI**：靛蓝主题色、渐变卡片、毛玻璃导航栏、页面过渡动画

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | Vue 3 (Composition API) |
| UI 组件库 | Element Plus |
| 数据可视化 | ECharts |
| 路由管理 | Vue Router 5 |
| 本地存储 | IndexedDB |
| 后端服务 | Python FastAPI + uvicorn |
| 文件同步 | Obsidian Vault (.md) |
| 构建工具 | Vite 8 |

## 快速开始

### 前置要求
- Node.js >= 18
- Python >= 3.10（如需 Obsidian 同步）

### 安装
```bash
npm install

# 如需 Obsidian 同步功能：
pip install -r backend/requirements.txt
```

### 启动（纯前端）
```bash
npm run dev
```
访问 http://localhost:5173

### 启动（含 Obsidian 同步）
```bash
# 终端 1：启动后端
npm run dev:backend

# 终端 2：启动前端
npm run dev
```
前端 :5173，后端 :8765，Vite 自动代理 `/api` 到后端。

### 构建生产版本
```bash
npm run build
npm run preview
```

## 项目结构

```
attendance-app/
├── src/
│   ├── pages/                # 页面组件
│   │   ├── Home.vue         # 打卡主页（问候语、实时时钟、状态卡片、打卡按钮、记录表格）
│   │   ├── Calendar.vue     # 日历视图（月度日历、日记编辑、批量补打卡）
│   │   ├── Statistics.vue   # 统计报表（ECharts 图表、月度明细）
│   │   └── Settings.vue     # 设置页面（工资配置、数据导入导出）
│   ├── components/           # 公共组件
│   │   └── NavBar.vue       # 顶部导航栏（毛玻璃效果、渐变Logo）
│   ├── composables/          # 组合式函数
│   │   ├── useAttendance.js # 打卡业务逻辑
│   │   ├── useSalary.js     # 工资计算逻辑
│   │   └── useDiary.js      # 日记业务逻辑（后端API优先 + IndexedDB降级）
│   ├── db/                   # 数据库层
│   │   └── index.js         # IndexedDB 封装（v2，含 diary_entries 表）
│   ├── utils/                # 工具函数
│   │   ├── date.js          # 日期时间工具
│   │   └── salary.js        # 工资计算工具
│   ├── router/index.js       # 路由配置
│   ├── main.js               # 应用入口
│   ├── App.vue               # 根组件
│   ├── style.css             # 设计令牌 + 全局样式
│   └── theme.css             # Element Plus 主题覆盖
├── backend/                   # Python 后端（Obsidian 同步）
│   ├── server.py             # FastAPI 服务（端口 8765）
│   └── requirements.txt      # Python 依赖
├── public/                   # 静态资源
├── index.html
├── vite.config.js            # Vite 配置（含 /api 代理）
└── package.json
```

## 页面说明

### 1. 打卡主页 (`/`)
- 时段问候语 + 实时时钟（HH:mm:ss）
- 三张渐变状态卡片：今日状态、工作时长、今日收入
- 上班/下班打卡按钮（渐变 + 图标 + hover 动效）
- 补打卡对话框
- 最近 10 条打卡记录表格（可编辑、删除）

### 2. 日历视图 (`/calendar`)
- 月度日历网格，支持月份切换和回到今天
- 日期颜色标记（正常/迟到/早退/缺勤/周末/今日/选中）
- 天气和心情 emoji 选择
- 点击日期查看详情面板
- **日记功能**：
  - 工作任务输入
  - 富文本编辑区（支持 Ctrl+V 粘贴图片）
  - 有日记的日期显示 📝 标记
  - **Obsidian 同步**：保存时自动写入 `.md` 文件
- 单日和批量补打卡

### 3. 统计报表 (`/statistics`)
- 月度选择器 + 概览卡片
- 工资趋势折线图（ECharts）
- 出勤分布饼图
- 月度详细记录表格

### 4. 设置页面 (`/settings`)
- 工资设置（日薪、周末倍数、标准上下班时间）
- 数据管理（导出/导入 JSON）
- 关于页面

## Obsidian 日记同步

### 工作原理

```
打卡应用 :5173 ──/api──▶ Vite 代理 ──▶ Python 后端 :8765 ──▶ Obsidian Vault .md 文件
```

- **写日记**：前端 → 后端 API → 写入 `.md` 文件（含 YAML frontmatter）→ 同时缓存 IndexedDB
- **读日记**：优先从 `.md` 读取（Obsidian 中最新内容）→ 降级到 IndexedDB
- **图片**：粘贴时 base64 → 保存时自动提取为 `.png` 存到 `assets/` 文件夹
- **容错**：后端不可用时自动降级到 IndexedDB

### .md 文件格式

```markdown
---
updated: 2026-04-28T15:30:00
tasks: 完成项目需求分析
---

日记正文内容...

![图片](assets/2026-04-28/img_153000.png)
```

### 配置

默认同步路径在 `backend/server.py` 中：

```python
OBSIDIAN_DIARY_DIR = Path(r"D:\电脑默认缓存\文档\Obsidian Vault\TODAY\日记")
```

如需修改，编辑此路径后重启后端。

## 配置说明

### 工资参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| 日薪 | 工作日每日工资 | 300 元 |
| 周末加班倍数 | 周末工资倍数 | 2 倍 |
| 标准上班时间 | 用于判断迟到 | 09:00 |
| 标准下班时间 | 用于判断早退 | 18:00 |

### 计算规则

1. **基础日薪**：工作日按日薪，周末按 `日薪 × 周末倍数`
2. **加班工资**：超过 8 小时的部分，按 `小时工资 × 周末倍数`
3. **小时工资**：`日薪 ÷ 8`
4. **示例**：日薪 300 元，周末倍数 2，工作日加班 2 小时
   - 基础日薪：300 元
   - 加班工资：`(300 ÷ 8) × 2 × 2 = 150 元`
   - 总工资：450 元

## 数据库说明

使用 IndexedDB 浏览器本地存储（v2），包含 4 个对象存储：

| 存储名称 | 主键 | 用途 |
|----------|------|------|
| `salary_settings` | `id` | 工资配置（单条，id='primary'） |
| `punch_records` | `id` | 打卡记录（索引：date, month） |
| `monthly_summaries` | `id` | 月度统计摘要 |
| `diary_entries` | `id` | 日记条目（索引：date, month） |

## 许可证

本项目仅供学习和个人使用。

---

**版本**：1.1.0
**最后更新**：2026年4月28日
**开发者**：Lavanda
