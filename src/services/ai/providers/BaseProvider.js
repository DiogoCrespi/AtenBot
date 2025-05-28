class BaseProvider {
  constructor(config) {
    if (this.constructor === BaseProvider) {
      throw new Error('BaseProvider é uma classe abstrata e não pode ser instanciada diretamente');
    }
    this.config = config;
  }

  async generateResponse(message, context) {
    throw new Error('Método generateResponse deve ser implementado pelo provedor');
  }

  async validateConfig() {
    throw new Error('Método validateConfig deve ser implementado pelo provedor');
  }
}

module.exports = BaseProvider; 