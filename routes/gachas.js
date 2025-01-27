const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const amazonPaapi = require("amazon-paapi");
const axios = require('axios');
const config = require('../configs/jwt-config')
const ensureAuthenticated = require('../modules/ensureAuthenticated')
const GachaJS = require('../utils/gacha');
const { Op } = require('sequelize');
const { Gacha, User, GachaUser, GachaCategory, Address, Badge, GachaScore, Prize, sequelize } = require("../models");

const multer = require('multer');
var path = require('path');

const TypedError = require('../modules/ErrorHandler');
const { totalmem } = require('os');
const { order } = require('paypal-rest-sdk');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'public/uploads/');
  },
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

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
        //     console.log(err);
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

router.get('/categories', async function (req, res, next) {
  await GachaCategory.findAll()
    .then(categories => {
      res.status(201).json(categories);
    })
    .catch(err => {
      return next(err);
    })
})

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

router.get('/category/:category', async function (req, res, next) {
  try {
    const { category } = req.params;
    const { badges, key, order } = req.query;
    console.log("category", category, "badges", badges, "key", key, "order", order);

    const pageNumber = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 10;
    const startIndex = (pageNumber - 1) * pageSize;

    let whereClause = {};
    let orderClause = [];

    if (category === 'all') {

    } else {
      whereClause.category_id = category;
    }

    if (key) {
      whereClause.name = { [Op.like]: `%${key}%` };
    }

    if (badges) {
      const badgeArray = badges.split(',').map(Number).sort();
      const badgeArrayString = badgeArray.map(id => id.toString());
    
      whereClause = {
        ...whereClause,
        badge_ids: {
          [Op.or]: badgeArrayString.map(badgeId => ({
            [Op.like]: `%${badgeId}%`
          }))
        }
      };
    }

    // Apply order based on order if provided
    if (order) {
      if (order == 1) {
        orderClause = [['createdAt', 'ASC']]; // Order by creation date ascending
      } else if (order == 2) {
        orderClause = [['point', 'DESC']]; // Order by point descending
      } else if (order == 3) {
        orderClause = [['point', 'ASC']]; // Order by point ascending
      } else {
        console.warn("Invalid order value:", order); // Handle unexpected values
      }
    }

    // Fetch the data from the database
    const gachas = await Gacha.findAll({
      where: whereClause,
      order: orderClause,
      include: [
        {
          model: GachaCategory,
          attributes: ['name']
        }
      ]
    });

    // Paginate the results
    const paginatedData = gachas.slice(startIndex, startIndex + pageSize);

    res.status(200).json({
      data: paginatedData,
      currentPage: pageNumber,
      totalPages: Math.ceil(gachas.length / pageSize),
      totalRecords: gachas.length,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});


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
  req.checkBody('point', 'ポイントが必須です。').notEmpty();
  // req.checkBody('win_probability', '確率トが必須です。').notEmpty();
  req.checkBody('category_id', 'カテゴリーは必須です。').notEmpty();
  req.checkBody('prize_list', '景品リストは必須です。').notEmpty();
  req.checkBody('total_limit', '全体の回数は必須です。').notEmpty();
  req.checkBody('user_limit', '一人当たりの最大ガチャ参加可能回数は必須です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    console.log(err);
  }
  await Gacha.create(data)
    .then(gacha => {
      res.status(201).json(gacha);
    })
    .catch(err => {
      console.log(err);
    })
})

router.post('/edit', ensureAuthenticated, async function (req, res, next) {
  let data = req.body;
  req.checkBody('name', '名前は必須です。').notEmpty();
  req.checkBody('point', 'ポイントが必須です。').notEmpty();
  // req.checkBody('win_probability', '確率トが必須です。').notEmpty();
  req.checkBody('category_id', 'カテゴリーは必須です。').notEmpty();
  req.checkBody('prize_list', '景品リストは必須です。').notEmpty();
  req.checkBody('total_limit', '全体の回数は必須です。').notEmpty();
  req.checkBody('user_limit', '一人当たりの最大ガチャ参加可能回数は必須です。').notEmpty();
  let missingFieldErrors = req.validationErrors();
  if (missingFieldErrors) {
    let err = new TypedError('register error', 400, 'missing_field', {
      errors: missingFieldErrors,
    })
    return next(err)
  }
  await Gacha.findOne({ where: { id: data.id } })
    .then(async (gacha) => {
      await gacha.update(data);
      // await gacha.update({
      //   name: data.name,
      //   point: data.point,
      //   win_probability: data.win_probability,
      //   category_id: data.category_id,
      //   content: data.content,
      //   badge_ids: data.badge_ids
      // });
      res.status(201).json(gacha);
    })
    .catch(err => {
      console.log(err);
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
      console.log(err);
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

router.get('/:gachaId/gifts/:num', ensureAuthenticated, async function (req, res, next) {
  const { gachaId, num } = req.params;
  const decoded = req.decoded;
  let gifts = [];

  await Gacha.findOne({ where: { id: gachaId } })
    .then(async (gacha) => {
      let prizes = JSON.parse(gacha.prize_list);

      await User.findOne({ where: { email: decoded?.email } })
        .then(async (user) => {
          let sum = 0;
          let gift_list = [];
          let prize_ids = [];

          for (let i = 1; i <= num; i++) {

            // let gift_point = Math.ceil(getRandomVal(gacha.point, gacha.win_probability));
            /*
            // old logic
            let gift_point = Math.ceil(getRandomVal(gacha.point, 1));

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

            console.log("gift_point", gift_point);

            gift_point = gift_list.push(gift_point);
            sum += gift_point * 1;
            */

            // new logic
            const gradeWeights = {
              s: 1,  // Least likely
              a: 2,
              b: 3,
              c: 4,
              o: 5   // Most likely
            };

            const weightedPrizes = [];

            console.log('before', prizes);

            prizes.forEach(prize => {
              const count = parseInt(prize.prize_number, 10);
              if (count > 0) {
                const weight = gradeWeights[prize.grade];
  
                for (let i = 0; i < count * weight; i++) {
                  weightedPrizes.push(prize);
                }
              }
            });

            console.log(weightedPrizes.length);
            const randomIndex = Math.floor(Math.random() * weightedPrizes.length);
            var selectedPrize = weightedPrizes[randomIndex];
            console.log("selectedPrize", selectedPrize);

            gift_list.push(Number(selectedPrize.return_point));
            sum += Number(selectedPrize.return_point) * 1;

            prize_ids.push(Number(selectedPrize.prize_id));

            const reducedIndex = prizes.findIndex(prize => prize.prize_id === selectedPrize.prize_id);

            console.log(reducedIndex)
            if (reducedIndex !== -1) {
              prizes[reducedIndex] = {
                ...prizes[reducedIndex],
                prize_number: prizes[reducedIndex].prize_number - 1
              };
            } else {
              console.log('Prize number is already zero, cannot reduce further.');
            }

            console.log('after', prizes);

            newGacha = {
              ...gacha,
              total_limit: gacha.total_limit - 1,
              prize_list: JSON.stringify(prizes)
            };

            await gacha.update(newGacha);
          }
          // await GachaUser.create({ user_id: user.id, gacha_id: gachaId, gift_point: sum, gift_info: JSON.stringify(gift_list) })
          await GachaUser.create({ user_id: user.id, gacha_id: gachaId, gift_point: sum, gift_info: num })
            .then(async gachaUser => {
              const scores = gift_list.map((score, index) => ({
                user_id: gachaUser.user_id,
                gacha_id: gachaUser.gacha_id,
                gacha_user_id: gachaUser.id,
                score: score,
                prize_id: prize_ids[index]
              }));

              await GachaScore.bulkCreate(scores);
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
        });
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
})

router.get('/nowGetGacha', ensureAuthenticated, async function (req, res) {
  const decoded = req.decoded;

  await User.findOne({ where: { email: decoded?.email } })
    .then(async (user) => {
      console.log(user.id)
      await GachaUser.findOne({ where: { user_id: user.id }, order: [['createdAt', 'DESC']], limit: 1 })
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

router.get('/:userId/histories/:status', ensureAuthenticated, async function (req, res, next) {
  const { userId, status } = req.params;

  await GachaUser.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Gacha,
        attributes: ['name', 'prize_list']
      },
      {
        model: GachaScore,
        attributes: ['id', 'score', 'status', 'prize_id'],
        ...(status !== 'all' && { where: { status } })
      }
    ]
  })
    .then(async (gifts) => {
      res.status(201).json(gifts);
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
})

router.get('/:userId/histories', ensureAuthenticated, async function (req, res, next) {
  const { userId } = req.params;

  await GachaScore.findAll({
    where: {
      user_id: userId,
      status: 'delivering'
    },
    // order:[['createdAt', 'DESC']],
  })
    .then(async (gifts) => {
      res.status(201).json(gifts);
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
})

router.get('/histories/:gachaId', ensureAuthenticated, async function (req, res, next) {
  const { gachaId } = req.params;
  const pageNumber = req.query.page || 1;
  const pageSize = req.query.limit || 10;
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;

  await GachaUser.findAll({
    where: { gacha_id: gachaId }, include: [{
      model: User,
      attributes: ['first_name', 'last_name']
    }]
  })
    .then(async (gachaUsers) => {
      res.status(201).json({
        data: gachaUsers.slice(startIndex, endIndex),
        currentPage: parseInt(pageNumber),
        totalPages: Math.ceil(gachaUsers.length / pageSize),
        totalRecords: gachaUsers.length
      });
    })
    .catch(err => {
      console.log(err);
      return next(err);
    })
})

router.get('/histories', ensureAuthenticated, async function (req, res, next) {
  await GachaUser.findAll({

  })
    .then(async (gifts) => {
      res.status(201).json(gifts);
    })
    .catch(err => {
      console.log(err);
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
      console.log(err);
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
      console.log(err);
      return next(err);
    })
})

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