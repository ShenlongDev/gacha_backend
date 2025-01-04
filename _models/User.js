
// var mongoose = require('mongoose');
// var bcrypt = require('bcryptjs');

// var userSchema = mongoose.Schema({
//     email: {
//         type: String,
//         index: true
//     },
//     password: {
//         type: String
//     },
//     fullname: {
//         type: String
//     },
//     admin: {
//         type: String
//     },
//     cart: {
//         type: Object
//     }
// });

// var User = module.exports = mongoose.model('User', userSchema);

// module.exports.createUser = function (newUser, callback) {
//     bcrypt.genSalt(10, function (err, salt) {
//         bcrypt.hash(newUser.password, salt, function (err, hash) {
//             newUser.password = hash;
//             newUser.save(callback);
//         });
//     });
// }

// module.exports.getUserById = function (id, callback) {
//     User.findById(id, callback);
// }
// module.exports.comparePassword = function (givenPassword, hash, callback) {
//     bcrypt.compare(givenPassword, hash, function (err, isMatch) {
//         if (err) throw err;
//         callback(null, isMatch);
//     });
// }

// module.exports.getAllUsers = function (callback) {
//     User.find(callback)
// }

// module.exports = (sequelize, Sequelize) => {
//   const User = sequelize.define("User", {
//     email: {
//       type: Sequelize.STRING,
//       unique: true
//     },
//     password: {
//       type: Sequelize.STRING
//     },
//     address: {
//       type: Sequelize.STRING
//     },
//     point: {
//       type: Sequelize.INTEGER
//     },
//     role: {
//       type: Sequelize.ENUM(['admin', 'user']),
//       default: 'user'
//     }
//   },
//     {
//       timestamps: true
//     }
//   );
//   return sequelize.models.User;
// };

// module.exports.getUserByEmail = function (email, callback) {
//   console.log(email);
//   var query = { where: { email: email } };
//   console.log(User.findAll());
// }
// const { DataTypes } = require('sequelize');

// const User = (sequelize, Sequelize) => {
//   sequelize.define('User', {
//     email: {
//       type: DataTypes.STRING,
//       unique: true
//     },
//     password: {
//       type: DataTypes.STRING
//     },
//     address: {
//       type: DataTypes.STRING
//     },
//     point: {
//       type: DataTypes.INTEGER
//     },
//     role: {
//       type: DataTypes.ENUM(['admin', 'user']),
//       defaultValue: 'user'
//     }
//   }, {
//     timestamps: true,
//     sequelize,
//     modelName: 'User'
//   })
// };

// module.exports = User;

"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) { }
  }
  User.init(
    {
      email: {
        type: DataTypes.STRING,
        unique: true
      },
      password: {
        type: DataTypes.STRING
      },
      address: {
        type: DataTypes.STRING
      },
      point: {
        type: DataTypes.INTEGER
      },
      role: {
        type: DataTypes.ENUM(['admin', 'user']),
        defaultValue: 'user'
      }
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      // timestamps: true,
    }
  );

  return User;
};
