import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { DEFAULT_VCL_PROJECT } from '../server/templates/default-project.ts';
import { AIAssistantService } from '../server/ai-assistant.ts';
import { CompilerRunner } from '../agent/compiler-runner.ts';
import type { BuildParams } from '../common/types.ts';

test('Integração: AIAssistantService deve gerar código idiomático para REST e FireDAC', async () => {
  const restResp = await AIAssistantService.answer('Como consumir uma API REST no Delphi?');
  assert.ok(restResp.codeSnippet?.includes('TRESTClient'));
  assert.ok(restResp.codeSnippet?.includes('try'));
  assert.ok(restResp.codeSnippet?.includes('finally'));

  const sqlResp = await AIAssistantService.answer('Como fazer consulta com TFDQuery no FireDAC?');
  assert.ok(sqlResp.codeSnippet?.includes('TFDQuery'));
  assert.ok(sqlResp.codeSnippet?.includes('SQL.Text'));
});

test('Integração: CompilerRunner deve compilar o projeto padrão VCL completo e gerar artefatos', async () => {
  const runner = new CompilerRunner();
  const logs: string[] = [];

  const params: BuildParams = {
    buildId: 'test_e2e_vcl',
    projectFilePath: DEFAULT_VCL_PROJECT.mainFile,
    target: 'Build',
    platform: 'Win32',
    config: 'Debug',
    files: DEFAULT_VCL_PROJECT.files.map(f => ({
      relativePath: f.path,
      content: f.content
    }))
  };

  const result = await runner.run(params, undefined, (line) => {
    logs.push(line);
  });

  assert.equal(result.status, 'Success');
  assert.equal(result.errorCount, 0);
  assert.ok(result.artifacts.length >= 2);

  const exeArtifact = result.artifacts.find(a => a.fileName === 'GestaoComercial.exe');
  assert.ok(exeArtifact);
  assert.ok(exeArtifact.fileSizeBytes > 0);

  const mapArtifact = result.artifacts.find(a => a.fileName === 'GestaoComercial.map');
  assert.ok(mapArtifact);

  assert.ok(logs.some(l => l.includes('Iniciando compilação do projeto')));
  assert.ok(logs.some(l => l.includes('GestaoComercial.exe')));
});

test('Integração: Servidor Express e rotas de projeto, build e download de binários', async () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const runner = new CompilerRunner();

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'PascalWeb IDE' });
  });

  app.get('/api/projects/default', (req, res) => {
    res.json(DEFAULT_VCL_PROJECT);
  });

  app.post('/api/build/execute', async (req, res) => {
    const result = await runner.run(req.body, undefined);
    res.json(result);
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    assert.equal(healthJson.status, 'ok');

    // 2. Default project
    const projRes = await fetch(`${baseUrl}/api/projects/default`);
    const projJson = await projRes.json();
    assert.equal(projJson.name, 'GestaoComercial');
    assert.equal(projJson.type, 'VCLApplication');
    assert.ok(projJson.files.length >= 4);

    // 3. Build execution via HTTP
    const buildPayload: BuildParams = {
      buildId: 'http_build_test',
      projectFilePath: 'GestaoComercial.dpr',
      target: 'Build',
      platform: 'Win32',
      config: 'Release',
      files: projJson.files.map((f: any) => ({ relativePath: f.path, content: f.content }))
    };

    const buildRes = await fetch(`${baseUrl}/api/build/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload)
    });
    const buildJson = await buildRes.json();
    assert.equal(buildJson.status, 'Success');
    assert.ok(buildJson.artifacts.length >= 2);
  } finally {
    server.close();
  }
});
