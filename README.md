# AtenBot 🤖

AtenBot é um chatbot inteligente especializado em atendimento automatizado para o nicho jurídico via WhatsApp. Desenvolvido para advogados e escritórios, o sistema automatiza o primeiro contato, qualificação e triagem de clientes, reduzindo o esforço manual e agilizando o atendimento.

## 🚀 Tecnologias

- **Backend:** Node.js + Express.js
- **Banco de Dados:** PostgreSQL
- **Integração WhatsApp:** whatsapp-web.js
- **IA:** OpenAI GPT-4
- **Orquestração:** N8N
- **Frontend:** React.js
- **Autenticação:** JWT

## 📋 Pré-requisitos

- Node.js (v14 ou superior)
- PostgreSQL
- N8N instalado e configurado
- Conta OpenAI com acesso à API
- WhatsApp Web

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/DiogoCrespi/AtenBot.git
cd AtenBot
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações.

4. Configure o banco de dados:
```bash
# Crie um banco de dados PostgreSQL chamado 'atenbot'
createdb atenbot
```

5. Inicie o servidor:
```bash
npm run dev
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=atenbot
DB_USER=postgres
DB_PASSWORD=sua_senha

# JWT Configuration
JWT_SECRET=seu_jwt_secret
JWT_EXPIRES_IN=24h

# OpenAI Configuration
OPENAI_API_KEY=sua_chave_api_openai

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./whatsapp-session

# N8N Configuration
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=sua_chave_api_n8n

# Logging
LOG_LEVEL=debug
```

## 🏗️ Estrutura do Projeto

```
atenbot/
├── src/
│   ├── config/          # Configurações
│   ├── services/        # Serviços (WhatsApp, OpenAI, N8N)
│   ├── models/          # Modelos do banco de dados
│   ├── controllers/     # Controladores da API
│   ├── routes/          # Rotas da API
│   ├── middleware/      # Middlewares
│   └── utils/           # Utilitários
├── frontend/            # Dashboard React
├── .env                 # Variáveis de ambiente
└── package.json         # Dependências e scripts
```

## 🚀 Funcionalidades

- **Atendimento Automatizado:** Primeiro contato e triagem de clientes
- **Integração WhatsApp:** Comunicação via WhatsApp Web
- **IA Avançada:** Respostas personalizadas via GPT-4
- **Orquestração:** Fluxos conversacionais via N8N
- **Dashboard:** Monitoramento e métricas
- **Multi-usuário:** Suporte a múltiplos escritórios
- **Personalização:** Configuração de tom de voz e respostas

## 📊 Fluxo de Funcionamento

1. Cliente envia mensagem via WhatsApp
2. Sistema recebe via whatsapp-web.js
3. AtenBot processa a mensagem
4. Sistema consulta GPT-4 para resposta
5. Resposta é formatada e enviada
6. Dados são armazenados no PostgreSQL

## 🔐 Segurança

- Autenticação via JWT
- API Keys individuais por usuário
- Dados sensíveis em variáveis de ambiente
- Logs de segurança
- Validação de entrada de dados

## 📈 Monitoramento

- Logs via Winston
- Métricas de uso
- Dashboard de monitoramento
- Alertas de sistema

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📧 Contato

Diogo Crespi - [@seu_twitter](https://twitter.com/seu_twitter)

Link do Projeto: [https://github.com/DiogoCrespi/AtenBot](https://github.com/DiogoCrespi/AtenBot) 