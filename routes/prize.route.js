var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { Prize, sequelize } = require("../models");

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

// GET /prizes
router.get('/', ensureAuthenticated, async function (req, res, next) {
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  await Prize.findAll()
    .then(prizes => {
      res.status(200).json({
        data: prizes.slice(startIndex, endIndex),
        currentPage: parseInt(pageNumber),
        totalPages: Math.ceil(prizes.length / pageSize),
        totalRecords: prizes.length
      });
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
})

router.get('/all', ensureAuthenticated, async function (req, res, next) {
  await Prize.findAll()
    .then(prizes => {
      res.status(200).json(prizes);
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/:prizeId/item', async function (req, res, next) {
  const prizeId = req.params.prizeId;
  await Prize.findOne({ where: { id: prizeId } })
    .then(async prize => {
      res.status(200).json(prize);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/edit', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('name', '景品名は必須です。').notEmpty();
  // req.checkBody('stock', '景品在庫は必須です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    return next(err)
  }
  await Prize.findOne({ where: { id: data.id } })
    .then(async (prize) => {
      await prize.update({
        name: data.name,
        image: data.image,
        // stock: data.stock
      });
      res.status(200).json(prize);
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
})

router.post('/add', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('name', '景品名は必須です。').notEmpty();
  // req.checkBody('stock', '景品在庫は必須です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    console.log(err);
    return next(err)
  }
  await Prize.create(data)
    .then(prize => {
      res.status(201).json(prize);
    })
    .catch(err => {
      console.log(err);
    })
})

router.post('/:prizeId/image', ensureAuthenticated, upload.single('image'), async (req, res) => {
  const prizeId = req.params.prizeId;
  const imagePath = path.join(__dirname, req.file.path);
  await Prize.findOne({ where: { id: prizeId } })
    .then(prize => {
      prize.update({ image: `uploads/${req.file.filename}` });
      res.json({ imageUrl: `uploads/${req.file.filename}` });
    })
    .catch(err => {
      console.log(err);
    })
});

router.get('/:prizeId/delete', ensureAuthenticated, async function (req, res, next) {
  let prizeId = req.params.prizeId;
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  
  await Prize.destroy({
    where: {
      id: prizeId
    }
  })
    .then(async () => {
      await Prize.findAll()
        .then(prizes => {
          res.status(200).json({
            data: prizes.slice(startIndex, endIndex),
            currentPage: parseInt(pageNumber),
            totalPages: Math.ceil(prizes.length / pageSize),
            totalRecords: prizes.length
          });
        })
    })
    .catch(err => {
      return next(err);
    })
})


module.exports = router;
