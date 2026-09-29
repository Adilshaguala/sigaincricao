# SIGA — Sistema de Gestão de Inscrições

Formulário público de inscrição em dois passos, com dados pessoais, escolha do curso/centro de recursos e bloqueio dos dados após a submissão. A área administrativa permanece separada.

## Executar localmente

```bash
npm install
copy .env.example .env
```

No `.env`, configure `DATABASE_URL` para PostgreSQL e defina `ADMIN_PASSWORD` e `ROOT_PASSWORD` com senhas próprias. Depois execute:

```bash
npm run db:push
npm run db:seed
npm run dev
```

Abra `http://localhost:3000` para aceder directamente ao formulário. A entrada administrativa está em `/admin`, com dashboard, gráficos, listagem de inscritos e fichas individuais. Em **Configurações**, há páginas próprias para o prazo das inscrições, cursos e centros de recursos. Os cursos podem ser associados a um ou mais centros; esta associação limita os centros disponíveis no formulário público. Cursos antigos sem associação continuam disponíveis em todos os centros até serem actualizados.

O seeder cria duas contas na tabela `Administrator`: `admin` e `root`, além dos graus académicos usados na criação de cursos. Ambas as contas têm o mesmo acesso ao painel em `/admin`. Os nomes de utilizador podem ser alterados com `ADMIN_USERNAME` e `ROOT_USERNAME`. Repetir o seeder não altera senhas de contas existentes.
