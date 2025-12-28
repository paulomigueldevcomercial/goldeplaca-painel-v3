const mockCompetitions = [
  {
    id: 'cmp-2025-metropolitana',
    name: 'Copa Metropolitana',
    season: '2025',
    category: 'Série A',
    galleries: [
      {
        id: 'gal-1',
        title: 'Rodada 1 - gols e bastidores',
        description: 'Galeria de imagens da rodada de abertura com os melhores momentos.',
        coverUrl: 'https://via.placeholder.com/320x200?text=Rodada+1',
        status: 'ativa',
        updatedAt: '12/01/2025',
      },
      {
        id: 'gal-2',
        title: 'Apresentação das equipes',
        description: 'Fotos oficiais das equipes com uniforme e comissão técnica.',
        coverUrl: 'https://via.placeholder.com/320x200?text=Equipes',
        status: 'arquivada',
        updatedAt: '05/01/2025',
      },
    ],
  },
  {
    id: 'cmp-2025-cidade',
    name: 'Taça Cidade',
    season: '2025',
    category: 'Sub-20',
    galleries: [
      {
        id: 'gal-3',
        title: 'Semifinais',
        description: 'Cobertura fotográfica das partidas de semifinal.',
        coverUrl: 'https://via.placeholder.com/320x200?text=Semifinais',
        status: 'rascunho',
        updatedAt: '18/12/2024',
      },
    ],
  },
  {
    id: 'cmp-2024-historica',
    name: 'Histórico 2024',
    season: '2024',
    category: 'Livre',
    galleries: [],
  },
]

const cloneCompetitionData = (competitions) =>
  competitions.map((competition) => ({
    ...competition,
    galleries: competition.galleries.map((gallery) => ({ ...gallery })),
  }))

export const fetchCompetitionsWithGalleries = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(cloneCompetitionData(mockCompetitions))
    }, 300)
  })

export default fetchCompetitionsWithGalleries
