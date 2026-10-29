-- Migração 007: administrador de usuários
-- Administrador: o único perfil que cria e gerencia usuários.
-- Todo administrador também é Aprovador (a restrição abaixo garante isso).
--
-- Depois de rodar esta migração, torne o primeiro administrador (troque pelo seu e-mail):
--   update public.users set admin = true where email = 'seu-email@empresa.com' and papel = 'aprovador';

alter table public.users add column admin boolean not null default false;
alter table public.users add constraint users_admin_exige_aprovador check (not admin or papel = 'aprovador');

create or replace function private.eh_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.users where id = (select auth.uid()) and ativo and admin)
$$;
revoke all on function private.eh_admin() from public, anon;
grant execute on function private.eh_admin() to authenticated;

-- Antes qualquer Aprovador mexia nos usuários; agora só o administrador
drop policy "aprovador cria users" on public.users;
drop policy "aprovador altera users" on public.users;
drop policy "aprovador apaga users" on public.users;
create policy "admin cria users" on public.users for insert to authenticated with check (private.eh_admin());
create policy "admin altera users" on public.users for update to authenticated using (private.eh_admin()) with check (private.eh_admin());
create policy "admin apaga users" on public.users for delete to authenticated using (private.eh_admin());

-- Nunca deixa o sistema sem administrador ativo
create or replace function public.garantir_um_admin()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.admin and old.ativo and (tg_op = 'DELETE' or not new.admin or not new.ativo) then
    if not exists (select 1 from public.users u where u.id <> old.id and u.admin and u.ativo) then
      raise exception 'Precisa existir pelo menos um administrador ativo' using errcode = 'P0001';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create trigger users_garantir_admin before update or delete on public.users
  for each row execute function public.garantir_um_admin();
