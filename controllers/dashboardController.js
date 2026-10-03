const Expense = require('../models/dashboardModel');
const User = require('../models/signUpModel');
const path = require('path');


const addExpense = async (req, res) => {

    try {

        const { amount, description, category } = req.body;
        console.log("Received expense data:", { amount, description, category, userId: req.userId });


        const expense = await Expense.create({ amount, description, category, UserId: req.userId });
        console.log("Expense created:", expense);

        // Increment user's totalExpenses
        await User.increment('totalExpenses', {
            by: parseFloat(amount),
            where: { id: req.userId }
        });

        res.status(201).json(expense);
    } catch (error) {

        console.error("Error creating expense:", error);
        res.status(500).json({ message: error.message });

    }

};



const getDashboard = async (req, res) => {
    return res.sendFile(
        path.join(__dirname, "../../Frontend/dashboard.html")
    );
};



const getExpensesByUserId = async (req, res) => {

    try {
        console.log("Logged-in user ID:", req.userId);
        const expenses = await Expense.findAll({ where: { UserId: req.userId } });

        console.log("Expenses found:", expenses);
        res.status(200).json(expenses);
    } catch (error) {

        console.error("Error fetching expenses:", error);

        res.status(500).json({ message: error.message });

    }

};



const deleteExpense = async (req, res) => {

    try {

        const { id } = req.params;

        // Get expense amount before deleting
        const expense = await Expense.findOne({
            where: { id: id, UserId: req.userId }
        });

        if (!expense) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        await Expense.destroy({ where: { id: id, UserId: req.userId } });

        // Decrement user's totalExpenses
        await User.decrement('totalExpenses', {
            by: parseFloat(expense.amount),
            where: { id: req.userId }
        });

        res.status(200).json({ message: "Expense deleted successfully" });

    } catch (error) {

        console.error("Error deleting expense:", error);

        res.status(500).json({ message: error.message });

    }

};



const updateExpense = async (req, res) => {

    try {

        const { id } = req.params;

        const { amount, description, category } = req.body;

        // Get old expense before updating
        const oldExpense = await Expense.findOne({
            where: { id: id, UserId: req.userId }
        });

        if (!oldExpense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        const expense = await Expense.update({ amount, description, category }, {
            where: { id: id, UserId: req.userId }
        });

        if (!expense) {

            return res.status(404).json({ message: "Expense not found" });

        }

        // Adjust user's totalExpenses by the difference
        const difference = parseFloat(amount) - parseFloat(oldExpense.amount);
        await User.increment('totalExpenses', {
            by: difference,
            where: { id: req.userId }
        });

        const updatedExpense = await Expense.findOne({
            where: { id: id, UserId: req.userId }
        });

        res.status(200).json(updatedExpense);

    } catch (error) {

        console.error("Error updating expense:", error);

        res.status(500).json({ message: error.message });

    }

};



module.exports = {

    addExpense,

    getDashboard,

    getExpensesByUserId,

    deleteExpense,

    updateExpense

};