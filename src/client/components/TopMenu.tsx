import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Code2,
  LayoutTemplate,
  Box,
  Sparkles,
  Monitor,
  FilePlus,
  FolderPlus,
  Save,
  Trash2,
  FileCode,
  RotateCcw,
  RotateCw,
  Search,
  HelpCircle,
  Wrench,
  Check
} from 'lucide-react';
import type { DelphiProject } from '../../common/types.ts';

interface TopMenuProps {
  project: DelphiProject | null;
  viewMode: 'code' | 'designer';
  onToggleViewMode: () => void;
  isBuilding: boolean;
  onBuild: () => void;
  activeFilePath: string;
  onOpenAI: () => void;
  onOpenPlugins: () => void;
  hasArtifacts?: boolean;
  onNewUnit?: () => void;
  onNewForm?: () => void;
  onNewFolder?: () => void;
  onSave?: () => void;
  onDeleteSelected?: () => void;
  onClassCompletion?: () => void;
  onOpenDpr?: () => void;
  onRunArtifact?: () => void;
}

export const TopMenu: React.FC<TopMenuProps> = ({
  project,
  viewMode,
  onToggleViewMode,
  isBuilding,
  onBuild,
  activeFilePath,
  onOpenAI,
  onOpenPlugins,
  hasArtifacts,
  onNewUnit,
  onNewForm,
  onNewFolder,
  onSave,
  onDeleteSelected,
  onClassCompletion,
  onOpenDpr,
  onRunArtifact
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState<boolean>(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Fechar dropdowns ao clicar fora ou pressionar Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setShowAbout(false);
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMenuClick = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleMenuHover = (menu: string) => {
    if (openMenu !== null) {
      setOpenMenu(menu);
    }
  };

  const closeAndRun = (action?: () => void) => {
    setOpenMenu(null);
    action?.();
  };

  return (
    <header className="h-11 bg-[#18191e] border-b border-white/[0.08] flex items-center justify-between px-3 text-xs select-none z-50 shrink-0 relative">
      {/* Esquerda: Identidade Visual e Menus Interativos */}
      <div className="flex items-center gap-3">
        {/* Logo Delphi Moderno */}
        <div className="flex items-center gap-2 pr-2 border-r border-white/[0.08]">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-[11px] font-black shadow-md shadow-rose-950/40 tracking-tighter">
            D
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-zinc-100 text-[12px] tracking-tight">
              Pascal<span className="text-rose-500 font-bold">Web</span>
            </span>
            <span className="text-[9px] text-zinc-500 font-mono tracking-wider">STUDIO CLOUD</span>
          </div>
        </div>

        {/* Menus Estilo Delphi Clássico com Dropdowns Funcionais */}
        <nav ref={navRef} className="flex items-center gap-0.5 text-zinc-400 relative">
          {/* MENU ARQUIVO (FILE) */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('Arquivo')}
              onMouseEnter={() => handleMenuHover('Arquivo')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                openMenu === 'Arquivo'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
            >
              Arquivo
            </button>
            {openMenu === 'Arquivo' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#1a1c23]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl rounded-lg p-1 text-zinc-200 z-50 text-[11px]">
                <button
                  onClick={() => closeAndRun(onNewUnit)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <FilePlus className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
                    <span>Nova Unit Pascal...</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-blue-100 font-mono">Ctrl+N</kbd>
                </button>

                <button
                  onClick={() => closeAndRun(onNewForm)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
                    <span>Novo Formulário VCL...</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-blue-100 font-mono">Ctrl+Shift+N</kbd>
                </button>

                <button
                  onClick={() => closeAndRun(onNewFolder)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <FolderPlus className="w-3.5 h-3.5 text-amber-400 group-hover:text-white" />
                    <span>Nova Pasta...</span>
                  </div>
                </button>

                <div className="border-t border-white/[0.08] my-1" />

                <button
                  onClick={() => closeAndRun(onSave)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Save className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
                    <span>Salvar Projeto</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-blue-100 font-mono">Ctrl+S</kbd>
                </button>
              </div>
            )}
          </div>

          {/* MENU EDITAR (EDIT) */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('Editar')}
              onMouseEnter={() => handleMenuHover('Editar')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                openMenu === 'Editar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
            >
              Editar
            </button>
            {openMenu === 'Editar' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-[#1a1c23]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl rounded-lg p-1 text-zinc-200 z-50 text-[11px]">
                <button
                  onClick={() => closeAndRun()}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                    <span>Desfazer</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-blue-100 font-mono">Ctrl+Z</kbd>
                </button>

                <button
                  onClick={() => closeAndRun()}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                    <span>Refazer</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-blue-100 font-mono">Ctrl+Y</kbd>
                </button>

                <div className="border-t border-white/[0.08] my-1" />

                <button
                  onClick={() => closeAndRun(onDeleteSelected)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-rose-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
                    <span>Excluir Componente</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-rose-100 font-mono">Del</kbd>
                </button>
              </div>
            )}
          </div>

          {/* MENU LOCALIZAR (SEARCH) */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('Localizar')}
              onMouseEnter={() => handleMenuHover('Localizar')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                openMenu === 'Localizar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
            >
              Localizar
            </button>
            {openMenu === 'Localizar' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-[#1a1c23]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl rounded-lg p-1 text-zinc-200 z-50 text-[11px]">
                <button
                  onClick={() => closeAndRun()}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                    <span>Localizar no Arquivo</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-blue-100 font-mono">Ctrl+F</kbd>
                </button>
                <button
                  onClick={() => closeAndRun()}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <span>Substituir no Arquivo</span>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-blue-100 font-mono">Ctrl+H</kbd>
                </button>
              </div>
            )}
          </div>

          {/* MENU EXIBIR (VIEW) */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('Exibir')}
              onMouseEnter={() => handleMenuHover('Exibir')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                openMenu === 'Exibir'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
            >
              Exibir
            </button>
            {openMenu === 'Exibir' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#1a1c23]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl rounded-lg p-1 text-zinc-200 z-50 text-[11px]">
                <button
                  onClick={() => closeAndRun(onToggleViewMode)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
                    <span>Alternar Código / Designer</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-blue-100 font-mono">F12</kbd>
                </button>
                <button
                  onClick={() => closeAndRun(onOpenAI)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:text-white" />
                    <span>Assistente Delphi AI</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* MENU PROJETO (PROJECT) */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('Projeto')}
              onMouseEnter={() => handleMenuHover('Projeto')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                openMenu === 'Projeto'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
            >
              Projeto
            </button>
            {openMenu === 'Projeto' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#1a1c23]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl rounded-lg p-1 text-zinc-200 z-50 text-[11px]">
                <button
                  onClick={() => closeAndRun(onBuild)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white fill-current" />
                    <span>Compilar Projeto Completo</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-blue-100 font-mono">F9</kbd>
                </button>
                <button
                  onClick={() => closeAndRun(onClassCompletion)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                    <span>Completar Classes (Class Completion)</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-blue-100 font-mono">Ctrl+Shift+C</kbd>
                </button>
                <button
                  onClick={() => closeAndRun(onOpenDpr)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-amber-400 group-hover:text-white" />
                    <span>Ver Arquivo Principal (.dpr)</span>
                  </div>
                </button>
                <button
                  onClick={() => closeAndRun(onOpenPlugins)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Box className="w-3.5 h-3.5 text-amber-400 group-hover:text-white" />
                    <span>Gerenciar Plugins</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* MENU EXECUTAR (RUN) */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('Executar')}
              onMouseEnter={() => handleMenuHover('Executar')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                openMenu === 'Executar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
            >
              Executar
            </button>
            {openMenu === 'Executar' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-[#1a1c23]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl rounded-lg p-1 text-zinc-200 z-50 text-[11px]">
                <button
                  onClick={() => closeAndRun(onBuild)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white fill-current" />
                    <span>Executar (Compilar & Rodar)</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-blue-100 font-mono">F9</kbd>
                </button>
                <button
                  onClick={() => closeAndRun(onRunArtifact)}
                  disabled={!hasArtifacts}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors cursor-pointer group ${
                    hasArtifacts ? 'hover:bg-blue-600 hover:text-white' : 'opacity-40 cursor-not-allowed'
                  }`}
                >
                  <span>Executar Binário Windows</span>
                </button>
              </div>
            )}
          </div>

          {/* MENU FERRAMENTAS (TOOLS) */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('Ferramentas')}
              onMouseEnter={() => handleMenuHover('Ferramentas')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                openMenu === 'Ferramentas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
            >
              Ferramentas
            </button>
            {openMenu === 'Ferramentas' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#1a1c23]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl rounded-lg p-1 text-zinc-200 z-50 text-[11px]">
                <button
                  onClick={() => closeAndRun(onClassCompletion)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
                    <span>Completar Classes (Class Completion)</span>
                  </div>
                  <kbd className="text-[10px] text-zinc-500 group-hover:text-blue-100 font-mono">Ctrl+Shift+C</kbd>
                </button>
                <button
                  onClick={() => closeAndRun(onOpenAI)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:text-white" />
                    <span>Assistente Delphi AI</span>
                  </div>
                </button>
                <button
                  onClick={() => closeAndRun(onOpenPlugins)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Box className="w-3.5 h-3.5 text-amber-400 group-hover:text-white" />
                    <span>Plugins & Componentes ACBr</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* MENU AJUDA (HELP) */}
          <div className="relative">
            <button
              onClick={() => handleMenuClick('Ajuda')}
              onMouseEnter={() => handleMenuHover('Ajuda')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                openMenu === 'Ajuda'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
            >
              Ajuda
            </button>
            {openMenu === 'Ajuda' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-[#1a1c23]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl rounded-lg p-1 text-zinc-200 z-50 text-[11px]">
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    setShowAbout(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
                    <span>Sobre o PascalWeb IDE...</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Centro: Ações Primárias (Build, Switcher F12, Configuração) */}
      <div className="flex items-center gap-2">
        {/* Botão de Compilar Principal (F9) */}
        <button
          onClick={onBuild}
          disabled={isBuilding}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-semibold text-white text-xs transition-all shadow-sm ${
            isBuilding
              ? 'bg-zinc-700/80 cursor-not-allowed opacity-75'
              : 'bg-emerald-600 hover:bg-emerald-500 active:scale-98 shadow-emerald-950/40 hover:shadow-emerald-900/50'
          }`}
          title="Compilar Projeto Completo (Atalho: F9 ou Ctrl+F9)"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isBuilding ? 'animate-spin' : ''}`} />
          <span>{isBuilding ? 'Compilando...' : 'Compilar (F9)'}</span>
        </button>

        {/* Switcher F12 (Código ↔ Designer Visual) */}
        <div className="flex items-center bg-[#121316] p-0.5 rounded-lg border border-white/[0.08]">
          <button
            onClick={() => viewMode !== 'code' && onToggleViewMode()}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              viewMode === 'code'
                ? 'bg-[#272832] text-blue-400 shadow-xs border border-white/[0.08]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Editor de Código Pascal (F12)"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Código</span>
          </button>
          <button
            onClick={() => viewMode !== 'designer' && onToggleViewMode()}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              viewMode === 'designer'
                ? 'bg-[#272832] text-rose-400 shadow-xs border border-white/[0.08]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Form Designer WYSIWYG (F12)"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Designer (F12)</span>
          </button>
        </div>

        {/* Badges de Plataforma Alvo */}
        <div className="flex items-center gap-1.5 bg-[#121316] border border-white/[0.08] rounded-md px-2.5 py-1 text-zinc-300">
          <Monitor className="w-3 h-3 text-zinc-500" />
          <span className="font-mono text-[11px] font-semibold text-emerald-400">
            {project?.activePlatform || 'Win32'}
          </span>
          <span className="text-zinc-600">/</span>
          <span className="font-mono text-[11px] text-zinc-400">
            {project?.activeConfig || 'Debug'}
          </span>
        </div>
      </div>

      {/* Direita: Ferramentas (Delphi AI, Plugins e Agente) */}
      <div className="flex items-center gap-2">
        {/* Assistente Delphi AI */}
        <button
          onClick={onOpenAI}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:bg-purple-900/50 hover:border-purple-400/50 transition-all text-xs font-medium"
          title="Assistente de Código Delphi Inteligente"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Delphi AI</span>
        </button>

        {/* Gerenciador de Plugins */}
        <button
          onClick={onOpenPlugins}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#22232a] border border-white/[0.08] text-zinc-300 hover:bg-[#2b2c36] hover:text-zinc-100 transition-all text-xs font-medium"
          title="Plugins e Pacotes de Componentes"
        >
          <Box className="w-3.5 h-3.5 text-amber-400" />
          <span>Plugins</span>
        </button>

        {/* Indicador de Status do Agente Local */}
        <div
          className="flex items-center gap-2 bg-[#121316] border border-emerald-500/30 px-2.5 py-1 rounded-md text-[11px]"
          title="Agente de Compilação Local Windows ativo na porta 3002"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400" />
          <span className="font-mono text-zinc-300 font-medium">Agente :3002</span>
        </div>
      </div>

      {/* Modal Sobre PascalWeb IDE */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1c23] border border-white/[0.1] rounded-xl shadow-2xl p-6 max-w-md w-full flex flex-col gap-4 text-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
                D
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">PascalWeb IDE Studio</h3>
                <span className="text-xs text-zinc-400">Embarcadero Delphi 12 Athens Web Companion</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Ambiente de Desenvolvimento Integrado (IDE) 100% online para Delphi Object Pascal. Conta com Form Designer visual interativo, agente de compilação nativa Win32, analisador sintático DCC32 e suíte de plugins fiscais ACBr.
            </p>

            <div className="bg-[#121316] rounded-lg p-3 text-[11px] font-mono space-y-1 text-zinc-400 border border-white/[0.05]">
              <div><strong>F9:</strong> Compilar Projeto Completo</div>
              <div><strong>F12:</strong> Alternar Código & Designer Visual</div>
              <div><strong>F2:</strong> Renomear Unit selecionada</div>
              <div><strong>Ctrl+N:</strong> Nova Unit Pascal</div>
              <div><strong>Ctrl+Shift+C:</strong> Class Completion</div>
              <div><strong>Alt + Arraste:</strong> Mover componente com pixel livre</div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowAbout(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
