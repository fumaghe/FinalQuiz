
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
      const questions = parseQuestionsFromText(content, fileName.replace('.txt', ''));
      allQuestions.push(...questions);
    } catch (error) {
      console.error(`Error loading questions from ${fileName}:`, error);
    }
  }
  
  return allQuestions;
}

function parseQuestionsFromText(content: string, topic: string): Question[] {
  const questions: Question[] = [];
  const questionBlocks = content.trim().split('\n\n').filter(block => block.trim());
  
  for (let i = 0; i < questionBlocks.length; i++) {
    try {
      const block = questionBlocks[i].trim();
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      
      if (lines.length < 7) continue; // Should have question + 4 options + correct + explanation
      
      const questionText = lines[0];
      const options = lines.slice(1, 5).map(line => line.substring(3)); // Remove "A) ", "B) ", etc.
      
      // Find correct answer line
      const correctLine = lines.find(line => line.startsWith('Risposta Corretta:'));
      if (!correctLine) continue;
      
      const correctLetter = correctLine.split(':')[1].trim().toLowerCase();
      const correctIndex = ['a', 'b', 'c', 'd'].indexOf(correctLetter);
      if (correctIndex === -1) continue;
      
      // Find explanation line
      const explanationLine = lines.find(line => line.startsWith('Spiegazione:'));
      const explanation = explanationLine ? explanationLine.split(':').slice(1).join(':').trim() : '';
      
      questions.push({
        id: `${topic.toLowerCase()}_${i + 1}`,
        question: questionText,
        options,
        correct: correctIndex,
        explanation,
        topic
      });
    } catch (error) {
      console.error(`Error parsing question block ${i + 1} in ${topic}:`, error);
    }
  }
  
  return questions;
}
