const User = require('../models/signUpModel');
const ForgotPasswordRequest = require('../models/forgotPasswordRequestModel');

User.hasMany(ForgotPasswordRequest);
ForgotPasswordRequest.belongsTo(User);
