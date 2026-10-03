
const User = require('../models/signUpModel');
const bcrypt = require('bcrypt');
const path = require('path');

//POST request
const userSignUp = async (req, res) => {
    try {
        console.log("Request body:", req.body);

        const { name, email, password } = req.body;

        //Email Checking
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }
        
        // Hash Password Before Storing
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await User.create({ name, email, password: hashedPassword, isPremium: false });
        console.log("User created:", user);
        res.status(201).json({ id: user.id, name: user.name, email: user.email, isPremium: user.isPremium });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: error.message });
    }
};

//GET request
const getUserSignUp = (req, res) => {
    res.sendFile(
        path.join(__dirname, "../../Frontend/signUpForm.html")
    );
};



module.exports = {userSignUp, getUserSignUp};