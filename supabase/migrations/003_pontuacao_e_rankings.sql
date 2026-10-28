-- Migração 003: regras de pontuação e rankings

-- Prazo: 24 horas úteis (sábado e domingo não contam), no horário de Brasília
create or replace function public.prazo_24h_uteis(p_inicio timestamptz)
returns timestamptz language plpgsql stable set search_path = '' as $$
declare
  t timestamp := p_inicio at time zone 'America/Sao_Paulo';
  restante interval := interval '24 hours';
  dia integer;
  fim_dia timestamp;
  passo interval;
begin
  loop
    exit when restante <= interval '0';
    dia := extract(dow from t)::integer;  -- 0 = domingo, 6 = sábado
    if dia = 6 then
      t := date_trunc('day', t) + interval '2 days';
      continue;
    elsif dia = 0 then
      t := date_trunc('day', t) + interval '1 day';
      continue;
    end if;
    fim_dia := date_trunc('day', t) + interval '1 day';
    passo := least(restante, fim_dia - t);
    t := t + passo;
    restante := restante - passo;
  end loop;
  return t at time zone 'America/Sao_Paulo';
end $$;

-- A pessoa estava ativa naquele mês?
create or replace function public.colaborador_ativo_em(p_colab uuid, p_mes date)
returns boolean language sql stable set search_path = '' as $$
  select exists (
    select 1 from public.colaborador_periodos p
    where p.colaborador_id = p_colab
      and (p.mes_inicio is null or p.mes_inicio <= p_mes)
      and (p.mes_fim is null or p_mes <= p.mes_fim)
  )
$$;

-- Pontos do Slack: 1 comentário e 1 reação por pessoa por post, feitos até o fim do prazo; pelo e-mail
create view public.pontos_slack with (security_invoker = true) as
with pub as (
  select p.id as post_id, pp.publicado_em, public.prazo_24h_uteis(pp.publicado_em) as prazo,
         date_trunc('month', pp.publicado_em at time zone 'America/Sao_Paulo')::date as mes
  from public.posts p
  join public.post_publicacoes pp on pp.post_id = p.id
  where p.status = 'publicado'
), validas as (
  select distinct pub.mes, i.post_id, c.id as colaborador_id, i.tipo
  from pub
  join public.post_interacoes i on i.post_id = pub.post_id
  join public.colaboradores c on lower(c.email) = lower(i.email)
  where pub.prazo <= now() and i.momento >= pub.publicado_em and i.momento <= pub.prazo
)
select v.colaborador_id, v.mes, sum(r.pontos)::integer as pontos
from validas v
join public.pontuacao_regras r on r.chave = v.tipo::text
where public.colaborador_ativo_em(v.colaborador_id, v.mes)
group by v.colaborador_id, v.mes;

-- Pontos de posts externos: no mês da data de publicação; pelo nome completo
create view public.pontos_externos with (security_invoker = true) as
select e.colaborador_id, date_trunc('month', e.data_publicacao)::date as mes, (count(*) * r.pontos)::integer as pontos
from public.posts_externos e
join public.pontuacao_regras r on r.chave = 'post_externo'
where public.colaborador_ativo_em(e.colaborador_id, date_trunc('month', e.data_publicacao)::date)
group by e.colaborador_id, date_trunc('month', e.data_publicacao)::date, r.pontos;

-- Pontos de ações de people (só entram no ranking final)
create view public.pontos_acoes with (security_invoker = true) as
select x.colaborador_id, x.mes, x.tipo, r.pontos
from (
  select ap.colaborador_id, a.tipo,
         date_trunc('month', coalesce(a.data_acao, (a.criado_em at time zone 'America/Sao_Paulo')::date))::date as mes
  from public.acao_participantes ap
  join public.acoes_people a on a.id = ap.acao_id
) x
join public.pontuacao_regras r on r.chave = x.tipo::text
where public.colaborador_ativo_em(x.colaborador_id, x.mes);

-- Ranking do mês: quem estava ativo naquele mês
create or replace function public.ranking_mes(p_mes date)
returns table (colaborador_id uuid, nome_completo text, slack integer, externos integer, total integer)
language sql stable set search_path = '' as $$
  select c.id, c.nome_completo,
         coalesce(s.pontos, 0), coalesce(e.pontos, 0), coalesce(s.pontos, 0) + coalesce(e.pontos, 0)
  from public.colaboradores c
  left join public.pontos_slack s on s.colaborador_id = c.id and s.mes = date_trunc('month', p_mes)::date
  left join public.pontos_externos e on e.colaborador_id = c.id and e.mes = date_trunc('month', p_mes)::date
  where public.colaborador_ativo_em(c.id, date_trunc('month', p_mes)::date)
  order by 5 desc, c.nome_completo
$$;

-- Ranking final: ativos primeiro; inativos sempre no fim
create view public.ranking_final with (security_invoker = true) as
select * from (
  select c.id as colaborador_id, c.nome_completo,
    coalesce((select sum(pontos) from public.pontos_slack where colaborador_id = c.id), 0)::integer as slack,
    coalesce((select sum(pontos) from public.pontos_externos where colaborador_id = c.id), 0)::integer as externos,
    coalesce((select sum(pontos) from public.pontos_acoes where colaborador_id = c.id and tipo = 'treinamento'), 0)::integer as treinamento,
    coalesce((select sum(pontos) from public.pontos_acoes where colaborador_id = c.id and tipo = 'destaque'), 0)::integer as destaque,
    coalesce((select sum(pontos) from public.pontos_acoes where colaborador_id = c.id and tipo = 'social'), 0)::integer as social,
    exists (select 1 from public.colaborador_periodos p where p.colaborador_id = c.id and p.mes_fim is null) as ativo_agora
  from public.colaboradores c
) t
order by t.ativo_agora desc,
         (t.slack + t.externos + t.treinamento + t.destaque + t.social) desc,
         t.nome_completo;
