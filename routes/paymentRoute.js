const express = require('express');

const router = express.Router();

const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.getPaymentPage);
router.post('/create-order', paymentController.processPayment);
router.get('/status/:orderId', paymentController.getPaymentStatus);
router.get('/success', paymentController.getPaymentSuccess);


module.exports = router;