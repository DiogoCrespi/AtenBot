const AuthService = require('../services/auth.service');

class AuthController {
    async register(req, res) {
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Name, email, and password are required' });
            }

            const result = await AuthService.register({ name, email, password });
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            const result = await AuthService.login(email, password);
            res.json(result);
        } catch (error) {
            if (error.message === 'Invalid credentials') {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            res.status(500).json({ error: error.message });
        }
    }

    async me(req, res) {
        try {
            // req.user will be populated by auth middleware
            const user = req.user;
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AuthController();
