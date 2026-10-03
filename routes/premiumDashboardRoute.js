const express = require('express');

const router = express.Router();

const premiumDashboardController = require('../controllers/premiumDashboardController');

const authMiddleware = require('../middleware/authMiddleware');

const premiumAuthMiddleware = require('../middleware/premiumAuthMiddleware');


// Dashboard
router.get('/', premiumDashboardController.getDashboard);


// Add Expense
router.post('/add', authMiddleware, premiumAuthMiddleware, premiumDashboardController.addExpense);


// Get Expenses
router.get('/expense', authMiddleware, premiumAuthMiddleware, premiumDashboardController.getExpensesByUserId);


// Update Expense
router.put('/expense/:id', authMiddleware, premiumAuthMiddleware, premiumDashboardController.updateExpense);


// Delete Expense
router.delete('/expense/:id', authMiddleware, premiumAuthMiddleware, premiumDashboardController.deleteExpense);


// Leaderboard
router.get('/leaderboard', authMiddleware, premiumAuthMiddleware, premiumDashboardController.getLeaderboard);


module.exports = router;