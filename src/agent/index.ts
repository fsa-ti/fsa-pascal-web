import { WebSocketServer, WebSocket } from 'ws';
import { CompilerDetector } from './compiler-detector.ts';
import { CompilerRunner } from './compiler-runner.ts';
import type { BuildParams, JSONRPCRequest, JSONRPCResponse } from '../common/types.ts';

const PORT = Number(process.env.AGENT_PORT) || 3002;
const wss = new WebSocketServer({ port: PORT });
const runner = new CompilerRunner();
const installations = CompilerDetector.detect();

console.log(`=======================================================`);
console.log(`🚀 PascalWeb Build Agent Daemon iniciado na porta ${PORT}`);
console.log(`Sistema Operacional: ${process.platform} (${process.arch})`);
console.log(`Compiladores Delphi detectados: ${installations.length}`);
for (const inst of installations) {
  console.log(` - ${inst.version} (dcc32: ${inst.dcc32Path ? 'SIM' : 'NÃO'})`);
}
console.log(`=======================================================`);

wss.on('connection', (ws: WebSocket) => {
  console.log(`[Agente] Nova conexão estabelecida com a Web IDE`);

  ws.on('message', async (data: Buffer | string) => {
    try {
      const msg: JSONRPCRequest = JSON.parse(data.toString());

      if (msg.method === 'agent.handshake') {
        const resp: JSONRPCResponse = {
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            agentVersion: '1.0.0',
            status: 'Ready',
            platform: process.platform,
            installations: installations.map(i => ({
              version: i.version,
              hasDcc32: !!i.dcc32Path,
              hasDcc64: !!i.dcc64Path
            }))
          }
        };
        ws.send(JSON.stringify(resp));
        return;
      }

      if (msg.method === 'agent.ping') {
        const resp: JSONRPCResponse = {
          jsonrpc: '2.0',
          id: msg.id,
          result: { pong: Date.now() }
        };
        ws.send(JSON.stringify(resp));
        return;
      }

      if (msg.method === 'build.execute') {
        const params: BuildParams = msg.params;
        console.log(`[Agente] Recebida requisição de build: ${params.buildId} (${params.projectFilePath})`);

        const result = await runner.run(
          params,
          installations[0],
          (logLine) => {
            // Streaming de logs em tempo real
            const streamMsg = {
              jsonrpc: '2.0',
              method: 'build.streamLog',
              params: {
                buildId: params.buildId,
                line: logLine
              }
            };
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(streamMsg));
            }
          }
        );

        const resp: JSONRPCResponse = {
          jsonrpc: '2.0',
          id: msg.id,
          result
        };
        ws.send(JSON.stringify(resp));
        return;
      }

      // Método desconhecido
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        id: msg.id,
        error: { code: -32601, message: `Método não suportado: ${msg.method}` }
      }));
    } catch (err: any) {
      console.error(`[Agente] Erro ao processar mensagem:`, err);
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32700, message: `Erro de parse: ${err.message}` }
      }));
    }
  });

  ws.on('close', () => {
    console.log(`[Agente] Conexão com a Web IDE encerrada`);
  });
});
