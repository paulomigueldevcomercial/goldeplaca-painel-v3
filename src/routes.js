import React from 'react'
import legacyMenuSections from './views/painel/legacyMenuData'

const PainelMenu = React.lazy(() => import('./views/painel/PainelMenu'))
const LegacyMenuItem = React.lazy(() => import('./views/painel/LegacyMenuItem'))
const GaleriaCrud = React.lazy(() => import('./views/galeria/GaleriaCrud'))
const NoticiasCrud = React.lazy(() => import('./views/noticias/NoticiasCrud'))
const UploadSumulaCrud = React.lazy(() => import('./views/uploadSumula/UploadSumulaCrud'))
const SumulasCrud = React.lazy(() => import('./views/sumulas/SumulasCrud'))
const JogadoresCrud = React.lazy(() => import('./views/jogadores/JogadoresCrud'))
const EquipesCrud = React.lazy(() => import('./views/equipes/EquipesCrud'))
const JogosCrud = React.lazy(() => import('./views/jogos/JogosCrud'))
const CompeticoesCrud = React.lazy(() => import('./views/competicoes/CompeticoesCrud'))
const CategoriasCrud = React.lazy(() => import('./views/categorias/CategoriasCrud'))
const JulgamentosCrud = React.lazy(() => import('./views/julgamentos/JulgamentosCrud'))
const RodadaSemanaReport = React.lazy(() => import('./views/relatorios/RodadaSemanaReport'))
const UsuariosCrud = React.lazy(() => import('./views/usuarios/UsuariosCrud'))

const legacyItems = legacyMenuSections.flatMap((section) => section.items)
const removePainelPrefix = (path) => path.replace(/^\/painel(\/|$)/, '/')

const buildLegacyRoute = (item) => () => <LegacyMenuItem item={item} />

const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/menu', name: 'Mapa do painel', element: PainelMenu },
  ...legacyItems.map((item) => ({
    path: removePainelPrefix(item.path),
    name: item.label,
    element:
      item.route === 'painel/albuns'
        ? GaleriaCrud
        : item.route === 'painel/noticiascompeticao'
          ? NoticiasCrud
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
                        : item.route === 'user/admin'
                          ? UsuariosCrud
                          : item.route === 'painel/viewuploadsumula'
                            ? UploadSumulaCrud
                            : item.route === 'sumula/selecao'
                              ? SumulasCrud
                              : buildLegacyRoute(item),
  })),
]

export default routes
