var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { GachaUser, sequelize } = require("../models");

// GET /gifts
// router.get('/', ensureAuthenticated, async function (req, res, next) {
router.get('/', async function (req, res, next) {
  console.log('get all gacha users!');
  await GachaUser.findAll()
    .then(gachaUsers => {
      console.log(gachaUsers);
      res.status(200).json(gachaUsers);
    })
    .catch(err => {
      return next(err);
    })
})

module.exports = router;
