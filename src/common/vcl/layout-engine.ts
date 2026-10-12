import type { DFMObject, Rect, VCLAlign } from '../types.ts';

export interface ComputedLayout {
  name: string;
  className: string;
  bounds: Rect;
  align: VCLAlign;
  anchors: string[];
}

/**
 * Engine de Layout VCL do Delphi (Fiel ao algoritmo da VCL Win32)
 * Suporta Align (alTop, alBottom, alLeft, alRight, alClient) e Anchors
 */
export class VCLLayoutEngine {
  /**
   * Calcula as caixas delimitadoras finais dos filhos de um container
   */
  public static compute(container: DFMObject, containerWidth: number, containerHeight: number): Map<string, ComputedLayout> {
    const result = new Map<string, ComputedLayout>();

    let curLeft = 0;
    let curTop = 0;
    let curRight = containerWidth;
    let curBottom = containerHeight;

    const children = container.children || [];

    // Separar por alinhamento para processar na ordem VCL
    const topControls: DFMObject[] = [];
    const bottomControls: DFMObject[] = [];
    const leftControls: DFMObject[] = [];
    const rightControls: DFMObject[] = [];
    const clientControls: DFMObject[] = [];
    const noneControls: DFMObject[] = [];

    for (const child of children) {
      const align = (child.properties['Align'] as VCLAlign) || 'alNone';
      switch (align) {
        case 'alTop': topControls.push(child); break;
        case 'alBottom': bottomControls.push(child); break;
        case 'alLeft': leftControls.push(child); break;
        case 'alRight': rightControls.push(child); break;
        case 'alClient': clientControls.push(child); break;
        default: noneControls.push(child); break;
      }
    }

    // 1. Processa alTop
    for (const child of topControls) {
      const h = Number(child.properties['Height']) || 25;
      const bounds: Rect = {
        left: curLeft,
        top: curTop,
        width: curRight - curLeft,
        height: h
      };
      curTop += h;
      result.set(child.name, {
        name: child.name,
        className: child.className,
        bounds,
        align: 'alTop',
        anchors: ['akLeft', 'akTop', 'akRight']
      });
    }

    // 2. Processa alBottom
    for (const child of bottomControls) {
      const h = Number(child.properties['Height']) || 25;
      const bounds: Rect = {
        left: curLeft,
        top: curBottom - h,
        width: curRight - curLeft,
        height: h
      };
      curBottom -= h;
      result.set(child.name, {
        name: child.name,
        className: child.className,
        bounds,
        align: 'alBottom',
        anchors: ['akLeft', 'akRight', 'akBottom']
      });
    }

    // 3. Processa alLeft
    for (const child of leftControls) {
      const w = Number(child.properties['Width']) || 75;
      const bounds: Rect = {
        left: curLeft,
        top: curTop,
        width: w,
        height: Math.max(0, curBottom - curTop)
      };
      curLeft += w;
      result.set(child.name, {
        name: child.name,
        className: child.className,
        bounds,
        align: 'alLeft',
        anchors: ['akLeft', 'akTop', 'akBottom']
      });
    }

    // 4. Processa alRight
    for (const child of rightControls) {
      const w = Number(child.properties['Width']) || 75;
      const bounds: Rect = {
        left: curRight - w,
        top: curTop,
        width: w,
        height: Math.max(0, curBottom - curTop)
      };
      curRight -= w;
      result.set(child.name, {
        name: child.name,
        className: child.className,
        bounds,
        align: 'alRight',
        anchors: ['akTop', 'akRight', 'akBottom']
      });
    }

    // 5. Processa alClient (geralmente 1 controle, preenche a área central)
    for (const child of clientControls) {
      const bounds: Rect = {
        left: curLeft,
        top: curTop,
        width: Math.max(0, curRight - curLeft),
        height: Math.max(0, curBottom - curTop)
      };
      result.set(child.name, {
        name: child.name,
        className: child.className,
        bounds,
        align: 'alClient',
        anchors: ['akLeft', 'akTop', 'akRight', 'akBottom']
      });
    }

    // 6. Processa alNone com respeito a Anchors
    for (const child of noneControls) {
      const left = Number(child.properties['Left']) || 0;
      const top = Number(child.properties['Top']) || 0;
      const width = Number(child.properties['Width']) || 75;
      const height = Number(child.properties['Height']) || 25;
      const anchors = (child.properties['Anchors'] as string[]) || ['akLeft', 'akTop'];

      const bounds: Rect = {
        left,
        top,
        width,
        height
      };

      result.set(child.name, {
        name: child.name,
        className: child.className,
        bounds,
        align: 'alNone',
        anchors
      });
    }

    // Processamento recursivo para contêineres filhos (TPanel, TGroupBox, etc.)
    for (const child of children) {
      if (child.children && child.children.length > 0) {
        const parentLayout = result.get(child.name);
        const w = parentLayout ? parentLayout.bounds.width : (Number(child.properties['Width']) || 100);
        const h = parentLayout ? parentLayout.bounds.height : (Number(child.properties['Height']) || 100);
        const subLayouts = this.compute(child, w, h);
        for (const [subKey, subVal] of subLayouts.entries()) {
          result.set(subKey, subVal);
        }
      }
    }

    return result;
  }
}
