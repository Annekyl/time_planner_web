# 时间规划网站

个人时间规划工具，部署在 GitHub Pages，使用 Supabase 作为后端。

## 功能

- **任务管理** - 创建、编辑、删除任务，设置优先级、截止日期和分类
- **日历视图** - 在日历上查看任务和时间块安排
- **目标设定** - 设定长期目标并跟踪进度
- **时间块规划** - 在时间轴上规划每天的时间块
- **数据统计** - 查看任务完成趋势、分类统计等数据

## 技术栈

- 前端：React + TypeScript + TailwindCSS
- 后端：Supabase（数据库 + 身份验证）
- 部署：GitHub Pages

## 设置步骤

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 并注册/登录
2. 创建新项目
3. 进入 SQL Editor，执行 `supabase/schema.sql` 中的 SQL 脚本
4. 在 Settings > API 中获取 Project URL 和 anon key

### 2. 配置环境变量

创建 `.env` 文件：

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 本地开发

```bash
npm install
npm run dev
```

### 4. 部署到 GitHub Pages

1. 将代码推送到 GitHub 仓库
2. 进入仓库 Settings > Secrets and variables > Actions
3. 添加 Secrets：
   - `VITE_SUPABASE_URL`：你的 Supabase URL
   - `VITE_SUPABASE_ANON_KEY`：你的 Supabase anon key
4. 进入 Settings > Pages，Source 选择 "GitHub Actions"
5. 推送代码后将自动部署

## 数据库结构

- `categories` - 任务分类
- `tasks` - 任务
- `goals` - 目标
- `time_blocks` - 时间块
