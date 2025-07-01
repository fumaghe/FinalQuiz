// src/components/CupPointsPopup.tsx
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

/** mapping già definito nel Dashboard */
const QUIZ_TYPE_MULT: Record<string, number> = {
  general: 1.3,
  topic:   1.1,
  forYou:  1.5,
  timed:   1.7,
  streak:  1.3,
  reverse: 1.15,
};

interface Props {
  points: number;
  delta: number;
}

const CupPointsPopup: React.FC<Props> = ({ points, delta }) => (
  <AlertDialog>
    {/* ---------- TRIGGER: area coppe cliccabile ---------- */}
    <AlertDialogTrigger asChild>
      <button className="flex items-center space-x-1 focus:outline-none">
        <span className="text-lg">🏆</span>
        <span className="text-body font-medium">{points}</span>
        {delta !== 0 && (
          <span
            className={`text-sm font-medium ${
              delta >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {delta >= 0 ? `+${delta}` : delta}
          </span>
        )}
      </button>
    </AlertDialogTrigger>

    {/* ---------- POP-UP ---------- */}
    <AlertDialogContent className="max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-2xl font-extrabold flex items-center space-x-2">
          <span>🏆</span>
          <span>Cup&nbsp;Points</span>
        </AlertDialogTitle>
      </AlertDialogHeader>

      <AlertDialogDescription asChild>
        <div className="space-y-5 text-left text-sm leading-relaxed">
          {/* Base */}
          <section>
            <h4 className="font-semibold mb-1">🔢 Punteggio base</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>+10 per <strong className="text-green-600">risposta corretta</strong></li>
              <li>−5 per <strong className="text-red-600">risposta errata</strong></li>
            </ul>
          </section>

          {/* Bonus */}
          <section>
            <h4 className="font-semibold mb-1">⚡ Bonus modalità</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>⏱️ Timed: +1 punto ogni 10 s rimasti</li>
              <li>⚡ Streak: +15 punto ogni 5 risposte di fila</li>
            </ul>
          </section>

          {/* Moltiplicatori */}
          <section>
            <h4 className="font-semibold mb-2">🎚️ Moltiplicatori quiz</h4>
            <table className="w-full">
              <tbody>
                {Object.entries(QUIZ_TYPE_MULT).map(([type, mult]) => (
                  <tr key={type}>
                    <td className="capitalize pr-2">{type}</td>
                    <td className="text-right font-medium">×{mult}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Badge */}
          <section>
            <h4 className="font-semibold mb-1">🏅 Badge</h4>
            <p>
              Ogni badge vale:
              <br />
              🥉 25 • 🥈 40 • 🥇 70 • 💎 120 punti
            </p>
          </section>
        </div>
      </AlertDialogDescription>

      <AlertDialogFooter className="mt-6">
        <AlertDialogCancel>Chiudi</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default CupPointsPopup;
