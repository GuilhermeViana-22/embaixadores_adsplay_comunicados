-- Migração 004: índices apontados pela análise de desempenho do Supabase
create index acoes_people_registrado_por_idx on public.acoes_people (registrado_por_id);
create index posts_externos_criado_por_idx on public.posts_externos (criado_por_id);
