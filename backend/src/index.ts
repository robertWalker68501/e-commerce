import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import fs from 'node:fs';
import path from 'node:path';

import { clerkMiddleware } from '@clerk/express';
import { clerkWebhookHandler } from './middleware/clerk.js';
import { getEnv } from './lib/env.js';
import keepAliveCron from './lib/cron.js';

import productRouter from './routes/productRouter.js';
import meRouter from './routes/meRouter.js';
import streamRouter from './routes/streamRouter.js';

const env = getEnv();
const app = express();

const rawJason = express.raw({ type: 'application/json', limit: '1mb' });

// Important: Do not parse the webhook event data, it needs to be in raw format
app.post('/webhooks/clerk', rawJason, (req, res) => {
	void clerkWebhookHandler(req, res);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(clerkMiddleware());

// Route to keep server alive (for platforms like Render that may put the server to sleep after inactivity)
app.get('/health', (_req, res) => {
	res.json({ ok: true });
});

// API routes
app.use('/api/me', meRouter);
app.use('/api/products', productRouter);
app.use('/api/stream', streamRouter);

const publicDir = path.join(process.cwd(), 'public');

if (fs.existsSync(publicDir)) {
	app.use(express.static(publicDir));

	app.get('/{*any}', (req, res, next) => {
		if (req.method !== 'GET' && req.method !== 'HEAD') {
			next();
			return;
		}

		if (req.path.startsWith('/api') || req.path.startsWith('/webhooks')) {
			next();
			return;
		}

		res.sendFile(path.join(publicDir, 'index.html'), (err) => next(err));
	});
}

app.listen(env.PORT, () => {
	console.log(`Server running on port ${env.PORT}`);

	if (env.NODE_ENV === 'production') {
		keepAliveCron.start();
	}
});
