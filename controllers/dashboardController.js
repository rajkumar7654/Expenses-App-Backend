
const Expense = require('../models/dashboardModel');
const User = require('../models/signUpModel');
const path = require('path');
const { suggestCategory } = require('../services/aiService');
const sequelize = require('../utils/db-connection');


// =========================
// ADD EXPENSE
// =========================

const addExpense = async (req, res) => {

    const transaction = await sequelize.transaction();

    try {

        const { amount, description, category } = req.body;

        console.log("Received expense data:", {
            amount,
            description,
            category,
            userId: req.userId
        });

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

        console.log("Expense created:", expense);

        // Increment user's total expenses
        await User.increment('totalExpenses', {
            by: parseFloat(amount),
            where: {
                id: req.userId
            },
            transaction
        });

        // Commit transaction
        await transaction.commit();

        res.status(201).json(expense);

    } catch (error) {

        // Rollback transaction
        await transaction.rollback();

        console.error("Error creating expense:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// =========================
// GET DASHBOARD
// =========================

const getDashboard = async (req, res) => {

    return res.sendFile(
        path.join(__dirname, "../../Frontend/dashboard.html")
    );

};


// =========================
// GET EXPENSES BY USER
// =========================

const getExpensesByUserId = async (req, res) => {

    try {

        console.log("Logged-in user ID:", req.userId);

        const expenses = await Expense.findAll({
            where: {
                UserId: req.userId
            }
        });

        console.log("Expenses found:", expenses);

        res.status(200).json(expenses);

    } catch (error) {

        console.error("Error fetching expenses:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// =========================
// DELETE EXPENSE
// =========================

const deleteExpense = async (req, res) => {

    const transaction = await sequelize.transaction();

    try {

        const { id } = req.params;

        // Find expense before deleting
        const expense = await Expense.findOne({
            where: {
                id: id,
                UserId: req.userId
            },
            transaction
        });

        if (!expense) {

            await transaction.rollback();

            return res.status(404).json({
                message: "Expense not found"
            });
        }

        // Delete expense
        await Expense.destroy({
            where: {
                id: id,
                UserId: req.userId
            },
            transaction
        });

        // Decrease user's total expenses
        await User.decrement('totalExpenses', {
            by: parseFloat(expense.amount),
            where: {
                id: req.userId
            },
            transaction
        });

        // Commit transaction
        await transaction.commit();

        res.status(200).json({
            message: "Expense deleted successfully"
        });

    } catch (error) {

        await transaction.rollback();

        console.error("Error deleting expense:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// =========================
// UPDATE EXPENSE
// =========================

const updateExpense = async (req, res) => {

    const transaction = await sequelize.transaction();

    try {

        const { id } = req.params;

        const {
            amount,
            description,
            category
        } = req.body;


        // Find old expense
        const oldExpense = await Expense.findOne({
            where: {
                id: id,
                UserId: req.userId
            },
            transaction
        });

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


        if (updatedRows === 0) {

            await transaction.rollback();

            return res.status(404).json({
                message: "Expense not found"
            });
        }


        // Calculate difference
        const difference =
            parseFloat(amount) - parseFloat(oldExpense.amount);


        // Update user's total expenses
        await User.increment('totalExpenses', {
            by: difference,
            where: {
                id: req.userId
            },
            transaction
        });


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


        res.status(200).json(updatedExpense);

    } catch (error) {

        await transaction.rollback();

        console.error("Error updating expense:", error);

        res.status(500).json({
            message: error.message
        });
    }
};


// =========================
// EXPORT CONTROLLERS
// =========================

module.exports = {

    addExpense,
    getDashboard,
    getExpensesByUserId,
    deleteExpense,
    updateExpense

};

