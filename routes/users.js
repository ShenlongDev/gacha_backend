const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
const config = require('../configs/jwt-config')
const ensureAuthenticated = require('../modules/ensureAuthenticated')
var bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const sendEmail = require('../emailService');
const { Payment, User, Address, GachaUser, sequelize, Log } = require("../models");

const multer = require('multer');
var path = require('path');

const TypedError = require('../modules/ErrorHandler')

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/uploads/');
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

const stripe = require('stripe')('sk_test_51QMoCoK7S11jMD7Jcv5KDq2rBGEahS3pD3Di2zjHHsIrIFfW6xHhtLGWNqkobJfAGsBuhsWF3xK3jqlEk3xlbjfi00s7rqbNMp');

function randomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

router.get('/payment', async (req, res) => {

  let Params = req.query;

  let user = await User.findOne({ where: { id: Params.userId } });
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.first_name,
  });

  const { amount, userId, paymentMethodId, cardType } = Params;

  if (cardType == 'card') {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'jpy',
        payment_method: paymentMethodId,
        confirm: true,
        confirmation_method: 'manual',
        customer: customer.id,
        return_url: 'https://gacha-server-2412-enpq.onrender.com/'
      }).then(async () => {
        await Payment.create({ user_id: userId, amount: amount, status: '' })
          .then(async () => {
            if (user) {
              await user.update({
                point: user.point * 1 + amount * 1,
                deposit: user.deposit * 1 + amount * 1
              });
              res.status(201).json({
                point: user.point,
                deposit: user.deposit
              });
            }
          });
      })
        .catch(err => {
          console.log("payment error", err)
          return next(err);
        });
    } catch (error) {
      console.log("catch error", error)
      res.status(500).send({ error: error.message });
    }
  }
});

router.post('/register', async function (req, res, next) {

  let _user = req.body;
  req.checkBody('first_name', 'FirstName is required').notEmpty();
  req.checkBody('last_name', 'LastName is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();

  req.checkBody('email', 'mail error').isEmail();

  let invalidFieldErrors = req.validationErrors();

  if (invalidFieldErrors) {
    return res.json({ error: "mail_type_error" });
  }
 
  User.findOne({ where: { email: _user.email } })
    .then(async (user) => {


      if (user) {
        return res.json({ error: "mail_two_error" });

      } else {


        // bcrypt.genSalt(10, async function (erro, salt) {

        //   await bcrypt.hash(_user.password, salt, function (erro, hash) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        _user.password = hashedPassword;

        let token = jwt.sign(

          { email: _user.email },
          config.secret,
          { expiresIn: '1h' }

        )
        console.log(hashedPassword);

        User.create({ ..._user, _token: token })
          .then(user => {
            return res.json({
              user_id: user.id,
              user_name: user.first_name + ' ' + user.last_name,
              token: token,
              role: user.role,
              expire_in: '1h',
              point: user.point,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              invite_send_code: randomString(10)
            });
          })
          .catch(err => {
            return res.json({ error: "mail_add_error" });
          });
        //   });
        // });
      }
    })
    .catch(err => {
      return res.json({ error: "mail_edit_error" });
    })
});

router.post('/login', async function (req, res, next) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    let err = new TypedError('login error', 400, 'missing_field', { message: "missing email or password" });
    return next(err);
  }
  await User.findOne({ where: { email: email } })
    .then(user => {
      if (!user) {
        let err = new TypedError('login error', 403, 'invalid_field', { message: "Incorrect email or password" });
        return next(err);
      }
      bcrypt.compare(password, user.password, function (err, isMatch) {
        if (err) throw err;
        if (isMatch) {
          let token = jwt.sign(
            { email: email },
            config.secret,
            { expiresIn: '1h' }
          )
          res.status(201).json({
            user_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            avatar: user.avatar,
            email: user.email,
            token: token,
            role: user.role,
            expire_in: '1h',
            point: user.point,
            deposit: user.deposit,
            invite_send_code: user.invite_send_code,
            mile: user.mile,
          })
        }
        else {
          let err = new TypedError('login error', 403, 'password_not_match', { message: "Incorrect  password" })
          return next(err)
        }
      });
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/', ensureAuthenticated, async function (req, res, next) {
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  await User.findAll({ where: { role: { [Op.ne]: 'admin' } } })
    .then(users => {
      res.status(201).json({
        data: users.slice(startIndex, endIndex),
        currentPage: parseInt(pageNumber),
        totalPages: Math.ceil(users.length / pageSize),
        totalRecords: users.length
      });
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/:userId', ensureAuthenticated, async function (req, res, next) {
  const userId = req.params.userId;
  await User.findOne({ where: { id: userId } })
    .then(user => {
      res.status(201).json(user);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/:userId/edit', ensureAuthenticated, async function (req, res, next) {
  req.checkBody('first_name', '姓は必須です。').notEmpty();
  req.checkBody('last_name', '名は必須です。').notEmpty();
  req.checkBody('email', 'メールは必須です。').notEmpty();
  // req.checkBody('kana_first', '姓（カナ）は必須です。').notEmpty();
  // req.checkBody('last_name', '名（カナ）は必須です。').notEmpty();
  // req.checkBody('post_code', '郵便番号は必須です。').notEmpty();
  // req.checkBody('state', '都道府県は必須です。').notEmpty();
  // req.checkBody('address', '住所は必須です。').notEmpty();
  // req.checkBody('phone_number', '電話番号は必須です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    return next(err)
  }
  const userId = req.params.userId;
  await User.findOne({ where: { id: userId } })
    .then(async (user) => {
      if (!user) {
        let err = new TypedError('login error', 403, 'invalid_field', { message: "無効なユーザーIDです。" })
        return next(err)
      }
      else {
        await user.update(req.body);
        res.status(201).json(user);
      }
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/:userId/avatar', ensureAuthenticated, upload.single('image'), async (req, res, next) => {
  const userId = req.params.userId;
  console.log(userId)
  try {
    const imagePath = path.join(__dirname, req.file.path);
    await User.findOne({ where: { id: userId } })
      .then(user => {
        user.update({ avatar: `uploads/${req.file.filename}` });
        res.json({ imageUrl: `uploads/${req.file.filename}` });
      })
      .catch(err => {
        throw err;
      })
  } catch (err) {
    return next(err);
  }
});

router.get('/:userId/delete', ensureAuthenticated, async function (req, res, next) {
  let userId = req.params.userId;
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 5;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  await User.destroy({
    where: {
      id: userId
    }
  })
    .then(async (user) => {
      await User.findAll({ where: { role: { [Op.ne]: 'admin' } } })
        .then(users => {
          res.status(201).json({
            data: users.slice(startIndex, endIndex),
            currentPage: parseInt(pageNumber),
            totalPages: Math.ceil(users.length / pageSize),
            totalRecords: users.length
          });
        })
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/:userId/addresses', ensureAuthenticated, async function (req, res, next) {
  let userId = req.params.userId;
  await Address.findAll({
    where: {
      user_id: userId
    }
  })
    .then(async (addresses) => {
      res.status(201).json(addresses);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/:userId/address/add', ensureAuthenticated, async function (req, res, next) {
  let userId = req.params.userId;
  const address = req.body;
  await Address.create({
    ...address, user_id: userId
  })
    .then(async (address) => {
      res.status(201).json(address);
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/addresses/:id', ensureAuthenticated, async function (req, res, next) {
  console.log("ffff");
  let id = req.params.id;
  await Address.findOne({
    where: {
      id: id
    }
  })
    .then(async (address) => {
      res.status(201).json(address);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/addresses/:id/edit', ensureAuthenticated, async function (req, res, next) {

  let { id } = req.params;
  console.log(req.body);

  await Address.findOne({
    where: {
      id: id
    }
  })
    .then(async (address) => {



      await address.update(req.body);

      res.status(201).json(address);
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/:userId/addresses/:id/set/:historyId', ensureAuthenticated, async function (req, res, next) {
  let { userId, id, historyId } = req.params;
  await Address.update(
    {
      checked: sequelize.literal(`CASE WHEN id = ${id} THEN true ELSE false END`)
    },
    { where: { user_id: userId } }
  )
  await Address.findOne({ where: { id: id } })
    .then(async (address) => {
      await GachaUser.findOne({ where: { id: historyId } })
        .then(async (history) => {
          await history.update({ address_id: address.id })
        })
        .catch(err => {
          return next(err);
        })
      res.status(201).json(address);
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/:userId/addresses/:id/delete', ensureAuthenticated, async function (req, res, next) {
  let { userId, id } = req.params;
  await Address.destroy({
    where: {
      id: id
    }
  })
    .then(async (address) => {
      await Address.findAll({ where: { user_id: userId } })
        .then(addresses => {
          res.status(201).json(addresses);
        })
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/:userId/point/:amount/charge', ensureAuthenticated, async function (req, res, next) {
  let { userId, amount } = req.params;
  await User.findOne({
    where: {
      id: userId
    }
  })
    .then(async (user) => {
      await Payment.create({
        user_id: user.id,
        amount: parseInt(amount),
        status: "deposit"
      }).then(async payment => {
        await user.update(
          {
            point: parseInt(user.point) + parseInt(amount),
            // deposit: parseInt(user.deposit) + parseInt(amount)
          })
          .then(user => {
            res.status(201).json(user.point);
          })
          .catch(err => {
            throw err;
            return next(err);
          })

        await Log.create({
          user_id: userId,
          content: amount + "ポイントを購入しました。"
        })
          .then(log => {
            res.status(201).json(log);
          })
          .catch(err => {
            throw err;
            return next(err);
          })
      })
        .catch(err => {
          console.error(err);
          throw err;
          return next(err);
        });

    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

router.get('/payments/all', ensureAuthenticated, async function (req, res, next) {
  await Payment.findAll()
    .then(payments => {
      res.status(200).json(payments);
    })
    .catch(err => {
      console.error(err);
      throw err;
    });
})

router.get('/:userId/payments', ensureAuthenticated, async function (req, res, next) {
  let { userId } = req.params;
  await User.findOne({
    where: {
      id: userId
    }
  })
    .then(async (user) => {
      // await Payment.findAll({ where: { user_id: userId, status: "deposit" } })
      await Payment.findAll()
        .then(payments => {
          res.status(200).json(payments);
        })
        .catch(err => {
          console.error(err);
          throw err;
          return next(err);
        });
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: '無効なメールアドレス' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token and expiry to the database
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // Token valid for 10 minutes
    await user.save();

    // Send reset link via email
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false, // Use true for port 465
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    const resetURL = `${req.protocol}://${req.get('host')}/users/reset-password/${resetToken}`;
    const mailOptions = {
      // from: 'GachaX <no-reply@yourapp.com>',
      from: `GachaX <${process.env.MAIL_USERNAME}>`,
      to: email,
      subject: 'パスワード再設定',
      text: `下記のボタンをクリックしてパスワードを再設定してください。`,
      html: `<p>下記のボタンをクリックしてパスワードを再設定してください。:</p>
             <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}" 
              style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
              パスワード再設定
            </a>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset email sent!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending password reset email' });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the user by the token and ensure it's not expired
    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      // return res.status(400).json({ message: 'Invalid or expired token' });
      return res.json({ error: "expired" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update the user's password and clear reset token fields
    user.password = hashedPassword; // Ensure this is hashed before saving
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ error: "successful" });

  } catch (error) {
    console.error(error);
    return res.json({ error: "expired" });
  }
});


module.exports = router;