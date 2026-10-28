# Tarefas: Comunicados e Pontuação (Embaixadores Adsplay)

- [x] 1. Copiar `templates/project-base/` para `comunicados/`, renomear o projeto (nome e `appConfig`), rodar `npm install` e conferir a versão do Node
- [x] 2. Aplicar o tema lilás suave em `src/style.css` (claro e escuro) e ajustar a cor primária padrão em `stores/theme.js`
- [x] 3. Criar os models em `src/db/` (userDb, permissionDb, colaboradorDb, canalDb, postDb, interacaoDb, postExternoDb, acaoPeopleDb) e exportar em `index.js`
- [x] 4. Criar `lib/businessHours.js` (prazo de 24 horas úteis) e `lib/scoring.js` (pontos do mês e finais)
- [x] 5. Adicionar o componente Textarea (pela ferramenta do padrão; se não baixar, criar à mão no mesmo estilo)
- [x] 6. Criar a store `roster` e os componentes: PageHeader, FileField, PostCard, InteractionHistory, RankingList, RosterUpload
- [x] 7. Login fictício: `LoginView.vue` (`/entrar`), guarda de rota no router, rótulos Aprovador e People em `config/app.js`, botão Sair no layout
- [x] 8. Menu lateral com as 7 abas e Configurações; `/` redireciona para `/criacao`; remover `HomeView.vue` e `UsersView.vue`
- [x] 9. Tela Criação de posts (formulário, "Postando como", pendentes e devolvidos, aprovar com horário e devolver com motivo)
- [x] 10. Tela Posts programados (lista, "Publicar agora (teste)", "Voltar para aprovação")
- [x] 11. Tela Posts publicados (contagens, histórico no prazo e fora do prazo, lançar interação com lista de nomes completos)
- [x] 12. Tela Post Externo (formulário com print e lista com 50 pontos no mês)
- [x] 13. Tela Ações de people (abas Treinamento, Destaque do quarter e Ação social)
- [x] 14. Telas Ranking do mês e Ranking final (seletor de mês, origem dos pontos, anexo da planilha de colaboradores ativos)
- [x] 15. Adaptar Configurações (perfil, permissões do projeto e aparência) e conferir a regra: só o Aprovador altera tipo de perfil
- [x] 16. Rodar `npm run build` e o checklist de entrega (`rules/06-checklist-entrega.md`), comparando com a spec; anotar o que não deu para verificar

## O que ficou diferente do planejado
- Textarea: o comando do padrão não conseguiu baixar o componente neste ambiente; foi criado à mão no mesmo estilo (`components/ui/textarea/`).
- Anexos de listas e planilhas: o protótipo não lê o arquivo. Em Ações de people, quem registra marca os nomes que constam na lista (em vez de uma lista de exemplo automática).
- Post Externo: acrescentei o campo "Colaborador que publicou", porque os pontos precisam ir para alguém do ranking.
- Colaboradores ativos: além do anexo simulado, há uma janela para ativar e desativar pessoas, para testar o efeito no ranking.
- Rotas: `HomeView` e `UsersView` foram removidas; `/` leva a `/criacao`.
