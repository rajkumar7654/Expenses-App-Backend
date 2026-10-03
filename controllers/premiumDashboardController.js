
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

        // Increment user's totalExpenses
        await User.increment('totalExpenses', {
            by: parseFloat(amount),
            where: { id: req.userId }
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

        // Get old expense before updating
        const oldExpense = await Expense.findOne({
            where: {
                id: id,
                UserId: req.userId
            }
        });

        if (!oldExpense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

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

        // Adjust user's totalExpenses by the difference
        const difference = parseFloat(amount) - parseFloat(oldExpense.amount);
        await User.increment('totalExpenses', {
            by: difference,
            where: { id: req.userId }
        });

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

        // Get expense amount before deleting
        const expense = await Expense.findOne({
            where: {
                id: id,
                UserId: req.userId
            }
        });

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

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

        // Decrement user's totalExpenses
        await User.decrement('totalExpenses', {
            by: parseFloat(expense.amount),
            where: { id: req.userId }
        });

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
        const leaderboard = await User.findAll({
            attributes: ['name', 'totalExpenses'],
            order: [
                ['totalExpenses', 'DESC']
            ]
        });

        const formattedLeaderboard = leaderboard.map(user => ({
            name: user.name,
            total_cost: user.totalExpenses
        }));

        res.status(200).json(formattedLeaderboard);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
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

