import type * as monaco from 'monaco-editor';

/**
 * Definição da Gramática e Linguagem Object Pascal para Monaco Editor
 */
export const PASCAL_LANGUAGE_ID = 'delphi-pascal';

export const PASCAL_MONARCH_LANGUAGE: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.pascal',
  ignoreCase: true,

  keywords: [
    'program', 'unit', 'library', 'package', 'interface', 'implementation',
    'initialization', 'finalization', 'uses', 'type', 'var', 'const', 'resourcestring',
    'class', 'record', 'helper', 'constructor', 'destructor', 'procedure', 'function',
    'property', 'read', 'write', 'default', 'nodefault', 'stored', 'index',
    'override', 'virtual', 'dynamic', 'abstract', 'reintroduce', 'overload', 'inline',
    'published', 'public', 'protected', 'private', 'strict',
    'begin', 'end', 'if', 'then', 'else', 'case', 'of', 'for', 'to', 'downto', 'do',
    'while', 'repeat', 'until', 'try', 'finally', 'except', 'on', 'raise', 'with',
    'inherited', 'nil', 'true', 'false', 'and', 'or', 'not', 'xor', 'shl', 'shr',
    'div', 'mod', 'is', 'as', 'in', 'out', 'array', 'set', 'file', 'string', 'file of'
  ],

  typeKeywords: [
    'Integer', 'Cardinal', 'Int64', 'UInt64', 'SmallInt', 'Word', 'ShortInt', 'Byte',
    'Boolean', 'ByteBool', 'WordBool', 'LongBool',
    'Char', 'AnsiChar', 'WideChar', 'String', 'AnsiString', 'WideString', 'UnicodeString',
    'Single', 'Double', 'Extended', 'Comp', 'Currency',
    'TDateTime', 'TDate', 'TTime', 'Pointer', 'TObject', 'TClass', 'Exception'
  ],

  operators: [
    '=', '>', '<', '<=', '>=', '<>', ':=', '+', '-', '*', '/', '^', '@'
  ],

  symbols: /[=><:@\+\-\*\/^\.]+/,

  tokenizer: {
    root: [
      // Identificadores e palavras-chave
      [/[a-zA-Z_]\w*/, {
        cases: {
          '@keywords': 'keyword',
          '@typeKeywords': 'type',
          '@default': 'identifier'
        }
      }],

      // Diretivas de compilação: {$IFDEF ...}
      [/\{\$[a-zA-Z0-9_\s\*]*\}/, 'meta.directive'],

      // Comentários de chave: { ... }
      [/\{/, 'comment', '@comment_curly'],

      // Comentários de parênteses: (* ... *)
      [/\(\*/, 'comment', '@comment_paren'],

      // Comentários de linha dupla: //
      [/\/\/.*$/, 'comment'],

      // Delimitadores e operadores
      [/[{}()\[\]]/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': ''
        }
      }],

      // Números
      [/\$[0-9a-fA-F]+/, 'number.hex'],
      [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
      [/\d+/, 'number'],

      // Caracteres ASCII (#13, #10)
      [/#\d+/, 'string.escape'],
      [/#\$[0-9a-fA-F]+/, 'string.escape'],

      // Strings delimitadas por apóstrofos ('Texto')
      [/'([^'\\]|'')*'/, 'string']
    ],

    comment_curly: [
      [/[^}]+/, 'comment'],
      [/\}/, 'comment', '@pop']
    ],

    comment_paren: [
      [/[^*)]+/, 'comment'],
      [/\*\)/, 'comment', '@pop'],
      [/[*)]/, 'comment']
    ]
  }
};

export const PASCAL_CONFIGURATION: monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['{', '}']
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
    ['begin', 'end'],
    ['case', 'end'],
    ['record', 'end'],
    ['try', 'end']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: "'", close: "'", notIn: ['string', 'comment'] }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: "'", close: "'" }
  ],
  folding: {
    markers: {
      start: /\{\$REGION\b/i,
      end: /\{\$ENDREGION\b/i
    }
  }
};
