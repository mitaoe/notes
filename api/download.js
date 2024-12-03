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
  // Check if anonymous downloads are disabled
  if (config.disable_anonymous_download) {
    return res.status(401).send(`
      <html>
        <head><title>Anonymous Download - Access Denied</title></head>
        <body>
          <h1>Access Denied</h1>
          <p>Anonymous downloads are not allowed. Please log in to download files.</p>
        </body>
      </html>
    `);
  }

  const { id, name } = req.query;
  const userIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (!id) {
    return res.status(400).json({ error: 'File ID is required' });
  }

  // Check direct link protection
  if (config.direct_link_protection) {
    const referer = req.headers.referer;
    if (!referer) {
      return res.status(401).send(`
        <html>
          <head><title>Direct Link - Access Denied</title></head>
          <body>
            <h1>Access Denied</h1>
            <p>Direct links are not allowed. Please access the file through the web interface.</p>
          </body>
        </html>
      `);
    }
    
    const hostname = new URL(referer).hostname;
    if (!hostname.includes(req.headers.host)) {
      return res.status(401).send(`
        <html>
          <head><title>Direct Link - Access Denied</title></head>
          <body>
            <h1>Access Denied</h1>
            <p>Access from external domains is not allowed.</p>
          </body>
        </html>
      `);
    }
  }

  try {
    const token = await getAccessToken();

    // Get file metadata first
    const metadataResponse = await axios.get(`${BASE_URL}/files/${id}`, {
      params: {
        fields: 'name,mimeType,size',
        supportsAllDrives: true,
      },
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const { name: fileName, mimeType, size } = metadataResponse.data;
    if (!fileName) {
      return res.status(500).json({ error: 'Unable to find this file. Try again.' });
    }

    const downloadUrl = `${BASE_URL}/files/${id}?alt=media`;
    const range = req.headers.range;
    const inline = req.query.inline === 'true';

    // Set response headers
    res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${name || fileName}"`);
    res.setHeader('Content-Type', mimeType);
    if (size) {
      res.setHeader('Content-Length', size);
    }
    config.enable_cors_file_down && res.setHeader('Access-Control-Allow-Origin', '*');

    // Stream the file
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