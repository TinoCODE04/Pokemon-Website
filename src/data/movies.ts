export type MovieCategory = 'animated' | 'live-action' | 'special' | 'upcoming'
export type MovieSourceKind = 'official' | 'tmdb' | 'bulbapedia' | 'wikipedia' | 'wikidata' | 'imdb' | 'other'

export interface MovieSource {
  label: string
  url: string
  kind: MovieSourceKind
}

export interface TmdbSnapshot {
  id: number
  mediaType?: 'movie' | 'tv'
  rating?: number
  voteCount?: number
  posterPath?: string
  backdropPath?: string
  capturedAt: string
}

export interface MovieTrailer {
  youtubeId: string
  label: string
  sourceUrl: string
}

export interface PokemonMovie {
  id: string
  slug: string
  title: string
  alternateTitles?: readonly string[]
  japaneseTitle?: string
  category: MovieCategory
  releaseDate?: string
  releaseYear: number
  releaseNotes?: string
  runtimeMinutes?: number
  synopsis: string
  featuredPokemon: readonly string[]
  director?: string
  studio?: string
  distributor?: string
  officialUrl?: string
  trailer?: MovieTrailer
  tmdb?: TmdbSnapshot
  sources: readonly MovieSource[]
  verifiedAt: string
}

const VERIFIED_AT = '2026-09-12'
const OFFICIAL_MOVIES_URL = 'https://www.pokemon.com/us/animation/movies'
const BULBAPEDIA_MOVIES_URL = 'https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_movie'

const officialMoviesSource: MovieSource = {
  label: 'Pokémon Movie Encyclopedia',
  url: OFFICIAL_MOVIES_URL,
  kind: 'official',
}

const bulbapediaMoviesSource: MovieSource = {
  label: 'Bulbapedia Pokémon movie catalogue',
  url: BULBAPEDIA_MOVIES_URL,
  kind: 'bulbapedia',
}

function bulbapediaTitleSource(page: string): MovieSource {
  return {
    label: 'Bulbapedia title record',
    url: `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(page).replace(/%2F/g, '/')}`,
    kind: 'bulbapedia',
  }
}

function tmdbSource(id: number, mediaType: 'movie' | 'tv' = 'movie'): MovieSource {
  return {
    label: 'The Movie Database (TMDB)',
    url: `https://www.themoviedb.org/${mediaType}/${id}`,
    kind: 'tmdb',
  }
}

function sources(bulbapediaPage: string, tmdbId: number, mediaType: 'movie' | 'tv' = 'movie'): readonly MovieSource[] {
  return [officialMoviesSource, bulbapediaTitleSource(bulbapediaPage), tmdbSource(tmdbId, mediaType)]
}

function tmdb(
  id: number,
  rating: number,
  posterPath: string,
  backdropPath: string,
  mediaType: 'movie' | 'tv' = 'movie',
): TmdbSnapshot {
  return { id, mediaType, rating, posterPath, backdropPath, capturedAt: VERIFIED_AT }
}

export const MOVIES = [
  {
    id: 'movie-01',
    slug: 'pokemon-the-first-movie',
    title: 'Pokémon: The First Movie',
    alternateTitles: ['Mewtwo Strikes Back'],
    japaneseTitle: 'ミュウツーの逆襲',
    category: 'animated',
    releaseDate: '1999-11-10',
    releaseYear: 1999,
    runtimeMinutes: 85,
    synopsis: 'Mewtwo gathers powerful Trainers on New Island to prove that cloned Pokémon are superior, forcing Ash and Pikachu into a battle over what makes every life unique.',
    featuredPokemon: ['Mewtwo', 'Mew', 'Pikachu'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'Warner Bros.',
    officialUrl: 'https://www.pokemon.com/us/animation/movies/pokemon-the-first-movie',
    tmdb: tmdb(10228, 7.0, '/6YPzBcMH0aPNTvdXNCDLY0zdE1g.jpg', '/eA0qc5ihjSKG05tdJO4QPgYPAwY.jpg'),
    sources: sources('M01', 10228),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-02',
    slug: 'pokemon-the-movie-2000',
    title: 'Pokémon the Movie 2000',
    alternateTitles: ['The Power of One'],
    japaneseTitle: '幻のポケモン ルギア爆誕',
    category: 'animated',
    releaseDate: '2000-07-21',
    releaseYear: 2000,
    runtimeMinutes: 84,
    synopsis: 'A collector disrupts the balance between three Legendary birds, leaving Ash to recover ancient treasures and help Lugia calm a worldwide storm.',
    featuredPokemon: ['Lugia', 'Articuno', 'Zapdos', 'Moltres'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'Warner Bros.',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(12599, 6.7, '/6u65C8aG4krAVyHsTjAMF7ucTDH.jpg', '/bS93S5uEVZng4qmDhmDMXTSEuay.jpg'),
    sources: sources('M02', 12599),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-03',
    slug: 'pokemon-3-the-movie',
    title: 'Pokémon 3: The Movie',
    alternateTitles: ['Spell of the Unown: Entei'],
    japaneseTitle: '結晶塔の帝王 ENTEI',
    category: 'animated',
    releaseDate: '2001-04-06',
    releaseYear: 2001,
    runtimeMinutes: 74,
    synopsis: 'The Unown turn a lonely child’s wishes into a crystal world, and Ash must confront the Entei she imagines as her father to rescue his mother.',
    featuredPokemon: ['Entei', 'Unown', 'Pikachu'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'Warner Bros.',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(10991, 6.6, '/hrBWiMWnD7mheMx846ycUWA3ohs.jpg', '/dLGQo5Xq6H18vPx00Czot8VHi3K.jpg'),
    sources: sources('M03', 10991),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-04',
    slug: 'pokemon-4ever',
    title: 'Pokémon 4Ever',
    alternateTitles: ['Celebi: The Voice of the Forest'],
    japaneseTitle: 'セレビィ 時を超えた遭遇',
    category: 'animated',
    releaseDate: '2002-10-11',
    releaseYear: 2002,
    runtimeMinutes: 80,
    synopsis: 'Celebi carries a young Trainer forty years into the future, where Ash and friends defend it from a Team Rocket agent wielding corrupting Dark Balls.',
    featuredPokemon: ['Celebi', 'Suicune', 'Pikachu'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'Miramax Films',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(12600, 6.5, '/thz83PS9twtVBEEAM59J1bh75nU.jpg', '/lnwNzJdU4gMlgoQlaT8HgSI2OpD.jpg'),
    sources: sources('M04', 12600),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-05',
    slug: 'pokemon-heroes',
    title: 'Pokémon Heroes',
    alternateTitles: ['Latios & Latias'],
    japaneseTitle: '水の都の護神 ラティアスとラティオス',
    category: 'animated',
    releaseDate: '2003-05-16',
    releaseYear: 2003,
    runtimeMinutes: 72,
    synopsis: 'In the canal city of Alto Mare, Ash joins Latias and Latios to stop thieves from exploiting the Soul Dew and the city’s ancient defence system.',
    featuredPokemon: ['Latias', 'Latios', 'Pikachu'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'Miramax Films',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(33875, 6.7, '/eySv5rdYLW1k6LxepxCNl8ND26R.jpg', '/6nfEmbfWMuMBenYMOY6Vdho3Ycg.jpg'),
    sources: sources('M05', 33875),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-06',
    slug: 'jirachi-wish-maker',
    title: 'Pokémon: Jirachi Wish Maker',
    japaneseTitle: '七夜の願い星 ジラーチ',
    category: 'animated',
    releaseDate: '2004-06-01',
    releaseYear: 2004,
    runtimeMinutes: 81,
    synopsis: 'During the Millennium Comet’s brief return, Max befriends Jirachi while a former Team Magma scientist tries to harness its wish-granting power.',
    featuredPokemon: ['Jirachi', 'Groudon', 'Pikachu'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'Miramax Films',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(36218, 6.6, '/jbH0tIEymhyd6uk4xV4vrS6qybV.jpg', '/bGU8DD03FfsEPtUpu8zgu4TTHNf.jpg'),
    sources: sources('M06', 36218),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-07',
    slug: 'destiny-deoxys',
    title: 'Pokémon: Destiny Deoxys',
    japaneseTitle: '裂空の訪問者 デオキシス',
    category: 'animated',
    releaseDate: '2005-01-22',
    releaseYear: 2005,
    runtimeMinutes: 98,
    synopsis: 'A recovered Deoxys searches for its companion in a high-tech city while Rayquaza returns to continue a conflict that began with a meteor strike.',
    featuredPokemon: ['Deoxys', 'Rayquaza', 'Pikachu'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'Miramax Films',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(34065, 6.6, '/3UV4evNh70gvPZB9KJEoh3a9B6I.jpg', '/86qE9M3TL5sb6kBhPnrmeHlj1gY.jpg'),
    sources: sources('M07', 34065),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-08',
    slug: 'lucario-and-the-mystery-of-mew',
    title: 'Pokémon: Lucario and the Mystery of Mew',
    japaneseTitle: 'ミュウと波導の勇者 ルカリオ',
    category: 'animated',
    releaseDate: '2006-09-19',
    releaseYear: 2006,
    runtimeMinutes: 103,
    synopsis: 'Ash partners with a Lucario from the distant past to find Pikachu and uncover why Lucario’s former master sealed it away near the Tree of Beginning.',
    featuredPokemon: ['Lucario', 'Mew', 'Pikachu'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: OFFICIAL_MOVIES_URL,
    trailer: {
      youtubeId: '7vc-FhG682E',
      label: 'Official Trailer',
      sourceUrl: 'https://www.youtube.com/watch?v=7vc-FhG682E',
    },
    tmdb: tmdb(34067, 7.0, '/3A3WiPXPmWVhXC7bGSiqtsYY9z6.jpg', '/7qzuPx3ukGxCyLR9j0Ahg3fFI7r.jpg'),
    sources: sources('M08', 34067),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'special-01',
    slug: 'mewtwo-returns',
    title: 'Pokémon: Mewtwo Returns',
    japaneseTitle: 'ミュウツー！我ハココニ在リ',
    category: 'special',
    releaseDate: '2001-12-05',
    releaseYear: 2001,
    runtimeMinutes: 63,
    synopsis: 'Giovanni discovers Mewtwo’s hidden refuge and attempts to reclaim it, drawing Ash and friends into a fight for the cloned Pokémon’s freedom.',
    featuredPokemon: ['Mewtwo', 'Pikachu'],
    director: 'Masamitsu Hidaka',
    studio: 'OLM',
    distributor: '4Kids Entertainment',
    tmdb: tmdb(36897, 6.8, '/zIYljUBF2rXzB0yYZVEPY1l8zHp.jpg', '/pJszL2mPl084IDSzLDPH8NqIq0r.jpg'),
    sources: sources('Pokémon_Mewtwo_Returns', 36897),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-09',
    slug: 'pokemon-ranger-and-the-temple-of-the-sea',
    title: 'Pokémon Ranger and the Temple of the Sea',
    japaneseTitle: 'ポケモンレンジャーと蒼海の王子 マナフィ',
    category: 'animated',
    releaseDate: '2007-03-23',
    releaseYear: 2007,
    runtimeMinutes: 107,
    synopsis: 'May forms a bond with the newly hatched Manaphy as a Pokémon Ranger races a pirate to protect the hidden Sea Temple and its ancient treasure.',
    featuredPokemon: ['Manaphy', 'Kyogre', 'Pikachu'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: OFFICIAL_MOVIES_URL,
    trailer: {
      youtubeId: 'ItZyBxKxAAk',
      label: 'Official Trailer',
      sourceUrl: 'https://www.youtube.com/watch?v=ItZyBxKxAAk',
    },
    tmdb: tmdb(16808, 6.5, '/jZOi06xHjsG1VqbiIwS8GkyrAOn.jpg', '/y9I6h1NrGdzX99QKcoqLhsFfVWO.jpg'),
    sources: sources('M09', 16808),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'special-03',
    slug: 'mastermind-of-mirage-pokemon',
    title: 'Pokémon: The Mastermind of Mirage Pokémon',
    japaneseTitle: '戦慄のミラージュポケモン',
    category: 'special',
    releaseDate: '2006-04-29',
    releaseYear: 2006,
    runtimeMinutes: 47,
    synopsis: 'A demonstration of digitally created Mirage Pokémon turns dangerous when the Mirage Master unleashes a powerful artificial Mewtwo.',
    featuredPokemon: ['Mewtwo', 'Mew', 'Pikachu'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    tmdb: tmdb(137773, 6.7, '/hJU76t41sf5BoKVHT3L3TtQP9xs.jpg', '/isnRO0gqBRSaUJyBULOQSZ8T6nU.jpg'),
    sources: sources('The_Mastermind_of_Mirage_Pokémon', 137773),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'special-02',
    slug: 'the-legend-of-thunder',
    title: 'The Legend of Thunder!',
    alternateTitles: ['Pokémon Chronicles: The Legend of Thunder!'],
    japaneseTitle: 'ライコウ 雷の伝説',
    category: 'special',
    releaseDate: '2006-06-03',
    releaseYear: 2006,
    runtimeMinutes: 69,
    synopsis: 'Johto Trainers Jimmy, Marina, and Vincent unite to stop Team Rocket agents from capturing the Legendary Pokémon Raikou.',
    featuredPokemon: ['Raikou', 'Typhlosion', 'Meganium'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    tmdb: tmdb(295613, 5.9, '/5V4RQvyYlz8HY9piw1ctsXiUKdc.jpg', '/ndoVM8A80W8GQ4ODxcbze2hjj7I.jpg'),
    sources: sources('The_Legend_of_Thunder!', 295613),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-10',
    slug: 'the-rise-of-darkrai',
    title: 'Pokémon: The Rise of Darkrai',
    japaneseTitle: 'ディアルガVSパルキアVSダークライ',
    category: 'animated',
    releaseDate: '2008-02-24',
    releaseYear: 2008,
    runtimeMinutes: 90,
    synopsis: 'A clash between Dialga and Palkia traps Alamos Town between dimensions, while the misunderstood Darkrai struggles to protect it.',
    featuredPokemon: ['Darkrai', 'Dialga', 'Palkia'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(25961, 7.0, '/yElGG6lxLtQXcgBVzF7Xxq7YRa2.jpg', '/dGulOAB9N4qJlafWxI4YczXDA4I.jpg'),
    sources: sources('M10', 25961),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-11',
    slug: 'giratina-and-the-sky-warrior',
    title: 'Pokémon: Giratina and the Sky Warrior',
    japaneseTitle: 'ギラティナと氷空の花束 シェイミ',
    category: 'animated',
    releaseDate: '2009-02-13',
    releaseYear: 2009,
    runtimeMinutes: 96,
    synopsis: 'Shaymin pulls Ash into the Reverse World, where Giratina guards a fragile balance threatened by a researcher seeking its power.',
    featuredPokemon: ['Giratina', 'Shaymin', 'Dialga'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(47292, 6.8, '/e3T08IL68EVcrUPiJLVN9KSGlXs.jpg', '/b5NH2rjQFATYfkd1XYbGQWeyevx.jpg'),
    sources: sources('M11', 47292),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-12',
    slug: 'arceus-and-the-jewel-of-life',
    title: 'Pokémon: Arceus and the Jewel of Life',
    japaneseTitle: 'アルセウス 超克の時空へ',
    category: 'animated',
    releaseDate: '2009-11-20',
    releaseYear: 2009,
    runtimeMinutes: 94,
    synopsis: 'Arceus returns to punish humanity for an ancient betrayal, sending Ash and friends through time to repair history before several worlds collapse.',
    featuredPokemon: ['Arceus', 'Dialga', 'Palkia', 'Giratina'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(39057, 7.1, '/tpqguVMKyPbINe0GYmMwduoaUar.jpg', '/1WygXLVPO4wNYm6WUgUi7PNAvkU.jpg'),
    sources: sources('M12', 39057),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-13',
    slug: 'zoroark-master-of-illusions',
    title: 'Pokémon—Zoroark: Master of Illusions',
    alternateTitles: ['Pokémon: Zoroark - Master of Illusions'],
    japaneseTitle: '幻影の覇者 ゾロアーク',
    category: 'animated',
    releaseDate: '2011-02-05',
    releaseYear: 2011,
    runtimeMinutes: 96,
    synopsis: 'Zorua asks Ash to rescue Zoroark, whose illusions are being exploited in a scheme involving Crown City and Celebi’s Time Ripple.',
    featuredPokemon: ['Zoroark', 'Zorua', 'Celebi'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(50087, 6.8, '/tWgH64RZmm2rIHtO2DNnfN3DZa8.jpg', '/7fC65V10NQ2lhHHQ0KA1KNA1PvO.jpg'),
    sources: sources('M13', 50087),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-14a',
    slug: 'white-victini-and-zekrom',
    title: 'Pokémon the Movie: White—Victini and Zekrom',
    japaneseTitle: 'ビクティニと黒き英雄 ゼクロム',
    category: 'animated',
    releaseDate: '2011-12-03',
    releaseYear: 2011,
    runtimeMinutes: 96,
    synopsis: 'Ash befriends Victini in Eindoak Town and joins Zekrom to stop a well-meant attempt to restore an ancient kingdom from destroying the land.',
    featuredPokemon: ['Victini', 'Zekrom', 'Reshiram'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(88557, 6.5, '/J5AsLGUAqMgq0MjoyWldqqMPs1.jpg', '/zpD9VRmZ1Zv7ZMsrNmutRrt0LZU.jpg'),
    sources: sources('M14', 88557),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-14b',
    slug: 'black-victini-and-reshiram',
    title: 'Pokémon the Movie: Black—Victini and Reshiram',
    japaneseTitle: 'ビクティニと白き英雄 レシラム',
    category: 'animated',
    releaseDate: '2011-12-10',
    releaseYear: 2011,
    runtimeMinutes: 96,
    synopsis: 'In the companion version of Victini’s adventure, Ash joins Reshiram as the Sword of the Vale threatens Eindoak Town and its people.',
    featuredPokemon: ['Victini', 'Reshiram', 'Zekrom'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(115223, 6.6, '/SuIAXmxlbImWHobCkCWCHAeg03.jpg', '/2cpTYNwiC7RH5pLsZs7HIL6dBWB.jpg'),
    sources: sources('M14', 115223),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-15',
    slug: 'kyurem-vs-the-sword-of-justice',
    title: 'Pokémon the Movie: Kyurem vs. the Sword of Justice',
    japaneseTitle: 'キュレムVS聖剣士 ケルディオ',
    category: 'animated',
    releaseDate: '2012-12-08',
    releaseYear: 2012,
    runtimeMinutes: 71,
    synopsis: 'Keldeo challenges Kyurem before it is ready and must learn true courage with Ash’s help to rescue the captured Swords of Justice.',
    featuredPokemon: ['Keldeo', 'Kyurem', 'Cobalion', 'Terrakion', 'Virizion'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: 'https://www.pokemon.com/us/animation/movies/pokemon-the-movie-kyurem-vs-the-sword-of-justice',
    tmdb: tmdb(150213, 6.4, '/7gQEAR8aaCQRtJi7wq26ST5hukn.jpg', '/9AFWONBBVKyDiUtD89kXNnKnG4b.jpg'),
    sources: sources('M15', 150213),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-16',
    slug: 'genesect-and-the-legend-awakened',
    title: 'Pokémon the Movie: Genesect and the Legend Awakened',
    japaneseTitle: '神速のゲノセクト ミュウツー覚醒',
    category: 'animated',
    releaseDate: '2013-10-19',
    releaseYear: 2013,
    runtimeMinutes: 72,
    synopsis: 'A displaced Genesect group occupies a city habitat, bringing its powerful leader into conflict with Mewtwo as Ash searches for a peaceful solution.',
    featuredPokemon: ['Genesect', 'Mewtwo', 'Pikachu'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(227679, 6.4, '/l921PT8ZDeAD4YWDaB5Uke89r9b.jpg', '/k1Tt4Pa6DM2PBt3Qr9TROqUzsH9.jpg'),
    sources: sources('M16', 227679),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'special-04',
    slug: 'pokemon-origins',
    title: 'Pokémon Origins',
    japaneseTitle: 'ポケットモンスター THE ORIGIN',
    category: 'special',
    releaseDate: '2013-11-15',
    releaseYear: 2013,
    runtimeMinutes: 88,
    synopsis: 'Red begins his Kanto journey with Charmander, challenges Gym Leaders and Team Rocket, and pursues the goal of completing Professor Oak’s Pokédex.',
    featuredPokemon: ['Charizard', 'Mewtwo', 'Bulbasaur'],
    studio: 'Production I.G / Xebec / OLM',
    tmdb: tmdb(61295, 7.3, '/yuuwDjFgCHHz39f0i7zI6WERG0Y.jpg', '/zVpsLulhjz1RoW4LWQjYP3wmhtg.jpg', 'tv'),
    sources: sources('Pokémon_Origins', 61295, 'tv'),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-17',
    slug: 'diancie-and-the-cocoon-of-destruction',
    title: 'Pokémon the Movie: Diancie and the Cocoon of Destruction',
    japaneseTitle: '破壊の繭とディアンシー',
    category: 'animated',
    releaseDate: '2014-11-08',
    releaseYear: 2014,
    runtimeMinutes: 76,
    synopsis: 'Diancie seeks Xerneas to restore the fading Heart Diamond, but jewel thieves awaken Yveltal and place the entire Diamond Domain at risk.',
    featuredPokemon: ['Diancie', 'Xerneas', 'Yveltal'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(303903, 6.7, '/rA0KbJZbBt2fMmZs8bwPZnzFfDc.jpg', '/k5OFuW1NdI1Lt57nzXEjxwd8zGv.jpg'),
    sources: sources('M17', 303903),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-18',
    slug: 'hoopa-and-the-clash-of-ages',
    title: 'Pokémon the Movie: Hoopa and the Clash of Ages',
    japaneseTitle: '光輪の超魔神 フーパ',
    category: 'animated',
    releaseDate: '2015-11-05',
    releaseYear: 2015,
    runtimeMinutes: 73,
    synopsis: 'Hoopa’s sealed power escapes as a hostile shadow that summons Legendary Pokémon, forcing Ash and friends to defend Dahara City.',
    featuredPokemon: ['Hoopa', 'Rayquaza', 'Lugia'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(350499, 6.8, '/6kXRevMC1XSywmxqqRHuBcZlROT.jpg', '/crFk9m8DK9lNqlOa7AGTvYsO6Qn.jpg'),
    sources: sources('M18', 350499),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-19',
    slug: 'volcanion-and-the-mechanical-marvel',
    title: 'Pokémon the Movie: Volcanion and the Mechanical Marvel',
    japaneseTitle: 'ボルケニオンと機巧のマギアナ',
    category: 'animated',
    releaseDate: '2016-11-04',
    releaseYear: 2016,
    runtimeMinutes: 95,
    synopsis: 'A mysterious device binds Ash to Volcanion as they race to rescue Magearna from a minister who wants its artificial soul for the Azoth Kingdom.',
    featuredPokemon: ['Volcanion', 'Magearna', 'Pikachu'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'VIZ Media',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(382190, 6.7, '/4hdbuM6qBrHH0hX4sD8pNsXmalm.jpg', '/bQl46uhGPTu9jnIRE9Ip2xOMc9M.jpg'),
    sources: sources('M19', 382190),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-20',
    slug: 'i-choose-you',
    title: 'Pokémon the Movie: I Choose You!',
    japaneseTitle: 'キミにきめた！',
    category: 'animated',
    releaseDate: '2017-11-05',
    releaseYear: 2017,
    runtimeMinutes: 98,
    synopsis: 'An alternate retelling of Ash and Pikachu’s first journey follows the Rainbow Wing toward Ho-Oh, guided by new friends and the elusive Marshadow.',
    featuredPokemon: ['Pikachu', 'Ho-Oh', 'Marshadow'],
    director: 'Kunihiko Yuyama',
    studio: 'OLM',
    distributor: 'Fathom Events',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(436931, 7.1, '/7vWiCtO1pa0oSG6QTyVKd8eyLLk.jpg', '/dyDxxLRTwqGFNOCtLbpxD1QLlfJ.jpg'),
    sources: sources('M20', 436931),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-21',
    slug: 'the-power-of-us',
    title: 'Pokémon the Movie: The Power of Us',
    japaneseTitle: 'みんなの物語',
    category: 'animated',
    releaseDate: '2018-11-24',
    releaseYear: 2018,
    runtimeMinutes: 98,
    synopsis: 'During Fula City’s Wind Festival, strangers with very different struggles must work together with Ash, Pikachu, and Lugia to save the community.',
    featuredPokemon: ['Lugia', 'Zeraora', 'Pikachu'],
    director: 'Tetsuo Yajima',
    studio: 'OLM / Wit Studio',
    distributor: 'Fathom Events',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(494407, 7.2, '/5oXKbOQOsPaLscHCqHjvi7hegOJ.jpg', '/b1EKIjZWYAoC3WUk14012DX46Cb.jpg'),
    sources: sources('M21', 494407),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'live-action-01',
    slug: 'detective-pikachu',
    title: 'POKÉMON Detective Pikachu',
    alternateTitles: ['Pokémon Detective Pikachu'],
    japaneseTitle: '名探偵ピカチュウ',
    category: 'live-action',
    releaseDate: '2019-05-10',
    releaseYear: 2019,
    runtimeMinutes: 105,
    synopsis: 'Tim Goodman teams with a wisecracking Pikachu only he can understand to find his missing father and uncover a conspiracy threatening Ryme City.',
    featuredPokemon: ['Detective Pikachu', 'Mewtwo', 'Psyduck'],
    director: 'Rob Letterman',
    studio: 'Legendary Entertainment',
    distributor: 'Warner Bros.',
    trailer: {
      youtubeId: 'NWLUZHzW890',
      label: 'Official Home Entertainment Trailer',
      sourceUrl: 'https://www.youtube.com/watch?v=NWLUZHzW890',
    },
    tmdb: tmdb(447404, 6.9, '/uhWvnFgg3BNlcUz0Re1HfQqIcCD.jpg', '/yXybBEC45p84D0Ky7GmQQYrclVr.jpg'),
    sources: sources('POKÉMON_Detective_Pikachu', 447404),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-22',
    slug: 'mewtwo-strikes-back-evolution',
    title: 'Pokémon: Mewtwo Strikes Back—Evolution',
    japaneseTitle: 'ミュウツーの逆襲 EVOLUTION',
    category: 'animated',
    releaseDate: '2020-02-27',
    releaseYear: 2020,
    runtimeMinutes: 98,
    synopsis: 'The first Pokémon movie’s conflict between Mewtwo, its clones, and their originals is retold through full CGI animation.',
    featuredPokemon: ['Mewtwo', 'Mew', 'Pikachu'],
    director: 'Kunihiko Yuyama / Motonori Sakakibara',
    studio: 'OLM / Sprite Animation Studios',
    distributor: 'Netflix',
    officialUrl: OFFICIAL_MOVIES_URL,
    trailer: {
      youtubeId: 'D0zYJ1RQ-fs',
      label: 'Official Trailer',
      sourceUrl: 'https://www.youtube.com/watch?v=D0zYJ1RQ-fs',
    },
    tmdb: tmdb(571891, 6.7, '/rtlyO2oIMcCx2DbOM52XO2rAcgn.jpg', '/xHyX5zQIdu13w708J4lYhmwEqNp.jpg'),
    sources: sources('M22', 571891),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'movie-23',
    slug: 'secrets-of-the-jungle',
    title: 'Pokémon the Movie: Secrets of the Jungle',
    japaneseTitle: '劇場版ポケットモンスター ココ',
    category: 'animated',
    releaseDate: '2021-10-08',
    releaseYear: 2021,
    runtimeMinutes: 101,
    synopsis: 'Ash meets Koko, a human raised by Zarude, and helps him discover his identity while protecting the Forest of Okoya from exploitation.',
    featuredPokemon: ['Zarude', 'Celebi', 'Pikachu'],
    director: 'Tetsuo Yajima',
    studio: 'OLM',
    distributor: 'Netflix',
    officialUrl: OFFICIAL_MOVIES_URL,
    tmdb: tmdb(662708, 7.2, '/9Ow7PJcAHMMxgSIjCW6RnRqE9OA.jpg', '/4KpNHvQIjyg1YFovRAoUXoFrGnR.jpg'),
    sources: sources('M23', 662708),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'special-05',
    slug: 'the-arceus-chronicles',
    title: 'Pokémon: The Arceus Chronicles',
    japaneseTitle: '神とよばれし アルセウス',
    category: 'special',
    releaseDate: '2022-09-23',
    releaseYear: 2022,
    runtimeMinutes: 63,
    synopsis: 'Ash, Goh, and Dawn reunite in Sinnoh to stop Team Galactic from opening a dimensional gate, awakening a rampaging Heatran in the process.',
    featuredPokemon: ['Arceus', 'Heatran', 'Pikachu'],
    studio: 'OLM',
    distributor: 'Netflix',
    trailer: {
      youtubeId: 'rHimPkAq5V8',
      label: 'Official Trailer',
      sourceUrl: 'https://www.youtube.com/watch?v=rHimPkAq5V8',
    },
    tmdb: tmdb(207567, 7.3, '/aGH8biv7gRGeLyxg5Sn4WPcskxV.jpg', '/5X77Ep0wZLuxVuDhh5g7xJr3R9d.jpg', 'tv'),
    sources: sources('The_Arceus_Chronicles', 207567, 'tv'),
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'upcoming-01',
    slug: 'pokemon-wild-card',
    title: 'Pokémon: Wild Card',
    category: 'upcoming',
    releaseYear: 2027,
    releaseNotes: 'Officially announced as coming soon; the final release date has not been announced.',
    synopsis: 'A Pokémon Trading Card Game player and their partner Mimikyu pursue their goals in a new feature-length animated story produced with CloverWorks.',
    featuredPokemon: ['Mimikyu'],
    studio: 'CloverWorks',
    officialUrl: 'https://www.pokemon.com/uk/news/new-feature-length-animated-film-pokemon-wild-card-coming-soon',
    sources: [
      {
        label: 'Pokémon official announcement',
        url: 'https://www.pokemon.com/uk/news/new-feature-length-animated-film-pokemon-wild-card-coming-soon',
        kind: 'official',
      },
      bulbapediaMoviesSource,
    ],
    verifiedAt: VERIFIED_AT,
  },
] as const satisfies readonly PokemonMovie[]

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function validateMovieCatalog(movies: readonly PokemonMovie[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const slugs = new Set<string>()

  for (const movie of movies) {
    if (ids.has(movie.id)) errors.push(`Duplicate id: ${movie.id}`)
    if (slugs.has(movie.slug)) errors.push(`Duplicate slug: ${movie.slug}`)
    ids.add(movie.id)
    slugs.add(movie.slug)

    if (!SLUG.test(movie.slug)) errors.push(`Invalid slug: ${movie.slug}`)
    if (movie.releaseDate && !ISO_DATE.test(movie.releaseDate)) errors.push(`Invalid release date: ${movie.slug}`)
    if (!ISO_DATE.test(movie.verifiedAt)) errors.push(`Invalid verification date: ${movie.slug}`)
    if (!movie.sources.length) errors.push(`Missing sources: ${movie.slug}`)
    if (!movie.sources.every((source) => /^https:\/\//.test(source.url))) {
      errors.push(`Invalid source URL: ${movie.slug}`)
    }
    if (movie.category !== 'upcoming') {
      const titleSource = movie.sources.find((source) => source.kind === 'bulbapedia')
      if (!titleSource || titleSource.url === BULBAPEDIA_MOVIES_URL) {
        errors.push(`Missing title-specific source: ${movie.slug}`)
      }
    }
    if (!movie.synopsis.trim()) errors.push(`Missing synopsis: ${movie.slug}`)
    if (movie.trailer && (
      !/^[A-Za-z0-9_-]{6,20}$/.test(movie.trailer.youtubeId)
      || !movie.trailer.label.trim()
      || !movie.trailer.sourceUrl.startsWith('https://www.youtube.com/watch?v=')
    )) {
      errors.push(`Invalid trailer: ${movie.slug}`)
    }
  }

  return errors
}
