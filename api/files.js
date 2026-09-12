import axios from 'axios';

const BASE_URL = 'https://www.googleapis.com/drive/v3';
const FOLDER_TYPE = 'application/vnd.google-apps.folder';
const SHORTCUT_TYPE = 'application/vnd.google-apps.shortcut';
const DOCUMENT_TYPE = 'application/vnd.google-apps.document';
const SPREADSHEET_TYPE = 'application/vnd.google-apps.spreadsheet';
const FORM_TYPE = 'application/vnd.google-apps.form';
const SITE_TYPE = 'application/vnd.google-apps.site';
const DEFAULT_PAGE_SIZE = 100;

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

  try {
    const token = await getAccessToken();
    const { path, pageToken, search, folderName, fileId } = req.query;
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE, 1), 1000);

    if (fileId) {
      const response = await axios.get(`${BASE_URL}/files/${fileId}`, {
        params: {
          fields: 'id, name, mimeType, size, modifiedTime, parents, driveId',
          supportsAllDrives: true,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.status(200).json(response.data);
    }

    if (folderName) {
      const params = {
        q: `'${path}' in parents and name = '${folderName}' and mimeType = '${FOLDER_TYPE}' and trashed = false`,
        fields: 'files(id, name, mimeType)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      };

      const response = await axios.get(`${BASE_URL}/files`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.status(200).json(response.data);
    }

    if (search) {
      const formattedQuery = search.replace(/(!=)|['"=<>/\\:]/g, '').replace(/[,，|(){}]/g, ' ').trim();
      if (!formattedQuery) {
        return res.status(200).json({
          nextPageToken: null,
          files: [],
        });
      }

      const words = formattedQuery.split(/\s+/);
      const nameSearchStr = `name contains '${words.join("' AND name contains '")}'`;
      const params = {
        q: `trashed = false AND mimeType != '${SHORTCUT_TYPE}' and mimeType != '${DOCUMENT_TYPE}' and mimeType != '${SPREADSHEET_TYPE}' and mimeType != '${FORM_TYPE}' and mimeType != '${SITE_TYPE}' AND name !='.password' AND (${nameSearchStr})`,
        orderBy: 'folder,name,modifiedTime desc',
        fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime)',
        pageSize,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        corpora: 'allDrives',
        ...(pageToken && { pageToken }),
      };

      const response = await axios.get(`${BASE_URL}/files`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.status(200).json(response.data);
    }

    const params = {
      q: `'${path}' in parents and trashed = false AND name !='.password' and mimeType != '${SHORTCUT_TYPE}' and mimeType != '${DOCUMENT_TYPE}' and mimeType != '${SPREADSHEET_TYPE}' and mimeType != '${FORM_TYPE}' and mimeType != '${SITE_TYPE}'`,
      orderBy: 'folder,name,modifiedTime desc',
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, fileExtension, iconLink, thumbnailLink, parents, driveId)',
      pageSize,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'allDrives',
      ...(pageToken && { pageToken }),
    };

    const response = await axios.get(`${BASE_URL}/files`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Failed to fetch files' });
  }
} 