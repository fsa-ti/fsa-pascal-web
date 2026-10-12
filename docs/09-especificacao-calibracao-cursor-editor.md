# Especificação Técnica: Calibração de Métricas de Glifos e Alinhamento do Cursor (Monaco Editor)

## 1. Sumário Executivo e Diagnóstico da Causa-Raiz

### 1.1 Contexto do Problema
O usuário reportou um sintoma clássico de desalinhamento de coordenadas no editor de código:
> *"o cursor do editor nao esta ok o editor esta ficando na posicao errada visualmente parece que esta um caractere antes mas quando digita o caractere fica no final (o caractere esta certo) so o cursor que nao."*

### 1.2 Dissecação da Causa-Raiz (Root Cause Analysis)
1. **Divergência entre Métricas de Medição e Renderização de Glifos:**
   O Monaco Editor não renderiza o texto em um `<textarea>` simples; ele divide o código em elementos `.view-line`, spans de tokens de sintaxe e uma camada absoluta de cursores (`.cursors-layer .cursor`).
   Para posicionar a linha vertical do cursor na coluna correta, o Monaco mede a largura exata de um caractere monospaçado no momento em que monta sua árvore DOM (`charWidth = canvasContext.measureText('m').width`).
2. **Timing Assíncrono de Webfonts (FOUT / Font Swap):**
   No arquivo `index.html`, a fonte `'Fira Code'` era carregada via Google Fonts com diretiva `display=swap`. No momento do carregamento da página, o Monaco iniciava e calculava a largura dos caracteres usando uma fonte fallback do sistema (ex.: `Consolas`, ~7.8px para fonte 13px).
   Milissegundos depois, o download da `'Fira Code'` era concluído pelo browser e aplicada aos spans de texto (largura ~8.2px). O Monaco **não re-calculava automaticamente** sua matriz de medidas.
   Com isso, em uma linha com 20 caracteres:
   * Largura real ocupada pelo texto no DOM: $20 \times 8.2\text{px} = 164\text{px}$.
   * Posição calculada pelo Monaco para o cursor: $20 \times 7.8\text{px} = 156\text{px}$.
   * Diferença: $8\text{px}$ (exatamente a largura de um caractere, fazendo o cursor aparecer visualmente "um caractere antes").
3. **Contaminação de Estilos Globais por Resets (`letter-spacing` e `box-sizing`):**
   Regras CSS genéricas como `* { margin: 0; padding: 0; }` e heranças de espaçamento entre caracteres alteravam o tracking de spans internos do Monaco sem que o motor de renderização da Microsoft considerasse essa expansão.

---

## 2. Regras de Negócio e Solução Técnica (Padrão Apple & Front-End de Alta Fidelidade)

* **[RN01] Pilha Monospaçada Nativa Determinística:** 
  A primeira fonte da pilha deve ser nativa e de latência zero no ambiente operacional (`'Consolas'` e `'Cascadia Code'` no Windows, `'Menlo'` no macOS), garantindo que a medição no frame 0 seja idêntica à renderização final sem Flash of Unstyled Text (FOUT).
* **[RN02] Recálculo Forçado com Font Loading API:**
  Sempre que a API `document.fonts` sinalizar que fontes externas foram concluídas (`document.fonts.ready` e evento `loadingdone`), o método `monaco.editor.remeasureFonts()` e `editor.layout()` devem ser invocados.
* **[RN03] Estabilização de Tracking e Ligaduras:**
  `letterSpacing: 0`, `fontLigatures: false` e pesos tipográficos estritos (`fontWeight: 'normal'`) devem ser forçados na configuração do Monaco e nas classes CSS `.monaco-editor .view-line` para impedir variações de subpixel.
* **[RN04] Re-calibração em Trocas de Aba e Redimensionamento:**
  Ao alternar entre abas de código ou redimensionar painéis da IDE, o editor deve manter a coerência milimétrica do cursor através de hooks reativos.

---

## 3. Especificação Funcional em BDD (Critérios de Aceite)

### Cenário 1: Posicionamento milimétrico do cursor ao digitar no fim da linha
```gherkin
Dado que o desenvolvedor está editando uma unit Delphi (.pas)
E a linha contém o texto "procedure TForm1.Button1Click(Sender: TObject);"
Quando o desenvolvedor posiciona o cursor no último caractere após o ponto e vírgula
Então o cursor gráfico piscante (|) deve estar exatamente adjacente à direita do caractere ";"
E não deve haver deslocamento visual de 1 caractere para a esquerda
E ao pressionar uma tecla, o novo caractere deve ser inserido exatamente na posição indicada pelo cursor
```

### Cenário 2: Estabilidade e zero Layout Shift após carregamento de fontes
```gherkin
Dado que o usuário abre a aplicação com conexão lenta ou rápida
Quando a janela e os componentes da IDE são renderizados
E o navegador conclui o download assíncrono de fontes da web
Então o Monaco Editor deve executar "remeasureFonts" automaticamente
E o alinhamento visual do cursor deve permanecer perfeitamente sincronizado com o texto digitado
```

### Cenário 3: Alternância entre Designer Visual (F12) e Editor de Código
```gherkin
Dado que o desenvolvedor alterna do Form Designer para o Editor de Código via F12
Quando o CodeEditor monta na árvore de componentes
Então as métricas de fontes devem ser validadas imediatamente
E o cursor deve manter posicionamento preciso de coluna e linha
```

---

## 4. Requisitos Não-Funcionais

* **Latência de Renderização:** Redução do atraso de renderização para 0ms graças ao uso prioritário de fontes nativas do sistema operacional.
* **CLS (Cumulative Layout Shift):** CLS = 0.00. Nenhum pulo de texto ou redimensionamento de glifos percebido pelo usuário.
* **Compatibilidade High-DPI (Windows Display Scaling):** Compatibilidade integral com taxas de escala comuns de monitores (100%, 125%, 150%) sem truncamento de meio pixel.
