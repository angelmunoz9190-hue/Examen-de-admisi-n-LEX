import React, { useState } from 'react';
import {
  Award,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  Calendar,
  Clock,
  User,
  Hash,
  Download,
  BookOpen,
  Calculator,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { FullExamSubmission } from '../types/exam';

interface PerformanceReportProps {
  submission: FullExamSubmission;
  onSyncGoogleSheets?: () => void;
  isSyncingSheets?: boolean;
  googleSheetsUrl?: string;
  onReturnToDashboard?: () => void;
}

export const PerformanceReport: React.FC<PerformanceReportProps> = ({
  submission,
  onSyncGoogleSheets,
  isSyncingSheets,
  googleSheetsUrl,
  onReturnToDashboard,
}) => {
  const { student, report, answers } = submission;
  const [copied, setCopied] = useState(false);

  const durationMin = Math.round(report.timeSpentSeconds / 60);

  const getBandColor = (band: string) => {
    switch (band) {
      case 'Sobresaliente':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'Satisfactorio':
        return 'bg-sky-50 text-sky-800 border-sky-300';
      case 'Básico':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      default:
        return 'bg-rose-50 text-rose-800 border-rose-300';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyFolio = () => {
    navigator.clipboard.writeText(student.folio);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top action bar (hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
        {onReturnToDashboard && (
          <button
            onClick={onReturnToDashboard}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            ← Volver al Panel
          </button>
        )}

        <div className="flex items-center gap-3 ml-auto">
          {onSyncGoogleSheets && (
            <button
              onClick={onSyncGoogleSheets}
              disabled={isSyncingSheets}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{isSyncingSheets ? 'Sincronizando...' : 'Sincronizar a Google Sheets'}</span>
            </button>
          )}

          {googleSheetsUrl && (
            <a
              href={googleSheetsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Ver Hoja en Google Sheets</span>
            </a>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar en PDF</span>
          </button>
        </div>
      </div>

      {/* Official Certificate / Report Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden print:border-none print:shadow-none print:m-0">
        {/* Institutional Letterhead */}
        <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-sky-900 text-white p-6 sm:p-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-sky-200 mb-3 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5" />
                Reporte Oficial de Desempeño y Calificación
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                International House Cuernavaca
              </h1>
              <p className="text-sm sm:text-base text-indigo-100 font-medium mt-1">
                Licenciatura en Enseñanza de Lenguas Extranjeras (LEX)
              </p>
              <p className="text-xs text-sky-200/90 mt-0.5">
                Proceso de Admisión · Versión Unificada de Instrumentos
              </p>
            </div>

            {/* Overall Score Badge */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 text-center sm:text-right shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-indigo-200 block font-bold">
                Puntaje Global
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white mt-0.5">
                {report.globalScorePercentage}%
              </div>
              <div className="mt-2">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white text-indigo-950 shadow-xs">
                  {report.performanceBand}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Identity Meta Header */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 sm:px-10 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Aspirante:</span>
              <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Correo Electrónico:</span>
              <span className="font-mono text-slate-800">{student.email}</span>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Folio de Registro:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-indigo-900">{student.folio}</span>
                <button
                  type="button"
                  onClick={handleCopyFolio}
                  className="text-[10px] text-slate-400 hover:text-indigo-600 print:hidden cursor-pointer"
                >
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">Fecha de Aplicación:</span>
              <span className="font-semibold text-slate-800">
                {new Date(report.submittedAt).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-10 space-y-10">
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Math card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-sky-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Matemáticas
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-sky-800">
                  {report.math.percentage}%
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {report.math.score}{' '}
                <span className="text-sm font-semibold text-slate-500">/ 32 reactivos</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-sky-600 h-full rounded-full"
                  style={{ width: `${report.math.percentage}%` }}
                />
              </div>
            </div>

            {/* Spanish Multiple Choice card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Español (Opción Múltiple)
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-800">
                  {report.spanish.percentageOM}%
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {report.spanish.scoreOM}{' '}
                <span className="text-sm font-semibold text-slate-500">/ 30 reactivos</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${report.spanish.percentageOM}%` }}
                />
              </div>
            </div>

            {/* Essay Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Ensayo Argumentativo
                  </span>
                </div>
                <span className="text-xs font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  {report.spanish.essayEvaluated ? 'Evaluado' : 'En Revisión'}
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">
                {report.spanish.essayEvaluated ? (
                  <>
                    {report.spanish.essayScore}{' '}
                    <span className="text-sm font-semibold text-slate-500">/ 20 puntos</span>
                  </>
                ) : (
                  <span className="text-base font-medium text-slate-600">
                    {report.spanish.essayWordCount} palabras entregadas
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                {report.spanish.essayInWordRange
                  ? 'Cumplió rango formal (350–450 palabras)'
                  : `${report.spanish.essayWordCount} palabras registradas`}
              </p>
            </div>
          </div>

          {/* Instrument 1 Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Calculator className="w-5 h-5 text-sky-700" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Instrumento 1: Pensamiento Lógico-Matemático
              </h3>
            </div>

            {/* Sections Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Desempeño por Secciones Temáticas
                </h4>
                {report.math.sections.map((sec, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between font-medium mb-1">
                      <span className="text-slate-700 truncate pr-2">{sec.name}</span>
                      <span className="font-mono text-slate-900 font-bold shrink-0">
                        {sec.correct}/{sec.total} ({sec.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sec.percentage >= 70
                            ? 'bg-emerald-500'
                            : sec.percentage >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${sec.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Cognitive level Bloom */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Nivel Cognitivo (Taxonomía de Bloom Revisada)
                </h4>
                {report.math.cognitive.map((cog, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between font-medium mb-1">
                      <span className="text-slate-700">{cog.level}</span>
                      <span className="font-mono text-slate-900 font-bold">
                        {cog.correct}/{cog.total} ({cog.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${cog.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Instrument 2 Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <BookOpen className="w-5 h-5 text-indigo-700" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Instrumento 2: Competencia Lingüística en Español
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* MCCEMS categories */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Categorías MCCEMS de la NEM
                </h4>
                {report.spanish.categories.map((cat, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between font-medium mb-1">
                      <span className="text-slate-700 truncate pr-2">{cat.name}</span>
                      <span className="font-mono text-slate-900 font-bold shrink-0">
                        {cat.correct}/{cat.total} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          cat.percentage >= 70
                            ? 'bg-emerald-500'
                            : cat.percentage >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Cognitive level Spanish */}
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Nivel Cognitivo (Taxonomía de Bloom)
                </h4>
                {report.spanish.cognitive.map((cog, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between font-medium mb-1">
                      <span className="text-slate-700">{cog.level}</span>
                      <span className="font-mono text-slate-900 font-bold">
                        {cog.correct}/{cog.total} ({cog.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${cog.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Essay Evaluation details if graded */}
            {answers.essay?.evaluation && (
              <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950">
                    Dictamen de Evaluación del Ensayo
                  </h4>
                  <span className="text-xs font-bold text-purple-900">
                    {answers.essay.evaluation.totalScore} / 20 puntos
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs mb-3">
                  <div className="p-2 rounded-xl bg-white border border-purple-200 text-center">
                    <span className="text-[10px] text-slate-500 block">Tesis y Arg.</span>
                    <span className="font-bold text-slate-900">
                      {answers.essay.evaluation.finalScores['criterio-1'] || '-'}/4
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-purple-200 text-center">
                    <span className="text-[10px] text-slate-500 block">Organización</span>
                    <span className="font-bold text-slate-900">
                      {answers.essay.evaluation.finalScores['criterio-2'] || '-'}/4
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-purple-200 text-center">
                    <span className="text-[10px] text-slate-500 block">Corrección</span>
                    <span className="font-bold text-slate-900">
                      {answers.essay.evaluation.finalScores['criterio-3'] || '-'}/4
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-purple-200 text-center">
                    <span className="text-[10px] text-slate-500 block">Léxico y Reg.</span>
                    <span className="font-bold text-slate-900">
                      {answers.essay.evaluation.finalScores['criterio-4'] || '-'}/4
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-purple-200 text-center col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 block">Uso Responsable</span>
                    <span className="font-bold text-slate-900">
                      {answers.essay.evaluation.finalScores['criterio-5'] || '-'}/4
                    </span>
                  </div>
                </div>

                {answers.essay.evaluation.evaluatorNotes && (
                  <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-purple-100">
                    «{answers.essay.evaluation.evaluatorNotes}»
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pedagogical Diagnostic & Recommendations */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Diagnóstico Pedagógico y Recomendaciones de Fortalecimiento
              </h4>
            </div>

            <ul className="space-y-2 text-xs text-slate-700">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-600 font-bold">•</span>
                  <span className="leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Official Signatures & Verification Seal */}
          <div className="pt-10 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="w-48 border-b border-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-900">Comité de Admisión y Evaluación</p>
              <p className="text-slate-500">Licenciatura en Enseñanza de Lenguas Extranjeras</p>
              <p className="text-slate-400 text-[10px]">International House Cuernavaca</p>
            </div>

            <div>
              <div className="w-48 border-b border-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-900">{student.fullName}</p>
              <p className="text-slate-500">Firma del Sustentante</p>
              <p className="font-mono text-slate-400 text-[10px]">Folio: {student.folio}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 sm:px-10 py-3 text-center text-[10px] text-slate-500 border-t border-slate-200">
          Documento probatorio oficial emitido por el sistema de evaluación automatizado de International House Cuernavaca.
        </div>
      </div>
    </div>
  );
};
