# AtenBot

Chatbot inteligente para atendimento jurídico via WhatsApp.

## Requisitos

- Node.js (versão 18 ou superior)
- PostgreSQL
- N8N
- Conta OpenAI

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```
3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`
   - Preencha as variáveis necessárias

4. Inicie o servidor:
```bash
npm run dev
```

## Estrutura do Projeto

```
atenbot/
├── src/
│   ├── config/          # Configurações
│   ├── services/        # Serviços
│   ├── models/          # Modelos do banco
│   ├── controllers/     # Controladores
│   ├── routes/          # Rotas
│   ├── middleware/      # Middlewares
│   └── utils/           # Utilitários
└── frontend/            # Dashboard React
```

## Funcionalidades

- Integração com WhatsApp
- Processamento de mensagens com OpenAI
- Orquestração de fluxos com N8N
- Dashboard para monitoramento
- Sistema de autenticação
- Armazenamento de conversas

## Licença

ISC 