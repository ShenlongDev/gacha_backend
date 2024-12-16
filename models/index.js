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

db.GachaCategory.hasMany(db.Gacha, { foreignKey: 'category_id' });
db.Gacha.belongsTo(db.GachaCategory, { foreignKey: 'category_id' });
db.User.hasMany(db.Address, { foreignKey: 'user_id' });
db.Address.belongsTo(db.User, { foreignKey: 'user_id' });
db.Gacha.hasMany(db.GachaUser, { foreignKey: 'gacha_id' });
db.GachaUser.belongsTo(db.Gacha, { foreignKey: 'gacha_id' });
db.User.hasMany(db.GachaUser, { foreignKey: 'user_id' });
db.GachaUser.belongsTo(db.User, { foreignKey: 'user_id' });
db.Address.hasMany(db.GachaUser, { foreignKey: 'address_id' });
db.GachaUser.belongsTo(db.Address, { foreignKey: 'address_id' });
// db.GachaUser.hasMany(db.User);
// db.User.belongsTo(db.GachaUser);
// db.GachaUser.hasMany(db.Gacha);
// db.Gacha.belongsTo(db.GachaUser);
// db.User.belongsToMany(db.Gacha, { through: 'GachaUser' });
// db.Gacha.belongsToMany(db.User, { through: 'GachaUser' });

module.exports = db;