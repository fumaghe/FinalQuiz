/* ------------------------------------------------------------------
   ACHIEVEMENTS 2.1  –  “🏆 I Miei Badge & Traguardi”
   ------------------------------------------------------------------ */

import React, {
  useMemo,
  useState,
  useCallback,
  Fragment,
  useRef,     
  useEffect,
} from 'react';
import {
  ArrowLeft,
  Search,
  X,
  Lock,
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounceValue } from 'usehooks-ts';

import { useQuiz } from '../contexts/QuizContext';
import { ALL_BADGES, LEVELS } from '../data/badges';
import { Badge } from '../types/quiz';

/* ------------------------------------------------------------------ */
/*  TIPI                                                               */
/* ------------------------------------------------------------------ */

/** Estende Badge con campi opzionali usati dal componente */
interface BadgeExtended extends Badge {
  /** obiettivo numerico del livello (facoltativo) */
  target?: number;
  /** progresso dell’utente verso l’obiettivo (facoltativo) */
  progress?: number;
}

/* ------------------------------------------------------------------ */
/*  COSTANTI E UTILITIES                                              */
/* ------------------------------------------------------------------ */

const LEVEL_ORDER = ['bronze', 'silver', 'gold', 'amethyst'] as const;
type Level = (typeof LEVEL_ORDER)[number];

const LEVEL_LABEL: Record<Level, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  amethyst: 'Amethyst',
};

const LEVEL_COLOR: Record<Level, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  amethyst: '#9966CC',
};

const LEVEL_IMG: Record<Level, string> = {
  bronze:   '/images/bronze.png',
  silver:   '/images/silver.png',
  gold:     '/images/gold.png',
  amethyst: '/images/amethyst.png',
};

/** sfondo progress ring via conic-gradient */
const radialProgress = (pct: number, color: string) =>
  `conic-gradient(${color} ${pct * 3.6}deg, theme('colors.apple-muted') ${pct *
    3.6}deg)`;

/* ------------------------------------------------------------------ */
/*  COMPONENTE PRINCIPALE                                             */
/* ------------------------------------------------------------------ */

interface Props {
  onNavigate: (screen: string) => void;
}

const AchievementsScreen: React.FC<Props> = ({ onNavigate }) => {
  /* --------------------------- stato globale --------------------- */
  const {
    state: {
      userStats: { unlockedBadges },
    },
    dispatch, 
  } = useQuiz();
  

    // ——————————————— SEQUENZA SEGRETA ————————————————
  const secret = Array.from('andreailmigliore');
  const posRef = useRef(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // solo quando sei nella schermata badge
      // (qui controlla il currentScreen o comunque la presenza di AchievementsScreen)
      // se usi state.currentScreen, sostituisci con il tuo flag di “schermata badge”
      // altrimenti, essendo dentro questo componente, va bene così:

      const key = e.key.toLowerCase();
      const expected = secret[posRef.current];

      if (key === expected) {
        posRef.current += 1;
        if (posRef.current === secret.length) {
          dispatch({ type: 'FOUND_EASTER_EGG' });
          posRef.current = 0;
        }
      } else {
        posRef.current = key === secret[0] ? 1 : 0;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  /* --------------------------- conteggi -------------------------- */
  const totalBadges = ALL_BADGES.length;
  const unlockedCount = unlockedBadges.length;

  /** # sbloccati per livello (bronze/silver/…) */
  const unlockedByLevel = useMemo(() => {
    const counts: Record<Level, number> = {
      bronze: 0,
      silver: 0,
      gold: 0,
      amethyst: 0,
    };
    unlockedBadges.forEach(id => {
      const lvl = id.slice(id.lastIndexOf('_') + 1) as Level;
      if (lvl in counts) counts[lvl]++;
    });
    return counts;
  }, [unlockedBadges]);

  /* --------------------------- filtri ---------------------------- */
  const [levelFilter, setLevelFilter] = useState<Level | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounceValue(search, 200);

  /* ---------------- calcolo miglior livello sbloccato ------------ */
  const highestUnlocked = useMemo(() => {
    const map = new Map<string, Level>();

    unlockedBadges.forEach(unlockedId => {
      // eccezione per l’Easter Egg
      if (unlockedId === 'easter_ghost') {
        map.set('easter_ghost', 'amethyst');
        return;
      }

      // per tutti gli altri badge, prendo baseId e level da ALL_BADGES
      const badgeDef = ALL_BADGES.find(b => b.id === unlockedId);
      if (!badgeDef) return;

      const { baseId, level } = badgeDef as { baseId: string; level: Level };
      const current = map.get(baseId);

      if (
        !current ||
        LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(current)
      ) {
        map.set(baseId, level);
      }
    });

    return map;
  }, [unlockedBadges]);

  /* ---------------- grouping per categoria ----------------------- */
  type Cat = Badge['category'];
  const grouped = useMemo(() => {
    const result: Record<Cat, { baseId: string; levels: BadgeExtended[] }[]> = {
      topic_progress: [],
      topic_precision: [],
      global: [],
      combo: [],
      speed: [],
      quiz_type: [],
    };

    (Object.keys(result) as Cat[]).forEach(cat => {
      const all = ALL_BADGES.filter(b => b.category === cat) as BadgeExtended[];
      const uniqueBases = Array.from(new Set(all.map(b => b.baseId)));
      result[cat] = uniqueBases.map(baseId => ({
        baseId,
        levels: all
          .filter(b => b.baseId === baseId)
          .sort(
            (a, b) =>
              LEVEL_ORDER.indexOf(a.level as Level) -
              LEVEL_ORDER.indexOf(b.level as Level),
          ),
      }));
    });
    return result;
  }, []);

  /* ---------------- stato modal ---------------------------------- */
  const [selected, setSelected] = useState<{
    baseId: string;
    levels: BadgeExtended[];
    userLvl?: Level;
  } | null>(null);

  /** livello attivo nella modal (per switch miniature) */
  const [activeModalLevel, setActiveModalLevel] = useState<Level | null>(null);

  /* reset/inizializzo livello attivo quando apro/chiudo la modal */
  useEffect(() => {
    if (selected) {
      setActiveModalLevel(selected.userLvl ?? 'bronze');
    } else {
      setActiveModalLevel(null);
    }
  }, [selected]);

  /* ---------------- render card ---------------------------------- */
  const renderCard = useCallback(
    (baseId: string, base: BadgeExtended, userLvl?: Level) => {
      const isUnlocked = !!userLvl;
      const pct =
        userLvl && LEVEL_ORDER.includes(userLvl)
          ? ((LEVEL_ORDER.indexOf(userLvl) + 1) / LEVEL_ORDER.length) * 100
          : 0;

      /* filtri */
      const showLevel = levelFilter === 'all' || userLvl === levelFilter;
      const showSearch =
        debouncedSearch.trim() === '' ||
        base.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      if (!showLevel || !showSearch) return null;

      /* card ---------------------------------------------------------------- */
      return (
        <motion.button
          key={baseId}
          layout
          whileHover={{ y: -6, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          onClick={() =>
            setSelected({
              baseId,
              levels:
                grouped[base.category].find(g => g.baseId === baseId)!.levels,
              userLvl,
            })
          }
          className="relative flex flex-col items-center gap-3 p-4 rounded-2xl bg-white shadow 
                     hover:ring-1 hover:ring-apple-blue/30 transition
                     sm:w-full"
          style={{
            filter: isUnlocked ? 'none' : 'grayscale(1)',
            opacity: isUnlocked ? 1 : 0.3,
          }}
        >
          {/* illustrazione di livello */}
          <div className="w-full aspect-square relative">
            <img
              src={LEVEL_IMG[userLvl ?? 'bronze']}
              alt={`${LEVEL_LABEL[userLvl ?? 'bronze']} illustration`}
              className="object-contain object-center w-full h-full rounded-full"
            />

            {/* ring di progresso */}
            {isUnlocked && (
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: radialProgress(pct, LEVEL_COLOR[userLvl!]) }}
              />
            )}

            {/* emoji */}
            <span className="absolute inset-0 grid place-content-center 
                          text-4xl  
                          sm:text-5xl 
                          md:text-6xl 
                          lg:text-7xl ">
              {base.emoji}
            </span>

            {/* lucchetto */}
            {!isUnlocked && (
              <Lock className="absolute inset-0 m-auto w-8 h-8 text-white/90 drop-shadow" />
            )}
          </div>

          {/* nome badge */}
          <p className="text-center font-semibold text-[18px] leading-tight line-clamp-2">
            {base.name}
          </p>
        </motion.button>
      );
    },
    [levelFilter, debouncedSearch, grouped],
  );

  /* ---------------------------------------------------------------- */
  /*  RENDER                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 
                    dark:from-apple-dark dark:via-apple-dark/80 dark:to-apple-dark text-apple-primary">
      {/* ---------------- HEADER ---------------------------------- */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-apple-dark/80 
                         backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
          {/* titolo + back */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5 text-apple-blue" />
            </button>

            <div>
              <h1 className="text-xl font-bold">🏆 I Miei Badge & Traguardi</h1>
              <p className="text-sm text-apple-secondary flex flex-wrap items-center gap-1">
                
                <span className="px-2 py-0.5 rounded-full bg-apple-muted text-apple-primary text-xs font-semibold">
                  {unlockedCount}/{totalBadges}
                </span>
              </p>
            </div>
          </div>

          {/* filtri + search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* pillole livello  (scrollabile su mobile) */}
            <div className="flex flex-nowrap gap-2 overflow-x-auto overscroll-x-contain pb-1">
              {(['all', ...LEVELS] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLevelFilter(l as any)}
                  className={`px-3 py-1 shrink-0 rounded-full text-xs font-medium border transition
                    ${
                      levelFilter === l
                        ? 'bg-apple-blue text-white border-apple-blue shadow-sm'
                        : 'border-apple-muted text-apple-secondary hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  {l === 'all'
                    ? `Tutti i livelli (${unlockedCount})`
                    : `${LEVEL_LABEL[l as Level]} (${unlockedByLevel[l as Level]})`}
                </button>
              ))}
            </div>

            {/* search */}
            <div className="relative flex-1 sm:max-w-xs justify-end">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-secondary" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cerca per nome o categoria…"
                className="w-full pl-9 pr-9 py-2 rounded-lg bg-white dark:bg-apple-card border 
                           border-apple-muted placeholder:text-apple-secondary focus:outline-none
                           focus:ring-2 focus:ring-apple-blue/50"
              />
              {search && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-secondary"
                  onClick={() => setSearch('')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ---------------- GRID ------------------------------------ */}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {(Object.keys(grouped) as Cat[]).map(cat => {
          const items = grouped[cat].map(({ baseId, levels }) => {
            const base = levels[0];
            return {
              baseId,
              base,
              userLvl: highestUnlocked.get(baseId),
            };
          });

          /* applico nuovamente i filtri per evitare heading vuoti */
          const rendered = items
            .map(({ baseId, base, userLvl }) => renderCard(baseId, base, userLvl))
            .filter(Boolean);

          if (rendered.length === 0) return null;

          return (
            <section key={cat} className="space-y-6">
              <h2 className="text-lg font-semibold border-b border-apple-muted pb-1 sticky -top-0.5
                             bg-white/70 dark:bg-apple-dark/70 backdrop-blur-md z-10">
                {CAT_LABEL_IT[cat]}
              </h2>

              <div
                className="grid gap-8
                           lg:grid-cols-6
                           md:grid-cols-5
                           sm:grid-cols-4
                           grid-cols-3"
              >
                <AnimatePresence initial={false}>{rendered}</AnimatePresence>
              </div>
            </section>
          );
        })}
      </main>

      {/* ---------------- MODAL DETTAGLIO -------------------------- */}
      <Transition.Root show={!!selected} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-[100]"
          onClose={() => setSelected(null)}
        >
          {/* overlay */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          {/* pannello centrale */}
          <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white dark:bg-apple-card p-8 sm:p-10 space-y-8 shadow-xl">
                {selected && activeModalLevel && (
                  <>
                    {/* header modal */}
                    <div className="flex items-center gap-4">
                      <img
                        src={LEVEL_IMG[selected.userLvl ?? 'bronze']}
                        alt=""
                        className="w-16 h-16 rounded-full ring-4 ring-white dark:ring-apple-dark"
                      />
                      <div className="flex-1">
                        <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                          {selected.levels[0].emoji}{' '}
                          {selected.levels[0].name}
                        </Dialog.Title>
                        <p className="text-sm text-apple-secondary">
                          {
                            CAT_LABEL_IT[
                              selected.levels[0].category as Badge['category']
                            ]
                          }
                        </p>
                      </div>
                    </div>

                    {/* miniature livelli */}
                    <div className="flex items-center justify-between gap-3">
                      {LEVEL_ORDER.map(level => {
                        const lvlData = selected.levels.find(
                          l => l.level === level,
                        )!;
                        const isActive = activeModalLevel === level;
                        const idxCurrent = selected.userLvl
                          ? LEVEL_ORDER.indexOf(selected.userLvl)
                          : -1;
                        const idx = LEVEL_ORDER.indexOf(level);
                        const isReached = idx <= idxCurrent;
                        /** progress ring per miniatura (100 se raggiunto, 0 altrimenti) */
                        const pctMini = isReached ? 100 : 0;

                        return (
                          <button
                            key={level}
                            aria-label={`Livello ${LEVEL_LABEL[level]}`}
                            aria-selected={isActive}
                            onClick={() => setActiveModalLevel(level)}
                            className="relative shrink-0 focus:outline-none"
                          >
                            {/* ring di progresso mini */}
                            <div
                              className="absolute inset-0 rounded-full pointer-events-none"
                              style={{
                                background: radialProgress(
                                  pctMini,
                                  '#0066FF',
                                ),
                              }}
                            />
                            {/* foto livello */}
                            <img
                              src={LEVEL_IMG[level]}
                              alt={LEVEL_LABEL[level]}
                              className="w-16 h-16 object-contain rounded-full
                                         border transition
                                         hover:scale-105"
                              style={{
                                borderWidth: isActive ? 4 : 1,
                                borderColor: isActive
                                  ? LEVEL_COLOR[level]
                                  : '#D1D5DB',
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* progresso livello selezionato */}
                    {(() => {
                      const lvlData = selected.levels.find(
                        l => l.level === activeModalLevel,
                      ) as BadgeExtended;
                      const idxCurrent = selected.userLvl
                        ? LEVEL_ORDER.indexOf(selected.userLvl)
                        : -1;
                      const idxActive = LEVEL_ORDER.indexOf(activeModalLevel);
                      const isReached = idxActive <= idxCurrent;
                      const pctLarge = isReached
                        ? 100
                        : idxActive === idxCurrent + 1
                        ? Math.round(
                            ((idxCurrent + 1) / selected.levels.length) * 100,
                          )
                        : 0;

                      return (
                        <div className="space-y-4">
                          {/* ring grande */}
                          <div
                            className="relative w-[108px] h-[108px] mx-auto"
                            role="progressbar"
                            aria-valuenow={pctLarge}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="absolute inset-0 rounded-full"
                              style={{
                                background: radialProgress(
                                  pctLarge,
                                  '#0066FF',
                                ),
                              }}
                            />
                            <img
                              src={LEVEL_IMG[activeModalLevel]}
                              alt={LEVEL_LABEL[activeModalLevel]}
                              className="absolute inset-1 w-[96px] h-[96px] m-auto rounded-full object-contain"
                            />
                          </div>

                          {/* testo progresso */}
                          <div className="space-y-1">
                            <p className="text-[16px] font-medium">
                              Progresso verso{' '}
                              {LEVEL_LABEL[activeModalLevel]}
                            </p>
                            {/* barra orizzontale di appoggio */}
                            <div className="w-full h-[10px] rounded-full bg-apple-muted overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pctLarge}%` }}
                                transition={{
                                  duration: 0.4,
                                  ease: 'easeOut',
                                }}
                                className="h-full bg-apple-blue"
                              />
                            </div>

                            {/* mostra target/progress se definiti */}
                            {'target' in lvlData && (
                              <p className="text-sm">
                                {(lvlData.progress ?? 0).toLocaleString()} /{' '}
                                {(lvlData.target ?? 0).toLocaleString()}
                              </p>
                            )}
                          </div>

                          {/* descrizione livello */}
                          <p className="text-[16px] text-[#333]">
                            {lvlData.description}
                          </p>
                        </div>
                      );
                    })()}

                    {/* footer */}
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
                      <button
                        onClick={() => setSelected(null)}
                        className="w-full sm:w-auto px-5 py-2 rounded-lg bg-apple-muted hover:bg-apple-muted/70 text-sm"
                      >
                        Chiudi
                      </button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  LABEL CATEGORIE (IT)                                              */
/* ------------------------------------------------------------------ */
const CAT_LABEL_IT: Record<Badge['category'], string> = {
  topic_progress: 'Progressione argomento',
  topic_precision: 'Precisione argomento',
  global: 'Globali & speciali',
  combo: 'Combo / inter-topic',
  speed: 'Velocità & maratona',
  quiz_type: 'Tipologia di quiz',
};

export default AchievementsScreen;
