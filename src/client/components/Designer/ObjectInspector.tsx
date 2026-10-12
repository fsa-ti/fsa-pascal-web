import React, { useState } from 'react';
import { DFMObject } from '../../../common/types.ts';
import { Trash2, Zap, Sliders, ChevronDown } from 'lucide-react';

interface ObjectInspectorProps {
  rootDfm: DFMObject | null;
  selectedComponentName: string;
  onSelectComponent: (name: string) => void;
  onUpdateProperty: (compName: string, propName: string, value: any) => void;
  onDeleteComponent: () => void;
  onEventDoubleClick: (compName: string, eventName: string) => void;
}

export const ObjectInspector: React.FC<ObjectInspectorProps> = ({
  rootDfm,
  selectedComponentName,
  onSelectComponent,
  onUpdateProperty,
  onDeleteComponent,
  onEventDoubleClick
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'events'>('properties');

  if (!rootDfm) {
    return (
      <aside className="w-72 bg-[#16171b] border-l border-white/[0.08] p-4 text-xs text-zinc-500 shrink-0">
        Nenhum formulário ativo.
      </aside>
    );
  }

  // Lista plana de componentes para o combobox
  const allComponents: DFMObject[] = [];
  const collect = (node: DFMObject) => {
    allComponents.push(node);
    node.children?.forEach(collect);
  };
  collect(rootDfm);

  const activeComp = allComponents.find(c => c.name === selectedComponentName) || rootDfm;
  const isFormRoot = activeComp.name === rootDfm.name;

  const standardProps = [
    { name: 'Name', type: 'string', val: activeComp.name, readOnly: isFormRoot },
    { name: 'Caption', type: 'string', val: activeComp.properties.Caption ?? '' },
    { name: 'Left', type: 'number', val: activeComp.properties.Left ?? 0 },
    { name: 'Top', type: 'number', val: activeComp.properties.Top ?? 0 },
    { name: 'Width', type: 'number', val: activeComp.properties.Width ?? activeComp.properties.ClientWidth ?? 100 },
    { name: 'Height', type: 'number', val: activeComp.properties.Height ?? activeComp.properties.ClientHeight ?? 50 },
    {
      name: 'Align',
      type: 'enum',
      val: activeComp.properties.Align || 'alNone',
      options: ['alNone', 'alTop', 'alBottom', 'alLeft', 'alRight', 'alClient']
    },
    { name: 'Visible', type: 'boolean', val: activeComp.properties.Visible ?? true },
    { name: 'Enabled', type: 'boolean', val: activeComp.properties.Enabled ?? true },
    { name: 'Color', type: 'string', val: activeComp.properties.Color || 'clBtnFace' },
    { name: 'TabOrder', type: 'number', val: activeComp.properties.TabOrder ?? 0 }
  ];

  const standardEvents = [
    { name: 'OnClick', val: activeComp.properties.OnClick || '' },
    { name: 'OnCreate', val: activeComp.properties.OnCreate || '' },
    { name: 'OnShow', val: activeComp.properties.OnShow || '' },
    { name: 'OnChange', val: activeComp.properties.OnChange || '' },
    { name: 'OnEnter', val: activeComp.properties.OnEnter || '' },
    { name: 'OnExit', val: activeComp.properties.OnExit || '' }
  ];

  return (
    <aside className="w-72 bg-[#16171b] border-l border-white/[0.08] flex flex-col text-xs select-none shrink-0 h-full">
      {/* Cabeçalho do Inspector */}
      <div className="p-2.5 border-b border-white/[0.08] bg-[#18191e] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
            Inspetor de Objetos
          </span>
          {!isFormRoot && (
            <button
              onClick={onDeleteComponent}
              className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/40 transition-colors"
              title="Excluir Componente Selecionado (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown de Seleção de Componente */}
        <div className="relative">
          <select
            value={activeComp.name}
            onChange={(e) => onSelectComponent(e.target.value)}
            className="w-full bg-[#121316] border border-white/[0.08] hover:border-blue-500/50 rounded-md px-2.5 py-1.5 text-zinc-200 text-xs font-mono outline-none cursor-pointer appearance-none transition-colors"
          >
            {allComponents.map(c => (
              <option key={c.name} value={c.name} className="bg-[#18191e]">
                {c.name}: {c.className}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2 pointer-events-none" />
        </div>
      </div>

      {/* Switcher de Abas: Propriedades vs Eventos */}
      <div className="flex border-b border-white/[0.08] bg-[#141518] p-1 gap-1">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-1 rounded flex items-center justify-center gap-1.5 font-medium transition-all ${
            activeTab === 'properties'
              ? 'bg-[#22232a] text-blue-400 font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3 h-3" />
          <span>Propriedades</span>
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-1 rounded flex items-center justify-center gap-1.5 font-medium transition-all ${
            activeTab === 'events'
              ? 'bg-[#22232a] text-amber-400 font-semibold shadow-xs'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>Eventos</span>
        </button>
      </div>

      {/* Grade de Propriedades */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'properties' ? (
          <table className="w-full text-[11px] border-collapse">
            <tbody>
              {standardProps.map(prop => (
                <tr key={prop.name} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                  <td className="w-28 px-2.5 py-1.5 text-zinc-400 font-mono border-r border-white/[0.04]">
                    {prop.name}
                  </td>
                  <td className="px-2 py-1">
                    {prop.type === 'enum' ? (
                      <select
                        value={String(prop.val)}
                        onChange={(e) => onUpdateProperty(activeComp.name, prop.name, e.target.value)}
                        className="w-full bg-transparent text-zinc-200 text-[11px] font-mono outline-none cursor-pointer"
                      >
                        {prop.options?.map(opt => (
                          <option key={opt} value={opt} className="bg-[#18191e]">
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : prop.type === 'boolean' ? (
                      <select
                        value={String(prop.val)}
                        onChange={(e) => onUpdateProperty(activeComp.name, prop.name, e.target.value === 'true')}
                        className="w-full bg-transparent text-zinc-200 text-[11px] font-mono outline-none cursor-pointer"
                      >
                        <option value="true" className="bg-[#18191e]">True</option>
                        <option value="false" className="bg-[#18191e]">False</option>
                      </select>
                    ) : (
                      <input
                        type={prop.type === 'number' ? 'number' : 'text'}
                        value={prop.val}
                        readOnly={prop.readOnly}
                        onChange={(e) => {
                          const v = prop.type === 'number' ? Number(e.target.value) : e.target.value;
                          onUpdateProperty(activeComp.name, prop.name, v);
                        }}
                        className="w-full bg-transparent text-zinc-200 text-[11px] font-mono outline-none focus:text-white"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* Grade de Eventos */
          <table className="w-full text-[11px] border-collapse">
            <tbody>
              {standardEvents.map(evt => (
                <tr
                  key={evt.name}
                  onDoubleClick={() => onEventDoubleClick(activeComp.name, evt.name)}
                  className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer group transition-colors"
                  title="Duplo clique para implementar o método na unit .pas"
                >
                  <td className="w-24 px-2.5 py-1.5 text-amber-400 font-mono border-r border-white/[0.04]">
                    {evt.name}
                  </td>
                  <td className="px-2 py-1 font-mono text-zinc-300 flex items-center justify-between">
                    <span>{evt.val || '<None>'}</span>
                    <span className="text-[9px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      [2x Clique]
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </aside>
  );
};
