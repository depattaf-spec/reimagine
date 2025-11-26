export interface DesignStyle {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  thumbnail: string;
}

export interface GeneratedDesign {
  id: string;
  imageUrl: string;
  styleId: string;
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  groundingLinks?: {
    title: string;
    url: string;
  }[];
  relatedImageId?: string;
}

export type AppPhase = 'upload' | 'analyzing' | 'visualizing';

export interface ChatResponse {
  text: string;
  groundingLinks?: { title: string; url: string }[];
  toolCall?: {
    name: string;
    args: Record<string, any>;
  };
}