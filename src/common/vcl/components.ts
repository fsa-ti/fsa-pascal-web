import type { VCLComponentMeta } from '../types.ts';

/**
 * Catálogo e Metadados de Componentes VCL Padrão do Delphi
 */
export const VCL_BUILTIN_COMPONENTS: VCLComponentMeta[] = [
  // --- Standard ---
  {
    className: 'TButton',
    name: 'Button',
    category: 'Standard',
    description: 'Botão de comando padrão VCL acionado por clique',
    defaultWidth: 75,
    defaultHeight: 25,
    defaultProperties: {
      Caption: 'Button',
      TabOrder: 0
    }
  },
  {
    className: 'TLabel',
    name: 'Label',
    category: 'Standard',
    description: 'Rótulo de texto estático não editável',
    defaultWidth: 65,
    defaultHeight: 15,
    defaultProperties: {
      Caption: 'Label',
      Font: { Size: 9, Name: 'Segoe UI' }
    }
  },
  {
    className: 'TEdit',
    name: 'Edit',
    category: 'Standard',
    description: 'Caixa de texto de linha única para entrada de dados',
    defaultWidth: 121,
    defaultHeight: 23,
    defaultProperties: {
      Text: '',
      TabOrder: 0
    }
  },
  {
    className: 'TMemo',
    name: 'Memo',
    category: 'Standard',
    description: 'Área de edição de texto multi-linha com scroll',
    defaultWidth: 185,
    defaultHeight: 89,
    defaultProperties: {
      Lines: ['Memo1'],
      ScrollBars: 'ssVertical',
      TabOrder: 0
    }
  },
  {
    className: 'TPanel',
    name: 'Panel',
    category: 'Standard',
    description: 'Contêiner de agrupamento e alinhamento visual',
    defaultWidth: 185,
    defaultHeight: 41,
    defaultProperties: {
      Caption: '',
      BevelOuter: 'bvRaised',
      TabOrder: 0
    }
  },
  {
    className: 'TCheckBox',
    name: 'CheckBox',
    category: 'Standard',
    description: 'Caixa de seleção booleana (Checked/Unchecked)',
    defaultWidth: 97,
    defaultHeight: 17,
    defaultProperties: {
      Caption: 'CheckBox',
      Checked: false,
      TabOrder: 0
    }
  },
  {
    className: 'TRadioButton',
    name: 'RadioButton',
    category: 'Standard',
    description: 'Botão de opção mutuamente exclusivo',
    defaultWidth: 113,
    defaultHeight: 17,
    defaultProperties: {
      Caption: 'RadioButton',
      Checked: false,
      TabOrder: 0
    }
  },
  {
    className: 'TComboBox',
    name: 'ComboBox',
    category: 'Standard',
    description: 'Caixa de combinação com lista suspensa',
    defaultWidth: 145,
    defaultHeight: 23,
    defaultProperties: {
      Style: 'csDropDown',
      TabOrder: 0
    }
  },
  {
    className: 'TListBox',
    name: 'ListBox',
    category: 'Standard',
    description: 'Lista de seleção de itens textuais com barra de rolagem',
    defaultWidth: 121,
    defaultHeight: 97,
    defaultProperties: {
      TabOrder: 0
    }
  },
  {
    className: 'TGroupBox',
    name: 'GroupBox',
    category: 'Standard',
    description: 'Painel contêiner com borda e legenda no topo',
    defaultWidth: 185,
    defaultHeight: 105,
    defaultProperties: {
      Caption: 'GroupBox',
      TabOrder: 0
    }
  },

  // --- Additional ---
  {
    className: 'TSpeedButton',
    name: 'SpeedButton',
    category: 'Additional',
    description: 'Botão gráfico leve de barra de ferramentas sem foco de tabulação',
    defaultWidth: 23,
    defaultHeight: 22,
    defaultProperties: {
      Caption: ''
    }
  },
  {
    className: 'TBitBtn',
    name: 'BitBtn',
    category: 'Additional',
    description: 'Botão com suporte a ícones glifos e modal result',
    defaultWidth: 75,
    defaultHeight: 25,
    defaultProperties: {
      Caption: 'BitBtn',
      Kind: 'bkCustom',
      TabOrder: 0
    }
  },
  {
    className: 'TImage',
    name: 'Image',
    category: 'Additional',
    description: 'Área de exibição gráfica de bitmaps e ícones',
    defaultWidth: 105,
    defaultHeight: 105,
    defaultProperties: {
      Stretch: true
    }
  },
  {
    className: 'TShape',
    name: 'Shape',
    category: 'Additional',
    description: 'Forma geométrica vetorial simples (retângulo, círculo, elipse)',
    defaultWidth: 65,
    defaultHeight: 65,
    defaultProperties: {
      Shape: 'stRectangle'
    }
  },

  // --- Win32 ---
  {
    className: 'TPageControl',
    name: 'PageControl',
    category: 'Win32',
    description: 'Contêiner de páginas com abas de navegação multi-camadas',
    defaultWidth: 289,
    defaultHeight: 193,
    defaultProperties: {
      TabOrder: 0
    }
  },
  {
    className: 'TProgressBar',
    name: 'ProgressBar',
    category: 'Win32',
    description: 'Barra de indicação de progresso visual percentual',
    defaultWidth: 150,
    defaultHeight: 17,
    defaultProperties: {
      Min: 0,
      Max: 100,
      Position: 50,
      TabOrder: 0
    }
  },
  {
    className: 'TStatusBar',
    name: 'StatusBar',
    category: 'Win32',
    description: 'Barra de status no rodapé com múltiplos painéis',
    defaultWidth: 400,
    defaultHeight: 19,
    defaultProperties: {
      Align: 'alBottom',
      SimpleText: 'Pronto'
    }
  },

  // --- Data Controls ---
  {
    className: 'TDBGrid',
    name: 'DBGrid',
    category: 'Data Controls',
    description: 'Grade de dados tabular vinculada a um TDataSource',
    defaultWidth: 320,
    defaultHeight: 120,
    defaultProperties: {
      TabOrder: 0
    }
  },
  {
    className: 'TDBEdit',
    name: 'DBEdit',
    category: 'Data Controls',
    description: 'Edição de campos vinculados a banco de dados',
    defaultWidth: 121,
    defaultHeight: 23,
    defaultProperties: {
      TabOrder: 0
    }
  },
  // --- System (Non-Visual) ---
  {
    className: 'TTimer',
    name: 'Timer',
    category: 'System',
    description: 'Temporizador para disparo periódico de eventos OnTimer',
    defaultWidth: 28,
    defaultHeight: 28,
    isNonVisual: true,
    defaultProperties: {
      Interval: 1000,
      Enabled: true
    }
  },

  // --- Dialogs (Non-Visual) ---
  {
    className: 'TOpenDialog',
    name: 'OpenDialog',
    category: 'Dialogs',
    description: 'Caixa de diálogo padrão do Windows para seleção de arquivos',
    defaultWidth: 28,
    defaultHeight: 28,
    isNonVisual: true,
    defaultProperties: {
      Filter: 'Todos os arquivos (*.*)|*.*',
      Title: 'Abrir Arquivo'
    }
  },
  {
    className: 'TSaveDialog',
    name: 'SaveDialog',
    category: 'Dialogs',
    description: 'Caixa de diálogo padrão para gravação de arquivos',
    defaultWidth: 28,
    defaultHeight: 28,
    isNonVisual: true,
    defaultProperties: {
      Filter: 'Todos os arquivos (*.*)|*.*',
      Title: 'Salvar Arquivo'
    }
  },

  // --- Data Access (Non-Visual) ---
  {
    className: 'TDataSource',
    name: 'DataSource',
    category: 'Data Controls',
    description: 'Ponte de ligação entre DataSets e componentes visuais de dados',
    defaultWidth: 28,
    defaultHeight: 28,
    isNonVisual: true,
    defaultProperties: {
      AutoEdit: true
    }
  },

  // --- Custom & Fiscal (Non-Visual) ---
  {
    className: 'TACBrNFe',
    name: 'ACBrNFe',
    category: 'Custom',
    description: 'Componente ACBr para emissão e gestão de Nota Fiscal Eletrônica (NF-e)',
    defaultWidth: 28,
    defaultHeight: 28,
    isNonVisual: true,
    defaultProperties: {
      Configuracoes: { Geral: { ModeloDF: 'moNFe', VersaoDF: 've400' } }
    }
  }
];

export class VCLComponentRegistry {
  private static components: Map<string, VCLComponentMeta> = new Map();

  static {
    for (const comp of VCL_BUILTIN_COMPONENTS) {
      this.register(comp);
    }
  }

  public static register(comp: VCLComponentMeta): void {
    this.components.set(comp.className, comp);
  }

  public static get(className: string): VCLComponentMeta | undefined {
    return this.components.get(className);
  }

  public static isNonVisual(className: string): boolean {
    const comp = this.get(className);
    if (comp?.isNonVisual) return true;
    return ['TTimer', 'TOpenDialog', 'TSaveDialog', 'TDataSource', 'TACBrNFe', 'TACBrPosPrinter', 'TFDQuery', 'TFDConnection'].includes(className);
  }

  public static getAll(): VCLComponentMeta[] {
    return Array.from(this.components.values());
  }

  public static getByCategory(category: string): VCLComponentMeta[] {
    return this.getAll().filter(c => c.category === category);
  }

  public static getCategories(): string[] {
    const cats = new Set(this.getAll().map(c => c.category));
    return Array.from(cats);
  }
}
