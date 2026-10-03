const User = require('../models/signUpModel');

const premiumMiddleware = async (req, res, next) => {

    const user = await User.findByPk(req.userId);

    if (!user || !user.isPremium) {
        return res.status(403).json({
            message: "Premium access required"
        });
    }

    next();
};

module.exports = premiumMiddleware;