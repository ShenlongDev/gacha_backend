var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { Gift, sequelize } = require("../models");

// GET /gifts
router.get('/', ensureAuthenticated, async function (req, res, next) {
  console.log('get all gifts!');
  await Gift.findAll()
    .then(gifts => {
      console.log(gifts);
      res.status(200).json(gifts);
    })
    .catch(err => {
      return next(err);
    })
})

module.exports = router;
