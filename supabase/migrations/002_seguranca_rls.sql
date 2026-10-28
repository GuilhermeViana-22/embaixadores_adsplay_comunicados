-- Migração 002: proteção por linha (RLS) e regras por perfil
-- Sem isto, qualquer pessoa com a chave pública do projeto leria e gravaria nas tabelas.

create schema if not exists private;

create or replace function private.eh_usuario()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where id = (select auth.uid()) and ativo)
$$;

create or replace function private.eh_aprovador()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perfis where id = (select auth.uid()) and ativo and papel = 'aprovador')
$$;

revoke all on function private.eh_usuario() from public, anon;
revoke all on function private.eh_aprovador() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.eh_usuario() to authenticated;
grant execute on function private.eh_aprovador() to authenticated;

alter table public.perfis enable row level security;
alter table public.canais_slack enable row level security;
alter table public.pontuacao_regras enable row level security;
alter table public.colaboradores enable row level security;
alter table public.colaborador_periodos enable row level security;
alter table public.atualizacoes_lista enable row level security;
alter table public.posts enable row level security;
alter table public.post_publicacoes enable row level security;
alter table public.slack_usuarios enable row level security;
alter table public.post_interacoes enable row level security;
alter table public.posts_externos enable row level security;
alter table public.acoes_people enable row level security;
alter table public.acao_participantes enable row level security;

-- Leitura: qualquer usuário ativo do sistema lê tudo
create policy "ler perfis" on public.perfis for select to authenticated using (private.eh_usuario());
create policy "ler canais" on public.canais_slack for select to authenticated using (private.eh_usuario());
create policy "ler regras" on public.pontuacao_regras for select to authenticated using (private.eh_usuario());
create policy "ler colaboradores" on public.colaboradores for select to authenticated using (private.eh_usuario());
create policy "ler periodos" on public.colaborador_periodos for select to authenticated using (private.eh_usuario());
create policy "ler atualizacoes" on public.atualizacoes_lista for select to authenticated using (private.eh_usuario());
create policy "ler posts" on public.posts for select to authenticated using (private.eh_usuario());
create policy "ler publicacoes" on public.post_publicacoes for select to authenticated using (private.eh_usuario());
create policy "ler slack usuarios" on public.slack_usuarios for select to authenticated using (private.eh_usuario());
create policy "ler interacoes" on public.post_interacoes for select to authenticated using (private.eh_usuario());
create policy "ler externos" on public.posts_externos for select to authenticated using (private.eh_usuario());
create policy "ler acoes" on public.acoes_people for select to authenticated using (private.eh_usuario());
create policy "ler participantes" on public.acao_participantes for select to authenticated using (private.eh_usuario());

-- Configurações: só o Aprovador altera
create policy "aprovador cria perfis" on public.perfis for insert to authenticated with check (private.eh_aprovador());
create policy "aprovador altera perfis" on public.perfis for update to authenticated using (private.eh_aprovador()) with check (private.eh_aprovador());
create policy "aprovador apaga perfis" on public.perfis for delete to authenticated using (private.eh_aprovador());

create policy "aprovador cria canais" on public.canais_slack for insert to authenticated with check (private.eh_aprovador());
create policy "aprovador altera canais" on public.canais_slack for update to authenticated using (private.eh_aprovador()) with check (private.eh_aprovador());
create policy "aprovador apaga canais" on public.canais_slack for delete to authenticated using (private.eh_aprovador());

create policy "aprovador cria regras" on public.pontuacao_regras for insert to authenticated with check (private.eh_aprovador());
create policy "aprovador altera regras" on public.pontuacao_regras for update to authenticated using (private.eh_aprovador()) with check (private.eh_aprovador());
create policy "aprovador apaga regras" on public.pontuacao_regras for delete to authenticated using (private.eh_aprovador());

create policy "aprovador cria colaboradores" on public.colaboradores for insert to authenticated with check (private.eh_aprovador());
create policy "aprovador altera colaboradores" on public.colaboradores for update to authenticated using (private.eh_aprovador()) with check (private.eh_aprovador());
create policy "aprovador apaga colaboradores" on public.colaboradores for delete to authenticated using (private.eh_aprovador());

create policy "aprovador cria periodos" on public.colaborador_periodos for insert to authenticated with check (private.eh_aprovador());
create policy "aprovador altera periodos" on public.colaborador_periodos for update to authenticated using (private.eh_aprovador()) with check (private.eh_aprovador());
create policy "aprovador apaga periodos" on public.colaborador_periodos for delete to authenticated using (private.eh_aprovador());

create policy "aprovador cria atualizacoes" on public.atualizacoes_lista for insert to authenticated with check (private.eh_aprovador());
create policy "aprovador apaga atualizacoes" on public.atualizacoes_lista for delete to authenticated using (private.eh_aprovador());

-- Posts: People cria; só edita o próprio enquanto pendente/devolvido; Aprovador faz tudo
create policy "criar post" on public.posts for insert to authenticated
  with check (private.eh_usuario() and autor_id = (select auth.uid()) and status = 'pendente');
create policy "alterar post" on public.posts for update to authenticated
  using (private.eh_aprovador() or (autor_id = (select auth.uid()) and status in ('pendente', 'devolvido')))
  with check (private.eh_aprovador() or (autor_id = (select auth.uid()) and status in ('pendente', 'devolvido')));
create policy "apagar post" on public.posts for delete to authenticated
  using (private.eh_aprovador() or (autor_id = (select auth.uid()) and status in ('pendente', 'devolvido')));

-- Publicações: só o Aprovador registra
create policy "aprovador cria publicacoes" on public.post_publicacoes for insert to authenticated with check (private.eh_aprovador());
create policy "aprovador altera publicacoes" on public.post_publicacoes for update to authenticated using (private.eh_aprovador()) with check (private.eh_aprovador());
create policy "aprovador apaga publicacoes" on public.post_publicacoes for delete to authenticated using (private.eh_aprovador());

-- Interações do Slack: qualquer usuário registra; só o Aprovador altera ou apaga
create policy "criar slack usuarios" on public.slack_usuarios for insert to authenticated with check (private.eh_usuario());
create policy "alterar slack usuarios" on public.slack_usuarios for update to authenticated using (private.eh_usuario()) with check (private.eh_usuario());
create policy "criar interacoes" on public.post_interacoes for insert to authenticated with check (private.eh_usuario());
create policy "alterar interacoes" on public.post_interacoes for update to authenticated using (private.eh_aprovador()) with check (private.eh_aprovador());
create policy "apagar interacoes" on public.post_interacoes for delete to authenticated using (private.eh_aprovador());

-- Posts externos e ações de people: qualquer usuário registra; apaga quem registrou ou o Aprovador
create policy "criar externos" on public.posts_externos for insert to authenticated with check (private.eh_usuario());
create policy "alterar externos" on public.posts_externos for update to authenticated using (private.eh_aprovador()) with check (private.eh_aprovador());
create policy "apagar externos" on public.posts_externos for delete to authenticated
  using (private.eh_aprovador() or criado_por_id = (select auth.uid()));

create policy "criar acoes" on public.acoes_people for insert to authenticated with check (private.eh_usuario());
create policy "alterar acoes" on public.acoes_people for update to authenticated using (private.eh_aprovador()) with check (private.eh_aprovador());
create policy "apagar acoes" on public.acoes_people for delete to authenticated
  using (private.eh_aprovador() or registrado_por_id = (select auth.uid()));

create policy "criar participantes" on public.acao_participantes for insert to authenticated with check (private.eh_usuario());
create policy "apagar participantes" on public.acao_participantes for delete to authenticated
  using (private.eh_aprovador() or exists (select 1 from public.acoes_people a where a.id = acao_id and a.registrado_por_id = (select auth.uid())));
