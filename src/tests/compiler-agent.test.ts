import test from 'node:test';
import assert from 'node:assert/strict';
import { DiagnosticsParser } from '../agent/diagnostics-parser.ts';
import { FallbackPascalCompiler } from '../agent/fallback-compiler.ts';
import type { BuildParams } from '../common/types.ts';

test('DiagnosticsParser deve analisar corretamente saídas padrão do DCC32', () => {
  const line = "[dcc32 Error] ufrmPrincipal.pas(42,15): E2003 Undeclared identifier: 'TBloco'";
  const diag = DiagnosticsParser.parseLine(line);

  assert.ok(diag);
  assert.equal(diag.file, 'ufrmPrincipal.pas');
  assert.equal(diag.line, 42);
  assert.equal(diag.column, 15);
  assert.equal(diag.severity, 'Error');
  assert.equal(diag.code, 'E2003');
  assert.equal(diag.message, "Undeclared identifier: 'TBloco'");
});

test('DiagnosticsParser deve analisar saídas no formato MSBuild', () => {
  const line = "src\\uService.pas(10,5): error E2029: ';' expected but 'begin' found";
  const diag = DiagnosticsParser.parseLine(line);

  assert.ok(diag);
  assert.equal(diag.file, 'src\\uService.pas');
  assert.equal(diag.line, 10);
  assert.equal(diag.column, 5);
  assert.equal(diag.severity, 'Error');
  assert.equal(diag.code, 'E2029');
});

test('FallbackPascalCompiler deve detectar atribuição incorreta com operador =', () => {
  const compiler = new FallbackPascalCompiler();
  const invalidUnit = `unit uTeste;
interface
implementation
procedure Executar;
var
  X: Integer;
begin
  X = 10;
end;
end.`;

  const params: BuildParams = {
    buildId: 'test_bld_1',
    projectFilePath: 'Projeto.dpr',
    target: 'Build',
    platform: 'Win32',
    config: 'Debug',
    files: [
      { relativePath: 'uTeste.pas', content: invalidUnit }
    ]
  };

  const result = compiler.compile(params);
  assert.equal(result.status, 'Failed');
  assert.ok(result.errorCount > 0);
  assert.ok(result.diagnostics.some(d => d.code === 'E2066'));
});

test('FallbackPascalCompiler deve compilar projeto válido e gerar executável PE', () => {
  const compiler = new FallbackPascalCompiler();
  const validDpr = `program TesteApp;
uses
  Vcl.Forms,
  uMain in 'uMain.pas';
begin
  Application.Initialize;
end.`;

  const validPas = `unit uMain;
interface
implementation
end.`;

  const validDfm = `object Form1: TForm1
  Caption = 'Form1'
end`;

  const params: BuildParams = {
    buildId: 'test_bld_2',
    projectFilePath: 'TesteApp.dpr',
    target: 'Build',
    platform: 'Win32',
    config: 'Release',
    files: [
      { relativePath: 'TesteApp.dpr', content: validDpr },
      { relativePath: 'uMain.pas', content: validPas },
      { relativePath: 'uMain.dfm', content: validDfm }
    ]
  };

  const result = compiler.compile(params);
  assert.equal(result.status, 'Success');
  assert.equal(result.errorCount, 0);
  assert.ok(result.artifacts.length >= 2);
  assert.ok(result.artifacts.some(a => a.fileName === 'TesteApp.exe'));
  assert.ok(result.artifacts.some(a => a.fileName === 'TesteApp.map'));
});
