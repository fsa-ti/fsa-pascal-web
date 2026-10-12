/**
 * PascalWeb IDE - Definições e Tipos Centrais da Plataforma
 */

export const PASCAL_WEB_VERSION = '1.0.0';

export type TargetPlatform = 'Win32' | 'Win64';
export type BuildConfig = 'Debug' | 'Release';
export type ProjectType = 'VCLApplication' | 'ConsoleApplication' | 'LibraryDLL' | 'PackageBPL';

export interface ProjectFile {
  name: string;
  path: string; // Relativo à raiz do projeto, ex: "src/ufrmPrincipal.pas"
  type: 'dpr' | 'pas' | 'dfm' | 'dproj' | 'dpk' | 'res' | 'txt' | 'other';
  content: string;
  isModified?: boolean;
}

export interface DelphiProject {
  id: string;
  name: string;
  type: ProjectType;
  rootPath: string;
  mainFile: string; // ex: "GestaoVendas.dpr"
  activeConfig: BuildConfig;
  activePlatform: TargetPlatform;
  files: ProjectFile[];
  searchPaths?: string[];
  libraryPaths?: string[];
}

// -------------------------------------------------------------
// DFM (Delphi Form) Abstract Syntax Tree (AST)
// -------------------------------------------------------------
export type DFMValueType = 'string' | 'integer' | 'float' | 'boolean' | 'enum' | 'set' | 'list' | 'binary';

export interface DFMProperty {
  name: string;
  value: any;
  valueType: DFMValueType;
  rawString?: string; // Para lossless round-trip de propriedades desconhecidas
}

export interface DFMObject {
  name: string;
  className: string;
  isInherited?: boolean;
  isInline?: boolean;
  properties: Record<string, any>;
  rawProperties: Record<string, string>; // Preservação estrita
  children: DFMObject[];
}

// -------------------------------------------------------------
// VCL Layout & Component Geometry
// -------------------------------------------------------------
export type VCLAlign = 'alNone' | 'alTop' | 'alBottom' | 'alLeft' | 'alRight' | 'alClient' | 'alCustom';
export type VCLAnchor = 'akLeft' | 'akTop' | 'akRight' | 'akBottom';

export interface VCLComponentMeta {
  className: string;
  name: string;
  category: 'Standard' | 'Additional' | 'Win32' | 'System' | 'Dialogs' | 'Data Controls' | 'Custom';
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  isNonVisual?: boolean;
  defaultProperties?: Record<string, any>;
  icon?: string;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// -------------------------------------------------------------
// Diagnósticos e Mensagens de Compilação
// -------------------------------------------------------------
export type DiagnosticSeverity = 'Fatal' | 'Error' | 'Warning' | 'Hint' | 'Info';

export interface BuildDiagnostic {
  file: string;
  line: number;
  column: number;
  severity: DiagnosticSeverity;
  code: string; // ex: "E2003", "W1000", "F1026"
  message: string;
  rawText?: string;
}

export interface BuildArtifact {
  fileName: string;
  fileSizeBytes: number;
  sha256?: string;
  localPath?: string;
  downloadUrl?: string;
  type: 'exe' | 'dll' | 'bpl' | 'map' | 'dcu';
}

export interface BuildResult {
  buildId: string;
  status: 'Success' | 'Failed' | 'Aborted';
  durationMs: number;
  errorCount: number;
  warningCount: number;
  hintCount: number;
  diagnostics: BuildDiagnostic[];
  artifacts: BuildArtifact[];
  rawLog?: string;
}

// -------------------------------------------------------------
// Protocolo JSON-RPC 2.0 do Build Agent
// -------------------------------------------------------------
export interface JSONRPCRequest<T = any> {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params: T;
}

export interface JSONRPCResponse<T = any> {
  jsonrpc: '2.0';
  id?: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface AgentHandshakeParams {
  pairingToken: string;
  clientVersion: string;
  agentType: 'local' | 'server';
  environment?: {
    os: string;
    delphiVersions?: Array<{
      version: string;
      bdsPath: string;
      compilerAvailable: string[];
    }>;
  };
}

export interface BuildParams {
  buildId: string;
  projectFilePath: string;
  target: 'Build' | 'Compile' | 'Clean';
  platform: TargetPlatform;
  config: BuildConfig;
  runAfterBuild?: boolean;
  files: Array<{
    relativePath: string;
    content: string;
  }>;
}

// -------------------------------------------------------------
// Sistema de Plugins & Extensibilidade
// -------------------------------------------------------------
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  publisher: string;
  description: string;
  contributes?: {
    paletteCategories?: Array<{
      id: string;
      title: string;
      icon?: string;
    }>;
    components?: Array<VCLComponentMeta>;
    commands?: Array<{
      id: string;
      title: string;
      category?: string;
      shortcut?: string;
    }>;
    linters?: boolean;
    aiWizards?: boolean;
  };
}
