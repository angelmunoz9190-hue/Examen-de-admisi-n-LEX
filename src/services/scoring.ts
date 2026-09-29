import { MATH_EXAM_QUESTIONS } from '../data/mathExamData';
import { SPANISH_EXAM_QUESTIONS, ESSAY_PROMPT } from '../data/spanishExamData';
import {
  ExamAnswers,
  ExamReport,
  StudentProfile,
  SectionBreakdown,
  CognitiveBreakdown,
} from '../types/exam';

export function calculateExamReport(
  student: StudentProfile,
  answers: ExamAnswers,
  timeSpentSeconds: number = 0
): ExamReport {
  // 1. Math scoring
  let mathCorrect = 0;
  const mathSectionMap: Record<string, { total: number; correct: number }> = {};
  const mathCognitiveMap: Record<string, { total: number; correct: number }> = {
    Comprender: { total: 0, correct: 0 },
    Aplicar: { total: 0, correct: 0 },
    Analizar: { total: 0, correct: 0 },
    Evaluar: { total: 0, correct: 0 },
  };

  MATH_EXAM_QUESTIONS.forEach((q) => {
    const userAnswer = answers.math[q.id];
    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) mathCorrect++;

    // Section
    if (!mathSectionMap[q.section]) {
      mathSectionMap[q.section] = { total: 0, correct: 0 };
    }
    mathSectionMap[q.section].total++;
    if (isCorrect) mathSectionMap[q.section].correct++;

    // Bloom
    if (!mathCognitiveMap[q.bloomLevel]) {
      mathCognitiveMap[q.bloomLevel] = { total: 0, correct: 0 };
    }
    mathCognitiveMap[q.bloomLevel].total++;
    if (isCorrect) mathCognitiveMap[q.bloomLevel].correct++;
  });

  const mathSections: SectionBreakdown[] = Object.entries(mathSectionMap).map(
    ([name, data]) => ({
      name,
      total: data.total,
      correct: data.correct,
      percentage: Math.round((data.correct / data.total) * 100),
    })
  );

  const mathCognitive: CognitiveBreakdown[] = Object.entries(mathCognitiveMap).map(
    ([level, data]) => ({
      level,
      total: data.total,
      correct: data.correct,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    })
  );

  // 2. Spanish scoring
  let spanishOMCorrect = 0;
  const spanishCategoryMap: Record<string, { total: number; correct: number }> = {
    'Exploración del mundo a través de la lectura': { total: 0, correct: 0 },
    'Atender y entender (modalidad escrita)': { total: 0, correct: 0 },
    'Expresión verbal, visual y gráfica de las ideas': { total: 0, correct: 0 },
    'Indagar y compartir como vehículos de cambio': { total: 0, correct: 0 },
  };

  const spanishCognitiveMap: Record<string, { total: number; correct: number }> = {
    Recordar: { total: 0, correct: 0 },
    Comprender: { total: 0, correct: 0 },
    Aplicar: { total: 0, correct: 0 },
    Analizar: { total: 0, correct: 0 },
    Evaluar: { total: 0, correct: 0 },
  };

  SPANISH_EXAM_QUESTIONS.forEach((q) => {
    const userAnswer = answers.spanish[q.id];
    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) spanishOMCorrect++;

    // Category mapping
    let category = 'Expresión verbal, visual y gráfica de las ideas';
    if (q.id >= 1 && q.id <= 8) {
      category = 'Exploración del mundo a través de la lectura';
    } else if (q.id >= 9 && q.id <= 12) {
      category = 'Atender y entender (modalidad escrita)';
    } else if (q.id >= 28 && q.id <= 29) {
      category = 'Indagar y compartir como vehículos de cambio';
    }

    if (!spanishCategoryMap[category]) {
      spanishCategoryMap[category] = { total: 0, correct: 0 };
    }
    spanishCategoryMap[category].total++;
    if (isCorrect) spanishCategoryMap[category].correct++;

    // Bloom
    if (!spanishCognitiveMap[q.bloomLevel]) {
      spanishCognitiveMap[q.bloomLevel] = { total: 0, correct: 0 };
    }
    spanishCognitiveMap[q.bloomLevel].total++;
    if (isCorrect) spanishCognitiveMap[q.bloomLevel].correct++;
  });

  const spanishCategories: SectionBreakdown[] = Object.entries(spanishCategoryMap).map(
    ([name, data]) => ({
      name,
      total: data.total,
      correct: data.correct,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    })
  );

  const spanishCognitive: CognitiveBreakdown[] = Object.entries(spanishCognitiveMap).map(
    ([level, data]) => ({
      level,
      total: data.total,
      correct: data.correct,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    })
  );

  // Essay check
  const essayText = answers.essay?.text || '';
  const essayWords = essayText.trim().length > 0 ? essayText.trim().split(/\s+/).length : 0;
  const essayInWordRange = essayWords >= ESSAY_PROMPT.minWords && essayWords <= ESSAY_PROMPT.maxWords;
  const essayEvaluated = !!answers.essay?.evaluation?.totalScore;
  const essayScore = answers.essay?.evaluation?.totalScore;

  // Global score calculation
  const mathPercentage = Math.round((mathCorrect / 32) * 100);
  const spanishOMPercentage = Math.round((spanishOMCorrect / 30) * 100);

  let globalScorePercentage = 0;
  if (essayEvaluated && typeof essayScore === 'number') {
    // Math 32 + Spanish OM 30 + Essay 20 = 82 pts total
    const totalPointsObtained = mathCorrect + spanishOMCorrect + essayScore;
    globalScorePercentage = Math.round((totalPointsObtained / 82) * 100);
  } else {
    // Pre-essay grading: combined multiple-choice percentage (62 pts)
    globalScorePercentage = Math.round(((mathCorrect + spanishOMCorrect) / 62) * 100);
  }

  // Performance band
  let performanceBand: 'Sobresaliente' | 'Satisfactorio' | 'Básico' | 'Insuficiente' = 'Insuficiente';
  if (globalScorePercentage >= 85) {
    performanceBand = 'Sobresaliente';
  } else if (globalScorePercentage >= 70) {
    performanceBand = 'Satisfactorio';
  } else if (globalScorePercentage >= 60) {
    performanceBand = 'Básico';
  } else {
    performanceBand = 'Insuficiente';
  }

  // Recommendations
  const recommendations: string[] = [];

  // Math checks
  mathSections.forEach((sec) => {
    if (sec.percentage < 60) {
      if (sec.name.includes('Aritmética')) {
        recommendations.push(
          'Reforzar cálculo proporcional, porcentajes sucesivos e interpretación de problemas de proporcionalidad inversa.'
        );
      } else if (sec.name.includes('Series')) {
        recommendations.push(
          'Practicar identificación de patrones de segundo orden, relaciones bidimensionales y sucesiones intercaladas.'
        );
      } else if (sec.name.includes('lógico-verbal')) {
        recommendations.push(
          'Repasar lógica formal: deducciones (modus tollens), negación de enunciados universales y contrastación de hipótesis.'
        );
      } else if (sec.name.includes('Álgebra')) {
        recommendations.push(
          'Fortalecer el planteamiento algebraico a partir de lenguaje verbal y resolución de ecuaciones de primer grado.'
        );
      } else if (sec.name.includes('gráficas') || sec.name.includes('datos')) {
        recommendations.push(
          'Prestar atención crítica al análisis visual de datos (gráficas de sectores, ejes truncados y tablas de frecuencias).'
        );
      }
    }
  });

  // Spanish checks
  spanishCategories.forEach((cat) => {
    if (cat.percentage < 60) {
      if (cat.name.includes('Exploración del mundo')) {
        recommendations.push(
          'Ejercitar la lectura profunda distinguiendo la tesis principal de ideas secundarias y detectando intenciones discursivas.'
        );
      } else if (cat.name.includes('Expresión verbal')) {
        recommendations.push(
          'Atender reglas de acentuación diacrítica, puntuación restrictiva, concordancia gramatical y precisión léxica.'
        );
      } else if (cat.name.includes('Indagar')) {
        recommendations.push(
          'Mejorar la identificación de fuentes confiables con rigor académico y la técnica de paráfrasis sin plagio.'
        );
      }
    }
  });

  // Essay check
  if (essayWords === 0) {
    recommendations.push('Es fundamental redactar y completar la sección de ensayo argumentativo para obtener la ponderación final.');
  } else if (essayWords < ESSAY_PROMPT.minWords) {
    recommendations.push(
      `El ensayo contiene ${essayWords} palabras. Se recomienda ampliar la argumentación para alcanzar el rango sugerido (350–450 palabras).`
    );
  } else if (essayWords > ESSAY_PROMPT.maxWords) {
    recommendations.push(
      `El ensayo supera la extensión con ${essayWords} palabras. Conviene sintetizar y pulir la concisión dentro del límite de 450 palabras.`
    );
  } else {
    recommendations.push('Excelente apego a la extensión recomendada del ensayo argumentativo (350–450 palabras).');
  }

  if (recommendations.length === 0) {
    recommendations.push('¡Excelente desempeño general en ambos instrumentos del examen de admisión!');
  }

  return {
    student,
    submittedAt: new Date().toISOString(),
    timeSpentSeconds,
    math: {
      total: 32,
      score: mathCorrect,
      percentage: mathPercentage,
      sections: mathSections,
      cognitive: mathCognitive,
    },
    spanish: {
      totalOM: 30,
      scoreOM: spanishOMCorrect,
      percentageOM: spanishOMPercentage,
      categories: spanishCategories,
      cognitive: spanishCognitive,
      essayWordCount: essayWords,
      essayMinWords: ESSAY_PROMPT.minWords,
      essayMaxWords: ESSAY_PROMPT.maxWords,
      essayInWordRange,
      essayEvaluated,
      essayScore,
    },
    globalScorePercentage,
    performanceBand,
    recommendations,
    syncedToGoogleSheets: false,
  };
}
