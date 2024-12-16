module.exports = {
	host: "localhost",
	username: "root",
	password: "",
	database: "gacha",

	dialect: "mysql",
	pool: {
		max: 5,
		min: 0,
		acquire: 120000,
		idle: 120000
	},
	dialectOptions: {
		connectTimeout: 90000
	}
};