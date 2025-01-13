module.exports = (sequelize, Sequelize) => {
  const header = sequelize.define("Header", {
    // name: {
    //   type: Sequelize.STRING,
    // },
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
  return header;
};