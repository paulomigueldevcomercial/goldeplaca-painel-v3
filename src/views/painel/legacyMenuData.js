const legacyMenuSections = [
  {
    title: 'Gerenciamento',
    items: [
      {
        label: 'Galeria',
        route: 'painel/albuns',
        visibility: 'Disponível exceto para competições 32, 45, 29, 38 e 53',
        path: '/painel/gerenciamento/galeria',
      },
      {
        label: 'Notícias',
        route: 'painel/noticiascompeticao',
        visibility: 'Disponível exceto para competição 32',
        path: '/painel/gerenciamento/noticias',
      },
      {
        label: 'Upload Súmula',
        route: 'painel/viewuploadsumula',
        visibility: 'Disponível para todas as competições',
        path: '/painel/gerenciamento/upload-sumula',
      },
      {
        label: 'Jogadores',
        route: 'painel/criarjogadores',
        visibility: 'Disponível exceto para competições 29, 45, 53 e 38',
        path: '/painel/gerenciamento/cadastro-jogadores',
      },
      {
        label: 'Equipes',
        route: 'painel/criarequipes',
        visibility: 'Disponível exceto para competições 29, 45, 53 e 38',
        path: '/painel/gerenciamento/cadastro-equipes',
      },
      {
        label: 'Categorias',
        route: 'painel/categorias',
        visibility: 'Disponível para todas as competições',
        path: '/painel/gerenciamento/categorias',
      },
      {
        label: 'Súmula',
        route: 'sumula/selecao',
        visibility: 'Disponível exceto para competições 32, 45 e 38',
        path: '/painel/gerenciamento/sumula',
      },
      {
        label: 'Scout',
        route: 'painel/equipes',
        visibility: 'Disponível apenas para administradores',
        path: '/painel/gerenciamento/scout',
      },
      {
        label: 'Jogos',
        route: 'painel/viewjogos',
        visibility: 'Disponível exceto para competições 32, 53, 45, 29 e 38',
        path: '/painel/gerenciamento/jogos',
      },
      {
        label: 'Gerar Scout Final - Competição',
        route: 'painel/competicao',
        visibility: 'Disponível apenas para administradores',
        path: '/painel/gerenciamento/scout-final-competicao',
      },
      {
        label: 'Carteirinha',
        route: 'painel/carteirinha',
        visibility: 'Disponível exceto para competições 32, 29, 45 e 38',
        path: '/painel/gerenciamento/carteirinha',
      },
      {
        label: 'Imagem Perfil Jogador',
        route: 'painel/imagensjogador',
        visibility: 'Disponível exceto para competições 32, 29, 45 e 38',
        path: '/painel/gerenciamento/imagem-perfil-jogador',
      },
      {
        label: 'Imagem Artilheiros Geral',
        route: 'painel/imagensartilheiro',
        visibility: 'Disponível exceto para competições 32, 29, 45 e 38',
        path: '/painel/gerenciamento/imagem-artilheiros-geral',
      },
      {
        label: 'Usuários',
        route: 'user/admin',
        visibility: 'Disponível apenas para administradores',
        path: '/painel/gerenciamento/usuarios',
      },
      {
        label: 'Competição',
        route: 'gerenciador/competicao/admin',
        visibility: 'Disponível apenas para administradores',
        path: '/painel/gerenciamento/competicao',
      },
      {
        label: 'Notificações',
        route: 'https://onesignal.com/',
        visibility: 'Disponível apenas para administradores (link externo)',
        path: '/painel/gerenciamento/notificacoes',
      },
    ],
  },
  {
    title: 'Relatórios',
    visibility: 'Categoria exibida apenas quando a competição não é 45',
    items: [
      {
        label: 'Equipe',
        route: 'painel/reportequipe',
        visibility: 'Disponível exceto para competições 53, 32, 29 e 38',
        path: '/painel/relatorios/equipe',
      },
      {
        label: 'Tabela Classificação',
        route: 'painel/reporttabela',
        visibility: 'Disponível exceto para competições 53, 32, 29 e 38',
        path: '/painel/relatorios/tabela-classificacao',
      },
      {
        label: 'Jogos',
        route: 'painel/reporttabeladejogos',
        visibility: 'Disponível exceto para competições 53, 32, 29 e 38',
        path: '/painel/relatorios/jogos',
      },
      {
        label: 'Jogadores Suspensos',
        route: 'painel/jgdsusp',
        visibility: 'Disponível exceto para competições 53, 32, 29 e 38',
        path: '/painel/relatorios/jogadores-suspensos',
      },
      {
        label: 'Súmula Campo',
        route: 'painel/sumulacampo',
        visibility: 'Disponível exceto para competições 29 e 38',
        path: '/painel/relatorios/sumula-campo',
      },
      {
        label: 'Súmula Futsal',
        route: 'painel/sumulafutsal',
        visibility: 'Disponível exceto para competições 29 e 38',
        path: '/painel/relatorios/sumula-futsal',
      },
      {
        label: 'Rodada da Semana',
        route: 'painel/tblsemana',
        visibility: 'Disponível exceto para competições 53, 32, 29 e 38',
        path: '/painel/relatorios/rodada-da-semana',
      },
      {
        label: 'Scout Final',
        route: 'painel/scoutfinal',
        visibility: 'Disponível exceto para competições 53, 32, 29 e 38',
        path: '/painel/relatorios/scout-final',
      },
      {
        label: 'Resultado Votação',
        route: 'reports/votacao',
        visibility: 'Disponível exceto para competições 53, 32, 29 e 38',
        path: '/painel/relatorios/resultado-votacao',
      },
      {
        label: 'Julgamento',
        route: 'painel/julgamento',
        visibility: 'Disponível exceto para competições 53, 29 e 38',
        path: '/painel/relatorios/julgamento',
      },
    ],
  },
  {
    title: 'Histórico',
    visibility: 'Categoria exibida apenas quando a competição não é 45, 53, 32, 29 ou 38',
    items: [
      {
        label: 'Competições',
        route: 'competicoesHistorico/admin',
        visibility: 'Disponível apenas para administradores',
        path: '/painel/historico/competicoes',
      },
      {
        label: 'Histórico',
        route: 'historico/admin',
        visibility: 'Disponível para competições permitidas',
        path: '/painel/historico/historico',
      },
    ],
  },
  {
    title: 'Admin',
    items: [
      {
        label: 'Mudar Senha',
        route: 'user/changepassword',
        visibility: 'Disponível para todas as competições',
        path: '/painel/admin/mudar-senha',
      },
      {
        label: 'Sair',
        route: 'gerenciador/acesso/logout',
        visibility: 'Disponível para todas as competições',
        path: '/painel/admin/sair',
      },
    ],
  },
]

export default legacyMenuSections
