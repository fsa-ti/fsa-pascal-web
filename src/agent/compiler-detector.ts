import fs from 'node:fs';
import path from 'node:path';

export interface DelphiInstallation {
  version: string;
  bdsPath: string;
  binPath: string;
  dcc32Path?: string;
  dcc64Path?: string;
  msbuildPath?: string;
}

/**
 * Detector de Instalações do RAD Studio / Delphi no Windows
 */
export class CompilerDetector {
  public static detect(): DelphiInstallation[] {
    const installations: DelphiInstallation[] = [];

    // Checar variável de ambiente BDS
    const bdsEnv = process.env['BDS'];
    if (bdsEnv && fs.existsSync(bdsEnv)) {
      const inst = this.createFromBDSPath('Custom / BDS Environment', bdsEnv);
      if (inst) installations.push(inst);
    }

    // Diretórios comuns no Windows
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const embarcaderoDir = path.join(programFilesX86, 'Embarcadero', 'Studio');

    if (fs.existsSync(embarcaderoDir)) {
      try {
        const versions = fs.readdirSync(embarcaderoDir);
        for (const ver of versions) {
          const verPath = path.join(embarcaderoDir, ver);
          const inst = this.createFromBDSPath(`Delphi Studio ${ver}`, verPath);
          if (inst) installations.push(inst);
        }
      } catch {
        // Ignorar falhas de permissão de leitura
      }
    }

    return installations;
  }

  private static createFromBDSPath(name: string, bdsPath: string): DelphiInstallation | null {
    const binPath = path.join(bdsPath, 'bin');
    if (!fs.existsSync(binPath)) return null;

    const dcc32 = path.join(binPath, 'dcc32.exe');
    const dcc64 = path.join(binPath, 'dcc64.exe');

    return {
      version: name,
      bdsPath,
      binPath,
      dcc32Path: fs.existsSync(dcc32) ? dcc32 : undefined,
      dcc64Path: fs.existsSync(dcc64) ? dcc64 : undefined,
      msbuildPath: undefined
    };
  }
}
