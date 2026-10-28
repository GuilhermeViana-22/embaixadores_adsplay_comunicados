# Embaixadores_adsplay_comunicados

Sistema para gerenciar os comunicados internos e a pontuação dos colaboradores.

Fluxo: a pessoa cadastra o comunicado (texto, arte opcional, data e canal) → o Aprovador aprova e define o horário → a publicação sai no Slack → depois de 24 horas úteis os comentários e as reações viram pontos nos rankings do mês e final.

## O que tem em cada pasta

| Pasta | O que é |
| --- | --- |
| `login/` | Tela de login em um arquivo só (`login-comunicados.html`), ligada ao Supabase. Abra direto no navegador. |
| `pagina-oficial/` | Página do sistema (`comunicados-oficial.html`), feita para rodar dentro do Claude. Ela guarda os dados no próprio Claude e **não** usa o Supabase. |
| `supabase/migrations/` | Comandos SQL do banco, na ordem: tabelas, segurança por linha, regras de pontuação e rankings. |
| `prototipo-adsplay/` | Protótipo no padrão Adsplay (Vue, Vite, Tailwind), com dados fictícios, e os documentos de especificação. |

## Banco de dados (Supabase)

As tabelas seguem as etapas do layout:

- Criação de posts e Posts programados: `posts`
- Posts publicados: `post_publicacoes`, `post_interacoes`, `slack_usuarios`
- Post Externo: `posts_externos`
- Ações de people: `acoes_people`, `acao_participantes`
- Rankings: funções e quadros `ranking_mes`, `ranking_final`, `pontos_slack`, `pontos_externos`, `pontos_acoes`
- Configurações: `users`, `colaboradores`, `colaborador_periodos`, `atualizacoes_lista`, `canais_slack`, `pontuacao_regras`

Para recriar o banco em um projeto novo, rode os arquivos de `supabase/migrations/` em ordem (001 a 005).

Depois, configure o ID do canal do Slack de cada opção na tabela `canais_slack`.

### Primeiro usuário

Nenhuma senha fica neste repositório. Para criar o primeiro Aprovador:

1. No painel do Supabase, em Authentication, Users, crie o usuário com e-mail e senha.
2. Na tabela `users`, insira uma linha com o mesmo `id` do usuário, o nome, o e-mail e `papel = 'aprovador'`.

## Regras de pontuação

- Posts do Slack: 1 ponto por comentário e 1 por reação, por post e por pessoa, em até 24 horas úteis (sábado e domingo não contam). A pontuação usa o e-mail do Slack.
- Post externo (Instagram ou LinkedIn): 50 pontos no mês da publicação. Usa o nome completo.
- Ações de people, só no ranking final: treinamento 50, destaque do quarter 100, ação social 50 por participante. Usam o nome completo.
- Quem sai da lista de colaboradores ativos fica inativo: aparece em cinza no fim do ranking final e mantém o histórico dos meses em que estava ativo.

Os valores ficam na tabela `pontuacao_regras`.

## Segurança

- Todas as tabelas têm proteção por linha (RLS). Quem não tem login não lê nem grava nada.
- A chave que aparece em `login/login-comunicados.html` é a **chave pública** do Supabase, feita para ficar em páginas. A proteção real são as regras do banco.
- Nunca coloque senhas, tokens ou a chave de serviço (`service_role`) neste repositório.
