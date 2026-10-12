import React from 'react';
import type { DFMObject, Rect } from '../../../common/types.ts';
import type { ResizeHandleType } from '../../../common/vcl/geometry.ts';
import { FileText, Cpu, Check, Clock, FolderOpen, Database } from 'lucide-react';

interface VCLRendererProps {
  component: DFMObject;
  bounds: Rect;
  isSelected: boolean;
  selectedComponentName?: string;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onStartMove?: (e: React.PointerEvent, compName: string, parentName?: string) => void;
  onStartResize?: (e: React.PointerEvent, compName: string, handle: ResizeHandleType, parentName?: string) => void;
  onSelectChild?: (name: string) => void;
  onDoubleClickChild?: (compName: string, eventName?: string) => void;
  parentName?: string;
  transientBoundsMap?: Record<string, Rect>;
}

export const VCLRenderer: React.FC<VCLRendererProps> = ({
  component,
  bounds: initialBounds,
  isSelected,
  selectedComponentName,
  onSelect,
  onDoubleClick,
  onStartMove,
  onStartResize,
  onSelectChild,
  onDoubleClickChild,
  parentName,
  transientBoundsMap
}) => {
  const bounds = transientBoundsMap?.[component.name] || initialBounds;
  const p = component.properties;
  const caption = p.Caption !== undefined ? String(p.Caption) : component.name;
  const align = p.Align || 'alNone';
  const isMoveable = align === 'alNone';

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    boxSizing: 'border-box'
  };

  const renderComponentBody = () => {
    switch (component.className) {
      case 'TButton':
      case 'TBitBtn':
        return (
          <button className="w-full h-full bg-[#f3f4f6] hover:bg-white text-zinc-900 border border-zinc-400/80 rounded shadow-xs text-xs font-medium flex items-center justify-center select-none active:translate-y-px transition-all pointer-events-none">
            {caption}
          </button>
        );

      case 'TLabel':
        return (
          <span className="text-zinc-900 text-xs select-none block leading-tight font-sans font-medium pointer-events-none">
            {caption}
          </span>
        );

      case 'TEdit':
        return (
          <div className="w-full h-full bg-white border border-zinc-400 rounded px-2 flex items-center shadow-xs pointer-events-none">
            <span className="text-zinc-800 text-xs truncate">
              {p.Text !== undefined && p.Text !== '' ? String(p.Text) : ''}
            </span>
            {(!p.Text || p.Text === '') && (
              <span className="text-zinc-400 text-xs italic">{component.name}</span>
            )}
          </div>
        );

      case 'TMemo':
        return (
          <div className="w-full h-full bg-white border border-zinc-400 rounded p-1.5 text-xs text-zinc-800 font-mono shadow-xs overflow-hidden flex flex-col justify-start pointer-events-none">
            <span className="text-[11px] text-zinc-700 leading-snug whitespace-pre-wrap">
              {Array.isArray(p.Lines) ? p.Lines.join('\n') : String(p.Lines || caption)}
            </span>
          </div>
        );

      case 'TPanel':
        return (
          <div
            data-container-name={component.name}
            className="w-full h-full bg-[#e5e7eb] border border-zinc-300 rounded shadow-xs relative overflow-hidden flex flex-col"
          >
            {caption && !component.children?.length && (
              <span className="text-[11px] font-semibold text-zinc-600 select-none m-auto pointer-events-none">
                {caption}
              </span>
            )}
            {/* Filhos renderizados dentro do Painel */}
            {component.children?.map(child => {
              const childBounds = transientBoundsMap?.[child.name] || {
                left: Number(child.properties.Left) || 0,
                top: Number(child.properties.Top) || 0,
                width: Number(child.properties.Width) || 75,
                height: Number(child.properties.Height) || 25
              };
              return (
                <VCLRenderer
                  key={child.name}
                  component={child}
                  bounds={childBounds}
                  isSelected={selectedComponentName === child.name}
                  selectedComponentName={selectedComponentName}
                  onSelect={(e) => {
                    e.stopPropagation();
                    onSelectChild ? onSelectChild(child.name) : onSelect(e);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onDoubleClickChild ? onDoubleClickChild(child.name, 'OnClick') : onDoubleClick(e);
                  }}
                  onStartMove={onStartMove}
                  onStartResize={onStartResize}
                  onSelectChild={onSelectChild}
                  onDoubleClickChild={onDoubleClickChild}
                  parentName={component.name}
                  transientBoundsMap={transientBoundsMap}
                />
              );
            })}
          </div>
        );

      case 'TCheckBox':
        return (
          <div className="flex items-center gap-1.5 text-xs text-zinc-900 font-medium select-none pointer-events-none">
            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${p.Checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-zinc-400'}`}>
              {p.Checked && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>{caption}</span>
          </div>
        );

      case 'TRadioButton':
        return (
          <div className="flex items-center gap-1.5 text-xs text-zinc-900 font-medium select-none pointer-events-none">
            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${p.Checked ? 'border-blue-600 bg-white' : 'bg-white border-zinc-400'}`}>
              {p.Checked && <div className="w-2 h-2 rounded-full bg-blue-600" />}
            </div>
            <span>{caption}</span>
          </div>
        );

      case 'TComboBox':
        return (
          <div className="w-full h-full bg-white border border-zinc-400 rounded flex items-center justify-between px-2 text-xs text-zinc-800 select-none shadow-xs pointer-events-none">
            <span className="truncate">{caption || component.name}</span>
            <span className="text-[9px] text-zinc-500 font-mono">▼</span>
          </div>
        );

      case 'TGroupBox':
        return (
          <div
            data-container-name={component.name}
            className="w-full h-full border border-zinc-400 rounded p-2 relative bg-transparent"
          >
            <span className="absolute -top-2 left-2 bg-[#f0f2f5] px-1 text-[10px] text-zinc-700 font-bold uppercase tracking-wider pointer-events-none">
              {caption}
            </span>
            {component.children?.map(child => {
              const childBounds = transientBoundsMap?.[child.name] || {
                left: Number(child.properties.Left) || 0,
                top: Number(child.properties.Top) || 0,
                width: Number(child.properties.Width) || 75,
                height: Number(child.properties.Height) || 25
              };
              return (
                <VCLRenderer
                  key={child.name}
                  component={child}
                  bounds={childBounds}
                  isSelected={selectedComponentName === child.name}
                  selectedComponentName={selectedComponentName}
                  onSelect={(e) => {
                    e.stopPropagation();
                    onSelectChild ? onSelectChild(child.name) : onSelect(e);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onDoubleClickChild ? onDoubleClickChild(child.name, 'OnClick') : onDoubleClick(e);
                  }}
                  onStartMove={onStartMove}
                  onStartResize={onStartResize}
                  onSelectChild={onSelectChild}
                  onDoubleClickChild={onDoubleClickChild}
                  parentName={component.name}
                  transientBoundsMap={transientBoundsMap}
                />
              );
            })}
          </div>
        );

      case 'TDBGrid':
        return (
          <div className="w-full h-full bg-white border border-zinc-400 rounded flex flex-col text-[11px] text-zinc-800 select-none shadow-xs overflow-hidden pointer-events-none">
            <div className="h-6 bg-[#e2e8f0] border-b border-zinc-300 flex items-center font-bold text-[10px] text-zinc-700">
              <span className="w-20 border-r border-zinc-300 px-2">CÓDIGO</span>
              <span className="w-48 border-r border-zinc-300 px-2">DESCRIÇÃO</span>
              <span className="w-24 px-2 text-right">VALOR (R$)</span>
            </div>
            <div className="flex-1 bg-white p-2 text-zinc-400 font-mono text-[10px] flex items-center justify-center italic">
              Grade de Dados Conectada: {p.DataSource || 'dsPrincipal'}
            </div>
          </div>
        );

      case 'TSpeedButton':
        return (
          <button className="w-full h-full bg-[#f3f4f6] hover:bg-white border border-zinc-300 rounded flex items-center justify-center text-xs text-zinc-800 font-semibold shadow-xs select-none pointer-events-none">
            {caption || '⚡'}
          </button>
        );

      case 'TProgressBar':
        return (
          <div className="w-full h-full bg-zinc-200 border border-zinc-400 rounded overflow-hidden p-0.5 shadow-inner pointer-events-none">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded"
              style={{ width: `${p.Position || 60}%` }}
            />
          </div>
        );

      case 'TTimer':
        return (
          <div className="w-full h-full bg-amber-50 border border-amber-400 rounded flex flex-col items-center justify-center p-0.5 text-center shadow-xs pointer-events-none">
            <Clock className="w-4 h-4 text-amber-700" />
            <span className="text-[8px] font-bold text-amber-900 leading-none mt-0.5">{component.name}</span>
          </div>
        );

      case 'TOpenDialog':
      case 'TSaveDialog':
        return (
          <div className="w-full h-full bg-emerald-50 border border-emerald-400 rounded flex flex-col items-center justify-center p-0.5 text-center shadow-xs pointer-events-none">
            <FolderOpen className="w-4 h-4 text-emerald-700" />
            <span className="text-[8px] font-bold text-emerald-900 leading-none mt-0.5">{component.name}</span>
          </div>
        );

      case 'TDataSource':
        return (
          <div className="w-full h-full bg-cyan-50 border border-cyan-400 rounded flex flex-col items-center justify-center p-0.5 text-center shadow-xs pointer-events-none">
            <Database className="w-4 h-4 text-cyan-700" />
            <span className="text-[8px] font-bold text-cyan-900 leading-none mt-0.5">{component.name}</span>
          </div>
        );

      case 'TACBrNFe':
        return (
          <div className="w-full h-full bg-blue-50 border border-blue-400 rounded-md flex flex-col items-center justify-center p-1 text-center shadow-xs pointer-events-none">
            <FileText className="w-4 h-4 text-blue-700" />
            <span className="text-[9px] font-bold text-blue-900 leading-none mt-0.5">{component.name}</span>
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-amber-50 border-2 border-dashed border-amber-500 rounded flex flex-col items-center justify-center p-1 text-center select-none shadow-xs pointer-events-none">
            <Cpu className="w-4 h-4 text-amber-700" />
            <span className="text-[9px] font-bold text-amber-900 leading-tight">[{component.className}]</span>
            <span className="text-[8px] text-amber-800">{component.name}</span>
          </div>
        );
    }
  };

  // As 8 alças clássicas de redimensionamento do Delphi RAD Studio
  const resizeHandles: Array<{ handle: ResizeHandleType; className: string }> = [
    { handle: 'nw', className: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize' },
    { handle: 'n', className: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize' },
    { handle: 'ne', className: 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize' },
    { handle: 'e', className: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-ew-resize' },
    { handle: 'se', className: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize' },
    { handle: 's', className: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize' },
    { handle: 'sw', className: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize' },
    { handle: 'w', className: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize' }
  ];

  return (
    <div
      style={style}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onPointerDown={(e) => {
        if (isMoveable && onStartMove) {
          onStartMove(e, component.name, parentName);
        }
      }}
      className={`group ${
        isMoveable ? 'cursor-move' : 'cursor-default'
      } ${
        isSelected
          ? 'vcl-selected ring-2 ring-blue-500 shadow-md z-20'
          : 'hover:outline hover:outline-1 hover:outline-blue-400'
      }`}
      title={`${component.className}: ${component.name}`}
    >
      {renderComponentBody()}

      {/* Badge Flutuante de Coordenadas quando selecionado */}
      {isSelected && (
        <div className="absolute -top-5 -left-0.5 bg-blue-600 text-white text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded shadow-md pointer-events-none z-30 whitespace-nowrap">
          {component.name} ({bounds.left}, {bounds.top} • {bounds.width}×{bounds.height})
        </div>
      )}

      {/* 8 Alças de Redimensionamento Interativas */}
      {isSelected && isMoveable && (
        <>
          {resizeHandles.map(({ handle, className }) => (
            <div
              key={handle}
              onPointerDown={(e) => {
                e.stopPropagation();
                onStartResize?.(e, component.name, handle, parentName);
              }}
              className={`absolute w-2 h-2 bg-white border border-blue-600 rounded-2xs shadow-xs z-40 hover:bg-blue-100 ${className}`}
              title={`Redimensionar (${handle.toUpperCase()})`}
            />
          ))}
        </>
      )}
    </div>
  );
};
