const express = require('express');
const router = express.Router();
const ConfigController = require('../controllers/config.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', (req, res) => ConfigController.getSettings(req, res));
router.put('/', (req, res) => ConfigController.updateSettings(req, res));

module.exports = router;
