const User = require("../models/signUpModel");
const Expense = require("../models/dashboardModel");
const sequelize = require("../utils/db-connection");

const updateTotalExpenses = async () => {
    try {
        const users = await User.findAll({
            where: {
                totalExpenses: 0
            }
        });

        for (const user of users) {
            const expenses = await Expense.findAll({
                where: { UserId: user.id },
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total']
                ]
            });

            const total = expenses[0]?.dataValues.total || 0;

            if (total > 0) {
                await user.update({ totalExpenses: total });
                console.log(`Updated ${user.name}'s totalExpenses to ₹${total}`);
            }
        }
    } catch (error) {
        console.error('Error updating totalExpenses on startup:', error);
    }
};

module.exports = { updateTotalExpenses };
