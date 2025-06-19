'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  HomeIcon, 
  ArrowLeftIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { getProfile, getCurrentProfileId } from '../../../lib/profileManager';
import { getCurrentLanguage, getChildTexts } from '../../../lib/i18n';
import { Profile, Word } from '../../../types/profile';
import { 
  generateGameQuestion, 
  GameQuestion
} from './components/GameLogic';

export default function WordImageGamePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // 播放单词发音
  const playWordSound = (word?: string) => {
    const wordToPlay = word || currentQuestion?.targetWord.text;
    if (wordToPlay && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(wordToPlay);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [pendingFirstAudio, setPendingFirstAudio] = useState<string | null>(null);

  // 预加载音频函数
  const preloadAudio = (word: string) => {
    if ('speechSynthesis' in window) {
      // 初始化语音合成系统
      speechSynthesis.getVoices();
      // 保存待播放的单词
      setPendingFirstAudio(word);
    }
  };

  // 预加载图片函数
  const preloadImage = (imageUrl: string) => {
    if (imageUrl.startsWith('data:image/svg')) {
      // SVG占位符无需预加载
      return;
    }
    
    const img = document.createElement('img');
    img.src = imageUrl;
  };

  // 加载档案数据
  useEffect(() => {
    const loadProfile = async () => {
      const profileId = getCurrentProfileId();
      if (profileId) {
        const profileData = getProfile(profileId);
        if (profileData) {
          setProfile(profileData);
          // 只有当档案有单词时才开始游戏
          if (profileData.data.words && profileData.data.words.length >= 3) {
            await generateQuestion(profileData.data.words);
          }
        }
      }
      setIsLoading(false);
    };

    const loadTexts = () => {
      const lang = getCurrentLanguage();
      const childTexts = getChildTexts(lang);
      setTexts(childTexts);
    };

    loadProfile();
    loadTexts();
  }, []);

  // 监听第一次题目生成，当页面完全加载后立即播放预加载的音频
  useEffect(() => {
    if (currentQuestion && !isLoading && questionCount === 0 && isFirstLoad && pendingFirstAudio) {
      // 页面完全加载后立即播放预加载的音频
      playWordSound(pendingFirstAudio);
      setIsFirstLoad(false); // 标记第一次加载已完成
      setPendingFirstAudio(null); // 清除待播放音频
    }
  }, [currentQuestion, isLoading, questionCount, isFirstLoad, pendingFirstAudio]);



  // 生成游戏题目
  const generateQuestion = async (words: Word[]) => {
    if (words.length < 3) return;

    setIsLoading(true);
    
    try {
      // 过滤出未使用过的单词
      const availableWords = words.filter(word => !usedWords.has(word.id));
      
      // 如果所有单词都用过了，重置并重新开始
      if (availableWords.length < 1) {
        setUsedWords(new Set());
        setQuestionCount(0);
        setIsFirstLoad(true); // 重置时也要重新设置第一次加载标志
        const question = await generateGameQuestion(words, words);
        if (question) {
          // 预加载第一题音频
          preloadAudio(question.targetWord.text);
          // 预加载所有选项的图片
          question.options.forEach(option => {
            preloadImage(option.imageUrl);
          });
          setCurrentQuestion(question);
          setUsedWords(new Set([question.targetWord.id]));
        }
      } else {
        const question = await generateGameQuestion(availableWords, words);
        if (question) {
          if (isFirstLoad) {
            // 第一题预加载音频
            preloadAudio(question.targetWord.text);
          }
          // 预加载所有选项的图片
          question.options.forEach(option => {
            preloadImage(option.imageUrl);
          });
          setCurrentQuestion(question);
          setUsedWords(prev => new Set([...prev, question.targetWord.id]));
          // 非首次加载的题目在这里播放
          if (!isFirstLoad) {
            setTimeout(() => {
              playWordSound(question.targetWord.text);
            }, 100);
          }
        }
      }
    } catch {
      // 静默处理错误，避免影响用户体验
    }
    
    setIsLoading(false);
  };

  // 处理选项点击
  const handleOptionClick = (optionIndex: number) => {
    if (selectedOption !== null || !currentQuestion) return;

    setSelectedOption(optionIndex);
    const selected = currentQuestion.options[optionIndex];
    const correct = selected.isCorrect;
    
    setIsCorrect(correct);
    setShowResult(true);
    
    if (correct) {
      // 选择正确，快速进入下一题
      setTimeout(() => {
        nextQuestion();
      }, 600);
    } else {
      // 选择错误，1秒后重置状态让用户重新选择
      setTimeout(() => {
        setSelectedOption(null);
        setShowResult(false);
      }, 1000);
    }
  };

  // 进入下一题
  const nextQuestion = async () => {
    if (!profile?.data.words) return;
    
    setSelectedOption(null);
    setShowResult(false);
    setQuestionCount(questionCount + 1);
    
    await generateQuestion(profile.data.words);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 p-4">
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="text-8xl animate-bounce">🎮</div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !profile.data.words || profile.data.words.length < 3) {
    return (
      <div className="h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl p-16 shadow-2xl border-4 border-orange-200">
          <div className="text-9xl mb-8 animate-bounce">🤔</div>
          <h2 className="text-5xl font-bold text-orange-600 mb-6 font-kid-chinese">
            {texts.needMoreWords || '哎呀！还需要更多单词🤔'}
          </h2>
          <p className="text-gray-600 text-2xl mb-10 font-medium font-kid-chinese">
            {texts.addMoreWords || '让爸爸妈妈先添加至少3个单词吧🌟'}
          </p>
          <button
            onClick={() => window.location.href = '/child'}
            className="px-12 py-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl font-bold rounded-2xl hover:from-blue-600 hover:to-purple-600 transform hover:scale-110 transition-all duration-300 shadow-xl hover:shadow-2xl"
          >
            🔙 {texts.backToSelection || '返回选择'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* 头部导航 - 紧凑设计 */}
      <div className="flex justify-between items-center p-4 bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <button
          onClick={() => window.history.back()}
          className="p-3 rounded-2xl bg-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
          title={texts.backToSelection || '返回选择'}
        >
          <ArrowLeftIcon className="h-8 w-8 text-blue-500" />
        </button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-kid-chinese">
            🎮 {texts.funGame || '趣味游戏'}
          </h2>
          <p className="text-lg text-gray-700 font-medium">
            {texts.gameQuestion || '题目'} {questionCount + 1}
          </p>
        </div>

        <button
          onClick={() => window.location.href = '/'}
          className="p-3 rounded-2xl bg-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300"
          title={texts.backToHome || '返回首页'}
        >
          <HomeIcon className="h-8 w-8 text-green-500" />
        </button>
      </div>

      {/* 主要内容区域 - 支持滚动的布局 */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 min-h-[600px]">
        {currentQuestion ? (
          <div className="w-full h-full max-w-7xl flex flex-col items-center justify-center text-center">
            {/* 题目单词 */}
            <div className="mb-8">
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl inline-block">
                <div className="text-8xl font-bold font-comic text-gray-800">
                  {currentQuestion.targetWord.text}
                </div>
              </div>
              
              {/* 语音播放按钮 */}
              <div className="mt-6">
                <button
                  onClick={() => playWordSound()}
                  className="p-6 rounded-full bg-orange-100 hover:bg-orange-200 transition-all duration-300 transform hover:scale-110 shadow-xl hover:shadow-2xl border-4 border-orange-300"
                  title={texts.clickToPlay || '点击播放发音'}
                >
                  <SpeakerWaveIcon className="h-12 w-12 text-orange-600" />
                </button>
              </div>
            </div>

            {/* 图片选项 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 max-w-4xl mx-auto w-full">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(index)}
                  disabled={selectedOption !== null}
                  className={`relative w-full h-48 sm:h-64 lg:h-80 cursor-pointer transform transition-all duration-300 bg-white rounded-2xl shadow-xl hover:shadow-2xl overflow-hidden border-4 block ${
                    selectedOption === null 
                      ? 'border-blue-200 hover:border-blue-400 hover:scale-105 active:scale-95' 
                      : selectedOption === index
                        ? isCorrect 
                          ? 'border-green-400 scale-105 ring-4 ring-green-300' 
                          : 'border-red-400 scale-105 ring-4 ring-red-300'
                        : 'border-gray-200 opacity-50 scale-95'
                  }`}
                >
                  <Image
                    src={option.imageUrl}
                    alt={option.word.text}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // 使用快速SVG占位符作为fallback
                      target.src = `data:image/svg+xml;charset=UTF-8,%3csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='%23f1f5f9'/%3e%3ctext x='50%25' y='50%25' font-size='24' font-family='Arial' text-anchor='middle' dy='.3em' fill='%23475569'%3e${encodeURIComponent(option.word.text.toUpperCase())}%3c/text%3e%3c/svg%3e`;
                    }}
                  />
                  {showResult && selectedOption === index && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                      <div className={`text-8xl text-white ${isCorrect ? 'animate-bounce' : 'animate-wiggle'}`}>
                        {isCorrect ? '✓' : '✗'}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-8xl animate-bounce">🎮</div>
          </div>
        )}
      </div>
    </div>
  );
}