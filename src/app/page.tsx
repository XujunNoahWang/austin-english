'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ProfileSummary, Profile } from '../types/profile';
import { 
  getProfileSummaries, 
  createProfile, 
  saveProfile, 
  deleteProfile, 
  setCurrentProfileId,
  importProfile,
  getProfile,
  ensureDefaultProfile,
} from '../lib/profileManager';
import { PlusIcon, TrashIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';

export default function Home() {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh'); // 默认中文

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 加载语言偏好
    const savedLanguage = localStorage.getItem('austin-english-language') as 'zh' | 'en' | null;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    
    loadProfiles();
  }, []);

  const handleLanguageChange = (newLanguage: 'zh' | 'en') => {
    setLanguage(newLanguage);
    localStorage.setItem('austin-english-language', newLanguage);
  };

  const loadProfiles = () => {
    setIsLoading(true);
    
    // 确保有默认档案
    ensureDefaultProfile();
    
    const profileList = getProfileSummaries();
    setProfiles(profileList);
    
    // 永远默认选中第一个档案
    if (profileList.length > 0) {
      // 按创建时间排序，选择第一个（最早创建的）
      const sortedProfiles = [...profileList].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const firstProfile = sortedProfiles[0];
      setSelectedProfile(firstProfile.id);
      setCurrentProfileId(firstProfile.id);
    }
    
    setIsLoading(false);
  };

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    
    const profile = createProfile(newProfileName.trim());
    
    // 保存新档案
    const saved = saveProfile(profile);
    if (saved) {
      setProfiles([...profiles, {
        id: profile.id,
        name: profile.name,
        createdAt: profile.createdAt,
        lastModified: profile.lastModified,
        letterCount: profile.data.letters?.filter(l => l.isVisible).length || 0,
        wordCount: profile.data.words?.length || 0,
        sentenceCount: profile.data.sentences?.length || 0,
      }]);
      
      setNewProfileName('');
      setShowCreateForm(false);
      setSelectedProfile(profile.id);
    } else {
      alert('创建档案失败，请重试');
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    if (confirm(t.deleteConfirm)) {
      deleteProfile(profileId);
      setProfiles(profiles.filter(p => p.id !== profileId));
      if (selectedProfile === profileId) {
        setSelectedProfile('');
      }
    }
  };

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfile(profileId);
    setCurrentProfileId(profileId);
  };

  const handleExportAllProfiles = () => {
    if (profiles.length === 0) return;
    
    // 获取所有当前存在的档案数据
    const allProfiles: Profile[] = [];
    profiles.forEach(profileSummary => {
      const profile = getProfile(profileSummary.id);
      if (profile) {
        allProfiles.push(profile);
      }
    });
    
    if (allProfiles.length === 0) {
      alert('没有可导出的档案');
      return;
    }
    
    // 创建包含所有档案的数据结构
    const exportData = {
      exportDate: new Date().toISOString(),
      profileCount: allProfiles.length,
      profiles: allProfiles
    };
    
    // 生成文件名
    const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    const filename = `AustinEnglish_已保存档案_${timestamp}.json`;
    
    // 创建并下载文件
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`已导出 ${allProfiles.length} 个档案到文件: ${filename}`);
  };

  const handleImportProfile = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await importProfile(file);
      
      // 保存所有导入的档案
      let savedCount = 0;
      let lastSavedProfile: Profile | null = null;
      
      for (const profile of result.profiles) {
        const success = saveProfile(profile);
        if (success) {
          savedCount++;
          lastSavedProfile = profile;
        }
      }
      
      if (savedCount === 0) {
        throw new Error('没有成功保存任何档案');
      }
      
      // 重新加载档案列表
      loadProfiles();
      
      // 选择最后一个成功保存的档案
      if (lastSavedProfile) {
        setSelectedProfile(lastSavedProfile.id);
      }
      
      // 显示成功消息
      if (savedCount === result.profiles.length) {
        alert(result.message);
      } else {
        alert(`部分导入成功：${savedCount}/${result.profiles.length} 个档案导入成功`);
      }
      
    } catch (error) {
      alert('导入失败：' + (error as Error).message);
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canProceed = selectedProfile !== '';

  // 语言文本配置
  const texts = {
    zh: {
      title: 'Austin English',
      subtitle: '个性化英语复习工具', 
      description: '配合孩子的英语课程，家长自建专属复习内容库',
      profilesTitle: '学习档案',
      profilesDesc: '选择或创建学习档案，开始个性化学习之旅',
      exportAll: '导出全部',
      import: '导入',
      newProfile: '新建档案',
      createProfile: '创建',
      cancel: '取消',
      loading: '正在加载档案...',
      noProfiles: '还没有档案',
      createFirst: '请创建一个新档案开始学习',
      letters: '字母',
      words: '单词',
      sentences: '句子',
      created: '创建',
      modified: '修改',
      deleteConfirm: '确定要删除这个档案吗？此操作无法撤销。',
      parentEntry: '家长入口',
      parentDesc: '管理学习内容，设置学习进度，查看学习记录',
      childEntry: '孩子入口',
      childDesc: '开始有趣的学习之旅，探索英语的奥秘',
      selectProfile: '请先选择一个档案',
      startManage: '开始管理',
      startLearning: '开始学习',
      inputProfileName: '输入档案名称',
      deleteProfile: '删除档案'
    },
    en: {
      title: 'Austin English',
      subtitle: 'Personalized English Review Tool',
      description: 'Complement your child\'s English courses, parents build custom review content',
      profilesTitle: 'Learning Profiles',
      profilesDesc: 'Select or create a learning profile to start your personalized learning journey',
      exportAll: 'Export All',
      import: 'Import',
      newProfile: 'New Profile',
      createProfile: 'Create',
      cancel: 'Cancel',
      loading: 'Loading profiles...',
      noProfiles: 'No profiles yet',
      createFirst: 'Please create a new profile to start learning',
      letters: 'Letters',
      words: 'Words',
      sentences: 'Sentences',
      created: 'Created',
      modified: 'Modified',
      deleteConfirm: 'Are you sure you want to delete this profile? This action cannot be undone.',
      parentEntry: 'Parent Portal',
      parentDesc: 'Manage learning content, set learning progress, view learning records',
      childEntry: 'Child Portal',
      childDesc: 'Start an exciting learning journey and explore the mysteries of English',
      selectProfile: 'Please select a profile first',
      startManage: 'Start Managing',
      startLearning: 'Start Learning',
      inputProfileName: 'Enter profile name',
      deleteProfile: 'Delete profile'
    }
  };

  const t = texts[language];

  return (
    <main className="h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col overflow-hidden">
      {/* Hero Section - Jony Ive Inspired Design */}
      <section className="relative flex-shrink-0 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Navigation */}
          <div className="flex items-center justify-between py-6">
            {/* Austin English Brand */}
            <div className="flex items-center">
              <h1 className="text-2xl font-light tracking-wide text-gray-900">
                {t.title}
              </h1>
              <div className="ml-3 px-2 py-1 bg-gray-100 rounded-full">
                <span className="text-xs font-medium text-gray-600">
                  2025.6.18
                </span>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => handleLanguageChange('zh')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  language === 'zh'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                中文
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  language === 'en'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="pt-4 pb-4">
            <div className="text-center max-w-4xl mx-auto">
              {/* Primary Headline */}
              <h2 className="text-3xl sm:text-4xl font-light text-gray-900 tracking-tight leading-tight">
                {t.subtitle}
              </h2>
              
              {/* Subtitle */}
              <p className="mt-3 text-base font-light text-gray-600 leading-relaxed">
                {t.description}
              </p>

              {/* Feature Points - Apple Style - Ultra Compact */}
              <div className="mt-6 grid grid-cols-3 gap-6 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {language === 'zh' ? '配合任何课程' : 'Works with Any Course'}
                  </h3>
                  <p className="text-xs text-gray-600 font-light">
                    {language === 'zh' ? '支持任何英语课程' : 'Supports any English course'}
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 bg-purple-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {language === 'zh' ? '家长自建内容' : 'Parent-Built Content'}
                  </h3>
                  <p className="text-xs text-gray-600 font-light">
                    {language === 'zh' ? '根据课程进度添加单词和句子' : 'Add words and sentences based on course progress'}
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 bg-pink-100 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {language === 'zh' ? '专属复习体验' : 'Personalized Review Experience'}
                  </h3>
                  <p className="text-xs text-gray-600 font-light">
                    {language === 'zh' ? '告别千篇一律的学习内容' : 'Say goodbye to one-size-fits-all learning content'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Management Section */}
      <section className="flex-1 px-4 sm:px-6 lg:px-8" style={{paddingTop: '20px'}}>
        <div className="max-w-6xl mx-auto w-full">
          {/* 档案区外部容器 - 固定高度 */}
          <div className="h-80 bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20" style={{marginBottom: '20px'}}>
            <div className="w-full h-full p-6 flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {t.profilesTitle}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {t.profilesDesc}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExportAllProfiles}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                    title={t.exportAll}
                    disabled={profiles.length === 0}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    {t.exportAll}
                  </button>
                  <button
                    onClick={handleImportProfile}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                    title={t.import}
                  >
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    {t.import}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    <PlusIcon className="h-5 w-5" />
                    {t.newProfile}
                  </button>
                </div>
              </div>

              {/* Create Profile Form */}
              {showCreateForm && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                      placeholder={t.inputProfileName}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateProfile}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
                      >
                        {t.createProfile}
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewProfileName('');
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile List */}
              <div className="flex-1">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-3"></div>
                    <p className="text-gray-500">{t.loading}</p>
                  </div>
                ) : profiles.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AcademicCapIcon className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="text-gray-500 mb-1">{t.noProfiles}</p>
                    <p className="text-gray-400 text-sm">{t.createFirst}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                        selectedProfile === profile.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-xl'
                          : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-lg'
                      }`}
                      onClick={() => handleSelectProfile(profile.id)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-bold text-base ${
                            selectedProfile === profile.id ? 'text-white' : 'text-gray-900'
                          }`}>
                            {profile.name}
                          </h3>
                          {profile.id === 'profile_default_austin' && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              selectedProfile === profile.id 
                                ? 'bg-white/20 text-white' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {language === 'zh' ? '示例档案' : 'Sample'}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(profile.id);
                          }}
                          className={`p-1.5 rounded-lg transition-all duration-200 ${
                            selectedProfile === profile.id
                              ? 'hover:bg-white/20 text-white/80 hover:text-white'
                              : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                          }`}
                          title={t.deleteProfile}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className={`space-y-2 ${
                        selectedProfile === profile.id ? 'text-white/90' : 'text-gray-600'
                      }`}>
                        <div className="flex justify-between text-sm">
                          <span>{t.letters}</span>
                          <span className="font-medium">{profile.letterCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{t.words}</span>
                          <span className="font-medium">{profile.wordCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{t.sentences}</span>
                          <span className="font-medium">{profile.sentenceCount}</span>
                        </div>
                        <div className={`pt-2 border-t text-xs ${
                          selectedProfile === profile.id ? 'border-white/20' : 'border-gray-200'
                        }`}>
                          <div>{t.created}: {dayjs(profile.createdAt).format('YYYY/MM/DD')}</div>
                          <div>{t.modified}: {dayjs(profile.lastModified).format('MM/DD HH:mm')}</div>
                        </div>
                      </div>
                      
                      {selectedProfile === profile.id && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Entry Points Section - 与档案区同宽，内部容器对齐 */}
          <div className="w-full">
            <div className="flex flex-col lg:flex-row gap-6">
              <Link 
                href={canProceed ? "/parent" : "#"} 
                className={`block group w-full lg:w-[calc(50%-12px)] ${!canProceed ? 'pointer-events-none' : ''}`}
              >
                <div className={`relative overflow-hidden rounded-3xl transition-all duration-500 ${
                  canProceed 
                    ? 'hover:scale-105 hover:shadow-2xl' 
                    : 'opacity-50'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10"></div>
                  <div className="relative p-6 text-white">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <UserGroupIcon className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{t.parentEntry}</h3>
                    <p className="text-blue-100 text-sm leading-relaxed mb-4">
                      {t.parentDesc}
                    </p>
                    {!canProceed && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-200 rounded-lg text-sm">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        {t.selectProfile}
                      </div>
                    )}
                    {canProceed && (
                      <div className="inline-flex items-center gap-2 text-blue-100 group-hover:text-white transition-colors">
                        <span>{t.startManage}</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              <Link 
                href={canProceed ? "/child" : "#"} 
                className={`block group w-full lg:w-[calc(50%-12px)] ${!canProceed ? 'pointer-events-none' : ''}`}
              >
                <div className={`relative overflow-hidden rounded-3xl transition-all duration-500 ${
                  canProceed 
                    ? 'hover:scale-105 hover:shadow-2xl' 
                    : 'opacity-50'
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10"></div>
                  <div className="relative p-6 text-white">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <AcademicCapIcon className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{t.childEntry}</h3>
                    <p className="text-purple-100 text-sm leading-relaxed mb-4">
                      {t.childDesc}
                    </p>
                    {!canProceed && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-200 rounded-lg text-sm">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        {t.selectProfile}
                      </div>
                    )}
                    {canProceed && (
                      <div className="inline-flex items-center gap-2 text-purple-100 group-hover:text-white transition-colors">
                        <span>{t.startLearning}</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
    </main>
  );
} 