module.exports = (sequelize, Sequelize) => {
  const giftList = sequelize.define("Gift", {
    name: {
      type: Sequelize.STRING,
    },
    image: {
      type: Sequelize.STRING,
    },
    point: {
      type: Sequelize.INTEGER,
    }
  },
    {
      timestamps: false
    });
  return giftList;
};