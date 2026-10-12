import type { DFMObject } from '../types.ts';

/**
 * Parser de DFM (Delphi Form File) - Formato Texto
 * Suporta objetos aninhados, propriedades complexas e preservação estrita (lossless)
 */
export class DFMParser {
  private lines: string[] = [];
  private index: number = 0;

  public parse(dfmText: string): DFMObject {
    this.lines = dfmText.split(/\r?\n/);
    this.index = 0;

    // Pular linhas vazias iniciais
    while (this.index < this.lines.length && !this.lines[this.index].trim()) {
      this.index++;
    }

    if (this.index >= this.lines.length) {
      throw new Error('Arquivo DFM vazio');
    }

    const firstLine = this.lines[this.index].trim();
    if (!firstLine.startsWith('object ') && !firstLine.startsWith('inherited ') && !firstLine.startsWith('inline ')) {
      throw new Error(`DFM inválido: esperado início com 'object', 'inherited' ou 'inline', encontrado: "${firstLine}"`);
    }

    return this.parseObject();
  }

  private parseObject(): DFMObject {
    const headerLine = this.lines[this.index].trim();
    this.index++;

    // Expressão: object Name: TClassName ou object TClassName
    const match = headerLine.match(/^(object|inherited|inline)\s+([A-Za-z0-9_]+)?(?:\s*:\s*([A-Za-z0-9_]+))?/);
    if (!match) {
      throw new Error(`Cabeçalho de objeto inválido na linha ${this.index}: ${headerLine}`);
    }

    const keyword = match[1];
    let name = match[2] || '';
    let className = match[3] || '';

    // Se veio sem os dois pontos (ex: "object Form1")
    if (!className && name) {
      className = name;
      name = '';
    }

    const obj: DFMObject = {
      name,
      className,
      isInherited: keyword === 'inherited',
      isInline: keyword === 'inline',
      properties: {},
      rawProperties: {},
      children: []
    };

    while (this.index < this.lines.length) {
      const line = this.lines[this.index];
      const trimmed = line.trim();

      if (!trimmed) {
        this.index++;
        continue;
      }

      if (trimmed === 'end') {
        this.index++;
        return obj;
      }

      if (trimmed.startsWith('object ') || trimmed.startsWith('inherited ') || trimmed.startsWith('inline ')) {
        const child = this.parseObject();
        obj.children.push(child);
        continue;
      }

      // Propriedade regular: PropName = Value
      this.parseProperty(trimmed, obj);
      this.index++;
    }

    return obj;
  }

  private parseProperty(line: string, obj: DFMObject): void {
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) {
      // Propriedade sem igual (ex: tags binárias ou flags)
      obj.rawProperties[line] = '';
      return;
    }

    const propName = line.substring(0, eqIdx).trim();
    let propValStr = line.substring(eqIdx + 1).trim();

    // Se a propriedade é multiline (ex: Strings = ('a', 'b') ou dados binários em chaves {})
    if (propValStr.startsWith('(') && !propValStr.endsWith(')')) {
      const fullVal: string[] = [propValStr];
      while (this.index + 1 < this.lines.length) {
        this.index++;
        const nextLine = this.lines[this.index].trim();
        fullVal.push(nextLine);
        if (nextLine.endsWith(')')) break;
      }
      propValStr = fullVal.join('\n');
    } else if (propValStr.startsWith('{') && !propValStr.endsWith('}')) {
      const fullVal: string[] = [propValStr];
      while (this.index + 1 < this.lines.length) {
        this.index++;
        const nextLine = this.lines[this.index].trim();
        fullVal.push(nextLine);
        if (nextLine.endsWith('}')) break;
      }
      propValStr = fullVal.join('\n');
    }

    obj.rawProperties[propName] = propValStr;
    obj.properties[propName] = this.parsePropertyValue(propValStr);
  }

  private parsePropertyValue(valStr: string): any {
    // Strings delimitadas por apóstrofos: 'Texto'
    if (valStr.startsWith("'") && valStr.endsWith("'")) {
      return valStr.slice(1, -1).replace(/''/g, "'");
    }

    // Booleans
    if (valStr.toLowerCase() === 'true') return true;
    if (valStr.toLowerCase() === 'false') return false;

    // Números inteiros ou floats
    if (/^-?\d+$/.test(valStr)) return parseInt(valStr, 10);
    if (/^-?\d+\.\d+$/.test(valStr)) return parseFloat(valStr);

    // Conjuntos de enums: [akLeft, akTop]
    if (valStr.startsWith('[') && valStr.endsWith(']')) {
      return valStr
        .slice(1, -1)
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    // Listas: ('Item 1', 'Item 2')
    if (valStr.startsWith('(') && valStr.endsWith(')')) {
      return valStr
        .slice(1, -1)
        .split('\n')
        .map(s => s.trim().replace(/^'|'$/g, ''))
        .filter(Boolean);
    }

    // Identificadores / Enums / Nomes de evento: alClient, Button1Click, clBtnFace
    return valStr;
  }
}

/**
 * Serializador de DFM: Converte a DFMObject AST de volta para formato texto Delphi fidedigno
 */
export class DFMSerializer {
  public serialize(root: DFMObject, indentLevel: number = 0): string {
    const indent = '  '.repeat(indentLevel);
    const prefix = root.isInherited ? 'inherited' : root.isInline ? 'inline' : 'object';
    const header = root.name ? `${prefix} ${root.name}: ${root.className}` : `${prefix} ${root.className}`;

    const lines: string[] = [];
    lines.push(`${indent}${header}`);

    // Propriedades ordenadas
    const propKeys = Object.keys(root.properties);
    for (const key of propKeys) {
      const val = root.properties[key];
      const serializedVal = this.serializeValue(key, val, root.rawProperties[key]);
      lines.push(`${indent}  ${key} = ${serializedVal}`);
    }

    // Filhos
    for (const child of root.children) {
      lines.push(this.serialize(child, indentLevel + 1));
    }

    lines.push(`${indent}end`);
    return lines.join('\r\n');
  }

  private serializeValue(propKey: string, val: any, rawFallback?: string): string {
    if (rawFallback !== undefined && typeof val === 'object' && !Array.isArray(val)) {
      return rawFallback;
    }

    if (typeof val === 'string') {
      // Se no DFM original veio entre apóstrofos
      if (rawFallback && rawFallback.startsWith("'") && rawFallback.endsWith("'")) {
        return `'${val.replace(/'/g, "''")}'`;
      }

      // Propriedades notórias de texto sempre usam apóstrofos
      const textProps = ['caption', 'text', 'hint', 'simpletext', 'title', 'filter'];
      if (textProps.includes(propKey.toLowerCase())) {
        return `'${val.replace(/'/g, "''")}'`;
      }

      // Identificadores de enums ou eventos Delphi (ex: alClient, clBtnFace, Button1Click)
      if (/^(al|cl|ak|bv|bk|cs|po|ss|fs|st|dm|mb)[A-Za-z0-9_]/i.test(val) || /[A-Za-z0-9_]+(Click|Change|Create|Show|Destroy)$/i.test(val)) {
        return val;
      }

      // Se tiver espaços ou caracteres especiais
      if (/[^A-Za-z0-9_]/.test(val)) {
        return `'${val.replace(/'/g, "''")}'`;
      }

      return `'${val.replace(/'/g, "''")}'`;
    }

    if (typeof val === 'boolean') {
      return val ? 'True' : 'False';
    }

    if (typeof val === 'number') {
      return val.toString();
    }

    if (Array.isArray(val)) {
      // Se for conjunto de anchors [akLeft, akTop]
      if (val.length === 0 || typeof val[0] === 'string' && val[0].startsWith('ak')) {
        return `[${val.join(', ')}]`;
      }
      // Se for lista de strings
      const items = val.map(item => `    '${String(item).replace(/'/g, "''")}'`).join('\r\n');
      return `(\r\n${items}\r\n  )`;
    }

    return rawFallback || String(val);
  }
}
