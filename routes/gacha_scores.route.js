var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { GachaScore, GachaUser, User, Gacha } = require("../models");
const { Op } = require('sequelize');


router.get('/', ensureAuthenticated, async function (req, res, next) {
    const pageNumber = req.query.page || 1;
    const pageSize = req.query.limit || 10;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = pageNumber * pageSize;

    await GachaUser.findAll({
        include: [
            {
                model: User,
                attributes: ['first_name', 'last_name']
            },
            {
                model: Gacha,
                attributes: ['name']
            }
        ]
    })
        .then(gachaUsers => {
            res.status(201).json({
                data: gachaUsers.slice(startIndex, endIndex),
                currentPage: parseInt(pageNumber),
                totalPages: Math.ceil(gachaUsers.length / pageSize),
                totalRecords: gachaUsers.length
            });
        })
        .catch(err => {
            return next(err);
        })
})

router.post('/:status', ensureAuthenticated, async function (req, res, next) {
    const { status } = req.params;
    const { ids } = req.body;

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

router.get('/:gachaUserId', ensureAuthenticated, async function (req, res, next) {
    const gachaUserId = req.params.gachaUserId;
    
    await GachaScore.findAll({ where: { gacha_user_id: gachaUserId } })
        .then(async gachaScores => {
            res.status(201).json(gachaScores);
        })
        .catch(err => {
            return next(err);
        })
})

module.exports = router;
