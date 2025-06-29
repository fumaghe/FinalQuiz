import { Badge, BadgeLevel } from '../types/quiz';

export const LEVELS: BadgeLevel[] = ['bronze', 'silver', 'gold', 'amethyst'];

export const tierColor: Record<BadgeLevel, string> = {
  bronze: 'ring-amber-600',
  silver: 'ring-gray-400',
  gold: 'ring-yellow-400',
  amethyst: 'ring-purple-500',
};

/* ------------------------------------------------------------------ */
/*  HELPERS                                                           */
/* ------------------------------------------------------------------ */
export type BadgeCategory =
  | 'topic_progress'
  | 'topic_precision'
  | 'global'
  | 'combo'
  | 'speed'
  | 'quiz_type';

const LEVEL_SUFFIX: Record<BadgeLevel, string> = {
  bronze: 'Bronzo',
  silver: 'Argento',
  gold: 'Oro',
  amethyst: 'Ametista',
};
const LEVEL_RARITY: Record<BadgeLevel, 'common' | 'rare' | 'epic' | 'legendary'> = {
  bronze: 'common',
  silver: 'rare',
  gold: 'epic',
  amethyst: 'legendary',
};

function makeTier(
  baseId: string,
  emoji: string,
  baseName: string,
  category: BadgeCategory,
  thresholds: (number | string)[],
  baseDesc: (thr: number | string, lvl: BadgeLevel) => string,
): Badge[] {
  return LEVELS.map((lvl, idx) => ({
    id: `${baseId}_${lvl}`,
    baseId,
    emoji,
    name: baseName,
    description: baseDesc(thresholds[idx], lvl),
    rarity: LEVEL_RARITY[lvl],
    level: lvl,
    category,
  }));
}

/* ------------------------------------------------------------------ */
/*  TOPIC BADGES                                                      */
/* ------------------------------------------------------------------ */
const TOPICS = [
  { id: 'sql',    label: 'SQL Master',  emoji: '🗄️', thresholds: [25, 50, 75, 100] },
  { id: 'stats',  label: 'Stats Nerd',  emoji: '📊', thresholds: [50, 100, 150, 192] },
  { id: 'viz',    label: 'Viz Artist',  emoji: '📈', thresholds: [25, 50, 75, 100] },
  { id: 'spark',  label: 'Spark Rider', emoji: '⚡', thresholds: [20, 45, 70, 91] },
  { id: 'lake',   label: 'Lake Diver',  emoji: '🏞️', thresholds: [10, 25, 40, 50] },
  { id: 'git',    label: 'Git Tamer',   emoji: '🔧', thresholds: [10, 25, 40, 50] },
  { id: 'nosql',  label: 'NoSQL Ninja', emoji: '🍃', thresholds: [25, 50, 75, 100] },
  { id: 'bi',     label: 'BI Maestro',  emoji: '📊', thresholds: [25, 50, 75, 100] },
  { id: 'python', label: 'Python Guru', emoji: '🐍', thresholds: [25, 50, 75, 99] },
  { id: 'r',      label: 'R Scientist', emoji: '📊', thresholds: [25, 50, 75, 100] },
  { id: 'ml',     label: 'ML Wizard',   emoji: '🤖', thresholds: [25, 50, 75, 100] },
  { id: 'dl',     label: 'DL Sage',     emoji: '🧠', thresholds: [25, 50, 75, 100] },
];

const topicProgressBadges = TOPICS.flatMap(t =>
  makeTier(
    `tp_${t.id}`,
    t.emoji,
    t.label,
    'topic_progress',
    t.thresholds,
    (thr, lvl) =>
      `Hai risposto correttamente ad almeno ${thr} domande nel topic “${t.label}”. ` +
      `Badge ${LEVEL_SUFFIX[lvl]}.`,
  ),
);

const topicPrecisionBadges = TOPICS.flatMap(t =>
  makeTier(
    `pp_${t.id}`,
    t.emoji,
    `${t.label} Sharpshooter`,
    'topic_precision',
    [25, 50, 75, 100],
    (_, lvl) => {
      const minPct = 70 + 10 * LEVELS.indexOf(lvl);
      return `Mantieni una precisione ≥${minPct}% nel topic “${t.label}”. ` +
             `Badge ${LEVEL_SUFFIX[lvl]}.`;
    },
  ),
);

/* ------------------------------------------------------------------ */
/*  GLOBAL BADGES (counters & streaks)                                */
/* ------------------------------------------------------------------ */
const globalCfg = [
  { id: 'quiz_rookie', emoji: '🎯', name: 'Quiz Rookie', thresholds: [10, 25, 50, 100] },
  { id: 'quiz_hero',   emoji: '🏆', name: 'Quiz Hero',   thresholds: [200, 300, 500, 750] },
  { id: 'quiz_legend', emoji: '👑', name: 'Quiz Legend', thresholds: [1000, 1500, 2000, 2500] },

  { id: 'on_fire', emoji: '🔥', name: 'On Fire',   thresholds: [10, 20, 35, 50] },
  { id: 'blazing', emoji: '⚔️', name: 'Blazing',   thresholds: [25, 40, 60, 80] },
  { id: 'inferno', emoji: '🔥🔥', name: 'Inferno', thresholds: [50, 75, 100, 150] },

  { id: 'sharp_eye', emoji: '👍', name: 'Sharp Eye', thresholds: [100, 200, 400, 600] },
  { id: 'sniper',    emoji: '🎯', name: 'Sniper',    thresholds: [250, 400, 600, 800] },
  { id: 'cerebro',   emoji: '🧠', name: 'Cerebro',   thresholds: [500, 700, 900, 1200] },

  { id: 'speed_run', emoji: '⏱️', name: 'Speed Runner', thresholds: ['<5 min', '<4 min', '<3 min', '<2 min'] },
  { id: 'warp',      emoji: '🚀', name: 'Warp Drive',   thresholds: ['<7 min', '<6 min', '<5 min', '<4 min'] },

  { id: 'perfect5',  emoji: '💎',  name: 'Perfect 5',  thresholds: [5, 10, 20, 40] },
  { id: 'perfect20', emoji: '💎💎',name: 'Perfect 20', thresholds: [20, 30, 50, 75] },

  { id: 'week',   emoji: '📅', name: 'Week-Streaker', thresholds: ['7 gg', '14 gg', '30 gg', '52 settimane'] },
  { id: 'morning',emoji: '🌅', name: 'Early Bird',    thresholds: [3, 7, 15, 30] },
  { id: 'night',  emoji: '🌙', name: 'Night Owl',     thresholds: [3, 7, 15, 30] },
  { id: 'retry',  emoji: '💪', name: 'Never Give Up', thresholds: ['max 3', 'max 2', 'max 1', 'perfect after fail'] },
];

const globalBadges: Badge[] = globalCfg.flatMap(cfg =>
  makeTier(
    cfg.id,
    cfg.emoji,
    cfg.name,
    'global',
    cfg.thresholds,
    (thr, lvl) =>
      `Raggiungi ${thr} in totale per ottenere il badge ${LEVEL_SUFFIX[lvl]}.` +
      ` Soglia cumulativa per tutte le sessioni di quiz.`,
  ),
);

/* ------------------------------------------------------------------ */
/*  COMBO BADGES                                                      */
/* ------------------------------------------------------------------ */
const comboBadges: Badge[] = [
  ...makeTier(
    'full_stack',
    '🛠️',
    'Full Stack',
    'combo',
    ['SQL+Git+Python', 'SQL+Git+Python', 'SQL+Git+Python', 'SQL+Git+Python'],
    (thr, lvl) =>
      `Completa quiz su SQL, Git e Python in una singola sessione.` +
      ` Ottieni il livello ${LEVEL_SUFFIX[lvl]}.`,
  ),
  ...makeTier(
    'analytics_trio',
    '📊',
    'Analytics Trio',
    'combo',
    ['Stats+Tableau+PowerBI', 'Stats+Tableau+PowerBI', 'Stats+Tableau+PowerBI', 'Stats+Tableau+PowerBI'],
    (thr, lvl) =>
      `Completa quiz su Stats, Tableau e PowerBI in una sessione.` +
      ` Livello ${LEVEL_SUFFIX[lvl]}.`,
  ),
  ...makeTier(
    'cloud_wrangler',
    '☁️',
    'Cloud Wrangler',
    'combo',
    ['Databricks+DataLake+NoSQL', 'Databricks+DataLake+NoSQL', 'Databricks+DataLake+NoSQL', 'Databricks+DataLake+NoSQL'],
    (thr, lvl) =>
      `Completa quiz su Databricks, DataLake e NoSQL.` +
      ` Badge ${LEVEL_SUFFIX[lvl]}.`,
  ),
  ...makeTier(
    'ai_visionary',
    '🤖',
    'AI Visionary',
    'combo',
    ['Python+ML+DL', 'Python+ML+DL', 'Python+ML+DL', 'Python+ML+DL'],
    (thr, lvl) =>
      `Completa quiz su Python, ML e DL.` +
      ` Ottieni ${LEVEL_SUFFIX[lvl]}.`,
  ),
  ...makeTier(
    'language_duelist',
    '⚔️',
    'Language Duelist',
    'combo',
    ['Python Bronzo + R Bronzo', 'Python Argento + R Argento', 'Python Oro + R Oro', 'Python Ametista + R Ametista'],
    (thr, lvl) =>
      `Raggiungi ${thr} nei topic Python e R.` +
      ` Livello ${LEVEL_SUFFIX[lvl]}.`,
  ),
  ...makeTier(
    'polyglot',
    '🪄',
    'Polyglot',
    'combo',
    ['5 topic a livello Bronze', '6 topic a livello Silver', '7 topic a livello Gold', '8 topic a livello Amethyst'],
    (thr, lvl) =>
      `Ottieni ${thr} in diversi topic.` +
      ` Livello ${LEVEL_SUFFIX[lvl]}.`,
  ),
  ...makeTier(
    'omniscient',
    '🌌',
    'Omniscient',
    'combo',
    ['8 topic con ≥50 risposte corrette', '9 topic con ≥75 risposte', '10 topic con ≥100 risposte', '12 topic con ≥150 risposte'],
    (thr, lvl) =>
      `Raggiungi ${thr} correttamente.` +
      ` Badge ${LEVEL_SUFFIX[lvl]}.`,
  ),
  ...makeTier(
    'all_rounder',
    '🧩',
    'All-Rounder',
    'combo',
    ['1 quiz completato in ogni topic', '2 quiz in ogni topic', '3 quiz in ogni topic', '5 quiz in ogni topic'],
    (thr, lvl) =>
      `Completa ${thr}.` +
      ` Livello ${LEVEL_SUFFIX[lvl]}.`,
  ),
  ...makeTier(
    'data_conqueror',
    '👑',
    'Data Conqueror',
    'combo',
    ['12 topic al livello Bronze', '12 topic al livello Silver', '12 topic al livello Gold', '12 topic al livello Amethyst'],
    (thr, lvl) =>
      `Conquista ${thr} in tutti i topic.` +
      ` Badge ${LEVEL_SUFFIX[lvl]}.`,
  ),
  ...makeTier(
    'data_emperor',
    '👑👑',
    'Data Emperor',
    'combo',
    ['12 topic al livello Gold', '12 topic al livello Amethyst', '12 topic Amethyst + stella', 'Tutti i topic Amethyst top'],
    (thr, lvl) =>
      `Diventa imperatore dei dati: ${thr}.` +
      ` Livello ${LEVEL_SUFFIX[lvl]}.`,
  ),
];

/* ------------------------------------------------------------------ */
/*  SPEED & MARATHON                                                  */
/* ------------------------------------------------------------------ */
const speedCfg = [
  { id: 'speed_demon', emoji: '🏁', name: 'Speed Demon', thresholds: ['< 2 min', '< 90 s', '< 60 s', '< 45 s'] },
  { id: 'marathon',    emoji: '🏃', name: 'Marathon Brain', thresholds: [200, 300, 400, 500] },
  { id: 'flash',       emoji: '⚡', name: 'Flash Learner', thresholds: ['30/10 min', '50/15', '75/20', '100/25'] },
];

const speedBadges: Badge[] = speedCfg.flatMap(cfg =>
  makeTier(
    cfg.id,
    cfg.emoji,
    cfg.name,
    'speed',
    cfg.thresholds,
    (thr, lvl) =>
      typeof thr === 'string'
        ? `Completa un quiz in meno di ${thr.replace('<', '')}.` +
          ` Livello ${LEVEL_SUFFIX[lvl]}.`
        : `Rispondi correttamente a ${thr} domande in una sessione.` +
          ` Ottieni ${LEVEL_SUFFIX[lvl]}.`,
  ),
);

/* ------------------------------------------------------------------ */
/*  QUIZ-TYPE BADGES                                                  */
/* ------------------------------------------------------------------ */
const typeCfg = [
  { id: 'general_run',  emoji: '🎲', name: 'General Run', thresholds: [5, 15, 30, 60] },
  { id: 'topic_tunnel', emoji: '🗂️', name: 'Topic Tunnel', thresholds: [3, 10, 25, 50] },
  { id: 'for_you',      emoji: '❤️', name: 'For-You Fanatic', thresholds: [3, 10, 25, 50] },
  { id: 'time_crusher', emoji: '⏱️', name: 'Time Crusher', thresholds: [3, 10, 25, 50] },
  { id: 'streak_surv',  emoji: '🔄', name: 'Streak Survivor', thresholds: [5, 10, 20, 40] },
  { id: 'reverse_mast', emoji: '🔁', name: 'Reverse Master', thresholds: ['≥70 %', '≥80 %', '≥90 %', '100 %'] },
];

const quizTypeBadges: Badge[] = typeCfg.flatMap(cfg =>
  makeTier(
    cfg.id,
    cfg.emoji,
    cfg.name,
    'quiz_type',
    cfg.thresholds,
    (thr, lvl) =>
      `Completa almeno ${thr} quiz di tipo "${cfg.name}".` +
      ` Ottieni ${LEVEL_SUFFIX[lvl]}.`,
  ),
);

/* ------------------------------------------------------------------ */
/*  EASTER EGG                                                         */
/* ------------------------------------------------------------------ */
const easterEgg: Badge = {
  id: 'easter_ghost',
  baseId: 'easter_ghost',
  emoji: '👻',
  name: 'Easter Mind (Ametista)',
  description: 'Hai scovato un badge segreto esplorando tutte le funzionalità! Continua così!',
  rarity: 'legendary',
  level: 'amethyst',
  category: 'global',
};

/* ------------------------------------------------------------------ */
/*  EXPORT                                                            */
/* ------------------------------------------------------------------ */
export const ALL_BADGES: Badge[] = [
  ...topicProgressBadges,
  ...topicPrecisionBadges,
  ...globalBadges,
  ...comboBadges,
  ...speedBadges,
  ...quizTypeBadges,
  easterEgg,
];
