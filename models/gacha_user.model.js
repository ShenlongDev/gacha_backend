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
    gift_info: {
      type: Sequelize.INTEGER
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