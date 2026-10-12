import type { DelphiProject } from '../../common/types.ts';

export const DEFAULT_VCL_PROJECT: DelphiProject = {
  id: 'proj_default_vcl',
  name: 'GestaoComercial',
  type: 'VCLApplication',
  rootPath: 'GestaoComercial',
  mainFile: 'GestaoComercial.dpr',
  activeConfig: 'Debug',
  activePlatform: 'Win32',
  files: [
    {
      name: 'GestaoComercial.dpr',
      path: 'GestaoComercial.dpr',
      type: 'dpr',
      content: `program GestaoComercial;

uses
  Vcl.Forms,
  ufrmPrincipal in 'src\\ufrmPrincipal.pas' {frmPrincipal};

{$R *.res}

begin
  Application.Initialize;
  Application.MainFormOnTaskbar := True;
  Application.CreateForm(TfrmPrincipal, frmPrincipal);
  Application.Run;
end.
`
    },
    {
      name: 'ufrmPrincipal.pas',
      path: 'src/ufrmPrincipal.pas',
      type: 'pas',
      content: `unit ufrmPrincipal;

interface

uses
  Winapi.Windows, Winapi.Messages, System.SysUtils, System.Variants, System.Classes, Vcl.Graphics,
  Vcl.Controls, Vcl.Forms, Vcl.Dialogs, Vcl.StdCtrls, Vcl.ExtCtrls;

type
  TfrmPrincipal = class(TForm)
    pnlTopo: TPanel;
    btnProcessar: TButton;
    edtNomeCliente: TEdit;
    lblCliente: TLabel;
    mmoLogs: TMemo;
    procedure btnProcessarClick(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  frmPrincipal: TfrmPrincipal;

implementation

{$R *.dfm}

procedure TfrmPrincipal.btnProcessarClick(Sender: TObject);
begin
  if Trim(edtNomeCliente.Text) = '' then
  begin
    ShowMessage('Informe o nome do cliente antes de prosseguir.');
    Exit;
  end;

  mmoLogs.Lines.Add(Format('Cliente processado com sucesso: %s em %s', [edtNomeCliente.Text, DateTimeToStr(Now)]));
end;

end.
`
    },
    {
      name: 'ufrmPrincipal.dfm',
      path: 'src/ufrmPrincipal.dfm',
      type: 'dfm',
      content: `object frmPrincipal: TfrmPrincipal
  Left = 0
  Top = 0
  Caption = 'Gestão Comercial - PascalWeb IDE'
  ClientHeight = 441
  ClientWidth = 624
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -12
  Font.Name = 'Segoe UI'
  Font.Style = []
  Position = poScreenCenter
  TextHeight = 15
  object pnlTopo: TPanel
    Left = 0
    Top = 0
    Width = 624
    Height = 65
    Align = alTop
    TabOrder = 0
    object lblCliente: TLabel
      Left = 16
      Top = 11
      Width = 85
      Height = 15
      Caption = 'Nome do Cliente:'
    end
    object edtNomeCliente: TEdit
      Left = 16
      Top = 32
      Width = 240
      Height = 23
      TabOrder = 0
    end
    object btnProcessar: TButton
      Left = 270
      Top = 31
      Width = 115
      Height = 25
      Caption = 'Processar Pedido'
      TabOrder = 1
      OnClick = btnProcessarClick
    end
  end
  object mmoLogs: TMemo
    Left = 0
    Top = 65
    Width = 624
    Height = 376
    Align = alClient
    Lines = (
      'Sistema iniciado e pronto para opera'#231#227'o.')
    ReadOnly = True
    ScrollBars = ssVertical
    TabOrder = 1
  end
end`
    },
    {
      name: 'GestaoComercial.dproj',
      path: 'GestaoComercial.dproj',
      type: 'dproj',
      content: `<?xml version="1.0" encoding="utf-8"?>
<Project xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <PropertyGroup>
    <ProjectGuid>{B829281C-032F-4A61-A795-A7A255E5D87E}</ProjectGuid>
    <ProjectVersion>20.1</ProjectVersion>
    <MainSource>GestaoComercial.dpr</MainSource>
    <Base>True</Base>
    <Config Condition="'$(Config)'==''">Debug</Config>
    <Platform Condition="'$(Platform)'==''">Win32</Platform>
    <TargetedPlatforms>1</TargetedPlatforms>
    <AppType>Application</AppType>
    <FrameworkType>VCL</FrameworkType>
  </PropertyGroup>
  <ItemGroup>
    <DelphiCompile Include="$(MainSource)">
      <MainSource>MainSource</MainSource>
    </DelphiCompile>
    <DCCReference Include="src\\ufrmPrincipal.pas">
      <Form>frmPrincipal</Form>
      <FormType>dfm</FormType>
    </DCCReference>
  </ItemGroup>
</Project>`
    }
  ]
};
