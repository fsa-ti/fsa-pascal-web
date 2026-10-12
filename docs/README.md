# PascalWeb IDE - Documentação Técnica e Especificação de Requisitos

> **Status:** Especificação Técnica Aprovada / Fase de Discovery & Engenharia de Requisitos  
> **Versão:** 1.0.0  
> **Autor:** Engenheiro de Requisitos Principal & Arquiteto de Software Corporativo  
> **Data:** Outubro de 2026  

---

## 📌 Visão Geral do Repositório de Documentação

Esta pasta contém o pacote documental completo para o desenvolvimento da **PascalWeb IDE**, uma plataforma de desenvolvimento em nuvem (Web IDE) integrada com **Agentes de Compilação Distribuídos (Locais e em Servidor)** para a linguagem **Delphi / Object Pascal**, contemplando **Form Designer visual WYSIWYG bidirecional**, **Editor de Código com realce sintático e assistente**, **Gerenciador de Projetos multi-módulo (EXE, DLL, BPL)** e **Arquitetura modular de Plugins extensível**.

---

## 🗺️ Mapa de Documentos

| Arquivo | Descrição | Público-Alvo |
| :--- | :--- | :--- |
| [01-visao-e-escopo.md](file:///c:/Users/Fernando/Documents/projetos/pascal-online/docs/01-visao-e-escopo.md) | Sumário Executivo, Diagnóstico de Causa-Raiz, Proposta de Valor, Personas, Matriz de Escopo (MVP vs Visão de Futuro). | Gestão de Produto, C-Level, Tech Leads |
| [02-arquitetura-e-engenharia.md](file:///c:/Users/Fernando/Documents/projetos/pascal-online/docs/02-arquitetura-e-engenharia.md) | Arquitetura de Software e Infraestrutura (C4 Model, Topologia Web IDE + Build Agent, Protocolos WSS/gRPC, Parser DFM, Visual Designer, Microkernel de Plugins). | Arquitetos de Software, Engenheiros de DevOps e Tech Leads |
| [03-requisitos-funcionais-bdd.md](file:///c:/Users/Fernando/Documents/projetos/pascal-online/docs/03-requisitos-funcionais-bdd.md) | Especificações Funcionais exaustivas, Regras de Negócio (`[RN01]` a `[RN20]`), User Stories e Critérios de Aceitação em BDD (Gherkin). | Engenheiros de Software, QA / Testes, Product Owners |
| [04-requisitos-nao-funcionais.md](file:///c:/Users/Fernando/Documents/projetos/pascal-online/docs/04-requisitos-nao-funcionais.md) | Requisitos Não-Funcionais quantificáveis (Latência, Segurança RCE, Sandbox, Licenciamento Embarcadero, Retenção e Auditoria). | Arquitetos de Segurança, DevOps, DBA, Compliance |
| [05-matriz-riscos-desafios-mitigacoes.md](file:///c:/Users/Fernando/Documents/projetos/pascal-online/docs/05-matriz-riscos-desafios-mitigacoes.md) | Análise de Riscos Implacável, FMEA ("O que pode dar errado"), Desafios Técnicos Complexos e Planos de Mitigação focados na Solução. | Gestão de Risco, Arquitetos, Liderança de Engenharia |
| [06-roadmap-e-fases-implementacao.md](file:///c:/Users/Fernando/Documents/projetos/pascal-online/docs/06-roadmap-e-fases-implementacao.md) | Fatiamento da Solução em Marcos Evolutivos (MVP -> V1 -> V2), Matriz de Priorização (Impacto vs Complexidade) e Critérios de Go/No-Go. | Product Management, Scrum Masters, Tech Leads |

---

## 🚀 Princípios Norteadores de Engenharia

1. **Desacoplamento Front-End Web vs. Engine de Compilação Windows:** O ambiente web nunca compila código diretamente; ele orquestra, edita e gera abstrações. A compilação é delegada a um **Agente Seguro** (Local ou Servidor Windows), contornando as restrições proprietárias dos compiladores da Embarcadero (`dcc32`, `dcc64`, `msbuild`).
2. **Sincronização Bidirecional Rigorosa (Código <-> DFM Visual):** O Form Designer e o Editor de Texto operam sobre a mesma Árvore Sintática Abstrata (AST) e DFM Object Tree. Mudanças visuais alteram o código; edições manuais refletem instantaneamente no preview.
3. **Segurança Zero-Trust na Execução de Compiladores:** Execução de código arbitrário e binários em agentes de compilação requer isolamento estrito contra Command Injection e Remote Code Execution (RCE) malicioso.
4. **Extensibilidade por Design (Open-Closed Principle):** Todos os módulos centrais (Paleta de Componentes, Linters, Geradores de Código, Renderizadores visuais) são expostos como pontos de extensão para Plugins.
