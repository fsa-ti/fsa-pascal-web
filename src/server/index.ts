import http from 'node:http';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { DEFAULT_VCL_PROJECT } from './templates/default-project.ts';
import { AIAssistantService } from './ai-assistant.ts';
import { CompilerRunner } from '../agent/compiler-runner.ts';
import type { BuildParams, DelphiProject } from '../common/types.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Memória em runtime
let currentProject: DelphiProject = JSON.parse(JSON.stringify(DEFAULT_VCL_PROJECT));
const generatedArtifacts = new Map<string, { buffer: Buffer; contentType: string }>();
const compilerRunner = new CompilerRunner();

// --- Rotas REST ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PascalWeb IDE Core Server', version: '1.0.0' });
});

app.get('/api/projects/default', (req, res) => {
  res.json(currentProject);
});

app.post('/api/projects/save', (req, res) => {
  const updatedProject = req.body as DelphiProject;
  if (!updatedProject || !updatedProject.files) {
    return res.status(400).json({ error: 'Projeto inválido' });
  }
  currentProject = updatedProject;
  res.json({ success: true, timestamp: Date.now() });
});

app.post('/api/ai/ask', async (req, res) => {
  const { prompt, contextUnit } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt não informado' });
  }
  const answer = await AIAssistantService.answer(prompt, contextUnit);
  res.json(answer);
});

app.get('/api/plugins', (req, res) => {
  res.json([
    {
      id: 'org.pascalweb.acbr-suite',
      name: 'ACBr Suite de Componentes Fiscais',
      version: '1.0.0',
      publisher: 'Projeto ACBr & PascalWeb',
      description: 'Componentes para NFe, CTe, MDFe e geração de SPED Fiscal',
      contributes: {
        paletteCategories: [{ id: 'acbr', title: 'ACBr - Fiscal' }],
        components: [
          {
            className: 'TACBrNFe',
            name: 'ACBrNFe',
            category: 'Custom',
            description: 'Componente emissor de NFe',
            defaultWidth: 28,
            defaultHeight: 28,
            isNonVisual: true
          }
        ]
      }
    },
    {
      id: 'org.pascalweb.pascal-linter',
      name: 'Pascal Clean Code & Memory Leak Analyzer',
      version: '1.0.0',
      publisher: 'PascalWeb Core',
      description: 'Linter estático que alerta sobre ausência de blocos try..finally e vazamento de ponteiros',
      contributes: {
        linters: true
      }
    }
  ]);
});

app.post('/api/build/execute', async (req, res) => {
  const params: BuildParams = req.body;
  if (!params || !params.files) {
    return res.status(400).json({ error: 'Parâmetros de build inválidos' });
  }

  const logs: string[] = [];
  const result = await compilerRunner.run(params, undefined, (line) => {
    logs.push(line);
    broadcastToClients({ type: 'build_log', line });
  });

  // Guardar artefatos gerados em memória para download
  if (result.artifacts && result.artifacts.length > 0) {
    for (const art of result.artifacts) {
      const mockBuf = Buffer.from(`PE_BINARY_MOCK_${art.fileName}_DATA`);
      generatedArtifacts.set(`${result.buildId}/${art.fileName}`, {
        buffer: mockBuf,
        contentType: 'application/octet-stream'
      });
    }
  }

  res.json(result);
});

app.post('/api/build/run', (req, res) => {
  const { fileName, localPath } = req.body;
  if (localPath && fs.existsSync(localPath)) {
    try {
      spawn(localPath, [], { detached: true, stdio: 'ignore' }).unref();
      return res.json({ success: true, message: `Executável iniciado no Windows: ${fileName}` });
    } catch (err: any) {
      return res.status(500).json({ error: `Falha ao iniciar processo: ${err.message}` });
    }
  }
  res.json({ success: false, message: 'Arquivo local não encontrado para execução direta.' });
});

app.get('/api/artifacts/:buildId/:fileName', (req, res) => {
  const key = `${req.params.buildId}/${req.params.fileName}`;
  const item = generatedArtifacts.get(key);
  if (!item) {
    // Gerar fallback on the fly se for pedido de download
    const fallbackBuf = Buffer.from(`PascalWeb IDE Binary Generated: ${req.params.fileName}\nTimestamp: ${new Date().toISOString()}`);
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    return res.send(fallbackBuf);
  }

  res.setHeader('Content-Disposition', `attachment; filename="${req.params.fileName}"`);
  res.setHeader('Content-Type', item.contentType);
  res.send(item.buffer);
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const connectedClients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  connectedClients.add(ws);
  ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {
      // Ignorar
    }
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
  });
});

function broadcastToClients(msg: any) {
  const str = JSON.stringify(msg);
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(str);
    }
  }
}

server.listen(PORT, () => {
  console.log(`📡 PascalWeb Server rodando em http://localhost:${PORT}`);
  console.log(`🔌 WebSocket disponível em ws://localhost:${PORT}/ws`);
});
