import { FastifyPluginAsync } from 'fastify';
import { resolveProviders } from '@cronus/config';
import { encrypt, decrypt } from '@cronus/config';
import { createLogger } from '@cronus/logger';
import fs from 'node:fs/promises';
import path from 'node:path';

const log = createLogger('api:settings');

// Store API keys in a local encrypted file (not DB — these are system-level, not per-brand)
const KEYS_PATH = path.resolve(process.cwd(), '.keys.enc.json');

interface StoredKeys {
  anthropic_api_key?: string;
  openai_api_key?: string;
  ollama_host?: string;
  ollama_model?: string;
}

async function loadKeys(): Promise<StoredKeys> {
  try {
    const raw = await fs.readFile(KEYS_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return {
      anthropic_api_key: data.anthropic_api_key ? decrypt(data.anthropic_api_key) : undefined, // allow-secret
      openai_api_key: data.openai_api_key ? decrypt(data.openai_api_key) : undefined, // allow-secret
      ollama_host: data.ollama_host,
      ollama_model: data.ollama_model,
    };
  } catch {
    return {};
  }
}

async function saveKeys(keys: StoredKeys): Promise<void> {
  const data = {
    anthropic_api_key: keys.anthropic_api_key ? encrypt(keys.anthropic_api_key) : undefined, // allow-secret
    openai_api_key: keys.openai_api_key ? encrypt(keys.openai_api_key) : undefined, // allow-secret
    ollama_host: keys.ollama_host,
    ollama_model: keys.ollama_model,
  };
  await fs.writeFile(KEYS_PATH, JSON.stringify(data, null, 2));
}

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  // GET /settings/providers — show available providers and their status
  app.get('/settings/providers', async () => {
    const providers = await resolveProviders();
    return {
      llm: providers.llm ? { name: providers.llm.name, status: 'active' } : { name: 'none', status: 'not configured' },
      embedding: providers.embedding ? { name: providers.embedding.name, status: 'active' } : { name: 'none', status: 'not configured' },
      transcription: providers.transcription ? { name: providers.transcription.name, status: 'active' } : { name: 'none', status: 'not configured' },
    };
  });

  // GET /settings/keys — show which keys are set (masked)
  app.get('/settings/keys', async () => {
    const keys = await loadKeys();
    return {
      anthropic_api_key: keys.anthropic_api_key ? `${keys.anthropic_api_key.slice(0, 10)}...` : null, // allow-secret
      openai_api_key: keys.openai_api_key ? `${keys.openai_api_key.slice(0, 7)}...` : null, // allow-secret
      ollama_host: keys.ollama_host ?? process.env.OLLAMA_HOST ?? 'http://localhost:11434',
      ollama_model: keys.ollama_model ?? process.env.OLLAMA_MODEL ?? 'llama3.2:3b',
    };
  });

  // PUT /settings/keys — update API keys
  app.put('/settings/keys', async (request, _reply) => {
    const body = request.body as Partial<StoredKeys>;
    const existing = await loadKeys();

    const updated: StoredKeys = {
      ...existing,
      ...Object.fromEntries(Object.entries(body).filter(([_, v]) => v !== undefined && v !== '')),
    };

    await saveKeys(updated);

    // Apply keys to process.env for immediate use
    if (updated.anthropic_api_key) process.env.ANTHROPIC_API_KEY = updated.anthropic_api_key; // allow-secret
    if (updated.openai_api_key) process.env.OPENAI_API_KEY = updated.openai_api_key; // allow-secret
    if (updated.ollama_host) process.env.OLLAMA_HOST = updated.ollama_host;
    if (updated.ollama_model) process.env.OLLAMA_MODEL = updated.ollama_model;

    log.info('API keys updated');

    // Re-resolve providers with new keys
    const providers = await resolveProviders();
    return {
      status: 'updated',
      providers: {
        llm: providers.llm?.name ?? 'none',
        embedding: providers.embedding?.name ?? 'none',
        transcription: providers.transcription?.name ?? 'none',
      },
    };
  });
};
