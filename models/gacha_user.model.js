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