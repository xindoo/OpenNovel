-- Initial migration for OpenNovel
-- Creates novels and chapters tables

CREATE TABLE novels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    cover_image_key TEXT,
    status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed')),
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Index for category filtering
CREATE INDEX idx_novels_category ON novels(category);

-- Index for sorting by last updated
CREATE INDEX idx_novels_updated_at ON novels(updated_at);

-- Index for title search
CREATE INDEX idx_novels_title ON novels(title);

-- Index for author search
CREATE INDEX idx_novels_author ON novels(author);

CREATE TABLE chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    content_key TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    UNIQUE (novel_id, chapter_number)
);

-- Composite index for ordered chapter listing within a novel
CREATE INDEX idx_chapters_novel_id_chapter_number ON chapters(novel_id, chapter_number);
