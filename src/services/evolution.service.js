// Using native fetch


const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY; // Global Key if configured

class EvolutionService {
  /**
   * Envia uma mensagem de texto via Evolution API
   * @param {string} instanceName Nome da instância (cliente)
   * @param {string} number Número de telefone (remoteJid)
   * @param {string} text Texto a ser enviado
   */
  async sendText(instanceName, number, text) {
    try {
      const url = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;
      const body = {
        number: number,
        text: text
      };

      const headers = {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      };

      // Using fetch built-in
      console.log(`DEBUG: Sending to ${url}`, JSON.stringify(body));
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      const data = await response.json();
      console.log('DEBUG: Evolution Response:', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error(`Error sending text to ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Marca uma mensagem como lida
   */
  /**
   * Cria uma nova instância na Evolution API.
   * @param {string} instanceName Nome da instância
   * @param {string} token Token de integração (opcional)
   */
  async createInstance(instanceName, token = null) {
    try {
      const url = `${EVOLUTION_API_URL}/instance/create`;
      const body = {
        instanceName: instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      };

      if (token) {
        body.token = token;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`DEBUG: Failed to create instance. Status: ${response.status}`, data);

        // If instance already exists, treat as success (Idempotency)
        const errorMsg = data.message || data.error || '';
        const isAlreadyExists =
          response.status === 403 ||
          // response.status === 400 || // Removed 400 check to avoid masking bad requests
          (typeof errorMsg === 'string' && errorMsg.includes('already exists')) ||
          (Array.isArray(errorMsg) && errorMsg.some(m => typeof m === 'string' && m.includes('already exists')));

        if (isAlreadyExists) {
          console.log('DEBUG: Instance already exists during creation, fetching it instead...');
          const existing = await this.fetchInstance(instanceName);

          if (existing) {
            return existing;
          }

          console.warn('DEBUG: Instance exists but cannot be fetched (ZOMBIE). Deleting and recreating...');
          await this.deleteInstance(instanceName);
          // Retry creation once
          return await this.createInstance(instanceName, token);
        }

        throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) || 'Failed to create instance');
      }

      return data;
    } catch (error) {
      console.error(`Error creating instance ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Busca dados de uma instância (Status, etc).
   */
  async fetchInstance(instanceName) {
    try {
      const url = `${EVOLUTION_API_URL}/instance/fetchInstances?instanceName=${instanceName}`;
      console.log(`DEBUG: Fetching instance ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY }
      });

      if (!response.ok) {
        console.warn(`Fetch failed with status ${response.status}`);
        return null;
      }

      const data = await response.json();

      let foundInstance = null;
      // Evolution standard: might return array or object
      if (Array.isArray(data)) {
        // Find the exact match in the array
        foundInstance = data.find(i => i.instance && i.instance.instanceName === instanceName) ||
          data.find(i => i.name === instanceName);
      } else if (data && (data.instance || data.name)) {
        // If object, check if name matches
        const fetchedName = data.instance?.instanceName || data.name;
        if (fetchedName === instanceName) {
          foundInstance = data;
        }
      }

      if (foundInstance) {
        console.log(`DEBUG: Instance ${instanceName} found. Fetching connection state...`);
        // Fetch real connection state specifically
        try {
          const stateUrl = `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`;
          const stateRes = await fetch(stateUrl, { method: 'GET', headers: { 'apikey': EVOLUTION_API_KEY } });
          if (stateRes.ok) {
            const stateData = await stateRes.json();
            // Merge state into instance object (support both structures)
            if (stateData?.instance?.state) {
              foundInstance.instance = foundInstance.instance || {};
              foundInstance.instance.state = stateData.instance.state;
              foundInstance.instance.status = stateData.instance.state; // Duplicate for safety
            }
          }
        } catch (stateErr) {
          console.warn(`DEBUG: Failed to fetch connection state for ${instanceName}`, stateErr);
        }

        return foundInstance;
      }

      // Fallback: Fetch ALL instances and filter manually
      console.log(`DEBUG: Specific fetch failed, trying global fetch fallback...`);
      try {
        const urlAll = `${EVOLUTION_API_URL}/instance/fetchInstances`;
        const responseAll = await fetch(urlAll, { method: 'GET', headers: { 'apikey': EVOLUTION_API_KEY } });
        const dataAll = await responseAll.json();

        if (Array.isArray(dataAll)) {
          foundInstance = dataAll.find(i => (i.instance?.instanceName === instanceName) || (i.name === instanceName));
          if (foundInstance) {
            console.log(`DEBUG: Found ${instanceName} in global list fallback.`);
            return foundInstance;
          }
        }
      } catch (err) {
        console.warn('DEBUG: Global fetch fallback also failed', err);
      }

      console.log(`DEBUG: Instance ${instanceName} NOT found in response.`);
      return null;

    } catch (error) {
      console.error(`Error fetching instance ${instanceName}:`, error);
      return null;
    }
  }

  /**
   * Conecta a instância (Gera QR Code).
   */
  async connectInstance(instanceName) {
    try {
      const url = `${EVOLUTION_API_URL}/instance/connect/${instanceName}`;
      console.log(`DEBUG: Connecting to ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'apikey': EVOLUTION_API_KEY }
      });

      const data = await response.json();
      console.log('DEBUG: Connect response:', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error(`Error connecting instance ${instanceName}:`, error);
      throw error;
    }
  }

  async logoutInstance(instanceName) {
    const url = `${EVOLUTION_API_URL}/instance/logout/${instanceName}`;
    await fetch(url, { method: 'DELETE', headers: { 'apikey': EVOLUTION_API_KEY } });
  }

  async deleteInstance(instanceName) {
    try {
      const url = `${EVOLUTION_API_URL}/instance/delete/${instanceName}`;
      await fetch(url, { method: 'DELETE', headers: { 'apikey': EVOLUTION_API_KEY } });
      console.log(`DEBUG: Deleted instance ${instanceName}`);
    } catch (e) {
      console.error(`Error deleting instance ${instanceName}`, e);
    }
  }
}

module.exports = new EvolutionService();
