module.exports = (sequelize, Sequelize) => {
  const gacha = sequelize.define("Gacha", {
    name: {
      type: Sequelize.STRING
    },
    image: {
      type: Sequelize.STRING
    },
    point: {
      type: Sequelize.INTEGER,
    },
    win_probability: {
      type: Sequelize.FLOAT,
    },
    category_id: {
      type: Sequelize.INTEGER,
    },
    users: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    income: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    outcome: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    badge_ids: {
      type: Sequelize.STRING,
    },
    content: {
      type: Sequelize.STRING,
    },
    limit: {
      type: Sequelize.INTEGER,
    }
  },
    {
      timestamps: true
    });
  return gacha;
};