module.exports = (sequelize, Sequelize) => {
  const badgeList = sequelize.define("Badge", {
    text: {
      type: Sequelize.STRING,
    },
    color: {
      type: Sequelize.STRING,
    }
  },
    {
      timestamps: false
    });
  return badgeList;
};