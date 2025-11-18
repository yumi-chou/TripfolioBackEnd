const { eq, desc } = require('drizzle-orm');
const { db } = require('../config/db');
const { schedules } = require('../models/scheduleSchema');
const HTTP = require('../constants/httpStatus');

const getSchedules = async (req, res) => {
  try {
    const userId = req.user.id;
    const scheduleList = await db
      .select({
        id: schedules.id,
        userId: schedules.userId,
        title: schedules.title,
        startDate: schedules.startDate,
        endDate: schedules.endDate,
        description: schedules.description,
        coverURL: schedules.coverURL,
        createdAt: schedules.createdAt,
      })
      .from(schedules)
      .where(eq(schedules.userId, userId))
      .orderBy(desc(schedules.createdAt));

    res.json({ schedules: scheduleList });
  } catch (err) {

    res.status(HTTP.INTERNAL_SERVER_ERROR).json({ message: '取得行程失敗', error: err.message });
  }
};
module.exports = { getSchedules };
