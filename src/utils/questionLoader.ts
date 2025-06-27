import { Question } from '../types/quiz';

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
  'DeepLearning.txt'
];

export async function loadQuestionsFromFiles(): Promise<Question[]> {
  const allQuestions: Question[] = [];

  for (const fileName of questionFiles) {
    try {
      const response = await fetch(`/data/questions/${fileName}`);
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

function parseQuestionsFromText(content: string, topic: string): Question[] {
  const questions: Question[] = [];
  // Split on one or more blank lines (handles LF, CRLF, spaces)
  const blocks = content
    .split(/\r?\n\s*\r?\n+/)
    .map(block => block.trim())
    .filter(block => block.length > 0);

  blocks.forEach((block, idx) => {
    const lines = block
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length < 7) {
      // Need at least: question + 4 options + correct + explanation
      return;
    }

    const questionText = lines[0];

    // Options are expected in lines 1–4 as "A) ...", "B) ...", etc.
    const options = lines.slice(1, 5).map(line => {
      // remove leading "A) ", "B) ", etc.
      const match = line.match(/^[A-D]\)\s*(.*)$/i);
      return match ? match[1].trim() : line;
    });

    // Find the correct answer line
    const correctLine = lines.find(line => line.toLowerCase().startsWith('risposta corretta:'));
    if (!correctLine) return;
    const letter = correctLine.split(':')[1].trim().toLowerCase();
    const correctIndex = ['a', 'b', 'c', 'd'].indexOf(letter);
    if (correctIndex === -1) return;

    // Find explanation
    const explanationLine = lines.find(line => line.toLowerCase().startsWith('spiegazione:'));
    const explanation = explanationLine
      ? explanationLine.split(':').slice(1).join(':').trim()
      : '';

    questions.push({
      id: `${topic.toLowerCase()}_${idx + 1}`,
      question: questionText,
      options,
      correct: correctIndex,
      explanation,
      topic
    });
  });

  return questions;
}
