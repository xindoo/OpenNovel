import { Hono } from 'hono';
import { basicAuth } from '../auth';
import type { Env, Novel, Chapter, ApiResponse } from '../types';

const adminRouter = new Hono<{ Bindings: Env }>();
adminRouter.use('/*', basicAuth);

adminRouter.get('/novels', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM novels ORDER BY updated_at DESC
  `).all<Novel>();

  const novels: Novel[] = results.map(row => ({
    ...row,
    created_at: new Date(row.created_at).getTime() / 1000,
    updated_at: new Date(row.updated_at).getTime() / 1000
  }));

  const response: ApiResponse<Novel[]> = {
    success: true,
    data: novels
  };

  return c.json(response);
});

adminRouter.post('/novels', async (c) => {
  const body = await c.req.json<{
    title: string;
    author: string;
    description?: string;
    category: string;
    status?: 'ongoing' | 'completed';
  }>();

  if (!body.title || !body.author) {
    const response: ApiResponse = {
      success: false,
      error: 'title and author are required'
    };
    return c.json(response, 400);
  }

  const status = body.status || 'ongoing';
  const category = body.category || '';

  const result = await c.env.DB.prepare(`
    INSERT INTO novels (title, author, description, category, status)
    VALUES (?, ?, ?, ?, ?)
  `).bind(body.title, body.author, body.description || null, category, status).run();

  const novelId = result.meta.last_row_id;

  if (!novelId) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create novel'
    };
    return c.json(response, 500);
  }

  const novel = await c.env.DB.prepare(`
    SELECT * FROM novels WHERE id = ?
  `).bind(novelId).first<Novel>();

  if (!novel) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve created novel'
    };
    return c.json(response, 500);
  }

  const novelWithTimestamps: Novel = {
    ...novel,
    created_at: new Date(novel.created_at).getTime() / 1000,
    updated_at: new Date(novel.updated_at).getTime() / 1000
  };

  const response: ApiResponse<Novel> = {
    success: true,
    data: novelWithTimestamps
  };

  return c.json(response, 201);
});

adminRouter.put('/novels/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid novel ID'
    };
    return c.json(response, 400);
  }

  const body = await c.req.json<{
    title?: string;
    author?: string;
    description?: string;
    category?: string;
    status?: 'ongoing' | 'completed';
  }>();

  const existing = await c.env.DB.prepare(`
    SELECT id FROM novels WHERE id = ?
  `).bind(id).first();

  if (!existing) {
    const response: ApiResponse = {
      success: false,
      error: 'Novel not found'
    };
    return c.json(response, 404);
  }

  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    params.push(body.title);
  }
  if (body.author !== undefined) {
    updates.push('author = ?');
    params.push(body.author);
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    params.push(body.description);
  }
  if (body.category !== undefined) {
    updates.push('category = ?');
    params.push(body.category);
  }
  if (body.status !== undefined) {
    updates.push('status = ?');
    params.push(body.status);
  }

  updates.push('updated_at = datetime(\'now\')');
  params.push(id);

  await c.env.DB.prepare(`
    UPDATE novels SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();

  const novel = await c.env.DB.prepare(`
    SELECT * FROM novels WHERE id = ?
  `).bind(id).first<Novel>();

  if (!novel) {
    const response: ApiResponse = {
      success: false,
      error: 'Failed to retrieve updated novel'
    };
    return c.json(response, 500);
  }

  const novelWithTimestamps: Novel = {
    ...novel,
    created_at: new Date(novel.created_at).getTime() / 1000,
    updated_at: new Date(novel.updated_at).getTime() / 1000
  };

  const response: ApiResponse<Novel> = {
    success: true,
    data: novelWithTimestamps
  };

  return c.json(response);
});

adminRouter.delete('/novels/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid novel ID'
    };
    return c.json(response, 400);
  }

  const existing = await c.env.DB.prepare(`
    SELECT id FROM novels WHERE id = ?
  `).bind(id).first();

  if (!existing) {
    const response: ApiResponse = {
      success: false,
      error: 'Novel not found'
    };
    return c.json(response, 404);
  }

  await c.env.DB.prepare(`
    DELETE FROM novels WHERE id = ?
  `).bind(id).run();

  const response: ApiResponse = {
    success: true
  };

  return c.json(response);
});

adminRouter.post('/novels/:id/upload-cover', async (c) => {
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid novel ID'
    };
    return c.json(response, 400);
  }

  const existing = await c.env.DB.prepare(`
    SELECT id, cover_image_key FROM novels WHERE id = ?
  `).bind(id).first<{ id: number; cover_image_key: string | null }>();

  if (!existing) {
    const response: ApiResponse = {
      success: false,
      error: 'Novel not found'
    };
    return c.json(response, 404);
  }

  const formData = await c.req.formData();
  const file = (formData.get('cover') || formData.get('file')) as File | null;

  if (!file) {
    const response: ApiResponse = {
      success: false,
      error: 'No file provided'
    };
    return c.json(response, 400);
  }

  if (!file.type.startsWith('image/')) {
    const response: ApiResponse = {
      success: false,
      error: 'File must be an image'
    };
    return c.json(response, 400);
  }

  const storageKey = `novels/${id}/covers/${file.name.replace(/\s+/g, '-')}`;

  if (existing.cover_image_key) {
    await c.env.STORAGE.delete(existing.cover_image_key);
  }

  await c.env.STORAGE.put(storageKey, file, {
    httpMetadata: {
      contentType: file.type
    }
  });

  await c.env.DB.prepare(`
    UPDATE novels SET cover_image_key = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(storageKey, id).run();

  const response: ApiResponse<{ coverUrl: string }> = {
    success: true,
    data: {
      coverUrl: storageKey
    }
  };

  return c.json(response);
});

adminRouter.post('/novels/:id/chapters/upload', async (c) => {
  const novelId = parseInt(c.req.param('id'), 10);

  if (isNaN(novelId)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid novel ID'
    };
    return c.json(response, 400);
  }

  const existing = await c.env.DB.prepare(`
    SELECT id FROM novels WHERE id = ?
  `).bind(novelId).first();

  if (!existing) {
    const response: ApiResponse = {
      success: false,
      error: 'Novel not found'
    };
    return c.json(response, 404);
  }

  const formData = await c.req.formData();
  const files: File[] = [];

  for (const [, value] of formData.entries()) {
    if (value instanceof File && (value.name.endsWith('.md') || value.name.endsWith('.txt'))) {
      files.push(value);
    }
  }

  if (files.length === 0) {
    const response: ApiResponse = {
      success: false,
      error: 'No .md files provided'
    };
    return c.json(response, 400);
  }

  files.sort((a, b) => a.name.localeCompare(b.name));

  let uploadedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const chapterNumber = i + 1;

    let title = file.name.replace(/\.(md|txt)$/, '').replace(/[-_]/g, ' ');
    title = title.replace(/\b\w/g, l => l.toUpperCase());

    const safeFilename = file.name.replace(/\s+/g, '-');
    const storageKey = `novels/${novelId}/chapters/${safeFilename}`;
    const content = await file.text();

    const isTxt = file.name.endsWith('.txt');
    await c.env.STORAGE.put(storageKey, content, {
      httpMetadata: {
        contentType: isTxt ? 'text/plain; charset=utf-8' : 'text/markdown; charset=utf-8'
      }
    });

    const existingChapter = await c.env.DB.prepare(`
      SELECT id FROM chapters WHERE novel_id = ? AND chapter_number = ?
    `).bind(novelId, chapterNumber).first();

    if (existingChapter) {
      await c.env.DB.prepare(`
        UPDATE chapters
        SET title = ?, content_key = ?, updated_at = datetime('now')
        WHERE novel_id = ? AND chapter_number = ?
      `).bind(title, storageKey, novelId, chapterNumber).run();
    } else {
      await c.env.DB.prepare(`
        INSERT INTO chapters (novel_id, title, chapter_number, content_key)
        VALUES (?, ?, ?, ?)
      `).bind(novelId, title, chapterNumber, storageKey).run();
    }

    uploadedCount++;
  }

  await c.env.DB.prepare(`
    UPDATE novels SET updated_at = datetime('now') WHERE id = ?
  `).bind(novelId).run();

  const response: ApiResponse<{ uploaded: number }> = {
    success: true,
    data: {
      uploaded: uploadedCount
    }
  };

  return c.json(response);
});

adminRouter.delete('/novels/:id/chapters/:chapterId', async (c) => {
  const novelId = parseInt(c.req.param('id'), 10);
  const chapterId = parseInt(c.req.param('chapterId'), 10);

  if (isNaN(novelId) || isNaN(chapterId)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid ID'
    };
    return c.json(response, 400);
  }

  const novel = await c.env.DB.prepare(`
    SELECT id FROM novels WHERE id = ?
  `).bind(novelId).first();

  if (!novel) {
    const response: ApiResponse = {
      success: false,
      error: 'Novel not found'
    };
    return c.json(response, 404);
  }

  const chapter = await c.env.DB.prepare(`
    SELECT content_key FROM chapters WHERE id = ? AND novel_id = ?
  `).bind(chapterId, novelId).first<{ content_key: string }>();

  if (!chapter) {
    const response: ApiResponse = {
      success: false,
      error: 'Chapter not found'
    };
    return c.json(response, 404);
  }

  if (chapter.content_key) {
    await c.env.STORAGE.delete(chapter.content_key);
  }

  await c.env.DB.prepare(`
    DELETE FROM chapters WHERE id = ? AND novel_id = ?
  `).bind(chapterId, novelId).run();

  await c.env.DB.prepare(`
    UPDATE novels SET updated_at = datetime('now') WHERE id = ?
  `).bind(novelId).run();

  const response: ApiResponse = {
    success: true
  };

  return c.json(response);
});

adminRouter.put('/novels/:id/chapters/:chapterId', async (c) => {
  const novelId = parseInt(c.req.param('id'), 10);
  const chapterId = parseInt(c.req.param('chapterId'), 10);

  if (isNaN(novelId) || isNaN(chapterId)) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid ID'
    };
    return c.json(response, 400);
  }

  const body = await c.req.json<{
    title?: string;
    content?: string;
  }>();

  if (!body.title && body.content === undefined) {
    const response: ApiResponse = {
      success: false,
      error: 'At least one of title or content is required'
    };
    return c.json(response, 400);
  }

  const novel = await c.env.DB.prepare(`
    SELECT id FROM novels WHERE id = ?
  `).bind(novelId).first();

  if (!novel) {
    const response: ApiResponse = {
      success: false,
      error: 'Novel not found'
    };
    return c.json(response, 404);
  }

  const chapter = await c.env.DB.prepare(`
    SELECT id, content_key FROM chapters WHERE id = ? AND novel_id = ?
  `).bind(chapterId, novelId).first<{ id: number; content_key: string }>();

  if (!chapter) {
    const response: ApiResponse = {
      success: false,
      error: 'Chapter not found'
    };
    return c.json(response, 404);
  }

  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    params.push(body.title);
  }

  if (body.content !== undefined) {
    if (chapter.content_key) {
      await c.env.STORAGE.delete(chapter.content_key);
    }

    const filename = chapter.content_key.split('/').pop() || `chapter-${chapterId}.md`;
    const storageKey = `novels/${novelId}/chapters/${filename}`;

    await c.env.STORAGE.put(storageKey, body.content, {
      httpMetadata: {
        contentType: 'text/markdown; charset=utf-8'
      }
    });

    updates.push('content_key = ?');
    params.push(storageKey);
  }

  updates.push('updated_at = datetime(\'now\')');
  params.push(chapterId);
  params.push(novelId);

  await c.env.DB.prepare(`
    UPDATE chapters SET ${updates.join(', ')} WHERE id = ? AND novel_id = ?
  `).bind(...params).run();

  await c.env.DB.prepare(`
    UPDATE novels SET updated_at = datetime('now') WHERE id = ?
  `).bind(novelId).run();

  const response: ApiResponse = {
    success: true
  };

  return c.json(response);
});

export default adminRouter;
