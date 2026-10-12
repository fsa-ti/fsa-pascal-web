import React, { useState } from 'react';
import { VCLComponentRegistry } from '../../../common/vcl/components.ts';
import { Search, Plus, Layers, Sparkles } from 'lucide-react';

interface PaletteProps {
  onAddComponent: (className: string, defaultProps: Record<string, any>) => void;
  onDragStartComponent?: (className: string, defaultProps: Record<string, any>) => void;
}

export const Palette: React.FC<PaletteProps> = ({ onAddComponent, onDragStartComponent }) => {
  const categories = VCLComponentRegistry.getCategories();
  const [activeCategory, setActiveCategory] = useState<string>('Standard');
  const [filterText, setFilterText] = useState<string>('');

  const components = VCLComponentRegistry.getAll().filter(c => {
    const matchesCat = activeCategory === 'All' || c.category === activeCategory;
    const matchesFilter =
      !filterText ||
      c.className.toLowerCase().includes(filterText.toLowerCase()) ||
      c.description.toLowerCase().includes(filterText.toLowerCase());
    return matchesCat && matchesFilter;
  });

  return (
    <div className="bg-[#18191e] border-b border-white/[0.08] px-3 py-2 flex flex-col gap-2 shrink-0 select-none">
      {/* Linha Superior: Abas de Categoria e Busca */}
      <div className="flex items-center justify-between gap-3">
        {/* Abas de Categorias */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              activeCategory === 'All'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            Todos
          </button>

          {categories.map(cat => {
            const label = cat === 'Standard' ? 'Padrão'
              : cat === 'Additional' ? 'Adicional'
              : cat === 'System' ? 'Sistema'
              : cat === 'Dialogs' ? 'Diálogos'
              : cat === 'Data Controls' ? 'Controles de Dados'
              : cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-[#292b35] text-zinc-100 border border-white/[0.1] shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                {label}
              </button>
            );
          })}

          <button
            onClick={() => setActiveCategory('Custom')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
              activeCategory === 'Custom'
                ? 'bg-purple-900/60 border border-purple-500/40 text-purple-200 shadow-xs'
                : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/30'
            }`}
          >
            Fiscal & Plugins
          </button>
        </div>

        {/* Input de Busca Rápida */}
        <div className="relative w-44 shrink-0">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filtrar componentes..."
            className="w-full bg-[#121316] border border-white/[0.08] rounded-md pl-8 pr-2 py-1 text-[11px] text-zinc-200 placeholder-zinc-500 outline-none focus:border-blue-500/60 transition-colors"
          />
        </div>
      </div>

      {/* Grade de Componentes com Drag & Drop Físico */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        {components.map(comp => {
          const shortName = comp.className.replace(/^T/, '');
          return (
            <button
              key={comp.className}
              draggable={true}
              onDragStart={(e) => {
                const payload = JSON.stringify({
                  className: comp.className,
                  defaultProps: comp.defaultProperties || {}
                });
                e.dataTransfer.setData('application/json', payload);
                onDragStartComponent?.(comp.className, comp.defaultProperties || {});
              }}
              onClick={() => onAddComponent(comp.className, comp.defaultProperties || {})}
              className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#22232a] hover:bg-[#2c2d36] border border-white/[0.08] hover:border-blue-500/50 text-zinc-200 transition-all shadow-xs active:scale-95 shrink-0 cursor-grab active:cursor-grabbing"
              title={`${comp.className}: ${comp.description}\n(Clique para adicionar ou ARRASTE diretamente para a tela)`}
            >
              <div className="w-4 h-4 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-[10px] group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
              <span className="font-mono text-[11px] font-medium">{shortName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
