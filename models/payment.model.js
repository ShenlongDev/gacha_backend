module.exports = (sequelize, Sequelize) => {
  const paymentList = sequelize.define("Payment", {
    user_id: {
      type: Sequelize.INTEGER,
    },
    amount: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: Sequelize.STRING,
      defaultValue: 0,
    }
  },
    {
      timestamps: true
    });
  return paymentList;
};