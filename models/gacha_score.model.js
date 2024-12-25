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
		status: {
			type: Sequelize.ENUM(['ordered', 'delivering', 'completed', 'returned']),
			defaultValue: 'ordered'
		},
	},
		{
			timestamps: false
		});
	return gachaScore;
};