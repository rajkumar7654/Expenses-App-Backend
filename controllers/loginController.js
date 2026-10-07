const User = require('../models/signUpModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');


// POST request for Login
const userLogin = async (req, res) => {

    try {

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ where: { email } });


        // User not found
        if (!user) {

            return res.status(401).json({
                message: "Invalid email"
            });
        }


        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);


        // Password incorrect
        if (!isPasswordValid) {

            return res.status(401).json({
                message: "Invalid password"
            });
        }


        // Password correct -> Create JWT
        const token = jwt.sign(
            {
                userId: user.id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );


        // Login successful
        return res.status(200).json({
            message: "Login successful",
            token,
            userName: user.name,
            isPremium: user.isPremium
        });


    } catch (error) {

        console.error("Error logging in user:", error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
};


// GET request
const getLogin = async (req, res) => {

    try {

        return res.sendFile(
            path.join(__dirname, '../../Frontend/loginForm.html')
        );

    } catch (error) {

        console.error("Error loading login page:", error);

        return res.status(500).json({
            error: "Internal server error"
        });
    }
};


module.exports = {
    userLogin,
    getLogin
};

