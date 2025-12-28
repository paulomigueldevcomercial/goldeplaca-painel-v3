const mockPlayerCompetitions = [
  {
    id: 'cmp-2025-metropolitana',
    name: 'Copa Metropolitana',
    season: '2025',
    categories: [
      { id: 'cat-serie-a', name: 'Série A' },
      { id: 'cat-sub-20', name: 'Sub-20' },
    ],
    teams: [
      { id: 'team-bairro-azul', name: 'Bairro Azul', categoryId: 'cat-serie-a' },
      { id: 'team-uniao-estrela', name: 'União Estrela', categoryId: 'cat-serie-a' },
      { id: 'team-esperanca-jr', name: 'Esperança Jr.', categoryId: 'cat-sub-20' },
    ],
  },
  {
    id: 'cmp-2025-cidade',
    name: 'Taça Cidade',
    season: '2025',
    categories: [
      { id: 'cat-livre', name: 'Livre' },
      { id: 'cat-feminino', name: 'Feminino' },
    ],
    teams: [
      { id: 'team-nova-geracao', name: 'Nova Geração', categoryId: 'cat-livre' },
      { id: 'team-rio-branco', name: 'Rio Branco', categoryId: 'cat-livre' },
      { id: 'team-aurora-fc', name: 'Aurora FC', categoryId: 'cat-feminino' },
    ],
  },
]

const mockPlayers = [
  {
    id: 'pl-1020',
    registration: 'MAT-1020',
    playerType: 'Atleta',
    name: 'Lucas Almeida',
    imageUrl: 'https://via.placeholder.com/96x96?text=LA',
    birthDate: '1998-05-12',
    competitionId: 'cmp-2025-metropolitana',
    categoryId: 'cat-serie-a',
    teamId: 'team-bairro-azul',
  },
  {
    id: 'pl-1021',
    registration: 'MAT-1021',
    playerType: 'Goleiro',
    name: 'Rafael Dias',
    imageUrl: 'https://via.placeholder.com/96x96?text=RD',
    birthDate: '2000-11-03',
    competitionId: 'cmp-2025-metropolitana',
    categoryId: 'cat-serie-a',
    teamId: 'team-uniao-estrela',
  },
  {
    id: 'pl-2042',
    registration: 'MAT-2042',
    playerType: 'Atleta',
    name: 'Ana Beatriz',
    imageUrl: 'https://via.placeholder.com/96x96?text=AB',
    birthDate: '2002-09-21',
    competitionId: 'cmp-2025-cidade',
    categoryId: 'cat-feminino',
    teamId: 'team-aurora-fc',
  },
]

const clonePlayers = (players) => players.map((player) => ({ ...player }))
const cloneCompetitions = (competitions) =>
  competitions.map((competition) => ({
    ...competition,
    categories: competition.categories.map((category) => ({ ...category })),
    teams: competition.teams.map((team) => ({ ...team })),
  }))

export const fetchPlayerSetup = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        competitions: cloneCompetitions(mockPlayerCompetitions),
        players: clonePlayers(mockPlayers),
      })
    }, 300)
  })

export default fetchPlayerSetup
