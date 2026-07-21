import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as presign } from '@aws-sdk/s3-request-presigner';

// ---------------------------------------------------------------------------
// Storage abstraction
// ---------------------------------------------------------------------------

export interface StorageClient {
  upload(key: string, data: Buffer, contentType?: string): Promise<void>;
  download(key: string): Promise<Buffer>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// S3-compatible implementation (works with AWS S3, R2, MinIO, etc.)
// ---------------------------------------------------------------------------

export interface S3StorageOptions {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  region: string;
}

export class S3StorageClient implements StorageClient {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(opts: S3StorageOptions) {
    this.bucket = opts.bucket;
    this.client = new S3Client({
      endpoint: opts.endpoint,
      region: opts.region,
      credentials: {
        accessKeyId: opts.accessKey,
        secretAccessKey: opts.secretKey,
      },
      forcePathStyle: true,
    });
  }

  async upload(key: string, data: Buffer, contentType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      }),
    );
  }

  async download(key: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!res.Body) {
      throw new Error(`Empty body returned for key: ${key}`);
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return presign(this.client, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch (err: unknown) {
      const code = (err as { name?: string }).name;
      if (code === 'NotFound' || code === 'NoSuchKey') {
        return false;
      }
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Filesystem adapter — for deployments without S3 (e.g., Render persistent disk)
// ---------------------------------------------------------------------------

import fs from 'node:fs/promises';
import path from 'node:path';

export class FilesystemStorageClient implements StorageClient {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  private resolve(key: string): string {
    return path.join(this.basePath, key);
  }

  async upload(key: string, data: Buffer): Promise<void> {
    const filePath = this.resolve(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, data);
  }

  async download(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  async getSignedUrl(key: string): Promise<string> {
    return `/files/${key}`;
  }

  async delete(key: string): Promise<void> {
    await fs.unlink(this.resolve(key)).catch(() => {});
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Factory — reads connection details from environment variables
// ---------------------------------------------------------------------------

export function createStorage(): StorageClient {
  const storageMode = process.env.STORAGE_MODE;

  if (storageMode === 'filesystem') {
    const storagePath = process.env.STORAGE_PATH ?? './data/assets';
    return new FilesystemStorageClient(storagePath);
  }

  const endpoint = process.env.STORAGE_ENDPOINT;
  const accessKey = process.env.STORAGE_ACCESS_KEY;
  const secretKey = process.env.STORAGE_SECRET_KEY;
  const bucket = process.env.STORAGE_BUCKET;
  const region = process.env.STORAGE_REGION ?? 'auto';

  if (!endpoint || !accessKey || !secretKey || !bucket) {
    const fallbackPath = process.env.STORAGE_PATH ?? './data/assets';
    return new FilesystemStorageClient(fallbackPath);
  }

  return new S3StorageClient({ endpoint, accessKey, secretKey, bucket, region });
}
