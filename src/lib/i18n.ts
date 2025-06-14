// 国际化工具函数
export type Language = 'zh' | 'en';

// 获取当前语言设置
export function getCurrentLanguage(): Language {
  if (typeof window === 'undefined') return 'zh'; // 服务端默认中文
  
  const saved = localStorage.getItem('austin-english-language') as Language | null;
  return saved || 'zh';
}

// 设置语言
export function setLanguage(language: Language) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('austin-english-language', language);
  }
}

// 家长页面文本
export const parentTexts = {
  zh: {
    title: '家长管理中心',
    subtitle: '管理学习内容，设置学习进度',
    backToHome: '返回首页',
    letterConfig: '字母配置',
    letterConfigDesc: '选择要学习的字母，设置显示顺序',
    wordManagement: '单词管理',
    wordManagementDesc: '添加、编辑和管理学习单词',
    sentenceManagement: '句子管理',
    sentenceManagementDesc: '添加、编辑和管理学习句子',
    profileName: '当前档案',
    save: '保存',
    cancel: '取消',
    add: '添加',
    edit: '编辑',
    delete: '删除',
    confirm: '确认',
    loading: '加载中...',
    saved: '保存成功',
    error: '操作失败',
    deleteConfirm: '确定要删除吗？',
    // 字母相关
    selectAll: '全选',
    deselectAll: '全不选',
    resetOrder: '重置顺序',
    letterOrder: '字母顺序',
    dragToReorder: '拖拽调整顺序',
    // 单词相关
    addWord: '添加单词',
    editWord: '编辑单词',
    wordText: '单词',
    wordImage: '图片',
    uploadImage: '上传图片',
    removeImage: '移除图片',
    wordPlaceholder: '输入单词',
    // 句子相关
    addSentence: '添加句子',
    editSentence: '编辑句子',
    sentenceText: '句子',
    sentencePlaceholder: '输入句子'
  },
  en: {
    title: 'Parent Management Center',
    subtitle: 'Manage learning content and set learning progress',
    backToHome: 'Back to Home',
    letterConfig: 'Letter Configuration',
    letterConfigDesc: 'Select letters to learn and set display order',
    wordManagement: 'Word Management',
    wordManagementDesc: 'Add, edit and manage learning words',
    sentenceManagement: 'Sentence Management',
    sentenceManagementDesc: 'Add, edit and manage learning sentences',
    profileName: 'Current Profile',
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    loading: 'Loading...',
    saved: 'Saved successfully',
    error: 'Operation failed',
    deleteConfirm: 'Are you sure you want to delete?',
    // Letter related
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    resetOrder: 'Reset Order',
    letterOrder: 'Letter Order',
    dragToReorder: 'Drag to reorder',
    // Word related
    addWord: 'Add Word',
    editWord: 'Edit Word',
    wordText: 'Word',
    wordImage: 'Image',
    uploadImage: 'Upload Image',
    removeImage: 'Remove Image',
    wordPlaceholder: 'Enter word',
    // Sentence related
    addSentence: 'Add Sentence',
    editSentence: 'Edit Sentence',
    sentenceText: 'Sentence',
    sentencePlaceholder: 'Enter sentence'
  }
};

// 孩子页面文本
export const childTexts = {
  zh: {
    title: '学习中心',
    subtitle: '开始你的英语学习之旅',
    backToHome: '返回首页',
    profileName: '当前档案',
    selectMode: '选择学习模式',
    letterReview: '字母复习',
    letterReviewDesc: '学习和复习字母',
    wordPractice: '单词练习',
    wordPracticeDesc: '练习单词发音和拼写',
    sentenceReading: '句子阅读',
    sentenceReadingDesc: '阅读和理解句子',
    startLearning: '开始学习',
    continue: '继续',
    next: '下一个',
    previous: '上一个',
    finish: '完成',
    loading: '加载中...',
    excellent: '太棒了！',
    good: '很好！',
    tryAgain: '再试一次',
    // 字母学习
    letterLearning: '字母学习',
    currentLetter: '当前字母',
    pronunciation: '发音',
    // 单词学习
    wordLearning: '单词学习',
    currentWord: '当前单词',
    spelling: '拼写',
    // 句子学习
    sentenceLearning: '句子学习',
    currentSentence: '当前句子',
    reading: '阅读'
  },
  en: {
    title: 'Learning Center',
    subtitle: 'Start your English learning journey',
    backToHome: 'Back to Home',
    profileName: 'Current Profile',
    selectMode: 'Select Learning Mode',
    letterReview: 'Letter Review',
    letterReviewDesc: 'Learn and review letters',
    wordPractice: 'Word Practice',
    wordPracticeDesc: 'Practice word pronunciation and spelling',
    sentenceReading: 'Sentence Reading',
    sentenceReadingDesc: 'Read and understand sentences',
    startLearning: 'Start Learning',
    continue: 'Continue',
    next: 'Next',
    previous: 'Previous',
    finish: 'Finish',
    loading: 'Loading...',
    excellent: 'Excellent!',
    good: 'Good!',
    tryAgain: 'Try Again',
    // Letter learning
    letterLearning: 'Letter Learning',
    currentLetter: 'Current Letter',
    pronunciation: 'Pronunciation',
    // Word learning
    wordLearning: 'Word Learning',
    currentWord: 'Current Word',
    spelling: 'Spelling',
    // Sentence learning
    sentenceLearning: 'Sentence Learning',
    currentSentence: 'Current Sentence',
    reading: 'Reading'
  }
};

// 获取文本的工具函数
export function getParentTexts(language?: Language) {
  const lang = language || getCurrentLanguage();
  return parentTexts[lang];
}

export function getChildTexts(language?: Language) {
  const lang = language || getCurrentLanguage();
  return childTexts[lang];
} 