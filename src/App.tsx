import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StudentRegistrationModal } from './components/StudentRegistrationModal';
import { ExamContainer } from './components/ExamContainer';
import { PerformanceReport } from './components/PerformanceReport';
import { AdminDashboard } from './components/AdminDashboard';
import { OAuthHelpModal } from './components/OAuthHelpModal';
import {
  StudentProfile,
  FullExamSubmission,
  ExamAnswers,
} from './types/exam';
import {
  getAllSubmissions,
  saveSubmission,
  saveActiveStudent,
  getActiveStudent,
  getSubmissionByEmail,
} from './services/storage';
import { calculateExamReport } from './services/scoring';
import {
  initAuth,
  signInWithGoogle,
  logoutGoogle,
  getAccessToken,
} from './services/auth';
import {
  appendExamSubmissionToSheet,
  getSavedSpreadsheetId,
  sendSubmissionToWebhook,
  getSavedWebhookUrl,
} from './services/googleSheets';

export default function App() {
  const [activeView, setActiveView] = useState<'exam' | 'admin' | 'report'>('exam');
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [submissions, setSubmissions] = useState<FullExamSubmission[]>([]);
  const [currentSubmission, setCurrentSubmission] = useState<FullExamSubmission | null>(null);

  // Google OAuth Auth State
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [showOAuthHelpModal, setShowOAuthHelpModal] = useState<boolean>(false);

  // Exam timer (115 minutes = 6900 seconds)
  const TOTAL_EXAM_SECONDS = 115 * 60;
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(TOTAL_EXAM_SECONDS);
  const [isExamRunning, setIsExamRunning] = useState<boolean>(false);

  // Initialize Auth & Submissions on mount
  useEffect(() => {
    // Submissions
    const existing = getAllSubmissions();
    setSubmissions(existing);

    // Active Student
    const active = getActiveStudent();
    if (active) {
      // Check if this student already finished
      const sub = getSubmissionByEmail(active.email);
      if (sub) {
        saveActiveStudent(null);
        setCurrentSubmission(sub);
        setActiveView('report');
      } else {
        setStudent(active);
        setIsExamRunning(true);
      }
    }

    // Google Auth listener
    initAuth(
      (user, token) => {
        setGoogleUserEmail(user.email);
        setAccessToken(token);
      },
      () => {
        setGoogleUserEmail(null);
        setAccessToken(null);
      }
    );
  }, []);

  // Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (isExamRunning && timeRemainingSeconds > 0) {
      timer = setInterval(() => {
        setTimeRemainingSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isExamRunning, timeRemainingSeconds]);

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    try {
      const res = await signInWithGoogle();
      if (res) {
        setGoogleUserEmail(res.user.email);
        setAccessToken(res.accessToken);
        setShowOAuthHelpModal(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Automatically open the solution guide so user is never stranded
      setShowOAuthHelpModal(true);
    }
  };

  const handleGoogleSignOut = async () => {
    await logoutGoogle();
    setGoogleUserEmail(null);
    setAccessToken(null);
  };

  // Start exam for an applicant
  const handleStartExam = (newStudent: StudentProfile) => {
    setStudent(newStudent);
    saveActiveStudent(newStudent);
    setIsExamRunning(true);
    setActiveView('exam');
  };

  // Submit exam
  const handleSubmitExam = async (answers: ExamAnswers) => {
    if (!student) return;

    const timeSpent = TOTAL_EXAM_SECONDS - timeRemainingSeconds;
    const report = calculateExamReport(student, answers, timeSpent);

    const fullSubmission: FullExamSubmission = {
      id: student.folio,
      student: {
        ...student,
        completedAt: new Date().toISOString(),
      },
      answers,
      report,
    };

    // Save locally
    saveSubmission(fullSubmission);
    saveActiveStudent(null);
    setStudent(null);
    setIsExamRunning(false);
    setCurrentSubmission(fullSubmission);

    const updated = getAllSubmissions();
    setSubmissions(updated);
    setActiveView('report');

    // 1. Auto-sync via Webhook (Google Apps Script) if configured
    const webhookUrl = getSavedWebhookUrl();
    if (webhookUrl) {
      try {
        await sendSubmissionToWebhook(webhookUrl, fullSubmission);
        fullSubmission.report.syncedToGoogleSheets = true;
        saveSubmission(fullSubmission);
        setSubmissions(getAllSubmissions());
      } catch (err) {
        console.error('Webhook sync failed:', err);
      }
    }

    // 2. Attempt auto-sync to Google Sheets OAuth if connected
    const currentToken = accessToken || getAccessToken();
    const sheetId = getSavedSpreadsheetId();
    if (currentToken && sheetId) {
      try {
        setIsSyncingSheets(true);
        await appendExamSubmissionToSheet(currentToken, sheetId, fullSubmission);
        fullSubmission.report.syncedToGoogleSheets = true;
        saveSubmission(fullSubmission);
        setSubmissions(getAllSubmissions());
      } catch (e) {
        console.error('Auto-sync to Google Sheets failed:', e);
      } finally {
        setIsSyncingSheets(false);
      }
    }
  };

  // Sync to Google Sheets manually from Report
  const handleManualSync = async () => {
    if (!currentSubmission) return;

    let token = accessToken || getAccessToken();
    if (!token) {
      const res = await signInWithGoogle();
      if (res) {
        token = res.accessToken;
        setAccessToken(res.accessToken);
        setGoogleUserEmail(res.user.email);
      } else {
        return;
      }
    }

    const sheetId = getSavedSpreadsheetId();
    if (!sheetId) {
      alert('Por favor configura primero la Hoja de Cálculo en el Panel del Comité Académico.');
      return;
    }

    try {
      setIsSyncingSheets(true);
      await appendExamSubmissionToSheet(token, sheetId, currentSubmission);
      currentSubmission.report.syncedToGoogleSheets = true;
      saveSubmission(currentSubmission);
      setSubmissions(getAllSubmissions());
    } catch (e: any) {
      alert(`Error al sincronizar con Google Sheets: ${e.message}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleRefreshSubmissions = () => {
    setSubmissions(getAllSubmissions());
  };

  const handleViewExistingReport = (sub: FullExamSubmission) => {
    setCurrentSubmission(sub);
    setActiveView('report');
  };

  const savedSheetId = getSavedSpreadsheetId();
  const googleSheetsUrl = savedSheetId
    ? `https://docs.google.com/spreadsheets/d/${savedSheetId}/edit`
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Institutional Top Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        student={student}
        timeRemainingSeconds={timeRemainingSeconds}
        isExamRunning={isExamRunning && activeView === 'exam'}
        googleUserEmail={googleUserEmail}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        spreadsheetId={savedSheetId}
        onOpenOAuthHelp={() => setShowOAuthHelpModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeView === 'exam' && (
          <>
            {!isExamRunning || !student ? (
              <StudentRegistrationModal
                onStartExam={handleStartExam}
                onViewExistingReport={handleViewExistingReport}
                googleUserEmail={googleUserEmail}
              />
            ) : (
              <ExamContainer
                student={student}
                onSubmitExam={handleSubmitExam}
                timeRemainingSeconds={timeRemainingSeconds}
              />
            )}
          </>
        )}

        {activeView === 'report' && currentSubmission && (
          <PerformanceReport
            submission={currentSubmission}
            onSyncGoogleSheets={handleManualSync}
            isSyncingSheets={isSyncingSheets}
            googleSheetsUrl={googleSheetsUrl}
            onReturnToDashboard={() => setActiveView('admin')}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard
            submissions={submissions}
            onRefreshSubmissions={handleRefreshSubmissions}
            onViewReport={(sub) => {
              setCurrentSubmission(sub);
              setActiveView('report');
            }}
            accessToken={accessToken}
            googleUserEmail={googleUserEmail}
            onGoogleSignIn={handleGoogleSignIn}
            onOpenOAuthHelp={() => setShowOAuthHelpModal(true)}
          />
        )}
      </main>

      {/* Help Modal for Google 403 / OAuth */}
      <OAuthHelpModal
        isOpen={showOAuthHelpModal}
        onClose={() => setShowOAuthHelpModal(false)}
        onOpenAppsScriptSetup={() => {
          setActiveView('admin');
        }}
      />

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} International House Cuernavaca · Licenciatura en Enseñanza de Lenguas Extranjeras (LEX)</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Marco Curricular Común de la EMS</span>
            <span>•</span>
            <span>Evaluación Estandarizada</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
