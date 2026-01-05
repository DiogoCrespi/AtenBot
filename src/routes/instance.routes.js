const express = require('express');
const router = express.Router();
const InstanceController = require('../controllers/instance.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

router.get('/status', (req, res) => InstanceController.getStatus(req, res));
router.post('/create', (req, res) => InstanceController.create(req, res));
router.get('/connect', (req, res) => InstanceController.connect(req, res));
router.delete('/', (req, res) => InstanceController.delete(req, res));

module.exports = router;
