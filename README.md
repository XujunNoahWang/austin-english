# Austin English | 个性化英语复习工具

[English](#english) | [中文](#中文)

🌐 **在线演示** | **Live Demo**: [https://austin-english.vercel.app/](https://austin-english.vercel.app/)

---

## 中文

### 📚 这是什么？

**Austin English** 是一个与众不同的个性化英语复习工具。与传统的英语学习应用不同，这里**没有预设的学习内容**，而是完全由家长根据孩子正在学习的英语课程来自建复习内容库。

🌐 **在线体验**: [https://austin-english.vercel.app/](https://austin-english.vercel.app/)

### 🎯 为什么与众不同？

| 传统英语学习应用 | Austin English |
|-----------------|----------------|
| ❌ 提供现成的学习内容 | ✅ 家长自建学习内容 |
| ❌ 千篇一律的内容 | ✅ 专属定制的复习库 |
| ❌ 无法配合现有课程 | ✅ 完美配合任何英语课程 |
| ❌ 一刀切的学习进度 | ✅ 跟随孩子的实际学习进度 |

### 🌟 核心特色

#### 🏗️ **配合任何课程**
- 支持雪梨老师、剑桥英语、新概念等任何英语课程
- 家长根据课程进度添加单词和句子
- 完全同步孩子的学习内容

#### 👨‍👩‍👧‍👦 **家长自建内容**
- 零预设内容，完全由家长定制
- 根据课程进度添加单词和句子
- 灵活的内容管理系统

#### 🎨 **专属复习体验**
- 告别千篇一律的学习内容
- 每个孩子都有独特的复习库
- 针对性强，效果显著

### 📱 功能模块

#### 👨‍👩‍👧‍👦 家长管理中心
- **档案管理**：为不同孩子创建独立档案
- **字母配置**：选择要学习的字母和音标
- **单词管理**：添加课程中的重要单词
- **句子管理**：输入课程中的关键句子
- **数据同步**：支持导入导出，多设备使用

#### 👶 孩子学习界面
- **字母复习**：大字体显示，标准发音，自动音频播放
- **单词练习**：配图学习，智能图片匹配，语音朗读
- **句子阅读**：完整句子练习，语音播放，图片辅助理解
- **趣味游戏**：图片选择游戏，寓教于乐，巩固单词记忆
- **随机模式**：打乱顺序，增加趣味性
- **智能导航**：左右箭头、圆点导航均支持自动音频播放
- **进度跟踪**：实时显示学习进度

### 🛠️ 技术栈

#### 🏗️ 前端框架
- **Next.js** (latest) - React全栈框架，支持SSR/SSG
- **React** (latest) - 用户界面构建库
- **TypeScript** (latest) - 静态类型检查，提升代码质量

#### 🎨 UI & 样式
- **Tailwind CSS** (^3.3.0) - 实用优先的CSS框架
- **PostCSS** (^8.4.31) - CSS后处理工具
- **Autoprefixer** (^10.4.14) - 自动添加CSS浏览器前缀

#### 🔧 开发工具
- **ESLint** (9.28.0) - 代码质量检查工具
- **ESLint Config Next** (15.3.3) - Next.js官方ESLint配置

#### 📦 功能依赖
- **@heroicons/react** (^2.1.1) - 高质量SVG图标库
- **dayjs** (^1.11.13) - 轻量级日期处理库

#### 🔧 开发依赖
- **kill-port** (^2.0.1) - 端口管理工具，开发时自动清理端口

#### 🌐 外部API
- **Unsplash API** - 高质量图片资源
- **Web Speech API** - 浏览器原生语音合成

### 🚀 技术特性

- **🎵 智能音频系统**：26个字母标准发音 + 语音合成 + 自动播放优化
- **🖼️ 自动配图系统**：Unsplash API + 永久本地缓存 + 快速SVG占位符
- **🎮 游戏引擎**：模块化游戏系统，图片预加载，音频同步
- **💾 数据管理**：LocalStorage + 导入导出功能 + 实时同步
- **📱 响应式设计**：支持手机、平板、电脑，统一交互体验
- **🔒 类型安全**：全面的TypeScript类型定义，零类型错误
- **⚡ 性能优化**：Next.js图片优化 + 客户端缓存 + 水合错误修复

### 🛠️ 快速开始

```bash
# 克隆项目
git clone https://github.com/your-username/austin-english.git

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 📁 项目结构

```
src/
├── app/
│   ├── page.tsx           # 首页 - 档案选择
│   ├── parent/           # 家长管理中心
│   └── child/            # 孩子学习界面
│       ├── page.tsx      # 学习中心主页
│       └── game/         # 趣味游戏模块
│           ├── page.tsx  # 游戏主页面
│           └── components/
│               └── GameLogic.ts # 游戏逻辑组件
├── lib/
│   ├── profileManager.ts # 档案管理
│   ├── i18n.ts          # 国际化支持
│   └── fileStorage.ts   # 文件存储管理
└── types/               # TypeScript类型定义
    ├── index.ts         # 通用类型定义
    └── profile.ts       # 档案相关类型
```

### ⚠️ Unsplash API 配置

项目使用Unsplash API提供图片，当前使用作者的个人密钥（每小时50次请求限制）。

如需更高频率使用，请：
1. 访问 [Unsplash Developers](https://unsplash.com/developers) 申请API密钥
2. 在 `src/app/child/page.tsx` 中替换 `UNSPLASH_ACCESS_KEY`

### 🎯 使用场景示例

**场景1：配合雪梨老师课程**
- 孩子学习雪梨老师的英语课程
- 家长在Austin English中添加课程中的单词和句子
- 孩子使用应用进行针对性复习

**场景2：配合学校教材**
- 孩子在学校学习剑桥英语教材
- 家长根据每单元内容建立复习库
- 在家进行巩固练习

**场景3：趣味游戏巩固**
- 孩子完成单词学习后
- 通过图片选择游戏进行趣味复习
- 在游戏中巩固单词记忆，寓教于乐

### 📝 更新日志

**v0.2 (2025.6.19)**
- 🎮 **新增趣味游戏模块**：图片选择游戏，寓教于乐
- 🎵 **音频播放全面优化**：
  - 进入复习页面自动播放首项音频
  - 左右箭头导航自动播放音频
  - dot圆点导航自动播放音频
  - 游戏模块音频预加载和优化
- 🖼️ **图片系统优化**：
  - 快速SVG占位符，无需网络请求
  - 图片预加载机制，提升用户体验
  - 永久缓存系统，避免重复加载
- 🎨 **界面体验提升**：
  - 统一的header设计风格
  - 优化按钮点击区域和交互反馈
  - 简化loading页面，减少多语言切换问题
- 🔧 **技术优化**：
  - 清理所有调试代码
  - 修复TypeScript类型错误
  - 解决Next.js水合错误
  - 代码模块化和性能优化

**v0.1 (2025.6.18)**
- ✅ 核心功能完成
- ✅ 中英文界面支持
- ✅ 音频播放系统
- ✅ 图片缓存机制
- ✅ 数据导入导出

---

## English

### 📚 What is this?

**Austin English** is a unique personalized English review tool. Unlike traditional English learning apps, it provides **no pre-made content**. Instead, parents build a custom review content library based on their child's actual English courses.

🌐 **Live Demo**: [https://austin-english.vercel.app/](https://austin-english.vercel.app/)

### 🎯 Why is it different?

| Traditional English Apps | Austin English |
|--------------------------|----------------|
| ❌ Pre-made learning content | ✅ Parent-built custom content |
| ❌ One-size-fits-all content | ✅ Personalized review library |
| ❌ Cannot sync with existing courses | ✅ Works perfectly with any English course |
| ❌ Fixed learning progress | ✅ Follows child's actual learning pace |

### 🌟 Core Features

#### 🏗️ **Works with Any Course**
- Supports any English course (Shirley's lessons, Cambridge English, New Concept English, etc.)
- Parents add words and sentences based on course progress
- Perfectly synchronized with child's learning content

#### 👨‍👩‍👧‍👦 **Parent-Built Content**
- Zero pre-made content, fully customized by parents
- Add words and sentences based on course progress
- Flexible content management system

#### 🎨 **Personalized Review Experience**
- Say goodbye to one-size-fits-all learning content
- Each child has a unique review library
- Highly targeted and effective

### 📱 Functional Modules

#### 👨‍👩‍👧‍👦 Parent Management Center
- **Profile Management**: Create separate profiles for different children
- **Letter Configuration**: Select letters and phonetics to learn
- **Word Management**: Add important words from courses
- **Sentence Management**: Input key sentences from courses
- **Data Sync**: Import/export support for multi-device usage

#### 👶 Child Learning Interface
- **Letter Review**: Large font display with standard pronunciation and auto audio
- **Word Practice**: Picture-based learning with smart image matching and voice reading
- **Sentence Reading**: Complete sentence practice with audio playback and image assistance
- **Fun Game**: Picture selection game for edutainment and word memory reinforcement
- **Random Mode**: Shuffle order for added fun
- **Smart Navigation**: Left/right arrows and dot navigation with auto audio playback
- **Progress Tracking**: Real-time learning progress display

### 🛠️ Tech Stack

#### 🏗️ Frontend Framework
- **Next.js** (latest) - React full-stack framework with SSR/SSG support
- **React** (latest) - User interface building library
- **TypeScript** (latest) - Static type checking for better code quality

#### 🎨 UI & Styling
- **Tailwind CSS** (^3.3.0) - Utility-first CSS framework
- **PostCSS** (^8.4.31) - CSS post-processing tool
- **Autoprefixer** (^10.4.14) - Automatically add CSS browser prefixes

#### 🔧 Development Tools
- **ESLint** (9.28.0) - Code quality linting tool
- **ESLint Config Next** (15.3.3) - Official Next.js ESLint configuration

#### 📦 Functional Dependencies
- **@heroicons/react** (^2.1.1) - High-quality SVG icon library
- **dayjs** (^1.11.13) - Lightweight date processing library

#### 🔧 Development Dependencies
- **kill-port** (^2.0.1) - Port management tool, auto-clear ports during development

#### 🌐 External APIs
- **Unsplash API** - High-quality image resources
- **Web Speech API** - Native browser speech synthesis

### 🚀 Technical Features

- **🎵 Smart Audio System**: 26-letter standard pronunciation + speech synthesis + auto-play optimization
- **🖼️ Auto Image System**: Unsplash API + permanent local caching + fast SVG placeholders
- **🎮 Game Engine**: Modular game system with image preloading and audio synchronization
- **💾 Data Management**: LocalStorage + import/export functionality + real-time sync
- **📱 Responsive Design**: Support for mobile, tablet, and desktop with unified interaction
- **🔒 Type Safety**: Comprehensive TypeScript type definitions with zero type errors
- **⚡ Performance Optimization**: Next.js image optimization + client-side caching + hydration error fixes

### 🛠️ Quick Start

```bash
# Clone the project
git clone https://github.com/your-username/austin-english.git

# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:3000
```

### 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx           # Home - Profile selection
│   ├── parent/           # Parent management center
│   └── child/            # Child learning interface
│       ├── page.tsx      # Learning center homepage
│       └── game/         # Fun game module
│           ├── page.tsx  # Game main page
│           └── components/
│               └── GameLogic.ts # Game logic component
├── lib/
│   ├── profileManager.ts # Profile management
│   ├── i18n.ts          # Internationalization support
│   └── fileStorage.ts   # File storage management
└── types/               # TypeScript type definitions
    ├── index.ts         # Common type definitions
    └── profile.ts       # Profile-related types
```

### ⚠️ Unsplash API Configuration

The project uses Unsplash API for images, currently using the author's personal key (50 requests per hour limit).

For higher frequency usage:
1. Visit [Unsplash Developers](https://unsplash.com/developers) to apply for an API key
2. Replace `UNSPLASH_ACCESS_KEY` in `src/app/child/page.tsx`

### 🎯 Usage Scenarios

**Scenario 1: Complementing Shirley's English Course**
- Child studies Shirley's English course
- Parents add words and sentences from the course to Austin English
- Child uses the app for targeted review

**Scenario 2: Complementing School Textbooks**
- Child studies Cambridge English textbooks at school
- Parents build review library based on each unit's content
- Practice at home for reinforcement

**Scenario 3: Fun Game Reinforcement**
- After completing word learning
- Use picture selection games for fun review
- Reinforce word memory through games, making learning enjoyable

### 📝 Changelog

**v0.2 (2025.6.19)**
- 🎮 **New Fun Game Module**: Picture selection game for edutainment
- 🎵 **Comprehensive Audio Optimization**:
  - Auto-play first audio when entering review pages
  - Auto-play audio for left/right arrow navigation
  - Auto-play audio for dot navigation
  - Game module audio preloading and optimization
- 🖼️ **Image System Enhancement**:
  - Fast SVG placeholders, no network requests needed
  - Image preloading mechanism for better UX
  - Permanent caching system to avoid repeated loading
- 🎨 **UI/UX Improvements**:
  - Unified header design style
  - Optimized button click areas and interaction feedback
  - Simplified loading pages, reduced multilingual switching issues
- 🔧 **Technical Optimizations**:
  - Cleaned up all debug code
  - Fixed TypeScript type errors
  - Resolved Next.js hydration errors
  - Code modularization and performance optimization

**v0.1 (2025.6.18)**
- ✅ Core functionality completed
- ✅ Chinese and English interface support
- ✅ Audio playback system
- ✅ Image caching mechanism
- ✅ Data import/export

---

## 🤝 Contributing

Welcome to submit Issues and Pull Requests to improve this project.

## 📄 License

MIT License

---

**Austin English** - Making English review personalized and effective! 

让英语复习个性化且高效！🌟 