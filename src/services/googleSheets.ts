import { FullExamSubmission } from '../types/exam';

export interface GoogleSpreadsheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

const DEFAULT_SPREADSHEET_KEY = 'ih_lex_spreadsheet_id';
const DEFAULT_WEBHOOK_KEY = 'ih_lex_sheets_webhook_url';

export function getSavedSpreadsheetId(): string | null {
  return localStorage.getItem(DEFAULT_SPREADSHEET_KEY);
}

export function saveSpreadsheetId(id: string) {
  localStorage.setItem(DEFAULT_SPREADSHEET_KEY, id);
}

export function getSavedWebhookUrl(): string | null {
  return localStorage.getItem(DEFAULT_WEBHOOK_KEY);
}

export function saveWebhookUrl(url: string) {
  localStorage.setItem(DEFAULT_WEBHOOK_KEY, url);
}

/**
 * Sends submission to a Google Apps Script Webhook URL (no OAuth needed for applicants).
 */
export async function sendSubmissionToWebhook(
  webhookUrl: string,
  submission: FullExamSubmission
): Promise<boolean> {
  const payload = {
    folio: submission.student.folio,
    fullName: submission.student.fullName,
    email: submission.student.email,
    submittedAt: submission.report.submittedAt,
    timeSpentMin: Math.round(submission.report.timeSpentSeconds / 60),
    mathScore: submission.report.math.score,
    mathPercentage: submission.report.math.percentage,
    spanishOMScore: submission.report.spanish.scoreOM,
    spanishOMPercentage: submission.report.spanish.percentageOM,
    essayWordCount: submission.report.spanish.essayWordCount,
    essayScore: submission.report.spanish.essayScore ?? 'Pendiente',
    globalScorePercentage: submission.report.globalScorePercentage,
    performanceBand: submission.report.performanceBand,
    essayText: submission.answers.essay?.text || '',
    mathAnswers: submission.answers.math,
    spanishAnswers: submission.answers.spanish,
    evaluation: submission.answers.essay?.evaluation || null,
  };

  try {
    // Mode no-cors is standard for Google Apps Script Webhooks from browser
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    });
    return true;
  } catch (e) {
    console.error('Error sending to Webhook:', e);
    throw e;
  }
}

/**
 * Returns the ready-to-paste Google Apps Script code for the user's Google Sheet.
 */
export function getGoogleAppsScriptTemplate(): string {
  return `/**
 * International House Cuernavaca - Admisión LEX
 * Código de integración automática con Google Sheets
 * 
 * Instrucciones:
 * 1. En tu hoja de cálculo de Google Sheets, ve a: Extensiones > Apps Script.
 * 2. Borra todo el código que aparezca y pega este código completo.
 * 3. Haz clic en "Implementar" (botón azul arriba a la derecha) > "Nueva implementación".
 * 4. En tipo selecciona "Aplicación web".
 * 5. En "Quién tiene acceso", selecciona "Cualquier persona" (Anyone).
 * 6. Haz clic en "Implementar", autoriza los permisos y copia la URL generada.
 * 7. Pega esa URL en el Panel del Comité Académico en la app.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    // 1. Pestaña: Resumen General
    var resumenSheet = sheet.getSheetByName("Resumen General");
    if (!resumenSheet) {
      resumenSheet = sheet.insertSheet("Resumen General");
      resumenSheet.appendRow([
        "Folio", "Nombre Completo", "Correo Electrónico", "Fecha de Envío",
        "Minutos", "Matemáticas (/32)", "% Mat", "Español OM (/30)", "% Esp OM",
        "Palabras Ensayo", "Calif Ensayo (/20)", "% Global", "Banda Desempeño"
      ]);
    }
    resumenSheet.appendRow([
      data.folio,
      data.fullName,
      data.email,
      new Date().toLocaleString("es-MX"),
      data.timeSpentMin,
      data.mathScore,
      data.mathPercentage + "%",
      data.spanishOMScore,
      data.spanishOMPercentage + "%",
      data.essayWordCount,
      data.essayScore,
      data.globalScorePercentage + "%",
      data.performanceBand
    ]);

    // 2. Pestaña: Pensamiento Matematico
    var mathSheet = sheet.getSheetByName("Pensamiento Matematico");
    if (!mathSheet) {
      mathSheet = sheet.insertSheet("Pensamiento Matematico");
      var headers = ["Folio", "Nombre"];
      for (var i = 1; i <= 32; i++) { headers.push("R" + i); }
      headers.push("Total (/32)", "% Aciertos");
      mathSheet.appendRow(headers);
    }
    var mathRow = [data.folio, data.fullName];
    for (var i = 1; i <= 32; i++) {
      mathRow.push(data.mathAnswers ? (data.mathAnswers[i] || "-") : "-");
    }
    mathRow.push(data.mathScore, data.mathPercentage + "%");
    mathSheet.appendRow(mathRow);

    // 3. Pestaña: Competencia Espanol
    var spanishSheet = sheet.getSheetByName("Competencia Espanol");
    if (!spanishSheet) {
      spanishSheet = sheet.insertSheet("Competencia Espanol");
      var sHeaders = ["Folio", "Nombre"];
      for (var j = 1; j <= 30; j++) { sHeaders.push("R" + j); }
      sHeaders.push("Total OM (/30)", "% OM", "Palabras Ensayo", "Texto del Ensayo");
      spanishSheet.appendRow(sHeaders);
    }
    var spanishRow = [data.folio, data.fullName];
    for (var j = 1; j <= 30; j++) {
      spanishRow.push(data.spanishAnswers ? (data.spanishAnswers[j] || "-") : "-");
    }
    spanishRow.push(data.spanishOMScore, data.spanishOMPercentage + "%", data.essayWordCount, data.essayText);
    spanishSheet.appendRow(spanishRow);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
}

/**
 * Creates a new dedicated admission spreadsheet in Google Drive with the 4 tabs formatted.
 */
export async function createAdmissionSpreadsheet(
  accessToken: string,
  title: string = 'Admisión LEX 2026 - International House Cuernavaca'
): Promise<GoogleSpreadsheetInfo> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';

  const body = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Resumen General',
          gridProperties: { rowCount: 100, columnCount: 15, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Pensamiento Matematico',
          gridProperties: { rowCount: 100, columnCount: 36, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Competencia Espanol',
          gridProperties: { rowCount: 100, columnCount: 35, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Evaluacion Ensayos',
          gridProperties: { rowCount: 100, columnCount: 12, frozenRowCount: 1 },
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al crear Google Sheet (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize Headers
  await initializeSpreadsheetHeaders(accessToken, spreadsheetId);
  saveSpreadsheetId(spreadsheetId);

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
}

/**
 * Inserts headers with descriptions into all sheets.
 */
async function initializeSpreadsheetHeaders(accessToken: string, spreadsheetId: string) {
  // 1. Resumen General headers
  const summaryHeaders = [
    [
      'Folio',
      'Nombre Completo',
      'Correo Electrónico',
      'Fecha/Hora Envío',
      'Minutos Dedicados',
      'Aciertos Mat. (/32)',
      '% Mat.',
      'Aciertos Esp. OM (/30)',
      '% Esp. OM',
      'Palabras Ensayo',
      'Puntos Ensayo (/20)',
      '% Global',
      'Banda Desempeño',
      'Estado Revisión',
    ],
  ];

  // 2. Pensamiento Matemático headers (Folio, Nombre, R1..R32, Total, %)
  const mathHeaders = ['Folio', 'Nombre Completo'];
  for (let i = 1; i <= 32; i++) {
    mathHeaders.push(`R${i}`);
  }
  mathHeaders.push('Total Aciertos (/32)', '% Aciertos');

  // 3. Competencia Español headers (Folio, Nombre, R1..R30, Total OM, % OM, Ensayo)
  const spanishHeaders = ['Folio', 'Nombre Completo'];
  for (let i = 1; i <= 30; i++) {
    spanishHeaders.push(`R${i}`);
  }
  spanishHeaders.push('Total Aciertos OM (/30)', '% OM', 'Palabras Ensayo', 'Texto del Ensayo');

  // 4. Evaluación Ensayos headers
  const essayHeaders = [
    [
      'Folio',
      'Nombre Aspirante',
      '1. Tesis y Argumentación (1-4)',
      '2. Organización y Cohesión (1-4)',
      '3. Corrección Lingüística (1-4)',
      '4. Léxico y Registro (1-4)',
      '5. Uso Responsable Info (1-4)',
      'Puntaje Total (/20)',
      'Observaciones Pedagógicas',
      'Fecha Calificación',
    ],
  ];

  const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const body = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: "'Resumen General'!A1:N1",
        values: summaryHeaders,
      },
      {
        range: "'Pensamiento Matematico'!A1:AJ1",
        values: [mathHeaders],
      },
      {
        range: "'Competencia Espanol'!A1:AH1",
        values: [spanishHeaders],
      },
      {
        range: "'Evaluacion Ensayos'!A1:J1",
        values: essayHeaders,
      },
    ],
  };

  await fetch(batchUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * Appends a full student exam submission to the Google Sheet.
 */
export async function appendExamSubmissionToSheet(
  accessToken: string,
  spreadsheetId: string,
  submission: FullExamSubmission
): Promise<boolean> {
  const { student, answers, report } = submission;

  const durationMin = Math.round(report.timeSpentSeconds / 60);

  // Row for Resumen General
  const summaryRow = [
    student.folio,
    student.fullName,
    student.email,
    new Date(report.submittedAt).toLocaleString('es-MX'),
    durationMin,
    report.math.score,
    `${report.math.percentage}%`,
    report.spanish.scoreOM,
    `${report.spanish.percentageOM}%`,
    report.spanish.essayWordCount,
    report.spanish.essayScore ?? 'Pendiente',
    `${report.globalScorePercentage}%`,
    report.performanceBand,
    report.spanish.essayEvaluated ? 'Evaluado' : 'Pendiente de Ensayo',
  ];

  // Row for Pensamiento Matematico
  const mathRow: (string | number)[] = [student.folio, student.fullName];
  for (let i = 1; i <= 32; i++) {
    mathRow.push(answers.math[i] || '-');
  }
  mathRow.push(report.math.score, `${report.math.percentage}%`);

  // Row for Competencia Espanol
  const spanishRow: (string | number)[] = [student.folio, student.fullName];
  for (let i = 1; i <= 30; i++) {
    spanishRow.push(answers.spanish[i] || '-');
  }
  spanishRow.push(
    report.spanish.scoreOM,
    `${report.spanish.percentageOM}%`,
    report.spanish.essayWordCount,
    answers.essay?.text || '(Sin respuesta de ensayo)'
  );

  const appendToSheet = async (sheetName: string, values: (string | number)[][]) => {
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(
      sheetName
    )}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const res = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Error appending to ${sheetName}:`, err);
      throw new Error(`Error al guardar en hoja ${sheetName}: ${err}`);
    }
  };

  try {
    await appendToSheet('Resumen General', [summaryRow]);
    await appendToSheet('Pensamiento Matematico', [mathRow]);
    await appendToSheet('Competencia Espanol', [spanishRow]);
    return true;
  } catch (e) {
    console.error('Failed to append to Google Sheet:', e);
    throw e;
  }
}

/**
 * Appends or updates essay evaluation in the Evaluacion Ensayos tab.
 */
export async function appendEssayEvaluationToSheet(
  accessToken: string,
  spreadsheetId: string,
  submission: FullExamSubmission
): Promise<boolean> {
  const evalData = submission.answers.essay.evaluation;
  if (!evalData) return false;

  const scores = evalData.finalScores;
  const row = [
    submission.student.folio,
    submission.student.fullName,
    scores['criterio-1'] || 0,
    scores['criterio-2'] || 0,
    scores['criterio-3'] || 0,
    scores['criterio-4'] || 0,
    scores['criterio-5'] || 0,
    evalData.totalScore,
    evalData.evaluatorNotes || 'Sin notas adicionales',
    new Date(evalData.evaluatedAt).toLocaleString('es-MX'),
  ];

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Evaluacion Ensayos'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
  });

  return res.ok;
}
