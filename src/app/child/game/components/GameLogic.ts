import { Word } from '../../../../types/profile';

// 图片缓存管理
const IMAGE_CACHE_KEY = 'austin_english_image_cache_permanent';

// Unsplash API 配置
const UNSPLASH_ACCESS_KEY = '6AR8cex_BvRH-w1oUOnpE5pMn8NCNKjfNiSYat9t_kE';
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

// 快速占位符生成
const getQuickPlaceholder = (word: string, color: string = 'e2e8f0'): string => {
  return `data:image/svg+xml;charset=UTF-8,%3csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='%23${color}'/%3e%3ctext x='50%25' y='50%25' font-size='24' font-family='Arial' text-anchor='middle' dy='.3em' fill='%23666'%3e${encodeURIComponent(word.toUpperCase())}%3c/text%3e%3c/svg%3e`;
};

interface ImageCache {
  [key: string]: string;
}

// 获取缓存的图片
export const getCachedImage = (word: string): string | null => {
  try {
    const cache = localStorage.getItem(IMAGE_CACHE_KEY);
    if (!cache) return null;
    
    const imageCache: ImageCache = JSON.parse(cache);
    return imageCache[word.toLowerCase()] || null;
      } catch {
      return null;
    }
};

// 保存图片到缓存
export const cacheImage = (word: string, imageUrl: string) => {
  try {
    const cache = localStorage.getItem(IMAGE_CACHE_KEY);
    const imageCache: ImageCache = cache ? JSON.parse(cache) : {};
    
    imageCache[word.toLowerCase()] = imageUrl;
    
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(imageCache));
      } catch {
      // 静默处理缓存保存错误
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
        const placeholderUrl = getQuickPlaceholder(word);
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
      const placeholderUrl = getQuickPlaceholder(word);
      // 缓存占位图
      cacheImage(word, placeholderUrl);
      return placeholderUrl;
    }
  } catch (error) {
    console.error(`Error fetching image for word "${word}":`, error);
    const placeholderUrl = getQuickPlaceholder(word);
    // 缓存占位图
    cacheImage(word, placeholderUrl);
    return placeholderUrl;
  }
};



// 随机打乱数组
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 生成游戏题目
export interface GameOption {
  word: Word;
  imageUrl: string;
  isCorrect: boolean;
}

export interface GameQuestion {
  targetWord: Word;
  options: GameOption[];
}

export const generateGameQuestion = async (words: Word[], allWords?: Word[]): Promise<GameQuestion | null> => {
  if (words.length < 1) return null;

  // 随机选择一个目标单词
  const targetWord = words[Math.floor(Math.random() * words.length)];
  
  // 为错误选项选择单词 - 可以从所有单词中选择（包括已用过的）
  const wordPoolForWrongOptions = allWords && allWords.length >= 3 ? allWords : words;
  const otherWords = wordPoolForWrongOptions.filter(w => w.id !== targetWord.id);
  const shuffledOthers = shuffleArray(otherWords);
  const wrongOptions = shuffledOthers.slice(0, 2);
  
  // 如果仍然没有足够的其他单词，重复使用（但确保不同的ID）
  while (wrongOptions.length < 2 && otherWords.length > 0) {
    const randomWord = otherWords[Math.floor(Math.random() * otherWords.length)];
    if (!wrongOptions.find(w => w.id === randomWord.id)) {
      wrongOptions.push(randomWord);
    }
  }

  try {
    // 异步获取所有图片
    const targetImageUrl = await getWordImage(targetWord.text);
    const wrongImages = await Promise.all(
      wrongOptions.map(word => getWordImage(word.text))
    );

    // 创建选项数组
    const options: GameOption[] = [
      { word: targetWord, imageUrl: targetImageUrl, isCorrect: true },
      ...wrongOptions.map((word, index) => ({
        word,
        imageUrl: wrongImages[index],
        isCorrect: false
      }))
    ];

    // 随机打乱选项顺序
    const shuffledOptions = shuffleArray(options);

    return {
      targetWord,
      options: shuffledOptions
    };
  } catch {
    return null;
  }
};

