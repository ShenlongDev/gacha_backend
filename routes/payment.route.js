var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { Payment, User } = require("../models");

router.get('/all', ensureAuthenticated, async function (req, res, next) {
  await Payment.findAll()
    .then(payments => {
      res.status(200).json(payments);
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/', ensureAuthenticated, async function (req, res, next) {
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 20;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;

  await Payment.findAll({
    include: [
      {
        model: User,
        attributes: ['first_name', 'last_name']
      },
    ]
  })
    .then(payments => {
      res.status(200).json({
        data: payments.slice(startIndex, endIndex),
        currentPage: parseInt(pageNumber),
        totalPages: Math.ceil(payments.length / pageSize),
        totalRecords: payments.length
      });
    })
    .catch(err => {
      console.error(err);
      console.log(err);
    });
})


module.exports = router;
