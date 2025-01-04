module.exports = (sequelize, Sequelize) => {
  const couponslist = sequelize.define("Coupons", {
    user_id: {
      type: Sequelize.INTEGER,
    },
    text: {
      type: Sequelize.STRING,      
    },
    expire: {
      type: Sequelize.DATE,      
    },
    state: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    }
  },
    {
      timestamps: false
    });
  return couponslist;
};

