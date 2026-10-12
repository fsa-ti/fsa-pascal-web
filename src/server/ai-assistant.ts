export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AICodeSuggestion {
  text: string;
  codeSnippet?: string;
  suggestedUnitName?: string;
}

/**
 * Assistente de Código Delphi / Object Pascal Especializado
 */
export class AIAssistantService {
  public static async answer(prompt: string, contextUnit?: string): Promise<AICodeSuggestion> {
    const lower = prompt.toLowerCase();

    // 1. Geração de código REST / JSON
    if (lower.includes('rest') || lower.includes('json') || lower.includes('api')) {
      return {
        text: 'Aqui está uma rotina moderna e idiomática em Object Pascal utilizando TRESTClient, TRESTRequest e processamento seguro com try..finally:',
        codeSnippet: `procedure ConsultarApiCliente(const AIdCliente: Integer);
var
  LClient: TRESTClient;
  LRequest: TRESTRequest;
  LResponse: TRESTResponse;
  LJsonObj: TJSONObject;
begin
  LClient := TRESTClient.Create('https://api.exemplo.com.br');
  LRequest := TRESTRequest.Create(nil);
  LResponse := TRESTResponse.Create(nil);
  try
    LRequest.Client := LClient;
    LRequest.Response := LResponse;
    LRequest.Method := rmGET;
    LRequest.Resource := Format('clientes/%d', [AIdCliente]);
    LRequest.Execute;

    if LResponse.StatusCode = 200 then
    begin
      LJsonObj := TJSONObject.ParseJSONValue(LResponse.Content) as TJSONObject;
      try
        if Assigned(LJsonObj) then
          ShowMessage('Cliente: ' + LJsonObj.GetValue<string>('nome', ''));
      finally
        LJsonObj.Free;
      end;
    end
    else
      raise Exception.CreateFmt('Erro HTTP %d: %s', [LResponse.StatusCode, LResponse.StatusText]);
  finally
    LResponse.Free;
    LRequest.Free;
    LClient.Free;
  end;
end;`
      };
    }

    // 2. Geração de banco de dados / FireDAC
    if (lower.includes('banco') || lower.includes('sql') || lower.includes('firedac') || lower.includes('query')) {
      return {
        text: 'Exemplo de consulta com TFDQuery utilizando parâmetros tipados e bloco de liberação segura:',
        codeSnippet: `function BuscarTotalVendasPorPeriodo(AConexao: TFDConnection; const ADataInicio, ADataFim: TDateTime): Currency;
var
  LQry: TFDQuery;
begin
  Result := 0.0;
  LQry := TFDQuery.Create(nil);
  try
    LQry.Connection := AConexao;
    LQry.SQL.Text := 
      'SELECT COALESCE(SUM(VALOR_TOTAL), 0) AS TOTAL ' +
      'FROM VENDAS ' +
      'WHERE DATA_VENDA BETWEEN :DATA_INI AND :DATA_FIM';
    LQry.ParamByName('DATA_INI').AsDateTime := ADataInicio;
    LQry.ParamByName('DATA_FIM').AsDateTime := ADataFim;
    LQry.Open;

    if not LQry.IsEmpty then
      Result := LQry.FieldByName('TOTAL').AsCurrency;
  finally
    LQry.Free;
  end;
end;`
      };
    }

    // 3. Generics e Listas
    if (lower.includes('generics') || lower.includes('lista') || lower.includes('tlist')) {
      return {
        text: 'Utilização de listas genéricas fortemente tipadas com System.Generics.Collections:',
        codeSnippet: `type
  TItemPedido = record
    Codigo: Integer;
    Descricao: string;
    ValorUnitario: Currency;
  end;

procedure ProcessarListaGenerica;
var
  LLista: TList<TItemPedido>;
  LItem: TItemPedido;
begin
  LLista := TList<TItemPedido>.Create;
  try
    LItem.Codigo := 1;
    LItem.Descricao := 'Produto Teste';
    LItem.ValorUnitario := 49.90;
    LLista.Add(LItem);

    // Iteração rápida com for-in moderno
    for LItem in LLista do
      Writeln(Format('%d - %s: R$ %.2f', [LItem.Codigo, LItem.Descricao, LItem.ValorUnitario]));
  finally
    LLista.Free;
  end;
end;`
      };
    }

    // Resposta padrão contextual
    return {
      text: `Entendido! Em Object Pascal para o Delphi moderno, recomenda-se sempre desacoplar regras de negócio em classes de serviço com interfaces (IInterface), utilizar contêineres genéricos de 'System.Generics.Collections' e envolver todas as criações manuais de instâncias em blocos 'try .. finally' com liberação imediata.`,
      codeSnippet: `// Estrutura padrão de procedimento seguro
procedure ExecutarOperacaoSegura;
var
  LObjeto: TObject;
begin
  LObjeto := TObject.Create;
  try
    // Operações com LObjeto
  finally
    FreeAndNil(LObjeto);
  end;
end;`
    };
  }
}
