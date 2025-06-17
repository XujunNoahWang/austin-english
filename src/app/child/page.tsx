'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  HomeIcon, 
  SpeakerWaveIcon, 
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { getProfile, getCurrentProfileId, saveProfile } from '../../lib/profileManager';
import { getCurrentLanguage, getChildTexts } from '../../lib/i18n';
import { Profile, Letter, Word, Sentence } from '../../types/profile';

// 字母发音配置
const letterPronunciations: { [key: string]: string[] } = {
  'A': ['/eɪ/', '/æ/', '/ɑ/'],
  'B': ['/b/'],
  'C': ['/k/', '/s/'],
  'D': ['/d/'],
  'E': ['/iː/', '/e/'],
  'F': ['/f/'],
  'G': ['/g/', '/dʒ/'],
  'H': ['/h/'],
  'I': ['/ɪ/', '/aɪ/'],
  'J': ['/dʒ/'],
  'K': ['/k/'],
  'L': ['/l/'],
  'M': ['/m/'],
  'N': ['/n/'],
  'O': ['/ɒ/', '/oʊ/'],
  'P': ['/p/'],
  'Q': ['/k/'],
  'R': ['/r/'],
  'S': ['/s/'],
  'T': ['/t/'],
  'U': ['/ʌ/', '/juː/'],
  'V': ['/v/'],
  'W': ['/w/'],
  'X': ['/ks/'],
  'Y': ['/j/'],
  'Z': ['/z/']
};

type ReviewMode = 'selection' | 'letters' | 'words' | 'sentences';

// Unsplash API 配置
const UNSPLASH_ACCESS_KEY = '6AR8cex_BvRH-w1oUOnpE5pMn8NCNKjfNiSYat9t_kE';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

// 图片缓存管理 - 永久缓存
const IMAGE_CACHE_KEY = 'austin_english_image_cache_permanent';

interface ImageCache {
  [key: string]: string; // 单词 -> 图片URL的简单映射
}

// 获取缓存的图片
const getCachedImage = (word: string): string | null => {
  try {
    const cache = localStorage.getItem(IMAGE_CACHE_KEY);
    if (!cache) return null;
    
    const imageCache: ImageCache = JSON.parse(cache);
    return imageCache[word.toLowerCase()] || null;
  } catch (error) {
    console.error('Error reading image cache:', error);
    return null;
  }
};

// 保存图片到缓存
const cacheImage = (word: string, imageUrl: string) => {
  try {
    const cache = localStorage.getItem(IMAGE_CACHE_KEY);
    const imageCache: ImageCache = cache ? JSON.parse(cache) : {};
    
    imageCache[word.toLowerCase()] = imageUrl;
    
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(imageCache));
  } catch (error) {
    console.error('Error saving to image cache:', error);
    // 如果存储空间不足，提示用户
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded. Consider clearing browser data.');
    }
  }
};

// 获取单词图片的函数
const getWordImage = async (word: string): Promise<string> => {
  try {
    // 首先检查缓存
    const cachedImage = getCachedImage(word);
    
    if (cachedImage) {
      return cachedImage;
    }
    
    // 如果没有缓存，从API获取
    const response = await fetch(
      `${UNSPLASH_API_URL}?query=${encodeURIComponent(word)}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    
    if (!response.ok) {
      console.error(`Unsplash API error for word "${word}": ${response.status} ${response.statusText}`);
      if (response.status === 403) {
        console.warn('API rate limit exceeded, using placeholder image');
        const placeholderUrl = `https://via.placeholder.com/400x240/e2e8f0/64748b?text=${encodeURIComponent(word.toUpperCase())}`;
        // 即使是占位图也要缓存，避免重复请求
        cacheImage(word, placeholderUrl);
        return placeholderUrl;
      }
      throw new Error('Failed to fetch image');
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // 总是选择第一张图片，确保一致性
      const selectedImage = data.results[0].urls.small;
      
      // 永久缓存这张图片
      cacheImage(word, selectedImage);
      
      return selectedImage;
    } else {
      const placeholderUrl = `https://via.placeholder.com/400x240/e2e8f0/64748b?text=${encodeURIComponent(word.toUpperCase())}`;
      // 缓存占位图
      cacheImage(word, placeholderUrl);
      return placeholderUrl;
    }
  } catch (error) {
    console.error(`Error fetching image for word "${word}":`, error);
    const placeholderUrl = `https://via.placeholder.com/400x240/e2e8f0/64748b?text=${encodeURIComponent(word.toUpperCase())}`;
    // 缓存占位图
    cacheImage(word, placeholderUrl);
    return placeholderUrl;
  }
};

// 获取句子图片的函数 - 复用单词图片
const getSentenceImage = async (sentence: string, wordsInProfile: Word[]): Promise<string> => {
  try {
    // 首先检查句子中是否包含单词复习中的单词
    const foundWord = findWordInSentence(sentence, wordsInProfile);
    
    if (foundWord) {
      // 如果找到了单词复习中的单词，使用该单词的图片（与单词复习共享）
      return await getWordImage(foundWord.text);
    }
    
    // 如果没有找到单词复习中的单词，使用关键词搜索
    const keywords = extractKeywords(sentence);
    const searchQuery = keywords.join(' ');
    
    // 检查是否已经为这个查询缓存了图片
    const cachedImage = getCachedImage(searchQuery);
    
    if (cachedImage) {
      return cachedImage;
    }
    
    // 如果没有缓存，从API获取
    const response = await fetch(
      `${UNSPLASH_API_URL}?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    
    if (!response.ok) {
      console.error(`Unsplash API error: ${response.status} ${response.statusText}`);
      if (response.status === 403) {
        console.warn('API rate limit exceeded for sentence image, using placeholder');
        const placeholderUrl = `https://via.placeholder.com/400x240/e2e8f0/64748b?text=${encodeURIComponent('SENTENCE')}`;
        // 缓存占位图
        cacheImage(searchQuery, placeholderUrl);
        return placeholderUrl;
      }
      throw new Error('Failed to fetch image');
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // 选择第一张图片并永久缓存
      const selectedImage = data.results[0].urls.small;
      cacheImage(searchQuery, selectedImage);
      
      return selectedImage;
    } else {
      const placeholderUrl = `https://via.placeholder.com/400x240/e2e8f0/64748b?text=${encodeURIComponent('SENTENCE')}`;
      // 缓存占位图
      cacheImage(searchQuery, placeholderUrl);
      return placeholderUrl;
    }
  } catch (error) {
    console.error('Error fetching sentence image from Unsplash:', error);
    const placeholderUrl = `https://via.placeholder.com/400x240/e2e8f0/64748b?text=${encodeURIComponent('SENTENCE')}`;
    // 缓存占位图
    cacheImage('sentence_error', placeholderUrl);
    return placeholderUrl;
  }
};

// 在句子中查找单词复习中的单词
const findWordInSentence = (sentence: string, wordsInProfile: Word[]): Word | null => {
  // 将句子转换为小写并移除标点符号
  const cleanSentence = sentence.toLowerCase().replace(/[^\w\s]/g, '');
  const sentenceWords = cleanSentence.split(/\s+/);
  
  // 查找句子中是否包含单词复习中的任何单词
  for (const profileWord of wordsInProfile) {
    const wordText = profileWord.text.toLowerCase();
    
    // 检查完全匹配
    if (sentenceWords.includes(wordText)) {
      return profileWord;
    }
    
    // 检查复数形式（简单的s结尾）
    const pluralForm = wordText + 's';
    if (sentenceWords.includes(pluralForm)) {
      return profileWord;
    }
    
    // 检查过去式形式（简单的ed结尾）
    const pastForm = wordText + 'ed';
    if (sentenceWords.includes(pastForm)) {
      return profileWord;
    }
    
    // 检查进行时形式（简单的ing结尾）
    const ingForm = wordText + 'ing';
    if (sentenceWords.includes(ingForm)) {
      return profileWord;
    }
  }
  
  return null;
};

// 从句子中提取关键词的函数
const extractKeywords = (sentence: string): string[] => {
  // 移除标点符号并转换为小写
  const cleanSentence = sentence.toLowerCase().replace(/[^\w\s]/g, '');
  const words = cleanSentence.split(/\s+/);
  
  // 过滤掉常见的停用词
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'i', 'you', 'we', 'they', 'she', 'him',
    'her', 'his', 'my', 'your', 'our', 'their', 'this', 'that', 'these',
    'those', 'am', 'can', 'could', 'should', 'would', 'have', 'had', 'do',
    'does', 'did', 'get', 'got', 'go', 'went', 'come', 'came'
  ]);
  
  // 过滤停用词并取前3个关键词
  const keywords = words
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 3);
  
  // 如果没有关键词，使用原句子的前几个词
  if (keywords.length === 0) {
    return words.slice(0, 2);
  }
  
  return keywords;
};

export default function ChildPage() {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>('selection');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, setIsDarkMode] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [randomOrder, setRandomOrder] = useState<number[]>([]);
  const [wordImages, setWordImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [sentenceImages, setSentenceImages] = useState<Record<string, string>>({});
  const [loadingSentenceImages, setLoadingSentenceImages] = useState<Record<string, boolean>>({});
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  // 获取当前语言的文本
  const t = getChildTexts(language);

  // 加载档案数据的函数
  const loadProfileData = useCallback(() => {
    const profileId = getCurrentProfileId();
    if (profileId) {
      const profile = getProfile(profileId);
      if (profile) {
        // 清理selectedPronunciations中无效的音标选择
        const cleanedPronunciations: Record<string, string[]> = {};
        const originalPronunciations = profile.data.selectedPronunciations || {};
        
        Object.keys(originalPronunciations).forEach(letterId => {
          const validPronunciations = letterPronunciations[letterId] || [];
          const filteredPronunciations = originalPronunciations[letterId].filter(
            pronunciation => validPronunciations.includes(pronunciation)
          );
          if (filteredPronunciations.length > 0) {
            cleanedPronunciations[letterId] = filteredPronunciations;
          }
        });
        
        // 如果清理后的数据与原数据不同，更新档案
        if (JSON.stringify(cleanedPronunciations) !== JSON.stringify(originalPronunciations)) {
          const updatedProfile = {
            ...profile,
            data: {
              ...profile.data,
              selectedPronunciations: cleanedPronunciations
            }
          };
          saveProfile(updatedProfile);
          setCurrentProfile(updatedProfile);
        } else {
          setCurrentProfile(profile);
        }
      }
    }
  }, []);

  // 获取当前复习的数据
  const getCurrentData = useCallback(() => {
    if (!currentProfile) return [];
    
    switch (reviewMode) {
      case 'letters':
        return currentProfile.data.letters.filter(letter => letter.isVisible);
      case 'words':
        return currentProfile.data.words;
      case 'sentences':
        return currentProfile.data.sentences;
      default:
        return [];
    }
  }, [currentProfile, reviewMode]);

  const currentData = getCurrentData();
  
  // 生成随机顺序
  const generateRandomOrder = (length: number) => {
    const order = Array.from({ length }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  };

  // 获取当前项目（考虑随机模式）
  const getCurrentItem = () => {
    if (currentData.length === 0) return null;
    
    if (isRandomMode && randomOrder.length > 0) {
      const randomIndex = randomOrder[currentIndex];
      return currentData[randomIndex];
    }
    
    return currentData[currentIndex];
  };

  const currentItem = getCurrentItem();

  // 切换随机模式
  const toggleRandomMode = () => {
    const newRandomMode = !isRandomMode;
    setIsRandomMode(newRandomMode);
    
    if (newRandomMode) {
      // 开启随机模式，生成随机顺序
      const data = getCurrentData();
      const newRandomOrder = generateRandomOrder(data.length);
      setRandomOrder(newRandomOrder);
      setCurrentIndex(0); // 重置到第一项
    } else {
      // 关闭随机模式，清空随机顺序
      setRandomOrder([]);
      setCurrentIndex(0); // 重置到第一项
    }
  };

  useEffect(() => {
    // 加载语言设置
    const currentLang = getCurrentLanguage();
    setLanguage(currentLang);
    
    // 初始加载档案数据
    loadProfileData();

    // 加载主题设置
    const savedTheme = localStorage.getItem('theme');
    setIsDarkMode(savedTheme === 'dark');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // 监听localStorage变化，实现实时同步
    const handleStorageChange = (e: StorageEvent) => {
      // 如果是档案数据变化，重新加载
      if (e.key && e.key.startsWith('profile_')) {
        loadProfileData();
      }
    };

    // 监听同一页面内的localStorage变化（用于同一浏览器的不同标签页）
    window.addEventListener('storage', handleStorageChange);

    // 监听自定义事件（用于同一标签页内的不同页面）
    const handleCustomStorageChange = () => {
      loadProfileData();
    };

    window.addEventListener('profileDataChanged', handleCustomStorageChange);

    // 定期检查数据变化（作为备用机制）
    const intervalId = setInterval(() => {
      const currentProfileId = getCurrentProfileId();
      if (currentProfileId && currentProfile) {
        const latestProfile = getProfile(currentProfileId);
        if (latestProfile && latestProfile.lastModified !== currentProfile.lastModified) {
          setCurrentProfile(latestProfile);
        }
      }
    }, 1000); // 每秒检查一次

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileDataChanged', handleCustomStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  // 预加载单词图片
  const preloadWordImages = useCallback(async (words: Word[]) => {
    const newImages: Record<string, string> = {};
    const newLoadingStates: Record<string, boolean> = {};
    
    for (const word of words) {
      const wordText = word.text.toLowerCase();
      if (!wordImages[wordText]) {
        newLoadingStates[wordText] = true;
        setLoadingImages(prev => ({ ...prev, [wordText]: true }));
        
        try {
          const imageUrl = await getWordImage(wordText); // 获取单词图片
          newImages[wordText] = imageUrl;
        } catch (error) {
          console.error(`Failed to load image for word: ${wordText}`, error);
          newImages[wordText] = `https://via.placeholder.com/400x240/e2e8f0/64748b?text=${encodeURIComponent(wordText.toUpperCase())}`;
        }
        
        newLoadingStates[wordText] = false;
      }
    }
    
    if (Object.keys(newImages).length > 0) {
      setWordImages(prev => ({ ...prev, ...newImages }));
    }
    
    setLoadingImages(prev => {
      const updated = { ...prev };
      Object.keys(newLoadingStates).forEach(key => {
        updated[key] = newLoadingStates[key];
      });
      return updated;
    });
  }, [wordImages]);

  // 预加载句子图片
  const preloadSentenceImages = useCallback(async (sentences: Sentence[]) => {
    const newImages: Record<string, string> = {};
    const newLoadingStates: Record<string, boolean> = {};
    
    // 获取当前档案中的所有单词
    const wordsInProfile = currentProfile?.data.words || [];
    
    for (const sentence of sentences) {
      const sentenceId = sentence.id;
      if (!sentenceImages[sentenceId]) {
        newLoadingStates[sentenceId] = true;
        setLoadingSentenceImages(prev => ({ ...prev, [sentenceId]: true }));
        
        try {
          const imageUrl = await getSentenceImage(sentence.text, wordsInProfile);
          newImages[sentenceId] = imageUrl;
        } catch (error) {
          console.error(`Failed to load image for sentence: ${sentence.text}`, error);
          newImages[sentenceId] = `https://via.placeholder.com/400x240/e2e8f0/64748b?text=${encodeURIComponent('SENTENCE')}`;
        }
        
        newLoadingStates[sentenceId] = false;
      }
    }
    
    if (Object.keys(newImages).length > 0) {
      setSentenceImages(prev => ({ ...prev, ...newImages }));
    }
    
    setLoadingSentenceImages(prev => {
      const updated = { ...prev };
      Object.keys(newLoadingStates).forEach(key => {
        updated[key] = newLoadingStates[key];
      });
      return updated;
    });
  }, [sentenceImages, currentProfile]);

  // 当档案数据变化时，重置当前索引以避免越界
  useEffect(() => {
    const newData = getCurrentData();
    if (currentIndex >= newData.length && newData.length > 0) {
      setCurrentIndex(newData.length - 1);
    } else if (newData.length === 0) {
      setCurrentIndex(0);
    }
    
    // 如果是随机模式且数据长度变化，重新生成随机顺序
    if (isRandomMode && newData.length > 0 && randomOrder.length !== newData.length) {
      const newRandomOrder = generateRandomOrder(newData.length);
      setRandomOrder(newRandomOrder);
      setCurrentIndex(0);
    }
    
    // 如果是单词复习模式，预加载图片
    if (reviewMode === 'words' && newData.length > 0) {
      preloadWordImages(newData as Word[]);
    }
    
    // 如果是句子复习模式，预加载图片
    if (reviewMode === 'sentences' && newData.length > 0) {
      preloadSentenceImages(newData as Sentence[]);
    }
  }, [currentProfile, reviewMode, isRandomMode]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    const data = getCurrentData();
    if (currentIndex < data.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, getCurrentData]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (reviewMode === 'selection') return;
    
    if (event.key === 'ArrowLeft') {
      handlePrevious();
    } else if (event.key === 'ArrowRight') {
      handleNext();
    }
  }, [reviewMode, handlePrevious, handleNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const playLetterSound = (letter: Letter) => {
    if (typeof window !== 'undefined' && (window as typeof window & { letterAudioPlayer?: { playLetter: (letter: string, index?: number) => void } }).letterAudioPlayer) {
      (window as typeof window & { letterAudioPlayer: { playLetter: (letter: string, index?: number) => void } }).letterAudioPlayer.playLetter(letter.uppercase);
    } else {
      // 回退到原生语音合成
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(letter.uppercase);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      } else {
        alert('您的浏览器不支持语音播放功能');
      }
    }
  };

  const playPhonemeSound = (phoneme: string, letter?: string) => {
    if (typeof window !== 'undefined' && (window as typeof window & { letterAudioPlayer?: { playLetter: (letter: string, index?: number) => void } }).letterAudioPlayer && letter) {
      // 根据音标选择正确的发音索引
      let pronunciationIndex = 0; // 默认播放字母名称
      
      const lowerLetter = letter.toLowerCase();
      
      // 为不同字母设置特殊的音标映射
      switch (lowerLetter) {
        case 'a':
          if (phoneme === '/æ/') {
            pronunciationIndex = 1; // 播放 ae.mp3
          } else if (phoneme === '/ɑ/') {
            // ah.mp3 暂时缺失，回退到语音合成
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance('ah');
              utterance.lang = 'en-US';
              utterance.rate = 0.6;
              utterance.pitch = 1;
              speechSynthesis.speak(utterance);
            }
            return;
          }
          break;
        case 'b':
          if (phoneme === '/b/') {
            pronunciationIndex = 1; // 播放 b_sound.mp3
          }
          break;
        case 'c':
          if (phoneme === '/k/') {
            pronunciationIndex = 1; // 播放 k.mp3
          } else if (phoneme === '/s/') {
            pronunciationIndex = 2; // 播放 s.mp3
          }
          break;
        case 'd':
          if (phoneme === '/d/') {
            pronunciationIndex = 1; // 播放 d_sound.mp3
          }
          break;
        case 'e':
          if (phoneme === '/e/') {
            pronunciationIndex = 1; // 播放 e_short.mp3
          } else if (phoneme === '/iː/') {
            pronunciationIndex = 2; // 播放 e_long.mp3
          }
          break;
        case 'f':
          if (phoneme === '/f/') {
            pronunciationIndex = 1; // 播放 f_sound.mp3
          }
          break;
        case 'g':
          if (phoneme === '/g/') {
            pronunciationIndex = 1; // 播放 g_hard.mp3
          } else if (phoneme === '/dʒ/') {
            pronunciationIndex = 2; // 播放 g_soft.mp3
          }
          break;
        case 'h':
          if (phoneme === '/h/') {
            pronunciationIndex = 1; // 播放 h_sound.mp3
          }
          break;
        case 'i':
          // 字母i的特殊处理：根据实际可用的音频文件映射
          // 实际文件：i.mp3 (索引0), i_short.mp3 (索引1), i_long.mp3 (索引2，不存在)
          if (phoneme === '/ɪ/') {
            pronunciationIndex = 1; // 播放 i_short.mp3
          } else if (phoneme === '/aɪ/') {
            // i_long.mp3 不存在，直接使用语音合成
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance('ai');
              utterance.lang = 'en-US';
              utterance.rate = 0.6;
              utterance.pitch = 1;
              speechSynthesis.speak(utterance);
            }
            return;
          }
          break;
        case 'j':
          if (phoneme === '/dʒ/') {
            pronunciationIndex = 1; // 播放 dj.mp3
          }
          break;
        case 'k':
          if (phoneme === '/k/') {
            pronunciationIndex = 1; // 播放 k_sound.mp3
          }
          break;
        case 'l':
          if (phoneme === '/l/') {
            pronunciationIndex = 1; // 播放 l_sound.mp3
          }
          break;
        case 'm':
          if (phoneme === '/m/') {
            pronunciationIndex = 1; // 播放 m_sound.mp3
          }
          break;
      }
      

      (window as typeof window & { letterAudioPlayer: { playLetter: (letter: string, index?: number) => void } }).letterAudioPlayer.playLetter(letter, pronunciationIndex);
    } else {
      // 回退到原生语音合成
      if ('speechSynthesis' in window) {
        // 移除音标符号，只保留发音内容
        const cleanPhoneme = phoneme.replace(/[\\/\\[\\]]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanPhoneme);
        utterance.lang = 'en-US';
        utterance.rate = 0.6; // 音标播放稍慢一秒
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
      } else {
        alert('您的浏览器不支持语音播放功能');
      }
    }
  };

  const updateWordStar = (wordId: string, newStar: number) => {
    if (!currentProfile) return;
    
    const updatedProfile = {
      ...currentProfile,
      data: {
        ...currentProfile.data,
        words: currentProfile.data.words.map(word =>
          word.id === wordId ? { ...word, star: newStar } : word
        )
      }
    };

    setCurrentProfile(updatedProfile);
    saveProfile(updatedProfile);
    setForceUpdate(prev => prev + 1); // 强制重新渲染
    
    // 通知其他页面数据已更新
    window.dispatchEvent(new CustomEvent('profileDataChanged'));
  };

  const updateSentenceStar = (sentenceId: string, newStar: number) => {
    if (!currentProfile) return;
    
    const updatedProfile = {
      ...currentProfile,
      data: {
        ...currentProfile.data,
        sentences: currentProfile.data.sentences.map(sentence =>
          sentence.id === sentenceId ? { ...sentence, star: newStar } : sentence
        )
      }
    };

    setCurrentProfile(updatedProfile);
    saveProfile(updatedProfile);
    setForceUpdate(prev => prev + 1); // 强制重新渲染
    
    // 通知其他页面数据已更新
    window.dispatchEvent(new CustomEvent('profileDataChanged'));
  };

  const renderSelectionMode = () => (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 头部 - 儿童友好设计 */}
        <div className="flex justify-between items-center mb-12">
          {/* 左侧占位空间，与右侧按钮等宽 */}
          <div className="w-[72px] flex-shrink-0"></div>
          
          <div className="text-center flex-1">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-4 font-kid-chinese">
              🌟 {t.title} 🌟
            </h1>
            {currentProfile && (
              <p className="text-2xl text-gray-700 dark:text-gray-300 font-medium font-kid-chinese">
                {currentProfile.name} {language === 'zh' ? '小朋友，选择你想学习的内容吧' : ', choose what you want to learn!'}
              </p>
            )}
          </div>
          
          <button
            onClick={() => window.location.href = '/'}
            className="p-4 rounded-2xl bg-white shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 w-[72px] h-[72px] flex items-center justify-center flex-shrink-0"
            title={t.backToHome}
          >
            <HomeIcon className="h-10 w-10 text-green-500" />
          </button>
        </div>

        {/* 选择复习内容 - 更大更友好的卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* 字母复习 - 儿童友好设计 */}
          <div
            onClick={() => {
              setReviewMode('letters');
              setCurrentIndex(0);
            }}
            className="bg-white rounded-3xl p-12 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer border-4 border-blue-200 hover:border-blue-400 transform hover:scale-105 hover:-rotate-1"
          >
            <div className="text-center">
              <div className="text-9xl mb-6 animate-bounce">🔤</div>
              <h3 className="text-4xl font-bold text-blue-600 mb-4 font-kid-chinese">
                {t.letterReview}
              </h3>
              <p className="text-gray-600 text-xl mb-6 font-medium font-kid-chinese">
                {t.letterReviewDesc}
              </p>
              <div className="px-6 py-3 bg-blue-100 rounded-full text-xl font-bold text-blue-700 inline-block">
                {currentProfile ? 
                  `${currentProfile.data.letters.filter(l => l.isVisible).length} ${language === 'zh' ? '个字母' : 'letters'}` : 
                  t.loading
                }
              </div>
            </div>
          </div>

          {/* 单词复习 - 儿童友好设计 */}
          <div
            onClick={() => {
              setReviewMode('words');
              setCurrentIndex(0);
            }}
            className="bg-white rounded-3xl p-12 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer border-4 border-green-200 hover:border-green-400 transform hover:scale-105 hover:rotate-1"
          >
            <div className="text-center">
              <div className="text-9xl mb-6 animate-bounce">📚</div>
              <h3 className="text-4xl font-bold text-green-600 mb-4 font-kid-chinese">
                {t.wordPractice}
              </h3>
              <p className="text-gray-600 text-xl mb-6 font-medium font-kid-chinese">
                {t.wordPracticeDesc}
              </p>
              <div className="px-6 py-3 bg-green-100 rounded-full text-xl font-bold text-green-700 inline-block">
                {currentProfile ? 
                  `${currentProfile.data.words.length} ${language === 'zh' ? '个单词' : 'words'}` : 
                  t.loading
                }
              </div>
            </div>
          </div>

          {/* 句子复习 - 儿童友好设计 */}
          <div
            onClick={() => {
              setReviewMode('sentences');
              setCurrentIndex(0);
            }}
            className="bg-white rounded-3xl p-12 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer border-4 border-purple-200 hover:border-purple-400 transform hover:scale-105 hover:-rotate-1"
          >
            <div className="text-center">
              <div className="text-9xl mb-6 animate-bounce">💬</div>
              <h3 className="text-4xl font-bold text-purple-600 mb-4 font-kid-chinese">
                {t.sentenceReading}
              </h3>
              <p className="text-gray-600 text-xl mb-6 font-medium font-kid-chinese">
                {t.sentenceReadingDesc}
              </p>
              <div className="px-6 py-3 bg-purple-100 rounded-full text-xl font-bold text-purple-700 inline-block">
                {currentProfile ? 
                  `${currentProfile.data.sentences.length} ${language === 'zh' ? '个句子' : 'sentences'}` : 
                  t.loading
                }
              </div>
            </div>
          </div>
        </div>

        {/* 底部装饰 - 儿童友好元素 */}
        <div className="p-8 text-center">
          <div className="text-6xl space-x-8 mb-4">
            <span className="animate-bounce inline-block" style={{animationDelay: '0s'}}>🌟</span>
            <span className="animate-bounce inline-block" style={{animationDelay: '0.2s'}}>🌈</span>
            <span className="animate-bounce inline-block" style={{animationDelay: '0.4s'}}>🎈</span>
            <span className="animate-bounce inline-block" style={{animationDelay: '0.6s'}}>🎨</span>
            <span className="animate-bounce inline-block" style={{animationDelay: '0.8s'}}>🌟</span>
          </div>
          <div className="text-2xl text-gray-600 font-medium font-kid-chinese">
            {language === 'zh' ? '选择你最喜欢的学习内容吧🌟' : 'Choose your favorite learning content! 🌟'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReviewMode = () => {
    const data = getCurrentData();
    if (data.length === 0) {
      return (
        <div className="h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center bg-white rounded-3xl p-16 shadow-2xl border-4 border-orange-200">
            <div className="text-9xl mb-8 animate-bounce">🤔</div>
            <h2 className="text-5xl font-bold text-orange-600 mb-6 font-kid-chinese">
              {language === 'zh' ? '哎呀！这里还是空空如也🤔' : 'Oops! Nothing here yet! 🤔'}
            </h2>
            <p className="text-gray-600 text-2xl mb-10 font-medium font-kid-chinese">
              {language === 'zh' ? '让爸爸妈妈先添加一些学习内容吧🌟' : 'Ask your parents to add some learning content first! 🌟'}
            </p>
            <button
              onClick={() => setReviewMode('selection')}
              className="px-12 py-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl font-bold rounded-2xl hover:from-blue-600 hover:to-purple-600 transform hover:scale-110 transition-all duration-300 shadow-xl hover:shadow-2xl"
                          >
                🔙 {language === 'zh' ? '返回选择' : 'Back to Selection'}
              </button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex flex-col overflow-hidden">
        {/* 头部导航 - 紧凑设计 */}
        <div className="flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm shadow-lg">
          <button
            onClick={() => setReviewMode('selection')}
            className="p-3 rounded-2xl bg-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
            title={language === 'zh' ? '返回选择' : 'Back to Selection'}
          >
            <ArrowLeftIcon className="h-8 w-8 text-blue-500" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-kid-chinese">
              {reviewMode === 'letters' && `🔤 ${t.letterLearning}`}
              {reviewMode === 'words' && `📚 ${t.wordLearning}`}
              {reviewMode === 'sentences' && `💬 ${t.sentenceLearning}`}
            </h2>
            <p className="text-lg text-gray-700 font-medium">
              {currentIndex + 1} / {data.length}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleRandomMode}
              className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-all transform hover:scale-105 ${
                isRandomMode 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                  : 'bg-white text-gray-700 shadow-lg hover:shadow-xl'
              }`}
              title={isRandomMode ? (language === 'zh' ? '关闭随机模式' : 'Turn off random mode') : (language === 'zh' ? '开启随机模式' : 'Turn on random mode')}
            >
              <ArrowsRightLeftIcon className="h-4 w-4" />
              {isRandomMode ? '🎲' : '📋'}
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="p-3 rounded-2xl bg-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
              title={t.backToHome}
            >
              <HomeIcon className="h-8 w-8 text-green-500" />
            </button>
          </div>
        </div>

        {/* 主要内容区域 - 分栏布局，无滚动 */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
          <div className="w-full h-full max-w-7xl flex items-center justify-between">
            {/* 左侧导航按钮 */}
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-6 rounded-full bg-white shadow-2xl hover:shadow-3xl disabled:opacity-30 disabled:cursor-not-allowed transform hover:scale-110 transition-all duration-300 z-10"
            >
              <ArrowLeftIcon className="h-16 w-16 text-blue-500" />
            </button>

            {/* 中间内容区域 - 分为左右两栏 */}
            <div className="flex-1 mx-8 h-full flex items-center justify-center">
              <div 
                key={`${currentItem?.id || 'no-item'}-${forceUpdate}-${currentIndex}`}
                className="w-full h-full max-h-[700px] bg-white rounded-3xl shadow-3xl border-4 border-blue-200 flex overflow-hidden"
              >
                {/* 字母复习 */}
                {reviewMode === 'letters' && (
                  <div className="w-full flex items-center justify-center p-8">
                    <div className="text-center">
                      {/* 大写和小写字母 */}
                      <div className="text-8xl font-bold mb-8 flex justify-center items-center gap-8 font-kid">
                        <button
                          onClick={() => playLetterSound(currentItem as Letter)}
                          className="text-blue-500 hover:text-blue-600 transition-all duration-300 cursor-pointer hover:scale-125 transform bg-blue-50 rounded-3xl p-6 shadow-xl hover:shadow-2xl border-4 border-blue-200"
                          title="点击播放字母读音"
                        >
                          {(currentItem as Letter).uppercase}
                        </button>
                        <button
                          onClick={() => playLetterSound(currentItem as Letter)}
                          className="text-purple-500 hover:text-purple-600 transition-all duration-300 cursor-pointer hover:scale-125 transform bg-purple-50 rounded-3xl p-6 shadow-xl hover:shadow-2xl border-4 border-purple-200"
                          title="点击播放字母读音"
                        >
                          {(currentItem as Letter).lowercase}
                        </button>
                      </div>
                      
                      {/* 音标显示 */}
                      <div className="text-3xl mb-8 flex justify-center items-center gap-4 flex-wrap">
                        {currentProfile?.data.selectedPronunciations[(currentItem as Letter).id]?.length > 0 ? (
                          currentProfile.data.selectedPronunciations[(currentItem as Letter).id].map((phoneme, index) => (
                            <button
                              key={index}
                              onClick={() => playPhonemeSound(phoneme, (currentItem as Letter).uppercase)}
                              className="text-gray-700 hover:text-gray-900 transition-all duration-300 cursor-pointer hover:scale-125 transform px-4 py-3 rounded-2xl bg-yellow-100 hover:bg-yellow-200 shadow-lg hover:shadow-xl border-3 border-yellow-300 font-bold"
                              title={`点击播放音标发音: ${phoneme}`}
                            >
                              {phoneme}
                            </button>
                          ))
                        ) : (
                          <span className="text-gray-500 text-xl bg-gray-100 px-4 py-3 rounded-2xl">
                            🎵 暂无音标
                          </span>
                        )}
                      </div>
                      

                    </div>
                  </div>
                )}

                {/* 单词复习 - 左右分栏 */}
                {reviewMode === 'words' && currentItem && (
                  <>
                    {/* 左侧：图片区 - 更大尺寸，无动画 */}
                    <div className="w-1/2 flex items-center justify-center p-4">
                      {(() => {
                        const wordItem = currentItem as Word;
                        if (!wordItem || !wordItem.text) {
                          return (
                            <div className="w-full h-96 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center border-4 border-red-200 shadow-2xl">
                              <div className="text-center">
                                <div className="text-6xl mb-4">🤔</div>
                                <div className="text-gray-600 text-xl font-medium font-kid-chinese">
                                  单词数据错误
                                </div>
                              </div>
                            </div>
                          );
                        }

                        const word = wordItem.text.toLowerCase();
                        const imageUrl = wordImages[word];
                        const isLoading = loadingImages[word];
                        
                        if (isLoading) {
                          return (
                            <div className="w-full h-96 rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 shadow-2xl flex items-center justify-center border-4 border-blue-200">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
                                <div className="text-2xl font-bold text-gray-700 font-kid-chinese">
                                  🖼 加载图片...
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        if (imageUrl) {
                          return (
                            <div className="w-full h-96 rounded-3xl shadow-2xl overflow-hidden border-4 border-green-200">
                              <Image
                                src={imageUrl}
                                alt={word.toUpperCase()}
                                width={500}
                                height={400}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://via.placeholder.com/500x400/e2e8f0/64748b?text=${encodeURIComponent(word.toUpperCase())}`;
                                }}
                              />
                            </div>
                          );
                        }
                        
                        return (
                          <div className="w-full h-96 rounded-3xl bg-gradient-to-br from-green-100 to-blue-100 shadow-2xl flex items-center justify-center border-4 border-green-200">
                            <div className="text-center">
                              <div className="text-6xl mb-4">📷</div>
                              <div className="text-2xl font-bold text-gray-700">
                                {word.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* 右侧：文字和控制区域 */}
                    <div className="w-1/2 flex flex-col items-center justify-center p-6 space-y-6">
                      {/* 英文单词 */}
                      <div className="text-6xl font-bold text-green-600 font-kid text-center">
                        {(currentItem as Word).text || <span className="font-kid-chinese">未知单词</span>}
                      </div>
                      
                      {/* 语音播放按钮 */}
                      <button
                        onClick={() => {
                          const wordItem = currentItem as Word;
                          if (wordItem && wordItem.text && 'speechSynthesis' in window) {
                            const utterance = new SpeechSynthesisUtterance(wordItem.text);
                            utterance.lang = 'en-US';
                            utterance.rate = 0.8;
                            utterance.pitch = 1;
                            speechSynthesis.speak(utterance);
                          }
                        }}
                        className="p-6 rounded-full bg-green-100 hover:bg-green-200 transition-all duration-300 transform hover:scale-110 shadow-xl hover:shadow-2xl border-4 border-green-300"
                        title="点击播放发音"
                      >
                        <SpeakerWaveIcon className="h-12 w-12 text-green-600" />
                      </button>
                      

                      
                      {/* 星级评分 */}
                      <div className="flex justify-center gap-2">
                        {[1,2,3,4,5].map(n => (
                          <StarSolid
                            key={n}
                            className={`h-10 w-10 cursor-pointer transition-all duration-300 transform hover:scale-125 ${n <= ((currentItem as Word).star || 0) ? 'text-yellow-400 drop-shadow-lg' : 'text-gray-300 hover:text-yellow-200'}`}
                            onClick={() => updateWordStar((currentItem as Word).id, n)}
                            title={`熟练程度 ${n}星`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* 句子复习 - 左右分栏 */}
                {reviewMode === 'sentences' && currentItem && (
                  <>
                    {/* 左侧：图片区 - 更大尺寸，无动画 */}
                    <div className="w-1/2 flex items-center justify-center p-4">
                      {(() => {
                        const sentenceItem = currentItem as Sentence;
                        if (!sentenceItem || !sentenceItem.text) {
                          return (
                            <div className="w-full h-96 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center border-4 border-red-200 shadow-2xl">
                              <div className="text-center">
                                <div className="text-6xl mb-4">🤔</div>
                                <div className="text-gray-600 text-xl font-medium font-kid-chinese">
                                  句子数据错误
                                </div>
                              </div>
                            </div>
                          );
                        }

                        const sentenceId = sentenceItem.id;
                        const imageUrl = sentenceImages[sentenceId];
                        const isLoading = loadingSentenceImages[sentenceId];
                        
                        if (isLoading) {
                          return (
                            <div className="w-full h-96 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 shadow-2xl flex items-center justify-center border-4 border-purple-200">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto mb-6"></div>
                                <div className="text-2xl font-bold text-gray-700 font-kid-chinese">
                                  🖼 加载图片...
                                </div>
                              </div>
                            </div>
                          );
                        }
                        
                        if (imageUrl) {
                          return (
                            <div className="w-full h-96 rounded-3xl shadow-2xl overflow-hidden border-4 border-purple-200">
                              <Image
                                src={imageUrl}
                                alt="句子配图"
                                width={500}
                                height={400}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://via.placeholder.com/500x400/e2e8f0/64748b?text=${encodeURIComponent('SENTENCE')}`;
                                }}
                              />
                            </div>
                          );
                        }
                        
                        return (
                          <div className="w-full h-96 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 shadow-2xl flex items-center justify-center border-4 border-purple-200">
                            <div className="text-center">
                              <div className="text-6xl mb-4">📝</div>
                              <div className="text-2xl font-bold text-gray-700 font-kid-chinese">
                                句子配图
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* 右侧：文字和控制区域 */}
                    <div className="w-1/2 flex flex-col items-center justify-center p-6 space-y-6">
                      {/* 英文句子 */}
                      <div className="text-3xl font-bold text-purple-600 leading-relaxed font-kid text-center">
                        {(currentItem as Sentence).text}
                      </div>
                      
                      {/* 语音播放按钮 */}
                      <button
                        onClick={() => {
                          const sentenceItem = currentItem as Sentence;
                          if (sentenceItem && sentenceItem.text && 'speechSynthesis' in window) {
                            const utterance = new SpeechSynthesisUtterance(sentenceItem.text);
                            utterance.lang = 'en-US';
                            utterance.rate = 0.7;
                            utterance.pitch = 1;
                            speechSynthesis.speak(utterance);
                          }
                        }}
                        className="p-6 rounded-full bg-purple-100 hover:bg-purple-200 transition-all duration-300 transform hover:scale-110 shadow-xl hover:shadow-2xl border-4 border-purple-300"
                        title="点击播放发音"
                      >
                        <SpeakerWaveIcon className="h-12 w-12 text-purple-600" />
                      </button>
                      

                      
                      {/* 星级评分 */}
                      <div className="flex justify-center gap-2">
                        {[1,2,3,4,5].map(n => (
                          <StarSolid
                            key={n}
                            className={`h-10 w-10 cursor-pointer transition-all duration-300 transform hover:scale-125 ${n <= ((currentItem as Sentence).star || 0) ? 'text-yellow-400 drop-shadow-lg' : 'text-gray-300 hover:text-yellow-200'}`}
                            onClick={() => updateSentenceStar((currentItem as Sentence).id, n)}
                            title={`熟练程度 ${n}星`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 右侧导航按钮 */}
            <button
              onClick={handleNext}
              disabled={currentIndex === data.length - 1}
              className="p-6 rounded-full bg-white shadow-2xl hover:shadow-3xl disabled:opacity-30 disabled:cursor-not-allowed transform hover:scale-110 transition-all duration-300"
            >
              <ArrowRightIcon className="h-16 w-16 text-blue-500" />
            </button>
          </div>
        </div>

        {/* 底部进度指示 - 紧凑设计 */}
        <div className="p-4 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center space-x-3">
              {data.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-300 transform hover:scale-125 ${
                    index === currentIndex
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 scale-125 shadow-lg'
                      : 'bg-gray-300 hover:bg-gray-400 shadow-md'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-kid-chinese">
            档案加载中...
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 font-kid-chinese">
            请稍候，正在加载档案数据
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <span className="font-kid-chinese">返回首页</span>
          </button>
        </div>
      </div>
    );
  }

  return reviewMode === 'selection' ? renderSelectionMode() : renderReviewMode();
}
