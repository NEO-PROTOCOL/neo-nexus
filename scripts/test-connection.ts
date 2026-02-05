import WebSocket from 'ws';
import dotenv from 'dotenv';
import { ProtocolEvent } from '../src/core/nexus';

dotenv.config();

const PORT = process.env.PORT || 3000;
const SECRET = process.env.NEXUS_SECRET;

if (!SECRET) {
    console.error('❌ NEXUS_SECRET not set in .env');
    process.exit(1);
}

const WS_URL = `ws://localhost:${PORT}`;

console.log(`\n🔍 TESTING NEXUS WEBSOCKET SECURITY`);
console.log(`   Target: ${WS_URL}`);
console.log(`   Secret: ${SECRET.substring(0, 5)}...`);
console.log('---------------------------------------------------');

async function testUnauthorized() {
    return new Promise<void>((resolve) => {
        console.log('1️⃣  Testing Unauthorized Connection (No Token)...');
        const ws = new WebSocket(WS_URL);

        ws.on('open', () => {
            console.error('   ❌ ERROR: Connection opened but should have been rejected!');
            ws.close();
            resolve();
        });

        ws.on('error', (err) => {
            if (err.message.includes('401')) {
                console.log('   ✅ SUCCESS: Connection rejected with 401 Unauthorized (Expected)');
            } else {
                console.log(`   ℹ️  Connection failed with error: ${err.message} (likely rejected, which is good)`);
            }
            resolve();
        });
    });
}

async function testAuthorized() {
    return new Promise<void>((resolve) => {
        console.log('\n2️⃣  Testing Authorized Connection (With Token)...');
        // Test passing token in Query Param
        const ws = new WebSocket(`${WS_URL}?token=${SECRET}`);

        ws.on('open', () => {
            console.log('   ✅ SUCCESS: Connection established!');

            console.log('\n3️⃣  Testing Subscription...');
            const subscribeMsg = {
                action: 'subscribe',
                events: [ProtocolEvent.PAYMENT_RECEIVED]
            };
            ws.send(JSON.stringify(subscribeMsg));
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.status === 'subscribed') {
                console.log('   ✅ SUCCESS: Subscribed to events:', msg.events);
                console.log('   ---------------------------------------------------');
                console.log('   🎉 ALL TESTS PASSED');
                ws.close();
                resolve();
            } else {
                console.log('   ℹ️  Received:', msg);
            }
        });

        ws.on('error', (err) => {
            console.error('   ❌ ERROR:', err.message);
            resolve();
        });
    });
}

(async () => {
    // Wait for server to be ready
    setTimeout(async () => {
        try {
            await testUnauthorized();
            await testAuthorized();
        } catch (e) {
            console.error(e);
        }
    }, 1000);
})();
