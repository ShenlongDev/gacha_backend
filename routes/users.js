const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
const config = require('../configs/jwt-config')
const ensureAuthenticated = require('../modules/ensureAuthenticated')
var bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Payment, User, Address, GachaUser, sequelize } = require("../models");
const TypedError = require('../modules/ErrorHandler')

const stripe = require('stripe')('sk_test_51QMoCoK7S11jMD7Jcv5KDq2rBGEahS3pD3Di2zjHHsIrIFfW6xHhtLGWNqkobJfAGsBuhsWF3xK3jqlEk3xlbjfi00s7rqbNMp');

router.get('/payment', async (req, res) => {

  let Params = req.query;
  console.log("FFFFFFFFFFFF", req.query);

  let user = await User.findOne({ where: { id: Params.userId } });
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.first_name,
  });

  const { amount, userId, paymentMethodId, cardType } = Params;
 
  let name = 'name';
  
  if (cardType == 'card') {

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'jpy',
        payment_method: paymentMethodId,
        confirm: true,
        confirmation_method: 'manual',
        customer: customer.id,
        return_url: 'https://gacha-server-2412-enpq.onrender.com/su'
      });

      await Payment.create({ user_id: userId, amount: amount, status: '' })
        .then(user => {

        });     
      

      await User.findOne({ where: { id: userId } })
        .then(async (u) => {
          
          if (user) {
            console.log('paymentMethodId+amount', u.point*1 + amount*1);
            await u.update({point: u.point*1 + amount*1});
            res.status(201).json(u);

          }
        })
        .catch(err => {
          return next(err);
        })

      res.send({
        success: true,
        paymentIntent,
      });

    } catch (error) {

      res.status(500).send({ error: error.message });

    }
  }
});

// POST /signin
router.post('/register', async function (req, res, next) {
  let _user = req.body;
  req.checkBody('first_name', 'FirstName is required').notEmpty();
  req.checkBody('last_name', 'LastName is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    throw err;
    return next(err)
  }
  req.checkBody('email', 'Email is not valid').isEmail();
  let invalidFieldErrors = req.validationErrors()
  if (invalidFieldErrors) {
    let err = new TypedError('register error', 403, 'invalid_field', {
      errors: invalidFieldErrors,
    })
    throw err;
    return next(err)
  }

  User.findOne({ where: { email: _user.email } })
    .then((user) => {
      if (user) {
        let err = new TypedError('register error', 403, 'invalid_field', {
          message: "user is existed"
        })
        throw err;
        return next(err);
      }
      else {
        bcrypt.genSalt(10, async function (err, salt) {
          await bcrypt.hash(_user.password, salt, function (err, hash) {
            _user.password = hash;
            let token = jwt.sign(
              { email: _user.email },
              config.secret,
              { expiresIn: '1h' }
            )
            User.create({ ..._user, _token: token })
              .then(user => {
                return res.json({
                  user_id: user.id,
                  user_name: user.first_name + ' ' + user.last_name,
                  token: token,
                  role: user.role,
                  expire_in: '1h',
                  point: user.point,
                  email: user.email
                });
              })
              .catch(err => {
                console.error(err);
                throw err;
                return next(err);
              });
          });
        });
      }
    })
    .catch(err => {
      throw err;
      return next(err);
    })
});

// POST /login
router.post('/login', async function (req, res, next) {
  console.log(req.body);
  const { email, password } = req.body || {};
  // console.log(email, password);
  if (!email || !password) {
    let err = new TypedError('login error', 400, 'missing_field', { message: "missing email or password" });
    return next(err);
  }
  await User.findOne({ where: { email: email } })
    .then(user => {
      // console.log(user);
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
            user_name: user.fullname,
            token: token,
            role: user.role,
            expire_in: '1h',
            point: user.point,
            email: user.email
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

// GET /
router.get('/', ensureAuthenticated, async function (req, res, next) {
  await User.findAll({ where: { role: { [Op.ne]: 'admin' } } })
    .then(users => {
      res.status(201).json(users);
    })
    .catch(err => {
      return next(err);
    })
})

// router.get('/user_info', ensureAuthenticated, async function (req, res, next) {
//   // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QxMjNAZ21haWwuY29tIiwiaWF0IjoxNzM1MDYzNjU5LCJleHAiOjE3MzUwNjcyNTl9.wgYoAtj-AwAG2HPx0pulcbyOGtx3vlpGmw9ws-UD9sI"
//   const user_info = req.decoded;
//   console.log(user_info);
//   res.status(201).json(user_info);
// })

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
  req.checkBody('kana_first', '姓（カナ）は必須です。').notEmpty();
  req.checkBody('last_name', '名（カナ）は必須です。').notEmpty();
  req.checkBody('post_code', '郵便番号は必須です。').notEmpty();
  req.checkBody('state', '都道府県は必須です。').notEmpty();
  req.checkBody('address', '住所は必須です。').notEmpty();
  req.checkBody('phone_number', '電話番号は必須です。').notEmpty();
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
        let err = new TypedError('login error', 403, 'invalid_field', { message: "間違ったIDです。" })
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

// Delete user
router.get('/:userId/delete', ensureAuthenticated, async function (req, res, next) {
  let userId = req.params.userId;
  await User.destroy({
    where: {
      id: userId
    }
  })
    .then(async (user) => {
      await User.findAll({ where: { role: { [Op.ne]: 'admin' } } })
        .then(users => {
          res.status(201).json(users);
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
  let id = req.params.id;
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
            deposit: parseInt(user.deposit) + parseInt(amount)
          })
          .then(user => {
            res.status(201).json(user.point);
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
  console.log("here");
  await Payment.findAll({ where: { status: "deposit" } })
    .then(payments => {
      res.status(200).json(payments);
    })
    .catch(err => {
      console.error(err);
      throw err;
      return next(err);
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
      await Payment.findAll({ where: { user_id: userId, status: "deposit" } })
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



module.exports = router;