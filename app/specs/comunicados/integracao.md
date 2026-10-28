# Briefing de integração: Comunicados e Pontuação (Embaixadores Adsplay)

> Documento para o time tech. Não coloque senhas, tokens ou chaves aqui.

## O que se quer integrar
- [x] Banco de dados real (posts, interações, colaboradores, ações de people, pontuação): FEITO no Supabase, veja `supabase.md`
- [ ] Gateway de pagamento: não se aplica
- [ ] CRM / RD Station / WhatsApp: não se aplica
- [ ] Repositório ou ferramenta de código: não se aplica
- [x] Outro: **Slack** (publicar o post no canal e horário aprovados; ler comentários e reações), **login com conta Google** (identificar quem posta), **armazenamento de arquivos** (artes, prints, listas de presença e planilhas), **leitura de planilhas** (colaboradores ativos, presença, destaques, ação social)

## Por que (objetivo de negócio)
Reunir em um só lugar a criação, a aprovação e a publicação de comunicados internos, e calcular a pontuação de engajamento dos colaboradores nos rankings mensal e final. Uso interno por 6 pessoas.

## Dados envolvidos
- Dados pessoais de clientes? Não. Há dados de colaboradores (nome completo, e-mail e interações no Slack). Precisa de revisão de privacidade (LGPD) pelo time responsável; este briefing não faz essa análise.
- Dados de pagamento? Não.
- Quem pode ver e alterar cada dado? No protótipo: o Aprovador aprova, devolve e programa posts e cadastra os colaboradores ativos; People cria posts, registra posts externos, lança interações e registra ações de people. A divisão final por e-mail ainda será passada pelo solicitante. A checagem real precisa ser no servidor.

## Onde isso aparece no mockup
| Tela | Model em db/ | O que precisa deixar de ser fictício |
| --- | --- | --- |
| Entrar e Configurações | userDb.js | Login com conta Google; perfis e permissões por e-mail; senha do Aprovador (hoje de exemplo) |
| Criação de posts, Programados | postDb.js | Gravação real; postagem automática no Slack no horário aprovado |
| Posts publicados | interacaoDb.js | Leitura real de comentários e reações do Slack, com data e hora de cada uma |
| Post Externo | postExternoDb.js | Guarda real do print |
| Ações de people | acaoPeopleDb.js | Leitura real das listas de presença, destaques e ação social |
| Rankings | colaboradorDb.js | Leitura real da planilha de colaboradores ativos |

## Regras de negócio a respeitar na versão real
- Posts do Slack: 1 ponto por comentário e 1 por reação, por post e por pessoa, em até 24 horas úteis após a publicação (sábado e domingo não contam). Máximo de 2 pontos por pessoa por post.
- Post externo: 50 pontos no mês da data de publicação.
- Ações de people (só no ranking final): treinamento 50, destaque 100 e ação social 50, por participante.
- O ranking considera só colaboradores ativos cadastrados.

## Dúvidas para o time tech
- Como identificar no Slack a mesma pessoa da planilha de colaboradores (e-mail, ID de usuário)?
- Reações e comentários removidos depois da publicação deixam de contar? Isso é decisão de negócio, ainda não definida.
- Como tratar feriados na contagem de 24 horas úteis? Hoje só sábado e domingo ficam de fora.
- O app do Slack precisa de quais permissões para postar e ler reações e comentários? Não sei dizer; o time tech precisa verificar.

## Contato
(a definir)
