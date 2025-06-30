import { Question } from '../types/quiz';

/* Lista dei file */
const questionFiles = [
  'SQL.txt',
  'Statistica.txt',
  'Tableau.txt',
  'Databricks.txt',
  'DataLake2.txt',
  'Git.txt',
  'NoSQL.txt',
  'PowerBI.txt',
  'Python.txt',
  'R.txt',
  'ML.txt',
  'DeepLearning.txt',
];

/**
 * Carica tutte le domande.
 * Metti i file in  public/data/questions/<nome>.txt
 */
export async function loadQuestionsFromFiles(): Promise<Question[]> {
  const allQuestions: Question[] = [];

  // In dev = "/", in build = "/FinalQuiz/"
  const base = import.meta.env.BASE_URL;

  for (const file of questionFiles) {
    const url = `${base}data/questions/${file}`; // es. /FinalQuiz/data/questions/SQL.txt
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('Missing TXT:', file);
        continue;
      }
      const txt = await res.text();
      const topic = file.replace('.txt', '');
      allQuestions.push(...parseQuestionsFromText(txt, topic));
    } catch (err) {
      console.error('Fetch error', file, err);
    }
  }

  return allQuestions;
}

/* -------------------------------------------------------------- */
/* Parser                                                          */
/* -------------------------------------------------------------- */
function parseQuestionsFromText(src: string, rawTopic: string): Question[] {
  /* topic canonico: es. SQL → sql,  “PowerBI” → powerbi, …        */
  const topic = rawTopic.replace(/\s+/g, '').toLowerCase();

  const out: Question[] = [];
  const blocks = src
    .split(/\r?\n\s*\r?\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  blocks.forEach((block, i) => {
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 7) return;

    const [questionText, ...rest] = lines;
    const options = rest.slice(0, 4).map((l) => l.replace(/^[A-D]\)\s*/i, ''));
    const correctLine = rest.find((l) =>
      l.toLowerCase().startsWith('risposta corretta:'),
    );
    if (!correctLine) return;
    const letter = correctLine.split(':')[1].trim().toLowerCase();
    const correct = ['a', 'b', 'c', 'd'].indexOf(letter);
    if (correct === -1) return;

    const explanationLine = rest.find((l) =>
      l.toLowerCase().startsWith('spiegazione:'),
    );
    const explanation = explanationLine
      ? explanationLine.split(':').slice(1).join(':').trim()
      : '';

    out.push({
      id: `${topic}_${i + 1}`,       // id stabile & canonico
      question: questionText,
      options,
      correct,
      explanation,
      topic,                         // <- **canonico!**
    });
  });

  return out;
}