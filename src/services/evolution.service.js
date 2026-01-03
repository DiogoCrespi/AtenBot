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
  async markAsRead(instanceName, messageId) {
    // Implementação futura se necessário
  }
}

module.exports = new EvolutionService();
