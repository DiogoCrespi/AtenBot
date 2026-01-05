const { User } = require('../models');

class ConfigController {

    async getSettings(req, res) {
        try {
            // req.user is populated by auth middleware
            // We perform a fresh fetch to ensure data is up to date
            const user = await User.findByPk(req.user.id);
            if (!user) return res.status(404).json({ error: 'User not found' });

            res.json({ ...user.settings, isActive: user.isActive });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateSettings(req, res) {
        try {
            const { systemPrompt, botTone, autoReply } = req.body;
            const user = await User.findByPk(req.user.id);

            if (!user) return res.status(404).json({ error: 'User not found' });

            // Merge existing settings with new ones
            const newSettings = {
                ...user.settings,
                systemPrompt: systemPrompt !== undefined ? systemPrompt : user.settings?.systemPrompt,
                botTone: botTone !== undefined ? botTone : user.settings?.botTone,
                autoReply: autoReply !== undefined ? autoReply : user.settings?.autoReply,
            };

            user.settings = newSettings;

            // Explicitly handle isActive column if passed
            if (req.body.isActive !== undefined) {
                user.isActive = req.body.isActive;
            }

            await user.save();

            res.json({
                message: 'Settings updated',
                settings: { ...user.settings, isActive: user.isActive },
                isActive: user.isActive
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ConfigController();
