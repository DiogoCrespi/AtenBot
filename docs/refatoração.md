[02/01, 15:38] Mr. Rian: 🚀 Croqui de Arquitetura: Atenbot MVP (Gemini Edition)

Objetivo: Bot de WhatsApp que processa Texto e Áudio (entrada) e responde via Texto (saída) usando IA.
1. Stack Tecnológica Recomendada

    Linguagem: Python 3.10+

    Framework API: FastAPI (assíncrono e leve).

    IA (LLM & STT): Google Gemini 1.5 Flash (API via google-generativeai).

    Integração WhatsApp: Evolution API (via Docker) ou Z-API.

    Banco de Dados: SQLite (para o histórico de chat).

    Servidor: Docker / Docker Compose.

2. Fluxo da Mensagem (Diagrama de Sequência)

    Usuário envia áudio/texto no WhatsApp.

    WhatsApp Gateway dispara um Webhook (POST) para o nosso Backend.

    Backend recebe o JSON:

        Se texto: Envia direto para o Gemini.

        Se áudio: Baixa o arquivo .ogg, envia para o Gemini (Multimodal) ou transcreve via Whisper.

    Gemini processa o histórico + nova mensagem e gera o texto de resposta.

    Backend salva a troca no banco e faz um POST de volta para o Gateway enviando a resposta ao usuário.
[02/01, 15:38] Mr. Rian: Estrutura de Pastas (Projeto)

atenbot/
├── app/
│   ├── main.py          # Entrypoint FastAPI e Rotas de Webhook
│   ├── services/
│   │   ├── gemini_ai.py # Integração com a API do Google
│   │   ├── whatsapp.py  # Funções de envio de mensagem
│   ├── database/
│   │   ├── models.py    # Schema do SQLite (id, user_id, message, role)
│   └── utils/
│       ├── audio.py     # Conversão de áudio se necessário
├── .env                 # Chaves de API (GEMINI_API_KEY, WHATSAPP_TOKEN)
├── docker-compose.yml   # Orquestração do Backend + Evolution API
└── requirements.txt     # Dependências (fastapi, google-generativeai, sqlalchemy)
[02/01, 15:39] Mr. Rian: O Coração do Código (Pseudo-código para o Dev)

O desenvolvedor deve implementar a classe de IA seguindo este padrão:

import google.generativeai as genai

class AtenbotAI:
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def get_response(self, user_id, message_content, is_audio=False):
        # 1. Recuperar histórico do SQLite para o user_id
        history = db.get_recent_messages(user_id)
        
        # 2. Configurar o "System Instruction"
        chat = self.model.start_chat(history=history)
        
        # 3. Gerar resposta
        response = chat.send_message(message_content)
        
        # 4. Salvar nova iteração no banco
        db.save_message(user_id, message_content, response.text)
        
        return response.text
[02/01, 15:39] Mr. Rian: 5. Requisitos para o Desenvolvedor (Definition of Done)

    Baixa Latência: O bot deve responder em menos de 5 segundos.

    Tratamento de Áudio: O sistema deve detectar que a mensagem é um arquivo, baixar e transcrever antes de enviar ao Gemini.

    Resiliência: Se a API do Gemini falhar, o bot deve enviar uma mensagem de "Estou pensando, um momento".

    Contexto: O bot deve lembrar o nome do usuário se ele o disser na primeira mensagem.
[02/01, 15:40] Mr. Rian: Docker Compose (A Infraestrutura Completa)

Este arquivo deve ser colocado na raiz do projeto. Ele sobe o Atenbot e a Evolution API (que conecta ao WhatsApp).
[02/01, 15:40] Mr. Rian: version: '3.8'

services:
  # O Cérebro do Atenbot (Python/FastAPI)
  atenbot-app:
    build: .
    container_name: atenbot-backend
    restart: always
    env_file: .env
    ports:
      - "8000:8000"
    depends_on:
      - atenbot-db

  # Banco de Dados para Memória de Longo Prazo
  atenbot-db:
    image: postgres:15
    container_name: atenbot-db
    restart: always
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password123
      POSTGRES_DB: atenbot_memory
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Gateway para WhatsApp (Evolution API)
  evolution-api:
    image: atendimentos/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - DOCKER_NAME=evolution-api
    volumes:
      - evolution_instances:/evolution/instances

volumes:
  postgres_data:
  evolution_instances:
[02/01, 15:41] Mr. Rian: Esquema do Banco de Dados (A Memória)

Passe isto ao desenvolvedor para que ele crie as tabelas. Usaremos uma estrutura que permite o "Omnichannel" (WhatsApp + Instagram no futuro).
[02/01, 15:41] Mr. Rian: -- Tabela de Usuários (Unifica WhatsApp e Instagram)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wa_number VARCHAR(20) UNIQUE, -- Número do WhatsApp
    ig_handle VARCHAR(50) UNIQUE, -- @ do Instagram (futuro)
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Histórico de Mensagens (Contexto para o Gemini)
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    role VARCHAR(10), -- 'user' ou 'assistant'
    content TEXT,     -- A mensagem de texto ou transcrição
    media_url TEXT,   -- Link se for áudio/imagem
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
[02/01, 15:41] Mr. Rian: Checklist de Entrega para o Desenvolvedor

Para que ele não erre na implementação, entregue estes 3 pontos:

    Conexão Gemini: Utilizar o método history= da biblioteca do Google para que o Gemini já receba as últimas 10 mensagens do banco automaticamente.

    Conversão de Áudio: O áudio do WhatsApp vem em .ogg. Ele deve usar a biblioteca pydub ou ffmpeg para garantir que o Gemini processe o som corretamente (ou enviar direto se usar a API multimodal).

    Segurança: As chaves de API do Gemini e do WhatsApp nunca devem estar no código, apenas no arquivo .env.
[02/01, 16:05] Mr. Rian: Detalhamento Técnico: Rota /webhook

O desenvolvedor deve configurar esta rota no FastAPI (Python) para escutar as notificações da Evolution API.
1. O Fluxo Lógico da Rota

A rota não pode apenas "processar". Ela deve seguir este fluxo de decisão:

    Validação: Verifica se a mensagem contém texto ou mídia (áudio).

    Extração: Captura o número do usuário (remoteJid) e o conteúdo.

    Normalização de Áudio: Se for áudio, a rota faz o download do .ogg e o envia para a API do Gemini (que aceita arquivos binários) ou o transcreve.

    Chamada à IA: Envia o conteúdo + histórico do banco para o Gemini 1.5 Flash.

    Resposta: Faz o "callback" enviando a mensagem final para o WhatsApp do usuário.
[02/01, 16:05] Mr. Rian: from fastapi import APIRouter, Request, BackgroundTasks
import httpx

router = APIRouter()

@router.post("/webhook/whatsapp")
async def handle_whatsapp(request: Request, background_tasks: BackgroundTasks):
    data = await request.json()
    
    # 1. Filtro: Ignora se for mensagem enviada pelo próprio bot
    if data.get("event") != "messages.upsert" or data['data']['key']['fromMe']:
        return {"status": "ignored"}

    # 2. Extração de dados básicos
    user_number = data['data']['key']['remoteJid']
    message_type = "text" if 'conversation' in data['data']['message'] else "audio"
    
    # 3. Processamento em Segundo Plano (Background Task)
    # Isso evita que o WhatsApp dê timeout esperando a IA responder
    background_tasks.add_task(process_atenbot_logic, user_number, data['data']['message'], message_type)

    return {"status": "received"}

async def process_atenbot_logic(user_id, message_data, m_type):
    # Aqui o Dev chama o Gemini e depois a função de envio
    content = ""
    if m_type == "audio":
        # Lógica para baixar o áudio e converter/transcrever
        pass
    else:
        content = message_data['conversation']
        
    response_text = await gemini_service.generate(user_id, content)
    await whatsapp_service.send_text(user_id, response_text)
[02/01, 16:05] Mr. Rian: . Especificações para o Desenvolvedor

    Endpoint: POST /webhook/whatsapp

    Segurança: Implementar um X-API-KEY no cabeçalho para garantir que apenas a sua instância da Evolution API consiga enviar dados para essa rota.

    Tratamento de Erros: Se o Gemini demorar mais de 10 segundos, o código deve disparar uma resposta automática: "Estou processando seu áudio, só um instante..." para manter a fluidez da conversa.
[02/01, 16:05] Mr. Rian: Configuração do Webhook no Gateway

O desenvolvedor precisará configurar a URL de destino na Evolution API da seguinte forma:

    URL: https://seu-servidor.com/webhook/whatsapp

    Eventos: Marcar apenas MESSAGES_UPSERT.


    Resumo Executivo
​O Atenbot é um Bot de WhatsApp Assíncrono projetado para velocidade. Ele desacopla o recebimento da mensagem do processamento da IA usando uma fila em memória (Redis).
​Filosofia: "Fire-and-Forget" (Recebe e libera a conexão imediatamente).
​Estratégia de Áudio: Processamento em memória via Base64 (Zero Disk I/O) para máxima performance em nuvem.
​1. Arquitetura do Sistema
​O Fluxo de Dados:
​WhatsApp recebe mensagem → Evolution API envia Webhook.
​API Gateway (Fastify) recebe JSON → Joga na Fila (Redis) → Responde 200 OK (Latência < 50ms).
​Worker (Node.js) pega o job → Envia Texto/Áudio (Base64) para Gemini.
​Gemini gera resposta → Worker envia para Evolution API.
​2. Stack Tecnológica ("The Golden Stack")
​Runtime: Node.js 20 (Alpine Linux).
​Web Framework: Fastify (Alta performance).
​Queue Manager: BullMQ + Redis (Gestão de fila robusta).
​IA Engine: Google Gemini 1.5 Flash (Rápido, barato e multimodal).
​Integração: Evolution API v2 (Configurada para enviar Base64).
​Deploy: Docker Compose (Portável para qualquer Cloud).
​3. Implementação Prática (Códigos-Chave)
​A. Configuração do Webhook (Fastify + BullMQ)
​Arquivo: src/server.js
Objetivo: Receber a requisição e liberar o WhatsApp instantaneamente.


import Fastify from 'fastify';
import { Queue } from 'bullmq';

const app = Fastify({ logger: true });
const msgQueue = new Queue('atenbot-queue', { connection: { host: 'redis', port: 6379 } });

app.post('/webhook', async (req, reply) => {
  const { event, data } = req.body;

  // 1. Filtro de Segurança
  if (event !== 'messages.upsert' || data.key.fromMe) {
    return { status: 'ignored' };
  }

  // 2. Extração Rápida (Payload Leve)
  const payload = {
    remoteJid: data.key.remoteJid,
    pushName: data.pushName,
    message: data.message,
    isAudio: !!data.message.audioMessage
  };

  // 3. Enfileirar (Fire-and-Forget)
  await msgQueue.add('chat-job', payload, {
    removeOnComplete: true, // Limpa o Redis automaticamente
    attempts: 2 // Retenta se falhar
  });

  return { status: 'queued' };
});

app.listen({ port: 3000, host: '0.0.0.0' });

B. O Worker Inteligente (Processamento IA)
​Arquivo: src/worker.js
Objetivo: Processar a lógica pesada em segundo plano.

import { Worker } from 'bullmq';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// Configuração Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// System Prompt (A Personalidade)
const SYSTEM_INSTRUCTION = `
Você é o Atenbot. Responda de forma natural, curta e amigável no WhatsApp.
Se receber áudio, mencione brevemente que ouviu. Use emojis moderadamente.
Nunca use listas longas ou formatação markdown complexa (negrito use *texto*).
`;

const worker = new Worker('atenbot-queue', async (job) => {
  const { remoteJid, pushName, message, isAudio } = job.data;
  
  try {
    // 1. Enviar "Digitando..." (Melhora UX)
    await sendPresence(remoteJid, 'composing');

    let promptParts = [SYSTEM_INSTRUCTION];
    
    // 2. Tratamento de Áudio (Estratégia Base64)
    if (isAudio) {
        // A Evolution deve estar configurada para enviar o base64 no JSON
        // ou fazemos uma chamada rápida para pegar o base64 se vier apenas URL
        const base64Audio = message.audioMessage.base64; 
        promptParts.push({
            inlineData: {
                data: base64Audio,
                mimeType: "audio/ogg"
            }
        });
        promptParts.push(`O usuário ${pushName} enviou este áudio. Responda.`);
    } else {
        const text = message.conversation || message.extendedTextMessage?.text;
        promptParts.push(`Usuário ${pushName} diz: ${text}`);
    }

    // 3. Gerar Resposta
    const result = await model.generateContent(promptParts);
    const responseText = result.response.text();

    // 4. Enviar Resposta
    await sendMessage(remoteJid, responseText);

  } catch (err) {
    console.error("Erro no Worker:", err);
  }
}, { connection: { host: 'redis', port: 6379 } });

// Funções auxiliares (axios) para chamar Evolution API omitidas para brevidade

4. Configuração da Evolution API (Crucial)
​Para que a estratégia de Base64 funcione (evitando download de arquivo), configure a Evolution API com estas variáveis de ambiente no docker-compose.yml:


environment:
  - WEBSOCKET_ENABLED=false
  # Força a Evolution a incluir o base64 do áudio no webhook
  - WEBHOOK_BASE64=true 
  - WEBSOCKET_EVENTS=MESSAGES_UPSERT

5. Infraestrutura Final (Docker Compose)
​Arquivo único para rodar tudo (docker-compose.yml):
version: '3.8'

services:
  atenbot-app:
    build: .
    restart: always
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - EVOLUTION_URL=http://evolution-api:8080
      - EVOLUTION_API_KEY=${EVOLUTION_API_KEY}
    depends_on:
      - redis
      - evolution-api

  redis:
    image: redis:alpine
    command: redis-server --save "" --appendonly no # Otimizado para performance (sem persistência disco)

  evolution-api:
    image: atendimentos/evolution-api:v2.1.1
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://evolution-api:8080
      - DOCKER_NAME=evolution-api
      - WEBHOOK_GLOBAL_URL=http://atenbot-app:3000/webhook
      - WEBHOOK_EVENTS=MESSAGES_UPSERT
      - WEBHOOK_BASE64=true # O Segredo da velocidade
    volumes:
      - evolution_instances:/evolution/instances

volumes:
  evolution_instances:
Onde buscar os dados? (A Memória)
​O Gemini não "lembra" da mensagem anterior por conta própria. Nós precisamos enviar o histórico da conversa a cada nova interação.
​Para isso, adicionaremos um container PostgreSQL ao seu Docker Compose e usaremos o Prisma ORM no Node.js (padrão de mercado pela facilidade e tipagem).
​Estratégia de "Injeção de Contexto"
​No Worker (src/worker.js), antes de chamar o Gemini, faremos o seguinte:
​Buscar User: Verifica se o número (remoteJid) já existe. Se não, cria.
​Resgatar Histórico: Busca as últimas 20 mensagens dessa conversa.
​Montar o Payload: Envia para o Gemini: [System Prompt] + [Histórico] + [Nova Mensagem].
​O Schema do Banco (Prisma)
​Entregue isso ao desenvolvedor (schema.prisma):

import { db } from '../services/prisma.js'; // Cliente do Banco
import { model } from '../services/gemini.js';

// ... (dentro da função do worker)

// 1. Identificar ou Criar Usuário no Banco
let user = await db.user.findUnique({ where: { whatsapp: remoteJid } });
if (!user) {
    user = await db.user.create({ 
        data: { whatsapp: remoteJid, name: pushName } 
    });
}

// 2. Resgatar Histórico (Contexto)
const history = await db.message.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10 // Pega as últimas 10 trocas para dar contexto
});

// Converter para formato do Gemini e inverter para ordem cronológica
const chatHistory = history.reverse().map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
}));

// 3. Inicializar o Chat com a Personalidade
const chat = model.startChat({
    history: chatHistory,
    systemInstruction: {
        role: "system",
        parts: [{ text: "Cole aqui o Manifesto do Atenbot definido acima..." }]
    }
});

// 4. Enviar a Nova Mensagem
const result = await chat.sendMessage(inputContent);
const responseText = result.response.text();

// 5. Salvar a nova interação no Banco (Persistência)
await db.message.createMany({
    data: [
        { content: inputContent, role: 'user', userId: user.id },
        { content: responseText, role: 'model', userId: user.id }
    ]
});



4. O "Pulo do Gato" para Dados Reais do Cliente
​Você perguntou onde ele busca os dados do cliente (ex: "Qual status do meu pedido?"). O Gemini por si só não sabe disso.
​Para o MVP ficar profissional, o arquiteto recomenda o uso de Function Calling (Ferramentas) do Gemini.
​Se você tiver uma API (ou mesmo uma planilha simulada) com dados de clientes, nós ensinamos o bot a consultar lá:
​O usuário pergunta: "Meu boleto vence quando?"
​O Gemini analisa e pensa: "Preciso consultar a ferramenta consultar_boleto".
​O seu código Node.js executa a função, busca no banco, e devolve o JSON pro Gemini.
​O Gemini responde: "João, seu boleto vence dia 15/10. Quer que eu envie o PDF?"
​Resumo da Solução:
​Consistência de Voz: Resolvida via System Instruction fixo.
​Contexto da Conversa: Resolvido via PostgreSQL injetando as últimas 10 mensagens.
​Dados do Negócio: (Futuro) Resolvido via Function Calling conectando ao seu ERP/CRM.


