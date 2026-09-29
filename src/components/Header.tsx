import React from 'react';
import {
  GraduationCap,
  Clock,
  User as UserIcon,
  ShieldCheck,
  LayoutDashboard,
  FileSpreadsheet,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { StudentProfile } from '../types/exam';

interface HeaderProps {
  activeView: 'exam' | 'admin' | 'report';
  setActiveView: (view: 'exam' | 'admin' | 'report') => void;
  student: StudentProfile | null;
  timeRemainingSeconds?: number;
  isExamRunning?: boolean;
  googleUserEmail?: string | null;
  onGoogleSignIn?: () => void;
  onGoogleSignOut?: () => void;
  spreadsheetId?: string | null;
  onOpenOAuthHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  student,
  timeRemainingSeconds = 0,
  isExamRunning = false,
  googleUserEmail,
  onGoogleSignIn,
  onGoogleSignOut,
  spreadsheetId,
  onOpenOAuthHelp,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemainingSeconds < 600 && isExamRunning; // under 10 minutes

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Institution Branding */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-sky-700 flex items-center justify-center text-white shadow-md shadow-indigo-900/10 shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-indigo-950 uppercase">
                  International House Cuernavaca
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Admisión LEX
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-semibold text-slate-800 truncate">
                Licenciatura en Enseñanza de Lenguas Extranjeras
              </h1>
            </div>
          </div>

          {/* Center: Timer if exam is running */}
          {isExamRunning && (
            <div
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border text-sm font-semibold transition-all ${
                isLowTime
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <Clock className={`w-4 h-4 ${isLowTime ? 'text-rose-600' : 'text-slate-500'}`} />
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 hidden sm:inline">
                  Tiempo:
                </span>
                <span className="font-mono text-base font-bold tabular-nums">
                  {formatTime(timeRemainingSeconds)}
                </span>
              </div>
              {isLowTime && (
                <AlertTriangle className="w-4 h-4 text-rose-600 hidden sm:inline" />
              )}
            </div>
          )}

          {/* Right Controls: Views & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Candidate Identity Pill */}
            {student && (
              <div className="hidden lg:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]">
                  {student.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900 leading-tight truncate max-w-[130px]">
                    {student.fullName}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">{student.folio}</p>
                </div>
              </div>
            )}

            {/* Mode switch */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs font-medium">
              <button
                onClick={() => setActiveView('exam')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeView === 'exam'
                    ? 'bg-white text-indigo-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Examen</span>
              </button>

              <button
                onClick={() => setActiveView('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  activeView === 'admin'
                    ? 'bg-white text-indigo-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Comité Académico</span>
                <span className="sm:hidden">Admin</span>
              </button>
            </div>

            {/* Google Sheets / Auth status button */}
            {googleUserEmail ? (
              <div className="relative group">
                <button
                  onClick={onGoogleSignOut}
                  title={`Conectado como ${googleUserEmail}. Clic para desconectar.`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden xl:inline max-w-[120px] truncate">{googleUserEmail}</span>
                  <LogOut className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {onGoogleSignIn && (
                  <button
                    onClick={onGoogleSignIn}
                    title="Conectar con Google para sincronizar respuestas y calificaciones con Google Sheets"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="hidden md:inline">Google Sheets</span>
                  </button>
                )}
                {onOpenOAuthHelp && (
                  <button
                    onClick={onOpenOAuthHelp}
                    title="¿Problemas para vincular o Error 403? Haz clic para ver cómo solucionarlo"
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
