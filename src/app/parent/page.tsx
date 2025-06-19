'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Letter, Word, Sentence, Profile } from '../../types/profile';
import { getCurrentProfileId, getProfile, saveProfile } from '../../lib/profileManager';
import { getCurrentLanguage, getParentTexts } from '../../lib/i18n';

import { SunIcon, MoonIcon, PencilIcon, ArrowLeftIcon, UserIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import dayjs from 'dayjs';

// 字母发音数据
const letterPronunciations: Record<string, string[]> = {
  'A': ['/æ/', '/eɪ/', '/ɑː/'],
  'B': ['/b/'],
  'C': ['/k/', '/s/'],
  'D': ['/d/'],
  'E': ['/e/', '/iː/'],
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

// 排序类型 - 将在组件内部根据语言动态生成

export default function ParentPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newSentence, setNewSentence] = useState('');
  const [selectedPronunciations, setSelectedPronunciations] = useState<Record<string, string[]>>({});
  const [sortType, setSortType] = useState('date_desc');
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [sentenceSortType, setSentenceSortType] = useState('date_desc');
  const sentenceDragItem = useRef<number | null>(null);
  const sentenceDragOverItem = useRef<number | null>(null);
  const [editWord, setEditWord] = useState<{ id: string; text: string } | null>(null);
  const [editSentence, setEditSentence] = useState<{ id: string; text: string } | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  // 获取当前语言的文本
  const t = getParentTexts(language);

  // 动态生成排序类型选项
  const getSortTypes = () => [
    { label: language === 'zh' ? '手动排序' : 'Manual Sort', value: 'manual' },
    { label: language === 'zh' ? '按首字母排序 (A-Z)' : 'Sort by Letter (A-Z)', value: 'alpha_asc' },
    { label: language === 'zh' ? '按首字母排序 (Z-A)' : 'Sort by Letter (Z-A)', value: 'alpha_desc' },
    { label: language === 'zh' ? '按日期排序 (旧→新)' : 'Sort by Date (Old→New)', value: 'date_asc' },
    { label: language === 'zh' ? '按日期排序 (新→旧)' : 'Sort by Date (New→Old)', value: 'date_desc' },
          { label: language === 'zh' ? '按熟练程度排序 (低→高)' : 'Sort by Proficiency (Low→High)', value: 'star_asc' },
      { label: language === 'zh' ? '按熟练程度排序 (高→低)' : 'Sort by Proficiency (High→Low)', value: 'star_desc' },
  ];

  // 加载档案数据的函数
  const loadProfileData = useCallback(() => {
    // 初始化字母数据
    const initialLetters: Letter[] = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((char) => ({
      id: char,
      uppercase: char,
      lowercase: char.toLowerCase(),
      pronunciations: letterPronunciations[char] || [],
      isVisible: false,
    }));

    try {
      // 从档案系统加载数据
      const currentProfileId = getCurrentProfileId();
      if (currentProfileId) {
        const profile = getProfile(currentProfileId);
        
        if (profile) {
          // 确保数据结构完整
          const profileData = profile.data || {
            letters: [],
            words: [],
            sentences: [],
            selectedPronunciations: {}
          };
          
          // 完全使用加载的数据，确保数据同步，但更新发音数据以反映最新配置
          let loadedLetters = profileData.letters && profileData.letters.length > 0 ? profileData.letters : initialLetters;
          
          // 强制更新字母的发音数据，确保使用最新的letterPronunciations配置
          loadedLetters = loadedLetters.map(letter => ({
            ...letter,
            pronunciations: letterPronunciations[letter.id] || []
          }));
          const loadedWords = profileData.words || [];
          const loadedSentences = profileData.sentences || [];
          
          // 清理selectedPronunciations中无效的音标选择
          const loadedPronunciations = profileData.selectedPronunciations || {};
          const cleanedPronunciations: Record<string, string[]> = {};
          
          Object.keys(loadedPronunciations).forEach(letterId => {
            const validPronunciations = letterPronunciations[letterId] || [];
            const filteredPronunciations = loadedPronunciations[letterId].filter(
              pronunciation => validPronunciations.includes(pronunciation)
            );
            if (filteredPronunciations.length > 0) {
              cleanedPronunciations[letterId] = filteredPronunciations;
            }
          });
          
          // 批量更新所有状态，避免部分更新导致的不一致
          setLetters(loadedLetters);
          setWords(loadedWords);
          setSentences(loadedSentences);
          setSelectedPronunciations(cleanedPronunciations);
          setCurrentProfile(profile);
        } else {
          // 档案不存在，重定向到首页
          window.location.href = '/';
        }
      } else {
        // 没有选择档案，重定向到首页
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      // 出错时也重定向到首页
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    // 加载语言设置
    const currentLang = getCurrentLanguage();
    setLanguage(currentLang);
    
    // 初始加载档案数据
    loadProfileData();

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
          loadProfileData();
        }
      }
    }, 1000); // 每秒检查一次

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileDataChanged', handleCustomStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    // 自动保存到档案系统
    if (currentProfile && currentProfile.data) {
      // 检查数据是否真的发生了变化，避免无限循环
      const currentData = currentProfile.data;
      const hasChanges = 
        JSON.stringify(currentData.letters) !== JSON.stringify(letters) ||
        JSON.stringify(currentData.words) !== JSON.stringify(words) ||
        JSON.stringify(currentData.sentences) !== JSON.stringify(sentences) ||
        JSON.stringify(currentData.selectedPronunciations) !== JSON.stringify(selectedPronunciations);
      
      if (hasChanges) {
        const updatedProfile = {
          ...currentProfile,
          data: {
            letters,
            words,
            sentences,
            selectedPronunciations,
          },
        };
        saveProfile(updatedProfile);
        setCurrentProfile(updatedProfile);
        
        // 通知其他页面数据已更新
        window.dispatchEvent(new CustomEvent('profileDataChanged'));
      }
    }
  }, [letters, words, sentences, selectedPronunciations, currentProfile]);

  const toggleLetterVisibility = (letterId: string) => {
    const letter = letters.find(l => l.id === letterId);
    const newVisibility = !letter?.isVisible;
    
    setLetters(letters.map(letter => 
      letter.id === letterId ? { ...letter, isVisible: newVisibility } : letter
    ));

    // 如果取消选中字母，清除对应的音标选择
    if (!newVisibility) {
      setSelectedPronunciations(prev => {
        const updated = { ...prev };
        delete updated[letterId];
        return updated;
      });
    }
  };

  const togglePronunciation = (letterId: string, pronunciation: string) => {
    // 检查字母是否已选中
    const letter = letters.find(l => l.id === letterId);
    if (!letter?.isVisible) {
      // 如果字母未选中，先选中字母
      setLetters(letters.map(l => 
        l.id === letterId ? { ...l, isVisible: true } : l
      ));
    }

    setSelectedPronunciations(prev => {
      const current = prev[letterId] || [];
      const updated = current.includes(pronunciation)
        ? current.filter(p => p !== pronunciation)
        : [...current, pronunciation];
      return { ...prev, [letterId]: updated };
    });
  };

  const handleAddWord = () => {
    if (!newWord.trim()) return;
    
    const isDuplicate = words.some(word => 
      word.text.toLowerCase() === newWord.toLowerCase()
    );
    
    if (isDuplicate) {
      alert('这个单词已经添加过了！');
      return;
    }

    const newWordObj: Word = {
      id: Date.now().toString(),
      text: newWord.trim(),
      createdAt: new Date().toISOString(),
      star: 1,
    };
    
    setWords([...words, newWordObj]);
    setNewWord('');
  };

  const handleAddSentence = () => {
    if (!newSentence.trim()) return;
    
    const isDuplicate = sentences.some(sentence => 
      sentence.text.toLowerCase() === newSentence.toLowerCase()
    );
    
    if (isDuplicate) {
      alert('这个句子已经添加过了！');
      return;
    }

    const newSentenceObj: Sentence = {
      id: Date.now().toString(),
      text: newSentence.trim(),
      createdAt: new Date().toISOString(),
      star: 1,
    };
    
    setSentences([...sentences, newSentenceObj]);
    setNewSentence('');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  // 删除单词
  const handleDeleteWord = (id: string) => {
    setWords(words.filter(word => word.id !== id));
  };

  // 拖拽排序
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };
  const handleDragEnd = () => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from === null || to === null || from === to) return;
    const updated = [...words];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setWords(updated);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // 自动排序
  const getSortedWords = () => {
    if (sortType === 'star_desc') {
      return [...words].sort((a, b) => (b.star || 0) - (a.star || 0));
    } else if (sortType === 'star_asc') {
      return [...words].sort((a, b) => (a.star || 0) - (b.star || 0));
    } else if (sortType === 'alpha_asc') {
      return [...words].sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortType === 'alpha_desc') {
      return [...words].sort((a, b) => b.text.localeCompare(a.text));
    } else if (sortType === 'date_asc') {
      return [...words].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortType === 'date_desc') {
      return [...words].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return words;
  };

  const handleSetWordStar = (id: string, star: number) => {
    setWords(words.map(word => word.id === id ? { ...word, star } : word));
  };

  // 句子删除
  const handleDeleteSentence = (id: string) => {
    setSentences(sentences.filter(sentence => sentence.id !== id));
  };

  // 句子拖拽排序
  const handleSentenceDragStart = (index: number) => {
    sentenceDragItem.current = index;
  };
  const handleSentenceDragEnter = (index: number) => {
    sentenceDragOverItem.current = index;
  };
  const handleSentenceDragEnd = () => {
    const from = sentenceDragItem.current;
    const to = sentenceDragOverItem.current;
    if (from === null || to === null || from === to) return;
    const updated = [...sentences];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setSentences(updated);
    sentenceDragItem.current = null;
    sentenceDragOverItem.current = null;
  };

          // 句子熟练程度
  const handleSetSentenceStar = (id: string, star: number) => {
    setSentences(sentences.map(sentence => sentence.id === id ? { ...sentence, star } : sentence));
  };

  // 句子自动排序
  const getSortedSentences = () => {
    if (sentenceSortType === 'star_desc') {
      return [...sentences].sort((a, b) => (b.star || 0) - (a.star || 0));
    } else if (sentenceSortType === 'star_asc') {
      return [...sentences].sort((a, b) => (a.star || 0) - (b.star || 0));
    } else if (sentenceSortType === 'alpha_asc') {
      return [...sentences].sort((a, b) => a.text.localeCompare(b.text));
    } else if (sentenceSortType === 'alpha_desc') {
      return [...sentences].sort((a, b) => b.text.localeCompare(a.text));
    } else if (sentenceSortType === 'date_asc') {
      return [...sentences].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sentenceSortType === 'date_desc') {
      return [...sentences].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return sentences;
  };

  const handleEditWord = (id: string, text: string) => {
    setEditWord({ id, text });
  };

  const handleSaveEditWord = () => {
    if (!editWord) return;
    setWords(words.map(word => 
      word.id === editWord.id ? { ...word, text: editWord.text } : word
    ));
    setEditWord(null);
  };

  const handleEditSentence = (id: string, text: string) => {
    setEditSentence({ id, text });
  };

  const handleSaveEditSentence = () => {
    if (!editSentence) return;
    setSentences(sentences.map(sentence => 
      sentence.id === editSentence.id ? { ...sentence, text: editSentence.text } : sentence
    ));
    setEditSentence(null);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-start mb-6 -mt-3">
            {/* 左侧：导航按钮和标题区域 */}
            <div className="flex items-start gap-4" style={{ marginLeft: 'clamp(-96px, -5vw, 0px)' }}>
              {/* 导航按钮 */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => window.location.href = '/'}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
                  title={t.backToHome}
                >
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => window.location.href = '/child'}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
                  title={language === 'zh' ? '孩子页面' : 'Child Page'}
                >
                  <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
              {/* 标题区域 */}
              <div>
                <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-300 mb-1">
                  {t.title}
                </h1>
                {currentProfile && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t.profileName}: {currentProfile.name}
                  </p>
                )}
              </div>
            </div>
            
            {/* 日夜模式切换按钮 */}
            <div className="flex gap-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
              >
                {isDarkMode ? (
                  <SunIcon className="h-6 w-6 text-yellow-500" />
                ) : (
                  <MoonIcon className="h-6 w-6 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* 三栏布局容器 - 支持水平滚动 */}
          <div className="overflow-x-auto -mt-2">
            <div className="flex gap-4 lg:gap-8 min-w-[1060px] pb-4">
              {/* 字母列 */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 lg:p-6 rounded-xl min-h-[600px] max-h-[800px] flex flex-col w-[280px] lg:w-[320px] flex-shrink-0">
              <h2 className="text-xl font-semibold mb-4 text-primary-600 dark:text-primary-300">
                {t.letterConfig}
              </h2>
              <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                {letters.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    {t.loading}
                  </div>
                )}
                {letters.map((letter) => (
                  <div key={letter.id} className="flex items-center gap-2 lg:gap-3">
                    <button
                      onClick={() => toggleLetterVisibility(letter.id)}
                      className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-colors text-sm lg:text-base ${
                        letter.isVisible
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span className="font-bold">{letter.uppercase}</span>
                      <span>{letter.lowercase}</span>
                    </button>
                    <div className="flex gap-1 flex-wrap">
                      {letter.pronunciations.map((pronunciation) => (
                        <button
                          key={pronunciation}
                          onClick={() => letter.isVisible && togglePronunciation(letter.id, pronunciation)}
                          disabled={!letter.isVisible}
                          className={`px-2 py-1 rounded text-sm transition-colors ${
                            !letter.isVisible
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : (selectedPronunciations[letter.id] || []).includes(pronunciation)
                              ? 'bg-secondary-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500 cursor-pointer'
                          }`}
                        >
                          {pronunciation}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

              {/* 单词列 */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 lg:p-6 rounded-xl min-h-[600px] max-h-[800px] flex flex-col w-[320px] lg:w-[440px] flex-shrink-0">
              <h2 className="text-xl font-semibold mb-4 text-primary-600 dark:text-primary-300">
                {t.wordManagement}
              </h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddWord(); }}
                  placeholder={t.wordPlaceholder}
                  className="flex-1 p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleAddWord}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  {t.add}
                </button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500">{language === 'zh' ? '排序：' : 'Sort:'}</span>
                <select
                  value={sortType}
                  onChange={e => setSortType(e.target.value)}
                  className="p-1 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm text-gray-900 dark:text-white"
                >
                  {getSortTypes().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                {getSortedWords().map((word, idx) => (
                  <div
                    key={word.id}
                    className={`p-2 bg-white dark:bg-gray-700 rounded-lg flex justify-between items-center${sortType === 'manual' ? ' cursor-move' : ''}`}
                    draggable={sortType === 'manual'}
                    onDragStart={() => handleDragStart(idx)}
                    onDragEnter={() => handleDragEnter(idx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => sortType === 'manual' && e.preventDefault()}
                  >
                    <span className="text-gray-900 dark:text-white flex-1">{word.text}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="flex items-center">
                        {[1,2,3,4,5].map(n => (
                          <StarSolid
                            key={n}
                            className={`h-5 w-5 cursor-pointer ${n <= (word.star || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                            onClick={() => handleSetWordStar(word.id, n)}
                            title={language === 'zh' ? `熟练程度：${n}星` : `Proficiency: ${n} star${n > 1 ? 's' : ''}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 w-16 text-center">
                        {dayjs(word.createdAt).format('YY/MM/DD')}
                      </span>
                      <button
                        onClick={() => handleEditWord(word.id, word.text)}
                        className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        title={t.edit}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWord(word.id)}
                        className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        title={t.delete}
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

              {/* 句子列 */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 lg:p-6 rounded-xl min-h-[600px] max-h-[800px] flex flex-col w-[400px] lg:w-[500px] flex-shrink-0">
              <h2 className="text-xl font-semibold mb-4 text-primary-600 dark:text-primary-300">
                {t.sentenceManagement}
              </h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSentence}
                  onChange={(e) => setNewSentence(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSentence(); }}
                  placeholder={t.sentencePlaceholder}
                  className="flex-1 p-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleAddSentence}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  {t.add}
                </button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-500">{language === 'zh' ? '排序：' : 'Sort:'}</span>
                <select
                  value={sentenceSortType}
                  onChange={e => setSentenceSortType(e.target.value)}
                  className="p-1 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm text-gray-900 dark:text-white"
                >
                  {getSortTypes().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                {getSortedSentences().map((sentence, idx) => (
                  <div
                    key={sentence.id}
                    className={`p-2 bg-white dark:bg-gray-700 rounded-lg flex justify-between items-center${sentenceSortType === 'manual' ? ' cursor-move' : ''}`}
                    draggable={sentenceSortType === 'manual'}
                    onDragStart={() => handleSentenceDragStart(idx)}
                    onDragEnter={() => handleSentenceDragEnter(idx)}
                    onDragEnd={handleSentenceDragEnd}
                    onDragOver={e => sentenceSortType === 'manual' && e.preventDefault()}
                  >
                    <span className="text-gray-900 dark:text-white break-words max-w-[250px] lg:max-w-[350px]">{sentence.text}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center">
                        {[1,2,3,4,5].map(n => (
                          <StarSolid
                            key={n}
                            className={`h-5 w-5 cursor-pointer ${n <= (sentence.star || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                            onClick={() => handleSetSentenceStar(sentence.id, n)}
                            title={language === 'zh' ? `熟练程度：${n}星` : `Proficiency: ${n} star${n > 1 ? 's' : ''}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 w-16 text-center">
                        {dayjs(sentence.createdAt).format('YY/MM/DD')}
                      </span>
                      <button
                        onClick={() => handleEditSentence(sentence.id, sentence.text)}
                        className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                        title={t.edit}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSentence(sentence.id)}
                        className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        title={t.delete}
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {editWord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t.editWord}</h3>
            <input
              type="text"
              value={editWord.text}
              onChange={(e) => setEditWord({ ...editWord, text: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditWord(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveEditWord}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
      {editSentence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t.editSentence}</h3>
            <input
              type="text"
              value={editSentence.text}
              onChange={(e) => setEditSentence({ ...editSentence, text: e.target.value })}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditSentence(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveEditSentence}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 