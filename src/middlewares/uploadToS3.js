const path = require('path');
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3');

function createS3Uploader(prefix) {
  const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;

  console.log('[S3-UPLOAD:init]', { bucket, region: s3.config && s3.config.region, prefix });

  const storage = multerS3({
    s3,
    bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = path.extname(file.originalname || '');
      const key = `${prefix}-${Date.now()}${ext}`;
      console.log('[S3-UPLOAD:put]', { bucket, key, mimetype: file.mimetype, originalname: file.originalname });
      cb(null, key);
    },
  });

  const uploader = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!/^image\//.test(file.mimetype)) {
        const err = new Error('ONLY_IMAGE_ALLOWED');
        err.code = 'ONLY_IMAGE_ALLOWED';
        return cb(err);
      }
      cb(null, true);
    },
  });

  return uploader;
}

module.exports = createS3Uploader;
