# Embaixadores Adsplay: Comunicados e Pontuação (aplicativo ligado ao Supabase)

Aplicativo em Vue 3, Vite, Tailwind e shadcn-vue. Os dados ficam no **Supabase** (tabelas, regras de segurança, rankings e arquivos). O login é o do Supabase Auth.

## Como rodar

Precisa do Node 20.19 ou mais novo (ou 22.12+).

```
npm install
cp .env.example .env     # no Windows (Git Bash) também funciona; depois preencha o .env
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente http://localhost:5173).

### O arquivo .env

O `.env` guarda o endereço e a chave **pública** do seu projeto do Supabase. Ele fica só na sua máquina (está no `.gitignore`). O `.env.example` é o modelo e sobe para o GitHub.

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Onde achar: painel do Supabase, Project Settings, API. Use só a chave pública. **Nunca** coloque a chave `service_role` aqui. Sem o `.env`, a tela de entrada avisa que o Supabase não está configurado.

Depois de mudar o `.env`, reinicie o `npm run dev`.

### Banco de dados

Antes do primeiro uso, o banco precisa ter as tabelas: rode os arquivos de `../supabase/migrations/` em ordem (001 a 006). Detalhes no README da raiz do repositório.

### Primeiro administrador

Só um **administrador** cria usuários, então o primeiro precisa ser criado à mão:

1. No painel do Supabase, em Authentication, Users, clique em **Add user**, informe e-mail e senha e marque a confirmação automática.
2. No SQL Editor, rode (trocando nome e e-mail):

```sql
insert into public.users (id, nome, email, papel, admin)
select id, 'Seu Nome', email, 'aprovador', true from auth.users where email = 'seu-email@empresa.com';
```

3. Entre no aplicativo. O menu **Usuários** aparece para você. Troque a senha em Configurações, Perfil.

### Gerenciar usuários (menu Usuários, só para administradores)

- A tabela mostra nome, e-mail, perfil, se é administrador, a situação e a data de criação.
- **Novo usuário:** informe nome, e-mail e o perfil (**People** ou **Aprovador**). Marcar **Administrador** fixa o perfil em Aprovador. O servidor gera uma **senha temporária**, que aparece uma única vez e não fica guardada. No primeiro acesso a pessoa é obrigada a trocá-la.
- Na própria tabela: mudar o perfil, tornar ou remover administrador, desativar ou ativar, e redefinir a senha (gera outra senha temporária).
- O sistema **nunca fica sem administrador ativo**: o banco recusa remover, desativar ou apagar o último.
- Aprovadores comuns e People **não** gerenciam usuários, nem pelo aplicativo nem direto no banco.

#### A função segura `admin-usuarios`

Criar um login exige a chave secreta do Supabase (`service_role`), que **nunca** pode ficar no navegador. Por isso criar usuário e redefinir senha passam por uma Edge Function, em `../supabase/functions/admin-usuarios/`. Ela confere o login de quem chamou e só aceita administradores ativos. Publique uma vez:

- Pelo terminal: `supabase functions deploy admin-usuarios --no-verify-jwt`
- Ou pelo painel: Edge Functions, **Deploy a new function**, nome `admin-usuarios`, com o conteúdo de `index.ts` e `logic.js`. Desative a opção de verificar o JWT.

O `--no-verify-jwt` é intencional: a verificação automática da plataforma nem sempre aceita os tipos de chave mais novos, e a própria função já valida o token no servidor de login e exige administrador. A chave secreta é entregue à função pelo próprio Supabase. Não a copie para lugar nenhum.

O teste da lógica roda sem rede: `node ../supabase/functions/admin-usuarios/logic.test.mjs`.

#### E-mails do Supabase (atenção)

Sem um servidor de e-mail próprio (SMTP), o Supabase **só entrega e-mails para os membros da equipe do projeto**, com limite de 2 por hora. Por isso este aplicativo não depende de convite por e-mail: o administrador entrega a senha temporária. Mas o link de **"Esqueci minha senha"** usa e-mail e só chega para os colegas se você configurar um SMTP próprio, em Authentication, Emails, SMTP Settings.

## Publicar na Vercel

O arquivo `vercel.json` (nesta pasta) manda todas as rotas para o `index.html`. Sem ele, abrir ou atualizar o navegador em um endereço como `/ranking-final` dá erro 404 na Vercel, porque o aplicativo troca de tela no navegador e esse arquivo não existe no servidor.

1. Na Vercel, importe o repositório do GitHub.
2. Em **Root Directory**, escolha a pasta `app` (recomendado). Se você deixar a raiz do repositório, o `vercel.json` da raiz já cuida de instalar e compilar dentro de `app/`.
3. Em **Settings, Environment Variables**, crie as duas variáveis, nos ambientes Production, Preview e Development:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Faça o deploy. **Depois de mudar uma variável, faça um novo deploy**: o Vite grava os valores na hora de compilar.
5. No Supabase, em Authentication, URL Configuration, coloque o endereço da Vercel em **Site URL** e acrescente `https://SEU-DOMINIO/**` em **Redirect URLs**. É isso que faz funcionar o link do e-mail de "Esqueci minha senha".

## Telas e tabelas

| Tela | Tabelas e funções do banco |
| --- | --- |
| Criação de posts | `posts`, `canais_slack`, arquivos em `anexos` |
| Posts programados | `posts` (status programado e cancelado), `post_publicacoes` |
| Posts publicados | `posts`, `post_publicacoes`, `publicacoes_prazo`, `post_interacoes` |
| Post Externo | `posts_externos`, `colaboradores` |
| Ações de people | `acoes_people`, `acao_participantes` |
| Ranking do mês | função `ranking_mes` |
| Ranking final | visão `ranking_final` |
| Usuários (só administrador) | `users`, função segura `admin-usuarios` |
| Configurações | `users` (só leitura), `colaboradores`, `colaborador_periodos`, `atualizacoes_lista` (funções `previa_lista_colaboradores` e `aplicar_lista_colaboradores`), `canais_slack`, `pontuacao_regras` |

Os pontos são calculados no banco, não no aplicativo. Os valores de cada regra ficam em `pontuacao_regras` e podem ser mudados em Configurações, Pontuação.

## O que este aplicativo não faz

- **Não publica no Slack e não lê comentários e reações do Slack.** O fluxo é: aprovar, publicar no Slack à mão e colar o link da mensagem em Posts programados. Comentários e reações são lançados à mão em Posts publicados.
- **Só lê listas em CSV** (no Excel: Arquivo, Salvar como, CSV). Arquivos `.xlsx` são recusados com um aviso.

## Segurança

As regras de quem pode o quê valem no banco (RLS). Esconder um botão na tela não protege nada; o que protege são as regras do Supabase. A chave do `.env` é pública por desenho.

## Pastas

- `src/lib/supabase.js`: a conexão única com o Supabase (lê o `.env`).
- `src/services/api.js`: todas as chamadas às tabelas, uma função por operação.
- `src/stores/session.js`: login e perfil.
- `src/views/` e `src/components/`: as telas.
- `specs/comunicados/`: especificação, plano, tarefas e o mapa das tabelas.
