var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { Notification } = require("../models");

const multer = require('multer');
var path = require('path');

const TypedError = require('../modules/ErrorHandler')

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/uploads/');
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// GET /notifications
router.get('/', ensureAuthenticated, async function (req, res, next) {
  await Notification.findAll()
    .then(notifications => {
      res.status(201).json(notifications);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/add', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('title', 'タイトルは必須です。').notEmpty();
  req.checkBody('content', 'コンテンツは必要です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    throw err;
  }
  await Notification.create(data)
    .then(notification => {
      res.status(201).json(notification);
    })
    .catch(err => {
      throw err;
    })
})

router.get('/:notificationId/item', async function (req, res, next) {
  const notificationId = req.params.notificationId;
  await Notification.findOne({ where: { id: notificationId } })
    .then(async notification => {
      res.status(201).json(notification);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/edit', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('title', 'タイトルは必須です。').notEmpty();
  req.checkBody('content', 'コンテンツは必要です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    return next(err)
  }
  await Notification.findOne({ where: { id: data.id } })
    .then(async (notification) => {
      await notification.update({
        title: data.title,
        content: data.content
      });
      res.status(201).json(notification);
    })
    .catch(err => {
      throw err;
    })
})

router.post('/:notificationId/image', ensureAuthenticated, upload.single('image'), async (req, res) => {
  const notificationId = req.params.notificationId;
  const imagePath = path.join(__dirname, req.file.path);
  await Notification.findOne({ where: { id: notificationId } })
    .then(notification => {
      notification.update({ image: `uploads/${req.file.filename}` });
      res.json({ imageUrl: `uploads/${req.file.filename}` });
    })
    .catch(err => {
      throw err;
    })
})

router.get('/:notificationId/delete', ensureAuthenticated, async function (req, res, next) {
  let notificationId = req.params.notificationId;
  await Notification.destroy({
    where: {
      id: notificationId
    }
  })
    .then(async () => {
      await Notification.findAll()
        .then(notifications => {
          res.status(201).json(notifications);
        })
    })
    .catch(err => {
      return next(err);
    })
})

module.exports = router;
