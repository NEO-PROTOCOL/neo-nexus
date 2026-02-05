
import WebSocket from 'ws';

const URL = 'wss://neo-nexus-production.up.railway.app';
const SECRET = 'b2a974f838b3b65c41c66f5abccf013c19f1d3313670be29afcf8611807f81b1';

console.log(`📡 Conectando a ${URL}...`);

const ws = new WebSocket(`${URL}?token=${SECRET}`);

ws.on('open', () => {
    console.log('✅ CONECTADO! O servidor Nexus está aceitando WebSockets.');
    ws.close();
    process.exit(0);
});

ws.on('error', (err) => {
    console.error('❌ ERRO:', err.message);
    process.exit(1);
});

ws.on('close', (code, reason) => {
    console.log(`⚠️ Fechado: ${code} - ${reason}`);
});
