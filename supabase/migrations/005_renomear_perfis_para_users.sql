-- Migração 005: a tabela de usuários passa a se chamar "users"
alter table public.perfis rename to users;
alter trigger perfis_atualizado on public.users rename to users_atualizado;

alter policy "ler perfis" on public.users rename to "ler users";
alter policy "aprovador cria perfis" on public.users rename to "aprovador cria users";
alter policy "aprovador altera perfis" on public.users rename to "aprovador altera users";
alter policy "aprovador apaga perfis" on public.users rename to "aprovador apaga users";

-- As duas funções de segurança liam a tabela pelo nome antigo
create or replace function private.eh_usuario()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users where id = (select auth.uid()) and ativo)
$$;

create or replace function private.eh_aprovador()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users where id = (select auth.uid()) and ativo and papel = 'aprovador')
$$;
