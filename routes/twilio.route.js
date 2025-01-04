const express = require('express');
require('dotenv').config();
const twilio = require('twilio');
const router = express.Router();

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);


router.post('/send-sms', (req, res) => {
    const { to } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000);
    client.messages.create({
        to: to,
        from: '12343513500',
        // from: 'YOUR_TWILIO_PHONE_NUMBER',
        body: `Your verification code is: ${code}`
    })
        .then((message) => {
            console.log(`Message sent: ${message.sid}`);
            res.status(200).send('SMS sent successfully!');
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Failed to send SMS.');
        });
});

module.exports = router;