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
      `Hai risposto correttamente ad almeno ${thr} domande nel topic “${t.label}”. Badge ${LEVEL_SUFFIX[lvl]}.`,
  ),
);

const topicPrecisionBadges = TOPICS.flatMap(t =>
  makeTier(
    `pp_${t.id}`,
    t.emoji,
    `${t.label} Sharpshooter`,
    'topic_precision',
    // Nuovi threshold per precisione: 60%, 75%, 85%, 100%
    [60, 75, 85, 100],
    (thr, lvl) =>
      `Mantieni una precisione ≥${thr}% nel topic “${t.label}”. Badge ${LEVEL_SUFFIX[lvl]}.`,
  ),
);

/* ------------------------------------------------------------------ */
/*  GLOBAL BADGES (counters & streaks)                                */
/* ------------------------------------------------------------------ */
const globalCfg = [
  { id: 'quiz_rookie', emoji: '🎯', name: 'Quiz Rookie', thresholds: [5, 15, 30, 35] },
  { id: 'quiz_hero',   emoji: '🏆', name: 'Quiz Hero',   thresholds: [40, 50, 70, 85] },
  { id: 'quiz_legend', emoji: '👑', name: 'Quiz Legend', thresholds: [90, 120, 150, 200] },

  { id: 'on_fire',  emoji: '🔥',   name: 'On Fire',  thresholds: [5, 10, 15, 20] },
  { id: 'blazing',  emoji: '⚔️',  name: 'Blazing',   thresholds: [30, 35, 40, 45] },
  { id: 'inferno',  emoji: '🔥🔥', name: 'Inferno',   thresholds: [50, 60, 70, 75] },

  { id: 'sharp_eye', emoji: '👍', name: 'Sharp Eye', thresholds: [5,  15, 30, 35] },
  { id: 'sniper',    emoji: '🎯', name: 'Sniper',    thresholds: [40, 50, 70, 85] },
  { id: 'cerebro',   emoji: '🧠', name: 'Cerebro',   thresholds: [90, 120,150,200] },
];

const GLOBAL_DESC: Record<string, (thr: number | string, lvl: BadgeLevel) => string> = {
  quiz_rookie:  (thr, lvl) => `Completa almeno ${thr} quiz per ottenere il badge ${LEVEL_SUFFIX[lvl]}.`,
  quiz_hero:    (thr, lvl) => `Supera ${thr} quiz completati per sbloccare il badge ${LEVEL_SUFFIX[lvl]}.`,
  quiz_legend:  (thr, lvl) => `Porta a ${thr} il conteggio dei quiz completati per ricevere il badge ${LEVEL_SUFFIX[lvl]}.`,

  // streak-quiz basati su risposte consecutive
  on_fire:      (thr, lvl) => `Completa un quiz di tipo “Streak” con almeno ${thr} risposte corrette consecutive per ottenere il badge ${LEVEL_SUFFIX[lvl]}.`,
  blazing:      (thr, lvl) => `Raggiungi ${thr} risposte corrette di fila in un quiz Streak per guadagnare il badge ${LEVEL_SUFFIX[lvl]}.`,
  inferno:      (thr, lvl) => `Realizza almeno ${thr} risposte corrette consecutive in un quiz Streak per il badge ${LEVEL_SUFFIX[lvl]}.`,

  // quiz ≥80% (accuracy badges)
  sharp_eye:    (thr, lvl) => `Ottieni ${thr} quiz con punteggio ≥80% per ottenere il badge ${LEVEL_SUFFIX[lvl]}.`,
  sniper:       (thr, lvl) => `Completa ${thr} quiz con score ≥80% per raggiungere il badge ${LEVEL_SUFFIX[lvl]}.`,
  cerebro:      (thr, lvl) => `Raggiungi ${thr} quiz con performance ≥80% per il badge ${LEVEL_SUFFIX[lvl]}.`,

};

const globalBadges: Badge[] = globalCfg.flatMap(cfg =>
  makeTier(
    cfg.id,
    cfg.emoji,
    cfg.name,
    'global',
    cfg.thresholds,
    // usa la descrizione personalizzata o un fallback generico
    GLOBAL_DESC[cfg.id] ??
      ((thr, lvl) =>
        `Raggiungi ${thr} per ottenere il badge ${LEVEL_SUFFIX[lvl]}.`),
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
    ['8 topic con ≥50 risposte corrette', '9 topic con ≥50 risposte', '10 topic con ≥50 risposte', '11 topic con ≥50 risposte'],
    (thr, lvl) =>
      `Raggiungi ${thr} correttamente.` +
      ` Badge ${LEVEL_SUFFIX[lvl]}.`,
  ),
  ...makeTier(
    'all_rounder',
    '🧩',
    'All-Rounder',
    'combo',
    [
      '≥5 risposte corrette in ogni topic',
      '≥10 risposte corrette in ogni topic',
      '≥20 risposte corrette in ogni topic',
      '≥40 risposte corrette in ogni topic',
    ],
    (thr, lvl) =>
      `Rispondi correttamente ad almeno ${thr} in ogni topic per ottenere il badge ${LEVEL_SUFFIX[lvl]}.`,
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
];

/* ------------------------------------------------------------------ */
/*  SPEED & MARATHON                                                  */
/* ------------------------------------------------------------------ */
const SPEED_DESC: Record<string, (thr: number | string, lvl: BadgeLevel) => string> = {
  speed_run:  (thr, lvl) =>
    `Finisci un quiz in meno di ${String(thr).replace('<', '')} per ottenere il badge ${LEVEL_SUFFIX[lvl]}.`,
  warp:       (thr, lvl) =>
    `Finisci un quiz in meno di ${String(thr).replace('<', '')} per ottenere il badge ${LEVEL_SUFFIX[lvl]}.`,
  speed_demon: (thr, lvl) =>
    `Conserva almeno ${String(thr).replace('>', '')} di tempo rimanente per conquistare il badge ${LEVEL_SUFFIX[lvl]}.`,
  flash:      (thr, lvl) =>
    `Conserva almeno ${String(thr).replace('>', '')} di tempo rimanente per conquistare il badge ${LEVEL_SUFFIX[lvl]}.`,
};

const speedCfg = [
  // timeTaken più ampio
  { id: 'speed_run',   emoji: '⏱️', name: 'Speed Runner',  thresholds: ['<7 min', '<6 min', '<5 min', '<4 min'] },
  // timeTaken più ristretto
  { id: 'warp',        emoji: '🚀', name: 'Warp Drive',    thresholds: ['<5 min', '<4 min', '<3 min', '<2 min'] },
  // timeLeft più ristretto
  { id: 'speed_demon', emoji: '🏁', name: 'Speed Demon',   thresholds: ['>30 sec', '>50 sec', '>75 sec', '>100 sec'] },
  // timeLeft più ampio
  { id: 'flash', emoji: '⚡', name: 'Flash Learner', thresholds: ['>2 min', '>2.5 min', '>5 min', '>8 min'] },
];

const speedBadges: Badge[] = speedCfg.flatMap(cfg =>
  makeTier(
    cfg.id,
    cfg.emoji,
    cfg.name,
    'speed',
    cfg.thresholds,
    SPEED_DESC[cfg.id],
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
  { id: 'reverse_mast', emoji: '🔁', name: 'Reverse Master', thresholds: [5, 10, 20, 40] },
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
  name: 'Easter Mind',
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
