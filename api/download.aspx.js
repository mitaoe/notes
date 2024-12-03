import { decryptString, genIntegrity } from '../utils/crypto';
import axios from 'axios';
import { config } from '../config';

const BASE_URL = 'https://www.googleapis.com/drive/v3';

async function getAccessToken() {
  try {
    const response = await axios.post('https://www.googleapis.com/oauth2/v4/token', {
      client_id: config.client_id,
      client_secret: config.client_secret,
      refresh_token: config.refresh_token,
      grant_type: 'refresh_token',
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  try {
    // Get the file ID from the query parameters
    const fileId = req.query.id;

    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // Get the access token
    const token = await getAccessToken();

    // Get file metadata
    const metadataResponse = await axios.get(`${BASE_URL}/files/${fileId}`, {
      params: {
        fields: 'name,mimeType,size',
        supportsAllDrives: true,
      },
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const { name, mimeType, size } = metadataResponse.data;
    if (!name) {
      return res.status(500).json({ error: 'Unable to find this file. Try again.' });
    }

    // Set response headers
    const range = req.headers.range;
    const inline = req.query.inline === 'true';

    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${name}"`);
    res.setHeader('Content-Type', mimeType);
    if (size) {
      res.setHeader('Content-Length', size);
    }
    config.enable_cors_file_down && res.setHeader('Access-Control-Allow-Origin', '*');

    // Stream the file
    const downloadUrl = `${BASE_URL}/files/${fileId}?alt=media`;
    const response = await axios.get(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...(range && { 'Range': range }),
      },
      responseType: 'stream',
    });

    // Handle streaming errors
    response.data.on('error', (error) => {
      console.error('Streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Streaming failed' });
      }
    });

    // Pipe the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    if (error.response?.status === 404) {
      return res.status(404).send(`
        <html>
          <head><title>404 Not Found</title></head>
          <body>
            <h1>404 Not Found</h1>
            <p>The requested file could not be found.</p>
          </body>
        </html>
      `);
    }
    res.status(500).json({ error: 'Failed to download file' });
  }
} 