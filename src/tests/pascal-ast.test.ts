import test from 'node:test';
import assert from 'node:assert/strict';
import { PascalUnitManager } from '../common/pascal-ast/unit-ast.ts';

const SAMPLE_UNIT = `unit ufrmTeste;

interface

uses
  System.SysUtils, Vcl.Forms, Vcl.StdCtrls;

type
  TfrmTeste = class(TForm)
    lblTitulo: TLabel;
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  frmTeste: TfrmTeste;

implementation

{$R *.dfm}

end.
`;

test('PascalUnitManager deve injetar declaração de componente na seção published', () => {
  const result = PascalUnitManager.injectComponent(SAMPLE_UNIT, 'TfrmTeste', 'btnSalvar', 'TButton');
  assert.ok(result.includes('btnSalvar: TButton;'));
});

test('PascalUnitManager deve injetar evento OnClick na classe e seu corpo em implementation', () => {
  const { updatedContent, methodName } = PascalUnitManager.injectEventHandler(
    SAMPLE_UNIT,
    'TfrmTeste',
    'btnSalvarClick'
  );

  assert.equal(methodName, 'btnSalvarClick');
  assert.ok(updatedContent.includes('procedure btnSalvarClick(Sender: TObject);'));
  assert.ok(updatedContent.includes('procedure TfrmTeste.btnSalvarClick(Sender: TObject);\r\nbegin\r\n\r\nend;'));
});

test('PascalUnitManager deve completar classes (Ctrl+Shift+C) gerando métodos faltantes', () => {
  const unitWithMissingMethod = `unit uCalculo;

interface

type
  TCalculadora = class
  public
    function Somar(A, B: Integer): Integer;
  end;

implementation

end.`;

  const { updatedContent, addedMethods, firstTargetLine } = PascalUnitManager.completeClasses(unitWithMissingMethod, 'TCalculadora');

  assert.equal(addedMethods.length, 1);
  assert.equal(addedMethods[0], 'Somar');
  assert.ok(updatedContent.includes('function TCalculadora.Somar(A, B: Integer): Integer;\r\nbegin\r\n\r\nend;'));
  assert.ok(firstTargetLine && firstTargetLine > 0);
});

test('PascalUnitManager deve autodescobrir múltiplas classes na unit sem formClassName explícito', () => {
  const multiClassUnit = `unit uMulti;

interface

type
  TBaseService = class
  public
    procedure Executar; virtual; abstract;
    function ObterStatus: Boolean;
  end;

  TFoo = class(TBaseService)
  private
    procedure Processar(const ID: Integer);
  end;

implementation

end.`;

  const { updatedContent, addedMethods } = PascalUnitManager.completeClasses(multiClassUnit);

  // Executar deve ser ignorado pois é abstract
  assert.ok(!addedMethods.includes('Executar'));
  assert.ok(addedMethods.includes('ObterStatus'));
  assert.ok(addedMethods.includes('Processar'));
  assert.ok(updatedContent.includes('function TBaseService.ObterStatus: Boolean;\r\nbegin\r\n\r\nend;'));
  assert.ok(updatedContent.includes('procedure TFoo.Processar(const ID: Integer);\r\nbegin\r\n\r\nend;'));
});

test('PascalUnitManager deve gerar templates de unit padrão e Form VCL', () => {
  // 1. Unit padrão
  const standard = PascalUnitManager.generateUnitTemplate('uClienteService', false);
  assert.ok(standard.pasContent.includes('unit uClienteService;'));
  assert.ok(standard.pasContent.includes('TClienteService = class'));
  assert.equal(standard.dfmContent, undefined);

  // 2. Form VCL com DFM
  const formUnit = PascalUnitManager.generateUnitTemplate('ufrmCadastro', true, 'frmCadastro', 'TfrmCadastro');
  assert.ok(formUnit.pasContent.includes('unit ufrmCadastro;'));
  assert.ok(formUnit.pasContent.includes('TfrmCadastro = class(TForm)'));
  assert.ok(formUnit.pasContent.includes('{$R *.dfm}'));
  assert.ok(formUnit.dfmContent);
  assert.ok(formUnit.dfmContent.includes('object frmCadastro: TfrmCadastro'));
});

test('PascalUnitManager deve injetar nova unit na cláusula uses do .DPR', () => {
  const sampleDpr = `program Teste;

uses
  Vcl.Forms,
  ufrmPrincipal in 'src\\ufrmPrincipal.pas' {frmPrincipal};

begin
end.`;

  const updatedDpr = PascalUnitManager.injectUnitIntoDpr(
    sampleDpr,
    'uClienteService',
    'src/services/uClienteService.pas'
  );

  assert.ok(updatedDpr.includes("uClienteService in 'src\\services\\uClienteService.pas',"));
});

test('PascalUnitManager deve renomear unit no cabeçalho do código e no .DPR', () => {
  const code = `unit uAntigo;\r\ninterface\r\nimplementation\r\nend.`;
  const renamedCode = PascalUnitManager.renameUnitInContent(code, 'uNovo');
  assert.ok(renamedCode.startsWith('unit uNovo;'));

  const dpr = `uses uAntigo in 'src\\uAntigo.pas';`;
  const renamedDpr = PascalUnitManager.renameUnitInDpr(dpr, 'uAntigo', 'uNovo', 'src/uNovo.pas');
  assert.equal(renamedDpr, `uses uNovo in 'src\\uNovo.pas';`);
});
