module.exports = (sequelize, Sequelize) => {
  const prize = sequelize.define("Prize", {
    name: {
      type: Sequelize.STRING,
    },
    image: {
      type: Sequelize.STRING,
    },
    // stock: {
    //   type: Sequelize.INTEGER
    // }
  },
    {
      timestamps: false
    });
  return prize;
};