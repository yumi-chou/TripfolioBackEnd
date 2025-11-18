const { db } = require('../config/db');
const { users } = require('../models/usersSchema');
const { schedules } = require('../models/scheduleSchema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');
const validatePassword = require('../utils/validatePassword');
const HTTP = require('../constants/httpStatus');

exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      gender: users.gender,
      phone: users.phone,
      email: users.email,
      birthday: users.birthday,
      avatar: users.avatar,
      isPremium: users.isPremium,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!result.length) {
    return res.status(HTTP.NOT_FOUND).json({ error: '會員不存在' });
  }

  return res.json(result[0]);
};

exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, gender, phone, birthday } = req.body;

  const existing = await db.select().from(users).where(eq(users.id, userId));

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (gender !== undefined) updateData.gender = gender;
  if (phone !== undefined) updateData.phone = phone;
  if (birthday !== undefined && birthday !== '') updateData.birthday = birthday;

  try {
    if (existing.length === 0) {
      const result = await db
        .insert(users)
        .values({
          id: userId,
          ...updateData,
        })
        .returning();
      return res.json(result[0]);
    }

    const result = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return res.json(result[0]);
  } catch (err) {
    return res.status(HTTP.INTERNAL_SERVER_ERROR).json({ error: '資料庫錯誤，請稍後再試' });
  }
};

exports.uploadAvatar = async (req, res) => {
  const userId = req.user.id;
  const fileUrl = req.file.location;

  await db.update(users).set({ avatar: fileUrl }).where(eq(users.id, userId));
  return res.json({ message: '上傳成功', path: fileUrl });
};

exports.updateUserPassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  const result = await db.select().from(users).where(eq(users.id, userId));
  const user = result[0];

  if (!user) {
    return res.status(HTTP.NOT_FOUND).json({ message: '會員不存在' });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(HTTP.BAD_REQUEST).json({ message: '舊密碼輸入錯誤' });
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(HTTP.BAD_REQUEST).json({ error: passwordError });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  return res.json({ message: '密碼更新成功' });
};

exports.isPremium = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(HTTP.FORBIDDEN).json({ message: '尚未登入' });
  }

  try {
    const user = await db.select().from(users).where(eq(users.id, userId));
    const isPremium = user[0]?.isPremium;

    const scheduleCounts = await db.select().from(schedules).where(eq(schedules.userId, userId));

    const requiresPayment = !isPremium && scheduleCounts.length >= 1;

    return res.status(HTTP.OK).json({
      requiresPayment,
      isPremium,
      scheduleCount: scheduleCounts.length,
    });
  } catch (err) {
    return res.status(HTTP.INTERNAL_SERVER_ERROR).json({ message: '查詢失敗', error: err.message });
  }
};
