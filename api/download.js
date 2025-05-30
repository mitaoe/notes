import axios from 'axios';

const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.VITE_GOOGLE_REFRESH_TOKEN;

async function getAccessToken() {
  try {
    const response = await axios.post('https://www.googleapis.com/oauth2/v4/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileId, inline, directLink } = req.query;
  if (!fileId) {
    return res.status(400).json({ error: 'File ID is required' });
  }

  try {
    const token = await getAccessToken();

    // Get file metadata first
    const metadataResponse = await axios.get(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      params: {
        fields: 'name,mimeType,size',
        supportsAllDrives: true,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    const { name, mimeType, size } = metadataResponse.data;

    // If directLink is requested (default behavior now)
    if (directLink === 'true' || !inline) {
      // Set file permissions to allow public access
      await axios.post(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        role: 'reader',
        type: 'anyone',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Return JSON with download and preview URLs
      return res.status(200).json({
        name,
        mimeType,
        size,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      });
    }

    // For inline viewing/preview (fallback)
    // Set response headers
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(name)}"`);
    if (size) {
      res.setHeader('Content-Length', size);
    }

    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');

    // Stream the file for inline viewing
    const response = await axios.get(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'stream',
    });

    response.data.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      if (error.response?.status === 404) {
        return res.status(404).json({ error: 'File not found' });
      }
      return res.status(500).json({ error: 'Failed to process file' });
    }
  }
} 