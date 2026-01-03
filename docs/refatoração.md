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