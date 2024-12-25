var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { Badge, sequelize } = require("../models");

// GET /badges
router.get('/', ensureAuthenticated, async function (req, res, next) {
  await Badge.findAll()
    .then(badges => {
      res.status(201).json(badges);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/add', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('text', 'テキストは必須です。').notEmpty();
  req.checkBody('color', 'バックカラーは必要です。').notEmpty();
  req.checkBody('font_color', 'フォントカラーは必要です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    throw err;
    return next(err)
  }
  await Badge.create(data)
    .then(badge => {
      res.status(201).json(badge);
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

router.get('/:badgeId/item', async function (req, res, next) {
  const badgeId = req.params.badgeId;
  await Badge.findOne({ where: { id: badgeId } })
    .then(async badge => {
      res.status(201).json(badge);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/edit', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('text', 'テキストは必須です。').notEmpty();
  req.checkBody('color', 'バックカラーは必要です。').notEmpty();
  req.checkBody('font_color', 'フォントカラーは必要です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    return next(err)
  }
  await Badge.findOne({ where: { id: data.id } })
    .then(async (badge) => {
      await badge.update({
        text: data.text,
        color: data.color,
        font_color: data.font_color
      });
      res.status(201).json(badge);
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

router.get('/:badgeId/delete', ensureAuthenticated, async function (req, res, next) {
  let badgeId = req.params.badgeId;
  await Badge.destroy({
    where: {
      id: badgeId
    }
  })
    .then(async () => {
      await Badge.findAll()
        .then(badges => {
          res.status(201).json(badges);
        })
    })
    .catch(err => {
      return next(err);
    })
})

module.exports = router;
