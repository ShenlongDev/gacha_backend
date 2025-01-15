var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { Header, sequelize } = require("../models");

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

// GET /headers
router.get('/', ensureAuthenticated, async function (req, res, next) {
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  await Header.findAll()
    .then(headers => {
      res.status(200).json({
        data: headers.slice(startIndex, endIndex),
        currentPage: parseInt(pageNumber),
        totalPages: Math.ceil(headers.length / pageSize),
        totalRecords: headers.length
      });
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
})

router.get('/all', async function (req, res, next) {
  await Header.findAll()
    .then(headers => {
      res.status(200).json(headers);
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/:headerId/item', async function (req, res, next) {
  const headerId = req.params.headerId;
  await Header.findOne({ where: { id: headerId } })
    .then(async header => {
      res.status(200).json(header);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/edit', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  // req.checkBody('name', '景品名は必須です。').notEmpty();
  // req.checkBody('stock', '景品在庫は必須です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    return next(err)
  }
  await Header.findOne({ where: { id: data.id } })
    .then(async (header) => {
      await header.update({
        // name: data.name,
        image: data.image,
        // stock: data.stock
      });
      res.status(200).json(header);
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
})

router.post('/add', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  // req.checkBody('name', '景品名は必須です。').notEmpty();
  // req.checkBody('stock', '景品在庫は必須です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    console.log(err);
    return next(err)
  }
  await Header.create(data)
    .then(header => {
      res.status(201).json(header);
    })
    .catch(err => {
      console.log(err);
    })
})

router.post('/:headerId/image', ensureAuthenticated, upload.single('image'), async (req, res) => {
  const headerId = req.params.headerId;
  const imagePath = path.join(__dirname, req.file.path);
  await Header.findOne({ where: { id: headerId } })
    .then(header => {
      header.update({ image: `uploads/${req.file.filename}` });
      res.json({ imageUrl: `uploads/${req.file.filename}` });
    })
    .catch(err => {
      console.log(err);
    })
});

router.get('/:headerId/delete', ensureAuthenticated, async function (req, res, next) {
  let headerId = req.params.headerId;
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  
  await Header.destroy({
    where: {
      id: headerId
    }
  })
    .then(async () => {
      await Header.findAll()
        .then(headers => {
          res.status(200).json({
            data: headers.slice(startIndex, endIndex),
            currentPage: parseInt(pageNumber),
            totalPages: Math.ceil(headers.length / pageSize),
            totalRecords: headers.length
          });
        })
    })
    .catch(err => {
      return next(err);
    })
})


module.exports = router;
