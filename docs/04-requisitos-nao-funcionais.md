# 04 - Requisitos Não-Funcionais (RNF) e Diretrizes de Engenharia

> **Projeto:** PascalWeb IDE  
> **Área:** Engenharia Não-Funcional, Segurança da Informação e Performance  
> **Status:** Especificação de SLAs e Métricas - Baseline 1.0  

---

## 1. Desempenho e Latência (Performance SLAs)

Em uma ferramenta de desenvolvimento interativa, qualquer latência perceptível destrói a experiência de programação. Os critérios abaixo eliminam qualquer subjetividade e estabelecem limites máximos auditáveis:

| ID | Requisito Não-Funcional | Métrica / SLA Quantificável | Condição de Teste / Carga |
| :--- | :--- | :--- | :--- |
| **RNF-PERF-01** | **Latência de Entrada de Teclado (Input Lag)** | $\le 16 \text{ ms}$ (garantia de 60 FPS) | Digitação contínua em arquivos `.pas` com até 15.000 linhas de código. |
| **RNF-PERF-02** | **Tempo de Carregamento Inicial da IDE (Cold Start)** | $\le 2.5 \text{ segundos}$ | Rede banda larga padrão (50 Mbps), sem cache prévio em navegador moderno (Chromium/Firefox). |
| **RNF-PERF-03** | **Tempo de Renderização do Form Designer** | $\le 200 \text{ ms}$ | Formulários VCL complexos com até 150 componentes visuais aninhados. |
| **RNF-PERF-04** | **Sincronização Bidirecional DFM <-> Visual Engine** | $\le 80 \text{ ms}$ | Atualização de propriedades e geometria no Object Inspector refletidas no modelo DFM em memória. |
| **RNF-PERF-05** | **Overhead de Comunicação Web IDE <-> Build Agent** | $\le 120 \text{ ms}$ de RTT (Round Trip Time) | Conexão de rede local ou corporativa com ping médio de até 30 ms. |
| **RNF-PERF-06** | **Taxa de Transferência no Streaming de Logs de Build** | $\ge 2.000 \text{ linhas/segundo}$ | Sem congelamento ou desaceleração da thread de renderização da UI (Web Worker dedicado para logs). |
| **RNF-PERF-07** | **Consumo de Memória RAM na Aba do Navegador** | $\le 350 \text{ MB}$ | Workspace com 20 units abertas simultaneamente após 4 horas de uso contínuo. |

---

## 2. Segurança, Proteção contra RCE e Isolamento de Processos

O processo de compilar e executar código Delphi em máquinas e servidores envolve manipulação de diretivas de compilação, scripts e binários nativos de baixo nível. As seguintes diretrizes de segurança são mandatórias:

### 2.1 Prevenção de Remote Code Execution (RCE) e Sanitização de Comandos
1. **Lista Branca de Binários Executáveis:** O Agente de Compilação (Local ou Servidor) só tem autorização para invocar binários explicitamente cadastrados no hash SHA-256 da instalação do RAD Studio (`dcc32.exe`, `dcc64.exe`, `dccosx.exe`, `brcc32.exe`, `msbuild.exe`).
2. **Proibição de Subshells Arbitrários:** É estritamente proibida a invocação de interpretadores de comando (`cmd.exe /c`, `powershell.exe -Command`, `bash`) para intermediar os comandos de compilação. Todas as chamadas de processo devem ser feitas via APIs nativas do sistema operacional (`CreateProcessW` em C++/Rust/Go) passando argumentos em array sanitizado sem expansão de variáveis de ambiente do usuário.
3. **Bloqueio de Diretivas de Compilação Perigosas em Servidores Compartilhados:** Em Agentes de Servidor multi-tenant, o pré-processador do agente deve analisar o código e rejeitar compilações contendo chamadas externas não autorizadas ou scripts de pré/pós-build no arquivo `.dproj` (`PreBuildEvent`, `PostBuildEvent`).

### 2.2 Isolamento de Processos de Compilação no Windows
1. **Windows Job Objects:** Cada processo de compilação disparado pelo agente em servidor dedicado deve ser encapsulado dentro de um `Windows Job Object` com as seguintes restrições:
   * **Limite de Memória:** Máximo de $2 \text{ GB}$ de RAM por job de compilação (`JOB_OBJECT_LIMIT_JOB_MEMORY`).
   * **Limite de Tempo de CPU:** Timeout estrito de $180 \text{ segundos}$ (`JOB_OBJECT_LIMIT_JOB_TIME`).
   * **Isolamento de Processos Filhos:** Limite de no máximo 8 processos simultâneos gerados pelo build (`JOB_OBJECT_LIMIT_ACTIVE_PROCESSES`).
2. **Sandbox de Diretório de Trabalho (Workspace Jail):** O compilador deve operar confinado em uma pasta temporária isolada (`sandbox_build_<uuid>`), com permissões NTFS de leitura estritas ao SDK do Delphi e bibliotecas aprovadas, sem acesso de escrita a pastas do sistema operacional (`C:\Windows`, `C:\Program Files`, etc.).

### 2.3 Criptografia e Comunicação em Trânsito
* **Transporte Seguro:** Toda comunicação externa entre a Web IDE, o servidor de orquestração e os agentes deve utilizar obrigatoriamente **TLS 1.3** sobre HTTPS e WSS (WebSockets seguros).
* **Autenticação Mútua (mTLS / Token Criptográfico):** O pareamento entre a IDE e o Agente Local é realizado através de tokens HMAC-SHA256 gerados com entropia criptográfica mínima de 256 bits, transmitidos exclusivamente via cabeçalho `Authorization: Bearer <token>`.
* **Proteção contra Cross-Site Scripting (XSS) e CSRF:** Políticas estritas de Content Security Policy (`CSP`), SameSite cookies e sanitização de qualquer saída HTML gerada por plugins.

---

## 3. Conformidade Legal e Licenciamento (Embarcadero EULA)

A arquitetura da PascalWeb IDE foi minuciosamente desenhada para **respeitar integralmente os direitos autorais e termos de licenciamento da Embarcadero Technologies**:

1. **Vedação à Redistribuição de Compiladores Proprietários:** O software da PascalWeb IDE (servidores, imagens Docker ou instaladores) **nunca** empacota, redistribui ou expõe binários proprietários da Embarcadero (`dcc32.exe`, `dcc64.exe`, bibliotecas de runtime VCL/RTL em código-fonte ou `.dcu`).
2. **Modelo BYOL (Bring Your Own License) para o Agente Local:**
   * O Agente Local opera como uma ponte (*bridge*) na própria máquina do desenvolvedor, utilizando a licença do RAD Studio previamente instalada e adquirida legitimamente pelo usuário.
   * Não há infração de EULA, pois a compilação ocorre localmente pelo desenvolvedor licenciado.
3. **Servidores Corporativos On-Premise:**
   * Para clientes que desejarem compilação em servidores de build remotos, o cliente é o responsável por provisionar a máquina Windows Server com sua própria licença "RAD Studio Network / Concurrent License" ou licença "Build Node" oficial da Embarcadero.
4. **Suporte a Compiladores Open-Source:** A arquitetura prevê compatibilidade futura com o compilador livre **Free Pascal (FPC / Lazarus)**, garantindo uma alternativa 100% livre e desvinculada de qualquer restrição comercial proprietária.

---

## 4. Disponibilidade, Escalabilidade e Concorrência

* **Disponibilidade da Web IDE (SLA de Nuvem):** $\ge 99.9\%$ de uptime mensal para os serviços de editor e gerenciamento de arquivos.
* **Escalabilidade da Nuvem:** A camada de API em nuvem deve ser totalmente *stateless*, escalando horizontalmente via contêineres gerenciados por Kubernetes ou AWS ECS.
* **Concorrência por Agente Local:** 1 sessão ativa exclusiva por porta de pareamento.
* **Concorrência no Agente de Servidor:** Fila de compilações com limite configurável de compilações paralelas (recomendado: 1 job por núcleo de CPU físico da máquina de build para evitar contenção de I/O de disco).

---

## 5. Auditoria, Rastreabilidade e Políticas de Retenção

* **Auditoria de Operações de Build:** Todo comando de compilação disparado deve registrar no log de auditoria:
  * Timestamp UTC em precisão de milissegundos.
  * Identificador único do usuário e IP de origem.
  * Identificador do agente de execução.
  * Nome do projeto, hash do commit/arquivos e resultado da compilação (código de saída, duração).
* **Política de Retenção de Artefatos no Servidor Cloud:**
  * Binários gerados em servidores de nuvem (`.exe`, `.dll`, `.bpl`) são armazenados em bucket seguro e descartados automaticamente após **48 horas**, a menos que explicitamente marcados como release pelo usuário.
  * Logs detalhados de compilação retidos por **30 dias** para fins de diagnóstico e depuração.
