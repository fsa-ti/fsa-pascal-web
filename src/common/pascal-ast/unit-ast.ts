/**
 * Manipulador de AST e Sincronização de Código Object Pascal (.pas)
 * Gerencia a seção published e implementação de eventos
 */
export class PascalUnitManager {
  /**
   * Injeta a declaração de um componente na seção published da classe do formulário
   */
  public static injectComponent(unitContent: string, formClassName: string, compName: string, compClassName: string): string {
    // Verificar se já existe a declaração
    const compRegex = new RegExp(`\\b${compName}\\s*:\\s*${compClassName}\\s*;`, 'i');
    if (compRegex.test(unitContent)) {
      return unitContent;
    }

    // Localizar a definição da classe: TForm1 = class(TForm)
    const classDefRegex = new RegExp(`(${formClassName}\\s*=\\s*class(?:\\s*\\([^)]*\\))?)`, 'i');
    const match = unitContent.match(classDefRegex);
    if (!match || match.index === undefined) {
      return unitContent;
    }

    const insertPos = match.index + match[0].length;
    const declaration = `\r\n    ${compName}: ${compClassName};`;

    return unitContent.slice(0, insertPos) + declaration + unitContent.slice(insertPos);
  }

  /**
   * Remove a declaração de um componente da classe
   */
  public static removeComponent(unitContent: string, compName: string): string {
    const compLineRegex = new RegExp(`^[ \\t]*${compName}\\s*:\\s*[A-Za-z0-9_]+\\s*;[ \\t]*\\r?\\n`, 'gim');
    return unitContent.replace(compLineRegex, '');
  }

  /**
   * Injeta declaração de manipulador de evento e o corpo na seção implementation
   */
  public static injectEventHandler(
    unitContent: string,
    formClassName: string,
    methodName: string,
    signature: string = 'procedure (Sender: TObject)'
  ): { updatedContent: string; methodName: string } {
    // Parametrização da assinatura: "procedure Button1Click(Sender: TObject);"
    const cleanSig = signature.replace(/^procedure\s*/i, '').trim();
    const declString = `procedure ${methodName}${cleanSig.startsWith('(') ? cleanSig : `(${cleanSig}`};`;

    let updated = unitContent;

    // 1. Inserir declaração na classe se ainda não existir
    const methodDeclRegex = new RegExp(`procedure\\s+${methodName}\\b`, 'i');
    if (!methodDeclRegex.test(updated)) {
      const classDefRegex = new RegExp(`(${formClassName}\\s*=\\s*class(?:\\s*\\([^)]*\\))?[\\s\\S]*?)(private|public|protected|end)`, 'i');
      const match = updated.match(classDefRegex);
      if (match && match.index !== undefined) {
        const headerAndProps = match[1];
        const sectionKeyword = match[2];
        const insertIndex = match.index + headerAndProps.length;
        updated = updated.slice(0, insertIndex) + `    ${declString}\r\n  ` + sectionKeyword + updated.slice(insertIndex + sectionKeyword.length);
      }
    }

    // 2. Inserir corpo do método na seção implementation se não existir
    const implBodyRegex = new RegExp(`procedure\\s+${formClassName}\\.${methodName}\\b`, 'i');
    if (!implBodyRegex.test(updated)) {
      const implRegex = /\bimplementation\b/i;
      const implMatch = updated.match(implRegex);
      if (implMatch && implMatch.index !== undefined) {
        const insertIndex = implMatch.index + implMatch[0].length;
        const methodBody = `\r\n\r\nprocedure ${formClassName}.${methodName}(Sender: TObject);\r\nbegin\r\n\r\nend;\r\n`;
        updated = updated.slice(0, insertIndex) + methodBody + updated.slice(insertIndex);
      }
    }

    return { updatedContent: updated, methodName };
  }

  /**
   * Implementa o atalho clássico Ctrl+Shift+C (Class Completion) do Delphi RAD Studio.
   * Encontra métodos declarados nas classes da seção interface e cria suas implementações se faltarem.
   */
  public static completeClasses(
    unitContent: string,
    formClassName?: string
  ): { updatedContent: string; addedMethods: string[]; firstTargetLine?: number } {
    const addedMethods: string[] = [];

    // 1. Isolar seções interface e implementation
    const implIndex = unitContent.search(/\bimplementation\b/i);
    if (implIndex === -1) {
      return { updatedContent: unitContent, addedMethods };
    }

    const interfaceContent = unitContent.substring(0, implIndex);
    const implementationContent = unitContent.substring(implIndex);

    // 2. Extrair classes declaradas na interface: TClasse = class(...) ... end;
    const classDefRegex = /([A-Za-z0-9_]+)\s*=\s*class\b(?:\s*\([^)]*\))?([\s\S]*?)end;/gi;
    const classesToProcess: { className: string; classBody: string }[] = [];

    let classMatch: RegExpExecArray | null;
    while ((classMatch = classDefRegex.exec(interfaceContent)) !== null) {
      const cName = classMatch[1];
      const cBody = classMatch[2];
      if (!formClassName || cName.toLowerCase() === formClassName.toLowerCase()) {
        classesToProcess.push({ className: cName, classBody: cBody });
      }
    }

    // Se uma classe específica foi solicitada mas não achou, processar todas as classes da unit
    if (classesToProcess.length === 0) {
      classDefRegex.lastIndex = 0;
      while ((classMatch = classDefRegex.exec(interfaceContent)) !== null) {
        classesToProcess.push({ className: classMatch[1], classBody: classMatch[2] });
      }
    }

    if (classesToProcess.length === 0) {
      return { updatedContent: unitContent, addedMethods };
    }

    let newImplementations = '';
    const methodRegex = /(?:(class\s+)?(procedure|function))\s+([A-Za-z0-9_]+)\s*(\([^)]*\))?(?:\s*:\s*([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)?))?\s*;((?:\s*(?:virtual|abstract|override|overload|reintroduce|dynamic|static|inline|stdcall|cdecl|safecall|message\s+[A-Za-z0-9_]+)\s*;)*)/gi;

    for (const { className, classBody } of classesToProcess) {
      let match: RegExpExecArray | null;
      methodRegex.lastIndex = 0;

      while ((match = methodRegex.exec(classBody)) !== null) {
        const isClassMethod = !!match[1];
        const isFunction = match[2].toLowerCase() === 'function';
        const methodName = match[3];
        const params = match[4] || '';
        const returnType = match[5] ? `: ${match[5]}` : '';
        const directives = match[6] ? match[6].toLowerCase() : '';

        // Ignorar métodos puramente abstratos (não devem possuir corpo na implementação)
        if (directives.includes('abstract')) {
          continue;
        }

        // Verificar se já está implementado na seção implementation
        const implCheck = new RegExp(`(?:class\\s+)?(?:procedure|function)\\s+${className}\\.${methodName}\\b`, 'i');
        if (!implCheck.test(implementationContent) && !newImplementations.includes(`${className}.${methodName}`)) {
          addedMethods.push(methodName);
          const prefix = isClassMethod ? 'class ' : '';
          if (isFunction) {
            newImplementations += `\r\n${prefix}function ${className}.${methodName}${params}${returnType};\r\nbegin\r\n\r\nend;\r\n`;
          } else {
            newImplementations += `\r\n${prefix}procedure ${className}.${methodName}${params};\r\nbegin\r\n\r\nend;\r\n`;
          }
        }
      }
    }

    if (!newImplementations) {
      return { updatedContent: unitContent, addedMethods };
    }

    // 3. Inserir antes de initialization, finalization ou end. no final da unit
    const endDotRegex = /\b(initialization|finalization|end\.)\s*$/im;
    const endDotMatch = unitContent.match(endDotRegex);
    let updatedContent = unitContent;
    let insertionIndex = unitContent.length;

    if (endDotMatch && endDotMatch.index !== undefined) {
      insertionIndex = endDotMatch.index;
      updatedContent = unitContent.slice(0, insertionIndex) + newImplementations + '\r\n' + unitContent.slice(insertionIndex);
    } else {
      updatedContent += newImplementations;
    }

    // Calcular linha do primeiro método adicionado para salto do cursor
    const linesBefore = unitContent.slice(0, insertionIndex).split(/\r?\n/).length;
    const firstTargetLine = linesBefore + 3;

    return { updatedContent, addedMethods, firstTargetLine };
  }

  /**
   * Gera o esqueleto padrão de uma unit Pascal ou Form VCL
   */
  public static generateUnitTemplate(
    unitName: string,
    isForm: boolean,
    formName?: string,
    formClassName?: string
  ): { pasContent: string; dfmContent?: string } {
    const fName = formName || (unitName.startsWith('u') ? unitName.substring(1) : unitName);
    const fClass = formClassName || (fName.startsWith('T') ? fName : `T${fName}`);

    if (isForm) {
      const pasContent = `unit ${unitName};\r\n\r\ninterface\r\n\r\nuses\r\n  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants, System.Classes, Vcl.Graphics,\r\n  Vcl.Controls, Vcl.Forms, Vcl.Dialogs;\r\n\r\ntype\r\n  ${fClass} = class(TForm)\r\n  private\r\n    { Private declarations }\r\n  public\r\n    { Public declarations }\r\n  end;\r\n\r\nvar\r\n  ${fName}: ${fClass};\r\n\r\nimplementation\r\n\r\n{$R *.dfm}\r\n\r\nend.\r\n`;

      const dfmContent = `object ${fName}: ${fClass}\r\n  Left = 0\r\n  Top = 0\r\n  Caption = '${fName}'\r\n  ClientHeight = 440\r\n  ClientWidth = 640\r\n  Color = clBtnFace\r\n  Font.Charset = DEFAULT_CHARSET\r\n  Font.Color = clWindowText\r\n  Font.Height = -12\r\n  Font.Name = 'Segoe UI'\r\n  Font.Style = []\r\n  TextHeight = 15\r\nend\r\n`;
      return { pasContent, dfmContent };
    } else {
      const className = unitName.startsWith('u') ? unitName.substring(1) : unitName;
      const pasContent = `unit ${unitName};\r\n\r\ninterface\r\n\r\nuses\r\n  System.SysUtils, System.Classes;\r\n\r\ntype\r\n  T${className} = class\r\n  private\r\n    { Private declarations }\r\n  public\r\n    { Public declarations }\r\n  end;\r\n\r\nimplementation\r\n\r\nend.\r\n`;
      return { pasContent };
    }
  }

  /**
   * Injeta uma unit na cláusula uses do arquivo .dpr
   */
  public static injectUnitIntoDpr(
    dprContent: string,
    unitName: string,
    unitRelPath: string,
    formName?: string
  ): string {
    const normalizedPath = unitRelPath.replace(/\//g, '\\');
    const entry = formName
      ? `  ${unitName} in '${normalizedPath}' {${formName}},`
      : `  ${unitName} in '${normalizedPath}',`;

    const usesRegex = /\buses\b([\s\S]*?);/i;
    const match = dprContent.match(usesRegex);
    if (!match || match.index === undefined) {
      return dprContent;
    }

    const usesBlock = match[0];
    const semiPos = match.index + usesBlock.length - 1;

    return dprContent.slice(0, semiPos) + `\r\n${entry}` + dprContent.slice(semiPos);
  }

  /**
   * Renomeia a declaração de unit no cabeçalho do arquivo .pas
   */
  public static renameUnitInContent(unitContent: string, newUnitName: string): string {
    return unitContent.replace(/^unit\s+[A-Za-z0-9_]+\s*;/im, `unit ${newUnitName};`);
  }

  /**
   * Atualiza referências a uma unit no arquivo .dpr
   */
  public static renameUnitInDpr(
    dprContent: string,
    oldUnitName: string,
    newUnitName: string,
    newRelPath: string
  ): string {
    const normalizedPath = newRelPath.replace(/\//g, '\\');
    const regex = new RegExp(`\\b${oldUnitName}\\s+in\\s+['"][^'"]*['"]`, 'gim');
    return dprContent.replace(regex, `${newUnitName} in '${normalizedPath}'`);
  }
}
