import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { DFMObject, Rect } from '../../../common/types.ts';
import { VCLLayoutEngine } from '../../../common/vcl/layout-engine.ts';
import { VCLComponentRegistry } from '../../../common/vcl/components.ts';
import { snapToGrid, computeResizeRect, ResizeHandleType } from '../../../common/vcl/geometry.ts';
import { VCLRenderer } from './VCLRenderer.tsx';
import { Palette } from './Palette.tsx';
import {
  Minus,
  Square,
  X,
  Sliders,
  Clock,
  FolderOpen,
  Save,
  Database,
  FileText,
  Cpu,
  Layers,
  Grid
} from 'lucide-react';

interface FormDesignerProps {
  dfmModel: DFMObject | null;
  selectedComponentName: string;
  onSelectComponent: (name: string) => void;
  onAddComponent: (
    className: string,
    defaultProps: Record<string, any>,
    posX?: number,
    posY?: number,
    targetParentName?: string
  ) => void;
  onComponentDoubleClick: (compName: string, eventName?: string) => void;
  onUpdateComponentGeometry?: (compName: string, rect: Rect) => void;
  onDeleteComponent?: () => void;
}

interface ActiveInteraction {
  type: 'move' | 'resize';
  compName: string;
  handle?: ResizeHandleType;
  startPointerX: number;
  startPointerY: number;
  origBounds: Rect;
  parentName?: string;
}

interface DragGhostState {
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  className: string;
  containerName?: string;
  relX: number;
  relY: number;
}

export const FormDesigner: React.FC<FormDesignerProps> = ({
  dfmModel,
  selectedComponentName,
  onSelectComponent,
  onAddComponent,
  onComponentDoubleClick,
  onUpdateComponentGeometry,
  onDeleteComponent
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientAreaRef = useRef<HTMLDivElement>(null);

  // Estados de manipulação direta em tempo real (60 FPS sem alterar DFM até soltar)
  const [transientBounds, setTransientBounds] = useState<Record<string, Rect>>({});
  const [activeInteraction, setActiveInteraction] = useState<ActiveInteraction | null>(null);

  // Fantasma translúcido de drag & drop da paleta
  const [dragGhost, setDragGhost] = useState<DragGhostState | null>(null);

  // Projeção do mouse nas réguas de coordenadas (RF07)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Container alvo sobrevoado durante drag
  const [hoveredContainer, setHoveredContainer] = useState<string | null>(null);

  // Tratamento de ponteiro global (move & up) para nunca perder arraste
  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      // 1. Atualizar régua de coordenadas
      if (clientAreaRef.current) {
        const cRect = clientAreaRef.current.getBoundingClientRect();
        if (
          e.clientX >= cRect.left &&
          e.clientX <= cRect.right &&
          e.clientY >= cRect.top &&
          e.clientY <= cRect.bottom
        ) {
          setMousePos({
            x: Math.max(0, Math.round(e.clientX - cRect.left)),
            y: Math.max(0, Math.round(e.clientY - cRect.top))
          });
        }
      }

      // 2. Manipulação ativa (mover ou redimensionar)
      if (!activeInteraction) return;

      const dx = e.clientX - activeInteraction.startPointerX;
      const dy = e.clientY - activeInteraction.startPointerY;
      const useSnap = !e.altKey; // Alt bypasses snapping [RN15]

      if (activeInteraction.type === 'move') {
        const rawLeft = activeInteraction.origBounds.left + dx;
        const rawTop = activeInteraction.origBounds.top + dy;
        const newLeft = Math.max(0, snapToGrid(rawLeft, 8, useSnap));
        const newTop = Math.max(0, snapToGrid(rawTop, 8, useSnap));

        const updatedRect: Rect = {
          left: newLeft,
          top: newTop,
          width: activeInteraction.origBounds.width,
          height: activeInteraction.origBounds.height
        };

        setTransientBounds(prev => ({
          ...prev,
          [activeInteraction.compName]: updatedRect
        }));
      } else if (activeInteraction.type === 'resize' && activeInteraction.handle) {
        const newRect = computeResizeRect(
          activeInteraction.origBounds,
          activeInteraction.handle,
          dx,
          dy,
          8,
          useSnap,
          8
        );
        newRect.left = Math.max(0, newRect.left);
        newRect.top = Math.max(0, newRect.top);

        setTransientBounds(prev => ({
          ...prev,
          [activeInteraction.compName]: newRect
        }));
      }
    };

    const handleWindowPointerUp = () => {
      if (!activeInteraction) return;

      const finalRect = transientBounds[activeInteraction.compName];
      if (finalRect && onUpdateComponentGeometry) {
        onUpdateComponentGeometry(activeInteraction.compName, finalRect);
      }

      setActiveInteraction(null);
      setTransientBounds(prev => {
        const copy = { ...prev };
        delete copy[activeInteraction.compName];
        return copy;
      });
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [activeInteraction, transientBounds, onUpdateComponentGeometry]);

  // Handler de atalhos de precisão de teclado no designer
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!dfmModel || selectedComponentName === dfmModel.name) return;

    // Setas para mover ou redimensionar pixel a pixel / grid
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();

      // Localizar componente na árvore
      const findChild = (node: DFMObject): DFMObject | undefined => {
        if (node.name === selectedComponentName) return node;
        for (const c of node.children) {
          const res = findChild(c);
          if (res) return res;
        }
        return undefined;
      };

      const target = findChild(dfmModel);
      if (!target || target.properties.Align && target.properties.Align !== 'alNone') return;

      const step = e.ctrlKey ? 8 : 1;
      let left = Number(target.properties.Left) || 0;
      let top = Number(target.properties.Top) || 0;
      let width = Number(target.properties.Width) || 75;
      let height = Number(target.properties.Height) || 25;

      if (e.shiftKey) {
        // Redimensionar
        if (e.key === 'ArrowRight') width += step;
        if (e.key === 'ArrowLeft') width = Math.max(8, width - step);
        if (e.key === 'ArrowDown') height += step;
        if (e.key === 'ArrowUp') height = Math.max(8, height - step);
      } else {
        // Mover
        if (e.key === 'ArrowRight') left += step;
        if (e.key === 'ArrowLeft') left = Math.max(0, left - step);
        if (e.key === 'ArrowDown') top += step;
        if (e.key === 'ArrowUp') top = Math.max(0, top - step);
      }

      onUpdateComponentGeometry?.(selectedComponentName, { left, top, width, height });
    }

    // Tecla Delete
    if (e.key === 'Delete') {
      e.preventDefault();
      onDeleteComponent?.();
    }

    // Tab / Shift+Tab para alternar componente selecionado
    if (e.key === 'Tab') {
      e.preventDefault();
      const allNames = dfmModel.children.map(c => c.name);
      if (allNames.length === 0) return;
      const curIdx = allNames.indexOf(selectedComponentName);
      let nextIdx = 0;
      if (e.shiftKey) {
        nextIdx = curIdx <= 0 ? allNames.length - 1 : curIdx - 1;
      } else {
        nextIdx = curIdx >= allNames.length - 1 ? 0 : curIdx + 1;
      }
      onSelectComponent(allNames[nextIdx]);
    }
  }, [dfmModel, selectedComponentName, onUpdateComponentGeometry, onDeleteComponent, onSelectComponent]);

  if (!dfmModel) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#121316] text-zinc-500 text-sm gap-2">
        <Sliders className="w-8 h-8 text-zinc-600" />
        <span>Nenhum formulário DFM carregado para edição visual.</span>
      </div>
    );
  }

  const p = dfmModel.properties;
  const formWidth = Number(p.ClientWidth) || Number(p.Width) || 640;
  const formHeight = Number(p.ClientHeight) || Number(p.Height) || 440;
  const formCaption = p.Caption !== undefined ? String(p.Caption) : dfmModel.name;

  // Cálculo de geometria VCL com Align e Anchors
  const layoutMap = VCLLayoutEngine.compute(dfmModel, formWidth, formHeight);

  // Separar componentes Visuais e Não-Visuais para a bandeja (Tray)
  const visualChildren: DFMObject[] = [];
  const nonVisualChildren: DFMObject[] = [];

  for (const child of dfmModel.children) {
    if (VCLComponentRegistry.isNonVisual(child.className)) {
      nonVisualChildren.push(child);
    } else {
      visualChildren.push(child);
    }
  }

  // Iniciar arraste do componente na prancheta
  const handleStartMove = (e: React.PointerEvent, compName: string, parentName?: string) => {
    e.stopPropagation();
    onSelectComponent(compName);

    // Identificar retângulo inicial
    const layout = layoutMap.get(compName);
    const origBounds = transientBounds[compName] || layout?.bounds || {
      left: 0,
      top: 0,
      width: 75,
      height: 25
    };

    setActiveInteraction({
      type: 'move',
      compName,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      origBounds,
      parentName
    });
  };

  // Iniciar redimensionamento por uma das 8 alças
  const handleStartResize = (
    e: React.PointerEvent,
    compName: string,
    handle: ResizeHandleType,
    parentName?: string
  ) => {
    e.stopPropagation();
    const layout = layoutMap.get(compName);
    const origBounds = transientBounds[compName] || layout?.bounds || {
      left: 0,
      top: 0,
      width: 75,
      height: 25
    };

    setActiveInteraction({
      type: 'resize',
      compName,
      handle,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      origBounds,
      parentName
    });
  };

  // Drag & Drop nativo a partir da Paleta (Cenários 7.1, 7.2, 9.1)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    if (!clientAreaRef.current) return;
    const clientRect = clientAreaRef.current.getBoundingClientRect();

    const rawX = e.clientX - clientRect.left;
    const rawY = e.clientY - clientRect.top;
    const useSnap = !e.altKey;

    const snappedX = Math.max(0, snapToGrid(rawX, 8, useSnap));
    const snappedY = Math.max(0, snapToGrid(rawY, 8, useSnap));

    // Detectar contêiner filho sob o mouse (ex: TPanel, TGroupBox)
    const elementUnderPoint = document.elementFromPoint(e.clientX, e.clientY);
    const containerEl = elementUnderPoint?.closest('[data-container-name]');
    const containerName = containerEl?.getAttribute('data-container-name') || undefined;

    let relX = snappedX;
    let relY = snappedY;
    if (containerEl) {
      const cRect = containerEl.getBoundingClientRect();
      relX = Math.max(0, snapToGrid(e.clientX - cRect.left, 8, useSnap));
      relY = Math.max(0, snapToGrid(e.clientY - cRect.top, 8, useSnap));
    }

    setHoveredContainer(containerName || null);
    setDragGhost({
      visible: true,
      x: snappedX,
      y: snappedY,
      width: 75,
      height: 25,
      className: 'Novo Componente',
      containerName,
      relX,
      relY
    });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!clientAreaRef.current?.contains(e.relatedTarget as Node)) {
      setDragGhost(null);
      setHoveredContainer(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setHoveredContainer(null);

    const json = e.dataTransfer.getData('application/json');
    if (!json) {
      setDragGhost(null);
      return;
    }

    try {
      const { className, defaultProps } = JSON.parse(json);
      const isNonVis = VCLComponentRegistry.isNonVisual(className);

      if (isNonVis) {
        // Componentes não-visuais são inseridos na bandeja
        onAddComponent(className, defaultProps || {});
      } else if (dragGhost?.containerName) {
        // Solto dentro de um TPanel ou TGroupBox (Parenting [RN13])
        onAddComponent(
          className,
          defaultProps || {},
          dragGhost.relX,
          dragGhost.relY,
          dragGhost.containerName
        );
      } else {
        // Solto diretamente na raiz do Form
        const finalX = dragGhost?.x ?? 50;
        const finalY = dragGhost?.y ?? 50;
        onAddComponent(className, defaultProps || {}, finalX, finalY);
      }
    } catch {
      // Ignora payload inválido
    }

    setDragGhost(null);
  };

  // Renderizar ícone adequado de componente não-visual
  const renderNonVisualIcon = (comp: DFMObject) => {
    switch (comp.className) {
      case 'TTimer':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'TOpenDialog':
        return <FolderOpen className="w-5 h-5 text-emerald-500" />;
      case 'TSaveDialog':
        return <Save className="w-5 h-5 text-emerald-500" />;
      case 'TDataSource':
        return <Database className="w-5 h-5 text-cyan-500" />;
      case 'TACBrNFe':
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <Cpu className="w-5 h-5 text-purple-400" />;
    }
  };

  // Geração de marcas de régua (Rulers) com passos de 50px
  const horizontalRulerMarks: number[] = [];
  for (let x = 0; x <= formWidth; x += 50) {
    horizontalRulerMarks.push(x);
  }

  const verticalRulerMarks: number[] = [];
  for (let y = 0; y <= formHeight; y += 50) {
    verticalRulerMarks.push(y);
  }

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex-1 h-full flex flex-col bg-[#121316] overflow-hidden select-none outline-none"
    >
      {/* 1. Paleta de Componentes no Topo do Designer */}
      <Palette onAddComponent={onAddComponent} />

      {/* 2. Prancheta Central (Workbench) com Grid Pontilhado */}
      <div
        ref={containerRef}
        onClick={() => onSelectComponent(dfmModel.name)}
        className="flex-1 overflow-auto p-8 flex items-start justify-center designer-grid relative"
      >
        {/* Contêiner com Réguas e Janela */}
        <div className="flex flex-col items-start relative shrink-0">
          {/* Régua Horizontal (Topo) */}
          <div className="flex items-end pl-5 select-none" style={{ width: `${formWidth + 20}px` }}>
            <div
              style={{ width: `${formWidth}px` }}
              className="h-4.5 bg-[#1a1b22] border-t border-b border-r border-white/[0.08] relative overflow-hidden flex"
            >
              {horizontalRulerMarks.map(mark => (
                <div
                  key={mark}
                  style={{ left: `${mark}px` }}
                  className="absolute bottom-0 flex flex-col items-start"
                >
                  <div className="w-px h-2.5 bg-zinc-500" />
                  <span className="text-[8px] font-mono text-zinc-400 leading-none pl-0.5 -mt-3.5">
                    {mark}
                  </span>
                </div>
              ))}
              {/* Indicador do Mouse na Régua Horizontal */}
              {mousePos && (
                <div
                  style={{ left: `${mousePos.x}px` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10 transition-all pointer-events-none"
                />
              )}
            </div>
          </div>

          <div className="flex items-start">
            {/* Régua Vertical (Esquerda) */}
            <div
              style={{ height: `${formHeight}px` }}
              className="w-5 bg-[#1a1b22] border-l border-b border-t border-white/[0.08] relative overflow-hidden shrink-0 select-none"
            >
              {verticalRulerMarks.map(mark => (
                <div
                  key={mark}
                  style={{ top: `${mark}px` }}
                  className="absolute right-0 flex items-center"
                >
                  <span className="text-[8px] font-mono text-zinc-400 leading-none pr-0.5 -mt-1">
                    {mark}
                  </span>
                  <div className="h-px w-2 bg-zinc-500" />
                </div>
              ))}
              {/* Indicador do Mouse na Régua Vertical */}
              {mousePos && (
                <div
                  style={{ top: `${mousePos.y}px` }}
                  className="absolute left-0 right-0 h-0.5 bg-blue-500 z-10 transition-all pointer-events-none"
                />
              )}
            </div>

            {/* Janela Emulada do Delphi VCL (TForm) */}
            <div
              style={{ width: `${formWidth}px`, minWidth: `${formWidth}px` }}
              className="bg-[#f0f2f5] border border-zinc-500/70 rounded-br rounded-bl shadow-2xl shadow-black/90 flex flex-col overflow-hidden relative shrink-0 transition-shadow"
            >
              {/* Barra de Título Nativa Estilo Windows / RAD Studio */}
              <div className="h-8 bg-gradient-to-r from-[#1e3a5f] to-[#254b7d] text-white px-2.5 flex items-center justify-between text-xs font-semibold select-none shadow-xs">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-4 h-4 rounded bg-rose-600 flex items-center justify-center text-white text-[9px] font-black shadow-xs shrink-0">
                    D
                  </div>
                  <span className="truncate text-[11px] font-medium tracking-tight">
                    {formCaption}
                  </span>
                </div>

                {/* Botões da Janela */}
                <div className="flex items-center -mr-1">
                  <button
                    className="w-7 h-7 flex items-center justify-center hover:bg-white/15 text-zinc-200 rounded-xs transition-colors"
                    title="Minimizar"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    className="w-7 h-7 flex items-center justify-center hover:bg-white/15 text-zinc-200 rounded-xs transition-colors"
                    title="Maximizar"
                  >
                    <Square className="w-2.5 h-2.5" />
                  </button>
                  <button
                    className="w-7 h-7 flex items-center justify-center hover:bg-red-600 text-zinc-200 rounded-xs transition-colors"
                    title="Fechar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Área Cliente do Form (Client Area onde os componentes vivem) */}
              <div
                ref={clientAreaRef}
                style={{ width: `${formWidth}px`, height: `${formHeight}px` }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectComponent(dfmModel.name);
                }}
                className="relative bg-[#f0f2f5] overflow-hidden"
              >
                {/* Componentes Visuais */}
                {visualChildren.map((child) => {
                  const layout = layoutMap.get(child.name);
                  const bounds = layout?.bounds || {
                    left: Number(child.properties.Left) || 0,
                    top: Number(child.properties.Top) || 0,
                    width: Number(child.properties.Width) || 75,
                    height: Number(child.properties.Height) || 25
                  };

                  return (
                    <VCLRenderer
                      key={child.name}
                      component={child}
                      bounds={bounds}
                      isSelected={selectedComponentName === child.name}
                      selectedComponentName={selectedComponentName}
                      transientBoundsMap={transientBounds}
                      onSelect={(e) => {
                        e.stopPropagation();
                        onSelectComponent(child.name);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onComponentDoubleClick(child.name, 'OnClick');
                      }}
                      onStartMove={handleStartMove}
                      onStartResize={handleStartResize}
                      onSelectChild={onSelectComponent}
                      onDoubleClickChild={onComponentDoubleClick}
                    />
                  );
                })}

                {/* Fantasma de Arraste da Paleta (Ghost Preview) */}
                {dragGhost && dragGhost.visible && (
                  <div
                    style={{
                      left: `${dragGhost.x}px`,
                      top: `${dragGhost.y}px`,
                      width: `${dragGhost.width}px`,
                      height: `${dragGhost.height}px`
                    }}
                    className="absolute border-2 border-dashed border-blue-500 bg-blue-500/20 rounded pointer-events-none z-50 flex items-center justify-center text-[10px] font-mono font-bold text-blue-700 shadow-md backdrop-blur-[1px]"
                  >
                    {dragGhost.containerName ? (
                      <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[9px] shadow-sm">
                        Parent: {dragGhost.containerName} ({dragGhost.relX}, {dragGhost.relY})
                      </span>
                    ) : (
                      <span>({dragGhost.x}, {dragGhost.y})</span>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Bandeja Dedicada de Componentes Não-Visuais (Non-Visual Component Tray) */}
              {nonVisualChildren.length > 0 && (
                <div className="bg-[#e2e8f0] border-t-2 border-zinc-400/80 px-3 py-2 flex flex-col gap-1.5 shrink-0 select-none">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Bandeja de Componentes Lógicos ({nonVisualChildren.length})</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-normal">
                      Clique para inspecionar • Duplo clique para eventos
                    </span>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto py-1">
                    {nonVisualChildren.map(comp => {
                      const isSelected = selectedComponentName === comp.name;
                      return (
                        <div
                          key={comp.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectComponent(comp.name);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            const defEvent = comp.className === 'TTimer' ? 'OnTimer' : 'OnClick';
                            onComponentDoubleClick(comp.name, defEvent);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                              : 'bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 shadow-xs'
                          }`}
                          title={`${comp.className}: ${comp.name}\n(Componente não-visual)`}
                        >
                          <div className="shrink-0">
                            {renderNonVisualIcon(comp)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold leading-tight font-mono">
                              {comp.name}
                            </span>
                            <span className={`text-[9px] leading-tight ${isSelected ? 'text-blue-100' : 'text-zinc-500'}`}>
                              {comp.className}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Barra de Status Inferior do Designer */}
      <div className="h-6 bg-[#18191e] border-t border-white/[0.08] px-3 flex items-center justify-between text-[11px] text-zinc-400 font-mono shrink-0">
        <div className="flex items-center gap-3">
          <span>
            Formulário: <strong className="text-zinc-200">{dfmModel.name}</strong>
          </span>
          <span className="text-zinc-600">|</span>
          <span>
            Dimensões: <strong className="text-zinc-300">{formWidth} × {formHeight} px</strong>
          </span>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1 text-zinc-400">
            <Grid className="w-3 h-3 text-zinc-500" />
            <span>Grid: <strong>8px</strong> (Segure <kbd className="bg-zinc-800 px-1 rounded text-[10px] text-zinc-300">Alt</kbd> para pixel livre)</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {mousePos && (
            <span>
              Cursor: <strong className="text-zinc-300">X: {mousePos.x}, Y: {mousePos.y}</strong>
            </span>
          )}
          <span className="text-zinc-600">|</span>
          <span>
            Componentes: <strong className="text-zinc-300">{dfmModel.children.length}</strong>
          </span>
          <span className="text-zinc-600">|</span>
          <span>
            Selecionado: <strong className="text-blue-400">{selectedComponentName}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
