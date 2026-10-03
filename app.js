require('dotenv').config();

const express = require('express');

const app = express();

const port = 3000;



//importing routes

const path = require('path');

const cors = require('cors');

//Associations
const { User, Expense } = require('./associations/associations');
User.hasMany(Expense);
Expense.belongsTo(User);


const loginRoute = require('./routes/loginRoute');

const signUpRoute = require('./routes/signUpRoute');

const dashboardRoute = require('./routes/dashboardRoute');

const paymentRoute = require('./routes/paymentRoute');

const premiumDashboardRoute = require('./routes/premiumDashboardRoute');

//data base 

const sequelize = require('./utils/db-connection');



// Middleware

app.use(cors());

app.use(express.json());

app.use(express.static(path.join(__dirname, '../Frontend')));



// Import associations

require("./models/userAndExpensesAssociation.js");



//SignUp routes

app.use('/user', signUpRoute);

app.use('/dashboard', dashboardRoute);

app.use('/premium-dashboard', premiumDashboardRoute);

app.use('/payment', paymentRoute); 



//Login routes



app.use('/user', loginRoute);





sequelize.sync({ alter: true }).then(async () => {

    // Update existing users' totalExpenses on startup
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

    app.listen(port, () => {

        console.log(`Server running on port ${port}`);

    });

}).catch((error) => {

    console.error('Unable to connect to the database:', error);

});