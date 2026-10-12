import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  LayoutTemplate,
  FileCog,
  ChevronRight,
  ChevronDown,
  Layers,
  FilePlus,
  FolderPlus,
  Trash2,
  Edit2,
  Check,
  X,
  Plus
} from 'lucide-react';
import type { DelphiProject, ProjectFile } from '../../common/types.ts';

interface ProjectTreeProps {
  project: DelphiProject | null;
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onOpenDesignerForUnit: (pasPath: string) => void;
  customFolders?: string[];
  onNewUnit?: (isForm: boolean, targetFolder?: string, customUnitName?: string) => void;
  onNewFolder?: (folderName: string, parentFolder?: string) => void;
  onRenameFile?: (oldPath: string, newFileName: string) => void;
  onDeleteFile?: (filePath: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  file?: ProjectFile;
  hasDfm?: boolean;
  dfmPath?: string;
  children: TreeNode[];
}

export const ProjectTree: React.FC<ProjectTreeProps> = ({
  project,
  activeFilePath,
  onSelectFile,
  onOpenDesignerForUnit,
  customFolders = ['src'],
  onNewUnit,
  onNewFolder,
  onRenameFile,
  onDeleteFile
}) => {
  // Pastas expandidas (por padrão 'src' está expandida)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'src/']));

  // Estado de criação inline (+ Unit, + Form, + Pasta)
  const [creationMode, setCreationMode] = useState<{
    type: 'unit' | 'form' | 'folder';
    targetFolder: string;
  } | null>(null);
  const [creationName, setCreationName] = useState<string>('');

  // Estado de renomeação em linha (F2)
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

  // Seleção de nó na árvore (para tecla F2 e atalhos)
  const [selectedNodePath, setSelectedNodePath] = useState<string>(activeFilePath);

  // Menu de Contexto (Botão Direito)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: TreeNode;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  // Foco automático no input de rename ou create
  useEffect(() => {
    if (renamingPath && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingPath]);

  useEffect(() => {
    if (creationMode && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [creationMode]);

  // Fechar menu de contexto e tratar teclas globais na árvore
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Atalho F2 global quando o explorador ou nó estiver selecionado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'F2' && selectedNodePath && !renamingPath && !creationMode) {
      e.preventDefault();
      const nodeName = selectedNodePath.includes('/')
        ? selectedNodePath.substring(selectedNodePath.lastIndexOf('/') + 1)
        : selectedNodePath;
      setRenamingPath(selectedNodePath);
      setRenameValue(nodeName);
    }
    if (e.key === 'Delete' && selectedNodePath && !renamingPath && !creationMode) {
      e.preventDefault();
      if (confirm(`Deseja excluir "${selectedNodePath}"?`)) {
        onDeleteFile?.(selectedNodePath);
      }
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  // Construção hierárquica da árvore
  const treeRoot = useMemo(() => {
    if (!project) return [];

    const rootNodes: TreeNode[] = [];
    const folderMap = new Map<string, TreeNode>();

    // 1. Criar nós para pastas conhecidas (customFolders)
    const allFolderPaths = new Set<string>(customFolders);
    for (const f of project.files) {
      if (f.path.includes('/')) {
        const parts = f.path.split('/');
        parts.pop(); // remove o nome do arquivo
        let accumulated = '';
        for (const p of parts) {
          accumulated = accumulated ? `${accumulated}/${p}` : p;
          allFolderPaths.add(accumulated);
        }
      }
    }

    // Ordenar pastas por profundidade para criar pais antes dos filhos
    const sortedFolders = Array.from(allFolderPaths).sort();
    for (const folderPath of sortedFolders) {
      const parts = folderPath.split('/');
      const folderName = parts[parts.length - 1];
      const node: TreeNode = {
        name: folderName,
        path: folderPath,
        isFolder: true,
        children: []
      };
      folderMap.set(folderPath, node);

      if (parts.length === 1) {
        rootNodes.push(node);
      } else {
        const parentPath = parts.slice(0, -1).join('/');
        const parentNode = folderMap.get(parentPath);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          rootNodes.push(node);
        }
      }
    }

    // 2. Agrupar arquivos
    const dfmFiles = new Set(project.files.filter(f => f.type === 'dfm').map(f => f.path));

    for (const file of project.files) {
      // DFM já é exibido vinculado abaixo do seu .PAS
      if (file.type === 'dfm') continue;

      const dfmAssociatedPath = file.path.replace(/\.pas$/i, '.dfm');
      const hasDfm = file.type === 'pas' && dfmFiles.has(dfmAssociatedPath);

      const fileNode: TreeNode = {
        name: file.name,
        path: file.path,
        isFolder: false,
        file,
        hasDfm,
        dfmPath: hasDfm ? dfmAssociatedPath : undefined,
        children: []
      };

      if (file.path.includes('/')) {
        const lastSlash = file.path.lastIndexOf('/');
        const folderPath = file.path.substring(0, lastSlash);
        const folderNode = folderMap.get(folderPath);
        if (folderNode) {
          folderNode.children.push(fileNode);
        } else {
          rootNodes.push(fileNode);
        }
      } else {
        // Arquivo na raiz (.dpr, .dproj)
        rootNodes.push(fileNode);
      }
    }

    return rootNodes;
  }, [project, customFolders]);

  const commitRename = (oldPath: string) => {
    if (renameValue.trim() && renameValue !== oldPath) {
      onRenameFile?.(oldPath, renameValue.trim());
    }
    setRenamingPath(null);
  };

  const commitCreation = () => {
    if (!creationMode || !creationName.trim()) {
      setCreationMode(null);
      return;
    }

    if (creationMode.type === 'folder') {
      onNewFolder?.(creationName.trim(), creationMode.targetFolder);
      // Auto-expandir pasta pai
      setExpandedFolders(prev => new Set([...prev, creationMode.targetFolder]));
    } else {
      const isForm = creationMode.type === 'form';
      onNewUnit?.(isForm, creationMode.targetFolder, creationName.trim());
      setExpandedFolders(prev => new Set([...prev, creationMode.targetFolder]));
    }

    setCreationMode(null);
    setCreationName('');
  };

  // Renderização recursiva de nós
  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isSelected = selectedNodePath === node.path;
    const isExpanded = expandedFolders.has(node.path);
    const isRenaming = renamingPath === node.path;

    if (node.isFolder) {
      return (
        <div key={node.path} className="space-y-0.5">
          {/* Linha da Pasta */}
          <div
            style={{ paddingLeft: `${depth * 12 + 6}px` }}
            onClick={() => {
              setSelectedNodePath(node.path);
              toggleFolder(node.path);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setSelectedNodePath(node.path);
              setContextMenu({ x: e.clientX, y: e.clientY, node });
            }}
            className={`group py-1 pr-2 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
              isSelected
                ? 'bg-white/[0.08] text-zinc-100 font-medium'
                : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
              <span className="text-zinc-500 shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
              <span className="shrink-0">
                {isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-blue-400" />
                )}
              </span>

              {isRenaming ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename(node.path);
                    if (e.key === 'Escape') setRenamingPath(null);
                  }}
                  onBlur={() => commitRename(node.path)}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#0e0f12] text-white border border-blue-500 rounded px-1 text-[11px] font-mono outline-none w-full"
                />
              ) : (
                <span className="font-medium text-[11px] truncate">{node.name}</span>
              )}
            </div>

            {/* Ações Rápidas ao passar o mouse na pasta */}
            <div className="hidden group-hover:flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCreationMode({ type: 'unit', targetFolder: node.path });
                }}
                title="Nova Unit nesta pasta"
                className="w-4 h-4 rounded hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-blue-300"
              >
                <FilePlus className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCreationMode({ type: 'folder', targetFolder: node.path });
                }}
                title="Nova sub-pasta"
                className="w-4 h-4 rounded hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-amber-300"
              >
                <FolderPlus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Filhos da Pasta */}
          {isExpanded && (
            <div className="space-y-0.5">
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // Nó de Arquivo (.pas, .dpr, .dproj)
    const isUnitActive = activeFilePath === node.path;
    const isDfmActive = node.dfmPath && activeFilePath === node.dfmPath;

    return (
      <div key={node.path} className="space-y-0.5">
        <div
          style={{ paddingLeft: `${depth * 12 + 18}px` }}
          onClick={() => {
            setSelectedNodePath(node.path);
            onSelectFile(node.path);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setSelectedNodePath(node.path);
            setContextMenu({ x: e.clientX, y: e.clientY, node });
          }}
          className={`py-1 pr-2 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
            isUnitActive
              ? 'bg-blue-950/50 border border-blue-500/40 text-blue-200 font-medium'
              : isSelected
              ? 'bg-white/[0.08] text-zinc-100'
              : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
            {node.file?.type === 'dpr' ? (
              <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : node.file?.type === 'dproj' ? (
              <FileCog className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            ) : (
              <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            )}

            {isRenaming ? (
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(node.path);
                  if (e.key === 'Escape') setRenamingPath(null);
                }}
                onBlur={() => commitRename(node.path)}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0e0f12] text-white border border-blue-500 rounded px-1 text-[11px] font-mono outline-none w-full"
              />
            ) : (
              <span className="font-mono text-[11px] truncate">{node.name}</span>
            )}
          </div>

          {node.file?.isModified && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 ml-1" title="Modificado" />
          )}
        </div>

        {/* Sub-item de Formulário Visual (DFM) */}
        {node.hasDfm && node.dfmPath && (
          <div
            style={{ paddingLeft: `${depth * 12 + 32}px` }}
            onClick={() => {
              setSelectedNodePath(node.dfmPath!);
              onSelectFile(node.dfmPath!);
              onOpenDesignerForUnit(node.path);
            }}
            className={`py-0.5 pr-2 rounded-md flex items-center justify-between cursor-pointer transition-all ${
              isDfmActive
                ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 font-medium'
                : 'text-zinc-500 hover:bg-white/[0.04] hover:text-emerald-400'
            }`}
            title="Abrir no Form Designer Visual (F12)"
          >
            <div className="flex items-center gap-1.5 truncate">
              <LayoutTemplate className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="font-mono text-[10px] truncate">{node.name.replace(/\.pas$/i, '.dfm')}</span>
            </div>
            <span className="text-[9px] bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-1 py-0.2 rounded font-sans uppercase font-bold">
              Visual
            </span>
          </div>
        )}
      </div>
    );
  };

  if (!project) {
    return (
      <aside className="w-64 bg-[#16171b] border-r border-white/[0.08] p-4 text-xs text-zinc-500 flex items-center justify-center">
        Carregando projeto...
      </aside>
    );
  }

  return (
    <aside
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-64 bg-[#16171b] border-r border-white/[0.08] flex flex-col text-xs select-none shrink-0 h-full outline-none relative"
    >
      {/* Cabeçalho do Explorador */}
      <div className="h-9 px-3 border-b border-white/[0.08] flex items-center justify-between text-zinc-400 font-semibold shrink-0">
        <div className="flex items-center gap-1.5 text-zinc-200">
          <Layers className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-[11px] font-semibold tracking-wider uppercase">Gerenciador de Projetos</span>
        </div>

        {/* Barra de Ferramentas Rápida (+ Unit, + Form, + Pasta) */}
        <div className="flex items-center gap-1 text-zinc-400">
          <button
            onClick={() => setCreationMode({ type: 'unit', targetFolder: 'src' })}
            title="Adicionar Nova Unit (Ctrl+N)"
            className="w-5 h-5 rounded hover:bg-white/[0.08] hover:text-blue-300 flex items-center justify-center transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCreationMode({ type: 'form', targetFolder: 'src' })}
            title="Adicionar Novo Formulário VCL (Ctrl+Shift+N)"
            className="w-5 h-5 rounded hover:bg-white/[0.08] hover:text-rose-300 flex items-center justify-center transition-colors"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCreationMode({ type: 'folder', targetFolder: 'src' })}
            title="Criar Nova Pasta"
            className="w-5 h-5 rounded hover:bg-white/[0.08] hover:text-amber-300 flex items-center justify-center transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Caixa de Criação Inline (+ Unit, + Form, + Pasta) */}
      {creationMode && (
        <div className="p-2 bg-[#20212a] border-b border-blue-500/30 flex flex-col gap-1.5 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400">
            <span className="text-blue-400">
              {creationMode.type === 'unit' && 'NOVA UNIT PASCAL'}
              {creationMode.type === 'form' && 'NOVO FORMULÁRIO VCL'}
              {creationMode.type === 'folder' && 'NOVA PASTA'}
            </span>
            <span className="text-[9px] text-zinc-500 font-mono">em /{creationMode.targetFolder}</span>
          </div>

          <div className="flex items-center gap-1">
            <input
              ref={createInputRef}
              type="text"
              value={creationName}
              onChange={(e) => setCreationName(e.target.value)}
              placeholder={
                creationMode.type === 'folder'
                  ? 'Nome da pasta (ex: services)'
                  : creationMode.type === 'form'
                  ? 'Nome do Form (ex: ufrmCadastro)'
                  : 'Nome da Unit (ex: uClienteService)'
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitCreation();
                if (e.key === 'Escape') setCreationMode(null);
              }}
              className="flex-1 bg-[#121316] border border-white/[0.1] rounded px-2 py-1 text-[11px] text-white placeholder-zinc-500 outline-none focus:border-blue-500 font-mono"
            />
            <button
              onClick={commitCreation}
              className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
              title="Confirmar (Enter)"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCreationMode(null)}
              className="p-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
              title="Cancelar (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Árvore de Arquivos Hierárquica */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Raiz do Projeto */}
        <div className="px-2 py-1.5 rounded-md bg-[#202127]/60 border border-white/[0.05] flex items-center justify-between text-zinc-200 font-medium mb-1">
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate font-semibold text-xs">{project.name}</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Win32</span>
        </div>

        {/* Nós Renderizados */}
        {treeRoot.map(node => renderNode(node, 0))}
      </div>

      {/* Menu de Contexto (Botão Direito) */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed bg-[#1a1c23]/95 backdrop-blur-xl border border-white/[0.1] shadow-2xl rounded-lg p-1 text-zinc-200 z-50 text-[11px] min-w-[160px]"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.node.isFolder ? (
            <>
              <button
                onClick={() => {
                  setCreationMode({ type: 'unit', targetFolder: contextMenu.node.path });
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors text-left"
              >
                <FilePlus className="w-3.5 h-3.5 text-blue-400" />
                <span>Nova Unit aqui...</span>
              </button>
              <button
                onClick={() => {
                  setCreationMode({ type: 'form', targetFolder: contextMenu.node.path });
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors text-left"
              >
                <LayoutTemplate className="w-3.5 h-3.5 text-rose-400" />
                <span>Novo Form aqui...</span>
              </button>
              <button
                onClick={() => {
                  setCreationMode({ type: 'folder', targetFolder: contextMenu.node.path });
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors text-left"
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Nova Pasta aqui...</span>
              </button>
              <div className="border-t border-white/[0.08] my-1" />
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  onSelectFile(contextMenu.node.path);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors text-left"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Abrir Código</span>
              </button>
              {contextMenu.node.hasDfm && (
                <button
                  onClick={() => {
                    onSelectFile(contextMenu.node.dfmPath!);
                    onOpenDesignerForUnit(contextMenu.node.path);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors text-left"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Abrir Designer (F12)</span>
                </button>
              )}
              <div className="border-t border-white/[0.08] my-1" />
            </>
          )}

          <button
            onClick={() => {
              setRenamingPath(contextMenu.node.path);
              setRenameValue(contextMenu.node.name);
              setContextMenu(null);
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Renomear</span>
            </div>
            <kbd className="text-[10px] text-zinc-500 font-mono">F2</kbd>
          </button>

          {!contextMenu.node.name.endsWith('.dpr') && !contextMenu.node.name.endsWith('.dproj') && (
            <button
              onClick={() => {
                if (confirm(`Excluir permanentemente "${contextMenu.node.name}"?`)) {
                  onDeleteFile?.(contextMenu.node.path);
                }
                setContextMenu(null);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-rose-600 hover:text-white transition-colors text-left text-rose-300"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Excluir</span>
              </div>
              <kbd className="text-[10px] text-zinc-500 font-mono">Del</kbd>
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
