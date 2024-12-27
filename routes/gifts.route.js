var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { Gift } = require("../models");

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

// GET /gifts
router.get('/', ensureAuthenticated, async function (req, res, next) {
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 5;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  await Gift.findAll()
    .then(gifts => {
      res.status(201).json({
        data: gifts.slice(startIndex, endIndex),
        currentPage: parseInt(pageNumber),
        totalPages: Math.ceil(gifts.length / pageSize),
        totalRecords: gifts.length
      });
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/all', ensureAuthenticated, async function (req, res, next) {
  await Gift.findAll()
    .then(gifts => {
      res.status(201).json(gifts);
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/:giftId/item', async function (req, res, next) {
  const giftId = req.params.giftId;
  await Gift.findOne({ where: { id: giftId } })
    .then(async gift => {
      res.status(201).json(gift);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/edit', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('name', 'ギフト名は必須です。').notEmpty();
  req.checkBody('point', 'ギフトポイントは必要です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    return next(err)
  }
  await Gift.findOne({ where: { id: data.id } })
    .then(async (gift) => {
      await gift.update({
        name: data.name,
        point: data.point,
        image: data.image
      });
      res.status(201).json(gift);
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

router.post('/add', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('name', 'ギフト名は必須です。').notEmpty();
  req.checkBody('point', 'ギフトポイントは必要です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    throw err;
    return next(err)
  }
  await Gift.create(data)
    .then(gift => {
      res.status(201).json(gift);
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

router.post('/:giftId/image', ensureAuthenticated, upload.single('image'), async (req, res) => {
  const giftId = req.params.giftId;
  const imagePath = path.join(__dirname, req.file.path);
  await Gift.findOne({ where: { id: giftId } })
    .then(gift => {
      gift.update({ image: `uploads/${req.file.filename}` });
      res.json({ imageUrl: `uploads/${req.file.filename}` });
    })
    .catch(err => {
      throw err;
      return next(err);
    })
});

router.get('/:giftId/delete', ensureAuthenticated, async function (req, res, next) {
  let giftId = req.params.giftId;
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 5;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  await Gift.destroy({
    where: {
      id: giftId
    }
  })
    .then(async () => {
      await Gift.findAll()
        .then(gifts => {
          res.status(201).json({
            data: gifts.slice(startIndex, endIndex),
            currentPage: parseInt(pageNumber),
            totalPages: Math.ceil(gifts.length / pageSize),
            totalRecords: gifts.length
          });
        })
    })
    .catch(err => {
      return next(err);
    })
})

module.exports = router;
