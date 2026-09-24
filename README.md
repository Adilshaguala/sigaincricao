# SIGA — Sistema de Gestão de Inscrições

Formulário público de inscrição em dois passos, com dados pessoais, escolha do curso/centro de recursos e bloqueio dos dados após a submissão. A área administrativa permanece separada.

## Executar localmente

```bash
npm install
copy .env.example .env
npm run db:push
npm run dev
```

Abra `http://localhost:3000` para aceder directamente ao formulário. A entrada administrativa está em `/admin`, com dashboard, gráficos, listagem de inscritos e fichas individuais.

As credenciais administrativas são definidas pelas variáveis `ADMIN_USERNAME`, `ADMIN_PASSWORD` e `ADMIN_NAME` no ficheiro `.env`. Depois da autenticação, o painel fica disponível em `/admin/dashboard`.
