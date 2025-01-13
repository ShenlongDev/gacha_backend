// const dbConfig = require("../configs/postgre-config");
const dbConfig = require("../configs/postgre-config_server");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.GachaCategory = require("./gacha_category.model.js")(sequelize, Sequelize);
db.User = require("./user.model.js")(sequelize, Sequelize);
db.Gacha = require("./gacha.model.js")(sequelize, Sequelize);
db.GachaUser = require("./gacha_user.model.js")(sequelize, Sequelize);
db.Address = require("./address.model.js")(sequelize, Sequelize);
db.Badge = require("./badge.model.js")(sequelize, Sequelize);
db.Gift = require("./gift.model.js")(sequelize, Sequelize);
db.Payment = require("./payment.model.js")(sequelize, Sequelize);
db.GachaScore = require("./gacha_score.model.js")(sequelize, Sequelize);
db.Notification = require("./notification.model.js")(sequelize, Sequelize);
db.Log = require("./log.model.js")(sequelize, Sequelize);
db.Coupon = require("./coupon.model.js")(sequelize, Sequelize);
db.Prize = require("./prize.model.js")(sequelize, Sequelize);
db.Header = require("./header.model.js")(sequelize, Sequelize);

db.GachaCategory.hasMany(db.Gacha, { foreignKey: 'category_id' });
db.Gacha.belongsTo(db.GachaCategory, { foreignKey: 'category_id' });
db.User.hasMany(db.Address, { foreignKey: 'user_id' });
db.Address.belongsTo(db.User, { foreignKey: 'user_id' });
db.User.hasMany(db.Coupon, { foreignKey: 'user_id' });
db.Coupon.belongsTo(db.User, { foreignKey: 'user_id' });
db.User.hasMany(db.GachaScore, { foreignKey: 'user_id' });
db.GachaScore.belongsTo(db.User, { foreignKey: 'user_id' });
db.User.hasMany(db.GachaUser, { foreignKey: 'user_id' });
db.GachaUser.belongsTo(db.User, { foreignKey: 'user_id' });
db.GachaUser.hasMany(db.GachaScore, { foreignKey: 'gacha_user_id' });
db.Gacha.hasMany(db.GachaUser, { foreignKey: 'gacha_id' });
db.GachaUser.belongsTo(db.Gacha, { foreignKey: 'gacha_id' });
db.GachaUser.hasMany(db.Gacha, { foreignKey: 'gacha_id' });
db.GachaScore.belongsTo(db.GachaUser, { foreignKey: 'gacha_user_id' });
db.Address.hasMany(db.GachaUser, { foreignKey: 'address_id' });
db.GachaUser.belongsTo(db.Address, { foreignKey: 'address_id' });
db.User.hasMany(db.Payment, { foreignKey: 'user_id' });
db.Payment.belongsTo(db.User, { foreignKey: 'user_id' });
db.User.hasMany(db.Log, { foreignKey: 'user_id' });
db.Log.belongsTo(db.User, { foreignKey: 'user_id' });


module.exports = db;