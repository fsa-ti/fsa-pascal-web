import React, { useEffect, useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import {
  PASCAL_LANGUAGE_ID,
  PASCAL_MONARCH_LANGUAGE,
  PASCAL_CONFIGURATION
} from './pascal-tokens.ts';
import { EditorCursorPosition } from '../../services/store.ts';

interface CodeEditorProps {
  filePath: string;
  content: string;
  onChange: (newContent: string) => void;
  onToggleViewMode: () => void;
  onBuild: () => void;
  onClassCompletion?: (explicitContent?: string) => void;
  cursorTarget?: EditorCursorPosition | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  filePath,
  content,
  onChange,
  onToggleViewMode,
  onBuild,
  onClassCompletion,
  cursorTarget
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const onClassCompletionRef = useRef(onClassCompletion);

  useEffect(() => {
    onClassCompletionRef.current = onClassCompletion;
  }, [onClassCompletion]);

  const handleEditorWillMount = (monacoInstance: Monaco) => {
    monacoRef.current = monacoInstance;
    // Registrar linguagem Object Pascal se não existir
    if (!monacoInstance.languages.getLanguages().some(l => l.id === PASCAL_LANGUAGE_ID)) {
      monacoInstance.languages.register({ id: PASCAL_LANGUAGE_ID });
      monacoInstance.languages.setMonarchTokensProvider(PASCAL_LANGUAGE_ID, PASCAL_MONARCH_LANGUAGE);
      monacoInstance.languages.setLanguageConfiguration(PASCAL_LANGUAGE_ID, PASCAL_CONFIGURATION);
    }
  };

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;

    // 1. Forçar recálculo imediato de métricas de glifos/fontes
    monacoInstance.editor.remeasureFonts();

    // 2. Recalcular após término de carregamento de fontes do documento (web fonts)
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        monacoInstance.editor.remeasureFonts();
        editor.layout();
      });

      document.fonts.addEventListener('loadingdone', () => {
        monacoInstance.editor.remeasureFonts();
        editor.layout();
      });
    }

    // 3. Fallbacks temporizados para acomodar swaps de fontes ou animações de entrada
    const t1 = setTimeout(() => {
      monacoInstance.editor.remeasureFonts();
      editor.layout();
    }, 100);

    const t2 = setTimeout(() => {
      monacoInstance.editor.remeasureFonts();
      editor.layout();
    }, 400);

    // Atalho F12: Alternar para o Designer Visual
    editor.addCommand(monacoInstance.KeyCode.F12, () => {
      onToggleViewMode();
    });

    // Atalho F9: Build
    editor.addCommand(monacoInstance.KeyCode.F9, () => {
      onBuild();
    });

    // Atalho Ctrl+F9: Build
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.F9, () => {
      onBuild();
    });

    // Ação e Atalho Ctrl+Shift+C: Class Completion com Context Menu do Monaco
    editor.addAction({
      id: 'pascal-class-completion',
      label: 'Completar Classes (Ctrl+Shift+C)',
      keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyC],
      contextMenuGroupId: '1_modification',
      contextMenuOrder: 1.5,
      run: (ed) => {
        const liveCode = ed.getValue();
        onClassCompletionRef.current?.(liveCode);
      }
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  };

  // Posicionar cursor se solicitado externamente
  useEffect(() => {
    if (cursorTarget && editorRef.current && cursorTarget.file === filePath) {
      editorRef.current.setPosition({
        lineNumber: cursorTarget.line,
        column: cursorTarget.column
      });
      editorRef.current.revealPositionInCenter({
        lineNumber: cursorTarget.line,
        column: cursorTarget.column
      });
      editorRef.current.focus();
    }
  }, [cursorTarget, filePath]);

  // Recalcular métricas sempre que o arquivo ativo for trocado
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.remeasureFonts();
      editorRef.current.layout();
    }
  }, [filePath]);

  return (
    <div className="flex-1 h-full w-full bg-[#1e1e1e] relative">
      <div className="h-7 bg-[#252526] border-b border-[#3f3f46] flex items-center justify-between px-3 text-xs text-zinc-300">
        <span className="font-mono text-[11px] text-zinc-300">{filePath}</span>
        <span className="text-[10px] text-zinc-500 font-mono">Delphi Object Pascal • UTF-8</span>
      </div>

      <div className="h-[calc(100%-28px)] w-full">
        <Editor
          height="100%"
          language={filePath.endsWith('.pas') || filePath.endsWith('.dpr') || filePath.endsWith('.dfm') ? PASCAL_LANGUAGE_ID : 'xml'}
          theme="vs-dark"
          value={content}
          onChange={(val) => onChange(val || '')}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          options={{
            fontFamily: "'Consolas', 'Cascadia Code', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: 13,
            lineHeight: 20,
            fontWeight: 'normal',
            letterSpacing: 0,
            fontLigatures: false,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            cursorBlinking: 'smooth',
            cursorStyle: 'line',
            cursorWidth: 2,
            cursorSurroundingLines: 0,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            matchBrackets: 'always',
            renderLineHighlight: 'all',
            fixedOverflowWidgets: true
          }}
        />
      </div>
    </div>
  );
};
