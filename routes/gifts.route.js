var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { Gift, GachaScore, GachaUser, User, sequelize } = require("../models");

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
  const pageSize = req.query.limit || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  await Gift.findAll()
    .then(gifts => {
      res.status(200).json({
        data: gifts.slice(startIndex, endIndex),
        currentPage: parseInt(pageNumber),
        totalPages: Math.ceil(gifts.length / pageSize),
        totalRecords: gifts.length
      });
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
})

router.get('/all', ensureAuthenticated, async function (req, res, next) {
  await Gift.findAll()
    .then(gifts => {
      res.status(200).json(gifts);
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/:giftId/item', async function (req, res, next) {
  const giftId = req.params.giftId;
  await Gift.findOne({ where: { id: giftId } })
    .then(async gift => {
      res.status(200).json(gift);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/edit', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('name', 'ギフト名は必須です。').notEmpty();
  req.checkBody('point', 'ギフトポイントは必須です。').notEmpty();
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
      res.status(200).json(gift);
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
})

router.post('/add', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('name', 'ギフト名は必須です。').notEmpty();
  req.checkBody('point', 'ギフトポイントは必須です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    console.log(err);
    return next(err)
  }
  await Gift.create(data)
    .then(gift => {
      res.status(201).json(gift);
    })
    .catch(err => {
      console.log(err);
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
      console.log(err);
    })
});

router.get('/:giftId/delete', ensureAuthenticated, async function (req, res, next) {
  let giftId = req.params.giftId;
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 10;
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
          res.status(200).json({
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

// router.get('/deliveries', ensureAuthenticated, async function (req, res, next) {
//   const pageNumber = req.query.page || 1;
//   const pageSize = req.query.limit || 10;
//   const startIndex = (pageNumber - 1) * pageSize;
//   const endIndex = pageNumber * pageSize;
//   await GachaScore.findAll()
//     .then(gachaScores => {
//       res.status(200).json({
//         data: gachaScores.slice(startIndex, endIndex),
//         currentPage: parseInt(pageNumber),
//         totalPages: Math.ceil(gachaScores.length / pageSize),
//         totalRecords: gachaScores.length
//       });
//     })
//     .catch(err => {
//       return next(err);
//     })
// })

// router.get('/deliveries', ensureAuthenticated, async function (req, res, next) {
//   try {
//     const pageNumber = req.query.page || 1;
//     const pageSize = req.query.limit || 10;
//     const startIndex = (pageNumber - 1) * pageSize;
//     const endIndex = pageNumber * pageSize;

//     await GachaUser.findAll({
//       attributes: [
//         'user_id',
//         [sequelize.fn('COUNT', sequelize.col('id')), 'gacha_cnt'],
//         [sequelize.fn('SUM', sequelize.col('gift_info')), 'gift_cnt'],
//         [sequelize.fn('SUM', sequelize.col('gift_point')), 'totalGiftPoints']
//       ],
//       group: ['user_id'],
//       raw: true // Return plain JSON objects
//     })
//       .then(gachaUsers => {
//         console.log(gachaUsers);
//         res.status(200).json({
//           data: gachaUsers.slice(startIndex, endIndex),
//           currentPage: parseInt(pageNumber),
//           totalPages: Math.ceil(gachaUsers.length / pageSize),
//           totalRecords: gachaUsers.length
//         });
//       })
//       .catch(err => {
//         console.log("Whoops! This is an error.", err);
//         return next(err);
//       });
//   } catch (err) {
//     console.log("Whoops! This is an error1.", err);
//     return next(err);
//   }
// });



module.exports = router;
