var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { GachaUser } = require("../models");

// GET /gifts
router.get('/', ensureAuthenticated, async function (req, res, next) {
  await GachaUser.findAll()
    .then(gachaUsers => {
      res.status(200).json(gachaUsers);
    })
    .catch(err => {
      return next(err);
    })
})

module.exports = router;
