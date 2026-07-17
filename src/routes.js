import React from 'react'
import {
  getVisibleLegacyMenuSections,
  isAdminOnlyLegacyMenuItem,
  isAlwaysVisibleLegacyMenuItem,
} from './views/painel/legacyMenuData'

const PainelMenu = React.lazy(() => import('./views/painel/PainelMenu'))
const PainelWelcome = React.lazy(() => import('./views/painel/PainelWelcome'))
const LegacyMenuItem = React.lazy(() => import('./views/painel/LegacyMenuItem'))
const GaleriaCrud = React.lazy(() => import('./views/galeria/GaleriaCrud'))
const NoticiasCrud = React.lazy(() => import('./views/noticias/NoticiasCrud'))
const VideosCrud = React.lazy(() => import('./views/videos/VideosCrud'))
const PatrocinadoresCrud = React.lazy(() => import('./views/patrocinadores/PatrocinadoresCrud'))
const UploadSumulaCrud = React.lazy(() => import('./views/uploadSumula/UploadSumulaCrud'))
const CompeticaoPdfUpload = React.lazy(() => import('./views/competicaoPdf/CompeticaoPdfUpload'))
const SumulasCrud = React.lazy(() => import('./views/sumulas/SumulasCrud'))
const JogadoresCrud = React.lazy(() => import('./views/jogadores/JogadoresCrud'))
const EquipesCrud = React.lazy(() => import('./views/equipes/EquipesCrud'))
const EquipeReportLogoUpload = React.lazy(() => import('./views/equipes/EquipeReportLogoUpload'))
const JogosCrud = React.lazy(() => import('./views/jogos/JogosCrud'))
const CompeticoesCrud = React.lazy(() => import('./views/competicoes/CompeticoesCrud'))
const CategoriasCrud = React.lazy(() => import('./views/categorias/CategoriasCrud'))
const JulgamentosCrud = React.lazy(() => import('./views/julgamentos/JulgamentosCrud'))
const RodadaSemanaReport = React.lazy(() => import('./views/relatorios/RodadaSemanaReport'))
const SumulaReport = React.lazy(() => import('./views/relatorios/SumulaReport'))
const TabelaJogosCompletoReport = React.lazy(
  () => import('./views/relatorios/TabelaJogosCompletoReport'),
)
const ScoutFinalReport = React.lazy(() => import('./views/relatorios/ScoutFinalReport'))
const UsuariosCrud = React.lazy(() => import('./views/usuarios/UsuariosCrud'))
const ArtilheirosCrud = React.lazy(() => import('./views/artilheiros/ArtilheirosCrud'))
const MenuArtilheiroCrud = React.lazy(() => import('./views/artilheiros/MenuArtilheiroCrud'))
const HistoricosCrud = React.lazy(() => import('./views/historicos/HistoricosCrud'))
const CompeticoesHistoricoCrud = React.lazy(
  () => import('./views/historicos/CompeticoesHistoricoCrud'),
)
const ChangePassword = React.lazy(() => import('./views/pages/change-password/ChangePassword'))
const Logout = React.lazy(() => import('./views/pages/logout/Logout'))

const legacyItems = getVisibleLegacyMenuSections().flatMap((section) => section.items)

const buildLegacyRoute = (item) => () => <LegacyMenuItem item={item} />

const componentByLegacyRoute = {
  'painel/albuns': GaleriaCrud,
  'painel/noticiascompeticao': NoticiasCrud,
  'painel/videos': VideosCrud,
  'painel/patrocinadores': PatrocinadoresCrud,
  'painel/criarjogadores': JogadoresCrud,
  'painel/criarequipes': EquipesCrud,
  'painel/viewjogos': JogosCrud,
  'gerenciador/competicao/admin': CompeticoesCrud,
  'painel/categorias': CategoriasCrud,
  'painel/julgamento': JulgamentosCrud,
  'painel/tblsemana': RodadaSemanaReport,
  'painel/tabela_jogos_completo': TabelaJogosCompletoReport,
  'painel/scoutfinal': ScoutFinalReport,
  'painel/sumulacampo': () => <SumulaReport variant="campo" />,
  'painel/sumulafutsal': () => <SumulaReport variant="futsal" />,
  'user/admin': UsuariosCrud,
  'competicoesHistorico/admin': CompeticoesHistoricoCrud,
  'menuArtilheiro/admin': MenuArtilheiroCrud,
  'painel/artilheiros-geral': ArtilheirosCrud,
  'historico/admin': HistoricosCrud,
  'user/changepassword': ChangePassword,
  'gerenciador/acesso/logout': Logout,
  'painel/viewuploadsumula': UploadSumulaCrud,
  'painel/competicoes/pdf/rgc': () => <CompeticaoPdfUpload variant="rgc" />,
  'painel/competicoes/pdf/cde': () => <CompeticaoPdfUpload variant="cde" />,
  'painel/competicoes/pdf/resultado': () => <CompeticaoPdfUpload variant="resultado" />,
  'painel/competicoes/pdf/outros-anexos': () => <CompeticaoPdfUpload variant="outrosAnexos" />,
  'painel/equipes/reports/logo': EquipeReportLogoUpload,
  'sumula/selecao': SumulasCrud,
}

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/painel', exact: true, name: 'Painel', element: PainelWelcome },
  { path: '/painel/menu', name: 'Mapa do painel', element: PainelMenu },
  ...legacyItems.map((item) => ({
    path: item.path,
    name: item.label,
    adminOnly: isAdminOnlyLegacyMenuItem(item),
    alwaysAllowed: isAlwaysVisibleLegacyMenuItem(item),
    menuAlias: item.menuAlias,
    element: componentByLegacyRoute[item.route] ?? buildLegacyRoute(item),
  })),
]

export default routes
