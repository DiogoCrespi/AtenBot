
# Multi-Agent Pipeline Architecture

## 1. Objective
Create a sophisticated AI processing pipeline that produces "human-like" responses by chaining specialized agents. The goal is to avoid robotic phrasing and ensure context coherence before sending the message to the user.

## 2. The Pipeline Flow
Current: User -> Webhook -> AIManager (Single Call) -> Evolution
New: User -> Webhook -> **Pipeline** -> Evolution

### Stages:
1.  **Agent 1: The Drafter (Generator)**
    -   **Role**: Analyze the user message and draft a helpful response.
    -   **Focus**: Accuracy and helpfulness.
    -   **Prompt**: "You are a helpful assistant. Draft a response to..."
    
2.  **Agent 2: The Supervisor (Verifier)**
    -   **Role**: Review the draft against the conversation history.
    -   **Focus**: Coherence, hallucination check, and logical consistency.
    -   **Input**: User Msg + Draft Response.
    -   **Output**: Approved Draft OR Critique.

3.  **Agent 3: The Humanizer (Editor)**
    -   **Role**: Rewrite the approved draft to sound naturally human.
    -   **Focus**: Tone, removing "AI jargon" (e.g., "I apologize", "As an AI", "comprehensive"), and adding natural imperfections or brevity.
    -   **Prompt**: "Rewrite this to sound like a casual human using WhatsApp. Remove formal introductions."

## 3. Implementation Plan

### File Structure
- `src/services/ai/agents/BaseAgent.js`: Common interface.
- `src/services/ai/agents/GeneratorAgent.js`
- `src/services/ai/agents/VerifierAgent.js`
- `src/services/ai/agents/HumanizerAgent.js`
- `src/services/ai/PipelineManager.js`: Orchestrates the flow.

### Integration
- Modify `AIManager.js` to use `PipelineManager` instead of direct provider call.
- Use `RateLimiter` for *each* step to ensure we don't blow the quota (even if it takes ~10-15s to process).

## 4. Technical Considerations
- **Latency**: 3 agents = 3x API calls. With `RateLimiter` (6s delay), a response might take ~20s.
- **Optimization**: For the MVP, we might combine Agent 1 and 2, or use a "One-Shot Chain" prompt if latency is too high.
- **Prompt Engineering**: The core value is in the system prompts for Agent 3.
