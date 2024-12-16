const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const amazonPaapi = require("amazon-paapi");
const axios = require('axios');
const config = require('../configs/jwt-config')
const ensureAuthenticated = require('../modules/ensureAuthenticated')
const GachaJS = require('../utils/gacha');
const { Op } = require('sequelize');
const { Gacha, User, GachaUser, GachaCategory, Address } = require("../models");
// const Cart = require('../models/Cart');
// const CartClass = require('../modules/Cart')
// const Product = require('../models/Product')
// const Variant = require('../models/Variant')

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
        // let itemList = [];
        // for (const i of items) {
        //   // try {
        //   var query = {};
        //   query.asin = i.ASIN;
        //   if (i.ItemInfo === undefined) {
        //     query.name = `ASIN ${i.ASIN}に一致するJANコードは見つかりませんでした。`;
        //   } else {
        //     query.name = i.ItemInfo.Title.DisplayValue;
        //     if (i.ItemInfo.ExternalIds !== undefined) {
        //       query.jan = i.ItemInfo.ExternalIds.EANs.DisplayValues[0];
        //       query.status = 1;
        //     } else {
        //       // query.jan = `ASIN ${i.ASIN}に一致するJANコードは見つかりませんでした。`;
        //     }
        //   }

        //   if (i.DetailPageURL !== undefined && i.DetailPageURL !== '') {
        //     query.shop_url = i.DetailPageURL;
        //   }
        //   if (i.Images !== undefined) {
        //     query.img_url = i.Images.Primary.Small.URL;
        //   }

        //   let price = 0;
        //   if (i.Offers !== undefined) {
        //     if (i.Offers.Summaries[0].Condition.Value == 'New') {
        //       price = i.Offers.Summaries[0].LowestPrice.Amount;
        //     } else if (i.Offers.Summaries.length > 1 && i.Offers.Summaries[1].Condition.Value == 'New') {
        //       price = i.Offers.Summaries[1].LowestPrice.Amount;
        //     }
        //   }
        //   if (price != 0 && price !== undefined) {
        //     query.am_price = price;
        //   }

        //   let itemQuantity = i.Offers.Listings[0].Availability.MaxOrderQuantity;
        //   if (itemQuantity == null || itemQuantity === undefined) {
        //     itemQuantity = i.Offers.Listings[0].Availability.MinOrderQuantity;
        //   }
        //   query.quantity = itemQuantity;


        //   itemList = [...itemList, query];
        //   // } catch (err) {
        //   //   console.log(
        //   //     "---------- forof item error ----------",
        //   //     err.message
        //   //   );
        //   // }
        // }
        // console.log(itemList);
      })
      .catch((err) => {
        console.log("---------- amazon data CATCH error ----------", err);
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

//POST category
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
      message: 'カテゴリ名は必須です。',
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
      message: 'カテゴリ名は必須です。',
    })
    return next(err)
  }
})

//Delete category
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

//GET Gachas/
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

//GET Gacha
router.get('/:gachaId/item', async function (req, res, next) {
  const gachaId = req.params.gachaId;
  await Gacha.findOne({ where: { id: gachaId } })
    .then(gacha => {
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
  req.checkBody('category_id', ' カテゴリは必須です。').notEmpty();
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
  req.checkBody('category_id', ' カテゴリは必須です。').notEmpty();
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
  const decoded = jwt.decode(req.headers['authorization']);
  let gifts = [];
  await Gacha.findOne({ where: { id: gachaId } })
    .then(async (gacha) => {
      await User.findOne({ where: { email: decoded.email } })
        .then(async (user) => {
          let sum = 0;
          for (let i = 1; i <= num; i++) {
            const gift_point = Math.ceil(getRandomVal(gacha.point, gacha.win_probability));
            // const gift_name = 'test';
            // gifts = [...gifts, {
            //   gift_point: gift_point,
            //   gift_name: gift_name,
            //   user_id: user.id,
            //   gacha_id: gacha.id
            // }]
            sum += gift_point;
          }
          const getGifts = new getGiftCards();
          let gift = await getGifts.main(sum);
          gift.user_id = user.id;
          gift.gacha_id = gacha.id;
          gift.gift_point = sum;
          gift.status = 'ordered';
          await user.update({ point: user.point - num * gacha.point + sum - gift.gift_point });
          await GachaUser.create(gift)
            .then(_gift => {
              gacha.update({
                income: gacha.income + gacha.point * num,
                outcome: gacha.outcome + sum,
                users: gacha.users + 1
              });
              res.status(201).json({ gift: _gift, point: user.point });
            })
            .catch(err => {
              throw err;
              return next(err);
            });
        })
        .catch(err => {
          throw err;
          return next(err);
        });
    })
    .catch(err => {
      throw err;
      return next(err);
    })
})

// router.get('/:gachaId/gifts/:num', ensureAuthenticated, async function (req, res, next) {
//   const { gachaId, num } = req.params;
//   const decoded = jwt.decode(req.headers['authorization']);
//   let gifts = [];
//   await Gacha.findOne({ where: { id: gachaId } })
//     .then(async (gacha) => {
//       await User.findOne({ where: { email: decoded.email } })
//         .then(async (user) => {
//           await user.update({ point: user.point - gacha.point * num });
//           let sum = 0, rates, _gacha;
//           if (num == 1) {
//             rates = {
//               [gacha.point * 0.15]: 41,
//               [gacha.point * 0.2]: 25,
//               [gacha.point * 0.3]: 16,
//               [gacha.point * 0.5]: 9,
//               [gacha.point * 0.8]: 7,
//               [gacha.point * 1.2]: 2,
//             }
//             _gacha = new GachaJS(rates);
//           }
//           else {
//             rates = {
//               [gacha.point * 0.15]: 36,
//               [gacha.point * 0.2]: 25,
//               [gacha.point * 0.3]: 16,
//               [gacha.point * 0.5]: 10,
//               [gacha.point * 0.8]: 8,
//               [gacha.point * 1.2]: 5,
//             }
//             _gacha = new GachaJS(rates);
//           }
//           const _gift_points = _gacha.getPullByRarity(num);
//           _gift_points.forEach(_gift_point => {
//             const gift_point = parseInt(_gift_point);
//             const gift_name = 'test';
//             gifts = [...gifts, {
//               gift_point: gift_point,
//               gift_name: gift_name,
//               user_id: user.id,
//               gacha_id: gacha.id
//             }]
//             sum += gift_point;
//           })

//           await GachaUser.bulkCreate(gifts)
//             .then(_gifts => {
//               gacha.update({
//                 income: gacha.income + gacha.point * num,
//                 outcome: gacha.outcome + sum
//               });
//               res.status(201).json({ gifts: _gifts, point: user.point });
//             })
//             .catch(err => {
//               return next(err);
//             });
//         })
//         .catch(err => {
//           throw err;
//           return next(err);
//         });
//     })
//     .catch(err => {
//       throw err;
//       return next(err);
//     })
// })

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

module.exports = router;