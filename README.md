# Nébula — Gerador de E-books com IA

App Next.js que gera e-books ilustrados (com capa) a partir de uma ideia, palavra ou frase, usando a API da Anthropic (Claude), com contas de usuário reais (Postgres + bcrypt) e exportação em PDF.

## Arquitetura

- **Frontend + páginas**: Next.js (Pages Router), React.
- **Geração de conteúdo**: rota `/api/generate`, roda no servidor com sua chave da Anthropic.
- **Contas de usuário**: Postgres (Vercel Postgres / Neon), senha com hash `bcrypt`, sessão via cookie `httpOnly` assinado com JWT.
- **Histórico de e-books**: salvo no Postgres, vinculado ao usuário logado — funciona em qualquer dispositivo.
- **PDF**: gerado no navegador com `jsPDF` + `html2canvas`.

## 1. Criar o banco de dados (Postgres)

Na Vercel:

1. No seu projeto → aba **Storage** → **Create Database** → **Postgres** (é Neon por baixo dos panos).
2. Depois de criado, clique em **Connect Project** e selecione este projeto. Isso injeta automaticamente as variáveis `POSTGRES_URL` e afins no seu projeto na Vercel — você não precisa copiar nada manualmente.

Se preferir usar outro provedor (ex: Neon, Supabase), basta pegar a connection string dele e colocar em `POSTGRES_URL` nas variáveis de ambiente.

## 2. Variáveis de ambiente

Além do `POSTGRES_URL` (que a Vercel já injeta se você conectou o banco pelo passo acima), defina também:

- `ANTHROPIC_API_KEY` — sua chave em https://console.anthropic.com/settings/keys
- `JWT_SECRET` — qualquer string longa e aleatória (ex: gere uma com `openssl rand -base64 32`), usada para assinar o cookie de sessão
- `ANTHROPIC_MODEL` (opcional) — padrão já é `claude-sonnet-5`

## 3. Rodar localmente

```bash
npm install
vercel env pull .env.local   # baixa POSTGRES_URL do projeto já conectado na Vercel
# ou copie .env.example para .env.local e preencha manualmente
npm run dev
```

Abra http://localhost:3000 — as tabelas do banco são criadas automaticamente no primeiro cadastro (não precisa rodar migração manual).

## 4. Subir para o GitHub

**Importante:** use `git` pela linha de comando (ou GitHub Desktop) — o upload pelo site do GitHub costuma "achatar" pastas aninhadas e quebra o projeto.

```bash
git init
git add .
git commit -m "Primeira versão do Nébula"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

Confirme depois, olhando o repositório no GitHub, que `package.json`, `next.config.js` e a pasta `pages/` aparecem **direto na raiz** do repositório (não dentro de uma subpasta).

## 5. Deploy na Vercel

1. https://vercel.com/new → importe o repositório.
2. Confirme que o **Root Directory** aponta para a raiz do repo (onde está o `package.json`).
3. Configure as variáveis de ambiente (`ANTHROPIC_API_KEY`, `JWT_SECRET`, e `POSTGRES_URL` se não usou a integração automática do passo 1).
4. Deploy.

Cada `git push` na branch `main` gera um novo deploy automaticamente.

## Estrutura do projeto

```
pages/
  index.js              → app inteiro (login, criação, geração, preview)
  _app.js                → carrega fontes e CSS global
  api/generate.js        → chama a Anthropic API com sua chave
  api/auth/signup.js      → cria usuário (bcrypt) e sessão
  api/auth/login.js       → autentica e cria sessão
  api/auth/logout.js      → limpa o cookie de sessão
  api/auth/me.js          → retorna o usuário da sessão atual
  api/ebooks/index.js     → lista/salva e-books do usuário logado
components/
  EbookPages.js           → componentes React da capa e das páginas do e-book
lib/
  icons.js                → ícones SVG e paleta de cores/temas
  db.js                   → conexão Postgres + criação das tabelas
  session.js               → cookie de sessão (JWT)
  auth.js                  → cliente: chama /api/auth/*
  api.js                   → cliente: chama /api/ebooks
styles/
  globals.css              → todo o CSS do app
```

## Limitações conhecidas / próximos passos sugeridos

- **Imagens:** as páginas usam ilustrações vetoriais (ícones + gradientes), não fotos geradas por IA — não há modelo de geração de imagem integrado. Dá para adicionar chamando um modelo de imagem (ex: DALL·E, Stable Diffusion, Google Imagen) dentro de `/api/generate.js`.
- **Recuperação de senha:** ainda não existe fluxo de "esqueci minha senha" (exigiria envio de e-mail).
- **Custo:** cada geração de e-book chama a API da Anthropic. Monitore uso/custo no console da Anthropic.
