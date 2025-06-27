#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quiz a scelta multipla con salvataggio punteggi e statistiche.
Compatibile con file di domande in formato 'Exam.txt' (vedi esempi).
"""

import random
import csv
import unicodedata
import re
from datetime import datetime
from colorama import Fore, init

init(autoreset=True)

# -------------------- Configurazione file --------------------
SCORES_FILE = "quiz_scores.csv"
STATS_FILE = "questions_stats.csv"
QUESTIONS_FILE = "Exam.txt"

# -------------------- Parsing domande --------------------
def load_questions(path: str):
    """Legge il file di testo e restituisce la lista di domande."""
    with open(path, "r", encoding="utf-8") as f:
        raw = f.read()
    text = unicodedata.normalize("NFKC", raw)

    blocks = re.split(r"\n\s*\n", text)
    questions = []

    for block in blocks:
        lines = [l.strip() for l in block.splitlines() if l.strip()]
        if len(lines) < 3:          # scarta blocchi troppo corti
            continue

        question_text = lines[0]

        # opzioni che iniziano con A) / B. / C) ...
        opts = [l for l in lines[1:] if re.match(r"^[A-D][\.\)]\s+", l)]
        if len(opts) != 4:
            continue

        # riga con "Risposta Corretta:"
        ans_line = next(
            (l for l in lines if re.search(r"Risposta\s*Corretta", l, re.IGNORECASE)), None
        )
        if not ans_line:
            continue

        # estrae la lettera A-D, indipendentemente dal resto
        corr_raw = re.split(
            r"Risposta\s*Corretta\s*:\s*", ans_line, flags=re.IGNORECASE
        )[-1].strip()
        m_corr = re.search(r"[A-D]", corr_raw, re.IGNORECASE)
        if not m_corr:
            continue
        corr_letter = m_corr.group(0).upper()

        # eventuale spiegazione
        explanation = ""
        idx_exp = next(
            (i for i, l in enumerate(lines) if re.search(r"Spiegazione", l, re.IGNORECASE)),
            None,
        )
        if idx_exp is not None:
            first_line = lines[idx_exp]
            exp_match = re.search(r"Spiegazione\s*:\s*(.*)", first_line, re.IGNORECASE)
            if exp_match and exp_match.group(1).strip():
                first = exp_match.group(1).strip()
                rest = " ".join(lines[idx_exp + 1 :]).strip()
                explanation = f"{first} {rest}".strip()
            else:
                explanation = " ".join(lines[idx_exp + 1 :]).strip()

        questions.append(
            {
                "question": question_text,
                "options": opts,
                "correct": corr_letter,  # <-- solo la lettera
                "explanation": explanation,
            }
        )

    return questions

# -------------------- Salvataggio punteggi --------------------
def save_score(score: int, total: int):
    with open(SCORES_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([datetime.now().strftime("%Y-%m-%d %H:%M:%S"), score, total])

# -------------------- Aggiornamento statistiche --------------------
def update_stats(question: str, correct: bool):
    stats = {}
    try:
        with open(STATS_FILE, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                stats[row["question"]] = {
                    "correct": int(row["correct"]),
                    "incorrect": int(row["incorrect"]),
                    "total": int(row["total"]),
                }
    except FileNotFoundError:
        pass

    if question not in stats:
        stats[question] = {"correct": 0, "incorrect": 0, "total": 0}

    stats[question]["total"] += 1
    if correct:
        stats[question]["correct"] += 1
    else:
        stats[question]["incorrect"] += 1

    with open(STATS_FILE, "w", newline="", encoding="utf-8") as f:
        fieldnames = ["question", "correct", "incorrect", "total"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for q, v in stats.items():
            writer.writerow({"question": q, **v})

# -------------------- Loop principale del quiz --------------------
def run_quiz(questions, num: int = 20):
    if not questions:
        print(Fore.RED + "Non sono state trovate domande valide nel file.")
        return

    selected = random.sample(questions, min(num, len(questions)))
    score = 0
    print(Fore.CYAN + "\nBenvenuto al quiz! Ti verranno poste alcune domande.\n")

    for i, q in enumerate(selected, 1):
        print(Fore.YELLOW + f"Domanda {i}: {q['question']}")
        for opt in q["options"]:
            print(Fore.GREEN + opt)

        # acquisisci e normalizza risposta dell'utente
        while True:
            ans_input = input(
                Fore.CYAN + "Inserisci la tua risposta (A, B, C, D): "
            ).strip().upper()
            m_ans = re.match(r"([A-D])", ans_input)
            if m_ans:
                ans = m_ans.group(1)
                break
            print(Fore.RED + "Risposta non valida, riprova.")

        is_corr = ans == q["correct"]

        if is_corr:
            print(Fore.GREEN + "✅ Corretto!")
            score += 1
        else:
            # trova testo completo della risposta giusta
            full_corr = next(
                (opt for opt in q["options"] if opt.startswith(q["correct"])), q["correct"]
            )
            print(Fore.RED + f"❌ Sbagliato! La risposta corretta era: {full_corr}")

        if q["explanation"]:
            print(Fore.BLUE + f"Spiegazione: {q['explanation']}\n")
        else:
            print(Fore.LIGHTBLACK_EX + "Spiegazione non disponibile.\n")

        update_stats(q["question"], is_corr)

    save_score(score, len(selected))
    print(Fore.CYAN + "\nQuiz Terminato!")
    print(Fore.MAGENTA + f"Il tuo punteggio è: {score}/{len(selected)}")
    if score >= 12:
        print(Fore.GREEN + "Complimenti! Hai superato il quiz!")
    else:
        print(Fore.RED + "Studia Coglione!")

# -------------------- Entry-point --------------------
if __name__ == "__main__":
    all_questions = load_questions(QUESTIONS_FILE)
    print(f"Domande caricate correttamente: {len(all_questions)}")
    run_quiz(all_questions, num=20)
