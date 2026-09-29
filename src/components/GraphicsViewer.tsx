import React from 'react';

interface GraphicsViewerProps {
  type: 'pie-languages' | 'bar-averages' | 'matrix-pattern';
}

export const GraphicsViewer: React.FC<GraphicsViewerProps> = ({ type }) => {
  if (type === 'pie-languages') {
    // Pie chart for question 31
    // Total 200 alumnos: Inglés 40% (80), Francés 25% (50), Alemán 15% (30), Italiano 12% (24), Portugués 8% (16)
    return (
      <div className="my-6 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="text-center mb-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Alumnos inscritos en talleres de idiomas
          </h4>
          <p className="text-xs text-slate-500 font-medium">(total de inscritos: 200)</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="relative w-56 h-56">
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xs">
              {/* Angles:
                Start at -90 deg:
                Inglés: 40% -> 144 deg (ends at 54 deg)
                Francés: 25% -> 90 deg (ends at 144 deg)
                Alemán: 15% -> 54 deg (ends at 198 deg)
                Italiano: 12% -> 43.2 deg (ends at 241.2 deg)
                Portugués: 8% -> 28.8 deg (ends at 270 / -90 deg)
              */}
              {/* Inglés (40%): -90 deg to 54 deg */}
              <path
                d="M 100 100 L 100 15 A 85 85 0 0 1 170.8 146.9 Z"
                className="fill-sky-700 hover:fill-sky-800 transition-colors cursor-pointer"
              />
              {/* Francés (25%): 54 deg to 144 deg */}
              <path
                d="M 100 100 L 170.8 146.9 A 85 85 0 0 1 50.0 168.8 Z"
                className="fill-sky-500 hover:fill-sky-600 transition-colors cursor-pointer"
              />
              {/* Alemán (15%): 144 deg to 198 deg */}
              <path
                d="M 100 100 L 50.0 168.8 A 85 85 0 0 1 19.2 126.3 Z"
                className="fill-sky-300 hover:fill-sky-400 transition-colors cursor-pointer"
              />
              {/* Italiano (12%): 198 deg to 241.2 deg */}
              <path
                d="M 100 100 L 19.2 126.3 A 85 85 0 0 1 25.5 59.5 Z"
                className="fill-slate-400 hover:fill-slate-500 transition-colors cursor-pointer"
              />
              {/* Portugués (8%): 241.2 deg to 270 deg */}
              <path
                d="M 100 100 L 25.5 59.5 A 85 85 0 0 1 100 15 Z"
                className="fill-slate-200 hover:fill-slate-300 transition-colors cursor-pointer"
              />
              {/* Center decorative ring */}
              <circle cx="100" cy="100" r="3" fill="#ffffff" />
            </svg>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 text-xs">
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-sky-50/60">
              <span className="w-3.5 h-3.5 rounded-sm bg-sky-700 shrink-0" />
              <span className="font-medium text-slate-800">Inglés:</span>
              <span className="font-bold text-sky-900 ml-auto">40 %</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-sky-50/60">
              <span className="w-3.5 h-3.5 rounded-sm bg-sky-500 shrink-0" />
              <span className="font-medium text-slate-800">Francés:</span>
              <span className="font-bold text-sky-800 ml-auto">25 %</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-sky-50/60">
              <span className="w-3.5 h-3.5 rounded-sm bg-sky-300 shrink-0" />
              <span className="font-medium text-slate-800">Alemán:</span>
              <span className="font-bold text-sky-700 ml-auto">15 %</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50">
              <span className="w-3.5 h-3.5 rounded-sm bg-slate-400 shrink-0" />
              <span className="font-medium text-slate-800">Italiano:</span>
              <span className="font-bold text-slate-700 ml-auto">12 %</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50">
              <span className="w-3.5 h-3.5 rounded-sm bg-slate-200 border border-slate-300 shrink-0" />
              <span className="font-medium text-slate-800">Portugués:</span>
              <span className="font-bold text-slate-600 ml-auto">8 %</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'bar-averages') {
    // Bar chart for question 32
    // Vertical axis starts at 7.0 up to 8.4
    // Parcial 1: 7.6 (height = 0.6)
    // Parcial 2: 7.8 (height = 0.8)
    // Parcial 3: 8.0 (height = 1.0)
    // Parcial 4: 8.2 (height = 1.2)
    return (
      <div className="my-6 p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="text-center mb-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
            Promedio del grupo por parcial
          </h4>
        </div>

        <div className="relative max-w-md mx-auto h-64 flex">
          {/* Y Axis labels */}
          <div className="w-16 h-48 flex flex-col justify-between text-right pr-2 text-xs font-mono text-slate-600 select-none">
            <span className="font-semibold text-slate-800">8.4</span>
            <span>8.2</span>
            <span>8.0</span>
            <span>7.8</span>
            <span>7.6</span>
            <span>7.4</span>
            <span>7.2</span>
            <span className="font-semibold text-rose-700 bg-rose-50 px-1 rounded-sm">7.0</span>
          </div>

          {/* Chart area */}
          <div className="flex-1 h-48 border-l-2 border-b-2 border-slate-700 relative flex items-end justify-around px-4">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border-b border-dashed border-slate-500 w-full" />
              ))}
            </div>

            {/* Parcial 1: 7.6 -> (7.6 - 7.0)/(8.4 - 7.0) = 0.6 / 1.4 = 42.8% */}
            <div className="relative flex flex-col items-center z-10 w-14">
              <span className="text-xs font-bold text-slate-800 mb-1">7.6</span>
              <div
                style={{ height: `${(0.6 / 1.4) * 100}%` }}
                className="w-full bg-sky-700 rounded-t-sm shadow-xs transition-all hover:bg-sky-800 flex items-center justify-center"
              />
              <span className="absolute -bottom-6 text-xs font-medium text-slate-700 whitespace-nowrap">
                Parcial 1
              </span>
            </div>

            {/* Parcial 2: 7.8 -> (7.8 - 7.0)/1.4 = 0.8/1.4 = 57.1% */}
            <div className="relative flex flex-col items-center z-10 w-14">
              <span className="text-xs font-bold text-slate-800 mb-1">7.8</span>
              <div
                style={{ height: `${(0.8 / 1.4) * 100}%` }}
                className="w-full bg-sky-700 rounded-t-sm shadow-xs transition-all hover:bg-sky-800 flex items-center justify-center"
              />
              <span className="absolute -bottom-6 text-xs font-medium text-slate-700 whitespace-nowrap">
                Parcial 2
              </span>
            </div>

            {/* Parcial 3: 8.0 -> (8.0 - 7.0)/1.4 = 1.0/1.4 = 71.4% */}
            <div className="relative flex flex-col items-center z-10 w-14">
              <span className="text-xs font-bold text-slate-800 mb-1">8.0</span>
              <div
                style={{ height: `${(1.0 / 1.4) * 100}%` }}
                className="w-full bg-sky-700 rounded-t-sm shadow-xs transition-all hover:bg-sky-800 flex items-center justify-center"
              />
              <span className="absolute -bottom-6 text-xs font-medium text-slate-700 whitespace-nowrap">
                Parcial 3
              </span>
            </div>

            {/* Parcial 4: 8.2 -> (8.2 - 7.0)/1.4 = 1.2/1.4 = 85.7% */}
            <div className="relative flex flex-col items-center z-10 w-14">
              <span className="text-xs font-bold text-slate-800 mb-1">8.2</span>
              <div
                style={{ height: `${(1.2 / 1.4) * 100}%` }}
                className="w-full bg-sky-700 rounded-t-sm shadow-xs transition-all hover:bg-sky-800 flex items-center justify-center"
              />
              <span className="absolute -bottom-6 text-xs font-medium text-slate-700 whitespace-nowrap">
                Parcial 4
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 italic">
          Nota: El eje vertical representa el Promedio del grupo (inicia en 7.0).
        </div>
      </div>
    );
  }

  if (type === 'matrix-pattern') {
    return (
      <div className="my-5 flex justify-center">
        <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-3 inline-block shadow-xs">
          <table className="border-collapse text-center font-mono text-base">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="px-5 py-2.5 font-semibold text-slate-700">2</td>
                <td className="px-5 py-2.5 font-semibold text-slate-700 border-l border-r border-slate-300">
                  4
                </td>
                <td className="px-5 py-2.5 font-semibold text-slate-700">8</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="px-5 py-2.5 font-semibold text-slate-700">3</td>
                <td className="px-5 py-2.5 font-semibold text-slate-700 border-l border-r border-slate-300">
                  9
                </td>
                <td className="px-5 py-2.5 font-semibold text-slate-700">27</td>
              </tr>
              <tr>
                <td className="px-5 py-2.5 font-semibold text-slate-700">4</td>
                <td className="px-5 py-2.5 font-semibold text-slate-700 border-l border-r border-slate-300">
                  16
                </td>
                <td className="px-5 py-2.5 font-bold text-indigo-600 bg-indigo-50/50 rounded-br-sm">
                  ?
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};
