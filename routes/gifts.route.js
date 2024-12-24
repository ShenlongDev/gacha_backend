var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { Gift, sequelize } = require("../models");

// GET /gifts
router.get('/', ensureAuthenticated, async function (req, res, next) {
  console.log(req.params)
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
      res.status(201).json(gift);
    })
    .catch(err => {
      return next(err);
    })
})

module.exports = router;
