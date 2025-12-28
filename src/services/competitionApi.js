const mockCompetitions = [
  {
    id: 'cmp-2025-metropolitana',
    name: 'Copa Metropolitana',
    season: '2025',
    category: 'Série A',
    news: [
      {
        id: 'news-1',
        title: 'Equipe do Bairro Azul garante vitória na estreia',
        summary: 'Com gol no fim, o Bairro Azul venceu por 2 a 1 e lidera a competição.',
        content:
          'A equipe pressionou desde o início, mas só conseguiu a virada nos acréscimos. Destaque para o goleiro, eleito o melhor em campo.',
        status: 'publicada',
        publishedAt: '10/01/2025',
        author: 'Assessoria Metropolitana',
        highlight: true,
      },
      {
        id: 'news-2',
        title: 'Rodada 2 terá clássico decisivo',
        summary: 'Treinadores ajustam estratégias para o confronto que vale a liderança.',
        content:
          'Os dois times mais regulares da temporada se enfrentam neste sábado, prometendo grande público e muita disputa.',
        status: 'rascunho',
        publishedAt: '15/01/2025',
        author: 'Redação',
        highlight: false,
      },
    ],
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
    news: [
      {
        id: 'news-3',
        title: 'Base revela novos talentos',
        summary: 'Destaques da segunda rodada chamam atenção de clubes profissionais.',
        content:
          'Com média de idade de 18 anos, a competição tem mostrado atletas com grande potencial e números impressionantes.',
        status: 'publicada',
        publishedAt: '08/01/2025',
        author: 'Cobertura Taça Cidade',
        highlight: true,
      },
    ],
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
    news: [],
    galleries: [],
  },
]

const cloneCompetitionData = (competitions) =>
  competitions.map((competition) => ({
    ...competition,
    news: (competition.news ?? []).map((article) => ({ ...article })),
    galleries: competition.galleries.map((gallery) => ({ ...gallery })),
  }))

export const fetchCompetitionsWithGalleries = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(cloneCompetitionData(mockCompetitions))
    }, 300)
  })

export const fetchCompetitionsWithNews = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(cloneCompetitionData(mockCompetitions))
    }, 300)
  })

export default fetchCompetitionsWithGalleries
