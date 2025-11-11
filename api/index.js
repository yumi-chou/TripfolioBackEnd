require('dotenv').config();
const path = require('path');

const express = require('express');
const cors = require('cors');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const passport = require('passport');


require(path.join(__dirname, '..', 'src', 'middlewares', 'passport.js'));

const app = express();


app.set('trust proxy', 1);

let swaggerDocument = null;
try {
  const swaggerPath = path.join(__dirname, '..', 'swagger.yaml');
  swaggerDocument = YAML.load(swaggerPath);
} catch (e) {
  console.warn('[swagger] load failed:', e.message);
}

const envOrigins = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || process.env.VITE_API_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...envOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.LINEPAY_RETURN_HOST,
].filter(Boolean));

const corsOptions = {
  origin(origin, callback) {

    if (!origin) return callback(null, true);

    const ok =
      allowedOrigins.has(origin) ||
      /\.trycloudflare\.com$/.test(new URL(origin).hostname);

    return ok ? callback(null, true) : callback(new Error('Not allowed by CORS: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(passport.initialize());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

if (swaggerDocument) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}


const r = p => path.join(__dirname, '..', 'src', 'routes', p);

app.use('/api/signup', require(r('authRoutes')));
app.use('/api/login', require(r('loginRoutes')));
app.use('/auth', require(r('oAuthRoute')));
app.use('/api', require(r('protectedRoutes')));
app.use('/api/profile', require(r('profileRoutes')));
app.use('/api/itinerary', require(r('itinerary')));
app.use('/api/itineraryTime', require(r('arriveItinerary')));
app.use('/api/travelSchedule', require(r('scheduleRoutes')));
app.use('/api/updateScheduleRoutes', require(r('updateScheduleRoutes')));
app.use('/api/email-preferences', require(r('emailPreferencesRoute')));
app.use('/api/community', require(r('communityRoutes')));
app.use('/api/tripShares', require(r('tripSharesRoute')));
app.use('/api/allposts', require(r('postsRoute')));
app.use('/api/post', require(r('commentsRoutes')));
app.use('/api/favorites', require(r('favoritesRoute')));
app.use('/api/payment', require(r('paymentRoutes')));
app.use('/api/linepay', require(r('linePayRoutes')));
app.use('/api/traffic', require(r('trafficData')));


app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend is alive 🚀' });
});

module.exports = app;


if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[local] Server running at http://localhost:${PORT}`);
  });
}
