const { tripShares } = require('../models/tripSharesSchema');
const { schedules } = require('../models/scheduleSchema');
const { db } = require('../config/db');
const { eq } = require('drizzle-orm');
const { HTTP } = require('../constants/httpStatus');
/**
 * @param {'viewer' | 'editor'} requiredPermission
 */
function verifyShareToken(requiredPermission) {
  return async function (req, res, next) {
    const { token } = req.params;

    if (!token) {
      return res.status(HTTP.BAD_REQUEST).json({ error: 'Token is required' });
    }

    try {
      const sharedTripRows = await db
        .select()
        .from(tripShares)
        .where(eq(tripShares.token, token))
        .limit(1);

      const sharedTrip = sharedTripRows[0];

      if (!sharedTrip) {
        return res.status(HTTP.NOT_FOUND).json({ error: 'Shared trip not found' });
      }

      const tripRows = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, sharedTrip.tripId))
        .limit(1);

      const trip = tripRows[0];

      if (!trip) {
        return res.status(HTTP.NOT_FOUND).json({ error: 'Trip not found' });
      }

      if (!req.user || !req.user.id) {
        return res.status(HTTP.UNAUTHORIZED).json({ error: 'User not authenticated' });
      }

      const userId = req.user.id;

      if (trip.createdBy === userId) {
        req.sharedTrip = {
          tripId: trip.id,
          sharedWithUserId: userId,
          permission: 'owner',
        };
        return next();
      }

      if (sharedTrip.sharedWithUserId !== userId) {
        return res.status(HTTP.FORBIDDEN).json({ error: 'Access denied: not the shared user' });
      }

      if (requiredPermission === 'editor' && sharedTrip.permission !== 'editor') {
        return res.status(HTTP.FORBIDDEN).json({ error: 'Insufficient permission' });
      }

      req.sharedTrip = {
        tripId: sharedTrip.tripId,
        sharedWithUserId: sharedTrip.sharedWithUserId,
        permission: sharedTrip.permission,
      };

      next();
    } catch (error) {
      res.status(HTTP.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
    }
  };
}

module.exports = { verifyShareToken };
