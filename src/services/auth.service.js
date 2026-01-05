const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

class AuthService {
    constructor() {
        this.secret = process.env.JWT_SECRET || 'atenbot_jwt_secret_change_me';
        this.expiresIn = '7d';
    }

    async register(data) {
        const { name, email, password } = data;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            settings: {
                botTone: 'professional',
                autoReply: false, // Default off until configured
                maxTokens: 2000
            }
        });

        const token = this.generateToken(user);

        return { user: this.sanitizeUser(user), token };
    }

    async login(email, password) {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const token = this.generateToken(user);

        return { user: this.sanitizeUser(user), token };
    }

    generateToken(user) {
        return jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            this.secret,
            { expiresIn: this.expiresIn }
        );
    }

    sanitizeUser(user) {
        const { password, ...userWithoutPassword } = user.toJSON();
        return userWithoutPassword;
    }
}

module.exports = new AuthService();
