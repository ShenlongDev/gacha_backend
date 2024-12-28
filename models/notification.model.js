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
      timestamps: true
    });
  return notification;
};