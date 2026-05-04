export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  ASSETS: Fetcher;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
}

export interface Novel {
  id: number;
  title: string;
  author: string;
  description: string;
  cover_image_key: string | null;
  category: string;
  status: 'ongoing' | 'completed';
  created_at: number;
  updated_at: number;
}

export interface Chapter {
  id: number;
  novel_id: number;
  title: string;
  content_key: string | null;
  chapter_number: number;
  created_at: number;
  updated_at: number;
}

export interface NovelWithChapters extends Novel {
  chapters: Chapter[];
}

export interface ChapterEngagement {
  chapter_id: number;
  likes: number;
  dislikes: number;
  views: number;
  updated_at: number;
}

export interface CategoryInfo {
  name: string;
  count: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
