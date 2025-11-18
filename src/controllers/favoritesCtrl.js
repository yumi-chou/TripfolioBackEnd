const { db } = require('../config/db');
const { favorites } = require('../models/favoritesSchema');
const { posts } = require('../models/postsSchema');
const { users } = require('../models/usersSchema');
const { eq, and, desc } = require('drizzle-orm');
const { schedules } = require('../models/scheduleSchema');
const HTTP = require('../constants/httpStatus');

const addFavorite = async (req, res) => {
  try {
    const { postId, memberId } = req.body;

    const [postExists] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!postExists) {
      return res.status(HTTP.NOT_FOUND).json({ error: '貼文不存在' });
    }

    const [existingFavorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.memberId, memberId), eq(favorites.postId, postId)))
      .limit(1);

    if (existingFavorite) {
      return res.status(HTTP.BAD_REQUEST).json({ error: '已經收藏過此貼文' });
    }

    const [newFavorite] = await db
      .insert(favorites)
      .values({
        memberId,
        postId,
        createdAt: new Date(),
      })
      .returning();

    return res.status(HTTP.CREATED).json({
      message: '收藏成功',
      favorite: newFavorite,
    });
  } catch (err) {
    return res
      .status(HTTP.INTERNAL_SERVER_ERROR)
      .json({ error: '新增收藏失敗', details: err.message });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const { memberId } = req.body;

    const deletedFavorite = await db
      .delete(favorites)
      .where(and(eq(favorites.memberId, memberId), eq(favorites.postId, postId)))
      .returning();

    if (!deletedFavorite.length) {
      return res.status(HTTP.NOT_FOUND).json({ error: '收藏記錄不存在' });
    }

    return res.json({ message: '取消收藏成功' });
  } catch (err) {
    return res
      .status(HTTP.INTERNAL_SERVER_ERROR)
      .json({ error: '移除收藏失敗', details: err.message });
  }
};

const getFavorites = async (req, res) => {
  try {
    const { memberId } = req.params;

    const userFavorites = await db
      .select({
        favoriteId: favorites.id,
        createdAt: favorites.createdAt,
        postId: posts.id,
        postTitle: schedules.title,
        postContent: posts.content,
        postImageUrl: posts.coverURL,
        authorId: posts.memberId,
        authorName: users.name,
        authorAvatar: users.avatar,
      })
      .from(favorites)
      .leftJoin(posts, eq(favorites.postId, posts.id))
      .leftJoin(schedules, eq(posts.scheduleId, schedules.id))
      .leftJoin(users, eq(posts.memberId, users.id))
      .where(eq(favorites.memberId, memberId))
      .orderBy(desc(favorites.createdAt));

    return res.json(userFavorites);
  } catch (err) {
    return res
      .status(HTTP.INTERNAL_SERVER_ERROR)
      .json({ error: '取得收藏列表失敗', details: err.message });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const { memberId } = req.params;

    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.memberId, memberId), eq(favorites.postId, postId)))
      .limit(1);

    return res.json({ isFavorited: !!favorite });
  } catch (err) {
    return res
      .status(HTTP.INTERNAL_SERVER_ERROR)
      .json({ error: '檢查收藏狀態失敗', details: err.message });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
};
