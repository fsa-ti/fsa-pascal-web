import type { Rect } from '../types.ts';

export type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

/**
 * Arredonda para múltiplo do grid (padrão 8px)
 */
export function snapToGrid(val: number, gridSize: number = 8, enabled: boolean = true): number {
  if (!enabled || gridSize <= 1) return Math.round(val);
  return Math.round(val / gridSize) * gridSize;
}

/**
 * Calcula novo retângulo a partir de um arraste em uma das 8 alças
 */
export function computeResizeRect(
  orig: Rect,
  handle: ResizeHandleType,
  dx: number,
  dy: number,
  gridSize: number = 8,
  useSnap: boolean = true,
  minSize: number = 8
): Rect {
  let left = orig.left;
  let top = orig.top;
  let width = orig.width;
  let height = orig.height;

  // Leste / Oeste (Eixo X)
  if (handle === 'e' || handle === 'ne' || handle === 'se') {
    width = Math.max(minSize, snapToGrid(orig.width + dx, gridSize, useSnap));
  } else if (handle === 'w' || handle === 'nw' || handle === 'sw') {
    const rawLeft = orig.left + dx;
    const snappedLeft = snapToGrid(rawLeft, gridSize, useSnap);
    const newWidth = orig.width + (orig.left - snappedLeft);
    if (newWidth >= minSize) {
      left = snappedLeft;
      width = newWidth;
    }
  }

  // Norte / Sul (Eixo Y)
  if (handle === 's' || handle === 'se' || handle === 'sw') {
    height = Math.max(minSize, snapToGrid(orig.height + dy, gridSize, useSnap));
  } else if (handle === 'n' || handle === 'ne' || handle === 'nw') {
    const rawTop = orig.top + dy;
    const snappedTop = snapToGrid(rawTop, gridSize, useSnap);
    const newHeight = orig.height + (orig.top - snappedTop);
    if (newHeight >= minSize) {
      top = snappedTop;
      height = newHeight;
    }
  }

  return { left, top, width, height };
}
