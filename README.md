# Austin English Learning App

一个为孩子打造的智能英语学习平台，提供个性化学习体验。

## 🌟 功能特色

### 👨‍👩‍👧‍👦 家长控制面板
- **档案管理系统**：创建、管理多个学习档案
- **字母学习配置**：选择字母和音标发音
- **单词管理**：添加、编辑、排序单词列表
- **句子管理**：管理学习句子，支持星级评价
- **数据导入导出**：备份和恢复学习数据

### 👶 儿童学习界面
- **字母学习**：大字体显示，音频发音支持
- **单词复习**：配图学习，图片自动缓存
- **句子练习**：完整句子学习，智能图片匹配
- **随机模式**：打乱学习顺序，增加趣味性
- **进度追踪**：实时显示学习进度

### 🎵 音频系统
- 支持26个字母的标准发音
- 多种音标发音选择
- 本地音频文件播放
- 语音合成备用方案

### 🖼️ 智能图片系统
- Unsplash API集成
- 永久本地缓存
- 单词-图片智能匹配
- 句子关键词提取

## 🚀 技术栈

- **框架**：Next.js 15.3.3
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **图标**：Heroicons
- **日期处理**：Day.js
- **数据存储**：LocalStorage
- **图片API**：Unsplash

## 📦 安装和运行

### 环境要求
- Node.js 18+ 
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 生产构建
```bash
npm run build
npm start
```

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 首页 - 档案选择
│   ├── parent/            # 家长控制面板
│   └── child/             # 儿童学习界面
├── lib/                   # 工具库
│   ├── profileManager.ts  # 档案管理
│   └── fileStorage.ts     # 文件存储
├── types/                 # TypeScript类型定义
│   ├── index.ts          # 基础类型
│   └── profile.ts        # 档案相关类型
public/
├── audio/                 # 音频文件
│   └── letters/          # 字母发音文件
└── js/                   # 客户端脚本
    └── letter-audio-player.js
```

## 🎯 使用指南

### 首次使用
1. 访问首页创建学习档案
2. 进入家长控制面板配置学习内容
3. 选择要学习的字母和音标
4. 添加单词和句子
5. 切换到儿童界面开始学习

### 数据管理
- **导出**：在首页点击"导出所有档案"备份数据
- **导入**：点击"导入档案"恢复数据
- **多档案**：支持创建多个学习档案

### 音频配置
音频文件放置在 `public/audio/letters/` 目录下：
```
public/audio/letters/
├── a/
│   ├── a.mp3          # 字母名称发音
│   └── ae.mp3         # /æ/ 音标发音
├── b/
│   └── b.mp3
└── ...
```

## 🔧 配置说明

### Unsplash API
项目使用Unsplash API获取学习图片。如需修改API密钥，请编辑：
```typescript
// src/app/child/page.tsx
const UNSPLASH_ACCESS_KEY = 'your-api-key';
```

### 音频映射
字母音频映射配置在：
```javascript
// public/js/letter-audio-player.js
const letterAudioMap = {
  'a': ['a.mp3', 'ae.mp3'],
  // ...
};
```

## 📱 响应式设计

- **桌面端**：完整功能体验
- **平板端**：优化的触控界面
- **手机端**：简化的移动体验

## 🎨 设计特色

- **现代化UI**：Apple风格的简洁设计
- **渐变背景**：美观的视觉效果
- **大字体显示**：适合儿童阅读
- **动画效果**：增强交互体验
- **中文字体**：专门的儿童友好字体

## 📄 版本信息

当前版本：MVP 1.0 (updated 2025/6/14)

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 📝 许可证

MIT License

---

**Austin English Learning App** - 让英语学习变得简单而有趣！ 🌟 