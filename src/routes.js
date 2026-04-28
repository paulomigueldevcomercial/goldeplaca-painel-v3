import React from 'react'
import { getVisibleLegacyMenuSections } from './views/painel/legacyMenuData'

const PainelMenu = React.lazy(() => import('./views/painel/PainelMenu'))
const PainelWelcome = React.lazy(() => import('./views/painel/PainelWelcome'))
const LegacyMenuItem = React.lazy(() => import('./views/painel/LegacyMenuItem'))
const GaleriaCrud = React.lazy(() => import('./views/galeria/GaleriaCrud'))
const NoticiasCrud = React.lazy(() => import('./views/noticias/NoticiasCrud'))
const PatrocinadoresCrud = React.lazy(() => import('./views/patrocinadores/PatrocinadoresCrud'))
const UploadSumulaCrud = React.lazy(() => import('./views/uploadSumula/UploadSumulaCrud'))
const SumulasCrud = React.lazy(() => import('./views/sumulas/SumulasCrud'))
const JogadoresCrud = React.lazy(() => import('./views/jogadores/JogadoresCrud'))
const EquipesCrud = React.lazy(() => import('./views/equipes/EquipesCrud'))
const JogosCrud = React.lazy(() => import('./views/jogos/JogosCrud'))
const CompeticoesCrud = React.lazy(() => import('./views/competicoes/CompeticoesCrud'))
const CategoriasCrud = React.lazy(() => import('./views/categorias/CategoriasCrud'))
const JulgamentosCrud = React.lazy(() => import('./views/julgamentos/JulgamentosCrud'))
const RodadaSemanaReport = React.lazy(() => import('./views/relatorios/RodadaSemanaReport'))
const SumulaReport = React.lazy(() => import('./views/relatorios/SumulaReport'))
const UsuariosCrud = React.lazy(() => import('./views/usuarios/UsuariosCrud'))
const Logout = React.lazy(() => import('./views/pages/logout/Logout'))

const legacyItems = getVisibleLegacyMenuSections().flatMap((section) => section.items)

const buildLegacyRoute = (item) => () => <LegacyMenuItem item={item} />

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/painel', exact: true, name: 'Painel', element: PainelWelcome },
  { path: '/painel/menu', name: 'Mapa do painel', element: PainelMenu },
  ...legacyItems.map((item) => ({
    path: item.path,
    name: item.label,
    adminOnly: item.route === 'user/admin' || item.route === 'gerenciador/competicao/admin',
    element:
      item.route === 'painel/albuns'
        ? GaleriaCrud
        : item.route === 'painel/noticiascompeticao'
          ? NoticiasCrud
          : item.route === 'painel/patrocinadores'
            ? PatrocinadoresCrud
            : item.route === 'painel/criarjogadores'
              ? JogadoresCrud
              : item.route === 'painel/criarequipes'
                ? EquipesCrud
                : item.route === 'painel/viewjogos'
                  ? JogosCrud
                  : item.route === 'gerenciador/competicao/admin'
                    ? CompeticoesCrud
                    : item.route === 'painel/categorias'
                      ? CategoriasCrud
                      : item.route === 'painel/julgamento'
                        ? JulgamentosCrud
                        : item.route === 'painel/tblsemana'
                          ? RodadaSemanaReport
                          : item.route === 'painel/sumulacampo'
                            ? () => <SumulaReport variant="campo" />
                            : item.route === 'painel/sumulafutsal'
                              ? () => <SumulaReport variant="futsal" />
                              : item.route === 'user/admin'
                                ? UsuariosCrud
                                : item.route === 'gerenciador/acesso/logout'
                                  ? Logout
                                  : item.route === 'painel/viewuploadsumula'
                                    ? UploadSumulaCrud
                                    : item.route === 'sumula/selecao'
                                      ? SumulasCrud
                                      : buildLegacyRoute(item),
  })),
]

export default routes
