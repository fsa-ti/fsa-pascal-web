import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { BuildParams, BuildResult } from '../common/types.ts';
import { CompilerDetector, type DelphiInstallation } from './compiler-detector.ts';
import { DiagnosticsParser } from './diagnostics-parser.ts';
import { FallbackPascalCompiler } from './fallback-compiler.ts';

export class CompilerRunner {
  private fallbackCompiler = new FallbackPascalCompiler();

  public async run(
    params: BuildParams,
    installation?: DelphiInstallation,
    onLog?: (line: string) => void
  ): Promise<BuildResult> {
    const log = (msg: string) => onLog?.(msg);

    // Se temos dcc32/dcc64 disponível no Windows, compilar nativamente
    let result: BuildResult;
    if (installation && (installation.dcc32Path || installation.dcc64Path)) {
      result = await this.runNativeDelphi(params, installation, log);
    } else {
      // Caso contrário, utilizar o compilador/validador autônomo
      log(`[Agente] Nenhuma instalação nativa do Delphi dcc32 detectada. Utilizando PascalWeb Autonomous Compiler Engine.`);
      result = this.fallbackCompiler.compile(params, log);
    }

    // Se o usuário solicitou executar após o build e a compilação teve sucesso
    if (params.runAfterBuild && result.status === 'Success') {
      const exeArt = result.artifacts.find(a => a.fileName.endsWith('.exe'));
      if (exeArt && exeArt.localPath && fs.existsSync(exeArt.localPath)) {
        log(`[Agente] Iniciando processo na máquina local Windows: ${exeArt.localPath}`);
        try {
          spawn(exeArt.localPath, [], { detached: true, stdio: 'ignore' }).unref();
          log(`[Agente] Janela/Processo do executável disparado no Windows.`);
        } catch (execErr: any) {
          log(`[Agente Alerta] Falha ao iniciar processo: ${execErr.message}`);
        }
      }
    }

    return result;
  }

  private async runNativeDelphi(
    params: BuildParams,
    installation: DelphiInstallation,
    log: (msg: string) => void
  ): Promise<BuildResult> {
    const startTime = Date.now();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pascalweb_build_'));

    try {
      log(`[Agente] Criando workspace isolado em: ${tempDir}`);
      
      // Escrever arquivos no diretório temporário
      for (const file of params.files) {
        const fullPath = path.join(tempDir, file.relativePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, file.content, 'utf-8');
      }

      const compilerExe = params.platform === 'Win64' && installation.dcc64Path 
        ? installation.dcc64Path 
        : installation.dcc32Path!;

      const mainDpr = path.join(tempDir, path.basename(params.projectFilePath));
      const args = ['-B', '-Q', `-E${tempDir}`, mainDpr];

      log(`[Agente] Executando: ${compilerExe} ${args.join(' ')}`);

      return await new Promise<BuildResult>((resolve) => {
        const child = spawn(compilerExe, args, { cwd: tempDir, windowsHide: true });
        const diagnostics: any[] = [];
        let outputText = '';

        child.stdout.on('data', (chunk) => {
          const lines = chunk.toString().split(/\r?\n/);
          for (const line of lines) {
            if (!line.trim()) continue;
            log(line);
            outputText += line + '\n';
            const diag = DiagnosticsParser.parseLine(line);
            if (diag) diagnostics.push(diag);
          }
        });

        child.stderr.on('data', (chunk) => {
          const line = chunk.toString();
          log(`[STDERR] ${line}`);
          outputText += line + '\n';
        });

        child.on('close', (code) => {
          const durationMs = Date.now() - startTime;
          const errorCount = diagnostics.filter(d => d.severity === 'Error' || d.severity === 'Fatal').length;
          const warningCount = diagnostics.filter(d => d.severity === 'Warning').length;
          const hintCount = diagnostics.filter(d => d.severity === 'Hint').length;

          const artifacts: any[] = [];
          if (code === 0) {
            const files = fs.readdirSync(tempDir);
            for (const f of files) {
              if (f.endsWith('.exe') || f.endsWith('.dll') || f.endsWith('.bpl') || f.endsWith('.map')) {
                const stat = fs.statSync(path.join(tempDir, f));
                artifacts.push({
                  fileName: f,
                  fileSizeBytes: stat.size,
                  localPath: path.join(tempDir, f),
                  type: f.split('.').pop()
                });
              }
            }
          }

          resolve({
            buildId: params.buildId,
            status: code === 0 ? 'Success' : 'Failed',
            durationMs,
            errorCount,
            warningCount,
            hintCount,
            diagnostics,
            artifacts,
            rawLog: outputText
          });
        });

        child.on('error', (err) => {
          log(`[Agente Erro] Falha ao invocar processo: ${err.message}`);
          resolve({
            buildId: params.buildId,
            status: 'Failed',
            durationMs: Date.now() - startTime,
            errorCount: 1,
            warningCount: 0,
            hintCount: 0,
            diagnostics: [{
              file: params.projectFilePath,
              line: 1,
              column: 1,
              severity: 'Fatal',
              code: 'F0001',
              message: err.message
            }],
            artifacts: []
          });
        });
      });
    } finally {
      // Limpeza opcional postergada
    }
  }
}
