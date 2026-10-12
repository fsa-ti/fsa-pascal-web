import React, { useState } from 'react';
import { BuildDiagnostic, BuildResult } from '../../../common/types.ts';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Terminal,
  Download,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  FileCheck,
  Play
} from 'lucide-react';

interface BuildPanelProps {
  activeTab: 'logs' | 'messages';
  onTabChange: (tab: 'logs' | 'messages') => void;
  buildLogs: string[];
  buildResult: BuildResult | null;
  onNavigateToDiagnostic: (diag: BuildDiagnostic) => void;
  onRunArtifact?: (art: any) => void;
}

export const BuildPanel: React.FC<BuildPanelProps> = ({
  activeTab,
  onTabChange,
  buildLogs,
  buildResult,
  onNavigateToDiagnostic,
  onRunArtifact
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedSubTab, setSelectedSubTab] = useState<'messages' | 'output' | 'artifacts'>('messages');

  const errorCount = buildResult?.errorCount ?? 0;
  const warningCount = buildResult?.warningCount ?? 0;
  const hintCount = buildResult?.hintCount ?? 0;

  return (
    <div
      className={`bg-[#16171b] border-t border-white/[0.08] flex flex-col text-xs transition-all shrink-0 ${
        isCollapsed ? 'h-8' : 'h-48'
      }`}
    >
      {/* Barra de Abas do Console */}
      <div className="h-8 bg-[#18191e] border-b border-white/[0.08] flex items-center justify-between px-3 select-none">
        <div className="flex items-center gap-1.5">
          {/* Aba Messages */}
          <button
            onClick={() => {
              setSelectedSubTab('messages');
              setIsCollapsed(false);
            }}
            className={`px-3 py-1 flex items-center gap-2 font-medium text-xs rounded-md transition-all ${
              selectedSubTab === 'messages' && !isCollapsed
                ? 'bg-[#22232a] text-zinc-100 border border-white/[0.08] shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <span>Mensagens</span>
            {errorCount > 0 ? (
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {errorCount} erros
              </span>
            ) : warningCount > 0 ? (
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {warningCount} avisos
              </span>
            ) : null}
          </button>

          {/* Aba Output (Logs) */}
          <button
            onClick={() => {
              setSelectedSubTab('output');
              setIsCollapsed(false);
            }}
            className={`px-3 py-1 flex items-center gap-1.5 font-medium text-xs rounded-md transition-all ${
              selectedSubTab === 'output' && !isCollapsed
                ? 'bg-[#22232a] text-zinc-100 border border-white/[0.08] shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>Saída de Compilação</span>
          </button>

          {/* Aba Artefatos Gerados */}
          <button
            onClick={() => {
              setSelectedSubTab('artifacts');
              setIsCollapsed(false);
            }}
            className={`px-3 py-1 flex items-center gap-1.5 font-medium text-xs rounded-md transition-all ${
              selectedSubTab === 'artifacts' && !isCollapsed
                ? 'bg-[#22232a] text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Artefatos</span>
            {buildResult?.artifacts && buildResult.artifacts.length > 0 && (
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {buildResult.artifacts.length}
              </span>
            )}
          </button>
        </div>

        {/* Botão de Minimizar / Restaurar */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/[0.05] transition-colors"
          title={isCollapsed ? 'Expandir Painel' : 'Recolher Painel'}
        >
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Conteúdo do Painel */}
      {!isCollapsed && (
        <div className="flex-1 overflow-auto bg-[#121316] font-mono text-[11px]">
          {/* Messages */}
          {selectedSubTab === 'messages' && (
            <div className="w-full">
              {buildResult?.diagnostics && buildResult.diagnostics.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#18191e] text-zinc-400 border-b border-white/[0.08] text-[10px] uppercase font-semibold">
                      <th className="p-2 w-24">Severidade</th>
                      <th className="p-2 w-20">Código</th>
                      <th className="p-2">Descrição</th>
                      <th className="p-2 w-48">Arquivo</th>
                      <th className="p-2 w-20 text-right">Linha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildResult.diagnostics.map((d, idx) => (
                      <tr
                        key={idx}
                        onClick={() => onNavigateToDiagnostic(d)}
                        className="border-b border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition-colors"
                        title="Clique para ir até a linha no editor de código"
                      >
                        <td className="p-2 flex items-center gap-1.5">
                          {d.severity === 'Fatal' || d.severity === 'Error' ? (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          ) : d.severity === 'Warning' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          ) : (
                            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          )}
                          <span
                            className={
                              d.severity === 'Fatal' || d.severity === 'Error'
                                ? 'text-rose-400 font-bold'
                                : d.severity === 'Warning'
                                ? 'text-amber-400 font-medium'
                                : 'text-blue-400'
                            }
                          >
                            {d.severity}
                          </span>
                        </td>
                        <td className="p-2 font-bold text-zinc-300">{d.code}</td>
                        <td className="p-2 text-zinc-200 font-sans">{d.message}</td>
                        <td className="p-2 text-zinc-400 truncate max-w-xs">{d.file}</td>
                        <td className="p-2 text-zinc-300 text-right">{d.line}:{d.column}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-zinc-500 flex flex-col items-center justify-center gap-2 font-sans">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/80" />
                  <span className="text-xs">Nenhum erro de compilação pendente. Pressione F9 para compilar.</span>
                </div>
              )}
            </div>
          )}

          {/* Build Output */}
          {selectedSubTab === 'output' && (
            <div className="p-3 space-y-1 text-zinc-300 leading-relaxed">
              {buildLogs.length > 0 ? (
                buildLogs.map((log, idx) => (
                  <div key={idx} className="font-mono text-[11px] px-1 hover:bg-white/[0.02] rounded">
                    {log}
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 italic p-2 font-sans">
                  Nenhum log gerado. Pressione F9 para compilar com o Agente Windows.
                </div>
              )}
            </div>
          )}

          {/* Artefatos */}
          {selectedSubTab === 'artifacts' && (
            <div className="p-4 font-sans">
              {buildResult?.artifacts && buildResult.artifacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {buildResult.artifacts.map((art, idx) => (
                    <div
                      key={idx}
                      className="bg-[#1a1b20] border border-white/[0.08] rounded-lg p-3 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-100 text-xs">{art.fileName}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {(art.fileSizeBytes / 1024).toFixed(1)} KB • Executável PE Win32
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {art.fileName.endsWith('.exe') && onRunArtifact && (
                          <button
                            onClick={() => onRunArtifact(art)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
                            title="Executar este binário diretamente na máquina local Windows"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Executar</span>
                          </button>
                        )}

                        <a
                          href={art.downloadUrl || `/api/artifacts/${buildResult.buildId}/${art.fileName}`}
                          download={art.fileName}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-zinc-500 italic text-center p-6">
                  Nenhum executável ou pacote gerado ainda. Dispare a compilação (F9) para produzir o .exe.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
