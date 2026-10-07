
const User = require('../models/signUpModel');
const bcrypt = require('bcrypt');
const sequelize = require('../utils/db-connection');
const path = require('path');


// POST request - Signup
const userSignUp = async (req, res) => {

    const transaction = await sequelize.transaction();

    try {

        console.log("Request body:", req.body);

        const {name, email, password} = req.body;


        // Check if email already exists
        const existingUser = await User.findOne({

            where: {
                email
            },

            transaction

        });


        if (existingUser) {

            await transaction.rollback();

            return res.status(400).json({
                message: "Email already exists"
            });
        }


        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);


        // Create user
        const user = await User.create(

            {
                name,
                email,
                password: hashedPassword,
                isPremium: false
            },

            {
                transaction
            }

        );


        console.log("User created:", user);


        // Commit transaction
        await transaction.commit();


   
        // Send response
        return res.status(201).json({

            id: user.id,

            name: user.name,

            email: user.email,

            isPremium: user.isPremium

        });


    } catch (error) {

        // Rollback transaction
        await transaction.rollback();


        console.error("Error creating user:",error);


        return res.status(500).json({

            error: error.message

        });
    }
};



// GET request - Signup Page
const getUserSignUp = async (req, res) => {

    try {

        return res.sendFile(
            path.join(__dirname,"../../Frontend/signUpForm.html")
        );

    } catch (error) {

        console.error("Error loading signup page:",error);

    }
};


module.exports = {

    userSignUp,

    getUserSignUp

};

