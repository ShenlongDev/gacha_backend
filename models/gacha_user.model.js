module.exports = (sequelize, Sequelize) => {

  const gachaUser = sequelize.define("GachaUser", {

    user_id: {
      type: Sequelize.INTEGER
    },
    gacha_id: {
      type: Sequelize.INTEGER
    },
    gift_point: {
      type: Sequelize.INTEGER
    },
    gift_asin: {
      type: Sequelize.STRING
    },
    gift_name: {
      type: Sequelize.STRING
    },
    gift_price: {
      type: Sequelize.INTEGER
    },
    gift_url: {
      type: Sequelize.STRING
    },
    gift_img: {
      type: Sequelize.STRING
    },
    status: {
      type: Sequelize.ENUM(['ordered', 'delivering', 'completed', 'returned']),
      defaultValue: 'ordered'
    },
    address_id: {
      type: Sequelize.INTEGER
    }
  },
    {
      timestamps: true
    });

  return gachaUser;

};