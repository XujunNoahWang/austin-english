export interface Letter {
  id: string;
  uppercase: string;
  lowercase: string;
  pronunciations: string[];
  isVisible: boolean;
}

export interface Word {
  id: string;
  text: string;
  createdAt: string;
  star: number;
}

export interface Sentence {
  id: string;
  text: string;
  createdAt: string;
  star: number;
}

