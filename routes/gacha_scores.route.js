var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { GachaScore, sequelize } = require("../models");
const { Op } = require('sequelize');


router.get('/', ensureAuthenticated, async function (req, res, next) {
    const pageNumber = req.query.page || 1;
    const pageSize = req.query.limit || 10;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = pageNumber * pageSize;

    await GachaScore.findAll()
        .then(gachaScores => {
            res.status(201).json({
                data: gachaScores.slice(startIndex, endIndex),
                currentPage: parseInt(pageNumber),
                totalPages: Math.ceil(gachaScores.length / pageSize),
                totalRecords: gachaScores.length
            });
        })
        .catch(err => {
            return next(err);
        })
})

router.post('/:status', ensureAuthenticated, async function (req, res, next) {
    const { status } = req.params;
    const { ids } = req.body;
    // if (!ids || !Array.isArray(ids)) {
    //     return res.status(400).json({ message: 'Invalid or no IDs provided.' });
    // }
    // const idsArray = ids.split(',').map(id => id.trim());

    await GachaScore.update(
        { status: status },
        { where: { id: { [Op.in]: ids } } } // Update based on the same IDs
    )
        .then(gachaScores => {
            res.status(200).json({ message: 'Status updated successfully!' });
        })
        .catch(err => {
            return next(err);
        })
})

// router.get('/:badgeId/item', async function (req, res, next) {
//   const badgeId = req.params.badgeId;
//   await Badge.findOne({ where: { id: badgeId } })
//     .then(async badge => {
//       res.status(201).json(badge);
//     })
//     .catch(err => {
//       return next(err);
//     })
// })

// router.post('/edit', ensureAuthenticated, async function (req, res, next) {
//   let data = req.body;
//   req.checkBody('text', 'テキストは必須です。').notEmpty();
//   req.checkBody('color', 'バックカラーは必要です。').notEmpty();
//   req.checkBody('font_color', 'フォントカラーは必要です。').notEmpty();
//   let missingFieldErrors = req.validationErrors();
//   if (missingFieldErrors) {
//     let err = new TypedError('register error', 400, 'missing_field', {
//       errors: missingFieldErrors,
//     })
//     return next(err)
//   }
//   await Badge.findOne({ where: { id: data.id } })
//     .then(async (badge) => {
//       await badge.update({
//         text: data.text,
//         color: data.color,
//         font_color: data.font_color
//       });
//       res.status(201).json(badge);
//     })
//     .catch(err => {
//       throw err;
//       return next(err);
//     })
// })

// router.get('/:badgeId/delete', ensureAuthenticated, async function (req, res, next) {
//   let badgeId = req.params.badgeId;
//   await Badge.destroy({
//     where: {
//       id: badgeId
//     }
//   })
//     .then(async () => {
//       await Badge.findAll()
//         .then(badges => {
//           res.status(201).json(badges);
//         })
//     })
//     .catch(err => {
//       return next(err);
//     })
// })

module.exports = router;
