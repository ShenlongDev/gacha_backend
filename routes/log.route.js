var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { Log, User } = require("../models");

// GET /logs
router.get('/', ensureAuthenticated, async function (req, res, next) {
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  await Log.findAll({
    include: [
      {
        model: User,
        attributes: ['first_name', 'last_name']
      }
    ]
  })
    .then(logs => {
      res.status(200).json({
        data: logs.slice(startIndex, endIndex),
        currentPage: parseInt(pageNumber),
        totalPages: Math.ceil(logs.length / pageSize),
        totalRecords: logs.length
      });
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/all', ensureAuthenticated, async function (req, res, next) {
  await Log.findAll()
    .then(logs => {
      res.status(200).json(logs);
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/:userId/all', ensureAuthenticated, async function (req, res, next) {
  const userId = req.params.userId;
  await Log.findAll({
    user_id: userId
  })
    .then(logs => {
      res.status(200).json(logs);
    })
    .catch(err => {
      return next(err);
    })
})

// router.get('/:logId/item', async function (req, res, next) {
//   const logId = req.params.logId;
//   await Log.findOne({ where: { id: logId } })
//     .then(async log => {
//       res.status(200).json(log);
//     })
//     .catch(err => {
//       return next(err);
//     })
// })

// router.post('/edit', ensureAuthenticated, async function (req, res, next) {
//   let data = req.body;
//   req.checkBody('name', 'ギフト名は必須です。').notEmpty();
//   req.checkBody('point', 'ギフトポイントは必要です。').notEmpty();
//   let missingFieldErrors = req.validationErrors();
//   if (missingFieldErrors) {
//     let err = new TypedError('register error', 400, 'missing_field', {
//       errors: missingFieldErrors,
//     })
//     return next(err)
//   }
//   await Log.findOne({ where: { id: data.id } })
//     .then(async (log) => {
//       await log.update({
//         name: data.name,
//         point: data.point,
//         image: data.image
//       });
//       res.status(200).json(log);
//     })
//     .catch(err => {
//       throw err;
//       return next(err);
//     })
// })

// router.post('/add', ensureAuthenticated, async function (req, res, next) {
//   let data = req.body;
//   req.checkBody('name', 'ギフト名は必須です。').notEmpty();
//   req.checkBody('point', 'ギフトポイントは必要です。').notEmpty();
//   let missingFieldErrors = req.validationErrors();
//   if (missingFieldErrors) {
//     let err = new TypedError('register error', 400, 'missing_field', {
//       errors: missingFieldErrors,
//     })
//     throw err;
//     return next(err)
//   }
//   await Log.create(data)
//     .then(log => {
//       res.status(200).json(log);
//     })
//     .catch(err => {
//       throw err;
//       return next(err);
//     })
// })

// router.post('/:logId/image', ensureAuthenticated, upload.single('image'), async (req, res) => {
//   const logId = req.params.logId;
//   const imagePath = path.join(__dirname, req.file.path);
//   await Log.findOne({ where: { id: logId } })
//     .then(log => {
//       log.update({ image: `uploads/${req.file.filename}` });
//       res.json({ imageUrl: `uploads/${req.file.filename}` });
//     })
//     .catch(err => {
//       throw err;
//       return next(err);
//     })
// });

// router.get('/:logId/delete', ensureAuthenticated, async function (req, res, next) {
//   let logId = req.params.logId;
//   const pageNumber = req.query.page || 1;
//   const pageSize = req.query.limit || 5;
//   const startIndex = (pageNumber - 1) * pageSize;
//   const endIndex = pageNumber * pageSize;
//   await Log.destroy({
//     where: {
//       id: logId
//     }
//   })
//     .then(async () => {
//       await Log.findAll()
//         .then(logs => {
//           res.status(200).json({
//             data: logs.slice(startIndex, endIndex),
//             currentPage: parseInt(pageNumber),
//             totalPages: Math.ceil(logs.length / pageSize),
//             totalRecords: logs.length
//           });
//         })
//     })
//     .catch(err => {
//       return next(err);
//     })
// })

module.exports = router;
