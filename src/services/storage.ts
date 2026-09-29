import { FullExamSubmission, StudentProfile, ExamAnswers } from '../types/exam';

const SUBMISSIONS_KEY = 'ih_lex_exam_submissions_v1';
const DRAFT_PREFIX = 'ih_lex_exam_draft_';
const ACTIVE_STUDENT_KEY = 'ih_lex_active_student';

export function getAllSubmissions(): FullExamSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    if (!raw) {
      const sample = createSampleSubmission();
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify([sample]));
      return [sample];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading submissions from storage:', e);
    return [];
  }
}

function createSampleSubmission(): FullExamSubmission {
  const student: StudentProfile = {
    fullName: 'Sofía Morales Delgado',
    email: 'sofia.morales@ejemplo.com',
    folio: 'LEX-2026-8492',
    registeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 3600000).toISOString(),
  };

  const mathAnswers: Record<number, any> = {
    1: 'C', 2: 'A', 3: 'D', 4: 'B', 5: 'C', 6: 'A', 7: 'D', 8: 'B',
    9: 'C', 10: 'A', 11: 'D', 12: 'B', 13: 'A', 14: 'C', 15: 'D', 16: 'B',
    17: 'C', 18: 'A', 19: 'B', 20: 'D', 21: 'C', 22: 'B', 23: 'A', 24: 'D',
    25: 'C', 26: 'B', 27: 'D', 28: 'A', 29: 'B', 30: 'C', 31: 'A', 32: 'D',
  };

  const spanishAnswers: Record<number, any> = {
    1: 'B', 2: 'D', 3: 'A', 4: 'C', 5: 'B', 6: 'A', 7: 'D', 8: 'C',
    9: 'B', 10: 'C', 11: 'A', 12: 'D', 13: 'C', 14: 'B', 15: 'A', 16: 'D',
    17: 'B', 18: 'C', 19: 'A', 20: 'D', 21: 'C', 22: 'B', 23: 'D', 24: 'A',
    25: 'C', 26: 'B', 27: 'A', 28: 'D', 29: 'B', 30: 'C',
  };

  const sampleEssay = `En la actualidad, las herramientas de inteligencia artificial han transformado profundamente las dinámicas de aprendizaje en las aulas y fuera de ellas. Si bien existe una extendida preocupación sobre el riesgo de que la tecnología sustituya el esfuerzo intelectual de los alumnos, sostengo que la inteligencia artificial debe ser integrada en el estudio como un andamiaje pedagógico complementario y no como un reemplazo del juicio crítico del estudiante.

En primer término, la inteligencia artificial actúa como un tutor personalizado que democratiza el acceso a la retroalimentación inmediata. Cuando un aspirante o estudiante de lenguas extranjeras practica estructuras complejas o busca clarificar explicaciones teóricas, los modelos interactivos permiten formular preguntas repetidas veces y obtener contrastes inmediatos de gramática y vocabulario sin depender de la presencia sincrónica de un docente. Esto favorece la autonomía y la autorregulación en los hábitos de estudio.

En segundo término, la tecnología potencia la productividad investigativa cuando se utiliza con criterio ético. Herramientas de síntesis facilitan el mapeo de extensos corpus bibliográficos o la detección de errores de estilo en textos propios, lo que permite al alumno dedicar mayor energía cognitiva al análisis conceptual, a la contrastación de hipótesis y a la creatividad argumentativa.

No obstante, quienes rechazan tajantemente la presencia de la IA señalan con frecuencia que su uso masivo fomenta la pereza intelectual, propicia el plagio y debilita la capacidad de redacción propia. Es verdad que un empleo indiscriminado, enfocado en copiar respuestas sin procesamiento reflexivo, resulta perjudicial. Sin embargo, la solución no radica en prohibir una herramienta ya instalada en la sociedad digital, sino en educar a los estudiantes en una ética de uso responsable, citación y verificación rigurosa de fuentes.

En conclusión, la inteligencia artificial no elimina la necesidad del pensamiento crítico, sino que la vuelve más indispensable que nunca. Su integración provechosa dependerá de la capacidad de las instituciones educativas para formar usuarios conscientes, capaces de dialogar con la tecnología sin delegar en ella su voz propia ni su compromiso con el conocimiento riguroso.`;

  const essayWordCount = sampleEssay.trim().split(/\s+/).length;

  return {
    id: student.folio,
    student,
    answers: {
      math: mathAnswers,
      spanish: spanishAnswers,
      flaggedMath: [],
      flaggedSpanish: [],
      essay: {
        text: sampleEssay,
        wordCount: essayWordCount,
        submittedAt: new Date(Date.now() - 3600000).toISOString(),
        evaluation: {
          evaluator1Scores: {
            'criterio-1': 4,
            'criterio-2': 4,
            'criterio-3': 4,
            'criterio-4': 4,
            'criterio-5': 4,
          },
          evaluator2Scores: {
            'criterio-1': 4,
            'criterio-2': 4,
            'criterio-3': 4,
            'criterio-4': 4,
            'criterio-5': 4,
          },
          finalScores: {
            'criterio-1': 4,
            'criterio-2': 4,
            'criterio-3': 4,
            'criterio-4': 4,
            'criterio-5': 4,
          },
          totalScore: 20,
          evaluatorNotes: 'Excelente manejo de la estructura argumentativa, adecuada refutación del contraargumento y estricto apego al rango de palabras.',
          evaluatedAt: new Date(Date.now() - 1800000).toISOString(),
        },
      },
    },
    report: {
      student,
      submittedAt: new Date(Date.now() - 3600000).toISOString(),
      timeSpentSeconds: 5420,
      math: {
        total: 32,
        score: 30,
        percentage: 94,
        sections: [
          { name: 'Sección I. Aritmética y proporcionalidad', total: 7, correct: 7, percentage: 100 },
          { name: 'Sección II. Series y patrones', total: 5, correct: 5, percentage: 100 },
          { name: 'Sección III. Razonamiento lógico-verbal', total: 6, correct: 5, percentage: 83 },
          { name: 'Sección IV. Álgebra y planteamiento de problemas', total: 4, correct: 4, percentage: 100 },
          { name: 'Sección V. Interpretación de datos (tabla)', total: 4, correct: 4, percentage: 100 },
          { name: 'Sección VI. Conteo, conjuntos y tiempo', total: 4, correct: 3, percentage: 75 },
          { name: 'Sección VII. Interpretación de gráficas', total: 2, correct: 2, percentage: 100 },
        ],
        cognitive: [
          { level: 'Comprender', total: 1, correct: 1, percentage: 100 },
          { level: 'Aplicar', total: 17, correct: 16, percentage: 94 },
          { level: 'Analizar', total: 12, correct: 11, percentage: 92 },
          { level: 'Evaluar', total: 2, correct: 2, percentage: 100 },
        ],
      },
      spanish: {
        totalOM: 30,
        scoreOM: 29,
        percentageOM: 97,
        categories: [
          { name: 'Exploración del mundo a través de la lectura', total: 8, correct: 8, percentage: 100 },
          { name: 'Atender y entender (modalidad escrita)', total: 4, correct: 4, percentage: 100 },
          { name: 'Expresión verbal, visual y gráfica de las ideas', total: 16, correct: 15, percentage: 94 },
          { name: 'Indagar y compartir como vehículos de cambio', total: 2, correct: 2, percentage: 100 },
        ],
        cognitive: [
          { level: 'Recordar', total: 1, correct: 1, percentage: 100 },
          { level: 'Comprender', total: 7, correct: 7, percentage: 100 },
          { level: 'Aplicar', total: 8, correct: 8, percentage: 100 },
          { level: 'Analizar', total: 9, correct: 8, percentage: 89 },
          { level: 'Evaluar', total: 5, correct: 5, percentage: 100 },
        ],
        essayWordCount,
        essayMinWords: 350,
        essayMaxWords: 450,
        essayInWordRange: true,
        essayEvaluated: true,
        essayScore: 20,
      },
      globalScorePercentage: 96,
      performanceBand: 'Sobresaliente',
      recommendations: [
        'Excelente desempeño integral en ambos instrumentos del examen de admisión.',
        'Se recomienda continuar reforzando la lectura analítica y el razonamiento por hipótesis en contextos interdisciplinarios.',
      ],
      syncedToGoogleSheets: false,
    },
  };
}

export function saveSubmission(submission: FullExamSubmission): void {
  const current = getAllSubmissions();
  // Filter out any older entry for the same email or folio
  const filtered = current.filter(
    (s) =>
      s.student.email.trim().toLowerCase() !== submission.student.email.trim().toLowerCase() &&
      s.student.folio !== submission.student.folio
  );
  filtered.push(submission);
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(filtered));

  // Clear any draft for this user
  clearDraft(submission.student.email);
}

export function getSubmissionByEmail(email: string): FullExamSubmission | undefined {
  const submissions = getAllSubmissions();
  return submissions.find(
    (s) => s.student.email.trim().toLowerCase() === email.trim().toLowerCase()
  );
}

export function getSubmissionByFolio(folio: string): FullExamSubmission | undefined {
  const submissions = getAllSubmissions();
  return submissions.find((s) => s.student.folio.trim() === folio.trim());
}

export function isEmailAlreadySubmitted(email: string): boolean {
  return !!getSubmissionByEmail(email);
}

export function saveActiveStudent(student: StudentProfile | null): void {
  if (!student) {
    localStorage.removeItem(ACTIVE_STUDENT_KEY);
  } else {
    localStorage.setItem(ACTIVE_STUDENT_KEY, JSON.stringify(student));
  }
}

export function getActiveStudent(): StudentProfile | null {
  try {
    const raw = localStorage.getItem(ACTIVE_STUDENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export interface DraftState {
  student: StudentProfile;
  answers: ExamAnswers;
  timeRemainingSeconds: number;
  lastUpdated: string;
}

export function saveDraft(studentEmail: string, draft: DraftState): void {
  try {
    localStorage.setItem(
      `${DRAFT_PREFIX}${studentEmail.trim().toLowerCase()}`,
      JSON.stringify(draft)
    );
  } catch (e) {
    console.error('Error saving draft:', e);
  }
}

export function getDraft(studentEmail: string): DraftState | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${studentEmail.trim().toLowerCase()}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft(studentEmail: string): void {
  localStorage.removeItem(`${DRAFT_PREFIX}${studentEmail.trim().toLowerCase()}`);
}

export function generateFolio(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `LEX-${dateStr}-${randomSuffix}`;
}

export function resetApplicantSubmission(emailOrFolio: string): boolean {
  const all = getAllSubmissions();
  const search = emailOrFolio.trim().toLowerCase();
  const filtered = all.filter(
    (s) =>
      s.student.email.toLowerCase() !== search &&
      s.student.folio.toLowerCase() !== search
  );
  if (filtered.length !== all.length) {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(filtered));
    clearDraft(emailOrFolio);
    return true;
  }
  return false;
}
