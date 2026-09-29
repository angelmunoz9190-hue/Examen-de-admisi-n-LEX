import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Award,
  ExternalLink,
  Download,
  Eye,
  Edit3,
  RotateCcw,
  Plus,
  RefreshCw,
  AlertTriangle,
  FileText,
  Sliders,
  Filter,
} from 'lucide-react';
import { FullExamSubmission } from '../types/exam';
import { ESSAY_RUBRIC, ESSAY_PROMPT } from '../data/spanishExamData';
import {
  createAdmissionSpreadsheet,
  appendExamSubmissionToSheet,
  appendEssayEvaluationToSheet,
  getSavedSpreadsheetId,
  saveSpreadsheetId,
  getSavedWebhookUrl,
  saveWebhookUrl,
  sendSubmissionToWebhook,
  getGoogleAppsScriptTemplate,
} from '../services/googleSheets';
import {
  saveSubmission,
  resetApplicantSubmission,
  getAllSubmissions,
} from '../services/storage';
import { calculateExamReport } from '../services/scoring';
import {
  Copy,
  Check,
  Code2,
  HelpCircle,
  Link as LinkIcon,
  ShieldAlert,
} from 'lucide-react';

interface AdminDashboardProps {
  submissions: FullExamSubmission[];
  onRefreshSubmissions: () => void;
  onViewReport: (submission: FullExamSubmission) => void;
  accessToken: string | null;
  googleUserEmail: string | null;
  onGoogleSignIn: () => void;
  onOpenOAuthHelp?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  submissions,
  onRefreshSubmissions,
  onViewReport,
  accessToken,
  googleUserEmail,
  onGoogleSignIn,
  onOpenOAuthHelp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending-essay' | 'evaluated'>('all');
  const [spreadsheetId, setSpreadsheetId] = useState(getSavedSpreadsheetId() || '');
  const [webhookUrl, setWebhookUrl] = useState(getSavedWebhookUrl() || '');
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isSyncingWebhook, setIsSyncingWebhook] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showOAuthHelp, setShowOAuthHelp] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [integrationMethod, setIntegrationMethod] = useState<'webhook' | 'oauth'>('webhook');

  // Essay grading modal state
  const [gradingSubmission, setGradingSubmission] = useState<FullExamSubmission | null>(null);
  const [evalScores, setEvalScores] = useState<Record<string, number>>({
    'criterio-1': 3,
    'criterio-2': 3,
    'criterio-3': 3,
    'criterio-4': 3,
    'criterio-5': 3,
  });
  const [evalNotes, setEvalNotes] = useState('');

  // Reset modal state
  const [resetCandidate, setResetCandidate] = useState<FullExamSubmission | null>(null);
  const [adminPin, setAdminPin] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      s.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student.folio.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'pending-essay') {
      return !s.answers.essay?.evaluation?.totalScore;
    }
    if (statusFilter === 'evaluated') {
      return !!s.answers.essay?.evaluation?.totalScore;
    }
    return true;
  });

  // Handle saving and syncing via Webhook
  const handleSaveWebhookUrl = (url: string) => {
    setWebhookUrl(url);
    saveWebhookUrl(url.trim());
  };

  const handleSyncAllToWebhook = async () => {
    const targetUrl = webhookUrl.trim();
    if (!targetUrl) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor ingresa primero la URL de tu aplicación web de Google Apps Script.',
      });
      return;
    }

    try {
      setIsSyncingWebhook(true);
      setStatusMessage(null);
      let count = 0;
      for (const sub of submissions) {
        await sendSubmissionToWebhook(targetUrl, sub);
        count++;
      }
      saveWebhookUrl(targetUrl);
      setStatusMessage({
        type: 'success',
        text: `¡Se enviaron ${count} registros a tu Google Sheet exitosamente vía Webhook!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Error al enviar al Webhook de Google Sheets: ' + (err.message || err.toString()),
      });
    } finally {
      setIsSyncingWebhook(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(getGoogleAppsScriptTemplate());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Create Google Sheet in user's Drive
  const handleCreateSheet = async () => {
    if (!accessToken) {
      onGoogleSignIn();
      return;
    }

    try {
      setIsCreatingSheet(true);
      setStatusMessage(null);
      const sheet = await createAdmissionSpreadsheet(accessToken);
      setSpreadsheetId(sheet.spreadsheetId);
      setStatusMessage({
        type: 'success',
        text: `¡Hoja de cálculo creada exitosamente en Google Drive! ID: ${sheet.spreadsheetId}`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error al crear la hoja en Google Drive',
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Sync all applicants to Google Sheets
  const handleSyncAllToSheets = async () => {
    if (!accessToken) {
      onGoogleSignIn();
      return;
    }

    const targetSheetId = spreadsheetId.trim();
    if (!targetSheetId) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor ingresa o crea una Hoja de Cálculo de Google primero.',
      });
      return;
    }

    try {
      setIsSyncingAll(true);
      setStatusMessage(null);

      let count = 0;
      for (const sub of submissions) {
        await appendExamSubmissionToSheet(accessToken, targetSheetId, sub);
        if (sub.answers.essay?.evaluation) {
          await appendEssayEvaluationToSheet(accessToken, targetSheetId, sub);
        }
        count++;
      }

      saveSpreadsheetId(targetSheetId);
      setStatusMessage({
        type: 'success',
        text: `Se sincronizaron exitosamente ${count} sustentante(s) con Google Sheets.`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error durante la sincronización a Google Sheets',
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Open grading modal
  const handleOpenGrading = (sub: FullExamSubmission) => {
    setGradingSubmission(sub);
    const existing = sub.answers.essay?.evaluation;
    if (existing) {
      setEvalScores(existing.finalScores);
      setEvalNotes(existing.evaluatorNotes || '');
    } else {
      setEvalScores({
        'criterio-1': 3,
        'criterio-2': 3,
        'criterio-3': 3,
        'criterio-4': 3,
        'criterio-5': 3,
      });
      setEvalNotes('');
    }
  };

  // Save grading
  const handleSaveGrading = async () => {
    if (!gradingSubmission) return;

    const totalScore = Object.values(evalScores).reduce((a, b) => a + b, 0);

    const updatedSubmission: FullExamSubmission = {
      ...gradingSubmission,
      answers: {
        ...gradingSubmission.answers,
        essay: {
          ...gradingSubmission.answers.essay,
          evaluation: {
            evaluator1Scores: evalScores,
            evaluator2Scores: evalScores,
            finalScores: evalScores,
            totalScore,
            evaluatorNotes: evalNotes,
            evaluatedAt: new Date().toISOString(),
          },
        },
      },
    };

    // Re-score report with the essay points included
    const updatedReport = calculateExamReport(
      updatedSubmission.student,
      updatedSubmission.answers,
      gradingSubmission.report.timeSpentSeconds
    );
    updatedSubmission.report = updatedReport;

    saveSubmission(updatedSubmission);
    onRefreshSubmissions();

    // If Google Sheets is connected, sync this evaluation
    if (accessToken && spreadsheetId.trim()) {
      try {
        await appendEssayEvaluationToSheet(accessToken, spreadsheetId.trim(), updatedSubmission);
      } catch (e) {
        console.error('Error syncing essay evaluation to sheet:', e);
      }
    }

    setGradingSubmission(null);
  };

  // Reset exam attempt
  const handleConfirmReset = () => {
    if (!resetCandidate) return;
    if (adminPin.trim() !== 'LEX2026') {
      setResetError('PIN de autorización incorrecto. Utiliza LEX2026.');
      return;
    }

    resetApplicantSubmission(resetCandidate.student.email);
    onRefreshSubmissions();
    setResetCandidate(null);
    setAdminPin('');
    setResetError(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (submissions.length === 0) return;

    const headers = [
      'Folio',
      'Nombre',
      'Email',
      'Fecha',
      'Aciertos Mat (/32)',
      'Porcentaje Mat',
      'Aciertos Esp OM (/30)',
      'Porcentaje Esp OM',
      'Palabras Ensayo',
      'Calif Ensayo (/20)',
      'Porcentaje Global',
      'Banda Desempeño',
    ];

    const rows = submissions.map((s) => [
      s.student.folio,
      `"${s.student.fullName}"`,
      s.student.email,
      new Date(s.report.submittedAt).toLocaleDateString('es-MX'),
      s.report.math.score,
      `${s.report.math.percentage}%`,
      s.report.spanish.scoreOM,
      `${s.report.spanish.percentageOM}%`,
      s.report.spanish.essayWordCount,
      s.report.spanish.essayScore ?? 'Pendiente',
      `${s.report.globalScorePercentage}%`,
      s.report.performanceBand,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `admision_lex_resultados_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header and Summary stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
            Comité Académico · Admisión LEX
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Panel de Control y Calificación
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Revisión de instrumentos, evaluación de ensayos con rúbrica oficial y sincronización con Google Sheets.
          </p>
        </div>

        {/* Global Export button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Connection Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                Sincronización con Google Sheets
              </h3>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl mt-1 leading-relaxed">
              Guarda y actualiza automáticamente los registros de aspirantes, respuestas desglosadas (R1 a R32 de Matemáticas y R1 a R30 de Español) y evaluaciones de ensayos en Google Sheets.
            </p>
          </div>

          {/* Toggle between methods */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start lg:self-center border border-slate-200">
            <button
              onClick={() => setIntegrationMethod('webhook')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                integrationMethod === 'webhook'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Método 1: Apps Script (Recomendado)
            </button>
            <button
              onClick={() => setIntegrationMethod('oauth')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                integrationMethod === 'oauth'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Método 2: Google OAuth
            </button>
          </div>
        </div>

        {/* METHOD 1: Webhook via Google Apps Script (No 403, No permissions needed) */}
        {integrationMethod === 'webhook' && (
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <Check className="w-3 h-3 text-emerald-700" />
                  100% Automático · Sin errores de permisos ni verificación de Google
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                  Conexión directa mediante Google Apps Script
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Ideal para cuentas institucionales (como <strong className="text-slate-800">servicios.escolares@ihmexico.com</strong>). Solo copias el script en tu hoja de cálculo una sola vez y todas las respuestas de los aspirantes se enviarán directamente.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowScriptModal(true)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Code2 className="w-4 h-4 text-emerald-600" />
                <span>Ver y Copiar Código Apps Script</span>
              </button>
            </div>

            {/* Webhook URL Input */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <LinkIcon className="w-3.5 h-3.5" />
                </div>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => handleSaveWebhookUrl(e.target.value)}
                  placeholder="Pega aquí la URL de tu aplicación web (https://script.google.com/macros/s/.../exec)"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <button
                type="button"
                onClick={handleSyncAllToWebhook}
                disabled={isSyncingWebhook || !webhookUrl.trim()}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWebhook ? 'animate-spin' : ''}`} />
                <span>{isSyncingWebhook ? 'Enviando...' : 'Sincronizar Todos a la Hoja'}</span>
              </button>
            </div>

            <p className="text-[11px] text-emerald-800/80">
              💡 Al guardar esta URL, cualquier sustentante que finalice su examen se registrará inmediatamente en tu Google Sheet sin tener que iniciar sesión en Google.
            </p>
          </div>
        )}

        {/* METHOD 2: OAuth Direct Integration */}
        {integrationMethod === 'oauth' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Conexión con Cuenta de Google
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {googleUserEmail
                    ? `Sesión activa con ${googleUserEmail}`
                    : 'Permite crear la hoja directamente desde el navegador.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!googleUserEmail ? (
                  <button
                    onClick={onGoogleSignIn}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Conectar Cuenta de Google</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCreateSheet}
                      disabled={isCreatingSheet}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isCreatingSheet ? 'Creando...' : 'Crear Hoja en Google Drive'}</span>
                    </button>

                    <button
                      onClick={handleSyncAllToSheets}
                      disabled={isSyncingAll || !spreadsheetId.trim()}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 ${isSyncingAll ? 'animate-spin' : ''}`} />
                      <span>{isSyncingAll ? 'Sincronizando...' : 'Sincronizar a Sheets'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Error 403 solution explainer card */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">
                      ¿Te apareció «Acceso bloqueado: la app no completó el proceso de verificación (Error 403: access_denied)»?
                    </span>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Esto ocurre en Google Cloud cuando la aplicación está en modo de prueba (Testing). Puedes solucionarlo de 2 formas:
                    </p>
                  </div>
                </div>

                {onOpenOAuthHelp && (
                  <button
                    type="button"
                    onClick={onOpenOAuthHelp}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-2xs transition-colors shrink-0 cursor-pointer"
                  >
                    Abrir Guía Detallada
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px]">
                <div className="p-3 rounded-xl bg-white border border-amber-200">
                  <span className="font-bold text-emerald-800 block mb-1">
                    Opción A: Usa el Método 1 (Apps Script)
                  </span>
                  <p className="text-slate-600">
                    Es la más rápida y confiable: creas tu hoja en Google Sheets desde <strong className="text-slate-800">servicios.escolares@ihmexico.com</strong>, pegas el código y funciona al instante sin permisos especiales ni pantallas de error de Google.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-amber-200">
                  <span className="font-bold text-indigo-900 block mb-1">
                    Opción B: Agregar usuario en Google Cloud
                  </span>
                  <p className="text-slate-600">
                    1. Entra a <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-semibold">console.cloud.google.com</a> con <span className="font-mono">angelmunoz9190@gmail.com</span>.<br />
                    2. Ve a <strong>APIs y servicios</strong> &gt; <strong>Pantalla de consentimiento de OAuth</strong>.<br />
                    3. En la sección <strong>Usuarios de prueba</strong>, agrega <strong className="text-slate-800">servicios.escolares@ihmexico.com</strong> y guarda.
                  </p>
                </div>
              </div>
            </div>

            {/* Spreadsheet ID input & link */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-80">
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => {
                    setSpreadsheetId(e.target.value);
                    saveSpreadsheetId(e.target.value);
                  }}
                  placeholder="ID de Hoja de Cálculo existente"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {spreadsheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 inline-flex"
                >
                  <span>Abrir Hoja en Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Status message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Candidates List Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por aspirante, folio o correo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-indigo-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({submissions.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending-essay')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'pending-essay'
                  ? 'bg-indigo-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Ensayo Pendiente
            </button>
            <button
              onClick={() => setStatusFilter('evaluated')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'evaluated'
                  ? 'bg-indigo-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Evaluados
            </button>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="overflow-x-auto">
          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <Users className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
              <p className="font-semibold text-slate-700">No hay sustentantes registrados aún</p>
              <p className="mt-1 text-slate-400">
                Los aspirantes aparecerán aquí en cuanto comiencen o concluyan su examen de admisión.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3 text-left">Aspirante</th>
                  <th className="px-4 py-3 text-left">Folio Oficial</th>
                  <th className="px-4 py-3 text-center">Matemáticas</th>
                  <th className="px-4 py-3 text-center">Español OM</th>
                  <th className="px-4 py-3 text-center">Ensayo</th>
                  <th className="px-4 py-3 text-center">Puntaje Global</th>
                  <th className="px-4 py-3 text-center">Banda</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSubmissions.map((sub) => {
                  const hasGradedEssay = !!sub.answers.essay?.evaluation?.totalScore;

                  return (
                    <tr key={sub.student.folio} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Email */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{sub.student.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{sub.student.email}</div>
                      </td>

                      {/* Folio */}
                      <td className="px-4 py-3.5 font-mono text-indigo-900 font-bold">
                        {sub.student.folio}
                      </td>

                      {/* Math score */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-slate-900">{sub.report.math.score}</span>
                        <span className="text-slate-400 font-medium">/32</span>
                        <span className="text-[10px] text-sky-700 block font-semibold">
                          ({sub.report.math.percentage}%)
                        </span>
                      </td>

                      {/* Spanish OM */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-bold text-slate-900">{sub.report.spanish.scoreOM}</span>
                        <span className="text-slate-400 font-medium">/30</span>
                        <span className="text-[10px] text-indigo-700 block font-semibold">
                          ({sub.report.spanish.percentageOM}% )
                        </span>
                      </td>

                      {/* Essay status */}
                      <td className="px-4 py-3.5 text-center">
                        {hasGradedEssay ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            {sub.answers.essay.evaluation?.totalScore}/20 pts
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenGrading(sub)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-amber-600" />
                            <span>Calificar ({sub.report.spanish.essayWordCount} pal.)</span>
                          </button>
                        )}
                      </td>

                      {/* Global percentage */}
                      <td className="px-4 py-3.5 text-center font-bold text-slate-900 text-sm">
                        {sub.report.globalScorePercentage}%
                      </td>

                      {/* Performance band */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            sub.report.performanceBand === 'Sobresaliente'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : sub.report.performanceBand === 'Satisfactorio'
                              ? 'bg-sky-50 text-sky-800 border border-sky-200'
                              : sub.report.performanceBand === 'Básico'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {sub.report.performanceBand}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewReport(sub)}
                            className="p-1.5 rounded-lg text-indigo-700 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Ver Reporte Oficial de Desempeño"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenGrading(sub)}
                            className="p-1.5 rounded-lg text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                            title="Calificar o editar dictamen de ensayo"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setResetCandidate(sub)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Autorizar reintento excepcional"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Essay Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                  Dictamen de Ensayo Argumentativo
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  Calificación: {gradingSubmission.student.fullName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Folio: {gradingSubmission.student.folio} · {gradingSubmission.report.spanish.essayWordCount} palabras entregadas
                </p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Candidate's Essay Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Texto Escrito por el Sustentante
                  </h4>
                  <span className="text-xs font-mono text-slate-500">
                    {gradingSubmission.report.spanish.essayWordCount} palabras
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-serif text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto">
                  {gradingSubmission.answers.essay?.text || (
                    <span className="text-slate-400 italic">El sustentante no redactó texto para el ensayo.</span>
                  )}
                </div>
              </div>

              {/* Right Column: 5 Rubric Criteria Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Rúbrica Analítica (1 a 4 puntos por criterio)
                </h4>

                {ESSAY_RUBRIC.map((crit) => (
                  <div key={crit.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-950">{crit.name}</span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                        {evalScores[crit.id] || 3} / 4 pts
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[4, 3, 2, 1].map((lvl) => {
                        const isSelected = evalScores[crit.id] === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setEvalScores((prev) => ({ ...prev, [crit.id]: lvl }))}
                            className={`p-2 rounded-xl border text-[11px] text-center font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{lvl} pts</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Observaciones Pedagógicas del Comité
                  </label>
                  <textarea
                    rows={3}
                    value={evalNotes}
                    onChange={(e) => setEvalNotes(e.target.value)}
                    placeholder="Comentarios adicionales sobre la calidad argumentativa, coherencia o recomendaciones..."
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                {/* Total */}
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-950">Calificación Final del Ensayo:</span>
                  <span className="text-lg font-mono font-extrabold text-purple-900">
                    {Object.values(evalScores).reduce((a, b) => a + b, 0)} / 20 puntos
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveGrading}
                className="px-6 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Guardar Dictamen y Actualizar Reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-attempt / Reset Candidate Modal */}
      {resetCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Autorizar Reintento Excepcional
            </h3>

            <p className="text-xs text-slate-600 mt-1 mb-4 leading-relaxed">
              Estás a punto de desbloquear el acceso para{' '}
              <strong className="text-slate-900">{resetCandidate.student.fullName}</strong> ({resetCandidate.student.email}).
              Esto eliminará su entrega actual para permitirle un nuevo ingreso.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ingresa el PIN de Autorización Académica (LEX2026):
                </label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="PIN"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              {resetError && (
                <p className="text-xs text-rose-600 font-semibold">{resetError}</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setResetCandidate(null);
                  setAdminPin('');
                  setResetError(null);
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Desbloquear Sustentante
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Google Apps Script Integration Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Instrucciones de Conexión con Google Sheets
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    100% libre de errores de verificación y compatible con cuentas institucionales
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Step by Step list */}
            <div className="space-y-4 text-xs text-slate-700 mb-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="font-bold uppercase tracking-wider text-slate-800 text-[11px]">
                  Pasos sencillos para vincular tu Google Sheet (tarda 1 minuto):
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed text-slate-600">
                  <li>
                    Abre tu hoja de Google Sheets (desde <strong className="text-slate-800">servicios.escolares@ihmexico.com</strong> o la cuenta que desees).
                  </li>
                  <li>
                    En el menú superior de Google Sheets, ve a: <span className="font-semibold text-slate-800">Extensiones &gt; Apps Script</span>.
                  </li>
                  <li>
                    Borra cualquier código que aparezca en el editor y <strong>pega el código de abajo</strong>.
                  </li>
                  <li>
                    Haz clic en el botón azul <strong className="text-indigo-700">Implementar</strong> (arriba a la derecha) &gt; <span className="font-semibold text-slate-800">Nueva implementación</span>.
                  </li>
                  <li>
                    En el engranaje ⚙️ de la izquierda selecciona <span className="font-semibold text-slate-800">Aplicación web</span>.
                  </li>
                  <li>
                    En <strong>«Quién tiene acceso» (Who has access)</strong>, selecciona: <span className="font-bold text-emerald-800 bg-emerald-50 px-1 rounded">Cualquier persona (Anyone)</span>.
                  </li>
                  <li>
                    Haz clic en <strong>Implementar</strong>, autoriza los permisos y copia la <strong>URL de la aplicación web</strong> generada.
                  </li>
                  <li>
                    Pega esa URL en la casilla de la app y ¡listo! Todas las entregas se guardarán automáticamente en tu hoja.
                  </li>
                </ol>
              </div>

              {/* Code Box with Copy Button */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 text-xs">Código para copiar:</span>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? '¡Copiado al portapapeles!' : 'Copiar Código'}</span>
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
                  {getGoogleAppsScriptTemplate()}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowScriptModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Entendido, cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
