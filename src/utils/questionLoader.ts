import { Question } from '../types/quiz';

/* Lista dei file di testo con le domande */
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
 * Carica e unisce tutte le domande.
 * Each txt file deve trovarsi in  public/data/questions/<fileName>
 */
export async function loadQuestionsFromFiles(): Promise<Question[]> {
  const allQuestions: Question[] = [];
  const base = import.meta.env.BASE_URL; // "/" in dev, "/FinalQuiz/" in prod

  for (const fileName of questionFiles) {
    try {
      const url = `${base}data/questions/${fileName}`; // -> es. /FinalQuiz/data/questions/SQL.txt
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`Could not load questions from ${fileName}`);
        continue;
      }

      const content = await response.text();
      const topic = fileName.replace('.txt', '');
      const questions = parseQuestionsFromText(content, topic);

      console.log(`Loaded ${questions.length} questions for topic ${topic}`);
      allQuestions.push(...questions);
    } catch (error) {
      console.error(`Error loading questions from ${fileName}:`, error);
    }
  }

  return allQuestions;
}

/* ------------------------------------------------------------------ */
/* Helper: converte un file di testo in array di Question              */
/* ------------------------------------------------------------------ */
function parseQuestionsFromText(content: string, topic: string): Question[] {
  const questions: Question[] = [];

  // divide in blocchi separati da una o più righe vuote
  const blocks = content
    .split(/\r?\n\s*\r?\n+/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  blocks.forEach((block, idx) => {
    const lines = block
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 7) return; // domanda, 4 opzioni, risposta, spiegazione

    const questionText = lines[0];               // prima riga = domanda
    const options = lines.slice(1, 5).map((l) => // righe 1-4 = opzioni
      l.replace(/^[A-D]\)\s*/i, '').trim(),
    );

    const correctLine = lines.find((l) =>
      l.toLowerCase().startsWith('risposta corretta:'),
    );
    if (!correctLine) return;
    const letter = correctLine.split(':')[1].trim().toLowerCase();
    const correctIndex = ['a', 'b', 'c', 'd'].indexOf(letter);
    if (correctIndex === -1) return;

    const explanationLine = lines.find((l) =>
      l.toLowerCase().startsWith('spiegazione:'),
    );
    const explanation = explanationLine
      ? explanationLine.split(':').slice(1).join(':').trim()
      : '';

    questions.push({
      id: `${topic.toLowerCase()}_${idx + 1}`,
      question: questionText,
      options,
      correct: correctIndex,
      explanation,
      topic,
    });
  });

  return questions;
}
