# Mapa das telas e do banco (Supabase)

## Etapas do layout e tabelas

| Etapa | Tabelas | Observações |
| --- | --- | --- |
| Criação de posts / Posts programados | `posts` | A mesma linha muda de status: pendente, devolvido, programado, publicado, cancelado. Devolver exige o motivo; programar exige data e horário. |
| Posts publicados | `post_publicacoes`, `post_interacoes`, `slack_usuarios` | Comentários e reações lançados à mão ficam com `origem = 'manual'`. |
| Post Externo | `posts_externos` | |
| Ações de people | `acoes_people`, `acao_participantes` | |
| Rankings | `ranking_mes()`, `ranking_final`, `pontos_slack`, `pontos_externos`, `pontos_acoes` | Calculados no banco. |
| Usuários | `users` (coluna `admin`), funções `admin_criar_usuario` e `admin_redefinir_senha` | Só administradores. Senha temporária gerada no servidor; troca obrigatória no primeiro acesso (marca `trocar_senha` nos metadados do login). |
| Configurações | `colaboradores`, `colaborador_periodos`, `atualizacoes_lista`, `canais_slack`, `pontuacao_regras` | |
| Arquivos | bucket `anexos` (privado) | Artes, prints e listas, até 10 MB. |

## Regras de pontuação (no banco)

- Slack: 1 ponto por comentário e 1 por reação, por post e por pessoa, em até 24 horas úteis (função `prazo_24h_uteis`). Identifica a pessoa pelo e-mail.
- Post externo: pontos no mês da publicação. Identifica a pessoa pelo nome completo escolhido na lista de colaboradores.
- Ações de people: só no ranking final.
- Os valores ficam em `pontuacao_regras`.

## Colaboradores ativos

Cada colaborador tem períodos (`colaborador_periodos`) com mês de início e de fim. Quem sai da lista nova recebe um mês de fim: continua nos rankings dos meses em que estava ativo e fica em cinza, no fim, no ranking final. A atualização da lista é feita pela função `aplicar_lista_colaboradores`, de uma vez só (tudo ou nada), depois de uma prévia (`previa_lista_colaboradores`).

## Quem pode o quê

- **Administrador:** é sempre também Aprovador. Cria usuários (pela função do banco `admin_criar_usuario`), define o perfil de cada um (People ou Aprovador), torna ou remove administradores, ativa, desativa e redefine senhas. O banco impede ficar sem administrador ativo.
- **Aprovador:** aprova, devolve, programa e cancela posts; registra publicações; cadastra colaboradores; altera canais e pontos.
- **People:** cria posts e edita ou apaga o próprio enquanto estiver pendente ou devolvido; registra posts externos, ações de people e interações; lê tudo.
- Quem não tem login, ou tem login mas não tem perfil ativo em `users`, não lê nem grava nada.
