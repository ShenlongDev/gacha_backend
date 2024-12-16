module.exports = (sequelize, Sequelize) => {
	const address = sequelize.define("Address", {
		user_id: {
			type: Sequelize.INTEGER,
		},
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
		checked: {
			type: Sequelize.BOOLEAN,
			defaultValue: false,
		}
	},
		{
			timestamps: false
		});
	return address;
};