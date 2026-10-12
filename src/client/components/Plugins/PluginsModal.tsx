import React, { useEffect, useState } from 'react';
import { Box, X, Check, ShieldCheck, DownloadCloud } from 'lucide-react';
import { PluginManifest } from '../../../common/types.ts';

interface PluginsModalProps {
  onClose: () => void;
}

export const PluginsModal: React.FC<PluginsModalProps> = ({ onClose }) => {
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>({
    'org.pascalweb.acbr-suite': true,
    'org.pascalweb.pascal-linter': true
  });

  useEffect(() => {
    fetch('/api/plugins')
      .then(r => r.json())
      .then((data: PluginManifest[]) => setPlugins(data))
      .catch(console.error);
  }, []);

  const togglePlugin = (id: string) => {
    setEnabledMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-[#252526] border border-[#3f3f46] rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-xs">
        {/* Cabeçalho */}
        <div className="h-10 px-4 bg-[#2d2d30] border-b border-[#3f3f46] flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-zinc-200">
            <Box className="w-4 h-4 text-amber-400" />
            <span>Gerenciador de Plugins & Extensões</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Plugins */}
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {plugins.map(p => {
            const isEnabled = !!enabledMap[p.id];
            return (
              <div
                key={p.id}
                className="bg-[#1e1e1e] border border-zinc-700 rounded-md p-3 flex items-start justify-between gap-3 shadow-sm"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-100 text-sm">{p.name}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                      v{p.version}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">{p.description}</p>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Publicado por: {p.publisher}
                  </div>
                </div>

                <button
                  onClick={() => togglePlugin(p.id)}
                  className={`px-3 py-1 rounded font-semibold text-xs transition-colors ${
                    isEnabled
                      ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-300 hover:bg-emerald-600/40'
                      : 'bg-zinc-800 border border-zinc-600 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {isEnabled ? 'Ativado' : 'Desativado'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Rodapé */}
        <div className="h-10 px-4 bg-[#2d2d30] border-t border-[#3f3f46] flex items-center justify-between text-zinc-400 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Isolamento por Web Worker Sandbox ativo</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
