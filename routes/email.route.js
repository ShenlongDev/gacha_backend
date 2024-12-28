const express = require('express');
const sendEmail = require('../emailService');
const router = express.Router();

router.post('/send', async (req, res) => {
    console.log('email test');
    const { to, subject, text, html } = req.body;

    try {
        await sendEmail(to, subject, text, html);
        res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send email', error });
    }
});

module.exports = router;
