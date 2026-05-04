-- Migration: Add chapter engagement tracking (views, likes, dislikes)

CREATE TABLE chapter_engagements (
    chapter_id INTEGER NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    dislikes INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (chapter_id),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE INDEX idx_chapter_engagements_chapter_id ON chapter_engagements(chapter_id);
