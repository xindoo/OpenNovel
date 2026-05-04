-- Migration: Add novel_id and chapter_number to chapter_engagements

DROP TABLE IF EXISTS chapter_engagements;

CREATE TABLE chapter_engagements (
    novel_id INTEGER NOT NULL,
    chapter_id INTEGER NOT NULL,
    chapter_number INTEGER NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    dislikes INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (novel_id, chapter_id),
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE INDEX idx_chapter_engagements_novel_id ON chapter_engagements(novel_id);
CREATE INDEX idx_chapter_engagements_chapter_id ON chapter_engagements(chapter_id);
