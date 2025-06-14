import type { Letter, Word, Sentence } from './index';

export interface Profile {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  data: {
    letters: Letter[];
    words: Word[];
    sentences: Sentence[];
    selectedPronunciations: Record<string, string[]>;
  };
}

export interface ProfileSummary {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  letterCount: number;
  wordCount: number;
  sentenceCount: number;
}

// 重新导出现有类型
export type { Letter, Word, Sentence }; 