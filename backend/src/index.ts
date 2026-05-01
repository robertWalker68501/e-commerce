import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { clerkMiddleware } from '@clerk/express';
import { clerkWebhookHandler } from './middleware/clerk.js';
import { getEnv } from './lib/env.js';

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

app.listen(env.PORT, () => console.log(`Server running on port ${env.PORT}`));
