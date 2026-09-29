import React, { useState } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Calculator,
} from 'lucide-react';
import { StudentProfile, FullExamSubmission } from '../types/exam';
import {
  isEmailAlreadySubmitted,
  getSubmissionByEmail,
  generateFolio,
  getDraft,
} from '../services/storage';

interface StudentRegistrationModalProps {
  onStartExam: (student: StudentProfile) => void;
  onViewExistingReport: (submission: FullExamSubmission) => void;
  googleUserEmail?: string | null;
  googleDisplayName?: string | null;
  googlePhotoUrl?: string | null;
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  onStartExam,
  onViewExistingReport,
  googleUserEmail,
  googleDisplayName,
  googlePhotoUrl,
}) => {
  const [fullName, setFullName] = useState(googleDisplayName || '');
  const [email, setEmail] = useState(googleUserEmail || '');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<FullExamSubmission | null>(null);
  const [hasExistingDraft, setHasExistingDraft] = useState(false);

  // Check email on change or blur
  const checkEmailStatus = (checkEmail: string) => {
    const trimmed = checkEmail.trim().toLowerCase();
    if (!trimmed) {
      setExistingSubmission(null);
      setHasExistingDraft(false);
      return;
    }

    const submission = getSubmissionByEmail(trimmed);
    if (submission) {
      setExistingSubmission(submission);
      setHasExistingDraft(false);
    } else {
      setExistingSubmission(null);
      const draft = getDraft(trimmed);
      setHasExistingDraft(!!draft);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 5) {
      setError('Por favor ingresa tu nombre completo tal como figura en tu identificación oficial.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!acceptTerms) {
      setError('Debes declarar que eres el sustentante legítimo y aceptar los términos de la aplicación.');
      return;
    }

    // Strict single entry validation
    if (isEmailAlreadySubmitted(cleanEmail)) {
      const sub = getSubmissionByEmail(cleanEmail);
      if (sub) {
        setExistingSubmission(sub);
      }
      setError('Este correo electrónico ya cuenta con un examen de admisión registrado y completado.');
      return;
    }

    // Check if there is an existing draft to resume
    const draft = getDraft(cleanEmail);
    const folio = draft?.student?.folio || generateFolio();

    const studentProfile: StudentProfile = {
      fullName: cleanName,
      email: cleanEmail,
      folio,
      registeredAt: draft?.student?.registeredAt || new Date().toISOString(),
      startedAt: draft?.student?.startedAt || new Date().toISOString(),
      googleUid: undefined,
      googlePhoto: googlePhotoUrl || undefined,
    };

    onStartExam(studentProfile);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-sky-800 px-6 py-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-xs text-sky-200 mb-3 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5" />
            Convocatoria de Admisión Oficial
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Examen de Admisión LEX
          </h2>
          <p className="text-sm text-indigo-100 mt-1.5 font-medium">
            Licenciatura en Enseñanza de Lenguas Extranjeras · International House Cuernavaca
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {existingSubmission ? (
            /* Warning if candidate already finished */
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Examen Ya Presentado
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                El sustentante con el correo <span className="font-semibold text-slate-900">{existingSubmission.student.email}</span> ya realizó y selló su examen de admisión. Por norma institucional, solo se permite un único intento.
              </p>

              <div className="bg-white p-4 rounded-xl border border-amber-200 text-left text-xs mb-5 space-y-1">
                <p>
                  <span className="text-slate-500 font-medium">Aspirante:</span>{' '}
                  <span className="font-semibold text-slate-800">{existingSubmission.student.fullName}</span>
                </p>
                <p>
                  <span className="text-slate-500 font-medium">Folio Oficial:</span>{' '}
                  <span className="font-mono font-bold text-indigo-700">{existingSubmission.student.folio}</span>
                </p>
                <p>
                  <span className="text-slate-500 font-medium">Fecha de Envío:</span>{' '}
                  <span className="text-slate-700 font-medium">
                    {new Date(existingSubmission.report.submittedAt).toLocaleString('es-MX')}
                  </span>
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => onViewExistingReport(existingSubmission)}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-950/10 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Ver Mi Reporte de Resultados Oficial
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExistingSubmission(null);
                    setEmail('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 py-1"
                >
                  Ingresar con otro correo electrónico
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Instrument Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Instrumento 1
                    </h4>
                    <p className="text-xs font-semibold text-slate-900">Pensamiento Lógico-Matemático</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">32 reactivos de opción múltiple</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Instrumento 2
                    </h4>
                    <p className="text-xs font-semibold text-slate-900">Competencia Lingüística</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">30 reactivos + 1 Ensayo (350–450 pal.)</p>
                  </div>
                </div>
              </div>

              {/* Informative Note */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50/70 border border-sky-200/80 text-xs text-sky-900">
                <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                <span>
                  Tiempo estimado: <strong>115 minutos</strong>. El sistema guarda automáticamente tus respuestas en tiempo real.
                </span>
              </div>

              {hasExistingDraft && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Hemos detectado un intento en progreso para este correo. Al hacer clic en <strong>Continuar Examen</strong> podrás retomarlo justo donde te quedaste.
                  </span>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Input: Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nombre Completo del Aspirante <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. María Elena Fernández Rosas"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Escribe tu nombre con apellidos exactamente como aparece en tu certificado de bachillerato.
                </p>
              </div>

              {/* Input: Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Correo Electrónico <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      checkEmailStatus(e.target.value);
                    }}
                    onBlur={() => checkEmailStatus(email)}
                    placeholder="aspirante@ejemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Este correo autentica tu identidad y se utilizará para vincular tus resultados oficiales en Google Sheets.
                </p>
              </div>

              {/* Verification & Terms checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    Declaro bajo protesta de decir verdad que soy el sustentante registrado, que resolveré el examen de manera personal e individual sin auxilio no permitido, y entiendo que <strong>solo se permite un intento de aplicación</strong>.
                  </span>
                </label>
              </div>

              {/* Start Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-900 to-sky-800 hover:from-indigo-800 hover:to-sky-700 text-white font-bold text-sm shadow-md shadow-indigo-950/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{hasExistingDraft ? 'Continuar Mi Examen en Progreso' : 'Iniciar Examen de Admisión'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
