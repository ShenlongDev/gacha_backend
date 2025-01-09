module.exports = (sequelize, Sequelize) => {
  const coupon = sequelize.define("Coupon", {
    text: {
      type: Sequelize.STRING,
    },
    expire: {
      type: Sequelize.DATE,
    },
    user_id: {
      type: Sequelize.INTEGER,
    },
    state: {
      type: Sequelize.INTEGER,
    },
    point: {
      type: Sequelize.INTEGER,
    }
  },
    {
      timestamps: false
    });
  return coupon;
};