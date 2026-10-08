const path = require('path');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const User = require('../models/signUpModel');
const ForgotPasswordRequest = require('../models/forgotPasswordRequestModel');
const bcrypt = require('bcrypt');

const getForgetPassword = (req, res) => {
    try {
        return res.sendFile(path.join(__dirname, '../../Frontend/forgetPassword.html'));
    } catch (error) {
        console.error("Error loading forget password page:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const userForgetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const forgotPasswordRequest = await ForgotPasswordRequest.create({
            UserId: user.id,
            isActive: true
        });

        const resetUrl = `http://localhost:3000/forgetpassword/resetpassword/${forgotPasswordRequest.id}`;

        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications['api-key'];
        apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: email }];
        sendSmtpEmail.sender = { email: process.env.SENDER_EMAIL || 'your-email@example.com' };
        sendSmtpEmail.subject = 'Password Reset Request';
        sendSmtpEmail.htmlContent = `
            <html>
                <body>
                    <h1>Password Reset</h1>
                    <p>Hello ${user.name},</p>
                    <p>We received a request to reset your password.</p>
                    <p>Click the link below to reset your password:</p>
                    <a href="${resetUrl}">${resetUrl}</a>
                    <p>If you did not request this, please ignore this email.</p>
                </body>
            </html>
        `;

        console.log('Sending email to:', email);
        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully:', result);

        res.status(200).json({ message: 'Password reset email sent successfully', requestId: forgotPasswordRequest.id });
    } catch (error) {
        console.error('Error sending password reset email:', error);
        console.error('Error details:', error.response ? error.response.body : error.message);
        res.status(500).json({ message: 'Error sending email. Please check your API key configuration.', error: error.message });
    }
};

const getResetPassword = async (req, res) => {
    try {
        const { id } = req.params;

        const forgotPasswordRequest = await ForgotPasswordRequest.findOne({
            where: { id, isActive: true }
        });

        if (!forgotPasswordRequest) {
            return res.status(400).json({ message: 'Invalid or expired reset link' });
        }

        return res.sendFile(path.join(__dirname, '../../Frontend/resetPassword.html'));
    } catch (error) {
        console.error('Error loading reset password page:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updatePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const forgotPasswordRequest = await ForgotPasswordRequest.findOne({
            where: { id, isActive: true }
        });

        if (!forgotPasswordRequest) {
            return res.status(400).json({ message: 'Invalid or expired reset link' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.update({ password: hashedPassword }, { where: { id: forgotPasswordRequest.UserId } });

        await ForgotPasswordRequest.update({ isActive: false }, { where: { id } });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Error updating password', error: error.message });
    }
};

module.exports = {
    getForgetPassword,
    userForgetPassword,
    getResetPassword,
    updatePassword
};