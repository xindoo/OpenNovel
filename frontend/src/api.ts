// Import shared types from backend
import type {
  Novel,
  Chapter,
  NovelWithChapters,
  CategoryInfo,
  ApiResponse,
  ChapterEngagement
} from '../../src/types';

// Re-export types for convenience
export type { Novel, Chapter, NovelWithChapters, CategoryInfo, ApiResponse, ChapterEngagement };

export interface PaginatedNovelsResponse {
  novels: Novel[];
  total: number;
  page: number;
  limit: number;
}

// API client configuration
let adminUsername: string | undefined;
let adminPassword: string | undefined;

export function setAdminCredentials(username: string, password: string): void {
  adminUsername = username;
  adminPassword = password;
}

export function clearAdminCredentials(): void {
  adminUsername = undefined;
  adminPassword = undefined;
}

function getAuthHeaders(): HeadersInit {
  if (adminUsername && adminPassword) {
    const credentials = btoa(`${adminUsername}:${adminPassword}`);
    return {
      'Authorization': `Basic ${credentials}`,
    };
  }
  return {};
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `/api${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorResponse: ApiResponse<T> = {
      success: false,
      error: `API request failed: ${response.statusText}`
    };
    return errorResponse;
  }

  return response.json();
}

// Public API
export async function getCategories(): Promise<ApiResponse<CategoryInfo[]>> {
  return apiRequest<CategoryInfo[]>('/categories');
}

export async function getNovels(
  page: number = 1,
  limit: number = 20,
  category?: string
): Promise<ApiResponse<PaginatedNovelsResponse>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (category) {
    params.append('category', category);
  }
  return apiRequest<PaginatedNovelsResponse>(`/novels?${params}`);
}

export async function getNovel(id: number): Promise<ApiResponse<NovelWithChapters>> {
  return apiRequest<NovelWithChapters>(`/novels/${id}`);
}

export async function getChapter(
  novelId: number,
  chapterId: number,
  noCount: boolean = false
): Promise<ApiResponse<{ chapter: Chapter; content: string; engagement: ChapterEngagement }>> {
  const params = noCount ? '?noCount=true' : '';
  return apiRequest<{ chapter: Chapter; content: string; engagement: ChapterEngagement }>(`/novels/${novelId}/chapters/${chapterId}${params}`);
}

export async function getChapterEngagements(
  novelId: number
): Promise<ApiResponse<ChapterEngagement[]>> {
  return apiRequest<ChapterEngagement[]>(`/novels/${novelId}/engagements`);
}

export async function likeChapter(
  novelId: number,
  chapterId: number
): Promise<ApiResponse<ChapterEngagement>> {
  return apiRequest<ChapterEngagement>(`/novels/${novelId}/chapters/${chapterId}/like`, {
    method: 'POST',
  });
}

export async function unlikeChapter(
  novelId: number,
  chapterId: number
): Promise<ApiResponse<ChapterEngagement>> {
  return apiRequest<ChapterEngagement>(`/novels/${novelId}/chapters/${chapterId}/unlike`, {
    method: 'POST',
  });
}

export async function dislikeChapter(
  novelId: number,
  chapterId: number
): Promise<ApiResponse<ChapterEngagement>> {
  return apiRequest<ChapterEngagement>(`/novels/${novelId}/chapters/${chapterId}/dislike`, {
    method: 'POST',
  });
}

export async function undislikeChapter(
  novelId: number,
  chapterId: number
): Promise<ApiResponse<ChapterEngagement>> {
  return apiRequest<ChapterEngagement>(`/novels/${novelId}/chapters/${chapterId}/undislike`, {
    method: 'POST',
  });
}

export function getStorageUrl(key: string): string {
  return `/api/storage/${key}`;
}

// Admin API
export async function listNovelsAdmin(): Promise<ApiResponse<Novel[]>> {
  return apiRequest<Novel[]>('/admin/novels');
}

export async function createNovel(
  data: Omit<Novel, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<Novel>> {
  return apiRequest<Novel>('/admin/novels', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNovel(
  id: number,
  data: Partial<Omit<Novel, 'id' | 'created_at' | 'updated_at'>>
): Promise<ApiResponse<Novel>> {
  return apiRequest<Novel>(`/admin/novels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteNovel(id: number): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/admin/novels/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadCover(
  novelId: number,
  file: File
): Promise<ApiResponse<{ coverUrl: string }>> {
  const formData = new FormData();
  formData.append('cover', file);

  const headers = getAuthHeaders() as Record<string, string>;
  // Content-Type is set automatically by browser for FormData
  delete headers['Content-Type'];

  const response = await fetch(`/api/admin/novels/${novelId}/upload-cover`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    return {
      success: false,
      error: `Failed to upload cover: ${response.statusText}`
    };
  }

  return response.json();
}

export async function uploadChapters(
  novelId: number,
  files: File[]
): Promise<ApiResponse<{ chapters: Chapter[] }>> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('chapters', file);
  });

  const headers = getAuthHeaders() as Record<string, string>;
  delete headers['Content-Type'];

  const response = await fetch(`/api/admin/novels/${novelId}/chapters/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    return {
      success: false,
      error: `Failed to upload chapters: ${response.statusText}`
    };
  }

  return response.json();
}

export async function uploadSingleChapter(
  novelId: number,
  file: File
): Promise<ApiResponse<{ uploaded: number }>> {
  const formData = new FormData();
  formData.append('chapters', file);

  const headers = getAuthHeaders() as Record<string, string>;
  delete headers['Content-Type'];

  const response = await fetch(`/api/admin/novels/${novelId}/chapters/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    return {
      success: false,
      error: `Failed to upload chapter: ${response.statusText}`
    };
  }

  return response.json();
}

export async function deleteChapter(
  novelId: number,
  chapterId: number
): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/admin/novels/${novelId}/chapters/${chapterId}`, {
    method: 'DELETE',
  });
}

export interface ChapterUpdateData {
  title?: string;
  content?: string;
  chapter_number?: number;
}

export async function updateChapter(
  novelId: number,
  chapterId: number,
  data: ChapterUpdateData
): Promise<ApiResponse<Chapter>> {
  return apiRequest<Chapter>(`/admin/novels/${novelId}/chapters/${chapterId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
