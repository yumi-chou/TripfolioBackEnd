const { db } = require('../config/db');
const { posts } = require('../models/postsSchema');
const { schedules } = require('../models/scheduleSchema');
const { users } = require('../models/usersSchema');
const { eq, and, desc } = require('drizzle-orm');
const HTTP = require('../constants/httpStatus');
const { comments } = require('../models/commentsSchema');
const { favorites } = require('../models/favoritesSchema');
const { sql } = require('drizzle-orm');

async function createCommunityPost(req, res) {
  try {
    const memberId = req.user.id;
    const { scheduleId, content } = req.body;
    const coverURL = req.file?.location || req.body.coverURL || null;

    const result = await db.insert(posts).values({
      memberId,
      scheduleId: Number(scheduleId),
      content,
      coverURL,
      createdAt: new Date(),
    });

    return res.status(HTTP.CREATED).json({
      success: true,
      message: '社群貼文已建立',
      result,
    });
  } catch (err) {

    return res.status(HTTP.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '建立貼文失敗',
      error: err.message,
    });
  }
}

async function getAllCommunityPosts(req, res) {
  try {
    const allPosts = await db
      .select({
        postId: posts.id,
        memberId: posts.memberId, 
        content: posts.content,
        coverURL: posts.coverURL,
        createdAt: posts.createdAt,
        scheduleTitle: schedules.title,
        authorName: users.name,
        authorAvatar: users.avatar,
      })
      .from(posts)
      .leftJoin(schedules, eq(posts.scheduleId, schedules.id))
      .leftJoin(users, eq(posts.memberId, users.id))
      .orderBy(desc(posts.createdAt));

    const postIds = allPosts.map((p) => p.postId);

    const commentCounts = await db
      .select({
        postId: comments.postId,
        count: sql`COUNT(*)`.as('count'),
      })
      .from(comments)
      .where(sql`${comments.postId} = ANY(${sql.array(postIds)})`)
      .groupBy(comments.postId);

    const favoriteCounts = await db
      .select({
        postId: favorites.postId,
        count: sql`COUNT(*)`.as('count'),
      })
      .from(favorites)
      .where(sql`${favorites.postId} = ANY(${sql.array(postIds)})`)
      .groupBy(favorites.postId);

    const commentMap = Object.fromEntries(commentCounts.map((c) => [c.postId, Number(c.count)]));
    const favoriteMap = Object.fromEntries(favoriteCounts.map((f) => [f.postId, Number(f.count)]));

    const enrichedPosts = allPosts.map((post) => ({
      ...post,
      commentCount: commentMap[post.postId] || 0,
      favoriteCount: favoriteMap[post.postId] || 0,
    }));

    return res.json({ posts: enrichedPosts });
  } catch (err) {

    return res.status(HTTP.INTERNAL_SERVER_ERROR).json({
      message: '取得貼文失敗',
      error: err.message,
    });
  }
}

async function updateCommunityPost(req, res) {
  try {
    const postId = Number(req.params.id);
    const { content, coverURL } = req.body;

    const [existingPost] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!existingPost) {
      return res.status(HTTP.NOT_FOUND).json({
        success: false,
        message: '找不到貼文',
      });
    }

    const finalCoverURL = req.file?.location || coverURL || existingPost.coverURL;

    await db
      .update(posts)
      .set({
        content,
        coverURL: finalCoverURL,
      })
      .where(eq(posts.id, postId));

    return res.json({
      success: true,
      message: '貼文已更新',
    });
  } catch (err) {
    return res.status(HTTP.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '更新失敗',
      error: err.message,
    });
  }
}

async function deleteCommunityPost(req, res) {
  try {
    const memberId = req.user.id;
    const postId = Number(req.params.id);

    const result = await db
      .delete(posts)
      .where(and(eq(posts.id, postId), eq(posts.memberId, memberId)));

    return res.json({
      success: true,
      message: '社群貼文已刪除',
      result,
    });
  } catch (err) {
    return res.status(HTTP.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '刪除貼文失敗',
      error: err.message,
    });
  }
}

module.exports = {
  createCommunityPost,
  getAllCommunityPosts,
  updateCommunityPost,
  deleteCommunityPost,
};
