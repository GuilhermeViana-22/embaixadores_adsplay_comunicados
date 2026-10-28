-- Migração 006: arquivos anexos, atualização da lista de colaboradores e prazo dos posts publicados

-- Comparar nomes sem acento e sem diferença de maiúsculas
create extension if not exists unaccent with schema extensions;

create or replace function public.normalizar_nome(p text)
returns text language sql stable set search_path = '' as $$
  select lower(trim(regexp_replace(extensions.unaccent(coalesce(p, '')), '\s+', ' ', 'g')))
$$;

-- Armazenamento de arquivos (artes, prints, listas). Privado: só quem tem login lê.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anexos', 'anexos', false, 10485760, array[
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'])
on conflict (id) do nothing;

create policy "anexos ler" on storage.objects for select to authenticated
  using (bucket_id = 'anexos' and private.eh_usuario());
create policy "anexos enviar" on storage.objects for insert to authenticated
  with check (bucket_id = 'anexos' and private.eh_usuario());
create policy "anexos apagar" on storage.objects for delete to authenticated
  using (bucket_id = 'anexos' and (private.eh_aprovador() or owner_id = (select auth.uid())::text));

-- Prévia da atualização da lista de colaboradores: quem é novo, quem volta e quem sai
create or replace function public.previa_lista_colaboradores(p_lista jsonb)
returns jsonb language plpgsql stable set search_path = '' as $$
declare
  item jsonb; v_nome text; v_email text; v_id uuid;
  usados uuid[] := '{}';
  novos text[] := '{}'; voltam text[] := '{}'; saem text[] := '{}';
  v_total integer := 0; r record;
begin
  for item in select * from jsonb_array_elements(p_lista) loop
    v_nome := trim(coalesce(item ->> 'nome', ''));
    v_email := nullif(lower(trim(coalesce(item ->> 'email', ''))), '');
    continue when v_nome = '';
    v_total := v_total + 1;
    select c.id into v_id from public.colaboradores c
      where (v_email is not null and lower(c.email) = v_email)
         or public.normalizar_nome(c.nome_completo) = public.normalizar_nome(v_nome)
      order by (v_email is not null and lower(c.email) = v_email) desc limit 1;
    if v_id is null then
      novos := novos || v_nome;
    else
      usados := usados || v_id;
      if not exists (select 1 from public.colaborador_periodos p where p.colaborador_id = v_id and p.mes_fim is null) then
        voltam := voltam || v_nome;
      end if;
    end if;
  end loop;
  for r in select c.id, c.nome_completo from public.colaboradores c
           where exists (select 1 from public.colaborador_periodos p where p.colaborador_id = c.id and p.mes_fim is null)
             and not (c.id = any(usados)) order by c.nome_completo loop
    saem := saem || r.nome_completo;
  end loop;
  return jsonb_build_object('primeira', not exists (select 1 from public.colaboradores), 'total', v_total,
                            'novos', to_jsonb(novos), 'voltam', to_jsonb(voltam), 'saem', to_jsonb(saem));
end $$;

-- Aplica a lista: quem não está nela passa a inativo; tudo ou nada
create or replace function public.aplicar_lista_colaboradores(p_lista jsonb, p_arquivo text, p_por text default null)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_mes date := date_trunc('month', now() at time zone 'America/Sao_Paulo')::date;
  v_primeira boolean := not exists (select 1 from public.colaboradores);
  item jsonb; v_nome text; v_email text; v_id uuid;
  usados uuid[] := '{}';
  v_novos integer := 0; v_saem integer := 0; v_voltam integer := 0; r record;
begin
  if not private.eh_aprovador() then
    raise exception 'Só o Aprovador pode atualizar a lista de colaboradores' using errcode = '42501';
  end if;
  for item in select * from jsonb_array_elements(p_lista) loop
    v_nome := trim(coalesce(item ->> 'nome', ''));
    v_email := nullif(lower(trim(coalesce(item ->> 'email', ''))), '');
    continue when v_nome = '';
    select c.id into v_id from public.colaboradores c
      where (v_email is not null and lower(c.email) = v_email)
         or public.normalizar_nome(c.nome_completo) = public.normalizar_nome(v_nome)
      order by (v_email is not null and lower(c.email) = v_email) desc limit 1;
    if v_id is not null and v_id = any(usados) then continue; end if;
    if v_id is null then
      insert into public.colaboradores (nome_completo, email) values (v_nome, v_email) returning id into v_id;
      insert into public.colaborador_periodos (colaborador_id, mes_inicio) values (v_id, case when v_primeira then null else v_mes end);
      v_novos := v_novos + 1;
    else
      update public.colaboradores set nome_completo = v_nome, email = coalesce(v_email, email) where id = v_id;
      if not exists (select 1 from public.colaborador_periodos p where p.colaborador_id = v_id and p.mes_fim is null) then
        insert into public.colaborador_periodos (colaborador_id, mes_inicio) values (v_id, v_mes);
        v_voltam := v_voltam + 1;
      end if;
    end if;
    usados := usados || v_id;
  end loop;
  for r in select c.id from public.colaboradores c
           where exists (select 1 from public.colaborador_periodos p where p.colaborador_id = c.id and p.mes_fim is null)
             and not (c.id = any(usados)) loop
    update public.colaborador_periodos set mes_fim = v_mes where colaborador_id = r.id and mes_fim is null;
    v_saem := v_saem + 1;
  end loop;
  insert into public.atualizacoes_lista (arquivo, feito_por, novos, saem, voltam) values (p_arquivo, p_por, v_novos, v_saem, v_voltam);
  return jsonb_build_object('novos', v_novos, 'saem', v_saem, 'voltam', v_voltam);
end $$;

-- Prazo de cada post publicado (a regra das 24 horas úteis fica só no banco)
create view public.publicacoes_prazo with (security_invoker = true) as
select pp.post_id, pp.publicado_em, public.prazo_24h_uteis(pp.publicado_em) as prazo,
       public.prazo_24h_uteis(pp.publicado_em) <= now() as encerrado
from public.post_publicacoes pp;
