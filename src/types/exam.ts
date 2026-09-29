export type OptionLetter = 'A' | 'B' | 'C' | 'D';

export interface QuestionOption {
  letter: OptionLetter;
  text: string;
}

export interface ExamQuestion {
  id: number;
  section: string;
  subSection?: string;
  passageId?: string; // for reading comprehension
  prompt: string;
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
  graphicType?: 'pie-languages' | 'bar-averages' | 'matrix-pattern';
  options: QuestionOption[];
  correctAnswer: OptionLetter;
  bloomLevel: 'Recordar' | 'Comprender' | 'Aplicar' | 'Analizar' | 'Evaluar';
  difficulty: 'Fácil' | 'Media' | 'Difícil';
  skill: string;
  explanation?: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  questionIds: number[];
}

export interface EssayRubricCriterion {
  id: string;
  name: string;
  levels: {
    4: string; // Sobresaliente
    3: string; // Satisfactorio
    2: string; // En desarrollo
    1: string; // Insuficiente
  };
}

export interface EssaySubmission {
  text: string;
  wordCount: number;
  submittedAt: string;
  evaluation?: {
    evaluator1Scores: Record<string, number>;
    evaluator2Scores: Record<string, number>;
    finalScores: Record<string, number>;
    totalScore: number; // max 20
    evaluatorNotes?: string;
    evaluatedAt: string;
  };
}

export interface StudentProfile {
  fullName: string;
  email: string;
  folio: string;
  registeredAt: string;
  startedAt?: string;
  completedAt?: string;
  googleUid?: string;
  googlePhoto?: string;
}

export interface ExamAnswers {
  math: Record<number, OptionLetter>; // 1 to 32
  spanish: Record<number, OptionLetter>; // 1 to 30
  essay: EssaySubmission;
  flaggedMath: number[];
  flaggedSpanish: number[];
}

export interface SectionBreakdown {
  name: string;
  total: number;
  correct: number;
  percentage: number;
}

export interface CognitiveBreakdown {
  level: string;
  total: number;
  correct: number;
  percentage: number;
}

export interface ExamReport {
  student: StudentProfile;
  submittedAt: string;
  timeSpentSeconds: number;
  math: {
    total: number;
    score: number;
    percentage: number;
    sections: SectionBreakdown[];
    cognitive: CognitiveBreakdown[];
  };
  spanish: {
    totalOM: number;
    scoreOM: number;
    percentageOM: number;
    categories: SectionBreakdown[];
    cognitive: CognitiveBreakdown[];
    essayWordCount: number;
    essayMinWords: number;
    essayMaxWords: number;
    essayInWordRange: boolean;
    essayEvaluated: boolean;
    essayScore?: number; // max 20
  };
  globalScorePercentage: number;
  performanceBand: 'Sobresaliente' | 'Satisfactorio' | 'Básico' | 'Insuficiente';
  recommendations: string[];
  syncedToGoogleSheets: boolean;
  googleSheetsUrl?: string;
}

export interface FullExamSubmission {
  id: string;
  student: StudentProfile;
  answers: ExamAnswers;
  report: ExamReport;
  googleSheetsRowIndex?: number;
}
