import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// TODO: Add event routes (see IMPLEMENTATION_PLAN.md Phase 2)

app.listen(PORT, () => {
    console.log(`[NEXUS] Server running on port ${PORT}`);
});
