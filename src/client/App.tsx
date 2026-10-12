import React, { useEffect, useState } from 'react';
import { useIDEStore } from './services/store.ts';
import { TopMenu } from './components/TopMenu.tsx';
import { ProjectTree } from './components/ProjectTree.tsx';
import { CodeEditor } from './components/Editor/CodeEditor.tsx';
import { FormDesigner } from './components/Designer/FormDesigner.tsx';
import { ObjectInspector } from './components/Designer/ObjectInspector.tsx';
import { BuildPanel } from './components/Console/BuildPanel.tsx';
import { AIPanel } from './components/AIAssistant/AIPanel.tsx';
import { PluginsModal } from './components/Plugins/PluginsModal.tsx';
import { PascalUnitManager } from '../common/pascal-ast/unit-ast.ts';

export const App: React.FC = () => {
  const store = useIDEStore();
  const [showAI, setShowAI] = useState(false);
  const [showPlugins, setShowPlugins] = useState(false);

  // Escuta de atalhos globais de teclado (F12, F9, Ctrl+F9, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Atalho F12: Alternar código e Form Designer
      if (e.key === 'F12') {
        e.preventDefault();
        store.toggleViewMode();
        return;
      }

      // Atalho F9 ou Ctrl+F9: Compilar Projeto
      if (e.key === 'F9') {
        e.preventDefault();
        store.executeBuild();
        return;
      }

      // Atalho Ctrl+S: Salvar Projeto
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        store.saveProject();
        return;
      }

      // Atalho Ctrl+N: Nova Unit
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        store.createNewUnit(false);
        return;
      }

      // Atalho Ctrl+Shift+N: Novo Form
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        store.createNewUnit(true);
        return;
      }

      // Atalho Ctrl+Shift+C: Completar Classes (Class Completion)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClassCompletion();
        return;
      }

      // Atalho Delete: Excluir componente selecionado se estiver no designer
      if (e.key === 'Delete' && store.viewMode === 'designer') {
        const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (targetTag !== 'input' && targetTag !== 'textarea' && targetTag !== 'select') {
          e.preventDefault();
          store.deleteSelectedComponent();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  // Handler para Class Completion (Ctrl+Shift+C)
  const handleClassCompletion = (explicitContent?: string) => {
    // 1. Identificar unit Pascal (.pas) ativa
    let targetPasPath = store.activeFilePath;
    if (!targetPasPath.endsWith('.pas')) {
      const candidatePas = targetPasPath.replace(/\.dfm$/i, '.pas');
      if (store.project?.files.some(f => f.path === candidatePas)) {
        targetPasPath = candidatePas;
        store.setActiveFilePath(candidatePas);
      } else {
        const firstPas = store.project?.files.find(f => f.type === 'pas');
        if (firstPas) {
          targetPasPath = firstPas.path;
          store.setActiveFilePath(firstPas.path);
        } else {
          return;
        }
      }
    }

    const targetFile = store.project?.files.find(f => f.path === targetPasPath);
    if (!targetFile) return;

    // Se estiver no visual designer, mudar para o editor de código
    if (store.viewMode !== 'code') {
      store.setViewMode('code');
    }

    // 2. Determinar conteúdo (prioriza texto em tempo real do editor)
    const currentCode = (explicitContent && targetFile.path === store.activeFilePath) ? explicitContent : targetFile.content;

    // 3. Determinar classe prioritária (se houver form associado)
    const associatedDfmPath = targetPasPath.replace(/\.pas$/i, '.dfm');
    const dfmFile = store.project?.files.find(f => f.path === associatedDfmPath);
    let formClassName: string | undefined = undefined;

    if (store.dfmModel && store.activeFilePath === targetPasPath) {
      formClassName = store.dfmModel.className || 'T' + store.dfmModel.name;
    } else if (dfmFile) {
      const m = dfmFile.content.match(/object\s+([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_]+)/i);
      if (m) formClassName = m[2];
    }

    // 4. Executar autocompletar de classes
    const { updatedContent, addedMethods, firstTargetLine } = PascalUnitManager.completeClasses(
      currentCode,
      formClassName
    );

    if (addedMethods.length > 0) {
      store.updateFileContent(targetPasPath, updatedContent);

      if (firstTargetLine) {
        store.setCursorTarget({
          file: targetPasPath,
          line: firstTargetLine,
          column: 3
        });
      }

      store.setBuildLogs(prev => [
        ...prev,
        `[Class Completion] ${addedMethods.length} método(s) implementado(s) com sucesso em ${targetFile.name}: ${addedMethods.join(', ')}`
      ]);
    } else {
      store.setBuildLogs(prev => [
        ...prev,
        `[Class Completion] Todas as declarações de classe em ${targetFile.name} já possuem corpo de implementação.`
      ]);
    }
  };

  // Inserir código da IA diretamente na unit ativa
  const handleInsertAICode = (codeSnippet: string) => {
    if (!store.activeFile) return;
    const updated = store.activeFile.content + '\r\n\r\n' + codeSnippet;
    store.updateFileContent(store.activeFile.path, updated);
    store.setViewMode('code');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121316] text-zinc-100 font-sans antialiased">
      {/* 1. Barra de Menu Superior */}
      <TopMenu
        project={store.project}
        viewMode={store.viewMode}
        onToggleViewMode={store.toggleViewMode}
        isBuilding={store.isBuilding}
        onBuild={store.executeBuild}
        activeFilePath={store.activeFilePath}
        onOpenAI={() => setShowAI(!showAI)}
        onOpenPlugins={() => setShowPlugins(true)}
        hasArtifacts={!!(store.buildResult?.artifacts && store.buildResult.artifacts.length > 0)}
        onNewUnit={() => store.createNewUnit(false)}
        onNewForm={() => store.createNewUnit(true)}
        onNewFolder={() => {
          const folder = prompt('Nome da nova pasta (ex: services, models):');
          if (folder) store.createNewFolder(folder);
        }}
        onSave={store.saveProject}
        onDeleteSelected={store.deleteSelectedComponent}
        onClassCompletion={handleClassCompletion}
        onOpenDpr={() => {
          const dpr = store.project?.files.find(f => f.type === 'dpr');
          if (dpr) {
            store.setActiveFilePath(dpr.path);
            store.setViewMode('code');
          }
        }}
        onRunArtifact={() => {
          if (store.buildResult?.artifacts?.[0]) {
            store.runLocalArtifact(store.buildResult.artifacts[0]);
          }
        }}
      />

      {/* 2. Área Central de Trabalho (Sidebar | Editor/Designer | Inspector/AI) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Painel Esquerdo: Explorador de Arquivos do Projeto */}
        <ProjectTree
          project={store.project}
          activeFilePath={store.activeFilePath}
          customFolders={store.customFolders}
          onSelectFile={(path) => {
            store.setActiveFilePath(path);
            if (path.endsWith('.dfm')) {
              store.setViewMode('designer');
            } else {
              store.setViewMode('code');
            }
          }}
          onOpenDesignerForUnit={(pasPath) => {
            store.setActiveFilePath(pasPath);
            store.setViewMode('designer');
          }}
          onNewUnit={store.createNewUnit}
          onNewFolder={store.createNewFolder}
          onRenameFile={store.renameFile}
          onDeleteFile={store.deleteFile}
        />

        {/* Centro: Alternância Monaco Editor vs Form Designer WYSIWYG */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0 relative bg-[#121316]">
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
            {store.viewMode === 'designer' ? (
              <FormDesigner
                dfmModel={store.dfmModel}
                selectedComponentName={store.selectedComponentName}
                onSelectComponent={store.setSelectedComponentName}
                onAddComponent={store.addComponentToForm}
                onComponentDoubleClick={store.handleComponentDoubleClick}
                onUpdateComponentGeometry={store.updateComponentGeometry}
                onDeleteComponent={store.deleteSelectedComponent}
              />
            ) : (
              <CodeEditor
                filePath={store.activeFilePath}
                content={store.activeFile?.content || ''}
                onChange={(newContent) => store.updateFileContent(store.activeFilePath, newContent)}
                onToggleViewMode={store.toggleViewMode}
                onBuild={store.executeBuild}
                onClassCompletion={handleClassCompletion}
                cursorTarget={store.cursorTarget}
              />
            )}
          </div>

          {/* 3. Painel Inferior de Mensagens, Console e Artefatos */}
          <BuildPanel
            activeTab={store.bottomTab}
            onTabChange={store.setBottomTab}
            buildLogs={store.buildLogs}
            buildResult={store.buildResult}
            onNavigateToDiagnostic={store.navigateToDiagnostic}
            onRunArtifact={store.runLocalArtifact}
          />
        </main>

        {/* Painel Direito: Object Inspector no modo designer */}
        {store.viewMode === 'designer' && (
          <ObjectInspector
            rootDfm={store.dfmModel}
            selectedComponentName={store.selectedComponentName}
            onSelectComponent={store.setSelectedComponentName}
            onUpdateProperty={store.updateComponentProperty}
            onDeleteComponent={store.deleteSelectedComponent}
            onEventDoubleClick={(compName, eventName) => store.handleComponentDoubleClick(compName, eventName)}
          />
        )}

        {/* Gaveta do Assistente Delphi AI */}
        {showAI && (
          <AIPanel
            onClose={() => setShowAI(false)}
            onInsertCode={handleInsertAICode}
            activeUnitName={store.activeFilePath}
          />
        )}
      </div>

      {/* Modal de Gerenciamento de Plugins */}
      {showPlugins && <PluginsModal onClose={() => setShowPlugins(false)} />}
    </div>
  );
};
