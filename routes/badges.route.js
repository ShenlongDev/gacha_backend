var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { Badge, sequelize } = require("../models");

//GET /badges
// router.get('/badges', ensureAuthenticated, async function (req, res, next) {
router.get('/', async function (req, res, next) {
  // console.log('get all badges');
  await Badge.findAll()
    .then(badges => {
      res.status(200).json(badges);
    })
    .catch(err => {
      return next(err);
    })
})

module.exports = router;
