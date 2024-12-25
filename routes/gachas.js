const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const amazonPaapi = require("amazon-paapi");
const axios = require('axios');
const config = require('../configs/jwt-config')
const ensureAuthenticated = require('../modules/ensureAuthenticated')
const GachaJS = require('../utils/gacha');
const { Op } = require('sequelize');
const { Gacha, User, GachaUser, GachaCategory, Address, Badge } = require("../models");

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
// const User = db.User;

const getRandomVal = (point, prob) => {
  return Math.random() * (point * prob - point * 0.1) + point * 0.1;
}

const giftPointSum = (gifts) => {
  let sum = 0;
  gifts.foreach(gift => {
    sum += gift.gift_point;
  })
  return sum;
}

class getGiftCards {
  constructor() {
  }
  async main(price) {
    let commonParameters = {
      AccessKey: 'AKIAICGWDHN4SDN4VSTQ',
      SecretKey: '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',
      PartnerTag: 'likatyann0428-22',
      PartnerType: "Associates",
      Marketplace: "www.amazon.co.jp",
    };
    // console.log(commonParameters);

    let requestParameters = {
      Keywords: 'gift card',
      Resources: [
        "Images.Primary.Large",
        "ItemInfo.Title",
        // "Offers.Listings.Availability.MaxOrderQuantity",
        // "Offers.Listings.Availability.MinOrderQuantity",
        "Offers.Summaries.LowestPrice",
        "Offers.Summaries.OfferCount",
      ],
      "MaxPrice": price * 100 + 1,
    };
    let gift = {};
    await amazonPaapi
      .SearchItems(commonParameters, requestParameters)
      .then((amazonData) => {
        // axios.get(amazonData.SearchResult.SearchURL)
        //   .then(({ data }) => {
        //     console.log(data);
        //   })
        //   .catch(err => {
        //     throw err;
        //   })

        var items = amazonData.SearchResult.Items;
        let final_item = items.reduce(function (prev, curr) {
          return (Math.abs(curr.Offers.Summaries[0].LowestPrice.Amount - price) < Math.abs(prev.Offers.Summaries[0].LowestPrice.Amount - price) ? curr : prev);
        });

        gift.gift_asin = final_item.ASIN;
        gift.gift_name = final_item.ItemInfo && final_item.ItemInfo.Title.DisplayValue;
        gift.gift_url = final_item.DetailPageURL !== undefined && final_item.DetailPageURL !== '' && final_item.DetailPageURL;
        gift.gift_img = final_item.Images && final_item.Images.Primary.Large.URL;
        gift.gift_price = final_item.Offers.Summaries[0].LowestPrice.Amount;
      })
      .catch((err) => {
        console.log("---------- amazon data CATCH error ----------");
      });
    return gift;
  }
}

//GET CATEGORIES/
router.get('/categories', async function (req, res, next) {
  await GachaCategory.findAll()
    .then(categories => {
      res.status(201).json(categories);
    })
    .catch(err => {
      return next(err);
    })
})

// POST category
router.post('/categories/edit', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  if (data.name != '') {
    await GachaCategory.findByPk(data.id)
      .then(async (category) => {
        await category.update({ name: data.name });
        res.status(201).json(category);
      })
      .catch(err => {
        return next(err);
      })
  }
  else {
    let err = new TypedError('category edit error', 403, 'invalid_field', {
      message: 'カテゴリー名は必須です。',
    })
    return next(err)
  }
})

router.post('/categories/add', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  if (data.name != '') {
    await GachaCategory.create(data)
      .then(category => {
        res.status(201).json(category);
      })
      .catch(err => {
        return next(err);
      })
  }
  else {
    let err = new TypedError('category add error', 403, 'invalid_field', {
      message: 'カテゴリー名は必須です。',
    })
    return next(err)
  }
})

// Delete category
router.get('/categories/:categoryId/delete', ensureAuthenticated, async function (req, res, next) {
  let categoryId = req.params.categoryId;
  await GachaCategory.destroy({
    where: {
      id: categoryId
    }
  })
    .then(async (category) => {
      await GachaCategory.findAll()
        .then(categories => {
          res.status(201).json(categories);
        })
    })
    .catch(err => {
      return next(err);
    })
})

// GET Gachas/
router.get('/category/:category', async function (req, res, next) {
  const category = req.params.category;
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;

  if (category == 'all') {
    await Gacha.findAll({ include: [GachaCategory] })
      .then(gachas => {
        res.status(201).json({
          data: gachas.slice(startIndex, endIndex),
          currentPage: parseInt(pageNumber),
          totalPages: Math.ceil(gachas.length / pageSize),
          totalRecords: gachas.length
        });
      })
      .catch(err => {
        throw err;
        return next(err);
      })
  }
  else if (category == 'popular') {
    await Gacha.findAll({
      where: { users: { [Op.ne]: 0 } },
      order: [
        ["users", "ASC"],
      ],
      include: [GachaCategory]
    })
      .then(gachas => {
        res.status(201).json({
          data: gachas.slice(0, 10),
          currentPage: parseInt(1),
          totalPages: 1,
          totalRecords: gachas.length
        });
      })
      .catch(err => {
        throw err;
        return next(err);
      })
  }
  else if (category == 'new') {
    await Gacha.findAll({
      order: [
        ["createdAt", "DESC"],
      ],
      include: [GachaCategory]
    })
      .then(gachas => {
        res.status(201).json({
          data: gachas.slice(0, 10),
          currentPage: parseInt(1),
          totalPages: 1,
          totalRecords: gachas.length
        });
      })
      .catch(err => {
        throw err;
        return next(err);
      })
  }
  else {
    await Gacha.findAll({
      where: { category_id: category }, include: [{
        model: GachaCategory,
        attributes: ['name']
      }]
    })
      .then(gachas => {
        res.status(201).json({
          data: gachas.slice(startIndex, endIndex),
          currentPage: parseInt(pageNumber),
          totalPages: Math.ceil(gachas.length / pageSize),
          totalRecords: gachas.length
        });
      })
      .catch(err => {
        return next(err);
      })
  }
})

// GET Gacha
router.get('/:gachaId/item', async function (req, res, next) {
  const gachaId = req.params.gachaId;
  await Gacha.findOne({ where: { id: gachaId } })
    .then(async gacha => {
      res.status(201).json(gacha);
    })
    .catch(err => {
      return next(err);
    })
})

router.post('/add', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('name', '名前は必須です。').notEmpty();
  req.checkBody('point', 'ポイントが必要です。').notEmpty();
  req.checkBody('win_probability', '確率トが必要です。').notEmpty();
  req.checkBody('category_id', ' カテゴリーは必須です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    throw err;
    return next(err)
  }
  await Gacha.create(data)
    .then(gacha => {
      res.status(201).json(gacha);
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

router.post('/edit', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('name', '名前は必須です。').notEmpty();
  req.checkBody('point', 'ポイントが必要です。').notEmpty();
  req.checkBody('win_probability', '確率トが必要です。').notEmpty();
  req.checkBody('category_id', ' カテゴリーは必須です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    return next(err)
  }
  await Gacha.findOne({ where: { id: data.id } })
    .then(async (gacha) => {
      await gacha.update({
        name: data.name,
        point: data.point,
        win_probability: data.win_probability,
        category_id: data.category_id
      });
      res.status(201).json(gacha);
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

router.post('/:gachaId/image', ensureAuthenticated, upload.single('image'), async (req, res) => {
  const gachaId = req.params.gachaId;
  const imagePath = path.join(__dirname, req.file.path);
  await Gacha.findOne({ where: { id: gachaId } })
    .then(gacha => {
      gacha.update({ image: `uploads/${req.file.filename}` });
      res.json({ imageUrl: `uploads/${req.file.filename}` });
    })
    .catch(err => {
      throw err;
      return next(err);
    })
});

router.get('/:gachaId/delete', ensureAuthenticated, async function (req, res, next) {
  let gachaId = req.params.gachaId;
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;
  await Gacha.destroy({
    where: {
      id: gachaId
    }
  })
    .then(async (gacha) => {
      await Gacha.findAll({ include: [GachaCategory] })
        .then(gachas => {
          res.status(201).json({
            data: gachas.slice(startIndex, endIndex),
            currentPage: parseInt(pageNumber),
            totalPages: Math.ceil(gachas.length / pageSize),
            totalRecords: gachas.length
          });
        })
    })
    .catch(err => {
      return next(err);
    })
})

// gift card generating
router.get('/:gachaId/gifts/:num', ensureAuthenticated, async function (req, res, next) {
  const { gachaId, num } = req.params;
  const decoded = req.decoded;
  let gifts = [];

  await Gacha.findOne({ where: { id: gachaId } })
    .then(async (gacha) => {
      await User.findOne({ where: { email: decoded?.email } })
        .then(async (user) => {

          let sum = 0;
          let gitf_list = [];
          for (let i = 1; i <= num; i++) {

            let gift_point = Math.ceil(getRandomVal(gacha.point, gacha.win_probability));

            if (gift_point > 1 && 5 > gift_point) gift_point = 1;
            if (gift_point > 4 && 10 > gift_point) gift_point = 5;
            if (gift_point > 9 && 25 > gift_point) gift_point = 10;
            if (gift_point > 24 && 50 > gift_point) gift_point = 25;
            if (gift_point > 49 && 75 > gift_point) gift_point = 50;
            if (gift_point > 74 && 100 > gift_point) gift_point = 75;
            if (gift_point > 99 && 250 > gift_point) gift_point = 100;
            if (gift_point > 249 && 500 > gift_point) gift_point = 250;
            if (gift_point > 499 && 750 > gift_point) gift_point = 500;
            if (gift_point > 749 && 1000 > gift_point) gift_point = 750;

            if (gift_point > 999 && 2500 > gift_point) gift_point = 1000;
            if (gift_point > 2499 && 5000 > gift_point) gift_point = 2500;
            if (gift_point > 4999 && 10000 > gift_point) gift_point = 5000;
            if (gift_point > 9999) gift_point = 10000;

            // const gift_name = 'test';
            // gifts = [...gifts, {
            //   gift_point: gift_point,
            //   gift_name: gift_name,
            //   user_id: user.id,
            //   gacha_id: gacha.id
            // }]
            console.log("gift_point", gift_point);

            gitf_list.push(gift_point);
            sum += gift_point * 1;
          }

          await GachaUser.create({ user_id: user.id, gacha_id: gachaId, gift_point: sum, gift_info: JSON.stringify(gitf_list) })
            .then(user => {

            });

          await User.findOne({ where: { id: user.id } })
            .then(async (u) => {

              if (user) {

                await u.update({ point: u.point * 1 - gacha.point * num });
                res.status(201).json(u);

              }
            })
            .catch(err => {
              return next(err);
            })

        })
        .catch(err => {
          throw err;
          return next(err);
        })
    })

})
router.get('/nowGetGacha', ensureAuthenticated, async function (req, res) {
  const decoded = req.decoded;
  
  await User.findOne({ where: { email: decoded?.email } })
    .then(async (user) => {
      console.log(user.id)
      await GachaUser.findOne({ where: { user_id: user.id }, order: [['createdAt', 'DESC']], limit: 1})
        .then(async (u) => {
          res.status(201).json(u);
        })
        .catch(err => {
          return next(err);
        })

    }
    )

});
router.get('/gifts/:userId/return/:giftId', ensureAuthenticated, async function (req, res, next) {
  const { giftId, userId } = req.params;
  await GachaUser.findOne({ where: { id: giftId } })
    .then(async (gift) => {
      await gift.update({ status: 'returned' });
      await User.findOne({ where: { id: gift.user_id } })
        .then(async (user) => {
          await user.update({ point: user.point + gift.gift_point })
            .then(user => {
              res.status(201).json(user.point);
            })
            .catch(err => {
              return next(err);
            });
          // await GachaUser.findAll({
          //   where: {
          //     [Op.and]: [
          //       { user_id: userId },
          //       { status: 'ordered' }
          //     ]
          //   }
          // })
          //   .then(gifts => {
          //     res.status(201).json(gifts);
          //   })
          //   .catch(err => {
          //     return next(err);
          //   })
        })
        .catch(err => {
          return next(err);
        })
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/gifts/:userId/deliver/:giftId', ensureAuthenticated, async function (req, res, next) {
  const { giftId, userId } = req.params;
  await GachaUser.findOne({ where: { id: giftId } })
    .then(async (gift) => {
      await gift.update({ status: 'delivering' })
        .then(gift => {
          res.status(201).json(true);
        })
        .catch(err => {
          return next(err);
        });
      // await GachaUser.findAll({
      //   where: {
      //     [Op.and]: [
      //       { user_id: userId },
      //       { status: 'ordered' }
      //     ]
      //   }
      // })
      //   .then(gifts => {
      //     res.status(201).json(gifts);
      //   })
      //   .catch(err => {
      //     return next(err);
      //   })
    })
    .catch(err => {
      return next(err);
    })
})

router.get('/:userId/histories', ensureAuthenticated, async function (req, res, next) {
  const { userId } = req.params;
  await GachaUser.findAll({
    where: { user_id: userId }, include: [{
      model: Gacha,
      attributes: ['name']
    }]
  })
    .then(async (gifts) => {
      res.status(201).json(gifts);
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

router.get('/histories/:gachaId', ensureAuthenticated, async function (req, res, next) {
  const { gachaId } = req.params;
  await GachaUser.findAll({
    where: { gacha_id: gachaId }, include: [{
      model: User,
      attributes: ['first_name', 'last_name']
    }]
  })
    .then(async (gifts) => {
      res.status(201).json(gifts);
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

router.get('/histories', ensureAuthenticated, async function (req, res, next) {
  await GachaUser.findAll({
    include: [
      {
        model: User,
        attributes: ['first_name', 'last_name']
      },
      { model: Address },
    ]
  })
    .then(async (gifts) => {
      res.status(201).json(gifts);
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

router.get('/gifts/orders', ensureAuthenticated, async function (req, res, next) {
  await GachaUser.findAll({
    where: { status: 'delivering' }, include: [
      {
        model: User,
        attributes: ['first_name', 'last_name']
      },
      { model: Address },
    ]
  })
    .then(async (gifts) => {
      res.status(201).json(gifts);
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

router.get('/gifts/:userId/remain', ensureAuthenticated, async function (req, res, next) {
  const { userId } = req.params;
  await GachaUser.findAll({
    where: {
      [Op.and]: [
        { user_id: userId },
        { status: 'ordered' }
      ]
    },
    include: [{
      model: User,
      attributes: ['first_name', 'last_name']
    }]
  })
    .then(async (gifts) => {
      res.status(201).json(gifts);
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

// get badge
router.get('/badge', async function (req, res, next) {
  await Badge.findAll()
    .then(badges => {
      res.status(200).json(badges);
    })
    .catch(err => {
      return next(err);
    })
})

module.exports = router;