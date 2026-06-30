# Deploy - Auditoria BR3R

## Railway (recomendado)

1. Acesse https://railway.app e faça login com GitHub
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Selecione este repositório
4. Vá em "Variables" e adicione:
   - GEMINI_API_KEY = sua chave do Google AI Studio
   - NODE_ENV = production
5. Railway detecta automaticamente e faz o deploy

O sistema ficará disponível em uma URL como:
https://auditoria-br3r-production.up.railway.app

## Variáveis de ambiente necessárias

| Variável | Valor |
|---|---|
| NODE_ENV | production |
| GEMINI_API_KEY | (sua chave Gemini) |

## Usuários padrão (sem senha)

| Login | Nome | Perfil |
|---|---|---|
| claudio | Claudio (Supervisor) | ADMIN |
| rickson | Rickson (Analista) | SUPERVISOR |
| rafael | Rafael (Assistente) | AUDITOR |
