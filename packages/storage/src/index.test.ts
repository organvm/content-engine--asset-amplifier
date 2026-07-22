import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FilesystemStorageClient, createStorage } from './index.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('@cronus/storage FilesystemStorageClient', () => {
  let tmpDir: string;
  let client: FilesystemStorageClient;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cronus-storage-test-'));
    client = new FilesystemStorageClient(tmpDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('should upload and download data correctly', async () => {
    const key = 'test/sample.txt';
    const content = Buffer.from('hello cronus storage');

    await client.upload(key, content);
    const exists = await client.exists(key);
    expect(exists).toBe(true);

    const downloaded = await client.download(key);
    expect(downloaded.toString()).toBe('hello cronus storage');
  });

  it('should generate virtual signed URLs for local files', async () => {
    const url = await client.getSignedUrl('test/sample.txt');
    expect(url).toBe('/files/test/sample.txt');
  });

  it('should delete stored files', async () => {
    const key = 'test/delete.txt';
    await client.upload(key, Buffer.from('to delete'));
    expect(await client.exists(key)).toBe(true);

    await client.delete(key);
    expect(await client.exists(key)).toBe(false);
  });

  it('should fallback to filesystem mode when createStorage is called without S3 credentials', () => {
    const storage = createStorage();
    expect(storage).toBeDefined();
  });
});
