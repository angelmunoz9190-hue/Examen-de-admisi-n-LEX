import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  ExternalLink,
  Code2,
  CheckCircle2,
  Copy,
  ChevronRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { getGoogleAppsScriptTemplate } from '../services/googleSheets';

interface OAuthHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAppsScriptSetup: () => void;
}

export const OAuthHelpModal: React.FC<OAuthHelpModalProps> = ({
  isOpen,
  onClose,
  onOpenAppsScriptSetup,
}) => {
  const [activeTab, setActiveTab] = useState<'recommended' | 'cloud_console'>('recommended');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(getGoogleAppsScriptTemplate());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Solución al Error 403: Acceso Bloqueado de Google
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                ¿Por qué ocurre y cómo conectar tu hoja de Google Sheets de inmediato?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cause Banner */}
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-start gap-3 text-xs text-amber-950">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Google bloquea cuentas institucionales (como <strong className="text-amber-900 font-mono">servicios.escolares@ihmexico.com</strong>) porque el proyecto de Google Cloud está en estado <em>«Modo de prueba (Testing)»</em>. Elige abajo la opción que prefieras para resolverlo:
          </p>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('recommended')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'recommended'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Opción 1: Google Apps Script (Recomendada)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud_console')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'cloud_console'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Opción 2: Habilitar Cuenta en Google Cloud</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'recommended' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Ventajas de este método:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-xs text-emerald-900/90 leading-relaxed">
                  <li><strong>Sin pantallas de error ni permisos de Google</strong>: funciona con cualquier correo institucional o personal.</li>
                  <li><strong>Los aspirantes no necesitan cuenta de Google</strong> para que sus respuestas se guarden automáticamente.</li>
                  <li>Crea las 4 pestañas formateadas (Resumen, Matemáticas, Español y Ensayos) en tiempo real.</li>
                </ul>
              </div>

              <div className="space-y-3 pt-1">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Pasos sencillos para activarlo (2 minutos):
                </h4>
                <ol className="space-y-2.5 text-xs text-slate-600 pl-1">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                    <span>Abre tu cuenta <strong className="text-slate-900">servicios.escolares@ihmexico.com</strong> y crea una hoja de cálculo nueva en Google Sheets.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                    <span>En el menú superior de la hoja, haz clic en <strong>Extensiones &gt; Apps Script</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                    <span>Borra cualquier texto que haya y pega el código pre-configurado de esta app.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">4</span>
                    <span>Haz clic en el botón azul superior <strong>Implementar &gt; Nueva implementación</strong>. Selecciona tipo <strong>«Aplicación web»</strong>, y en <em>«Quién tiene acceso»</em> pon <strong>«Cualquier persona»</strong> (Anyone).</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">5</span>
                    <span>Copia la URL que termina en <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">/exec</code> y pégala en la casilla de sincronización en esta app. ¡Eso es todo!</span>
                  </li>
                </ol>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>¡Código Copiado al Portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Código de Apps Script</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAppsScriptSetup();
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <span>Ir a Configurar en el Panel</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'cloud_console' && (
            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1.5">
                <span className="font-bold block text-sm">¿Cómo autorizar tu cuenta institucional para OAuth?</span>
                <p>
                  Para que Google permita el inicio de sesión directo con <strong className="font-mono">servicios.escolares@ihmexico.com</strong>, el dueño del proyecto en Google Cloud debe agregar ese correo como <strong>«Usuario de prueba»</strong>.
                </p>
              </div>

              <ol className="space-y-3 text-xs text-slate-600 pl-1">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-800 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <div>
                    <span>Inicia sesión con la cuenta administradora de Google Cloud: <strong className="text-slate-900">angelmunoz9190@gmail.com</strong>.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-800 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <div>
                    <span>Abre la consola de OAuth de Google Cloud en este enlace directo:</span>
                    <a
                      href="https://console.cloud.google.com/apis/credentials/consent?project=gen-lang-client-0502364435"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-900 underline"
                    >
                      <span>Abrir Pantalla de Consentimiento OAuth (Proyecto gen-lang-client-0502364435)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-800 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <div>
                    <span>Desplázate hacia abajo hasta la sección <strong>«Usuarios de prueba» (Test users)</strong>.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-800 flex items-center justify-center font-bold text-[11px] shrink-0">4</span>
                  <div>
                    <span>Haz clic en <strong>«+ AGREGAR USUARIOS»</strong> (+ ADD USERS) e introduce el correo institucional: <strong className="text-slate-900 font-mono">servicios.escolares@ihmexico.com</strong>.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-800 flex items-center justify-center font-bold text-[11px] shrink-0">5</span>
                  <div>
                    <span>Haz clic en <strong>Guardar (Save)</strong>.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-800 flex items-center justify-center font-bold text-[11px] shrink-0">6</span>
                  <div>
                    <span>Regresa a esta aplicación y vuelve a hacer clic en <strong>«Conectar Cuenta de Google»</strong>. Si aparece una advertencia de <em>«Google no verificó esta app»</em>, solo haz clic en <strong>«Configuración avanzada» &gt; «Ir a gen-lang-client-0502364435 (no seguro)»</strong> y acepta los permisos.</span>
                  </div>
                </li>
              </ol>

              <div className="pt-2">
                <a
                  href="https://console.cloud.google.com/apis/credentials/consent?project=gen-lang-client-0502364435"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <span>Ir a Google Cloud Console (Agregar Usuario de Prueba)</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
