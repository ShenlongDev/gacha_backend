module.exports = (sequelize, Sequelize) => {
  const user = sequelize.define("User", {
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
    },
    invite_send_code: {
      type: Sequelize.STRING
    },
    invite_receive_code: {
      type: Sequelize.STRING
    },
    mile: {
      type: Sequelize.INTEGER
    },
    level: {
      type: Sequelize.INTEGER
    },
    coupon: {
      type: Sequelize.STRING
    },
    avatar: {
      type: Sequelize.STRING
    },
    resetPasswordToken: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    resetPasswordExpires: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    phone_sms: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    phone_verify1: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    is_exit: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    reason: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    line_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
    {
      timestamps: false
    });
  return user;
};