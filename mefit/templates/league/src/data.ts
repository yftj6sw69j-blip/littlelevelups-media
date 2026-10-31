export type Entry = {name: string; workouts: number};
export type LeagueData = {
  week: number; // week number of the challenge (1-4)
  daysLeft: number; // days left until the deadline
  teamTotal: number; // total workouts across everyone
  climber?: {name: string; gain: number} | null; // biggest weekly climber
  entries: Entry[]; // anyone with 0 is left out before passing in
  title?: string; // default NOVEMBER GRIND
  season?: string; // default MEFIT LEAGUE · SEASON 1
  footer?: string; // default Most workouts by 1 Dec wins
  music?: string; // file in public/, e.g. bed.wav
  label?: string; // replaces 'Week N' in the eyebrow, e.g. 'Final standings'
  rollText?: string; // drumroll text before #1, default 'And top of the league…'
};

export type Ranked = Entry & {rank: number};

// Highest first; equal scores share a rank (1, 2, 2, 4...).
export const rankEntries = (entries: Entry[]): Ranked[] => {
  const sorted = [...entries]
    .filter((e) => e.workouts > 0)
    .sort((a, b) => b.workouts - a.workouts || a.name.localeCompare(b.name));
  let lastScore = -1;
  let lastRank = 0;
  return sorted.map((e, i) => {
    const rank = e.workouts === lastScore ? lastRank : i + 1;
    lastScore = e.workouts;
    lastRank = rank;
    return {...e, rank};
  });
};

export const sample: LeagueData = {
  week: 2,
  daysLeft: 22,
  teamTotal: 96,
  climber: {name: 'Jess', gain: 5},
  music: 'bed.wav',
  entries: [
    {name: 'Sophie', workouts: 9},
    {name: 'Dan', workouts: 8},
    {name: 'Jess', workouts: 8},
    {name: 'Kerry', workouts: 7},
    {name: 'Mark', workouts: 6},
    {name: 'Laura', workouts: 6},
    {name: 'Becky', workouts: 5},
    {name: 'Tom', workouts: 5},
    {name: 'Nat', workouts: 4},
    {name: 'Gemma', workouts: 4},
    {name: 'Rich', workouts: 3},
    {name: 'Claire', workouts: 3},
    {name: 'Hayley', workouts: 2},
    {name: 'Steve', workouts: 2},
    {name: 'Amy', workouts: 1},
  ],
};

export const C = {
  bg: '#06070C',
  text: '#F4F2EE',
  cyan: '#43D9FF',
  violet: '#7C3DFF',
  purple: '#B845FF',
  grad: 'linear-gradient(90deg,#43D9FF,#7C3DFF 60%,#B845FF)',
  medal: ['#F5C76B', '#D9DEE6', '#E09A6A'],
};
