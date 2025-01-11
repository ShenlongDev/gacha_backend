module.exports = (sequelize, Sequelize) => {
  const prize = sequelize.define("Prize", {
    name: {
      type: Sequelize.STRING,
    },
    image: {
      type: Sequelize.STRING,
    }
  },
    {
      timestamps: false
    });
  return prize;
};