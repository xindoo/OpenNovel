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
  cover_url: string | null;
  category: string;
  status: 'ongoing' | 'completed';
  created_at: number;
  updated_at: number;
}

export interface Chapter {
  id: number;
  novel_id: number;
  title: string;
  content_url: string | null;
  order: number;
  created_at: number;
  updated_at: number;
}

export interface NovelWithChapters extends Novel {
  chapters: Chapter[];
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
