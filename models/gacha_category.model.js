module.exports = (sequelize, Sequelize) => {

  const gachaCategory = sequelize.define("GachaCategory", {

    name: {
      type: Sequelize.STRING
    }
  },
    {
      timestamps: false
    });

  return gachaCategory;

};