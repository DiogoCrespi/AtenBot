const evolutionService = require('../services/evolution.service');

class InstanceController {

    // Helper to generate consistent instance name
    getInstanceName(user) {
        return `atenbot_${user.id.replace(/-/g, '')}`;
    }

    async getStatus(req, res) {
        try {
            const instanceName = this.getInstanceName(req.user);
            const info = await evolutionService.fetchInstance(instanceName);
            console.log(`DEBUG: Controller getStatus info for ${instanceName}:`, info);

            if (!info) {
                console.log('DEBUG: Instance not found, returning NOT_CREATED');
                return res.json({ status: 'NOT_CREATED', instanceName });
            }
            console.log('DEBUG: Instance found, returning CREATED');
            return res.json({ status: 'CREATED', data: info, instanceName });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async create(req, res) {
        try {
            console.log('DEBUG: InstanceController.create called');
            const instanceName = this.getInstanceName(req.user);
            console.log(`DEBUG: Creating instance ${instanceName}`);

            // Ensure instance doesn't exist or handle idempotency service-side
            const result = await evolutionService.createInstance(instanceName);
            console.log('DEBUG: Instance creation result:', result);
            res.json(result);
        } catch (error) {
            console.error('DEBUG: Instance creation error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    async connect(req, res) {
        try {
            const instanceName = this.getInstanceName(req.user);
            const result = await evolutionService.connectInstance(instanceName);
            res.json(result); // Should contain base64 QR or code
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const instanceName = this.getInstanceName(req.user);
            await evolutionService.deleteInstance(instanceName);
            res.json({ message: 'Instance deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new InstanceController();
