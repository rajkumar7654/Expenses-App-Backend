const express = require('express');

const router = express.Router();

const forgetPasswordController = require('../controllers/forgetPasswordController');

router.get('/', forgetPasswordController.getForgetPassword);

router.post('/forgotpassword', forgetPasswordController.userForgetPassword);

router.get('/resetpassword/:id', forgetPasswordController.getResetPassword);

router.post('/resetpassword/:id', forgetPasswordController.updatePassword);

module.exports = router;