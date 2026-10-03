
const Expense = require('../models/dashboardModel');
const User = require('../models/signUpModel');
const sequelize = require('../utils/db-connection');
const path = require('path');
const { suggestCategory } = require('../services/aiService');


// ===============================
// Premium Dashboard - GET
// No transaction
// ===============================

const getDashboard = async (req, res) => {

    try {

        return res.sendFile(
            path.join(
                __dirname,
                '../../Frontend/premium-dashboard.html'
            )
        );

    } catch (error) {

        console.error("Error loading premium dashboard:", error);

        return res.status(500).json({
            message: "Unable to load premium dashboard"
        });
    }
};


// ===============================
// Add Expense - POST
// Transaction
// ===============================

const addExpense = async (req, res) => {

    const transaction = await sequelize.transaction();

    try {

        const {
            amount,
            description,
            category
        } = req.body;


        // Use AI to suggest category if category is not provided
        const finalCategory =
            category || await suggestCategory(description);


        // Create expense
        const expense = await Expense.create(
            {
                amount,
                description,
                category: finalCategory,
                UserId: req.userId
            },
            {
                transaction
            }
        );


        // Increment user's totalExpenses
        await User.increment(
            'totalExpenses',
            {
                by: parseFloat(amount),
                where: {
                    id: req.userId
                },
                transaction
            }
        );


        // Commit transaction
        await transaction.commit();


        return res.status(201).json(expense);


    } catch (error) {

        // Rollback transaction
        await transaction.rollback();

        console.error("Error adding expense:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// ===============================
// Get Expenses - GET
// No transaction
// ===============================

const getExpensesByUserId = async (req, res) => {

    try {

        const expenses = await Expense.findAll({

            where: {
                UserId: req.userId
            }

        });


        return res.status(200).json(expenses);


    } catch (error) {

        console.error("Error fetching expenses:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// ===============================
// Update Expense - PUT
// Transaction
// ===============================

const updateExpense = async (req, res) => {

    const transaction = await sequelize.transaction();

    try {

        const { id } = req.params;

        const {
            amount,
            description,
            category
        } = req.body;


        // Get old expense
        const oldExpense = await Expense.findOne({

            where: {
                id: id,
                UserId: req.userId
            },

            transaction

        });


        // Expense not found
        if (!oldExpense) {

            await transaction.rollback();

            return res.status(404).json({
                message: "Expense not found"
            });
        }


        // Update expense
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
                },

                transaction
            }
        );


        // Check whether update happened
        if (updatedRows === 0) {

            await transaction.rollback();

            return res.status(404).json({
                message: "Expense not found"
            });
        }


        // Calculate difference
        const difference =
            parseFloat(amount) -
            parseFloat(oldExpense.amount);


        // Update user's totalExpenses
        await User.increment(
            'totalExpenses',
            {
                by: difference,

                where: {
                    id: req.userId
                },

                transaction
            }
        );


        // Get updated expense
        const updatedExpense = await Expense.findOne({

            where: {
                id: id,
                UserId: req.userId
            },

            transaction

        });


        // Commit transaction
        await transaction.commit();


        return res.status(200).json(updatedExpense);


    } catch (error) {

        // Rollback transaction
        await transaction.rollback();

        console.error("Error updating expense:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// ===============================
// Delete Expense - DELETE
// Transaction
// ===============================

const deleteExpense = async (req, res) => {

    const transaction = await sequelize.transaction();

    try {

        const { id } = req.params;


        // Get expense before deleting
        const expense = await Expense.findOne({

            where: {
                id: id,
                UserId: req.userId
            },

            transaction

        });


        // Expense not found
        if (!expense) {

            await transaction.rollback();

            return res.status(404).json({
                message: "Expense not found"
            });
        }


        // Delete expense
        const deletedRows = await Expense.destroy({

            where: {
                id: id,
                UserId: req.userId
            },

            transaction

        });


        // Check whether delete happened
        if (deletedRows === 0) {

            await transaction.rollback();

            return res.status(404).json({
                message: "Expense not found"
            });
        }


        // Decrement user's totalExpenses
        await User.decrement(
            'totalExpenses',
            {
                by: parseFloat(expense.amount),

                where: {
                    id: req.userId
                },

                transaction
            }
        );


        // Commit transaction
        await transaction.commit();


        return res.status(200).json({
            message: "Expense deleted successfully"
        });


    } catch (error) {

        // Rollback transaction
        await transaction.rollback();

        console.error("Error deleting expense:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// ===============================
// Leaderboard - GET
// No transaction
// ===============================

const getLeaderboard = async (req, res) => {

    try {

        const leaderboard = await User.findAll({

            attributes: [
                'name',
                'totalExpenses'
            ],

            order: [
                ['totalExpenses', 'DESC']
            ]

        });


        // Format leaderboard
        const formattedLeaderboard =
            leaderboard.map(user => ({

                name: user.name,

                total_cost: user.totalExpenses

            }));


        return res.status(200).json(formattedLeaderboard);


    } catch (error) {

        console.error("Error fetching leaderboard:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};


// ===============================
// EXPORT
// ===============================

module.exports = {

    getDashboard,

    addExpense,

    getExpensesByUserId,

    updateExpense,

    deleteExpense,

    getLeaderboard

};

