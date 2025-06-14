import { Profile } from '../types/profile';

// 自动导出功能
export function autoExportProfile(profile: Profile): void {
  try {
    // 创建文件名 - 使用更简洁的时间格式
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const filename = `${profile.name}_${dateStr}_${timeStr}.json`;
    
    // 创建数据
    const dataStr = JSON.stringify(profile, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    

  } catch (error) {
    console.error('自动导出失败:', error);
  }
}

// 批量导出所有档案
export function exportAllProfiles(profiles: Profile[]): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const allData = {
    exportDate: new Date().toISOString(),
    profileCount: profiles.length,
    profiles: profiles
  };
  
  const dataStr = JSON.stringify(allData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `所有档案_${timestamp}.json`;
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 定期自动备份
export function setupAutoBackup(getProfiles: () => Profile[], intervalMinutes: number = 30): () => void {
  const interval = setInterval(() => {
    const profiles = getProfiles();
    if (profiles.length > 0) {
      // 只备份有数据的档案
      const activeProfiles = profiles.filter(p => 
        p.data.words.length > 0 || 
        p.data.sentences.length > 0 || 
        p.data.letters.some(l => l.isVisible)
      );
      
      if (activeProfiles.length > 0) {
        exportAllProfiles(activeProfiles);
      }
    }
  }, intervalMinutes * 60 * 1000);
  
  // 返回清理函数
  return () => clearInterval(interval);
}

// 获取localStorage使用情况
export function getStorageInfo(): {
  used: number;
  available: number;
  percentage: number;
  profileCount: number;
} {
  let used = 0;
  let profileCount = 0;
  
  try {
    // 计算localStorage使用量
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    // 获取档案数量
    const profiles = localStorage.getItem('english_learning_profiles');
    if (profiles) {
      const profilesData = JSON.parse(profiles);
      profileCount = profilesData.length;
    }
  } catch (error) {
    console.error('Error calculating storage info:', error);
  }
  
  // localStorage通常限制为5-10MB
  const available = 5 * 1024 * 1024; // 假设5MB限制
  const percentage = (used / available) * 100;
  
  return {
    used,
    available,
    percentage: Math.min(percentage, 100),
    profileCount
  };
}

// 清理旧的备份提醒
export function shouldBackup(lastBackupTime?: string): boolean {
  if (!lastBackupTime) return true;
  
  const lastBackup = new Date(lastBackupTime);
  const now = new Date();
  const hoursSinceBackup = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceBackup >= 24; // 24小时提醒一次
} 