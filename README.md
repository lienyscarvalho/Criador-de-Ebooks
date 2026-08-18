# Nébula — Gerador de E-books com IA

App Next.js que gera e-books ilustrados (com capa) a partir de uma ideia, palavra ou frase, usando a API da Anthropic (Claude), com exportação em PDF.

## O que mudou em relação à versão de dentro do Claude

- A geração de conteúdo agora passa por uma **API route própria** (`/pages/api/generate.js`), que roda no servidor da Vercel e usa sua chave da Anthropic — o navegador do usuário nunca vê a chave.
- Contas de usuário usam **`localStorage`** (client-side) em vez do armazenamento interno do Claude. Funciona normalmente em qualquer navegador, mas é adequado a uso pessoal/prototipagem, não a dados sensíveis (veja "Limitações" abaixo).
- PDF é gerado no navegador com `jsPDF` + `html2canvas`.

## 1. Rodar localmente

```bash
npm install
cp .env.example .env.local
# edite .env.local e cole sua chave em ANTHROPIC_API_KEY
npm run dev
```

Abra http://localhost:3000

Pegue sua chave em: https://console.anthropic.com/settings/keys

## 2. Subir para o GitHub

```bash
git init
git add .
git commit -m "Primeira versão do Nébula"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

> O arquivo `.gitignore` já exclui `node_modules`, `.env` e `.env.local` — sua chave não vai para o GitHub.

## 3. Deploy na Vercel

1. Acesse https://vercel.com/new e importe o repositório do GitHub.
2. A Vercel detecta automaticamente que é um projeto Next.js — não precisa mudar nada no build.
3. Em **Environment Variables**, adicione:
   - `ANTHROPIC_API_KEY` = sua chave da Anthropic
   - (opcional) `ANTHROPIC_MODEL` = `claude-sonnet-5` (esse já é o padrão se você não definir nada)
4. Clique em **Deploy**.

Depois de publicado, qualquer atualização que você der `git push` na branch `main` gera um novo deploy automaticamente.

## Estrutura do projeto

```
pages/
  index.js          → app inteiro (telas de login, criação, geração, preview)
  _app.js           → carrega fontes e CSS global
  api/generate.js   → API route que chama a Anthropic API com sua chave
components/
  EbookPages.js     → componentes React da capa e das páginas do e-book
lib/
  icons.js          → ícones SVG e paleta de cores/temas
  auth.js           → cadastro/login simples via localStorage
styles/
  globals.css       → todo o CSS do app
```

## Limitações conhecidas / próximos passos sugeridos

- **Contas de usuário:** hoje ficam no `localStorage` do navegador — se o usuário limpar os dados do site ou trocar de dispositivo, perde o acesso. Para contas de verdade, o próximo passo é um backend com banco de dados (ex: Postgres na Vercel + NextAuth ou Clerk).
- **Imagens:** as páginas usam ilustrações vetoriais (ícones + gradientes), não fotos geradas por IA — não há um modelo de geração de imagem integrado neste projeto. Dá para adicionar chamando um modelo de imagem (ex: DALL·E, Stable Diffusion, ou Google Imagen) na mesma API route.
- **Custo:** cada geração de e-book faz uma chamada à API da Anthropic. Monitore uso/custo no console da Anthropic.
