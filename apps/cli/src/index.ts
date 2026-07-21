#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import axios from 'axios';
import { ingestCommand } from './commands/ingest.js';

const program = new Command();
const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

program
  .name('cronus')
  .description('CLI for Managing the Cronus Metabolus Content Engine')
  .version('0.1.0')
  .addCommand(ingestCommand);

program.command('upload')
  .description('Upload an asset for a brand')
  .argument('<brandId>', 'ID of the brand')
  .argument('<filePath>', 'Path to the asset file')
  .action(async (brandId, filePath) => {
    try {
      const fullPath = path.resolve(filePath);
      const fileBuffer = await fs.readFile(fullPath);
      const filename = path.basename(fullPath);

      // We'd use form-data here in a real implementation
      console.log(`Uploading ${filename} (${fileBuffer.length} bytes) for brand ${brandId}...`);
      // const response = await axios.post(`${API_URL}/brands/${brandId}/assets`, ...);
      console.log('Upload successful (Mocked)');
    } catch (err) {
      console.error('Upload failed:', (err as Error).message);
    }
  });

program.command('status')
  .description('Check job status')
  .argument('<jobId>', 'ID of the job')
  .action(async (jobId) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}`);
      console.log(JSON.stringify(response.data, null, 2));
    } catch (err) {
      console.error('Failed to get status:', (err as Error).message);
    }
  });

program.parse();
