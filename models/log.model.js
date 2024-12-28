module.exports = (sequelize, Sequelize) => {
  const log = sequelize.define("Log", {
    user_id: {
      type: Sequelize.INTEGER,
    },
    content: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  },
    {
      timestamps: true
    });
  return log;
};