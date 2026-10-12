# 01 - Visão do Produto, Diagnóstico de Causa-Raiz e Escopo

> **Projeto:** PascalWeb IDE (Online Delphi IDE & Visual Studio)  
> **Área:** Engenharia de Produto & Arquitetura de Software  
> **Status:** Documento de Especificação de Requisitos - Baseline 1.0  

---

## 1. Sumário Executivo e Diagnóstico da Causa-Raiz

### 1.1 Contexto e Justificativa de Negócio
O ecossistema **Delphi / Object Pascal** sustenta trilhões de dólares em operações corporativas globais (ERPs de grande porte, sistemas bancários, PDVs fiscais, logística, sistemas hospitalares e industriais). No entanto, o fluxo de desenvolvimento tradicional do Delphi sofre de gargalos crônicos:
1. **Aprisionamento a Máquinas Físicas/Pesadas:** O RAD Studio da Embarcadero é uma IDE desktop proprietária e pesada que exige sistemas operacionais Windows dedicados, máquinas de alta performance e gigabytes de dependências instaladas manualmente em cada estação (bibliotecas de terceiros como DevExpress, ACBr, FastReport, Jedi).
2. **Onboarding Lento de Desenvolvedores:** Configurar o ambiente de um novo programador em projetos legados pode levar de 3 a 7 dias úteis devido a conflitos de Library Path, pacotes BPL incompatíveis e caminhos de compilação despadronizados.
3. **Incapacidade de Trabalho Remoto Ágil / Cloud:** Enquanto stacks web/modernas utilizam ferramentas no navegador (GitHub Codespaces, Gitpod, Cloud9), os desenvolvedores Delphi permanecem limitados a acessos remotos via RDP/TeamViewer (lentos, com alta latência visual e baixa ergonomia).
4. **Falta de Ferramental Moderno Integrado com IA e Automação:** Ferramentas modernas de geração de código assistida por IA e linters estáticos têm baixa adesão ou integrações precárias nas versões clássicas da IDE desktop.

### 1.2 A Solução Proposta: PascalWeb IDE
A **PascalWeb IDE** nasce como uma **Web IDE completa para Delphi/Object Pascal**, baseada no navegador, que fornece:
* **Editor de Código de Alto Desempenho:** Syntax highlighting, code completion, snippets e integração com LLM / Assistente de Código para Delphi.
* **Visual Form Designer WYSIWYG:** Ferramenta visual para arrastar, soltar, redimensionar e alinhar componentes VCL/FMX com pré-visualização fidedigna no navegador e sincronização bidirecional em tempo real com arquivos `.dfm` / `.pas`.
* **Gerenciador de Projetos:** Suporte nativo à hierarquia de projetos (`.dpr`, `.dpk`, `.dproj`, `.groupproj`), com gerenciamento de diretórios, units e build configurations.
* **Modelo Híbrido de Agentes de Compilação (Build Agents):**
  * **Agente Local (Developer Desktop Bridge):** Executável leve rodando na máquina do usuário que utiliza a licença e os componentes locais já existentes do Delphi, compilando sem transferir código sensível para nuvens externas e devolvendo diagnósticos (erros/warnings) e binários gerados (`.exe`, `.dll`, `.bpl`).
  * **Agente Servidor (Dedicated Remote Worker):** Worker corporativo rodando em servidor Windows/container para automação, equipes padronizadas e CI/CD.
* **Arquitetura de Plugins Aberta:** Barramento de eventos e APIs de extensão para adicionar novos componentes na paleta, geradores de código, linters e integrações.

---

## 2. Perguntas Críticas de Esclarecimento e Roadblocks (Alinhamento Técnico)

Antes do fechamento da arquitetura física, os seguintes pontos devem ser validados pela gestão de engenharia e stakeholders:

| # | Pergunta Crítica / Ponto de Atenção | Impacto Arquitetural | Recomendação do Engenheiro de Requisitos |
| :--- | :--- | :--- | :--- |
| **Q1** | **Qual modelo de licenciamento Embarcadero será adotado no Agente de Servidor?** | Legal / Financeiro | A Embarcadero proíbe redistribuição do compilador de linha de comando (`dcc32/dcc64`) sem licença corporativa. **Recomendação:** Priorizar o **Agente Local** (o próprio usuário provê seu RAD Studio já licenciado) e, para servidores compartilhados, exigir que o cliente forneça sua própria licença corporativa (BYOL - *Bring Your Own License*). |
| **Q2** | **Quais componentes de terceiros serão suportados no preview visual no MVP?** | Escopo / Complexidade | Renderizar componentes padrão VCL (`TButton`, `TEdit`, `TPanel`, `TDBGrid`) é viável via HTML/Canvas. Renderizar bibliotecas complexas proprietárias (ex.: DevExpress QuantumGrid com skins fechadas) exige emuladores dedicados. **Recomendação:** MVP focado em VCL Standard + Win32 básico; componentes de terceiros renderizados como placeholders genéricos configuráveis. |
| **Q3** | **Qual o limite de tamanho para artefatos binários trafegados via WebSocket/HTTP?** | Rede / Armazenamento | Executáveis Delphi com debug info embutido e pacotes BPL podem atingir centenas de megabytes. **Recomendação:** Streaming particionado de arquivos com protocolo de chunks (TUS protocol ou WebSockets binários) e cache com hash SHA-256 de DCUs intermediárias. |
| **Q4** | **A compilação remota no servidor permite execução do binário (Run/Debug)?** | Segurança / Sandbox | Permitir que um binário `.exe` recém-compilado seja executado no servidor abre brecha crítica para execução de código arbitrário (RCE). **Recomendação:** A compilação no servidor apenas compila e entrega o artefato; a execução e depuração (`F9`) ocorrem exclusivamente via Agente Local na máquina do usuário. |

---

## 3. Objetivos de Negócio e KPIs de Sucesso

### 3.1 Objetivos Estratégicos (OKRs)
* **Objetivo 1:** Reduzir o tempo de setup do ambiente de novos desenvolvedores de dias para minutos.
* **Objetivo 2:** Fornecer uma experiência de edição e design visual de telas equivalente ou superior à IDE Desktop em ergonomia e velocidade.
* **Objetivo 3:** Garantir 100% de conformidade com os formatos nativos do Delphi (`.pas`, `.dfm` texto/binário, `.dpr`, `.dproj`), permitindo migração de projetos existentes sem retrabalho (*zero lock-in*).

### 3.2 Indicadores Chave de Desempenho (KPIs)
* **Tempo de Sincronização DFM <-> Visual Designer:** $< 150 \text{ ms}$ entre arrastar um componente na tela e refletir no código `.pas`/`.dfm`.
* **Latência de Feedback de Compilação:** Menos de $1 \text{ segundo}$ de overhead entre o término da compilação pelo agente e a renderização da lista de erros/warnings estruturados na IDE Web.
* **Taxa de Sucesso no Round-Trip de DFMs Legados:** $> 98\%$ de compatibilidade na leitura e escrita de telas VCL sem perda de propriedades existentes.
* **Crash-free Sessions da Web IDE:** $\ge 99.8\%$ de disponibilidade sem travamento da aba do navegador.

---

## 4. Personas e Cenários de Uso

### Persona 1: Marcos, Desenvolvedor Delphi Sênior (Legado / Enterprise)
* **Perfil:** 15 anos programando ERP em Delphi (10.4 Sydney / 11 Alexandria / 12 Athens).
* **Dores:** Cansado de depender de uma máquina desktop pesada do escritório; precisa corrigir bugs e criar telas rapidamente de qualquer lugar (notebook pessoal, Linux ou Mac com navegador).
* **Necessidade:** Quer abrir o projeto da empresa, ver a tela exatamente como ela é, editar regras de negócio com autocomplete rápido, disparar compilação no agente local da sua máquina de trabalho e baixar o `.exe` compilado.

### Persona 2: Juliana, Tech Lead & Arquiteta de Software
* **Perfil:** Responsável pela governança, arquitetura e produtividade de um time de 25 desenvolvedores Delphi.
* **Dores:** Dificuldade em padronizar componentes e garantir qualidade de código; lentidão em testes de compilação; dificuldade em integrar IA na rotina dos desenvolvedores.
* **Necessidade:** Quer padronizar templates de formulários, estender a IDE com plugins internos corporativos e habilitar assistente de código inteligente que sugira boas práticas em Object Pascal.

### Persona 3: Roberto, Consultor & Freelancer Delphi
* **Perfil:** Presta consultoria para múltiplos clientes com diferentes versões do Delphi e conjuntos de componentes.
* **Dores:** Conflito crônico de bibliotecas e versões de BPL entre projetos de clientes distintos em uma única máquina física.
* **Necessidade:** Quer alternar entre projetos em workspaces isolados na nuvem e apontar para agentes de compilação específicos de cada cliente com segurança.

---

## 5. Matriz de Escopo

### 5.1 Dentro do Escopo (In Scope)

#### A. Web IDE Core
1. **Editor de Código:** Monaco Editor com gramática Custom Pascal/Delphi (highlighting para keywords, diretivas de compilação `{$IFDEF}`, comentários, tipos nativos e strings).
2. **Gerenciador de Arquivos e Projetos:** Árvore de arquivos, navegação de units, manipulação de arquivos de projeto (`.dpr`, `.dpk`, `.dproj`), busca global (Search in files).
3. **Form Designer Visual (WYSIWYG):**
   * Superfície de design com grid configurável, réguas e guias magnéticas.
   * Paleta de Componentes VCL categorizada (Standard, Additional, Win32, System, Dialogs, Data Controls).
   * Object Inspector com edição de Propriedades (visuais e textuais) e aba de Eventos.
   * Parser bidirecional DFM (formato texto nativo do Delphi) para JSON Model e vice-versa.
4. **Assistente de Código & Inteligência:**
   * Code snippets para construtos frequentes (classes, interfaces, singletons, blocos `try..finally`).
   * Assistente de IA integrado (chat contextual e geração de código de procedures/funções).
5. **Painel de Compilação & Mensagens:**
   * Console de saída de compilação em tempo real (streaming de logs).
   * Grade de Mensagens com filtros (Erros, Warnings, Hints) e clique para navegar até a linha e coluna do arquivo.
6. **Gerenciamento de Artefatos:**
   * Download direto dos binários gerados (`.exe`, `.dll`, `.bpl`) e relatórios de mapa (`.map`).
7. **Arquitetura de Plugins:**
   * API de plugins para registro de componentes customizados na paleta, comandos na Command Palette e painéis laterais.

#### B. Agente de Compilação (Build Agent)
1. **Agente Local (Desktop Bridge):**
   * Aplicação utilitária para Windows (System Tray) com instalador leve.
   * Detecção automática de instalações do RAD Studio (registros do Windows / variáveis de ambiente `BDS`, `rsvars.bat`).
   * Conexão segura via WebSocket TLS com a Web IDE via pairing token único.
   * Execução de compilação usando `msbuild.exe` ou compiladores de linha de comando (`dcc32.exe`, `dcc64.exe`).
   * Captura de stdout/stderr, parsing de mensagens de erro estruturadas e upload/streaming de binários.
2. **Agente de Servidor (Dedicated Remote Worker):**
   * Serviço Windows para servidores de build dedicados.
   * Fila de compilações com controle de concorrência e timeout de processos.

---

### 5.2 Fora do Escopo Inicial (Out of Scope - Futuras Versões)
1. **Depurador Interativo Remoto Passo a Passo (GDB/Delphi Debugger interativo na nuvem):** No MVP o agente compila e reporta diagnósticos; depuração interativa com breakpoints em tempo de execução via web fica postergada para versão 2.0.
2. **Emulador Visual Completo de Telas FMX (FireMonkey com 3D/DirectX) no Navegador:** O MVP focará exclusivamente em VCL (Visual Component Library) Win32/Win64.
3. **Engenharia Reversa de Binários Compilados (Decompilação):** O foco é edição de código-fonte e compilação direta.
4. **Instalador Automático de Bibliotecas Proprietárias de Terceiros (Package Manager estilo GetIt) no Agente Local:** O agente local utilizará as bibliotecas e BPLs previamente instaladas na máquina do usuário.
