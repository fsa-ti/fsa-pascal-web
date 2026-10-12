# 03 - Requisitos Funcionais, Regras de Negócio e Cenários BDD (Gherkin)

> **Projeto:** PascalWeb IDE  
> **Área:** Engenharia de Requisitos de Software & Garantia de Qualidade (QA)  
> **Status:** Especificação Funcional Aprovada - Baseline 1.0  

---

## 1. Mapeamento de Regras de Negócio Invariantes (RN)

As regras abaixo são universais e devem ser aplicadas em todas as camadas da aplicação (Web IDE, Servidor de Orquestração e Agentes de Compilação).

* **`[RN01] - Integridade da Seção Published de Units de Formulário:`** Qualquer componente visual ou não-visual inserido ou removido no Form Designer deve ter seu identificador e tipo refletidos estritamente na seção `published` da classe correspondente no arquivo `.pas`. Modificações manuais no `.pas` que removam um componente existente no `.dfm` devem gerar alerta de inconsistência antes da compilação.
* **`[RN02] - Preservação de Propriedades Desconhecidas no DFM:`** Ao abrir ou serializar um arquivo `.dfm` que contenha propriedades ou componentes de terceiros não cadastrados na paleta padrão da IDE Web, o parser deve preservá-los intactos na árvore e serializá-los sem perda de dados (*lossless parsing*).
* **`[RN03] - Alternância Bidirecional Código/Designer (Atalho F12):`** O usuário pode alternar instantaneamente entre a visualização do código-fonte `.pas`, o arquivo textual `.dfm` e a superfície visual do Form Designer. O estado selecionado no Object Inspector deve manter o foco no elemento ativo.
* **`[RN04] - Pareamento Criptográfico de Agentes Locais:`** Um Agente de Compilação Local só pode executar comandos oriundos de uma sessão da Web IDE após autenticação mútua via token criptográfico efêmero gerado pelo usuário com expiração configurável (máximo de 30 dias de validade por token).
* **`[RN05] - Sanitização de Parâmetros de Linha de Comando de Compilação:`** Sob nenhuma hipótese argumentos de compilação aceitarão comandos arbitrários do shell Windows (`cmd.exe` ou `powershell.exe`). Todos os parâmetros passados para `dcc32`, `dcc64` ou `msbuild` devem ser estritamente validados contra uma lista branca de flags suportadas.
* **`[RN06] - Rastreabilidade e Parsing Estruturado de Diagnósticos:`** Toda saída de compilação gerada pelo agente deve ser convertida em uma lista de diagnósticos tipados contendo: `Severidade` (Fatal, Error, Warning, Hint), `Arquivo`, `Linha`, `Coluna`, `Código` (ex.: E2003) e `Mensagem`.
* **`[RN07] - Isolamento de Falhas de Plugins (Sandbox):`** Plugins não possuem permissão de acesso direto ao DOM da IDE nem ao sistema de arquivos do servidor. Falhas não tratadas em um plugin devem ser isoladas no seu Web Worker sem interromper o trabalho em andamento do usuário.
* **`[RN08] - Atomicidade na Geração de Eventos (Class Completion):`** Ao solicitar a criação de um evento de componente (ex.: `OnClick`), a IDE deve injetar a declaração na classe da interface e a respectiva rotina na seção `implementation`. Caso ocorra qualquer erro sintático no documento, a injeção deve ser revertida integralmente.
* **`[RN09] - Limite de Tamanho de Artefatos Trafegados:`** O tamanho máximo de um único binário (`.exe`, `.dll`, `.bpl`) transferido do agente de compilação para o storage da IDE é de $250 \text{ MB}$. Artefatos que excedam esse limite devem ser mantidos localmente na estação de trabalho com notificação informativa.
* **`[RN10] - Bloqueio de Concorrência de Builds no Mesmo Workspace:`** Não é permitido disparar uma nova compilação enquanto houver uma compilação ativa em andamento no mesmo projeto/agente. A interface deve desabilitar o botão de compilar e exibir indicador de progresso.

---

## 2. Requisitos Funcionais e Cenários de Teste BDD

---

### RF01: Gerenciador de Projetos Delphi Multi-Módulo

**História de Usuário:**
> **Como** desenvolvedor Delphi,  
> **Quero** criar, abrir e gerenciar projetos (`.dpr`, `.dpk`, `.dproj`, `.groupproj`) organizados em pastas e units,  
> **Para que** eu possa estruturar sistemas corporativos completos compostos por executáveis, bibliotecas e pacotes.

#### Cenário 1.1 (Happy Path): Abertura e navegação de projeto com múltiplos módulos
```gherkin
Funcionalidade: Gerenciamento de Projetos Delphi
  Cenário: Carregar com sucesso um projeto Delphi com múltiplos módulos
    Dado que o usuário está autenticado na PascalWeb IDE
    E possui um projeto "ERP_Corporativo" contendo um arquivo "Vendas.dproj" e units associadas
    Quando o usuário clica em "Abrir Projeto" e seleciona a pasta raiz
    Então a árvore de projetos deve renderizar o nó raiz "Vendas.dproj"
    E deve categorizar os nós em "Source Files (.pas)", "Forms (.dfm)" e "Configuration (.dproj)"
    E o status do projeto na barra inferior deve exibir "Configuração ativa: Debug | Plataforma: Win32"
```

#### Cenário 1.2 (Exceção): Projeto corrompido ou arquivo .dproj com XML inválido
```gherkin
  Cenário: Tentativa de abertura de arquivo .dproj malformado
    Dado que o arquivo "Vendas.dproj" possui tags XML corrompidas ou incompletas
    Quando o usuário tenta abrir o projeto na IDE
    Então o sistema não deve travar a interface da IDE
    E deve exibir uma notificação de erro com a mensagem: "Falha ao processar o arquivo de projeto Vendas.dproj: XML malformado na linha 14"
    E deve oferecer a opção: "Abrir em modo de compatibilidade baseado exclusivamente no arquivo .dpr"
```

#### Cenário 1.3 (Exceção): Unit referenciada no .dpr não encontrada no disco
```gherkin
  Cenário: Unit declarada na cláusula 'uses' do projeto ausente do sistema de arquivos
    Dado que o arquivo "Vendas.dpr" referencia a unit "uServicoNotaFiscal.pas"
    E o arquivo físico "uServicoNotaFiscal.pas" não existe na estrutura de pastas
    Quando o projeto é carregado no gerenciador
    Então o arquivo deve ser exibido na árvore com ícone de alerta visual (amarelo)
    E deve constar o tooltip: "Arquivo físico não encontrado no caminho relativo configurado"
    E a IDE não deve impedir a edição das demais units funcionais
```

#### Cenário 1.4 (Borda): Projeto contendo referências circulares entre pacotes BPL
```gherkin
  Cenário: Identificação de dependência circular entre pacotes DPK
    Dado que o pacote "PackageA.dpk" requer "PackageB.dpk"
    E o pacote "PackageB.dpk" requer "PackageA.dpk"
    Quando o usuário tenta solicitar a compilação do grupo de projetos
    Então a IDE deve interceptar o grafo de dependências antes de invocar o agente
    E deve abortar o processo emitindo o erro estruturado: "Dependência circular detectada entre os pacotes PackageA e PackageB"
```

---

### RF02: Editor de Código com Syntax Highlighting e Atalhos Delphi

**História de Usuário:**
> **Como** desenvolvedor Object Pascal,  
> **Quero** um editor de código com realce sintático completo, autocompletar inteligente e suporte a atalhos clássicos do Delphi,  
> **Para que** eu mantenha alta produtividade sem fricção de adaptação.

#### Cenário 2.1 (Happy Path): Edição de código com destaque sintático e Class Completion (Ctrl+Shift+C)
```gherkin
Funcionalidade: Editor de Código Object Pascal
  Cenário: Invocação bem-sucedida do Class Completion
    Dado que o usuário está editando a unit "uCalculoImposto.pas"
    E adiciona na seção 'interface' o método "function CalcularICMS(const AValor: Currency): Currency;"
    Quando o usuário posiciona o cursor sobre o método e pressiona a combinação de teclas "Ctrl+Shift+C"
    Então a IDE deve analisar a AST da unit
    E deve injetar automaticamente na seção 'implementation' o bloco:
      """
      function TCalculoImposto.CalcularICMS(const AValor: Currency): Currency;
      begin

      end;
      """
    E o cursor de edição deve ser posicionado automaticamente entre as linhas 'begin' e 'end'
```

#### Cenário 2.2 (Happy Path / Borda): Alternância rápida de tela e código com a tecla F12
```gherkin
  Cenário: Alternar entre o código da unit e o visual form designer
    Dado que o usuário está com o arquivo "ufrmPrincipal.pas" aberto no editor de código
    Quando o usuário pressiona a tecla "F12"
    Então a visualização ativa deve alternar imediatamente para a aba do Form Designer do "ufrmPrincipal.dfm"
    E quando o usuário pressionar "F12" novamente
    Então a aba ativa deve retornar imediatamente para o editor de código "ufrmPrincipal.pas" na mesma linha em que estava
```

#### Cenário 2.3 (Exceção): Erro de sintaxe grave durante a digitação não corrompe o editor
```gherkin
  Cenário: Tolerância do editor a blocos de código sintaticamente incompletos
    Dado que o usuário está digitando um bloco de código e deixa uma estrutura de loop inacabada: "for I := 0 to"
    Quando o parser sintático em segundo plano executa a validação
    Então o editor deve sublinhar a linha com um marcador ondulado vermelho
    E a lista de problemas da IDE deve registrar "Expressão incompleta esperada após 'to'"
    E o editor não deve sofrer congelamento de interface (UI freeze)
```

#### Cenário 2.4 (Exceção): Arquivo com caracteres especiais e encoding misto (ANSI / Windows-1252 vs UTF-8)
```gherkin
  Cenário: Abertura de unit Delphi legada salva em encoding Windows-1252
    Dado que uma unit legada contém acentuações em comentários e strings no formato Windows-1252 / ISO-8859-1
    Quando o arquivo é aberto no editor da IDE Web
    Então a IDE deve detectar automaticamente a codificação do arquivo
    E deve renderizar os caracteres acentuados corretamente sem gerar caracteres inválidos ("mojibake" ou símbolos de interrogação)
    E deve permitir ao desenvolvedor converter para UTF-8 com ou sem BOM através da barra de status
```

---

### RF03: Form Designer Visual WYSIWYG com Sincronização Bidirecional

**História de Usuário:**
> **Como** desenvolvedor de software,  
> **Quero** desenhar telas arrastando e soltando componentes, configurando propriedades no Object Inspector e visualizando o layout em tempo real,  
> **Para que** eu crie telas VCL precisas sem necessidade de compilar a aplicação a cada ajuste visual.

#### Cenário 3.1 (Happy Path): Arrastar componente para a tela e configurar propriedades
```gherkin
Funcionalidade: Form Designer Visual WYSIWYG
  Cenário: Inserção de um componente TButton e ajuste de geometria
    Dado que o usuário está com o Form Designer aberto exibindo "Form1"
    Quando o usuário seleciona o componente "TButton" na Paleta de Componentes
    E clica na coordenada (X=150, Y=100) da superfície do formulário
    Então um novo botão com nome "Button1" deve ser renderizado na tela na posição exata
    E o Object Inspector deve selecionar "Button1" exibindo suas propriedades
    E o arquivo "Form1.dfm" em segundo plano deve receber a definição:
      """
      object Button1: TButton
        Left = 150
        Top = 100
        Width = 75
        Height = 25
        Caption = 'Button1'
        TabOrder = 0
      end
      """
    E o arquivo "Unit1.pas" deve receber a declaração "Button1: TButton;" na seção published
```

#### Cenário 3.2 (Happy Path): Duplo clique no componente gera manipulador de evento
```gherkin
  Cenário: Geração automática de manipulador de evento OnClick via duplo clique
    Dado que o componente "Button1" está selecionado no Form Designer
    Quando o usuário dá um duplo clique com o mouse sobre o botão
    Então a IDE deve alternar a visualização para o editor de código "Unit1.pas"
    E deve registrar na seção published: "procedure Button1Click(Sender: TObject);"
    E deve criar o corpo da procedure na seção implementation:
      """
      procedure TForm1.Button1Click(Sender: TObject);
      begin

      end;
      """
    E a propriedade "OnClick" de "Button1" no DFM deve ser vinculada a "Button1Click"
```

#### Cenário 3.3 (Exceção): Colisão ou duplicidade de identificador de componente
```gherkin
  Cenário: Usuário tenta renomear componente para um nome já existente
    Dado que o formulário já possui um componente com o nome "btnConfirmar"
    Quando o usuário seleciona outro componente e tenta alterar sua propriedade "Name" para "btnConfirmar" no Object Inspector
    Então o Object Inspector deve rejeitar a alteração
    E deve exibir uma mensagem modal: "Identificador 'btnConfirmar' já existe neste formulário"
    E o nome anterior do componente deve ser restaurado
```

#### Cenário 3.4 (Exceção): Leitura de DFM com componente de terceiro não instalado
```gherkin
  Cenário: Renderização de DFM contendo componente desconhecido
    Dado que o arquivo DFM possui o objeto "cxGrid1: TcxGrid" (componente proprietário não registrado na IDE)
    Quando o Form Designer renderiza a tela
    Então o componente deve ser desenhado como uma caixa de placeholder pontilhada com o texto "[TcxGrid: cxGrid1]"
    E suas dimensões (Left, Top, Width, Height) e propriedades devem ser preservadas integralmente no DFM
    E o usuário deve conseguir reposicionar o componente sem que suas propriedades desconhecidas sejam apagadas
```

---

### RF04: Orquestração e Execução de Compilação com Build Agent

**História de Usuário:**
> **Como** desenvolvedor Delphi,  
> **Quero** disparar a compilação do meu projeto contra um Agente de Compilação (Local ou Servidor),  
> **Para que** eu receba em tempo real os erros, warnings e os binários gerados (`.exe`, `.dll`, `.bpl`).

#### Cenário 4.1 (Happy Path): Compilação bem-sucedida com entrega de binário via Agente Local
```gherkin
Funcionalidade: Orquestração de Compilação via Agente
  Cenário: Compilar projeto Win32 com sucesso
    Dado que o Agente Local está conectado e pareado com a IDE Web
    E o usuário clica no botão "Build Project" (ou atalho Ctrl+F9)
    Quando a IDE envia a solicitação de compilação via WebSocket com os arquivos modificados
    Então o Agente Local deve invocar o compilador configurado ("dcc32.exe Vendas.dpr")
    E deve transmitir o log de compilação em tempo real para a aba "Build Output" da IDE
    E ao finalizar com código de saída 0:
      O painel de status deve exibir "Build Succeeded (0 erros, 0 warnings)"
      E o binário "Vendas.exe" deve ser gerado no diretório de saída
      E a IDE deve disponibilizar o botão "Download Binário" e "Executar Localmente"
```

#### Cenário 4.2 (Exceção): Falha de compilação com erros de sintaxe (Navegação estruturada)
```gherkin
  Cenário: Captura e navegação estruturada de erros de compilação
    Dado que o arquivo "uCalculo.pas" contém um erro sintático na linha 58 coluna 12
    Quando o processo de compilação é executado pelo agente
    Então o agente deve capturar a mensagem "uCalculo.pas(58,12): E2003 Undeclared identifier: 'X'"
    E a aba "Messages" da IDE Web deve listar o erro com ícone vermelho
    E quando o desenvolvedor clica sobre a linha do erro na aba Messages
    Então o editor de código deve abrir automaticamente "uCalculo.pas" e posicionar o cursor na linha 58 coluna 12
```

#### Cenário 4.3 (Exceção): Desconexão abrupta do Agente durante a compilação
```gherkin
  Cenário: Perda de conexão de rede durante o processo de build
    Dado que uma compilação de grande porte está em execução no Agente
    Quando a conexão WebSocket entre a Web IDE e o Agente cai subitamente
    Então a IDE Web deve aguardar uma janela de reconexão de 15 segundos
    E caso a conexão não se restabeleça:
      A interface deve atualizar o status para: "Conexão com o agente perdida durante a compilação"
      E o botão de compilação deve ser reabilitado
      E nenhuma trava de estado deve permanecer ativa no workspace
```

#### Cenário 4.4 (Borda): Compilação em loop infinito ou travada por diretiva de compilação
```gherkin
  Cenário: Timeout de compilação por processo travado no agente
    Dado que um script de pré-build ou compilação externa entra em loop infinito
    Quando o tempo de execução ultrapassa o limite máximo configurado (ex.: 120 segundos)
    Então o Agente de Compilação deve enviar sinal de interrupção forçada (SIGKILL / TerminateProcess) ao processo filho
    E deve retornar para a IDE Web a mensagem: "Compilação cancelada: Tempo limite de execução excedido (120s)"
```

---

### RF05: Assistente de Código e Inteligência Artificial para Object Pascal

**História de Usuário:**
> **Como** desenvolvedor de software,  
> **Quero** um assistente de inteligência artificial integrado à IDE especializado em Object Pascal,  
> **Para que** eu possa gerar código idiomático, criar rotinas complexas e refatorar trechos legados rapidamente.

#### Cenário 5.1 (Happy Path): Geração de rotina com tratamento de exceção seguro
```gherkin
Funcionalidade: Assistente de Código IA
  Cenário: Gerar função de consumo REST com FireDAC e System.JSON
    Dado que o desenvolvedor abre o painel do Assistente de Código
    E solicita: "Crie uma procedure para buscar clientes via REST e preencher um TFDMemTable"
    Quando a IA processa o pedido com contexto da versão do Delphi selecionada
    Então a resposta deve fornecer o código completo com:
      - Instanciação de TRESTClient, TRESTRequest e TRESTResponse
      - Bloco de proteção "try ... finally" garantindo a liberação com FreeAndNil
      - Tratamento seguro de exceções "except on E: Exception do"
    E a IDE deve exibir o botão "Inserir no cursor" para colar o código diretamente no editor
```

#### Cenário 5.2 (Exceção): Solicitação de código incompatível com a versão do compilador
```gherkin
  Cenário: Validação de versão para recursos modernos da linguagem
    Dado que o projeto está configurado para o compilador "Delphi 7" (que não suporta Generics)
    Quando o usuário solicita a criação de uma rotina com listas genéricas
    Então o Assistente de IA deve alertar: "O compilador ativo (Delphi 7) não suporta TList<T>. O código será gerado utilizando TObjectList clássico da unit Contnrs"
    E o código gerado deve ser compatível com a sintaxe do Delphi 7
```

---

### RF06: Arquitetura e Gerenciamento de Plugins

**História de Usuário:**
> **Como** mantenedor da plataforma ou desenvolvedor parceiro,  
> **Quero** adicionar novos plugins à IDE através de um manifesto e scripts modulares,  
> **Para que** eu possa estender a paleta de componentes e adicionar novos assistentes sem alterar o código principal da IDE.

#### Cenário 6.1 (Happy Path): Instalação e ativação de plugin de componentes customizados
```gherkin
Funcionalidade: Sistema de Plugins
  Cenário: Registrar categoria e componente customizado na paleta
    Dado que o usuário instala o plugin "plugin-meus-componentes.zip"
    Quando o plugin é carregado pelo host da IDE
    Então a Paleta de Componentes deve exibir a nova aba definida no manifesto do plugin
    E o componente customizado deve ficar disponível para ser arrastado no Form Designer
    E a IDE deve registrar o atalho e comandos associados na Command Palette
```

#### Cenário 6.2 (Exceção): Plugin tenta executar operação não autorizada ou entra em loop infinito
```gherkin
  Cenário: Interrupção de plugin malcomportado no sandbox
    Dado que um plugin de terceiro executa um laço infinito em seu Web Worker
    Quando o monitor de saúde do sandbox da IDE detecta que o worker não responde há mais de 5 segundos
    Então o host de plugins deve encerrar (terminate) imediatamente o Web Worker do plugin
    E deve exibir uma notificação para o usuário: "O plugin 'X' parou de responder e foi desativado para proteger a estabilidade da IDE"
    E o editor de código e o Form Designer devem continuar operando sem interrupção
```
