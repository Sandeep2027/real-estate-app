const express = require('express');
const propertyController = require('../controllers/propertyController');

const router = express.Router();

router.post('/add', propertyController.addProperty);
router.get('/', propertyController.getProperties);
router.get('/search', propertyController.searchProperties);
router.put('/approve/:id', propertyController.approveProperty);
router.post('/interest', propertyController.addInterest);
router.get('/interests', propertyController.getInterests);

module.exports = router;