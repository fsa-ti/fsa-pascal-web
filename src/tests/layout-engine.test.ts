import test from 'node:test';
import assert from 'node:assert/strict';
import { VCLLayoutEngine } from '../common/vcl/layout-engine.ts';
import { snapToGrid, computeResizeRect } from '../common/vcl/geometry.ts';
import { VCLComponentRegistry } from '../common/vcl/components.ts';
import type { DFMObject } from '../common/types.ts';

test('VCLLayoutEngine deve calcular posições de alTop, alBottom e alClient corretamente', () => {
  const container: DFMObject = {
    name: 'Form1',
    className: 'TForm1',
    properties: { ClientWidth: 800, ClientHeight: 600 },
    rawProperties: {},
    children: [
      {
        name: 'HeaderPanel',
        className: 'TPanel',
        properties: { Align: 'alTop', Height: 60 },
        rawProperties: {},
        children: []
      },
      {
        name: 'FooterStatusBar',
        className: 'TStatusBar',
        properties: { Align: 'alBottom', Height: 30 },
        rawProperties: {},
        children: []
      },
      {
        name: 'MainMemo',
        className: 'TMemo',
        properties: { Align: 'alClient' },
        rawProperties: {},
        children: []
      }
    ]
  };

  const layout = VCLLayoutEngine.compute(container, 800, 600);

  // 1. HeaderPanel (alTop)
  const header = layout.get('HeaderPanel');
  assert.ok(header);
  assert.equal(header.bounds.left, 0);
  assert.equal(header.bounds.top, 0);
  assert.equal(header.bounds.width, 800);
  assert.equal(header.bounds.height, 60);

  // 2. FooterStatusBar (alBottom)
  const footer = layout.get('FooterStatusBar');
  assert.ok(footer);
  assert.equal(footer.bounds.left, 0);
  assert.equal(footer.bounds.top, 570); // 600 - 30
  assert.equal(footer.bounds.width, 800);
  assert.equal(footer.bounds.height, 30);

  // 3. MainMemo (alClient)
  const memo = layout.get('MainMemo');
  assert.ok(memo);
  assert.equal(memo.bounds.left, 0);
  assert.equal(memo.bounds.top, 60);
  assert.equal(memo.bounds.width, 800);
  assert.equal(memo.bounds.height, 510); // 600 - 60 - 30
});

test('VCLLayoutEngine deve processar recursivamente contêineres filhos aninhados (TPanel com botões)', () => {
  const container: DFMObject = {
    name: 'Form1',
    className: 'TForm1',
    properties: { ClientWidth: 800, ClientHeight: 600 },
    rawProperties: {},
    children: [
      {
        name: 'Panel1',
        className: 'TPanel',
        properties: { Left: 40, Top: 40, Width: 300, Height: 200, Align: 'alNone' },
        rawProperties: {},
        children: [
          {
            name: 'BtnInside',
            className: 'TButton',
            properties: { Left: 16, Top: 24, Width: 80, Height: 30, Align: 'alNone' },
            rawProperties: {},
            children: []
          }
        ]
      }
    ]
  };

  const layout = VCLLayoutEngine.compute(container, 800, 600);
  const panel = layout.get('Panel1');
  const btn = layout.get('BtnInside');

  assert.ok(panel);
  assert.equal(panel.bounds.left, 40);
  assert.equal(panel.bounds.top, 40);
  assert.equal(panel.bounds.width, 300);
  assert.equal(panel.bounds.height, 200);

  assert.ok(btn);
  assert.equal(btn.bounds.left, 16);
  assert.equal(btn.bounds.top, 24);
  assert.equal(btn.bounds.width, 80);
  assert.equal(btn.bounds.height, 30);
});

test('Geometria: snapToGrid deve alinhar no grid de 8px e respeitar bypass com Alt', () => {
  // Encaixe padrão no grid de 8px
  assert.equal(snapToGrid(0), 0);
  assert.equal(snapToGrid(7), 8);
  assert.equal(snapToGrid(12), 16);
  assert.equal(snapToGrid(25), 24);
  assert.equal(snapToGrid(101), 104);

  // Bypass desabilitado (segurando Alt)
  assert.equal(snapToGrid(13, 8, false), 13);
  assert.equal(snapToGrid(27, 8, false), 27);
});

test('Geometria: computeResizeRect deve redimensionar corretamente nas 8 alças com tamanho mínimo', () => {
  const orig = { left: 80, top: 80, width: 96, height: 64 };

  // 1. Alça Leste (East): aumenta width
  const east = computeResizeRect(orig, 'e', 24, 0, 8, true);
  assert.equal(east.width, 120); // 96 + 24
  assert.equal(east.left, 80);

  // 2. Alça Sul (South): aumenta height
  const south = computeResizeRect(orig, 's', 0, 16, 8, true);
  assert.equal(south.height, 80); // 64 + 16
  assert.equal(south.top, 80);

  // 3. Alça Oeste (West): move left e ajusta width
  const west = computeResizeRect(orig, 'w', -16, 0, 8, true);
  assert.equal(west.left, 64);
  assert.equal(west.width, 112); // 96 + 16

  // 4. Alça Norte (North): move top e ajusta height
  const north = computeResizeRect(orig, 'n', 0, -16, 8, true);
  assert.equal(north.top, 64);
  assert.equal(north.height, 80); // 64 + 16

  // 5. Alça Sudeste (South-East): ajusta width e height simultaneamente
  const se = computeResizeRect(orig, 'se', 16, 16, 8, true);
  assert.equal(se.width, 112);
  assert.equal(se.height, 80);

  // 6. Prevenção de dimensões menores que minSize (8px)
  const tiny = computeResizeRect(orig, 'e', -200, 0, 8, true, 8);
  assert.ok(tiny.width >= 8);
});

test('VCLComponentRegistry deve classificar corretamente componentes visuais vs não-visuais', () => {
  // Visuais
  assert.equal(VCLComponentRegistry.isNonVisual('TButton'), false);
  assert.equal(VCLComponentRegistry.isNonVisual('TEdit'), false);
  assert.equal(VCLComponentRegistry.isNonVisual('TPanel'), false);
  assert.equal(VCLComponentRegistry.isNonVisual('TDBGrid'), false);

  // Não-Visuais
  assert.equal(VCLComponentRegistry.isNonVisual('TTimer'), true);
  assert.equal(VCLComponentRegistry.isNonVisual('TOpenDialog'), true);
  assert.equal(VCLComponentRegistry.isNonVisual('TSaveDialog'), true);
  assert.equal(VCLComponentRegistry.isNonVisual('TDataSource'), true);
  assert.equal(VCLComponentRegistry.isNonVisual('TACBrNFe'), true);
});
