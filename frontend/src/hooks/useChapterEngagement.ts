import { useState, useCallback } from 'react';
import type { ChapterEngagement } from '../api';
import { likeChapter, unlikeChapter, dislikeChapter, undislikeChapter } from '../api';

const LIKED_KEY = 'opennovel-liked-chapters';
const DISLIKED_KEY = 'opennovel-disliked-chapters';

function loadSet(key: string): Set<number> {
  try {
    const data = localStorage.getItem(key);
    if (!data) return new Set();
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<number>): void {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export function useChapterEngagement(
  novelId: number | undefined,
  chapterId: number | undefined,
  initialEngagement: ChapterEngagement | null | undefined
) {
  const [engagement, setEngagement] = useState<ChapterEngagement | null>(initialEngagement ?? null);
  const [likedSet, setLikedSet] = useState<Set<number>>(() => loadSet(LIKED_KEY));
  const [dislikedSet, setDislikedSet] = useState<Set<number>>(() => loadSet(DISLIKED_KEY));
  const [loading, setLoading] = useState(false);

  const isLiked = chapterId !== undefined ? likedSet.has(chapterId) : false;
  const isDisliked = chapterId !== undefined ? dislikedSet.has(chapterId) : false;

  const updateEngagement = useCallback((data: ChapterEngagement) => {
    setEngagement(data);
  }, []);

  const toggleLike = useCallback(async () => {
    if (!novelId || !chapterId || loading) return;
    setLoading(true);
    try {
      if (isLiked) {
        const result = await unlikeChapter(novelId, chapterId);
        if (result.success && result.data) {
          setEngagement(result.data);
          const newSet = new Set(likedSet);
          newSet.delete(chapterId);
          setLikedSet(newSet);
          saveSet(LIKED_KEY, newSet);
        }
      } else {
        if (isDisliked) {
          const undislikeResult = await undislikeChapter(novelId, chapterId);
          if (undislikeResult.success && undislikeResult.data) {
            setEngagement(undislikeResult.data);
            const newDislikedSet = new Set(dislikedSet);
            newDislikedSet.delete(chapterId);
            setDislikedSet(newDislikedSet);
            saveSet(DISLIKED_KEY, newDislikedSet);
          }
        }
        const result = await likeChapter(novelId, chapterId);
        if (result.success && result.data) {
          setEngagement(result.data);
          const newSet = new Set(likedSet);
          newSet.add(chapterId);
          setLikedSet(newSet);
          saveSet(LIKED_KEY, newSet);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [novelId, chapterId, isLiked, isDisliked, likedSet, dislikedSet, loading]);

  const toggleDislike = useCallback(async () => {
    if (!novelId || !chapterId || loading) return;
    setLoading(true);
    try {
      if (isDisliked) {
        const result = await undislikeChapter(novelId, chapterId);
        if (result.success && result.data) {
          setEngagement(result.data);
          const newSet = new Set(dislikedSet);
          newSet.delete(chapterId);
          setDislikedSet(newSet);
          saveSet(DISLIKED_KEY, newSet);
        }
      } else {
        if (isLiked) {
          const unlikeResult = await unlikeChapter(novelId, chapterId);
          if (unlikeResult.success && unlikeResult.data) {
            setEngagement(unlikeResult.data);
            const newLikedSet = new Set(likedSet);
            newLikedSet.delete(chapterId);
            setLikedSet(newLikedSet);
            saveSet(LIKED_KEY, newLikedSet);
          }
        }
        const result = await dislikeChapter(novelId, chapterId);
        if (result.success && result.data) {
          setEngagement(result.data);
          const newSet = new Set(dislikedSet);
          newSet.add(chapterId);
          setDislikedSet(newSet);
          saveSet(DISLIKED_KEY, newSet);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [novelId, chapterId, isLiked, isDisliked, likedSet, dislikedSet, loading]);

  return {
    engagement,
    isLiked,
    isDisliked,
    loading,
    toggleLike,
    toggleDislike,
    updateEngagement,
  };
}
