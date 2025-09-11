const express = require('express');
const messageController = require('../controllers/messageController');

const router = express.Router();

router.post('/send', messageController.sendMessage);
router.get('/:withUserId', messageController.getMessages);
router.post('/schedule', messageController.scheduleMeeting);
router.get('/meetings', messageController.getMeetings);

module.exports = router;