const User = require("./signUpModel");
const Expense = require("./dashboardModel");

// One User has many Expenses
User.hasMany(Expense);

// One Expense belongs to one User
Expense.belongsTo(User);

module.exports = {
    User,
    Expense
};
