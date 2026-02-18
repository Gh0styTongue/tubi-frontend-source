/* eslint-disable @typescript-eslint/quotes */
export const DATE_FORMAT = 'YYYY-MM-DD';

export const WATCH_SCHEDULE_TITLES = {
  BACHELOR_IN_PARADISE: 'bachelor-in-paradise',
  CONCACAF: 'concacaf',
  FBOY_ISLAND: 'fboy-island',
  FINDING_MAGIC_MIKE: 'finding-magic-mike',
  HEAD_OF_THE_CLASS: 'head-of-the-class',
  LEGENDARY: 'legendary',
  LIGA_MX: 'liga-mx',
  RAISED_BY_WOLVES: 'raised-by-wolves',
  THE_BACHELOR: 'the-bachelor',
  THE_BACHELORETTE: 'the-bachelorette',
  THE_NEVERS: 'the-nevers',
  THE_TIME_TRAVELER_S_WIFE: 'the-time-traveler-s-wife',
  WESTWORLD: 'westworld',
};

export const WATCH_SCHEDULE_VALUES = Object.values(WATCH_SCHEDULE_TITLES);

export const SPORTS_EVENT_TITLES = [WATCH_SCHEDULE_TITLES.CONCACAF, WATCH_SCHEDULE_TITLES.LIGA_MX];

export const CONTENT_IDS = {
  WB_TV_ALL_TOGETHER: __PRODUCTION__ ? 715941 : 691441,
  WB_TV_KEEPING_IT_REAL: __PRODUCTION__ ? 715944 : 691439,
  WB_TV_WATCHLIST: __PRODUCTION__ ? 715943 : 691440,
  FOX_SPORTS_ON_TUBI_EN: 613683, // prod and dev share the same channel id
  FOX_SPORTS_ON_TUBI_ES: 613695,
};

export const SPANISH_CONTENT_IDS = [CONTENT_IDS.FOX_SPORTS_ON_TUBI_ES];

export const WATCH_SCHEDULE_CONTENT_IDS = {
  [WATCH_SCHEDULE_TITLES.BACHELOR_IN_PARADISE]: [CONTENT_IDS.WB_TV_KEEPING_IT_REAL],
  [WATCH_SCHEDULE_TITLES.CONCACAF]: [CONTENT_IDS.FOX_SPORTS_ON_TUBI_EN],
  [WATCH_SCHEDULE_TITLES.FBOY_ISLAND]: [CONTENT_IDS.WB_TV_KEEPING_IT_REAL],
  [WATCH_SCHEDULE_TITLES.FINDING_MAGIC_MIKE]: [CONTENT_IDS.WB_TV_KEEPING_IT_REAL],
  [WATCH_SCHEDULE_TITLES.HEAD_OF_THE_CLASS]: [CONTENT_IDS.WB_TV_ALL_TOGETHER],
  [WATCH_SCHEDULE_TITLES.LEGENDARY]: [CONTENT_IDS.WB_TV_KEEPING_IT_REAL],
  [WATCH_SCHEDULE_TITLES.LIGA_MX]: [CONTENT_IDS.FOX_SPORTS_ON_TUBI_EN, CONTENT_IDS.FOX_SPORTS_ON_TUBI_ES],
  [WATCH_SCHEDULE_TITLES.RAISED_BY_WOLVES]: [CONTENT_IDS.WB_TV_WATCHLIST],
  [WATCH_SCHEDULE_TITLES.THE_BACHELORETTE]: [CONTENT_IDS.WB_TV_KEEPING_IT_REAL],
  [WATCH_SCHEDULE_TITLES.THE_BACHELOR]: [CONTENT_IDS.WB_TV_KEEPING_IT_REAL],
  [WATCH_SCHEDULE_TITLES.THE_NEVERS]: [CONTENT_IDS.WB_TV_WATCHLIST],
  [WATCH_SCHEDULE_TITLES.THE_TIME_TRAVELER_S_WIFE]: [CONTENT_IDS.WB_TV_WATCHLIST],
  [WATCH_SCHEDULE_TITLES.WESTWORLD]: [CONTENT_IDS.WB_TV_WATCHLIST],
};

export const FEATURED_CONTENTS_LIMIT = 4;

export const TOP_EPG_CONTENTS_LIMIT = 8;

export const METADATA = {
  [WATCH_SCHEDULE_TITLES.BACHELOR_IN_PARADISE]: {
    title: 'Bachelor in Paradise',
    year: '2014',
    seasonInfo: 'Season 7, 15 Episodes',
    rating: 'TV-14',
    tags: ['Reality', 'Romance'],
    description:
      "From the creator of the Bachelor franchise, and hosted by Chris Harrison, it's BACHELOR IN PARADISE, premiering this summer. Some of The Bachelor's biggest stars and villains are back. They all left The Bachelor or The Bachelorette with broken hearts but now they know what it really takes to find love, and on BACHELOR IN PARADISE they'll get a second chance to find their soul mates. Contestants will live together in an isolated romantic paradise and, over the course of six episodes, we'll follow these former bachelors and bachelorettes as they explore new romantic relationships. America will watch as they fall in love or go through renewed heartbreak. The romantic dating series will feature new twists, shocking surprises, unexpected guests and some of the most unlikely relationships in Bachelor history, plus all the usual romance, drama and tears we've come to expect from the Bachelor franchise. It all comes together in the romantic television event of the summer.",
  },
  [WATCH_SCHEDULE_TITLES.CONCACAF]: {
    title: 'Concacaf Champions Cup',
    description:
      'The Concacaf Champions Cup is the top tier continental club tournament, which crowns the best team of the region and qualifies for the FIFA Club World Cup.',
  },
  [WATCH_SCHEDULE_TITLES.FBOY_ISLAND]: {
    title: 'FBoy Island',
    year: '2021',
    seasonInfo: 'Season 1 & 2, 20 Episodes',
    rating: 'TV-MA',
    tags: ['Game', 'Reality', 'Romance'],
    description:
      'Three women move to a tropical island where they\'re joined by 24 men — 12 self-proclaimed "Nice Guys" looking for love, and 12 self-proclaimed "FBoys," there to compete for cold, hard cash. The women will navigate the dating pool together with the hope of finding a lasting love connection. By the finale, all will be revealed — who is a Nice Guy, who is an FBoy, and who do the women ultimately choose? FBOY ISLAND is a social experiment that asks the age-old question: Can FBoys truly reform or do Nice Guys always finish last?',
  },
  [WATCH_SCHEDULE_TITLES.FINDING_MAGIC_MIKE]: {
    title: 'Finding Magic Mike',
    year: '2021',
    seasonInfo: 'Season 1, 7 Episodes',
    rating: 'TV-MA',
    tags: ['Dance', 'Game', 'Performance', 'Reality'],
    description:
      'From the producers behind the hit Magic Mike franchise and live shows, this exhilaratingly sexy reality competition series follows 10 men through a rigorous dance bootcamp meant to jolt their inner spark. Fearing they\'ve lost their mojo, the guys strip their clothes and emotional baggage in weekly dance challenges that test their skills, attitude, and sexiness for a shot at a $100,000 prize and an opportunity to perform on the Magic Mike Live stage in Las Vegas. Featuring Adam Rodriguez ("Tito" from the Magic Mike movies), choreographers Alison Faulk and Luke Broadlick, and Magic Mike Live executive producer Vincent Marini, Finding Magic Mike is full of abs, sweat, and tears - and is guaranteed to work its magic on you.',
  },
  [WATCH_SCHEDULE_TITLES.HEAD_OF_THE_CLASS]: {
    title: 'Head of the Class',
    year: '2021',
    seasonInfo: 'Season 1, 22 Episodes',
    rating: 'TV-PG',
    tags: ['Comedy', 'Teen'],
    description:
      'HEAD OF THE CLASS is about a group of overachieving high school students who meet their greatest challenge - a teacher (Isabella Gomez - One Day at a Time) who wants them to focus less on grades and more on experiencing life.',
  },
  [WATCH_SCHEDULE_TITLES.LEGENDARY]: {
    title: 'Legendary',
    year: '2020',
    seasonInfo: 'Season 1-3, 29 Episodes',
    rating: 'TV-MA',
    tags: ['Dance', 'Game', 'Performance', 'Reality'],
    description:
      'Pulling directly from the underground ballroom community, voguing teams (aka "houses") must compete in unbelievable balls and showcase sickening fashion in order to achieve "legendary" status. The cast includes MC Dashaun Wesley and DJ MikeQ as well as celebrity judges Law Roach, Jameela Jamil, Leiomy Maldonado, and Megan Thee Stallion. From Scout Productions, Emmy Award winners David Collins (Queer Eye), Rob Eric (Queer Eye) and Michael Williams (Queer Eye) serve as executive producers. Jane Mun (People\'s Choice Awards, MTV Music Awards, America\'s Best Dance Crew) and Josh Greenberg (Lip Sync Battle, Sunday Best, America\'s Best Dance Crew) serve as executive producers and showrunners.',
  },
  [WATCH_SCHEDULE_TITLES.LIGA_MX]: {
    title: 'Liga MX',
    description:
      'Liga MX is the top professional football division in Mexico, in both male and female versions. 18 teams compete for the title, with two of the most traditional clubs - Santos Laguna and FC Juarez - regularly fighting for the top spots in the standings.',
  },
  [WATCH_SCHEDULE_TITLES.RAISED_BY_WOLVES]: {
    title: 'Raised by Wolves',
    year: '2020',
    seasonInfo: 'Season 1 & 2, 18 Episodes',
    rating: 'TV-MA',
    tags: ['Drama', 'Sci-Fi'],
    description:
      'A serialized sci-fi series from master storyteller and filmmaker Ridley Scott, Raised by Wolves centers upon two androids tasked with raising human children on a mysterious virgin planet. As the burgeoning colony of humans threatens to be torn apart by religious differences, the androids learn that controlling the beliefs of humans is a treacherous and difficult task.',
  },
  [WATCH_SCHEDULE_TITLES.THE_BACHELOR]: {
    title: 'The Bachelor',
    year: '2002',
    seasonInfo: 'Season 17 & 18, 28 Episodes',
    rating: 'TV-14',
    tags: ['Game', 'Reality', 'Romance'],
    description:
      "One lucky man gets the opportunity to find the woman of his dreams -- and hopefully his bride-to-be -- in this one-hour prime time reality series. The Bachelor embarks on a romantic journey meeting 25 women, then selecting 15 as potential mates. After getting to know each one, he continues to narrow the field, from 10 to 5, then 3, and ultimately, the 1 woman to whom he may propose marriage in the series' dramatic finale.\nThe show also takes an in-depth, behind-the-scenes look at the lives of each participant involved in this unique courtship. America's most eligible single man travels to exciting romantic locations with the ladies, introduces them to his closest friends and family and visits their hometowns to meet their parents. At the end of the journey, he will have had an unforgettable experience and, quite possibly, found true love. But the big mystery is: If he pops the question, will she accept?",
  },
  [WATCH_SCHEDULE_TITLES.THE_BACHELORETTE]: {
    title: 'The Bachelorette',
    year: '2003',
    seasonInfo: 'Season 9 & 17, 22 Episodes',
    rating: 'TV-14',
    tags: ['Reality', 'Romance'],
    description:
      "On ABC's hit primetime reality series The Bachelorette, one lucky woman is offered the chance to find true love. A single and eligible Bachelorette embarks on a romantic journey, getting to know a number of handsome men, gradually narrowing the field as she continues her search for her soul mate. At the end of this romantic voyage, if she has found the one, will there be a proposal — and will she say yes?",
  },
  [WATCH_SCHEDULE_TITLES.THE_NEVERS]: {
    title: 'The Nevers',
    year: '2021',
    seasonInfo: 'Season 1, 7 Episodes',
    rating: 'TV-MA',
    tags: ['Drama', 'Sci-Fi'],
    description:
      'In the last years of Victoria\'s reign, London is beset by the "Touched": people - mostly women - who suddenly manifest abnormal abilities - some charming, some very disturbing. Among them are Amalia True (Laura Donnelly), a mysterious, quick-fisted widow, and Penance Adair (Ann Skelly), a brilliant young inventor. They are the champions of this new underclass, making a home for the Touched, while fighting the forces of... well, pretty much all the forces - to make room for those whom history as we know it has no place.',
  },
  [WATCH_SCHEDULE_TITLES.THE_TIME_TRAVELER_S_WIFE]: {
    title: "The Time Traveler's Wife",
    year: '2022',
    seasonInfo: 'Season 1, 6 Episodes',
    rating: 'TV-MA',
    tags: ['Drama'],
    description:
      'The Time Traveler\'s Wife follows the spellbinding and intricately out-of-order love story between Clare Abshire (Rose Leslie) and Henry DeTamble (Theo James). At six years old, Clare meets Henry, the future love of her life - and who, as a time traveler, is actually visiting from the future. Fourteen years later, when a beautiful redhead wanders into the library where Henry works claiming not only to have known him all her life but to be his future wife, a magical romance ensues that is as sprawling and complicated as Henry\'s attempts to explain his "condition". Over six hourlong episodes, the genre-bending drama series expertly weaves themes of love, loss, marriage, and survival - in a story that defies the laws and logic of time.',
  },
  [WATCH_SCHEDULE_TITLES.WESTWORLD]: {
    title: 'Westworld',
    year: '2016',
    seasonInfo: 'Season 1-4, 36 Episodes',
    rating: 'TV-MA',
    tags: ['Action/Adventure', 'Drama', 'Mystery', 'Sci-Fi', 'Western'],
    description:
      'Westworld is an ambitious and highly imaginative drama series that elevates the concept of adventure and thrill-seeking to a new, ultimately dangerous level. In the futuristic fantasy park known as Westworld, a group of android "hosts" deviate from their programmers\' carefully planned scripts in a disturbing pattern of aberrant behavior.',
  },
};
