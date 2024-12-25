module.exports = (sequelize, Sequelize) => {
	const gachaScore = sequelize.define("GachaScore", {
		user_id: {
			type: Sequelize.INTEGER,
		},
		gacha_id: {
			type: Sequelize.INTEGER,
		},
		score: {
			type: Sequelize.INTEGER,
		},
	},
		{
			timestamps: false
		});
	return gachaScore;
};