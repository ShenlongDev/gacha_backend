module.exports = (sequelize, Sequelize) => {
  const userList = sequelize.define("User", {
    first_name: {
      type: Sequelize.STRING,
    },
    last_name: {
      type: Sequelize.STRING,
    },
    kana_first: {
      type: Sequelize.STRING,
    },
    kana_last: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
      unique: true
    },
    _token: {
      type: Sequelize.STRING
    },
    password: {
      type: Sequelize.STRING
    },
    phone_number: {
      type: Sequelize.STRING
    },
    post_code: {
      type: Sequelize.STRING
    },
    state: {
      type: Sequelize.STRING
    },
    address: {
      type: Sequelize.STRING
    },
    point: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    deposit: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    role: {
      type: Sequelize.ENUM(['admin', 'user']),
      defaultValue: 'user'
    }
  },
    {
      timestamps: false
    });
  return userList;
};