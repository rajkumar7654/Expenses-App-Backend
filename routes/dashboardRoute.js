const express = require('express');

const router = express.Router();

const dashboardController = require('../controllers/dashboardController');

const authMiddleware = require('../middleware/authMiddleware');



router.get('/', dashboardController.getDashboard);
router.post('/add', authMiddleware, dashboardController.addExpense);
router.get('/expense', authMiddleware, dashboardController.getExpensesByUserId);
router.put('/expense/:id', authMiddleware, dashboardController.updateExpense);
router.delete('/expense/:id', authMiddleware, dashboardController.deleteExpense);




module.exports = router;