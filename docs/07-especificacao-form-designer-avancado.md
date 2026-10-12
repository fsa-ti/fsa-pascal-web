# 07 - Especificação de Engenharia de Requisitos: Form Designer WYSIWYG Interativo de Alta Fidelidade

> **Documento:** Especificação de Requisitos Funcionais e UI/UX Avançada  
> **Status:** Aprovado para Implementação - Baseline 2.0  
> **Autor:** Engenheiro de Requisitos Principal & Arquiteto Front-End  

---

## 1. Diagnóstico da Causa-Raiz (Gap Analysis)

### 1.1 O Problema Real
O feedback do usuário foi categórico: *"Arrastar os componentes não parece de fato ser um componente, parece apenas um menu com tudo inacabado... muito longe de poder usar o básico."*

A análise de causa-raiz identifica 5 deficiências críticas na experiência atual que geram a percepção de protótipo inacabado:

| # | Sintoma Percebido | Causa-Raiz Técnica | O Que uma IDE Real Exige |
| :-: | :--- | :--- | :--- |
| **G1** | "Não parece arrastar" | O clique na paleta apenas insere o componente em coordenadas fixas/offset. Não há arraste contínuo (Drag & Drop nativo) com cursor e fantasma (*drag preview*). | **Drag & Drop Físico:** O usuário clica na paleta, arrasta o ponteiro sobre a tela vendo a silhueta translúcida do componente e solta na posição exata (X, Y). |
| **G2** | Componente parece estático e "travado" | Falta de manipulação direta com mouse na prancheta. Para mudar posição ou tamanho, o usuário é obrigado a digitar números no Object Inspector. | **Direct Manipulation Engine:** Clicar no componente na tela e arrastá-lo livremente com o mouse, com alças de redimensionamento (8 resize handles) nos cantos e bordas. |
| **G3** | Ausência de Contêineres Aninhados (Parent-Child) | Todos os componentes são salvos como filhos diretos da raiz do formulário (`Form1`). Ao mover um painel (`TPanel`), os botões dentro dele não se movem juntos. | **Hierarquia de Contêineres:** Se um controle é solto sobre um `TPanel` ou `TGroupBox`, ele se torna filho dele (`Parent = Panel1`), com coordenadas relativas e movimento em bloco. |
| **G4** | Falta de "Grid Snapping" e Guias Magnéticas | Componentes ficam em pixels fracionados desalinhados, passando a sensação de desenho amador sem precisão. | **Magnetic Snapping (8px) & Smart Guides:** Alinhamento magnético ao grid de 8px e linhas guias automáticas quando as bordas coincidem com outros controles. |
| **G5** | Componentes Não-Visuais misturados com a tela | Componentes como `TTimer`, `TOpenDialog`, `TDataSource` e `TACBrNFe` aparecem como caixas no meio da interface do usuário. | **Bandeja de Componentes Não-Visuais (Tray):** Barra inferior dedicada na prancheta onde componentes de lógica/sistema residem sem poluir a UI do formulário. |

---

## 2. Perguntas Críticas de Esclarecimento e Decisões de Engenharia

| # | Ponto de Decisão | Impacto | Decisão Arquitetural Recomendada |
| :--- | :--- | :--- | :--- |
| **D1** | **Grid Snapping deve ser ligado por padrão?** | Ergonomia / Precisão | **SIM (8px padrão):** O Delphi clássico utiliza grid de 8x8 pixels por padrão. O usuário poderá segurar `Alt` para movimentação livre pixel a pixel. |
| **D2** | **Como tratar atalhos de teclado no Designer?** | Velocidade de Operação | Teclas de seta (`↑`, `↓`, `←`, `→`) movem o componente selecionado em 1px; `Shift + Setas` redimensionam em 1px; `Ctrl + Setas` movem no grid de 8px. Tecla `Delete` exclui o componente. |
| **D3** | **Como sincronizar o DFM durante o arraste contínuo?** | Performance de Renderização | A atualização da árvore em memória (AST) e do Monaco Editor deve ocorrer no evento `onMouseUp` (*drag end*), evitando re-serializar o arquivo a cada frame de 16ms durante o arraste. |

---

## 3. Mapeamento de Regras de Negócio Invariantes (RN)

* **`[RN13] - Geometria Relativa a Contêiner Pai (Parenting):`** Quando um componente for solto sobre a área delimitadora de um controle que implementa a interface `IVCLContainer` (`TPanel`, `TGroupBox`, `TPageControl`, `TTabSheet`), suas propriedades `Left` e `Top` devem ser recalculadas como coordenadas relativas à borda superior esquerda do container pai.
* **`[RN14] - Cascata de Movimentação de Filhos:`** Mover ou redimensionar um container pai deve transladar todos os seus componentes filhos proporcionalmente sem alterar seus valores locais de `Left` e `Top`.
* **`[RN15] - Snapping Obrigatório a Múltiplos de Grid:`** As propriedades `Left`, `Top`, `Width` e `Height` calculadas interativamente pelo mouse devem ser arredondadas para múltiplos do tamanho de grid configurado (padrão: $8 \text{ px}$), a menos que a tecla modificadora de bypass (`Alt`) esteja pressionada.
* **`[RN16] - Limites Físicos e Não-Inversão de Dimensões:`** Um componente não pode ser redimensionado para dimensões inferiores a $8 \times 8 \text{ px}$. Puxar a alça de redimensionamento além da borda oposta não deve inverter a orientação do controle nem gerar dimensões negativas.
* **`[RN17] - Isolamento de Componentes Não-Visuais na Bandeja (Tray):`** Componentes que possuem a flag `isNonVisual: true` não podem receber propriedades de layout (`Align`, `Anchors`, `TabOrder`, `Width`, `Height`) e devem ser renderizados exclusivamente na barra de componentes não-visuais da base da janela.
* **`[RN18] - Desfazer/Refazer na Superfície de Desenho (Undo/Redo):`** Toda operação de criação, deleção, movimentação ou redimensionamento na prancheta deve empilhar um snapshot na pilha de histórico da IDE, permitindo reversão imediata via `Ctrl+Z` e restauração via `Ctrl+Y`.

---

## 4. Especificações Funcionais com Cenários BDD (Gherkin)

---

### RF07: Drag & Drop Nativo da Paleta para a Prancheta

**História de Usuário:**
> **Como** desenvolvedor desenhando uma interface gráfica,  
> **Quero** clicar em um controle na paleta, arrastá-lo até a posição exata da prancheta e ver seu contorno antes de soltar,  
> **Para que** eu posicione os elementos com precisão cirúrgica sem esforço.

#### Cenário 7.1 (Happy Path): Arraste e soltura com pré-visualização fantasma
```gherkin
Funcionalidade: Drag and Drop da Paleta
  Cenário: Arrastar TButton da paleta e soltar em coordenadas específicas
    Dado que o usuário está no Form Designer com o formulário aberto
    Quando o usuário clica sobre o item "TButton" na Paleta e inicia o arraste com o mouse
    Então o cursor deve exibir o ícone de arraste e uma silhueta translúcida (ghost) de 75x25 px
    E enquanto o cursor se move sobre o formulário, as coordenadas (X, Y) devem ser projetadas na régua
    Quando o usuário solta o botão do mouse na coordenada (X=160, Y=80)
    Então o componente "Button1" deve ser instanciado exatamente em Left=160, Top=80
    E o componente deve ser selecionado automaticamente com alças de redimensionamento ativas
```

#### Cenário 7.2 (Exceção): Soltura fora da área do formulário
```gherkin
  Cenário: Soltar o componente fora da janela do formulário
    Dado que o usuário arrasta um componente da paleta
    Quando solta o botão do mouse sobre a área externa cinza da prancheta
    Então a ação de inserção deve ser cancelada sem criar nenhum nó no DFM
    E a animação da silhueta deve retornar suavemente à paleta
```

---

### RF08: Manipulação Direta na Prancheta (Arrastar para Mover & Redimensionar por Alças)

**História de Usuário:**
> **Como** desenvolvedor ajustando o layout visual,  
> **Quero** clicar e arrastar qualquer componente na tela para reposicioná-lo e puxar suas alças para redimensioná-lo,  
> **Para que** eu organize a interface de forma natural e rápida.

#### Cenário 8.1 (Happy Path): Redimensionamento interativo por alça de canto
```gherkin
Funcionalidade: Manipulação Direta de Componentes
  Cenário: Redimensionar um TEdit puxando a alça lateral direita
    Dado que o componente "Edit1" com Width=120 e Height=24 está selecionado
    Quando o usuário clica sobre a alça de redimensionamento leste (East Handle)
    E arrasta o mouse 40 pixels para a direita e solta
    Então a propriedade Width de "Edit1" deve ser atualizada para 160 px
    E o Object Inspector deve refletir instantaneamente Width=160
    E o arquivo .dfm deve ser atualizado na mesma transação
```

#### Cenário 8.2 (Happy Path): Movimentação com snapping no grid de 8px
```gherkin
  Cenário: Mover controle com encaixe automático no grid
    Dado que o componente "Panel1" está posicionado em Left=16, Top=16
    Quando o usuário clica no centro do painel e o arrasta para a direita
    Então a posição deve se mover em incrementos discretos de 8 em 8 pixels
    E ao soltar, as coordenadas devem ser números perfeitamente divisíveis por 8
```

#### Cenário 8.3 (Exceção): Bloqueio de movimentação para controles com alClient ou alTop
```gherkin
  Cenário: Tentativa de mover manualmente um controle alinhado ao topo
    Dado que o componente "pnlTopo" possui a propriedade "Align = alTop"
    Quando o usuário tenta clicar e arrastar para mover o painel para o meio da tela
    Então o cursor deve indicar operação bloqueada (cursor não-permitido)
    E um tooltip sutil deve informar: "Controles com Align (alTop) têm geometria controlada pelo container"
```

---

### RF09: Aninhamento de Contêineres (Parenting Hierárquico)

**História de Usuário:**
> **Como** arquiteto de interfaces corporativas,  
> **Quero** colocar botões e campos dentro de painéis e abas,  
> **Para que** o layout seja modular e responsivo a redimensionamentos.

#### Cenário 9.1 (Happy Path): Soltar botão dentro de um TPanel
```gherkin
Funcionalidade: Aninhamento de Controles
  Cenário: Inserir controle filho dentro de container pai
    Dado que o formulário possui um painel "pnlFiltros" na posição Left=40, Top=40, Width=300, Height=100
    Quando o usuário arrasta um "TButton" e o solta dentro da área delimitadora de "pnlFiltros" na posição absoluta (X=60, Y=60)
    Então o botão deve ser registrado como filho de "pnlFiltros" no DFM
    E suas coordenadas locais devem ser calculadas como Left=20, Top=20 (relativas ao painel)
    E na árvore do Object Inspector, o botão deve aparecer indentado abaixo de "pnlFiltros"
```

---

### RF10: Bandeja de Componentes Não-Visuais (Non-Visual Tray)

**História de Usuário:**
> **Como** desenvolvedor Delphi,  
> **Quero** que componentes lógicos (Timer, Dialogs, ACBr) fiquem organizados em uma bandeja própria no rodapé da janela,  
> **Para que** eles não fiquem sobrepostos aos botões e campos visuais da tela.

#### Cenário 10.1 (Happy Path): Adição de componente não-visual
```gherkin
Funcionalidade: Bandeja de Componentes Não-Visuais
  Cenário: Adicionar TACBrNFe ao formulário
    Dado que o usuário seleciona o componente "TACBrNFe" na paleta
    Quando clica sobre o formulário
    Então a bandeja inferior cinza "Component Tray" deve se abrir na base do formulário
    E o ícone de "ACBrNFe1" (28x28 px) deve ser posicionado na bandeja lado a lado com os demais
    E o componente deve ter todas as suas propriedades e eventos acessíveis no Object Inspector
```

---

## 5. Requisitos Não-Funcionais e Métricas de Usabilidade

* **RNF-FPS-01 (Fluidez de Movimento):** Durante o arraste de qualquer componente ou alça de redimensionamento, a taxa de quadros da prancheta deve se manter rigorosamente a **60 FPS** (tempo de frame $\le 16.6 \text{ ms}$), utilizando aceleração de hardware e evitando re-renders do Monaco Editor ou do DOM raiz.
* **RNF-AFF-02 (Acessibilidade de Foco e Teclado):** Toda a manipulação de componentes deve ser operável via teclado com suporte a seleção sequencial (`Tab` / `Shift+Tab`) e navegação posicional com setas.
