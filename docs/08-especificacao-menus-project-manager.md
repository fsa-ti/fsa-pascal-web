# 08 - Especificação de Engenharia de Requisitos: Menus de Topo Funcionais, Gestão de Units, Pastas e Renomeação Atômica (F2)

> **Documento:** Especificação de Requisitos Funcionais e UI/UX (Apple Standard)  
> **Status:** Aprovado para Implementação - Baseline 2.1  
> **Autor:** Engenheiro de Requisitos Principal & Arquiteto Front-End  

---

## 1. Sumário Executivo e Diagnóstico da Causa-Raiz (Gap Analysis)

### 1.1 O Problema Real
O feedback do usuário apontou 4 pontos críticos de inoperância que quebram a ilusão de uma IDE completa:
1. *"O menus files, Edit, Search, não tem efeito nenhum."* — Os botões de navegação no topo da tela são meras tags estáticas sem menus suspensos (*dropdowns*), atalhos aceleradores ou ações associadas.
2. *"Como adicionar uma nova unit."* — A IDE não oferecia ação para instanciar novos arquivos `.pas` e associá-los ao projeto e à cláusula `uses` do `.dpr`.
3. *"Como criar uma nova pasta para adicionar uma nova unit."* — Arquiteturas reais em Delphi dividem o código em pastas (`src/services`, `src/views`, `src/models`). A árvore de projeto não permitia criar pastas nem agrupava arquivos hierarquicamente por diretórios.
4. *"F2 poder renomear uma unit."* — A convenção universal de desktop (`F2`) para renomeação em linha não existia, forçando o desenvolvedor a ficar preso a nomes padrão como `ufrmPrincipal.pas`.

---

## 2. Perguntas Críticas e Decisões de Engenharia

| # | Ponto de Decisão | Impacto | Decisão Arquitetural Adotada |
| :-: | :--- | :--- | :--- |
| **D1** | **Como sincronizar a renomeação de uma Unit com formulário visual?** | Integridade do Projeto | **Paridade Atômica:** Renomear `ufrmPrincipal.pas` para `ufrmMain.pas` deve automaticamente renomear `ufrmPrincipal.dfm` para `ufrmMain.dfm`, atualizar a instrução `unit ufrmMain;` no código `.pas` e a referência na cláusula `uses` do `.dpr`. |
| **D2** | **Como lidar com pastas vazias em um projeto baseado em arquivos?** | Organização do Código | O estado do projeto suportará uma coleção de diretórios explícitos (`customFolders`), permitindo que o desenvolvedor crie pastas antes mesmo de adicionar arquivos nelas. |
| **D3** | **Qual a ergonomia visual dos menus de topo (*TopMenu*)?** | Apple Human Interface Guidelines | Menus suspensos com efeito *glassmorphism* (`backdrop-blur-xl`), bordas de 1px semitransparentes, atalhos de teclado monospaçados alinhados à direita e fechamento ao clicar fora ou pressionar `Escape`. |

---

## 3. Mapeamento de Regras de Negócio Invariantes (RN)

* **`[RN19] - Sincronização Obrigatória de Units com o DPR:`** Toda nova unit (`.pas`) criada deve ser automaticamente injetada na cláusula `uses` do arquivo `.dpr` principal do projeto (ex.: `uCalculos in 'src/uCalculos.pas';`), garantindo que o compilador a encontre.
* **`[RN20] - Paridade Atômica PAS/DFM na Renomeação:`** Se uma unit possuir formulário associado (`.dfm`), a renomeação deve alterar ambos os arquivos de forma transacional. O identificador após a palavra-chave `unit` dentro do arquivo `.pas` deve ser atualizado para coincidir exatamente com o novo nome do arquivo.
* **`[RN21] - Validação Estrita de Identificadores Pascal:`** O nome de uma unit deve ser um identificador válido na linguagem Pascal: não pode conter espaços, caracteres especiais ou acentuação, e não pode iniciar por dígito numérico. A extensão `.pas` é inferida automaticamente caso omitida.
* **`[RN22] - Hierarquia Real de Pastas na Árvore de Projeto:`** A exibição de arquivos no Project Manager deve segmentar caminhos com barras (`/` ou `\`) em nós de pastas expansíveis e colapsáveis, em vez de uma lista plana rígida.
* **`[RN23] - Atalho F2 para Renomeação em Linha (In-Place):`** Selecionar um arquivo ou pasta no Project Manager e pressionar a tecla `F2` deve substituir o rótulo por um campo de texto focado. Pressionar `Enter` confirma; pressionar `Escape` reverte sem salvar.
* **`[RN24] - Ações Conectadas nos Menus de Topo:`** Cada item dos menus `File`, `Edit`, `Search`, `View`, `Project`, `Run`, `Tools` e `Help` deve disparar a respectiva função no motor central da IDE (`useIDEStore`), com atalhos de teclado espelhados globalmente.

---

## 4. Especificações Funcionais com Cenários BDD (Gherkin)

### RF11: Menus de Topo Funcionais com Dropdowns
```gherkin
Funcionalidade: Menus de Topo da IDE
  Cenário: Clicar no menu File e selecionar Nova Unit
    Dado que o usuário está com a IDE aberta
    Quando clica sobre o botão "File" na barra de menu superior
    Então um menu suspenso translúcido deve se abrir exibindo as opções:
      | Nova Unit Pascal (Ctrl+N) |
      | Novo Form VCL (Ctrl+Shift+N) |
      | Nova Pasta |
      | Salvar Arquivo (Ctrl+S) |
      | Salvar Tudo (Ctrl+Shift+S) |
    Quando o usuário clica em "Nova Unit Pascal"
    Então uma nova unit deve ser criada e aberta imediatamente no editor de código
```

---

### RF12: Adição de Nova Unit e Novo Formulário
```gherkin
Funcionalidade: Criação de Units
  Cenário: Adicionar nova unit padrão sem formulário
    Dado que o projeto possui apenas a unit "ufrmPrincipal.pas"
    Quando o usuário seleciona "Nova Unit" e define o nome "uClienteService"
    Então o arquivo "src/uClienteService.pas" deve ser gerado com o esqueleto padrão da unit Pascal
    E o arquivo principal "GestaoComercial.dpr" deve conter "uClienteService in 'src/uClienteService.pas'" em sua cláusula uses
    E a aba ativa deve mudar para "src/uClienteService.pas"
```

```gherkin
  Cenário: Adicionar novo Form VCL com arquivo DFM
    Dado que o usuário solicita a criação de um "Novo Formulário VCL"
    Quando define o nome "ufrmRelatorio"
    Então devem ser criados "src/ufrmRelatorio.pas" e "src/ufrmRelatorio.dfm"
    E o DFM deve conter um TForm básico com dimensões padrão
    E o usuário pode alternar diretamente para o Form Designer visual via F12
```

---

### RF13: Gestão Hierárquica de Pastas no Project Manager
```gherkin
Funcionalidade: Criação e Navegação em Pastas
  Cenário: Criar pasta "services" e adicionar unit dentro dela
    Dado que o usuário está no Project Manager
    Quando clica no botão "Nova Pasta" e digita "services"
    Então a pasta "services" deve aparecer na árvore abaixo da pasta raiz
    Quando o usuário clica com botão direito sobre a pasta "services" e seleciona "Nova Unit nesta pasta"
    Então a nova unit deve ser criada com o caminho "src/services/uAuth.pas"
```

---

### RF14: Renomeação Atômica via F2
```gherkin
Funcionalidade: Renomeação de Arquivos com Tecla F2
  Cenário: Renomear unit existente pelo atalho F2
    Dado que a unit "uClienteService.pas" está selecionada no Project Manager
    Quando o usuário pressiona a tecla F2
    Então o nome do arquivo se transforma em um campo de entrada de texto editável com o texto selecionado
    Quando o usuário digita "uCustomerService" e pressiona Enter
    Então o arquivo deve ser renomeado para "uCustomerService.pas"
    E a primeira linha do arquivo deve ser atualizada para "unit uCustomerService;"
    E a referência no arquivo .dpr deve ser atualizada para "uCustomerService"
```
