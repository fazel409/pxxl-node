// Minimal VLESS (TCP) + WebSocket server for Pxxl.
// Written from the public VLESS protocol layout — no downloaded binary,
// no obfuscated code. Read it before deploying.
// Pxxl terminates TLS at the edge: this server listens plain WebSocket
// on process.env.PORT, and the client connects with security=tls on 443.
// Secrets are NOT in this file: set UUID and WSPATH as Pxxl env vars.
'use strict';

const http = require('http');
const net = require('net');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT || 3000);
const UUID = (process.env.UUID || '').toLowerCase().replace(/-/g, '');
const WSPATH = '/' + (process.env.WSPATH || 'vless').replace(/^\/+/, '');

if (!UUID || UUID.length !== 32) {
  console.error('UUID env var is missing or invalid (expected a UUID).');
  process.exit(1);
}

function uuidBytesToString(buf) {
  const h = buf.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Parse one VLESS request header. Returns null on malformed input.
// Layout: [version 1][uuid 16][addonLen 1][addon][command 1][port 2]
//          [addrType 1][address][payload...]
function parseVlessHeader(buf) {
  if (buf.length < 24) return null;
  const version = buf[0];
  const clientUuid = uuidBytesToString(buf.subarray(1, 17));
  if (clientUuid !== uuidBytesToString(Buffer.from(UUID, 'hex'))) return null;
  const addonLen = buf[17];
  let off = 18 + addonLen;
  if (buf.length < off + 4) return null;
  const command = buf[off]; off += 1;
  if (command !== 1) return null; // TCP only; UDP/MUX not supported here
  const port = buf.readUInt16BE(off); off += 2;
  const addrType = buf[off]; off += 1;
  let address;
  if (addrType === 1) {
    if (buf.length < off + 4) return null;
    address = Array.from(buf.subarray(off, off + 4)).join('.');
    off += 4;
  } else if (addrType === 2) {
    const len = buf[off]; off += 1;
    if (buf.length < off + len) return null;
    address = buf.subarray(off, off + len).toString('utf8');
    off += len;
  } else if (addrType === 3) {
    if (buf.length < off + 16) return null;
    const parts = [];
    for (let i = 0; i < 16; i += 2) parts.push(buf.readUInt16BE(off + i).toString(16));
    address = parts.join(':');
    off += 16;
  } else {
    return null;
  }
  return { version, address, port, payload: buf.subarray(off) };
}

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('ok');
    return;
  }
  res.writeHead(404);
  res.end('not found');
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  let path;
  try {
    path = new URL(req.url, 'http://localhost').pathname;
  } catch {
    socket.destroy();
    return;
  }
  if (path !== WSPATH) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

wss.on('connection', (ws) => {
  let tcp = null;
  let headerParsed = false;

  ws.on('message', (data) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (!headerParsed) {
      headerParsed = true;
      const parsed = parseVlessHeader(buf);
      if (!parsed) {
        ws.close();
        return;
      }
      tcp = net.connect(parsed.port, parsed.address, () => {
        // VLESS response header: [version, addon length 0]
        ws.send(Buffer.from([parsed.version, 0x00]));
        if (parsed.payload.length) tcp.write(parsed.payload);
      });
      tcp.on('data', (chunk) => {
        if (ws.readyState === ws.OPEN) ws.send(chunk);
      });
      const closeBoth = () => {
        try { ws.close(); } catch {}
        try { tcp.destroy(); } catch {}
      };
      tcp.on('error', closeBoth);
      tcp.on('close', closeBoth);
      ws.on('close', () => {
        try { tcp.destroy(); } catch {}
      });
      ws.on('error', () => {
        try { tcp.destroy(); } catch {}
      });
      return;
    }
    if (tcp && !tcp.destroyed) tcp.write(buf);
  });

  ws.on('error', () => {
    try { if (tcp) tcp.destroy(); } catch {}
  });
});

server.listen(PORT, () => {
  console.log(`VLESS-WS listening on port ${PORT}, path ${WSPATH}`);
});
