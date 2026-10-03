const User = require('../models/signUpModel');
const Expense = require('../models/dashboardModel');

User.hasMany(Expense, {
    foreignKey: 'UserId'
});

Expense.belongsTo(User, {
    foreignKey: 'UserId'
});

module.exports = {
    User,
    Expense
};