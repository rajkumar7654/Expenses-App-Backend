
const Expense = require('../models/dashboardModel');
const User = require('../models/signUpModel');
const sequelize = require('../utils/db-connection');
const path = require('path');


// Premium Dashboard
const getDashboard = (req, res) => {
    res.sendFile(
        path.join(__dirname, '../../Frontend/premium-dashboard.html')
    );
};


// Add Expense
const addExpense = async (req, res) => {
    try {
        const { amount, description, category } = req.body;

        const expense = await Expense.create({
            amount,
            description,
            category,
            UserId: req.userId
        });

        res.status(201).json(expense);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};


// Get Expenses
const getExpensesByUserId = async (req, res) => {
    try {
        const expenses = await Expense.findAll({
            where: {
                UserId: req.userId
            }
        });

        res.status(200).json(expenses);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};


// Update Expense
const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            amount,
            description,
            category
        } = req.body;

        const [updatedRows] = await Expense.update(
            {
                amount,
                description,
                category
            },
            {
                where: {
                    id: id,
                    UserId: req.userId
                }
            }
        );

        if (updatedRows === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        const updatedExpense = await Expense.findOne({
            where: {
                id: id,
                UserId: req.userId
            }
        });

        res.status(200).json(updatedExpense);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};


// Delete Expense
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedRows = await Expense.destroy({
            where: {
                id: id,
                UserId: req.userId
            }
        });

        if (deletedRows === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.status(200).json({
            message: "Expense deleted successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};


// Leaderboard
const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await userAggregateExpenses();

        res.status(200).json(leaderboard);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};


// Aggregate Expenses
const userAggregateExpenses = async () => {
    try {
        const expenses = await Expense.findAll({
            attributes: [
                'UserId',
                [
                    sequelize.fn(
                        'SUM',
                        sequelize.col('amount')
                    ),
                    'total_cost'
                ]
            ],
            group: ['UserId'],
            order: [
                [
                    sequelize.fn(
                        'SUM',
                        sequelize.col('amount')
                    ),
                    'DESC'
                ]
            ]
        });

        const userLeaderBoardDetails = [];

        for (const element of expenses) {
            const user = await User.findOne({
                where: {
                    id: element.UserId
                }
            });

            userLeaderBoardDetails.push({
                name: user.name,
                total_cost: element.dataValues.total_cost
            });
        }

        return userLeaderBoardDetails;

    } catch (error) {
        console.error(error);
        throw error;
    }
};


module.exports = {
    getDashboard,
    addExpense,
    getExpensesByUserId,
    updateExpense,
    deleteExpense,
    getLeaderboard
};

