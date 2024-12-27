module.exports = (sequelize, Sequelize) => {
  const notification = sequelize.define("Notification", {
    title: {
      type: Sequelize.STRING,
    },
    image: {
      type: Sequelize.STRING,
    },
    content: {
      type: Sequelize.STRING,
    }
  },
    {
      timestamps: false
    });
  return notification;
};