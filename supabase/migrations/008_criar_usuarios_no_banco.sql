-- Migração 008: criar usuários e redefinir senhas direto no banco (só administradores), sem Edge Function.
-- ATENÇÃO: estas funções gravam nas tabelas internas do Supabase Auth (auth.users e auth.identities).
-- Não é uma API oficial do Supabase. Foi testado com um login real neste projeto, mas uma mudança futura
-- no esquema interno do Supabase Auth poderia exigir ajustes.

-- Sorteio sem viés (rejeita valores que causariam desigualdade entre os caracteres)
create or replace function private.sorteio(n integer)
returns integer language plpgsql set search_path = '' as $$
declare b integer; limite integer := 256 - (256 % n);
begin
  loop
    b := get_byte(extensions.gen_random_bytes(1), 0);
    if b < limite then return b % n; end if;
  end loop;
end $$;

-- Senha temporária de 12 caracteres: maiúscula, minúscula, número e símbolo; sem letras ambíguas (0/O, 1/l/I)
create or replace function private.gerar_senha_temporaria()
returns text language plpgsql set search_path = '' as $$
declare
  classes text[] := array['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '#$%&*+-?@'];
  todos text;
  c text; senha text[] := '{}'; i integer; j integer; troca text;
begin
  todos := array_to_string(classes, '');
  foreach c in array classes loop
    senha := senha || substr(c, private.sorteio(length(c)) + 1, 1);
  end loop;
  while coalesce(array_length(senha, 1), 0) < 12 loop
    senha := senha || substr(todos, private.sorteio(length(todos)) + 1, 1);
  end loop;
  for i in reverse array_length(senha, 1)..2 loop  -- embaralha
    j := private.sorteio(i) + 1;
    troca := senha[i]; senha[i] := senha[j]; senha[j] := troca;
  end loop;
  return array_to_string(senha, '');
end $$;

-- Cria o login e o perfil. Devolve { usuario, senhaTemporaria }; a senha só existe nesta resposta.
create or replace function public.admin_criar_usuario(p_nome text, p_email text, p_papel public.papel_usuario, p_admin boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := gen_random_uuid();
  v_nome text := trim(coalesce(p_nome, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_senha text;
begin
  if not private.eh_admin() then
    raise exception 'Só administradores podem gerenciar usuários.' using errcode = '42501';
  end if;
  if length(v_nome) < 2 or length(v_nome) > 120 then raise exception 'Informe o nome completo.'; end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(v_email) > 200 then raise exception 'Informe um e-mail válido.'; end if;
  if coalesce(p_admin, false) and p_papel <> 'aprovador' then raise exception 'Um administrador precisa ter o perfil Aprovador.'; end if;
  if exists (select 1 from auth.users where lower(email) = v_email) or exists (select 1 from public.users where lower(email) = v_email) then
    raise exception 'Já existe um usuário com este e-mail.';
  end if;

  v_senha := private.gerar_senha_temporaria();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(v_senha, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('nome', v_nome, 'trocar_senha', true), now(), now(),
    '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id::text, v_id,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
          'email', now(), now(), now());
  insert into public.users (id, nome, email, papel, admin, ativo)
  values (v_id, v_nome, v_email, p_papel, coalesce(p_admin, false), true);

  return jsonb_build_object(
    'usuario', jsonb_build_object('id', v_id, 'nome', v_nome, 'email', v_email, 'papel', p_papel, 'admin', coalesce(p_admin, false), 'ativo', true),
    'senhaTemporaria', v_senha);
end $$;

-- Gera outra senha temporária para um usuário; a senha antiga deixa de valer e as sessões abertas são encerradas
create or replace function public.admin_redefinir_senha(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_senha text; v_nome text;
begin
  if not private.eh_admin() then
    raise exception 'Só administradores podem gerenciar usuários.' using errcode = '42501';
  end if;
  if p_id = (select auth.uid()) then raise exception 'Para trocar a sua própria senha, use Configurações.'; end if;
  select nome into v_nome from public.users where id = p_id;
  if not found then raise exception 'Usuário não encontrado.'; end if;

  v_senha := private.gerar_senha_temporaria();
  update auth.users
     set encrypted_password = extensions.crypt(v_senha, extensions.gen_salt('bf')),
         raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('trocar_senha', true),
         updated_at = now()
   where id = p_id;
  delete from auth.sessions where user_id = p_id;

  return jsonb_build_object('id', p_id, 'senhaTemporaria', v_senha);
end $$;

-- Só quem tem login chama; e, dentro, só administrador ativo executa
revoke all on function public.admin_criar_usuario(text, text, public.papel_usuario, boolean) from public, anon;
revoke all on function public.admin_redefinir_senha(uuid) from public, anon;
grant execute on function public.admin_criar_usuario(text, text, public.papel_usuario, boolean) to authenticated;
grant execute on function public.admin_redefinir_senha(uuid) to authenticated;
revoke all on function private.sorteio(integer) from public, anon, authenticated;
revoke all on function private.gerar_senha_temporaria() from public, anon, authenticated;
