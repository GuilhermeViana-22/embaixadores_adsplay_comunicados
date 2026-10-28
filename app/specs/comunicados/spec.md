# Spec: Comunicados e Pontuação (Embaixadores Adsplay)

> Aplicativo ligado ao Supabase (tabelas, regras de segurança, rankings e arquivos). A versão anterior era um protótipo com dados fictícios; veja `supabase.md` para o mapa de telas e tabelas.

## O que queremos
Um sistema interno para gerenciar os comunicados da empresa e criar uma pontuação para os colaboradores. A pessoa de People cria o comunicado (arte, texto, data prevista e canal), o Aprovador aprova e define o horário, a divulgação sai no Slack no horário aprovado e, depois de 24 horas úteis, as interações viram pontos nos rankings.

## Por que
Hoje o fluxo de comunicados e a pontuação de engajamento não têm um lugar único. O sistema reúne criação, aprovação, publicação e ranking. Uso interno, por 6 pessoas.

## Perfis (6 pessoas)
- **Aprovador:** aprova, devolve (com motivo) e programa posts; cadastra a planilha de colaboradores ativos.
- **People:** cria posts, registra posts externos, lança interações e registra ações de people.
- Login fictício: escolhe-se uma das 6 pessoas de exemplo. A senha do perfil Aprovador também é de exemplo.
- A divisão exata do que cada perfil pode fazer ainda precisa ser confirmada (ver pontos em aberto).

## Telas e ações (menu lateral, 7 abas + configurações)
1. **Criação de posts:** formulário com título, texto, arte (anexo), data prevista e canal de divulgação (lista suspensa: Comunicados gerais, CLT, PJ). O campo "Postando como" mostra o nome da pessoa logada. Ao enviar, o post vai para aprovação. Abaixo, a lista de posts aguardando aprovação ou devolvidos.
2. **Posts programados:** posts aprovados, com data e horário definidos pelo Aprovador. Botão de teste "Publicar agora" para simular a postagem no Slack.
3. **Posts publicados:** cada post com a quantidade de comentários e reações e o histórico de quem comentou ou reagiu (nome completo, tipo, data e hora, "no prazo" ou "fora do prazo"). Dá para lançar interações de exemplo, escolhendo o colaborador numa lista suspensa com nomes completos.
4. **Post Externo:** registro de posts do Instagram e do LinkedIn, com print (anexo), nome, data da publicação e colaborador que publicou. Cada post vale **50 pontos** e soma no mês da data de publicação.
5. **Ações de people** (pontuam só no ranking final):
   - Treinamento: lista de presença (anexo), nome e data do treinamento. **50 pontos** por participante.
   - Destaque do quarter: lista de destaques (anexo). **100 pontos** por destaque.
   - Ação social do quarter: planilha de participantes (anexo). **50 pontos** por participante.
6. **Ranking do mês:** seletor de mês, com os pontos de posts do Slack e de posts externos do mês.
7. **Ranking final:** soma de todos os meses, mais as ações de people.
8. **Configurações** (obrigatória no padrão): perfil, permissões e aparência (cor primária lilás e alternância claro/escuro).

Nos dois rankings há um espaço para anexar a **planilha de colaboradores ativos**. O cálculo usa sempre os colaboradores cadastrados: quem não está na lista não pontua, e quem está aparece mesmo com zero pontos.

## Regras de pontuação
- Posts do Slack: 1 ponto por comentário e 1 ponto por reação, por post, por pessoa, se feitos em até 24 horas úteis após a publicação (sábado e domingo não contam). O máximo é 2 pontos por pessoa por post.
- Os pontos entram no ranking depois que o prazo de 24 horas úteis do post termina.
- Post externo: 50 pontos no mês da publicação.
- Ações de people: só no ranking final (treinamento 50, destaque 100, ação social 50).

## Dados
Os dados ficam no Supabase. O mapa de telas, tabelas e funções está em `supabase.md`.

## Fora do escopo
- Publicar no Slack e ler comentários e reações do Slack pelo aplicativo. A publicação é feita à mão; o aplicativo registra o link da mensagem.
- Login com conta Google e criação de logins pelo aplicativo (feito no painel do Supabase).
- Leitura de planilhas em Excel (.xlsx). As listas são lidas em CSV.

## Pontos em aberto
- O que cada perfil e cada e-mail pode acessar (você ia me passar a lista; no protótipo uso a divisão acima).
- Horário padrão sugerido na aprovação (assumi 9h, o Aprovador pode mudar).
- Quem pode anexar a planilha de colaboradores ativos (assumi só o Aprovador).
