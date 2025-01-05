var express = require('express');
var router = express.Router();
const ensureAuthenticated = require('../modules/ensureAuthenticated');
const { Coupon, User, sequelize } = require("../models");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const sendEmail = require('../emailService');

function randomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

// GET /coupons
router.get('/', ensureAuthenticated, async function (req, res, next) {
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  await Coupon.findAll({
    include: [
      {
        model: User,
        require: false,
      }
    ]
  })
    .then(coupons => {
      res.status(200).json({
        data: coupons.slice(startIndex, endIndex),
        currentPage: parseInt(pageNumber),
        totalPages: Math.ceil(coupons.length / pageSize),
        totalRecords: coupons.length
      });
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
})

router.get('/all', ensureAuthenticated, async function (req, res, next) {
  await Coupon.findAll()
    .then(coupons => {
      res.status(200).json(coupons);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/add', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  // req.checkBody('text', 'クーポン名は必須です。').notEmpty();
  req.checkBody('user_id', 'クーポンユーザーは必要です。').notEmpty();
  req.checkBody('expire', 'クーポン有効期間は必要です。').notEmpty();
  
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    return next(err)
  }
  data.text = randomString(10);

  await Coupon.create(data)
    .then(async coupon => {
      
      await User.findByPk(coupon.user_id)
      .then(async user => {
        
        const transporter = nodemailer.createTransport({
          host: process.env.MAIL_HOST,
          port: process.env.MAIL_PORT,
          secure: false, // Use true for port 465
          auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
          },
        });
  
        const mailOptions = {
          // from: 'GachaX <no-reply@yourapp.com>',
          from: `GachaX <${process.env.MAIL_USERNAME}>`,
          to: user.email,
          subject: 'クーポンのお知らせ',
          text: `下記のコードからクーポンを確認してください。`,
          html: `<p>クーポンコード：${coupon.text}</p>
                <p>上記クーポンの有効期間は：${coupon.expire}　までです。</p>`,
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json(coupon);
      })
    })
    .catch(err => {
      throw err;
    })
})

router.get('/:couponId/delete', ensureAuthenticated, async function (req, res, next) {
  let couponId = req.params.couponId;
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  await Coupon.destroy({
    where: {
      id: couponId
    }
  })
    .then(async () => {
      await Coupon.findAll({
        include: [
          {
            model: User,
            require: false,
          }
        ]
      })
        .then(coupons => {
          res.status(200).json({
            data: coupons.slice(startIndex, endIndex),
            currentPage: parseInt(pageNumber),
            totalPages: Math.ceil(coupons.length / pageSize),
            totalRecords: coupons.length
          });
        })
    })
    .catch(err => {
      return next(err);
    })
})

router.post('alert/coupon', async (req, res) => {
  // Send reset link via email
  
})

module.exports = router;
