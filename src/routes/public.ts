import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Novel, NovelWithChapters, Chapter, CategoryInfo, ApiResponse } from '../types';

const publicRouter = new Hono<{ Bindings: Env }>();

// Enable CORS for all public API endpoints
publicRouter.use('/*', cors({
  origin: '*',
  allowMethods: ['GET'],
  allowHeaders: ['Content-Type'],
}));

// GET /api/categories - Get list of all categories with novel counts
publicRouter.get('/categories', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT category FROM novels
  `).all<{ category: string }>();

  const tagCounts = new Map<string, number>();
  for (const row of results) {
    if (!row.category) continue;
    const tags = row.category.split(',').map(t => t.trim()).filter(Boolean);
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  const categories: CategoryInfo[] = Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const response: ApiResponse<CategoryInfo[]> = {
    success: true,
    data: categories
  };

  c.header('Cache-Control', 'public, max-age=3600');
  return c.json(response);
});

// GET /api/novels - List novels (optionally filtered by category) sorted by updated_at DESC with pagination
publicRouter.get('/novels', async (c) => {
  const category = c.req.query('category');
  const pageParam = c.req.query('page');
  const limitParam = c.req.query('limit');

  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  // Validate pagination parameters
  const validPage = Math.max(1, page);
  const validLimit = Math.max(1, Math.min(100, limit)); // Cap at 100 novels per page
  const offset = (validPage - 1) * validLimit;

  // Build where clause for category filtering
  let whereClause = '';
  let params: (string | number)[] = [];

  if (category) {
    whereClause = ' WHERE category = ? OR category LIKE ? OR category LIKE ? OR category LIKE ?';
    params.push(category, `${category},%`, `%,${category}`, `%,${category},%`);
  }

  // Get total count for pagination
  const countQuery = `SELECT COUNT(*) as total FROM novels${whereClause}`;
  const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
  const total = countResult?.total || 0;

  // Get paginated results
  let query = `SELECT * FROM novels${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`;
  params.push(validLimit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all<Novel>();

  // Convert timestamps from datetime to unix timestamp
  const novels: Novel[] = results.map(row => ({
    ...row,
    created_at: new Date(row.created_at).getTime() / 1000,
    updated_at: new Date(row.updated_at).getTime() / 1000
  }));

  const response: ApiResponse<{ novels: Novel[]; total: number; page: number; limit: number }> = {
    success: true,
    data: {
      novels,
      total,
      page: validPage,
      limit: validLimit
    }
  };

  c.header('Cache-Control', 'public, max-age=60');
  return c.json(response);
});

// GET /api/novels/:id - Get novel metadata + chapter list
publicRouter.get('/novels/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid novel ID'
    };
    return c.json(response, 400);
  }

  // Get novel metadata
  const novel = await c.env.DB.prepare('SELECT * FROM novels WHERE id = ?').bind(id).first<Novel>();

  if (!novel) {
    const response: ApiResponse = {
      success: false,
      error: 'Novel not found'
    };
    return c.json(response, 404);
  }

  // Get all chapters for this novel ordered by chapter_number ASC
  const { results: chapters } = await c.env.DB.prepare(`
    SELECT * FROM chapters
    WHERE novel_id = ?
    ORDER BY chapter_number ASC
  `).bind(id).all<Chapter>();

  // Convert timestamps
  const novelWithTimestamps: Novel = {
    ...novel,
    created_at: new Date(novel.created_at).getTime() / 1000,
    updated_at: new Date(novel.updated_at).getTime() / 1000
  };

  const chaptersWithTimestamps: Chapter[] = chapters.map(chapter => ({
    ...chapter,
    created_at: new Date(chapter.created_at).getTime() / 1000,
    updated_at: new Date(chapter.updated_at).getTime() / 1000
  }));

  const data: NovelWithChapters = {
    ...novelWithTimestamps,
    chapters: chaptersWithTimestamps
  };

  const response: ApiResponse<NovelWithChapters> = {
    success: true,
    data
  };

  c.header('Cache-Control', 'public, max-age=60');
  c.header('Access-Control-Allow-Origin', '*');
  return c.json(response);
});

// GET /api/novels/:id/chapters/:chapterId - Get chapter content
publicRouter.get('/novels/:id/chapters/:chapterId', async (c) => {
  const novelId = parseInt(c.req.param('id'), 10);
  const chapterId = parseInt(c.req.param('chapterId'), 10);

  if (isNaN(novelId) || isNaN(chapterId)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid ID'
    };
    return c.json(response, 400);
  }

  // Verify novel exists
  const novel = await c.env.DB.prepare('SELECT id FROM novels WHERE id = ?').bind(novelId).first();
  if (!novel) {
    const response: ApiResponse = {
      success: false,
      error: 'Novel not found'
    };
    return c.json(response, 404);
  }

  // Get chapter metadata
  const chapter = await c.env.DB.prepare(`
    SELECT * FROM chapters
    WHERE id = ? AND novel_id = ?
  `).bind(chapterId, novelId).first<Chapter>();

  if (!chapter) {
    const response: ApiResponse = {
      success: false,
      error: 'Chapter not found'
    };
    return c.json(response, 404);
  }

  if (!chapter.content_key) {
    const response: ApiResponse = {
      success: false,
      error: 'Chapter content not available'
    };
    return c.json(response, 404);
  }

  // Get content from R2
  const object = await c.env.STORAGE.get(chapter.content_key);

  if (!object) {
    const response: ApiResponse = {
      success: false,
      error: 'Chapter content not found'
    };
    return c.json(response, 404);
  }

  const content = await object.text();

  // Convert timestamps
  const chapterWithTimestamps: Chapter = {
    ...chapter,
    created_at: new Date(chapter.created_at).getTime() / 1000,
    updated_at: new Date(chapter.updated_at).getTime() / 1000
  };

  const response: ApiResponse<{ chapter: Chapter; content: string }> = {
    success: true,
    data: {
      chapter: chapterWithTimestamps,
      content
    }
  };

  c.header('Cache-Control', 'public, max-age=3600');
  c.header('Access-Control-Allow-Origin', '*');
  return c.json(response);
});

// GET /api/storage/*key - Serve image/asset from R2 with proper content-type
publicRouter.get('/storage/*key', async (c) => {
  const key = decodeURIComponent(c.req.param('key')?.replace(/^\/+/, '') || '');

  if (!key) {
    const response: ApiResponse = {
      success: false,
      error: 'Storage key is required'
    };
    return c.json(response, 400);
  }

  const object = await c.env.STORAGE.get(key);

  if (!object) {
    const response: ApiResponse = {
      success: false,
      error: 'Not found'
    };
    return c.json(response, 404);
  }

  // Create headers from R2 httpMetadata
  const headers = new Headers();

  if (object.httpMetadata?.contentType) {
    headers.set('Content-Type', object.httpMetadata.contentType);
  }

  if (object.httpMetadata?.contentEncoding) {
    headers.set('Content-Encoding', object.httpMetadata.contentEncoding);
  }

  if (object.httpMetadata?.cacheControl) {
    headers.set('Cache-Control', object.httpMetadata.cacheControl);
  }

  headers.set('Access-Control-Allow-Origin', '*');

  if (object.etag) {
    headers.set('ETag', object.etag);
  }

  // Stream the response directly
  return new Response(object.body, {
    headers
  });
});

export default publicRouter;
