import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  HelpCircle,
  FileText,
  Calculator,
  BookOpen,
  Send,
  AlertCircle,
  Info,
  Layers,
  Sparkles,
  Eye,
  Maximize2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ExamAnswers,
  ExamQuestion,
  OptionLetter,
  ReadingPassage,
  StudentProfile,
} from '../types/exam';
import { MATH_EXAM_QUESTIONS } from '../data/mathExamData';
import {
  SPANISH_EXAM_QUESTIONS,
  READING_PASSAGES,
  ESSAY_PROMPT,
  ESSAY_RUBRIC,
} from '../data/spanishExamData';
import { GraphicsViewer } from './GraphicsViewer';
import { saveDraft, getDraft } from '../services/storage';

interface ExamContainerProps {
  student: StudentProfile;
  onSubmitExam: (answers: ExamAnswers) => void;
  timeRemainingSeconds: number;
}

export const ExamContainer: React.FC<ExamContainerProps> = ({
  student,
  onSubmitExam,
  timeRemainingSeconds,
}) => {
  // Navigation & instrument state
  const [activeInstrument, setActiveInstrument] = useState<'math' | 'spanish'>('math');
  const [currentMathIndex, setCurrentMathIndex] = useState(0); // 0 to 31
  const [currentSpanishIndex, setCurrentSpanishIndex] = useState(0); // 0 to 30 (30 is essay)

  // Answers & flagged
  const [mathAnswers, setMathAnswers] = useState<Record<number, OptionLetter>>({});
  const [spanishAnswers, setSpanishAnswers] = useState<Record<number, OptionLetter>>({});
  const [flaggedMath, setFlaggedMath] = useState<number[]>([]);
  const [flaggedSpanish, setFlaggedSpanish] = useState<number[]>([]);
  const [essayText, setEssayText] = useState('');

  // Modals & Panels
  const [showReadingDrawer, setShowReadingDrawer] = useState(true);
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [lastSavedMessage, setLastSavedMessage] = useState<string>('Guardado automático activo');

  // Load existing draft if present
  useEffect(() => {
    const draft = getDraft(student.email);
    if (draft && draft.answers) {
      if (draft.answers.math) setMathAnswers(draft.answers.math);
      if (draft.answers.spanish) setSpanishAnswers(draft.answers.spanish);
      if (draft.answers.flaggedMath) setFlaggedMath(draft.answers.flaggedMath);
      if (draft.answers.flaggedSpanish) setFlaggedSpanish(draft.answers.flaggedSpanish);
      if (draft.answers.essay?.text) setEssayText(draft.answers.essay.text);
    }
  }, [student.email]);

  // Auto-save draft on answers change
  useEffect(() => {
    const answers: ExamAnswers = {
      math: mathAnswers,
      spanish: spanishAnswers,
      flaggedMath,
      flaggedSpanish,
      essay: {
        text: essayText,
        wordCount: essayText.trim().length > 0 ? essayText.trim().split(/\s+/).length : 0,
        submittedAt: new Date().toISOString(),
      },
    };

    saveDraft(student.email, {
      student,
      answers,
      timeRemainingSeconds,
      lastUpdated: new Date().toISOString(),
    });

    setLastSavedMessage(`Borrador guardado a las ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
  }, [mathAnswers, spanishAnswers, flaggedMath, flaggedSpanish, essayText, student, timeRemainingSeconds]);

  // Current questions
  const currentMathQuestion: ExamQuestion = MATH_EXAM_QUESTIONS[currentMathIndex];
  const isEssayCurrent = activeInstrument === 'spanish' && currentSpanishIndex === 30;
  const currentSpanishQuestion: ExamQuestion | undefined =
    !isEssayCurrent ? SPANISH_EXAM_QUESTIONS[currentSpanishIndex] : undefined;

  // Active reading passage if applicable
  const currentPassage: ReadingPassage | undefined = useMemo(() => {
    if (activeInstrument !== 'spanish' || isEssayCurrent || !currentSpanishQuestion) return undefined;
    const qId = currentSpanishQuestion.id;
    return READING_PASSAGES.find((p) => p.questionIds.includes(qId));
  }, [activeInstrument, isEssayCurrent, currentSpanishQuestion]);

  // Answer handler
  const handleSelectOption = (letter: OptionLetter) => {
    if (activeInstrument === 'math') {
      setMathAnswers((prev) => ({ ...prev, [currentMathQuestion.id]: letter }));
    } else if (!isEssayCurrent && currentSpanishQuestion) {
      setSpanishAnswers((prev) => ({ ...prev, [currentSpanishQuestion.id]: letter }));
    }
  };

  // Flag toggle
  const handleToggleFlag = () => {
    if (activeInstrument === 'math') {
      const qId = currentMathQuestion.id;
      setFlaggedMath((prev) =>
        prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
      );
    } else if (!isEssayCurrent && currentSpanishQuestion) {
      const qId = currentSpanishQuestion.id;
      setFlaggedSpanish((prev) =>
        prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
      );
    }
  };

  // Word count metrics
  const essayWords = useMemo(() => {
    const trimmed = essayText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }, [essayText]);

  // Counts answered
  const mathAnsweredCount = Object.keys(mathAnswers).length;
  const spanishAnsweredCount = Object.keys(spanishAnswers).length;
  const isEssayWritten = essayWords >= 100;

  const totalAnswered = mathAnsweredCount + spanishAnsweredCount + (isEssayWritten ? 1 : 0);
  const totalItems = 32 + 30 + 1; // 63 items
  const progressPercent = Math.round((totalAnswered / totalItems) * 100);

  const handleFinalSubmit = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const finalAnswers: ExamAnswers = {
      math: mathAnswers,
      spanish: spanishAnswers,
      flaggedMath,
      flaggedSpanish,
      essay: {
        text: essayText,
        wordCount: essayWords,
        submittedAt: new Date().toISOString(),
      },
    };

    onSubmitExam(finalAnswers);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner: Instrument Selector & Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Instrument Tabs */}
          <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold">
            <button
              onClick={() => setActiveInstrument('math')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeInstrument === 'math'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-4 h-4 text-sky-700" />
              <span>Pensamiento Matemático</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
                {mathAnsweredCount}/32
              </span>
            </button>

            <button
              onClick={() => setActiveInstrument('spanish')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeInstrument === 'spanish'
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-700" />
              <span>Competencia Lingüística</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700">
                {spanishAnsweredCount}/30 + Ensayo
              </span>
            </button>
          </div>

          {/* Global Progress & Submit Button */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Avance General:</span>
                <span className="text-xs font-bold text-slate-900">{progressPercent}%</span>
              </div>
              <div className="w-32 sm:w-44 bg-slate-100 rounded-full h-2 mt-1 overflow-hidden border border-slate-200">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Finalizar Examen</span>
            </button>
          </div>
        </div>

        {/* Status sub-bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>{lastSavedMessage}</span>
          <span className="hidden sm:inline">International House Cuernavaca · LEX</span>
        </div>
      </div>

      {/* Main Examination Grid: Left Content (Passage / Question), Right Sidebar (Navigator) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Question or Essay (8 cols or 12 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* MATH INSTRUMENT */}
          {activeInstrument === 'math' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
              {/* Question Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200/60">
                    {currentMathQuestion.section}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      Reactivo {currentMathQuestion.id} de 32
                    </h3>
                  </div>
                </div>

                <button
                  onClick={handleToggleFlag}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    flaggedMath.includes(currentMathQuestion.id)
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Marcar para revisar más tarde"
                >
                  {flaggedMath.includes(currentMathQuestion.id) ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-amber-600" />
                      <span className="hidden sm:inline">Marcado</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-slate-400" />
                      <span className="hidden sm:inline">Marcar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Question Prompt */}
              <div className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed mb-6">
                {currentMathQuestion.prompt}
              </div>

              {/* Graphic / Table if required */}
              {currentMathQuestion.graphicType && (
                <GraphicsViewer type={currentMathQuestion.graphicType} />
              )}

              {/* Table Data if question has one (e.g. Q23-26) */}
              {currentMathQuestion.tableData && !currentMathQuestion.graphicType && (
                <div className="my-5 overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 text-center">
                      Tabla 1. Aspirantes y admitidos por año
                    </p>
                    <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-xs text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          {currentMathQuestion.tableData.headers.map((h, i) => (
                            <th
                              key={i}
                              className="px-4 py-2.5 text-center text-xs font-bold text-slate-700 uppercase"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white font-mono text-center">
                        {currentMathQuestion.tableData.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/80">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-4 py-2.5 text-slate-700">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Options A, B, C, D */}
              <div className="space-y-3 mt-6">
                {currentMathQuestion.options.map((option) => {
                  const isSelected = mathAnswers[currentMathQuestion.id] === option.letter;
                  return (
                    <button
                      key={option.letter}
                      onClick={() => handleSelectOption(option.letter)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {option.letter}
                      </span>
                      <span className="text-sm sm:text-base font-normal pt-0.5 leading-relaxed">
                        {option.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Nav Buttons for Math */}
              <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-100">
                <button
                  disabled={currentMathIndex === 0}
                  onClick={() => setCurrentMathIndex((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <span className="text-xs text-slate-400 font-medium">
                  {currentMathIndex + 1} de 32
                </span>

                {currentMathIndex < 31 ? (
                  <button
                    onClick={() => setCurrentMathIndex((prev) => Math.min(31, prev + 1))}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveInstrument('spanish')}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
                  >
                    <span>Ir a Competencia Lingüística</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SPANISH INSTRUMENT */}
          {activeInstrument === 'spanish' && !isEssayCurrent && currentSpanishQuestion && (
            <div className="space-y-6">
              {/* Reading Passage viewer for Q1 to Q12 */}
              {currentPassage && (
                <div className="bg-slate-50/80 rounded-3xl border border-indigo-100 p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-700" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                        {currentPassage.title}
                      </h4>
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {currentPassage.subtitle}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 text-slate-800 font-serif leading-relaxed text-sm sm:text-base whitespace-pre-line shadow-2xs">
                    {currentPassage.content}
                  </div>
                </div>
              )}

              {/* Spanish Question Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200/60">
                      {currentSpanishQuestion.section}
                    </span>
                    {currentSpanishQuestion.subSection && (
                      <span className="ml-2 text-[11px] text-slate-500 font-medium hidden sm:inline">
                        • {currentSpanishQuestion.subSection}
                      </span>
                    )}
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
                      Reactivo {currentSpanishQuestion.id} de 30
                    </h3>
                  </div>

                  <button
                    onClick={handleToggleFlag}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      flaggedSpanish.includes(currentSpanishQuestion.id)
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Marcar para revisar más tarde"
                  >
                    {flaggedSpanish.includes(currentSpanishQuestion.id) ? (
                      <>
                        <BookmarkCheck className="w-4 h-4 text-amber-600" />
                        <span className="hidden sm:inline">Marcado</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        <span className="hidden sm:inline">Marcar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Prompt */}
                <div className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed mb-6 whitespace-pre-line">
                  {currentSpanishQuestion.prompt}
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentSpanishQuestion.options.map((option) => {
                    const isSelected = spanishAnswers[currentSpanishQuestion.id] === option.letter;
                    return (
                      <button
                        key={option.letter}
                        onClick={() => handleSelectOption(option.letter)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {option.letter}
                        </span>
                        <span className="text-sm sm:text-base font-normal pt-0.5 leading-relaxed">
                          {option.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Nav */}
                <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-100">
                  <button
                    disabled={currentSpanishIndex === 0}
                    onClick={() => setCurrentSpanishIndex((prev) => Math.max(0, prev - 1))}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>

                  <span className="text-xs text-slate-400 font-medium">
                    {currentSpanishIndex + 1} de 30
                  </span>

                  <button
                    onClick={() => setCurrentSpanishIndex((prev) => prev + 1)}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
                  >
                    <span>{currentSpanishIndex === 29 ? 'Continuar al Ensayo' : 'Siguiente'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SPANISH ESSAY (index 30) */}
          {activeInstrument === 'spanish' && isEssayCurrent && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200/60">
                    {ESSAY_PROMPT.sectionTitle}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                    Ensayo Argumentativo
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Valor: 20 puntos · Tiempo sugerido: 45 min · Rango obligatorio: 350 a 450 palabras
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRubricModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-center"
                >
                  <Info className="w-4 h-4 text-purple-700" />
                  <span>Ver Rúbrica de Calificación (5 criterios)</span>
                </button>
              </div>

              {/* Context Box */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-sm text-slate-700 space-y-3">
                <p className="leading-relaxed text-slate-600">{ESSAY_PROMPT.context}</p>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Tema Oficial
                  </p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">{ESSAY_PROMPT.topic}</p>
                  <p className="text-xs text-slate-600 mt-1">{ESSAY_PROMPT.prompt}</p>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Requisitos del texto:
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                    {ESSAY_PROMPT.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Word count status meter */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">Contador de Palabras:</span>
                  <span
                    className={`font-mono text-sm font-bold px-2 py-0.5 rounded-md ${
                      essayWords >= 350 && essayWords <= 450
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : essayWords < 200
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {essayWords} palabras
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-medium text-slate-500">
                    {essayWords >= 350 && essayWords <= 450
                      ? '✓ Rango óptimo cumplido (350–450)'
                      : essayWords < 350
                      ? `Faltan ${350 - essayWords} palabras para el mínimo`
                      : `Exceso de ${essayWords - 450} palabras`}
                  </span>
                </div>
              </div>

              {/* Essay Textarea */}
              <div>
                <textarea
                  rows={15}
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  placeholder="Comienza a redactar tu ensayo aquí... Asegúrate de presentar tu tesis en la introducción, sustentar con al menos dos argumentos, considerar y refutar un contraargumento, y cerrar con una conclusión sólida."
                  className="w-full p-4 sm:p-5 rounded-2xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-serif text-slate-800 text-base leading-relaxed placeholder-slate-400 shadow-2xs resize-y"
                />
              </div>

              {/* Bottom Nav */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => setCurrentSpanishIndex(29)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Volver a Reactivo 30</span>
                </button>

                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Revisar y Finalizar Examen</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Question Navigator Grid (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Navegador de Reactivos
                </h4>
                <p className="text-[11px] text-slate-500">
                  {activeInstrument === 'math' ? 'Instrumento 1: Matemáticas' : 'Instrumento 2: Español'}
                </p>
              </div>

              {/* Legend dots */}
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Resp.
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Marc.
                </span>
              </div>
            </div>

            {/* Questions Grid */}
            {activeInstrument === 'math' ? (
              <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-6 gap-2">
                {MATH_EXAM_QUESTIONS.map((q, idx) => {
                  const isCurrent = currentMathIndex === idx;
                  const isAnswered = !!mathAnswers[q.id];
                  const isFlagged = flaggedMath.includes(q.id);

                  let btnStyle = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
                  if (isCurrent) {
                    btnStyle = 'ring-2 ring-indigo-600 bg-indigo-50 text-indigo-900 border-indigo-400 font-bold';
                  } else if (isAnswered) {
                    btnStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentMathIndex(idx)}
                      className={`relative h-9 rounded-xl border text-xs flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                    >
                      <span>{q.id}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-6 gap-2">
                  {SPANISH_EXAM_QUESTIONS.map((q, idx) => {
                    const isCurrent = !isEssayCurrent && currentSpanishIndex === idx;
                    const isAnswered = !!spanishAnswers[q.id];
                    const isFlagged = flaggedSpanish.includes(q.id);

                    let btnStyle = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
                    if (isCurrent) {
                      btnStyle = 'ring-2 ring-indigo-600 bg-indigo-50 text-indigo-900 border-indigo-400 font-bold';
                    } else if (isAnswered) {
                      btnStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentSpanishIndex(idx)}
                        className={`relative h-9 rounded-xl border text-xs flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                      >
                        <span>{q.id}</span>
                        {isFlagged && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Essay Entry Button */}
                <button
                  onClick={() => setCurrentSpanishIndex(30)}
                  className={`w-full p-3 rounded-2xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                    isEssayCurrent
                      ? 'ring-2 ring-purple-600 bg-purple-50 text-purple-900 border-purple-300 font-bold'
                      : essayWords > 0
                      ? 'bg-purple-50/60 text-purple-900 border-purple-200 font-semibold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Sección IV: Ensayo</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200">
                    {essayWords} palabras
                  </span>
                </button>
              </div>
            )}

            {/* Quick Summary Pill */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
              <div className="flex justify-between">
                <span>Matemáticas respondidas:</span>
                <span className="font-semibold text-slate-800">{mathAnsweredCount} de 32</span>
              </div>
              <div className="flex justify-between">
                <span>Español OM respondidas:</span>
                <span className="font-semibold text-slate-800">{spanishAnsweredCount} de 30</span>
              </div>
              <div className="flex justify-between">
                <span>Ensayo argumentativo:</span>
                <span className="font-semibold text-slate-800">
                  {essayWords >= 350 ? 'Completo ✓' : essayWords > 0 ? `${essayWords} palabras` : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rubric Reference Modal */}
      {showRubricModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Rúbrica Analítica Oficial del Ensayo
                </h3>
                <p className="text-xs text-slate-500">
                  5 criterios analíticos de 1 a 4 puntos (máximo 20 puntos) · MCCEMS NEM
                </p>
              </div>
              <button
                onClick={() => setShowRubricModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {ESSAY_RUBRIC.map((crit) => (
                <div key={crit.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="text-sm font-bold text-indigo-950 mb-3">{crit.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                      <span className="font-bold text-emerald-900 block mb-1">
                        4 · Sobresaliente
                      </span>
                      <p className="text-emerald-950/80 leading-relaxed">{crit.levels[4]}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200">
                      <span className="font-bold text-sky-900 block mb-1">3 · Satisfactorio</span>
                      <p className="text-sky-950/80 leading-relaxed">{crit.levels[3]}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200">
                      <span className="font-bold text-amber-900 block mb-1">2 · En desarrollo</span>
                      <p className="text-amber-950/80 leading-relaxed">{crit.levels[2]}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">1 · Insuficiente</span>
                      <p className="text-slate-700 leading-relaxed">{crit.levels[1]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowRubricModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Cerrar Rúbrica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Final Seal Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
              ¿Deseas finalizar y enviar tu examen?
            </h3>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Verifica el resumen de respuestas antes de continuar. Al enviar, tu examen quedará{' '}
              <strong>sellado permanentemente</strong> y se generará tu reporte de desempeño. No será posible realizar un segundo intento.
            </p>

            {/* Verification checklist */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2.5 text-xs mb-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Pensamiento Lógico-Matemático:</span>
                <span
                  className={`font-bold ${
                    mathAnsweredCount === 32 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {mathAnsweredCount} de 32 respondidas
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Competencia Lingüística (OM):</span>
                <span
                  className={`font-bold ${
                    spanishAnsweredCount === 30 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {spanishAnsweredCount} de 30 respondidas
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Ensayo Argumentativo:</span>
                <span
                  className={`font-bold ${
                    essayWords >= 350 && essayWords <= 450
                      ? 'text-emerald-700'
                      : essayWords > 0
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {essayWords} palabras {essayWords >= 350 && essayWords <= 450 ? '(En rango)' : ''}
                </span>
              </div>

              {flaggedMath.length + flaggedSpanish.length > 0 && (
                <div className="pt-1 text-amber-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Tienes {flaggedMath.length + flaggedSpanish.length} reactivo(s) marcados con bandera.
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Regresar y revisar
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirmar y Sellar Examen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
