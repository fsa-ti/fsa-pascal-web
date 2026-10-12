import React, { useState } from 'react';
import { Sparkles, Send, Copy, ArrowDownRight, X, Check } from 'lucide-react';
import { AICodeSuggestion } from '../../../server/ai-assistant.ts';

interface AIPanelProps {
  onClose: () => void;
  onInsertCode: (code: string) => void;
  activeUnitName: string;
}

export const AIPanel: React.FC<AIPanelProps> = ({ onClose, onInsertCode, activeUnitName }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AICodeSuggestion | null>(null);
  const [copied, setCopied] = useState(false);

  const quickPrompts = [
    'Consumir REST com System.JSON',
    'Consulta com FireDAC e TFDQuery',
    'Lista genérica TList<T>',
    'Tratamento try..finally seguro'
  ];

  const handleAsk = async (textToAsk: string) => {
    if (!textToAsk.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToAsk, contextUnit: activeUnitName })
      });
      const data: AICodeSuggestion = await res.json();
      setLastResponse(data);
    } catch (err: any) {
      setLastResponse({ text: `Falha ao consultar assistente: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-80 bg-[#252526] border-l border-[#3f3f46] flex flex-col text-xs shadow-2xl z-30 select-none">
      {/* Cabeçalho */}
      <div className="h-9 px-3 bg-[#2d2d30] border-b border-[#3f3f46] flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-purple-300">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Delphi AI Assistant</span>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Prompts Rápidos */}
      <div className="p-2 border-b border-[#3f3f46] bg-[#222225]">
        <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-1.5 block">
          Ações Rápidas em Object Pascal
        </span>
        <div className="flex flex-wrap gap-1">
          {quickPrompts.map((qp) => (
            <button
              key={qp}
              onClick={() => {
                setPrompt(qp);
                handleAsk(qp);
              }}
              className="text-[10px] bg-[#2d2d30] hover:bg-purple-900/40 hover:text-purple-200 border border-zinc-700 hover:border-purple-500 text-zinc-300 px-2 py-0.5 rounded transition-all"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Corpo da Resposta */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {lastResponse ? (
          <div className="space-y-2">
            <p className="text-zinc-200 leading-relaxed text-[11px]">{lastResponse.text}</p>
            {lastResponse.codeSnippet && (
              <div className="bg-[#1e1e1e] border border-zinc-700 rounded overflow-hidden">
                <div className="bg-[#2a2a2d] px-2 py-1 flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-700 font-mono">
                  <span>Pascal Code</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyToClipboard(lastResponse.codeSnippet!)}
                      className="p-1 hover:text-white flex items-center gap-0.5"
                      title="Copiar Código"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => onInsertCode(lastResponse.codeSnippet!)}
                      className="px-1.5 py-0.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-[9px] flex items-center gap-0.5"
                      title="Inserir na Unit Ativa"
                    >
                      <ArrowDownRight className="w-3 h-3" />
                      <span>Inserir</span>
                    </button>
                  </div>
                </div>
                <pre className="p-2 text-[10px] text-emerald-300 font-mono overflow-x-auto whitespace-pre leading-snug">
                  {lastResponse.codeSnippet}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-zinc-500 py-8 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-purple-400/50" />
            <p className="text-[11px]">Faça uma pergunta sobre Delphi ou clique em uma das ações rápidas acima.</p>
          </div>
        )}
      </div>

      {/* Input de Prompt */}
      <div className="p-2 border-t border-[#3f3f46] bg-[#222225] flex items-center gap-1.5">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk(prompt)}
          placeholder="Ex: Como criar singleton em Delphi?"
          disabled={loading}
          className="flex-1 bg-[#1e1e1e] border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200 text-xs outline-none focus:border-purple-500"
        />
        <button
          onClick={() => handleAsk(prompt)}
          disabled={loading || !prompt.trim()}
          className="p-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 text-white rounded transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
