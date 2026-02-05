import axios from 'axios';
import { createHmac } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const URL = `http://localhost:${PORT}/api/webhooks/flowpay`;
const SECRET = process.env.FLOWPAY_WEBHOOK_SECRET;

if (!SECRET) {
    console.error('❌ FLOWPAY_WEBHOOK_SECRET not set in .env');
    process.exit(1);
}

const payload = {
    orderId: 'ORDER-' + Math.random().toString(36).substring(7).toUpperCase(),
    amount: '100.00',
    currency: 'USDT',
    payerId: 'user_0x123...456',
    status: 'confirmed', // Isso deve disparar o reator
    metadata: {
        txHash: '0x' + Math.random().toString(16).substring(2),
        plan: 'premium'
    }
};

const bodyStr = JSON.stringify(payload);
const signature = createHmac('sha256', SECRET).update(bodyStr).digest('hex');

console.log(`\n🚀 SIMULATING FLOWPAY WEBHOOK`);
console.log(`   Target: ${URL}`);
console.log(`   Order: ${payload.orderId}`);
console.log('---------------------------------------------------');

async function sendWebhook() {
    try {
        const response = await axios.post(URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-FlowPay-Signature': signature
            }
        });

        console.log('✅ SERVER RESPONSE:', response.status, response.data);
    } catch (error: any) {
        if (error.response) {
            console.error('❌ SERVER ERROR:', error.response.status, error.response.data);
        } else {
            console.error('❌ CONNECTION ERROR:', error.message);
        }
    }
}

sendWebhook();
