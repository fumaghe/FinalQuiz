import React, {
  useMemo,
  useState,
  useCallback,
  Fragment,
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
import { Badge, BadgeLevel } from '../types/quiz';

/* ------------------------------------------------------------------ */
/*  COSTANTI E UTILITIES                                              */
/* ------------------------------------------------------------------ */

const LEVEL_ORDER: BadgeLevel[] = ['bronze', 'silver', 'gold', 'amethyst'];
const LEVEL_LABEL: Record<BadgeLevel, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  amethyst: 'Amethyst',
};
const LEVEL_COLOR: Record<BadgeLevel, string> = {
  bronze: '#d6a26e',
  silver: '#b9bec8',
  gold: '#ffd700',
  amethyst: '#a855f7',
};
const tierBg: Record<BadgeLevel, string> = {
  bronze:   'bg-amber-500 dark:bg-amber-900/40',
  silver:   'bg-gray-400  dark:bg-gray-700/40',
  gold:     'bg-yellow-300 dark:bg-yellow-900/40',
  amethyst: 'bg-purple-500 dark:bg-purple-900/40',
};

const CAT_LABEL = {
  topic_progress: 'Progressione per Argomento',
  topic_precision: 'Precisione per Argomento',
  global: 'Globali & Speciali',
  combo: 'Combo / Inter-Topic',
  speed: 'Velocità & Maratona',
  quiz_type: 'Tipologia di Quiz',
} as const;

/* Ring via conic-gradient */
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
  const {
    state: {
      userStats: { unlockedBadges },
    },
  } = useQuiz();

  /* --------------------------- filtri ---------------------------- */
  const [viewFilter, setViewFilter] = useState<'all' | 'unlocked' | 'locked'>(
    'all',
  );
  const [levelFilter, setLevelFilter] = useState<BadgeLevel | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounceValue(search, 200);

  /* ---------------- calcolo badge sbloccati ---------------------- */
  const highestUnlocked = useMemo(() => {
    const map = new Map<string, BadgeLevel>();
    unlockedBadges.forEach(id => {
      const idx = id.lastIndexOf('_');
      const baseId = id.slice(0, idx);
      const lvl = id.slice(idx + 1) as BadgeLevel;
      if (
        !map.has(baseId) ||
        LEVEL_ORDER.indexOf(lvl) > LEVEL_ORDER.indexOf(map.get(baseId)!)
      ) {
        map.set(baseId, lvl);
      }
    });
    return map;
  }, [unlockedBadges]);

  /* ---------------- grouping per categoria ----------------------- */
  const grouped = useMemo(() => {
    type Cat = keyof typeof CAT_LABEL;
    const result: Record<Cat, { baseId: string; levels: Badge[] }[]> = {
      topic_progress: [],
      topic_precision: [],
      global: [],
      combo: [],
      speed: [],
      quiz_type: [],
    };

    (Object.keys(result) as Cat[]).forEach(cat => {
      const all = ALL_BADGES.filter(b => b.category === cat);
      const uniqueBases = Array.from(new Set(all.map(b => b.baseId)));
      result[cat] = uniqueBases.map(baseId => ({
        baseId,
        levels: all
          .filter(b => b.baseId === baseId)
          .sort(
            (a, b) =>
              LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level),
          ),
      }));
    });
    return result;
  }, []);

  /* ---------------- render card badge --------------------------- */
  const [selected, setSelected] = useState<{
    baseId: string;
    levels: Badge[];
    userLvl?: BadgeLevel;
  } | null>(null);

  const renderCard = useCallback(
    (baseId: string, base: Badge, userLvl?: BadgeLevel) => {
      const isUnlocked = !!userLvl;
      const pct =
        userLvl && LEVEL_ORDER.includes(userLvl)
          ? ((LEVEL_ORDER.indexOf(userLvl) + 1) / LEVEL_ORDER.length) * 100
          : 0;

      /* filtri */
      const showView =
        viewFilter === 'all' ||
        (viewFilter === 'unlocked' && isUnlocked) ||
        (viewFilter === 'locked' && !isUnlocked);
      const showLevel = levelFilter === 'all' || userLvl === levelFilter;
      const showSearch =
        debouncedSearch.trim() === '' ||
        base.name.toLowerCase().includes(debouncedSearch.toLowerCase());

      if (!showView || !showLevel || !showSearch) return null;

      return (
        <motion.div
          key={baseId}
          layout
          whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          onClick={() =>
            setSelected({
              baseId,
              levels:
                grouped[base.category as keyof typeof CAT_LABEL].find(
                  g => g.baseId === baseId,
                )!.levels,
              userLvl,
            })
          }
          className={`relative cursor-pointer p-3 rounded-2xl flex flex-col items-center text-center select-none transition
            ${
              isUnlocked
                ? `${tierBg[userLvl!]} border border-white/30 shadow-inner`
                : 'bg-apple-card/80 opacity-80'
            }`}
        >
          {/* ring */}
          <div
            className="w-14 h-14 rounded-full grid place-content-center"
            style={{
              backgroundImage: isUnlocked
                ? radialProgress(pct, LEVEL_COLOR[userLvl!])
                : 'none',
            }}
          >
            <span className="text-3xl">{base.emoji}</span>
          </div>

          <p className="mt-1 text-xs font-semibold line-clamp-2">{base.name}</p>

          {/* overlay locked */}
          {!isUnlocked && (
            <div className="absolute inset-0 rounded-2xl bg-black/30 backdrop-blur-sm grid place-content-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          )}
        </motion.div>
      );
    },
    [viewFilter, levelFilter, debouncedSearch, grouped],
  );

  /* ---------------------------------------------------------------- */
  /*  RENDER                                                          */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-apple-light dark:bg-apple-dark text-apple-primary">
      {/* ---------------- TOP BAR ---------------------------------- */}
      <header className="sticky top-0 z-40 bg-apple-card/60 backdrop-blur-md border-b border-apple-muted px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 -ml-2 rounded-full hover:bg-apple-light"
          >
            <ArrowLeft className="w-5 h-5 text-apple-blue" />
          </button>

          <h1 className="text-lg font-semibold flex-1">
            🏆 Badge&nbsp;&amp;&nbsp;Obiettivi
          </h1>

        </div>

        {/* second row: chip livelli + search (responsive) */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* chip livelli */}
          <div className="flex flex-wrap gap-1">
            {(['all', ...LEVELS] as const).map(l => (
              <button
                key={l}
                onClick={() => setLevelFilter(l as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                  levelFilter === l
                    ? 'bg-apple-blue text-white border-apple-blue'
                    : 'border-apple-muted text-apple-secondary hover:bg-apple-card'
                }`}
              >
                {l === 'all' ? 'Livello: tutti' : LEVEL_LABEL[l as BadgeLevel]}
              </button>
            ))}
          </div>

          {/* search bar */}
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-secondary" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder='Cerca "SQL", "ML", …'
              className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-apple-card border border-apple-muted placeholder:text-apple-secondary focus:outline-none focus:ring-2 focus:ring-apple-blue/50"
            />
            {search && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-apple-secondary"
                onClick={() => setSearch('')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- GRID SECTIONS ---------------------------- */}
      <main className="p-4 pb-28 space-y-12">
        {(Object.keys(grouped) as (keyof typeof CAT_LABEL)[]).map(cat => {
          const items = grouped[cat].map(({ baseId, levels }) => {
            // base = livello 0 (Bronze) per nome/emoji coerenti
            const base = levels[0];
            return { baseId, base, levels, userLvl: highestUnlocked.get(baseId) };
          });

          const rendered = items
            .map(({ baseId, base, userLvl }) => renderCard(baseId, base, userLvl))
            .filter(Boolean);

          if (rendered.length === 0) return null;

          return (
            <section key={cat} className="space-y-4">
              {/* titolo sticky */}
              <motion.h2
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
                transition={{ duration: 0.4 }}
                className="sticky -top-0.5 bg-apple-light/80 dark:bg-apple-dark/80 backdrop-blur-md z-20 py-1 font-semibold text-base border-b border-apple-muted"
              >
                {CAT_LABEL[cat]}
              </motion.h2>

              {/* griglia badge */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
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

          {/* pannello */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-2xl bg-apple-card p-6 space-y-4 shadow-xl">
                {selected && (
                  <>
                    {/* header */}
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">
                        {selected.levels[0].emoji}
                      </span>
                      <div>
                        <Dialog.Title className="text-lg font-bold">
                          {selected.levels[0].name}
                        </Dialog.Title>
                        <p className="text-sm text-apple-secondary mt-0.5">
                          Categoria:&nbsp;
                          <span className="font-medium uppercase">
                            {selected.levels[0].category.replace('_', ' ')}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* livelli */}
                    <div className="flex items-center justify-between gap-3">
                      {selected.levels.map(lvl => {
                        const isReached =
                          selected.userLvl &&
                          LEVEL_ORDER.indexOf(lvl.level) <=
                            LEVEL_ORDER.indexOf(selected.userLvl);
                        return (
                          <div
                            key={lvl.level}
                            className={`flex-1 py-2 rounded-lg grid place-content-center text-xs font-medium
                              ${
                                isReached
                                  ? 'bg-apple-blue/10 border border-apple-blue text-apple-blue'
                                  : 'bg-apple-muted text-apple-secondary'
                              }`}
                          >
                            {LEVEL_LABEL[lvl.level as BadgeLevel]}
                          </div>
                        );
                      })}
                    </div>

                    {/* progress bar + descrizione prossimo livello */}
                    {(() => {
                      const idxCurrent = selected.userLvl
                        ? LEVEL_ORDER.indexOf(selected.userLvl)
                        : -1;
                      const nextBadge =
                        selected.levels[idxCurrent + 1] ??
                        selected.levels[selected.levels.length - 1];

                      return (
                        <>
                          <div className="space-y-1">
                            <p className="text-sm">
                              Progresso verso&nbsp;
                              <span className="font-medium">
                                {LEVEL_LABEL[nextBadge.level as BadgeLevel]}
                              </span>
                            </p>
                            <div className="w-full h-3 rounded-full bg-apple-muted overflow-hidden">
                              <div
                                className="h-full bg-apple-blue transition-all"
                                style={{
                                  width: `${
                                    ((idxCurrent + 1) / LEVEL_ORDER.length) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>

                          <p className="text-sm mt-2 italic">
                            Obiettivo: {nextBadge.description}
                          </p>
                        </>
                      );
                    })()}

                    <button
                      onClick={() => setSelected(null)}
                      className="w-full py-2 rounded-lg mt-3 bg-apple-muted hover:bg-apple-muted/60 transition text-sm"
                    >
                      Chiudi
                    </button>
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

export default AchievementsScreen;
