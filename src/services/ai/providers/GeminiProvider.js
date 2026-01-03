const { GoogleGenerativeAI } = require('@google/generative-ai');
const BaseProvider = require('./BaseProvider');

class GeminiProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.model = null;
    this.initialize();
  }

  initialize() {
    try {
      if (!this.config.apiKey) {
        throw new Error('API Key do Gemini não configurada no construtor');
      }

      console.log('Inicializando Gemini com modelo:', this.config.model || 'gemini-2.5-flash');
      const genAI = new GoogleGenerativeAI(this.config.apiKey);
      this.model = genAI.getGenerativeModel({
        model: this.config.model || 'gemini-2.5-flash'
      });
      console.log('Gemini inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar Gemini:', error.message);
      throw error;
    }
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
    try {
      await this.validateConfig();

      console.log('Gerando resposta com Gemini para mensagem:', message.substring(0, 50) + '...');

      // Formatar histórico de mensagens
      const formattedHistory = this.formatChatHistory(context.history || []);
      console.log('Histórico formatado:', JSON.stringify(formattedHistory, null, 2));

      // Criar o conteúdo da requisição com o prompt do sistema e histórico
      const contents = [
        {
          role: 'user',
          parts: [{
            text: this.getSystemPrompt()
          }]
        },
        {
          role: 'model',
          parts: [{
            text: 'Entendi. Estou pronto para ajudar com orientações jurídicas iniciais.'
          }]
        },
        ...formattedHistory,
        {
          role: 'user',
          parts: [{
            text: message
          }]
        }
      ];

      // Gerar resposta
      const result = await this.model.generateContent({
        contents: contents,
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: this.config.maxTokens || 1000,
        }
      });

      const response = await result.response;
      const text = response.text();

      console.log('Resposta gerada com sucesso:', text.substring(0, 50) + '...');
      return text;
    } catch (error) {
      console.error('Erro ao gerar resposta com Gemini:', error.message);
      throw error;
    }
  }
}

module.exports = GeminiProvider; 