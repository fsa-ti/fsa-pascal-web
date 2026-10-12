# Especificação Técnica e Engenharia de Requisitos: Completar Classes (Class Completion - Ctrl+Shift+C)

## 1. Sumário Executivo e Diagnóstico da Causa-Raiz

### 1.1 Contexto do Problema
O usuário reportou falha na execução do recurso clássico do Delphi:
> *"a função de Completar classes não está funcionando, tanto pelo menu quanto pelo atalho CTRL + SHIFT + C"*

### 1.2 Dissecação da Causa-Raiz (Root Cause Analysis)
Após auditoria minuciosa da pilha de execução entre UI, atalhos de teclado e o analisador sintático AST de Object Pascal, foram identificados 4 bloqueios simultâneos:

1. **Premissa Falsa de Dependência de DFM (`!store.dfmModel`):**
   No handler `handleClassCompletion` de `App.tsx`, havia uma verificação impeditiva:
   ```typescript
   if (!store.activeFile || !store.activeFile.path.endsWith('.pas') || !store.dfmModel) return;
   ```
   * **Causa:** No carregamento inicial da aplicação e em todas as units de código puro (units que não são formulários VCL, ex: regras de negócio, serviços, modelos, helpers), `store.dfmModel` permanece estritamente `null`.
   * **Impacto:** O clique no menu ou o atalho retornavam silenciosamente sem executar nenhuma ação. O Class Completion é um recurso da linguagem Object Pascal, independente da existência de arquivo DFM.
2. **Inexistência de Interceptação do Atalho Global `Ctrl+Shift+C`:**
   O ouvinte global de teclado (`window.addEventListener('keydown')`) em `App.tsx` não tratava a combinação `Ctrl+Shift+C`. Quando o foco do usuário estava fora da área de texto do editor (ex.: barras de ferramentas, árvore de arquivos, abas), a combinação era capturada pelo navegador (que em navegadores baseados no Chromium abre o inspetor de elementos ou não faz nada).
3. **Stale Closure no Editor Monaco:**
   Em `CodeEditor.tsx`, a vinculação do comando do Monaco (`editor.addCommand`) capturava a referência inicial de `onClassCompletion` durante a primeira montagem, desatualizando o estado do React caso o arquivo ativo mudasse. Além disso, o comando não lia o texto em tempo real digitado pelo desenvolvedor (`editor.getValue()`), dependendo de propagação assíncrona de estado.
4. **Acoplamento Monoclasse do Analisador AST:**
   `PascalUnitManager.completeClasses` exigia obrigatoriamente a passagem de um `formClassName` e falhava caso o arquivo contivesse múltiplas classes ou uma classe com nome diferente da convenção do form. Além disso, não ignorava métodos puramente abstratos (`virtual; abstract;`), que no Delphi não possuem bloco de implementação.

---

## 2. Mapeamento de Regras de Negócio (RN)

* **[RN01] Independência de Formulário Visual:**
  O Class Completion (`Ctrl+Shift+C`) deve funcionar para qualquer unit Pascal (`.pas`), contenha ela ou não um formulário VCL ou arquivo `.dfm` associado.
* **[RN02] Autodescoberta Completa de Classes:**
  Se nenhum nome de classe prioritário for fornecido, o analisador deve escanear todas as classes declaradas no bloco `type` da seção `interface` da unit ativa e identificar métodos pendentes de implementação.
* **[RN03] Tratamento de Diretivas e Métodos Abstratos:**
  Métodos marcados com a diretiva `abstract;` não devem ter stubs de implementação gerados na seção `implementation`, evitando erros de compilação do compilador Pascal. Diretivas como `override;`, `virtual;` e `overload;` declaradas na interface devem ser omitidas na assinatura da implementação.
* **[RN04] Posicionamento Automático do Cursor (Ergonomia RAD Studio):**
  Ao gerar o primeiro método na seção `implementation`, a IDE deve reposicionar automaticamente o cursor de texto dentro do bloco `begin ... end;` (coluna 3), permitindo ao desenvolvedor começar a digitar o código sem intervenção manual.
* **[RN05] Feedback Operacional:**
  A IDE deve registrar no painel de console/logs o total de métodos implementados e suas assinaturas ou informar que todas as classes já estão com seus métodos implementados.

---

## 3. Especificação Funcional em BDD (Critérios de Aceite)

### Cenário 1: Completar método em unit de formulário VCL via atalho Ctrl+Shift+C
```gherkin
Dado que o desenvolvedor declarou "procedure NovoMetodo;" na classe TfrmPrincipal em uma unit .pas
Quando o desenvolvedor pressiona as teclas "Ctrl+Shift+C" dentro do editor
Então a seção implementation da unit deve receber o bloco:
  """
  procedure TfrmPrincipal.NovoMetodo;
  begin

  end;
  """
E o cursor do editor deve ser posicionado na linha em branco entre "begin" e "end;"
E o painel de mensagens/logs deve registrar o método implementado com sucesso
```

### Cenário 2: Completar múltiplas classes em unit de lógica pura sem arquivo DFM
```gherkin
Dado que o arquivo "uCalculadora.pas" contém as classes TCalculadora e THistorico
E ambas possuem funções declaradas sem implementação na seção implementation
Quando o desenvolvedor clica no menu "Projeto -> Completar Classes (Class Completion)"
Ou clica no menu "Ferramentas -> Completar Classes (Class Completion)"
Então os esqueletos de todas as funções pendentes devem ser gerados antes de "end."
E nenhum arquivo .dfm deve ser exigido para a operação
```

### Cenário 3: Não gerar corpo para métodos abstratos (virtual; abstract;)
```gherkin
Dado que a classe TBaseService declara "procedure Executar; virtual; abstract;"
E declara também "function ObterStatus: Boolean;"
Quando o comando Class Completion é executado
Então apenas "function TBaseService.ObterStatus: Boolean;" deve ser gerada na implementation
E "Executar" não deve receber bloco de implementação
```

### Cenário 4: Execução através do menu de contexto do botão direito do mouse
```gherkin
Dado que o desenvolvedor está com o cursor no editor de código
Quando ele clica com o botão direito sobre o código
Então deve ser exibida a opção "Completar Classes (Ctrl+Shift+C)"
E ao clicar na opção, o autocompletar deve ser executado sobre o texto atual do editor
```

---

## 4. Requisitos Não-Funcionais

* **Tempo de Resposta:** Processamento do AST e injeção do código em menos de 10ms.
* **Preservação de Integridade:** Zero corrupção de comentários, diretivas de compilação (`{$R *.dfm}`) ou código pré-existente na seção `implementation`.
* **Sincronismo de Edição:** Obtenção do código em tempo real via `editor.getValue()`, garantindo que caracteres recém-digitados sejam considerados sem necessidade de salvar previamente o arquivo.
