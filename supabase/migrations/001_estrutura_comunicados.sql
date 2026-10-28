-- Embaixadores Adsplay - Comunicados e Pontuação
-- Migração 001: tipos, tabelas, índices, gatilhos e dados iniciais

-- Tipos
create type public.papel_usuario as enum ('aprovador', 'people');
create type public.post_status as enum ('pendente', 'devolvido', 'programado', 'publicado', 'cancelado');
create type public.interacao_tipo as enum ('comentario', 'reacao');
create type public.interacao_origem as enum ('slack', 'manual');
create type public.rede_externa as enum ('Instagram', 'LinkedIn');
create type public.acao_tipo as enum ('treinamento', 'destaque', 'social');

create or replace function public.definir_atualizado_em()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

-- Configurações: usuários do sistema (Aprovador ou People).
-- Nesta migração a tabela se chama "perfis"; a migração 005 a renomeia para "users".
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null unique,
  papel public.papel_usuario not null default 'people',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Configurações: canais do Slack de cada opção de divulgação
create table public.canais_slack (
  chave text primary key check (chave ~ '^[a-z0-9_]+$'),
  nome text not null,
  slack_channel_id text,
  slack_channel_nome text,
  atualizado_em timestamptz not null default now()
);

-- Configurações: pontos de cada regra
create table public.pontuacao_regras (
  chave text primary key,
  descricao text not null,
  pontos integer not null check (pontos >= 0),
  atualizado_em timestamptz not null default now()
);

-- Configurações: colaboradores e períodos em que estiveram ativos
create table public.colaboradores (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null check (length(trim(nome_completo)) > 0),
  email text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index colaboradores_email_uq on public.colaboradores (lower(email)) where email is not null;
create unique index colaboradores_nome_uq on public.colaboradores (lower(nome_completo));

create table public.colaborador_periodos (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores (id) on delete cascade,
  mes_inicio date,  -- vazio = desde o início do histórico
  mes_fim date,     -- vazio = ainda ativo
  check (mes_inicio is null or extract(day from mes_inicio) = 1),
  check (mes_fim is null or extract(day from mes_fim) = 1),
  check (mes_inicio is null or mes_fim is null or mes_inicio <= mes_fim)
);
create unique index colaborador_periodo_aberto_uq on public.colaborador_periodos (colaborador_id) where mes_fim is null;
create index colaborador_periodos_colab_idx on public.colaborador_periodos (colaborador_id);

create table public.atualizacoes_lista (
  id uuid primary key default gen_random_uuid(),
  arquivo text not null,
  feito_por text,
  novos integer not null default 0,
  saem integer not null default 0,
  voltam integer not null default 0,
  criado_em timestamptz not null default now()
);

-- Etapas 1 e 2: Criação de posts e Posts programados (a mesma linha muda de status)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (length(trim(titulo)) > 0),
  texto text not null,
  arte_url text,
  arte_nome text,
  data_prevista date not null,
  canal text not null references public.canais_slack (chave),
  autor_id uuid references public.perfis (id) on delete set null,
  autor_nome text not null,
  status public.post_status not null default 'pendente',
  motivo_devolucao text,
  agendado_para timestamptz,
  slack_agendamento_id text,
  aprovado_por text,
  aprovado_em timestamptz,
  cancelado_por text,
  cancelado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (status <> 'devolvido' or length(trim(coalesce(motivo_devolucao, ''))) > 0),
  check (status <> 'programado' or agendado_para is not null)
);
create index posts_canal_idx on public.posts (canal);
create index posts_autor_idx on public.posts (autor_id);
create index posts_status_idx on public.posts (status, agendado_para);

-- Etapa 3: Posts publicados
create table public.post_publicacoes (
  post_id uuid primary key references public.posts (id) on delete cascade,
  publicado_em timestamptz not null,
  slack_channel_id text not null,
  slack_ts text not null,
  registrado_por text,
  criado_em timestamptz not null default now(),
  unique (slack_channel_id, slack_ts)
);

create table public.slack_usuarios (
  slack_user_id text primary key,
  nome text,
  email text,
  atualizado_em timestamptz not null default now()
);

create table public.post_interacoes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  tipo public.interacao_tipo not null,
  origem public.interacao_origem not null default 'slack',
  slack_user_id text,
  nome text not null,
  email text,
  momento timestamptz not null,  -- comentário: hora real; reação: hora em que o sistema a viu
  criado_em timestamptz not null default now(),
  check (origem = 'slack' or email is not null)
);
create index post_interacoes_post_idx on public.post_interacoes (post_id);
create unique index post_interacoes_reacao_uq on public.post_interacoes (post_id, slack_user_id) where tipo = 'reacao' and slack_user_id is not null;
create unique index post_interacoes_comentario_uq on public.post_interacoes (post_id, slack_user_id, momento) where tipo = 'comentario' and slack_user_id is not null;

-- Etapa 4: Post Externo
create table public.posts_externos (
  id uuid primary key default gen_random_uuid(),
  rede public.rede_externa not null,
  nome text not null check (length(trim(nome)) > 0),
  data_publicacao date not null,
  colaborador_id uuid not null references public.colaboradores (id) on delete restrict,
  print_url text,
  print_nome text,
  criado_por text,
  criado_por_id uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now()
);
create index posts_externos_colab_idx on public.posts_externos (colaborador_id, data_publicacao);

-- Etapa 5: Ações de people
create table public.acoes_people (
  id uuid primary key default gen_random_uuid(),
  tipo public.acao_tipo not null,
  nome text not null check (length(trim(nome)) > 0),
  data_acao date,
  arquivo_url text,
  arquivo_nome text,
  nao_reconhecidos text[] not null default '{}',
  registrado_por text,
  registrado_por_id uuid references public.perfis (id) on delete set null,
  criado_em timestamptz not null default now(),
  check (tipo <> 'treinamento' or data_acao is not null)
);

create table public.acao_participantes (
  acao_id uuid not null references public.acoes_people (id) on delete cascade,
  colaborador_id uuid not null references public.colaboradores (id) on delete restrict,
  primary key (acao_id, colaborador_id)
);
create index acao_participantes_colab_idx on public.acao_participantes (colaborador_id);

-- Atualização automática de "atualizado_em"
create trigger perfis_atualizado before update on public.perfis for each row execute function public.definir_atualizado_em();
create trigger canais_atualizado before update on public.canais_slack for each row execute function public.definir_atualizado_em();
create trigger regras_atualizado before update on public.pontuacao_regras for each row execute function public.definir_atualizado_em();
create trigger colaboradores_atualizado before update on public.colaboradores for each row execute function public.definir_atualizado_em();
create trigger posts_atualizado before update on public.posts for each row execute function public.definir_atualizado_em();
create trigger slack_usuarios_atualizado before update on public.slack_usuarios for each row execute function public.definir_atualizado_em();

-- Dados iniciais. O ID do canal do Slack fica em branco: configure depois, na tabela canais_slack.
insert into public.canais_slack (chave, nome, slack_channel_id, slack_channel_nome) values
  ('geral', 'Comunicados gerais', null, null),
  ('clt', 'CLT', null, null),
  ('teste', 'Teste', null, null);

-- Pontos de cada regra (valores informados pela equipe)
insert into public.pontuacao_regras (chave, descricao, pontos) values
  ('comentario', 'Comentário no post do Slack (1 por pessoa por post, até 24 horas úteis)', 1),
  ('reacao', 'Reação no post do Slack (1 por pessoa por post, até 24 horas úteis)', 1),
  ('post_externo', 'Post externo no Instagram ou LinkedIn', 50),
  ('treinamento', 'Participação em treinamento', 50),
  ('destaque', 'Destaque do quarter', 100),
  ('social', 'Participação em ação social do quarter', 50);
