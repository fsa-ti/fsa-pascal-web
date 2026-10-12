# 🚀 PascalWeb IDE — Online Delphi IDE & Visual Studio

> **IDE Web moderna para desenvolvimento Delphi / Object Pascal com Form Designer WYSIWYG bidirecional, Agente de Compilação Distribuído Windows, Assistente de Código IA e Sistema de Plugins.**

---

## 🌟 Principais Funcionalidades Implementadas

* **Visual Form Designer WYSIWYG (VCL):**
  * Desenho de telas com arrastar e soltar, grid pontilhado de 8px e réguas.
  * Engine geométrica que emula com precisão o cálculo VCL de `Align` (`alTop`, `alBottom`, `alLeft`, `alRight`, `alClient`) e `Anchors` (`akLeft`, `akTop`, `akRight`, `akBottom`).
  * Paleta de componentes VCL categorizada: **Standard** (`TButton`, `TLabel`, `TEdit`, `TMemo`, `TPanel`, `TCheckBox`, `TComboBox`), **Additional**, **Win32**, **Data Controls** e **Plugins Customizados**.
  * **Object Inspector** bidirecional com tabela de Propriedades e aba de Eventos.
  * Suporte a duplo clique no componente gerando automaticamente o método do evento na unit `.pas` e vinculando ao `.dfm`.
* **Sincronização Bidirecional Fiel (Código <-> Tela):**
  * **Atalho F12:** Alternância instantânea entre o Editor de Código e o Form Designer.
  * **Parser e Serializador DFM Lossless:** Leitura e escrita do formato nativo do Delphi com preservação estrita de nós desconhecidos ou bibliotecas de terceiros (sem perda de dados).
  * Injeção e sincronização automática de componentes na seção `published` da classe no `.pas`.
  * **Atalho Ctrl+Shift+C (Class Completion):** Detecta métodos declarados na classe e gera o corpo esqueleto na seção `implementation`.
* **Editor de Código de Alta Performance (Monaco):**
  * Tokenizador de sintaxe Object Pascal nativo (suporte a palavras-chave modernas, diretivas de compilação `{$IFDEF}`, `{$REGION}` com folding, strings e comentários).
  * Atalhos do Delphi mapeados nativamente: **F12** (Form/Code), **F9** ou **Ctrl+F9** (Build), **Ctrl+Shift+C** (Class Completion).
* **Agente de Compilação Distribuído (Build Agent):**
  * Suporte híbrido: **Agente Local** (rodando na máquina do usuário via porta 3002) e **Agente Servidor**.
  * Detecção automática de instalações do RAD Studio no Windows (`dcc32.exe`, `dcc64.exe`, `msbuild.exe`, variável `BDS`).
  * **Autonomous Pascal Engine:** Motor embutido de compilação, validação sintática e geração de executáveis PE Windows (`.exe`, `.dll`, `.bpl`, `.map`) para ambientes sem Delphi instalado ou pipelines CI/CD.
  * Streaming de logs em tempo real e captura regex estruturada de diagnósticos (Erros com linha/coluna, Warnings e Hints).
  * Clique na linha de erro navega imediatamente até o arquivo e cursor exato no editor!
* **Assistente de Código Delphi AI:**
  * Painel integrado com sugestões rápidas em Object Pascal moderno: APIs REST com `System.JSON`, consultas seguras com `FireDAC`, coleções genéricas `TList<T>` e blocos de proteção `try..finally` com `FreeAndNil`.
  * Botão de 1 clique para injetar o código gerado diretamente na unit ativa.
* **Arquitetura Aberta de Plugins:**
  * Manifesto padronizado `plugin.json` com isolamento em sandbox.
  * Plugins de exemplo já integrados: **ACBr Suite de Componentes Fiscais** (com `TACBrNFe`) e **Pascal Clean Code Linter**.

---

## 📁 Estrutura do Projeto

```text
pascal-online/
├── docs/                                  # Especificação Técnica de Requisitos (FSA-Requisitos)
│   ├── README.md                          # Índice mestre da documentação
│   ├── 01-visao-e-escopo.md               # Diagnóstico de causa-raiz, proposta de valor e escopo
│   ├── 02-arquitetura-e-engenharia.md     # C4 Model, protocolos, layout VCL e plugins
│   ├── 03-requisitos-funcionais-bdd.md    # Regras [RN01]-[RN10], User Stories e BDD Gherkin
│   ├── 04-requisitos-nao-funcionais.md    # SLAs de latência, segurança RCE e licença Embarcadero
│   ├── 05-matriz-riscos-desafios-mitigacoes.md # FMEA, desafios técnicos críticos e soluções
│   └── 06-roadmap-e-fases-implementacao.md # Matriz de priorização e fases evolutivas
│
├── src/
│   ├── common/                            # Core compartilhado
│   │   ├── types.ts                       # Tipos centrais, AST e protocolo JSON-RPC
│   │   ├── dfm/                           # Parser e Serializador Lossless de DFM
│   │   ├── vcl/                           # Catálogo de Componentes e Engine de Layout VCL
│   │   └── pascal-ast/                    # Sincronização de Units e Class Completion
│   │
│   ├── agent/                             # Agente de Compilação (Build Agent)
│   │   ├── index.ts                       # Daemon WebSocket do Agente (:3002)
│   │   ├── compiler-detector.ts           # Detecção de RAD Studio no Windows
│   │   ├── compiler-runner.ts             # Executor seguro de compilação
│   │   ├── fallback-compiler.ts           # Compilador autônomo & Gerador PE (.exe/.dll/.bpl)
│   │   └── diagnostics-parser.ts          # Regex parser de erros do Delphi
│   │
│   ├── server/                            # Backend API & WebSocket Orchestrator (:3001)
│   │   ├── index.ts                       # Servidor Express & WebSocket relay
│   │   ├── ai-assistant.ts                # Assistente IA para Object Pascal
│   │   └── templates/                     # Template padrão de Projeto VCL
│   │
│   ├── client/                            # Web IDE Frontend SPA (React + TypeScript + Vite)
│   │   ├── App.tsx                        # Shell principal da IDE
│   │   ├── services/store.ts              # Estado reativo central da IDE
│   │   └── components/
│   │       ├── TopMenu.tsx                # Menu Delphi e ações (Build F9, F12, Target)
│   │       ├── ProjectTree.tsx            # Árvore de Projetos, Units e Forms
│   │       ├── Editor/                    # Monaco Editor com realce Pascal
│   │       ├── Designer/                  # Form Designer WYSIWYG, Palette e Object Inspector
│   │       ├── Console/                   # Painel de Mensagens e Streaming de Logs
│   │       ├── AIAssistant/               # Painel de IA Delphi
│   │       └── Plugins/                   # Gerenciador de Plugins
│   │
│   └── tests/                             # Suíte de Testes Automatizados (14 testes)
│       ├── dfm-parser.test.ts             # Testes de roundtrip DFM e lossless properties
│       ├── layout-engine.test.ts          # Testes de cálculo de Align e Anchors
│       ├── pascal-ast.test.ts             # Testes de injeção published e Class Completion
│       ├── compiler-agent.test.ts         # Testes de validação sintática e compilação PE
│       └── integration-e2e.test.ts        # Testes de integração end-to-end e API REST
```

---

## 🛠️ Como Executar o Projeto

### 1. Pré-requisitos
* **Node.js:** Versão 20+ ou 24+ LTS
* **NPM:** 10+

### 2. Instalação das Dependências
```bash
npm install
```

### 3. Executando os Testes Automatizados
A plataforma conta com suíte completa de testes unitários e de integração:
```bash
npm test
```
*Garantia de 100% de sucesso nos 14 testes cobrindo DFM Parser, Layout Engine, AST Pascal, Build Agent e API HTTP.*

### 4. Executando a Aplicação Completa

Você pode rodar os três serviços em terminais separados ou em conjunto:

#### Terminal 1 — Servidor Backend API (Porta 3001):
```bash
npm run server
```

#### Terminal 2 — Agente de Compilação Windows (Porta 3002):
```bash
npm run agent
```

#### Terminal 3 — Frontend Web IDE (Porta 5173):
```bash
npm run dev
```

Abra seu navegador em [http://localhost:5173](http://localhost:5173) para acessar a **PascalWeb IDE**!

---

## 🎯 Guia de Utilização na Interface Web

1. **Alternar entre Código e Tela:** Pressione a tecla **F12** a qualquer momento ou clique no botão **"Ver Código (F12)" / "Ver Designer (F12)"** no topo.
2. **Desenhar Componentes:** No modo Designer, clique em qualquer componente na **Paleta** superior (`Button`, `Edit`, `Panel`, `CheckBox`, etc.) para adicioná-lo ao formulário.
3. **Inspecionar e Alterar Propriedades:** Selecione um componente na tela para editar suas propriedades (`Caption`, `Width`, `Height`, `Align`, `Color`) em tempo real no **Object Inspector** à direita.
4. **Gerar Eventos (Duplo Clique):** Dê um duplo clique em um componente na tela (ex.: `Button1`) para gerar automaticamente a assinatura na classe, a procedure em `implementation` e navegar direto para o editor com o cursor posicionado!
5. **Class Completion:** No editor de código, pressione **Ctrl+Shift+C** para implementar automaticamente qualquer método declarado na classe.
6. **Compilar Projeto:** Pressione **F9** ou clique no botão verde **"Build Project (F9)"** no topo.
   * Os logs aparecerão na aba inferior em tempo real.
   * Se houver erros, eles serão listados na aba **Messages** com arquivo, linha e coluna. Dê um clique sobre o erro para navegar até a linha exata no código!
   * Ao compilar com sucesso, vá para a aba **"Artefatos Gerados"** e clique em **"Baixar"** para obter o binário compilado (`.exe`, `.dll`, `.bpl`).
7. **Assistente Delphi AI:** Clique no botão roxo **"Delphi AI"** no topo para abrir o assistente e gerar trechos de código com 1 clique.
8. **Plugins:** Clique no botão **"Plugins"** para gerenciar os plugins ativos (como o pacote fiscal ACBr).

---

## 📄 Licença e Conformidade Legal
A arquitetura da PascalWeb IDE respeita integralmente os direitos da Embarcadero Technologies. A compilação nativa no Agente Local adota o modelo **BYOL** (*Bring Your Own License*), utilizando o compilador já instalado na estação de trabalho do desenvolvedor licenciado sem redistribuição de arquivos proprietários.
