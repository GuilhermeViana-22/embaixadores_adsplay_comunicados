# Plano: Comunicados e Pontuação (Embaixadores Adsplay)

## Decisões gerais
- Modo estruturado (várias telas e regras).
- `isDashboard: true`: é um sistema com painel de ranking, então o botão "Sair" aparece. O logout é fictício.
- Perfis do padrão (`admin` e `user`) com rótulos trocados: `admin` = **Aprovador**, `user` = **People**.
- Login fictício em `/entrar`: escolhe-se uma das 6 pessoas de exemplo. O Aprovador digita uma senha de exemplo (valor fictício guardado só no protótipo; a senha real fica com o time tech).
- Visual: lilás suave como cor primária, estilo moderno (cantos arredondados, espaço generoso, sombras leves), modo Claro, Escuro ou Sistema pelas Configurações.
- Anexos (arte, print, listas e planilhas) são simulados: mostram o nome do arquivo escolhido. Nas listas e planilhas de Ações de people, quem registra marca os participantes, porque o padrão não permite biblioteca para ler planilhas.
- A regra das 24 horas úteis (sem sábado e domingo) fica em um arquivo único, `src/lib/businessHours.js`. A soma dos pontos fica em `src/lib/scoring.js`. As telas só chamam essas funções.

## Telas
| Tela | Rota | Arquivo | O que mostra |
| --- | --- | --- | --- |
| Entrar | /entrar | views/LoginView.vue | Escolha da pessoa de exemplo; senha de exemplo para o Aprovador |
| Criação de posts | /criacao | views/CreatePostView.vue | Formulário (título, texto, arte, data prevista, canal, "Postando como"); lista de pendentes e devolvidos; o Aprovador define horário, aprova ou devolve com motivo |
| Posts programados | /programados | views/ScheduledPostsView.vue | Posts aprovados com data e horário; "Publicar agora (teste)"; "Voltar para aprovação" |
| Posts publicados | /publicados | views/PublishedPostsView.vue | Post com contagem de comentários e reações, histórico de quem interagiu (no prazo ou fora), lançar interação com lista de nomes completos |
| Post Externo | /externos | views/ExternalPostsView.vue | Formulário (rede, nome, data, colaborador, print) e lista com os 50 pontos do mês |
| Ações de people | /acoes | views/PeopleActionsView.vue | Três abas: Treinamento, Destaque do quarter, Ação social; registros com participantes e pontos |
| Ranking do mês | /ranking-mes | views/MonthlyRankingView.vue | Seletor de mês, ranking e origem dos pontos; anexo da planilha de colaboradores ativos |
| Ranking final | /ranking-final | views/FinalRankingView.vue | Soma de todos os meses mais ações de people; mesmo anexo da planilha |
| Configurações | /configuracoes | views/SettingsView.vue | Perfil, Permissões, Aparência (adaptada do projeto-base) |
| Sessão encerrada | /saiu | views/LoggedOutView.vue | Do projeto-base |

A rota `/` redireciona para `/criacao`. `HomeView.vue` e `UsersView.vue` do projeto-base saem, para não sobrar tela sem uso (os usuários já são geridos em Configurações).

## Models em db/
| Model | Arquivo | Campos principais | Relações |
| --- | --- | --- | --- |
| Usuário | userDb.js | id, name, email, role, active, permissions | 6 pessoas: 1 Aprovador e 5 People |
| Permissão | permissionDb.js | id, key, label | Chaves: view, create_post, approve_post, register_interaction, register_external, register_action, manage_roster, manage_users |
| Colaborador | colaboradorDb.js | id, name, email, active | Lista usada no cálculo e na lista suspensa |
| Canal | canalDb.js | id, name | Comunicados gerais, CLT, PJ |
| Post | postDb.js | id, title, text, artFileName, plannedDate, channelId, authorUserId, status (pendente, devolvido, programado, publicado), returnReason, scheduledAt, publishedAt | channelId, authorUserId |
| Interação | interacaoDb.js | id, postId, colaboradorId, type (comentario ou reacao), at | postId, colaboradorId |
| Post externo | postExternoDb.js | id, network (Instagram ou LinkedIn), name, date, printFileName, colaboradorId | colaboradorId |
| Ação de people | acaoPeopleDb.js | id, type (treinamento, destaque, social), name, date, fileName, participantIds, registeredByUserId | participantIds é lista de colaboradorId |

Todos com dados inventados, e-mails `@exemplo.com`, pelo menos 3 itens por model e variações: post pendente, devolvido, programado e publicado; interações no prazo e fora do prazo; colaboradores ativos e inativos. As datas de exemplo ficam entre setembro e outubro de 2026, para os dois rankings terem conteúdo.

## Regras de cálculo (scoring.js)
- Interação conta se `at` está entre `publishedAt` e `publishedAt` + 24 horas úteis. Segunda a sexta contam; sábado e domingo não.
- Por post e por colaborador: no máximo 1 ponto de comentário e 1 de reação.
- Só pontuam posts publicados cujo prazo já terminou.
- Post externo: 50 pontos no mês da `date`.
- Ação de people: treinamento 50, destaque 100 e ação social 50 por participante, só no ranking final.
- Só colaboradores ativos entram no ranking; os ativos sem pontos aparecem com 0.
- Empate: ordem alfabética do nome.

## Componentes shadcn-vue a usar
- Já no projeto-base: Button, Card, Input, Label, Badge, Table, Avatar, Dialog, Tabs, Select, Separator.
- Precisa adicionar: **Textarea** (texto do comunicado). Se o comando `npx shadcn-vue@latest add textarea` não conseguir baixar o componente, crio o arquivo em `components/ui/textarea/` seguindo o estilo dos outros.
- Componentes próprios em `components/`: PostCard, FileField (anexo simulado), InteractionHistory, RankingList, RosterUpload (planilha de colaboradores ativos), PageHeader (título h1).
- Estado compartilhado em Pinia só onde duas telas precisam: sessão (já existe), tema (já existe) e uma store `roster` com o nome do último arquivo de colaboradores cadastrado, usada nos dois rankings.

## Integração real
Slack (postar e ler comentários e reações), conta Google, senha real, guarda dos arquivos e banco de dados ficam fora do protótipo. O briefing para o time tech está em `integracao.md`. Como as telas só acessam dados pelos arquivos de `src/db/`, o time tech pode trocar a implementação sem refazer as telas.

## Riscos e dúvidas
- Os perfis e permissões do protótipo não protegem nada; a checagem real precisa ser feita no servidor.
- O padrão exige o Node 20.19 ou mais novo (ou 22.12+). Vou conferir a versão do ambiente na construção. Não tenho como garantir antes que o `npm install` e o `add textarea` funcionem aqui.
- A cor lilás suave tem pouco contraste com texto branco; o tema escolhe texto escuro sobre a cor primária. Vou conferir a leitura nos dois modos. Se eu não conseguir abrir a tela no navegador, aviso na entrega.
- Pendente de você: lista de e-mails com acesso de cada perfil. O protótipo usa pessoas de exemplo.
