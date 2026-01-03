const { GoogleGenerativeAI } = require('@google/generative-ai');
const BaseProvider = require('./BaseProvider');

class GeminiProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.keys = [config.apiKey];
    if (config.apiKeyBackup) {
      this.keys.push(config.apiKeyBackup);
    }
    this.currentKeyIndex = 0;
    this.model = null;
    this.initialize();
  }

  initialize() {
    try {
      const currentKey = this.keys[this.currentKeyIndex];
      if (!currentKey) {
        throw new Error('API Key do Gemini não configurada no construtor');
      }

      console.log(`Inicializando Gemini (Key Index: ${this.currentKeyIndex}) com modelo:`, this.config.model || 'gemini-2.5-flash');
      const genAI = new GoogleGenerativeAI(currentKey);
      this.model = genAI.getGenerativeModel({
        model: this.config.model || 'gemini-2.5-flash'
      });
      console.log('Gemini inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar Gemini:', error.message);
      throw error;
    }
  }

  rotateKey() {
    if (this.keys.length <= 1) return false;

    console.warn(`[GeminiProvider] Rotating API Key due to error...`);
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
    this.initialize();
    return true;
  }

  async validateConfig() {
    if (!this.config.apiKey) {
      console.error('API Key do Gemini não configurada na validação');
      throw new Error('API Key do Gemini não configurada');
    }
    return true;
  }

  getSystemPrompt() {
    return `Você é o AtenBot, um assistente jurídico virtual especializado em direito brasileiro. 
    Suas principais características são:
    - Profissional e formal, mas acessível
    - Focado em fornecer orientações jurídicas iniciais
    - Sempre enfatiza a importância de consultar um advogado para casos específicos
    - Respeitoso e empático com os usuários
    - Claro e direto nas explicações
    - Sempre menciona que suas respostas são apenas orientações iniciais
    
    Ao responder:
    1. Mantenha um tom profissional mas acolhedor
    2. Explique conceitos jurídicos de forma simples
    3. Quando necessário, mencione a legislação relevante
    4. Sempre sugira buscar um advogado para casos específicos
    5. Evite dar conselhos definitivos ou assumir responsabilidade por decisões
    
    Lembre-se: Você é um assistente inicial, não um substituto para um advogado.`;
  }

  formatChatHistory(history) {
    if (!history || !Array.isArray(history)) {
      return [];
    }

    // Filtrar apenas as mensagens relevantes e formatar corretamente
    return history
      .filter(msg => msg.content && msg.content.trim() !== '')
      .map(msg => ({
        role: msg.role, // Usar o role que já vem formatado do whatsappService
        parts: [{ text: msg.content }]
      }));
  }

  async generateResponse(message, context = {}) {
    const maxAttempts = this.keys.length; // Try each key once
    let lastError = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.validateConfig();

        // Only log on first attempt to avoid noise
        if (attempt === 0) {
          const msgLog = message ? message.substring(0, 50) : '[Multimodal Content]';
          console.log('Gerando resposta com Gemini para mensagem:', msgLog + '...');
        } else {
          console.log(`Tentativa ${attempt + 1} com nova chave...`);
        }

        // Formatar histórico de mensagens
        const formattedHistory = this.formatChatHistory(context.history || []);

        // Determine System Prompt (Dynamic or Default)
        const systemInstruction = context.systemPrompt || this.getSystemPrompt();

        // Criar o conteúdo da requisição
        let userPart;
        if (context.multimodal) {
          userPart = { role: 'user', parts: context.multimodal };
        } else {
          userPart = { role: 'user', parts: [{ text: message || '' }] };
        }

        const contents = [
          { role: 'user', parts: [{ text: systemInstruction }] },
          { role: 'model', parts: [{ text: 'Entendi.' }] },
          ...formattedHistory,
          userPart
        ];

        // Gerar resposta
        const result = await this.model.generateContent({
          contents: contents,
          generationConfig: {
            temperature: this.config.temperature || 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: this.config.maxTokens || 8000,
          }
        });

        const response = await result.response;
        const text = response.text();

        console.log('Resposta gerada com sucesso:', text.substring(0, 50) + '...');
        return text;

      } catch (error) {
        console.error(`Erro ao gerar resposta com Gemini (Tentativa ${attempt + 1}/${maxAttempts}):`, error.message);
        lastError = error;

        // Check for Quota/Permission errors to trigger rotation
        const isQuotaError = error.message.includes('429') ||
          error.message.includes('Quota') ||
          error.message.includes('Resource has been exhausted') ||
          error.message.includes('403');

        if (isQuotaError && this.rotateKey()) {
          continue; // Retry with new key
        }

        // If not rotation-worthy or rotation failed (no more keys), break
        break;
      }
    }

    // If we land here, all attempts failed
    throw lastError;
  }
}

module.exports = GeminiProvider; 