import { Question } from '../types/quiz';

/**
 * Costruisce quattro “domande” a partire da un set di domande esistenti.
 * @param correctQ  La domanda corretta (verrà usata come text dell’opzione giusta)
 * @param pool      Un array di domande da cui estrarre 3 distrattori
 */
export function buildReverseOptions(
  base: Question,
  pool: Question[]
): { prompt: string; options: string[]; correctIndex: number } {
  // ➊ il testo della risposta corretta
  const baseAnswer = base.options[base.correct];

  // ➋ distrattori: prendi 3 **domande** (question) dello stesso topic
  const sameTopicQs = pool.filter(q => q.topic === base.topic && q.id !== base.id);
  const distractors = sameTopicQs
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(q => q.question);

  // ➌ metto insieme 3 distrattori + la domanda vera
  const options = [...distractors, base.question].sort(() => Math.random() - 0.5);
  const correctIndex = options.indexOf(base.question);

  return { prompt: baseAnswer, options, correctIndex };
}