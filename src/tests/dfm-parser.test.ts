import test from 'node:test';
import assert from 'node:assert/strict';
import { DFMParser, DFMSerializer } from '../common/dfm/dfm-parser.ts';

test('DFMParser deve processar formulário Delphi com objetos aninhados', () => {
  const sampleDfm = `object Form1: TForm1
  Left = 100
  Top = 50
  Caption = 'Janela de Teste'
  ClientWidth = 600
  ClientHeight = 400
  object Button1: TButton
    Left = 10
    Top = 20
    Width = 80
    Height = 30
    Caption = 'Salvar'
    TabOrder = 0
    OnClick = Button1Click
  end
  object Panel1: TPanel
    Left = 0
    Top = 0
    Width = 600
    Height = 40
    Align = alTop
  end
end`;

  const parser = new DFMParser();
  const ast = parser.parse(sampleDfm);

  assert.equal(ast.name, 'Form1');
  assert.equal(ast.className, 'TForm1');
  assert.equal(ast.properties.Caption, 'Janela de Teste');
  assert.equal(ast.properties.ClientWidth, 600);
  assert.equal(ast.properties.ClientHeight, 400);
  assert.equal(ast.children.length, 2);

  const btn = ast.children[0];
  assert.equal(btn.name, 'Button1');
  assert.equal(btn.className, 'TButton');
  assert.equal(btn.properties.Caption, 'Salvar');
  assert.equal(btn.properties.OnClick, 'Button1Click');

  const pnl = ast.children[1];
  assert.equal(pnl.name, 'Panel1');
  assert.equal(pnl.properties.Align, 'alTop');
});

test('DFMSerializer deve serializar AST de volta preservando propriedades e estrutura', () => {
  const parser = new DFMParser();
  const serializer = new DFMSerializer();

  const originalDfm = `object frmCad: TfrmCad
  Caption = 'Cadastro'
  Color = clBtnFace
  object btnOK: TButton
    Left = 100
    Top = 50
    Width = 75
    Height = 25
    Caption = 'OK'
  end
end`;

  const ast = parser.parse(originalDfm);
  const serialized = serializer.serialize(ast);

  assert.ok(serialized.includes('object frmCad: TfrmCad'));
  assert.ok(serialized.includes("Caption = 'Cadastro'"));
  assert.ok(serialized.includes('object btnOK: TButton'));
  assert.ok(serialized.includes('Left = 100'));
  assert.ok(serialized.includes('Top = 50'));
  assert.ok(serialized.includes('end'));
});

test('DFMParser deve ser tolerante e lossless a propriedades de terceiros', () => {
  const sampleWithCustom = `object frmPrincipal: TfrmPrincipal
  PropriedadeDesconhecida = 12345
  object cxGrid1: TcxGrid
    Left = 0
    Top = 0
    CustomSkinName = 'Black'
  end
end`;

  const parser = new DFMParser();
  const ast = parser.parse(sampleWithCustom);

  assert.equal(ast.properties.PropriedadeDesconhecida, 12345);
  const cxGrid = ast.children[0];
  assert.equal(cxGrid.className, 'TcxGrid');
  assert.equal(cxGrid.properties.CustomSkinName, 'Black');
});
