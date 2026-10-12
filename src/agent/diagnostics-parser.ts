import type { BuildDiagnostic, DiagnosticSeverity } from '../common/types.ts';

/**
 * Parser de Linhas de Diagnóstico e Erros do Compilador Delphi (DCC32/DCC64/MSBuild)
 */
export class DiagnosticsParser {
  // Regex para múltiplos formatos de saída do Delphi
  // Formato: [dcc32 Error] Unit1.pas(42): E2003 Undeclared identifier: 'X'
  private static dccRegex = /\[dcc(?:32|64)\s+(Fatal|Error|Warning|Hint)\]\s+([^()]+)\((\d+)(?:,\s*(\d+))?\):\s+([EFW]\d+)?\s*(.*)/i;

  // Formato: Unit1.pas(42,15): error E2003: Undeclared identifier: 'X'
  private static msbuildRegex = /([^()]+)\((\d+)(?:,\s*(\d+))?\):\s*(fatal error|error|warning|hint)\s+([EFW]\d+)?\s*:\s*(.*)/i;

  // Formato: Unit1.pas(42) Error: E2003 Undeclared identifier: 'X'
  private static classicRegex = /([^()]+)\((\d+)(?:,\s*(\d+))?\)\s+(Fatal|Error|Warning|Hint):\s*([EFW]\d+)?\s*(.*)/i;

  public static parseLine(line: string): BuildDiagnostic | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    let match = trimmed.match(this.dccRegex);
    if (match) {
      return {
        severity: this.normalizeSeverity(match[1]),
        file: match[2].trim(),
        line: parseInt(match[3], 10),
        column: match[4] ? parseInt(match[4], 10) : 1,
        code: match[5] || 'E0000',
        message: match[6].trim(),
        rawText: trimmed
      };
    }

    match = trimmed.match(this.msbuildRegex);
    if (match) {
      return {
        file: match[1].trim(),
        line: parseInt(match[2], 10),
        column: match[3] ? parseInt(match[3], 10) : 1,
        severity: this.normalizeSeverity(match[4]),
        code: match[5] || 'E0000',
        message: match[6].trim(),
        rawText: trimmed
      };
    }

    match = trimmed.match(this.classicRegex);
    if (match) {
      return {
        file: match[1].trim(),
        line: parseInt(match[2], 10),
        column: match[3] ? parseInt(match[3], 10) : 1,
        severity: this.normalizeSeverity(match[4]),
        code: match[5] || 'E0000',
        message: match[6].trim(),
        rawText: trimmed
      };
    }

    return null;
  }

  private static normalizeSeverity(sevStr: string): DiagnosticSeverity {
    const lower = sevStr.toLowerCase();
    if (lower.includes('fatal')) return 'Fatal';
    if (lower.includes('error')) return 'Error';
    if (lower.includes('warning')) return 'Warning';
    if (lower.includes('hint')) return 'Hint';
    return 'Info';
  }
}
