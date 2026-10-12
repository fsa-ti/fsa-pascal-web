import { useState, useEffect, useCallback } from 'react';
import { BuildDiagnostic, BuildResult, DelphiProject, DFMObject, ProjectFile } from '../../common/types.ts';
import { DFMParser, DFMSerializer } from '../../common/dfm/dfm-parser.ts';
import { PascalUnitManager } from '../../common/pascal-ast/unit-ast.ts';
import { VCLComponentRegistry } from '../../common/vcl/components.ts';

export interface EditorCursorPosition {
  file: string;
  line: number;
  column: number;
}

export function useIDEStore() {
  const [project, setProject] = useState<DelphiProject | null>(null);
  const [activeFilePath, setActiveFilePath] = useState<string>('src/ufrmPrincipal.pas');
  const [viewMode, setViewMode] = useState<'code' | 'designer'>('designer');
  const [selectedComponentName, setSelectedComponentName] = useState<string>('frmPrincipal');
  const [dfmModel, setDfmModel] = useState<DFMObject | null>(null);

  // Compilação & Agente
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [agentConnected, setAgentConnected] = useState<boolean>(true);
  const [cursorTarget, setCursorTarget] = useState<EditorCursorPosition | null>(null);

  // Painéis
  const [bottomTab, setBottomTab] = useState<'logs' | 'messages'>('messages');
  const [rightPanel, setRightPanel] = useState<'inspector' | 'ai' | 'plugins'>('inspector');

  const dfmParser = new DFMParser();
  const dfmSerializer = new DFMSerializer();

  // Carregar projeto inicial da API
  useEffect(() => {
    fetch('/api/projects/default')
      .then(res => res.json())
      .then((data: DelphiProject) => {
        setProject(data);
        // Inicializar DFM model da unit principal
        const dfmFile = data.files.find(f => f.path.endsWith('.dfm'));
        if (dfmFile) {
          try {
            const parsed = dfmParser.parse(dfmFile.content);
            setDfmModel(parsed);
          } catch (e) {
            console.error('Erro ao fazer parse inicial do DFM:', e);
          }
        }
      })
      .catch(err => {
        console.error('Falha ao conectar na API:', err);
      });
  }, []);

  // Obter arquivo ativo
  const activeFile = project?.files.find(f => f.path === activeFilePath) || null;

  // Atualizar conteúdo de um arquivo
  const updateFileContent = useCallback((path: string, newContent: string) => {
    setProject(prev => {
      if (!prev) return prev;
      const updatedFiles = prev.files.map(f => {
        if (f.path === path) {
          return { ...f, content: newContent, isModified: true };
        }
        return f;
      });
      return { ...prev, files: updatedFiles };
    });
  }, []);

  // Alternar entre Code e Designer (Atalho F12)
  const toggleViewMode = useCallback(() => {
    setViewMode(prev => {
      const next = prev === 'code' ? 'designer' : 'code';
      // Se for para o designer e o arquivo atual for um .pas, certificar que o DFM correspondente está carregado
      if (next === 'designer') {
        const associatedDfmPath = activeFilePath.replace(/\.pas$/i, '.dfm');
        const dfmFile = project?.files.find(f => f.path === associatedDfmPath);
        if (dfmFile) {
          try {
            const parsed = dfmParser.parse(dfmFile.content);
            setDfmModel(parsed);
          } catch (err) {
            console.error('Erro ao parsear DFM:', err);
          }
        }
      }
      return next;
    });
  }, [activeFilePath, project]);

  // Atualizar propriedade de um componente no DFM
  const updateComponentProperty = useCallback((compName: string, propName: string, val: any) => {
    if (!dfmModel || !project) return;

    const updateInTree = (node: DFMObject): boolean => {
      if (node.name === compName) {
        node.properties[propName] = val;
        return true;
      }
      for (const child of node.children) {
        if (updateInTree(child)) return true;
      }
      return false;
    };

    const cloned: DFMObject = JSON.parse(JSON.stringify(dfmModel));
    updateInTree(cloned);
    setDfmModel(cloned);

    // Serializar e salvar no arquivo .dfm
    const serialized = dfmSerializer.serialize(cloned);
    const associatedDfmPath = activeFilePath.replace(/\.pas$/i, '.dfm');
    updateFileContent(associatedDfmPath, serialized);
  }, [dfmModel, project, activeFilePath, updateFileContent]);

  // Adicionar novo componente na tela (da Paleta ou por Drag & Drop com coordenadas)
  const addComponentToForm = useCallback((
    className: string,
    defaultProps: Record<string, any>,
    posX?: number,
    posY?: number,
    targetParentName?: string
  ) => {
    if (!dfmModel || !project) return;

    // Gerar nome único: Button1, Button2, etc.
    const prefix = className.startsWith('T') ? className.substring(1) : className;
    let counter = 1;
    const findName = (node: DFMObject, targetName: string): boolean => {
      if (node.name.toLowerCase() === targetName.toLowerCase()) return true;
      return node.children.some(c => findName(c, targetName));
    };

    while (findName(dfmModel, `${prefix}${counter}`)) {
      counter++;
    }
    const newCompName = `${prefix}${counter}`;

    const finalLeft = posX !== undefined ? Math.round(posX / 8) * 8 : (50 + (counter * 16) % 240);
    const finalTop = posY !== undefined ? Math.round(posY / 8) * 8 : (50 + (counter * 16) % 180);

    const isNonVis = VCLComponentRegistry.isNonVisual(className);
    const properties: Record<string, any> = { ...defaultProps };
    properties.Left = finalLeft;
    properties.Top = finalTop;
    if (!isNonVis) {
      properties.Width = defaultProps.Width || 75;
      properties.Height = defaultProps.Height || 25;
      if (properties.Caption === undefined) {
        properties.Caption = newCompName;
      }
    }

    const newChild: DFMObject = {
      name: newCompName,
      className,
      properties,
      rawProperties: {},
      children: []
    };

    const cloned: DFMObject = JSON.parse(JSON.stringify(dfmModel));

    // Se tiver container pai especificado (ex: soltou dentro de um TPanel)
    let inserted = false;
    if (targetParentName && targetParentName !== dfmModel.name) {
      const insertInParent = (node: DFMObject): boolean => {
        if (node.name === targetParentName) {
          node.children.push(newChild);
          return true;
        }
        return node.children.some(insertInParent);
      };
      inserted = insertInParent(cloned);
    }

    if (!inserted) {
      cloned.children.push(newChild);
    }

    setDfmModel(cloned);
    setSelectedComponentName(newCompName);

    // 1. Atualizar arquivo DFM
    const serialized = dfmSerializer.serialize(cloned);
    const dfmPath = activeFilePath.replace(/\.pas$/i, '.dfm');
    updateFileContent(dfmPath, serialized);

    // 2. Injetar na seção published da unit .PAS correspondente
    const pasPath = activeFilePath.replace(/\.dfm$/i, '.pas');
    const pasFile = project.files.find(f => f.path === pasPath);
    if (pasFile) {
      const updatedPas = PascalUnitManager.injectComponent(
        pasFile.content,
        dfmModel.className || 'T' + dfmModel.name,
        newCompName,
        className
      );
      updateFileContent(pasPath, updatedPas);
    }
  }, [dfmModel, project, activeFilePath, updateFileContent]);

  // Atualizar geometria completa (Left, Top, Width, Height) após drag/resize
  const updateComponentGeometry = useCallback((
    compName: string,
    rect: { left: number; top: number; width: number; height: number }
  ) => {
    if (!dfmModel || !project) return;

    const updateInTree = (node: DFMObject): boolean => {
      if (node.name === compName) {
        node.properties.Left = rect.left;
        node.properties.Top = rect.top;
        node.properties.Width = rect.width;
        node.properties.Height = rect.height;
        return true;
      }
      return node.children.some(updateInTree);
    };

    const cloned: DFMObject = JSON.parse(JSON.stringify(dfmModel));
    if (updateInTree(cloned)) {
      setDfmModel(cloned);
      const serialized = dfmSerializer.serialize(cloned);
      const dfmPath = activeFilePath.replace(/\.pas$/i, '.dfm');
      updateFileContent(dfmPath, serialized);
    }
  }, [dfmModel, project, activeFilePath, updateFileContent]);

  // Deletar componente selecionado
  const deleteSelectedComponent = useCallback(() => {
    if (!dfmModel || !project || selectedComponentName === dfmModel.name) return;

    const removeFromTree = (parent: DFMObject): boolean => {
      const idx = parent.children.findIndex(c => c.name === selectedComponentName);
      if (idx !== -1) {
        parent.children.splice(idx, 1);
        return true;
      }
      return parent.children.some(c => removeFromTree(c));
    };

    const cloned: DFMObject = JSON.parse(JSON.stringify(dfmModel));
    removeFromTree(cloned);
    setDfmModel(cloned);
    setSelectedComponentName(cloned.name);

    // Atualizar DFM
    const serialized = dfmSerializer.serialize(cloned);
    const dfmPath = activeFilePath.replace(/\.pas$/i, '.dfm');
    updateFileContent(dfmPath, serialized);

    // Remover do .PAS
    const pasPath = activeFilePath.replace(/\.dfm$/i, '.pas');
    const pasFile = project.files.find(f => f.path === pasPath);
    if (pasFile) {
      const updatedPas = PascalUnitManager.removeComponent(pasFile.content, selectedComponentName);
      updateFileContent(pasPath, updatedPas);
    }
  }, [dfmModel, project, selectedComponentName, activeFilePath, updateFileContent]);

  // Gerar manipulador de evento via duplo clique no Form Designer
  const handleComponentDoubleClick = useCallback((compName: string, eventName: string = 'OnClick') => {
    if (!dfmModel || !project) return;

    const handlerMethodName = `${compName}${eventName.replace(/^On/i, '')}`;

    // 1. Atualizar DFM com a propriedade de evento vinculada
    updateComponentProperty(compName, eventName, handlerMethodName);

    // 2. Injetar no código .PAS
    const pasPath = activeFilePath.replace(/\.dfm$/i, '.pas');
    const pasFile = project.files.find(f => f.path === pasPath);
    if (pasFile) {
      const { updatedContent } = PascalUnitManager.injectEventHandler(
        pasFile.content,
        dfmModel.className || 'T' + dfmModel.name,
        handlerMethodName
      );
      updateFileContent(pasPath, updatedContent);

      // 3. Alternar para o editor de código e posicionar na implementação
      setActiveFilePath(pasPath);
      setViewMode('code');

      // Localizar linha onde foi gerada a procedure
      const lines = updatedContent.split(/\r?\n/);
      const targetIdx = lines.findIndex(l => l.includes(`procedure ${dfmModel.className}.${handlerMethodName}`));
      if (targetIdx !== -1) {
        setCursorTarget({
          file: pasPath,
          line: targetIdx + 3, // Dentro do begin ... end
          column: 3
        });
      }
    }
  }, [dfmModel, project, activeFilePath, updateComponentProperty, updateFileContent]);

  // Disparar Compilação
  const executeBuild = useCallback(async (runAfterBuild: boolean = true) => {
    if (!project || isBuilding) return;

    setIsBuilding(true);
    setBuildLogs([`[PascalWeb] Preparando build do projeto ${project.name}...`]);
    setBottomTab('logs');

    try {
      const payload = {
        buildId: 'bld_' + Math.random().toString(36).substring(2, 9),
        projectFilePath: project.mainFile,
        target: 'Build',
        platform: project.activePlatform,
        config: project.activeConfig,
        runAfterBuild,
        files: project.files.map(f => ({
          relativePath: f.path,
          content: f.content
        }))
      };

      const res = await fetch('/api/build/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result: BuildResult = await res.json();
      setBuildResult(result);
      setBuildLogs(prev => [...prev, `[PascalWeb] Concluído: Status ${result.status} em ${result.durationMs}ms`]);
      if (result.errorCount > 0) {
        setBottomTab('messages');
      }
    } catch (err: any) {
      setBuildLogs(prev => [...prev, `[Erro de Comunicação] ${err.message}`]);
    } finally {
      setIsBuilding(false);
    }
  }, [project, isBuilding]);

  // Executar binário gerado na máquina local
  const runLocalArtifact = useCallback(async (artifact: any) => {
    try {
      const res = await fetch('/api/build/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: artifact.fileName,
          localPath: artifact.localPath
        })
      });
      const data = await res.json();
      setBuildLogs(prev => [...prev, `[Windows Process] ${data.message || 'Comando enviado'}`]);
    } catch (err: any) {
      setBuildLogs(prev => [...prev, `[Falha ao Executar] ${err.message}`]);
    }
  }, []);

  // Navegar para diagnóstico ao clicar na lista de erros
  const navigateToDiagnostic = useCallback((diag: BuildDiagnostic) => {
    const targetFile = project?.files.find(f => f.path.toLowerCase().endsWith(diag.file.toLowerCase().replace(/\\/g, '/')));
    if (targetFile) {
      setActiveFilePath(targetFile.path);
      setViewMode('code');
      setCursorTarget({
        file: targetFile.path,
        line: diag.line,
        column: diag.column
      });
    }
  }, [project]);

  // Gestão de Pastas Customizadas
  const [customFolders, setCustomFolders] = useState<string[]>(['src']);

  // Salvar projeto completo na API
  const saveProject = useCallback(async () => {
    if (!project) return;
    try {
      await fetch('/api/projects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      setProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          files: prev.files.map(f => ({ ...f, isModified: false }))
        };
      });
      setBuildLogs(prev => [...prev, `[Projeto] Salvo com sucesso (${new Date().toLocaleTimeString()})`]);
    } catch (e: any) {
      setBuildLogs(prev => [...prev, `[Erro ao Salvar] ${e.message}`]);
    }
  }, [project]);

  // Criar Nova Unit Pascal (com ou sem Form VCL)
  const createNewUnit = useCallback((
    isForm: boolean = false,
    targetFolder: string = 'src',
    customUnitName?: string
  ) => {
    if (!project) return;

    let unitBase = customUnitName?.trim();
    if (!unitBase) {
      const prefix = isForm ? 'ufrmView' : 'uUnit';
      let c = 1;
      while (project.files.some(f => f.name.toLowerCase() === `${prefix}${c}.pas`.toLowerCase())) {
        c++;
      }
      unitBase = `${prefix}${c}`;
    }

    unitBase = unitBase.replace(/\.pas$/i, '');
    const pasFileName = `${unitBase}.pas`;
    const cleanFolder = targetFolder.replace(/\/+$/, '');
    const pasRelPath = cleanFolder ? `${cleanFolder}/${pasFileName}` : pasFileName;

    const formName = isForm ? (unitBase.startsWith('u') ? unitBase.substring(1) : unitBase) : undefined;
    const { pasContent, dfmContent } = PascalUnitManager.generateUnitTemplate(unitBase, isForm, formName);

    const newFiles: ProjectFile[] = [
      ...project.files,
      {
        name: pasFileName,
        path: pasRelPath,
        type: 'pas',
        content: pasContent,
        isModified: true
      }
    ];

    if (isForm && dfmContent) {
      const dfmFileName = `${unitBase}.dfm`;
      const dfmRelPath = cleanFolder ? `${cleanFolder}/${dfmFileName}` : dfmFileName;
      newFiles.push({
        name: dfmFileName,
        path: dfmRelPath,
        type: 'dfm',
        content: dfmContent,
        isModified: true
      });
    }

    // Atualizar DPR
    const dprFile = newFiles.find(f => f.type === 'dpr');
    if (dprFile) {
      dprFile.content = PascalUnitManager.injectUnitIntoDpr(dprFile.content, unitBase, pasRelPath, formName);
      dprFile.isModified = true;
    }

    const updatedProject = { ...project, files: newFiles };
    setProject(updatedProject);
    setActiveFilePath(pasRelPath);

    if (isForm && dfmContent) {
      try {
        const parsed = dfmParser.parse(dfmContent);
        setDfmModel(parsed);
        setSelectedComponentName(formName || 'Form1');
      } catch (err) {
        console.error(err);
      }
    }

    fetch('/api/projects/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject)
    }).catch(console.error);

    setBuildLogs(prev => [...prev, `[Projeto] Nova unit criada: ${pasRelPath} ${isForm ? '(com Form VCL)' : ''}`]);
  }, [project, dfmParser]);

  // Criar Nova Pasta
  const createNewFolder = useCallback((folderName: string, parentFolder?: string) => {
    const cleanName = folderName.trim().replace(/[\\/]/g, '');
    if (!cleanName) return;
    const newPath = parentFolder
      ? `${parentFolder.replace(/\/+$/, '')}/${cleanName}`
      : (cleanName.startsWith('src') ? cleanName : `src/${cleanName}`);

    setCustomFolders(prev => {
      if (prev.includes(newPath)) return prev;
      return [...prev, newPath];
    });
    setBuildLogs(prev => [...prev, `[Projeto] Nova pasta criada: ${newPath}`]);
  }, []);

  // Renomear Arquivo (com sincronização de .dfm e .dpr - Paridade [RN20])
  const renameFile = useCallback((oldPath: string, newFileName: string) => {
    if (!project) return;
    let cleanNewName = newFileName.trim();
    if (!cleanNewName) return;

    const oldFile = project.files.find(f => f.path === oldPath);
    if (!oldFile) return;

    // Garante mesma extensão
    const extMatch = oldFile.name.match(/\.[^/.]+$/);
    const ext = extMatch ? extMatch[0] : '';
    if (ext && !cleanNewName.toLowerCase().endsWith(ext.toLowerCase())) {
      cleanNewName += ext;
    }

    const dir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
    const newPath = dir ? `${dir}/${cleanNewName}` : cleanNewName;

    const oldUnitName = oldFile.name.replace(/\.[^/.]+$/, '');
    const newUnitName = cleanNewName.replace(/\.[^/.]+$/, '');

    const updatedFiles = project.files.map(f => ({ ...f }));

    // 1. Atualizar arquivo renomeado
    const target = updatedFiles.find(f => f.path === oldPath);
    if (target) {
      target.name = cleanNewName;
      target.path = newPath;
      target.isModified = true;
      if (target.type === 'pas') {
        target.content = PascalUnitManager.renameUnitInContent(target.content, newUnitName);
      }
    }

    // 2. Se for .pas com .dfm correspondente, renomear o .dfm também
    if (oldFile.type === 'pas') {
      const oldDfmPath = oldPath.replace(/\.pas$/i, '.dfm');
      const targetDfm = updatedFiles.find(f => f.path === oldDfmPath);
      if (targetDfm) {
        const newDfmName = `${newUnitName}.dfm`;
        const newDfmPath = dir ? `${dir}/${newDfmName}` : newDfmName;
        targetDfm.name = newDfmName;
        targetDfm.path = newDfmPath;
        targetDfm.isModified = true;
      }

      // 3. Atualizar .DPR
      const dprFile = updatedFiles.find(f => f.type === 'dpr');
      if (dprFile) {
        dprFile.content = PascalUnitManager.renameUnitInDpr(dprFile.content, oldUnitName, newUnitName, newPath);
        dprFile.isModified = true;
      }
    }

    const updatedProject = { ...project, files: updatedFiles };
    setProject(updatedProject);

    if (activeFilePath === oldPath) {
      setActiveFilePath(newPath);
    }

    fetch('/api/projects/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject)
    }).catch(console.error);

    setBuildLogs(prev => [...prev, `[Projeto] Arquivo renomeado para ${cleanNewName}`]);
  }, [project, activeFilePath]);

  // Excluir Arquivo do Projeto
  const deleteFile = useCallback((filePath: string) => {
    if (!project) return;
    if (filePath.endsWith('.dpr') || filePath.endsWith('.dproj')) {
      alert('Não é possível excluir os arquivos raiz do projeto (.dpr/.dproj).');
      return;
    }

    const updatedFiles = project.files.filter(f => {
      if (filePath.endsWith('.pas')) {
        const associatedDfm = filePath.replace(/\.pas$/i, '.dfm');
        return f.path !== filePath && f.path !== associatedDfm;
      }
      return f.path !== filePath;
    });

    const updatedProject = { ...project, files: updatedFiles };
    setProject(updatedProject);

    if (activeFilePath === filePath) {
      const fallback = updatedFiles.find(f => f.type === 'pas') || updatedFiles[0];
      if (fallback) setActiveFilePath(fallback.path);
    }

    fetch('/api/projects/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject)
    }).catch(console.error);

    setBuildLogs(prev => [...prev, `[Projeto] Arquivo excluído: ${filePath}`]);
  }, [project, activeFilePath]);

  return {
    project,
    setProject,
    activeFilePath,
    setActiveFilePath,
    activeFile,
    viewMode,
    setViewMode,
    toggleViewMode,
    selectedComponentName,
    setSelectedComponentName,
    dfmModel,
    updateFileContent,
    updateComponentProperty,
    updateComponentGeometry,
    addComponentToForm,
    deleteSelectedComponent,
    handleComponentDoubleClick,
    // Gestão de Arquivos e Units
    createNewUnit,
    createNewFolder,
    renameFile,
    deleteFile,
    saveProject,
    customFolders,
    setCustomFolders,
    // Compilação
    isBuilding,
    buildLogs,
    setBuildLogs,
    buildResult,
    executeBuild,
    runLocalArtifact,
    agentConnected,
    cursorTarget,
    setCursorTarget,
    navigateToDiagnostic,
    // Abas de painéis
    bottomTab,
    setBottomTab,
    rightPanel,
    setRightPanel
  };
}
