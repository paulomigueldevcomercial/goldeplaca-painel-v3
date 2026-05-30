import { hasAdminRole, normalizeMenusAllowed } from '../../utils/authSession'
import { MENU_ALIAS_BY_ROUTE } from '../../config/menusAllowed'

export const hidePendingLegacyMenuItems = true

export const implementedLegacyMenuRoutes = [
  'painel/noticiascompeticao',
  'painel/patrocinadores',
  'painel/viewuploadsumula',
  'painel/competicoes/pdf/rgc',
  'painel/competicoes/pdf/cde',
  'painel/competicoes/pdf/resultado',
  'painel/competicoes/pdf/outros-anexos',
  'painel/equipes/reports/logo',
  'painel/criarjogadores',
  'painel/criarequipes',
  'painel/categorias',
  'sumula/selecao',
  'painel/viewjogos',
  'user/admin',
  'gerenciador/competicao/admin',
  'painel/sumulacampo',
  'painel/sumulafutsal',
  'painel/tblsemana',
  'painel/tabela_jogos_completo',
  'painel/julgamento',
  'painel/artilheiros-geral',
  'historico/admin',
  'user/changepassword',
  'gerenciador/acesso/logout',
]

export const isPendingLegacyMenuItem = (item) => !implementedLegacyMenuRoutes.includes(item.route)

export const shouldShowLegacyMenuItem = (item) =>
  !hidePendingLegacyMenuItems || !isPendingLegacyMenuItem(item)

export const isAdminOnlyLegacyMenuItem = (item) => item.route === 'user/admin'

export const isAlwaysVisibleLegacyMenuItem = (item) =>
  ['user/changepassword', 'gerenciador/acesso/logout'].includes(item.route)

export const shouldShowLegacyMenuItemForAccess = (item, roles, menusAllowed = []) =>
  shouldShowLegacyMenuItem(item) &&
  (isAlwaysVisibleLegacyMenuItem(item) ||
    (normalizeMenusAllowed(menusAllowed).includes(item.menuAlias) &&
      (!isAdminOnlyLegacyMenuItem(item) || hasAdminRole(roles))))

export const getVisibleLegacyMenuSections = () =>
  legacyMenuSections
    .map((section) => ({
      ...section,
      items: section.items.filter(shouldShowLegacyMenuItem),
    }))
    .filter((section) => section.items.length > 0)

export const getVisibleLegacyMenuSectionsForAccess = (roles, menusAllowed = []) =>
  legacyMenuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        shouldShowLegacyMenuItemForAccess(item, roles, menusAllowed),
      ),
    }))
    .filter((section) => section.items.length > 0)

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
        label: 'Patrocinadores',
        route: 'painel/patrocinadores',
        visibility: 'Disponível para todas as competições',
        path: '/painel/gerenciamento/patrocinadores',
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
        label: 'Usuários',
        route: 'user/admin',
        visibility: 'Disponível apenas para administradores',
        path: '/painel/gerenciamento/usuarios',
      },
      {
        label: 'Competição',
        route: 'gerenciador/competicao/admin',
        visibility: 'Disponível para todos os usuários',
        path: '/painel/gerenciamento/competicao',
      },
    ],
  },
  {
    title: 'Gerenciamento Arquivos',
    items: [
      {
        label: 'RGC',
        route: 'painel/competicoes/pdf/rgc',
        visibility: 'Disponível para upload de PDF por competição',
        path: '/painel/gerenciamento-pdf/rgc',
      },
      {
        label: 'CDE',
        route: 'painel/competicoes/pdf/cde',
        visibility: 'Disponível para upload de PDF por competição',
        path: '/painel/gerenciamento-pdf/cde',
      },
      {
        label: 'Resultado julgamento',
        route: 'painel/competicoes/pdf/resultado',
        visibility: 'Disponível para upload de PDF por competição',
        path: '/painel/gerenciamento-pdf/resultado-julgamento',
      },
      {
        label: 'Outros anexos',
        route: 'painel/competicoes/pdf/outros-anexos',
        visibility: 'Disponível para upload de PDF por competição',
        path: '/painel/gerenciamento-pdf/outros-anexos',
      },
      {
        label: 'Escudo equipe',
        route: 'painel/equipes/reports/logo',
        visibility: 'Disponível para upload de escudo de equipe em JPG',
        path: '/painel/gerenciamento-arquivos/escudo-equipe',
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
        label: 'Tabela de jogos completo',
        route: 'painel/tabela_jogos_completo',
        visibility: 'Disponível exceto para competições 53, 32, 29 e 38',
        path: '/painel/relatorios/tabela-jogos-completo',
      },
      {
        label: 'Scout Final',
        route: 'painel/scoutfinal',
        visibility: 'Disponível exceto para competições 53, 32, 29 e 38',
        path: '/painel/relatorios/scout-final',
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
        visibility: 'Disponível para cadastro de históricos de competições',
        path: '/painel/historico/historico',
      },
      {
        label: 'Artilheiros',
        route: 'painel/artilheiros-geral',
        visibility: 'Disponível para cadastro dos maiores artilheiros',
        path: '/painel/historico/artilheiros',
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

legacyMenuSections.forEach((section) => {
  section.items.forEach((item) => {
    item.menuAlias = MENU_ALIAS_BY_ROUTE[item.route] ?? ''
  })
})

export default legacyMenuSections
