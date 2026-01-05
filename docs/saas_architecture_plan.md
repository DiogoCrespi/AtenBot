
# AtenBot SaaS Architecture Plan

## 1. Executive Summary
The goal is to transform AtenBot into a multi-tenant SaaS platform where users can purchase, configure, and manage their own AI agents. The system will leverage the robust "Evolution API" for WhatsApp connectivity but will feature a custom, white-label frontend ("AtenBot Manager") for user interaction.

## 2. Core Features (Scope)

### Phase 1: MVP (Minimum Viable Product)

- **Dashboard**: View active instances, connection status (QR Code status).
- **Instance Management**: Create new WhatsApp instance (User = Tenant).
- **QR Scanning**: Display QR Code from Evolution API for the user to scan.
- **Agent Configuration**:
    - Set custom system prompts/personas (e.g., "Support", "Sales").
    - "Stealth Mode" toggle (Hide "I am an AI" disclosures).
- **Chat Interface**: View incoming messages and intervene (Human Handoff).
- last **User Authentication**: Sign up/Login (Email/Password).
### Phase 2: Commercialization
- **Billing Integration**: Stripe/MercadoPago for subscriptions.
- **Usage Limits**: Rate limiting per user tier.
- **Analytics**: Messages sent/received, AI token usage.

## 3. Architecture

### 3.1 Backend (Node.js/NestJS) - *Existing & Refactored*
- **Role**: API Gateway & Orchestrator.
- **Responsibilities**:
    - Manage User Accounts & Auth (JWT).
    - Proxy requests to Evolution API (creating instances per user).
    - Handle AI Logic (Gemini 2.5) with centralized Rate Limiting.
    - Store Tenant Config (Prompts, Settings) in Database.

### 3.2 Frontend (Next.js - *Recommended*)
- **Role**: The "Face" of the SaaS.
- **Why**: Replaces the generic Evolution Manager. Allows full branding control.
- **Tech Stack**: Next.js + Tailwind CSS (Shadcn/UI).
- **Key Screens**: Auth, Dashboard, Instance Config, Live Chat.

### 3.3 WhatsApp Infrastructure (Evolution API)
- **Role**: The "Engine".
- **Usage**: Runs as a microservice (Docker).
- **Multi-tenancy**: Each user gets a unique `instanceName` in Evolution API (e.g., `user_123_instance`).

## 4. Implementation Steps

1.  **Frontend Setup**: Initialize a Next.js project in `apps/frontend`.
2.  **Auth System**: Implement Login/Register APIs in `atenbot-api`.
3.  **Instance Bridge**: endpoints in `atenbot-api` to create/delete instances in Evolution.
4.  **Config UI**: Forms to update agent prompts in the DB.
5.  **Stealth Logic**: Update `GeminiProvider` to accept dynamic prompts per tenant.

## 5. Technical Considerations for "Stealth Mode"
To simulate a human agent:
- **Latencies**: Add random "typing" delays (e.g., 2-5s) before sending.
- **Presence**: Send "composing" updates to WhatsApp.
- **Persona**: Prompt engineering to avoid generic AI phrases ("As an AI language model...").
