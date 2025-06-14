import { Profile, ProfileSummary } from '../types/profile';

const PROFILES_KEY = 'english_learning_profiles';
const CURRENT_PROFILE_KEY = 'current_profile_id';

// 获取所有档案摘要
export function getProfileSummaries(): ProfileSummary[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const profiles = localStorage.getItem(PROFILES_KEY);
    if (!profiles || !profiles.trim()) return [];
    
    const profilesData: Profile[] = JSON.parse(profiles);
    return profilesData.map(profile => ({
      id: profile.id,
      name: profile.name,
      createdAt: profile.createdAt,
      lastModified: profile.lastModified,
      letterCount: profile.data.letters?.filter(l => l.isVisible).length || 0,
      wordCount: profile.data.words?.length || 0,
      sentenceCount: profile.data.sentences?.length || 0,
    }));
  } catch (error) {
    console.error('Error loading profile summaries:', error);
    return [];
  }
}

// 获取完整档案数据
export function getProfile(profileId: string): Profile | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const profiles = localStorage.getItem(PROFILES_KEY);
    if (!profiles || !profiles.trim()) return null;
    
    const profilesData: Profile[] = JSON.parse(profiles);
    return profilesData.find(p => p.id === profileId) || null;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
}

// 保存档案
export function saveProfile(profile: Profile): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const profiles = localStorage.getItem(PROFILES_KEY);
    let profilesData: Profile[] = [];
    
    if (profiles && profiles.trim()) {
      try {
        profilesData = JSON.parse(profiles);
      } catch (parseError) {
        console.error('Error parsing existing profiles, starting fresh:', parseError);
        profilesData = [];
      }
    }
    
    // 更新或添加档案
    const existingIndex = profilesData.findIndex(p => p.id === profile.id);
    profile.lastModified = new Date().toISOString();
    
    if (existingIndex >= 0) {
      profilesData[existingIndex] = profile;
    } else {
      profilesData.push(profile);
    }
    
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profilesData));
    
    return true;
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
}

// 创建新档案
export function createProfile(name: string): Profile {
  const now = new Date().toISOString();
  
  // 初始化字母数据
  const letterPronunciations: Record<string, string[]> = {
    'A': ['/æ/', '/eɪ/', '/ɑː/'],
    'B': ['/b/'],
    'C': ['/k/', '/s/'],
    'D': ['/d/'],
    'E': ['/e/', '/iː/'],
    'F': ['/f/'],
    'G': ['/g/', '/dʒ/'],
    'H': ['/h/'],
    'I': ['/aɪ/', '/i/'],
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

  const initialLetters = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((char) => ({
    id: char,
    uppercase: char,
    lowercase: char.toLowerCase(),
    pronunciations: letterPronunciations[char] || [],
    isVisible: false,
  }));

  const profile: Profile = {
    id: `profile_${Date.now()}`,
    name,
    createdAt: now,
    lastModified: now,
    data: {
      letters: initialLetters,
      words: [],
      sentences: [],
      selectedPronunciations: {},
    },
  };

  return profile;
}

// 删除档案
export function deleteProfile(profileId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const profiles = localStorage.getItem(PROFILES_KEY);
    if (!profiles) return false;
    
    let profilesData: Profile[] = JSON.parse(profiles);
    profilesData = profilesData.filter(p => p.id !== profileId);
    
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profilesData));
    
    // 如果删除的是当前档案，清除当前档案ID
    const currentProfileId = getCurrentProfileId();
    if (currentProfileId === profileId) {
      setCurrentProfileId('');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
}

// 获取当前档案ID
export function getCurrentProfileId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(CURRENT_PROFILE_KEY) || '';
}

// 设置当前档案ID
export function setCurrentProfileId(profileId: string): void {
  if (typeof window === 'undefined') return;
  if (profileId) {
    localStorage.setItem(CURRENT_PROFILE_KEY, profileId);
  } else {
    localStorage.removeItem(CURRENT_PROFILE_KEY);
  }
}

// 导出档案到文件
export function exportProfile(profile: Profile): void {
  const dataStr = JSON.stringify(profile, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${profile.name}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 导入档案从文件
export function importProfile(file: File): Promise<{ profiles: Profile[], message: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // 检查是否是多档案导出格式
        if (data.profiles && Array.isArray(data.profiles)) {
          // 这是多档案导出格式
          if (data.profiles.length === 0) {
            throw new Error('导出文件中没有档案数据');
          }
          
          // 处理所有档案
          const processedProfiles: Profile[] = [];
          
          data.profiles.forEach((profile: Profile, index: number) => {
            // 验证档案格式
            if (!profile.id || !profile.name || !profile.data) {
              return;
            }
            
            // 生成新的ID避免冲突
            const newProfile = {
              ...profile,
              id: `profile_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
              lastModified: new Date().toISOString()
            };
            
            processedProfiles.push(newProfile);
          });
          
          if (processedProfiles.length === 0) {
            throw new Error('没有成功处理任何档案');
          }
          
          const message = processedProfiles.length === 1 
            ? `成功导入档案: ${processedProfiles[0].name}`
            : `成功导入 ${processedProfiles.length} 个档案：${processedProfiles.map(p => p.name).join(', ')}`;
          
          resolve({ profiles: processedProfiles, message });
          
        } else {
          // 这是单档案格式
          const profile: Profile = data;
          
          // 验证档案格式
          if (!profile.id || !profile.name || !profile.data) {
            throw new Error('无效的档案格式');
          }
          
          // 生成新的ID避免冲突
          const newProfile = {
            ...profile,
            id: `profile_${Date.now()}`,
            lastModified: new Date().toISOString()
          };
          
          resolve({ 
            profiles: [newProfile], 
            message: `成功导入档案: ${newProfile.name}` 
          });
        }
        
      } catch (error) {
        console.error('Import error:', error);
        throw error;
      }
    };
    
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    
    reader.readAsText(file);
  });
}

// 从旧的localStorage数据迁移到档案系统
export function migrateFromOldData(): Profile | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const oldData = localStorage.getItem('parentData');
    if (!oldData) return null;
    
    const data = JSON.parse(oldData);
    const profile = createProfile('默认档案');
    profile.data = {
      letters: data.letters || [],
      words: data.words || [],
      sentences: data.sentences || [],
      selectedPronunciations: data.selectedPronunciations || {},
    };
    
    // 保存迁移的档案
    saveProfile(profile);
    setCurrentProfileId(profile.id);
    
    // 删除旧数据
    localStorage.removeItem('parentData');
    
    return profile;
  } catch (error) {
    console.error('Error migrating old data:', error);
    return null;
  }
} 
