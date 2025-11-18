const { db } = require("../config/db");
const { trafficData } = require('../models/trafficData');
const { eq , and } = require('drizzle-orm');
const HTTP = require('../constants/httpStatus');

async function addTrafficData(req, res) {
  try {
    const {
      itineraryId,
      fromPlaceId,
      toPlaceId,
      transportMode,
      duration,
      distance
    } = req.body;

    const exists = await db
      .select()
      .from(trafficData)
      .where(
        and(
          eq(trafficData.itineraryId, Number(itineraryId)),
          eq(trafficData.fromPlaceId, Number(fromPlaceId)),
          eq(trafficData.toPlaceId, Number(toPlaceId))
        )
      );

    if (exists.length > 0) {
      return res.status(HTTP.OK).json({
        success: false,
        message: '資料已存在'
      });
    }

    const [result] = await db
      .insert(trafficData)
      .values({
        itineraryId,
        fromPlaceId,
        toPlaceId,
        transportMode,
        duration,
        distance
      })
      .returning();

    return res.status(HTTP.CREATED).json({ success: true, data: result });
  } catch (err) {
    return res.status(HTTP.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
  }
}

async function getTrafficData(req, res) {
  try {
    const { itineraryId } = req.query;

    if (!itineraryId || isNaN(Number(itineraryId))) {
      return res.status(HTTP.BAD_REQUEST).json({ success: false, message: "缺少或無效的 itineraryId" });
    }

    const result = await db
      .select()
      .from(trafficData)
      .where(eq(trafficData.itineraryId, Number(itineraryId)));  

    return res.json({ success: true, data: result });
  } catch (err) {

    return res.status(HTTP.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
  }
}

async function deleteTrafficData(req, res) {
  try {
    const { itineraryId, fromPlaceId, toPlaceId } = req.query;

    if (!itineraryId || !fromPlaceId || !toPlaceId) {
      return res.status(HTTP.BAD_REQUEST).json({ error: "缺少必要參數" });
    }

    await db.delete(trafficData).where(
      and(
        eq(trafficData.itineraryId, Number(itineraryId)),
        eq(trafficData.fromPlaceId, Number(fromPlaceId)),
        eq(trafficData.toPlaceId, Number(toPlaceId))
      )
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(HTTP.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
}

module.exports = {
  addTrafficData,
  getTrafficData,
  deleteTrafficData,
};