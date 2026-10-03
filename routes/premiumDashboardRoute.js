const express = require('express');

const router = express.Router();

const premiumDashboardController = require('../controllers/premiumDashboardController');

const authMiddleware = require('../middleware/authMiddleware');
const premiumAuthMiddleware = require('../middleware/premiumAuthMiddleware');



router.get('/', premiumDashboardController.getDashboard);
router.post('/add', authMiddleware, premiumAuthMiddleware, premiumDashboardController.addExpense);
router.get('/expense', authMiddleware, premiumAuthMiddleware, premiumDashboardController.getExpensesByUserId);
router.put('/expense/:id', authMiddleware, premiumAuthMiddleware, premiumDashboardController.updateExpense);
router.delete('/expense/:id', authMiddleware, premiumAuthMiddleware, premiumDashboardController.deleteExpense);
router.get('/leaderboard', authMiddleware, premiumAuthMiddleware, premiumDashboardController.getLeaderboard);




module.exports = router;