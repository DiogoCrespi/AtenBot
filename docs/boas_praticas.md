# Boas Práticas e Arquitetura para Escalar o AtenBot

Este documento consolida as melhores práticas de desenvolvimento, arquitetura e infraestrutura para transformar o AtenBot em um produto escalável (SaaS), baseado na análise do código atual e nos objetivos de refatoração.

## 1. Arquitetura Proposta (Refatoração)

O objetivo é migrar de uma arquitetura "Monolítica Acoplada" (onde o bot roda o navegador internamente via `whatsapp-web.js`) para uma arquitetura de **Microserviços Baseada em Webhooks**.

### Antes (Atual)
- **AtenBot Node.js**: Gerencia a lógica + Navegador (Puppeteer) + Conexão Socket.
- **Problema**: Pesado (muita RAM por cliente), instável (queda do Puppeteer derruba o bot), difícil de escalar (1 processo = 1 cliente).

### Depois (Proposto)
- **Evolution API (Gateway)**: Serviço dedicado (Docker) que gerencia as conexões do WhatsApp.
- **AtenBot API (Node.js)**: Recebe **Webhooks** (mensagens) e responde via API HTTP.
- **Benefícios**:
    - **Leveza**: O AtenBot não processa navegador, apenas JSON.
    - **Escalabilidade**: Uma única instância do AtenBot pode processar mensagens de milhares de clientes (Multi-tenant).
    - **Estabilidade**: Se o WhatsApp cair, o servidor do bot continua de pé.

## 2. Node.js vs Python

**Veredito:** O uso de **Node.js é perfeitamente adequado** e não há impedimentos.
- **Dúvida**: "A API não conversa direito com Node?"
- **Resposta**: Pelo contrário. A **Evolution API** é escrita em Node.js/TypeScript. A integração é nativa e fluida. A sugestão de Python no documento original (`refatoração.md`) era apenas uma preferência daquela arquitetura específica (FastAPI), mas não há limitação técnica. Manter o projeto em Node.js facilita a manutenção, já que a stack é unificada.

## 3. Estratégias para Escalar (SaaS / Multi-tenancy)

Para vender o bot para múltiplas pessoas sem criar um servidor para cada uma:

1.  **Instâncias na Evolution API**:
    - A Evolution API v2 permite criar múltiplas "instances". Cada cliente (padaria, escritório, loja) será uma `instance` diferente (ex: `cliente_A`, `cliente_B`).
    - Todas as instances apontam para o **mesmo Webhook** no seu backend: `https://api.atenbot.com/webhook`.

2.  **Identificação no Backend**:
    - No Webhook, a Evolution envia o campo `instance` ou `sender`. O AtenBot deve ler esse campo para saber **de qual cliente** veio a mensagem e carregar o prompt/banco de dados correto.
    - **BD Multi-tenant**: Adicione uma coluna `tenant_id` ou `instance_name` nas tabelas de `Users`, `Conversations` e `Configs`.

3.  **Filas (Background Jobs)**:
    - **Problema**: Se 100 pessoas mandarem mensagem ao mesmo tempo, o servidor pode travar processando IA.
    - **Solução**: Use **Redis + Bull** (biblioteca Node). Ao receber o webhook, jogue a mensagem numa fila. Um "worker" processa a IA e responde. Isso garante que o servidor nunca trave.

## 4. Estrutura de Código Organizada (Clean Architecture)

Para facilitar a manutenção, organizamos o código em camadas:

- `src/controllers/`: Recebem as requisições HTTP (Webhooks). Não têm lógica de negócio.
- `src/services/`: Contêm a lógica pesada (Chamar Gemini, Processar regras, Enviar msg via Evolution).
- `src/repositories/` (ou `models/`): Acesso ao banco de dados.
- `src/config/`: Variáveis de ambiente validadas.

## 5. Próximos Passos Práticos

1.  **Disserque o `whatsapp-web.js`**: Remova-o. É a maior barreira para escalar.
2.  **Suba a Evolution API**: Configure um `docker-compose.yml` com Postgres, Redis e Evolution API.
3.  **Crie o Webhook**: Um endpoint POST que recebe o JSON da Evolution.
4.  **Lógica Multi-cliente**: Adapte o banco para saber que a mensagem X pertence ao Cliente Y.
