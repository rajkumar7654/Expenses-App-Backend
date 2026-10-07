const User = require('../models/signUpModel');
const Expense = require('../models/dashboardModel');
const ForgotPasswordRequest = require('../models/forgotPasswordRequestModel');

User.hasMany(Expense, {
    foreignKey: 'UserId'
});

Expense.belongsTo(User, {
    foreignKey: 'UserId'
});

User.hasMany(ForgotPasswordRequest, {
    foreignKey: 'UserId'
});

ForgotPasswordRequest.belongsTo(User, {
    foreignKey: 'UserId'
});

module.exports = {
    User,
    Expense,
    ForgotPasswordRequest
};