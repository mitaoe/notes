import axios from 'axios';
import { config } from '../config';

const BASE_URL = 'https://www.googleapis.com/drive/v3';
let accessToken = null;
let tokenExpiry = null;

const getAccessToken = async () => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post('https://www.googleapis.com/oauth2/v4/token', {
      client_id: config.client_id,
      client_secret: config.client_secret,
      refresh_token: config.refresh_token,
      grant_type: 'refresh_token',
    });

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + 3500 * 1000; // Token expires in 1 hour
    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

const driveApi = axios.create({
  baseURL: BASE_URL,
});

driveApi.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const listFiles = async (folderId = 'root', pageToken = null) => {
  try {
    const params = {
      q: `'${folderId}' in parents and trashed = false AND name !='.password'`,
      orderBy: 'folder,name,modifiedTime desc',
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, fileExtension, iconLink, thumbnailLink)',
      pageSize: config.files_list_page_size,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      ...(pageToken && { pageToken }),
    };

    const response = await driveApi.get('/files', { params });
    
    // Sort folders first, then files
    response.data.files.sort((a, b) => {
      const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder';
      const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder';
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    return response.data;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

export const searchFiles = async (query, pageToken = null) => {
  try {
    const params = {
      q: `fullText contains '${query}' and trashed = false`,
      orderBy: 'folder,name,modifiedTime desc',
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, fileExtension, iconLink, thumbnailLink)',
      pageSize: config.search_result_list_page_size,
      supportsAllDrives: true,
      includeItemsFromAllDrives: config.search_all_drives,
      ...(pageToken && { pageToken }),
    };

    const response = await driveApi.get('/files', { params });
    
    // Sort folders first, then files
    response.data.files.sort((a, b) => {
      const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder';
      const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder';
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    return response.data;
  } catch (error) {
    console.error('Error searching files:', error);
    throw error;
  }
};

export const getFileMetadata = async (fileId) => {
  try {
    const response = await driveApi.get(`/files/${fileId}`, {
      params: {
        fields: 'id, name, mimeType, size, modifiedTime, fileExtension, iconLink, thumbnailLink, webContentLink',
        supportsAllDrives: true,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
};

export const getDownloadLink = async (fileId) => {
  try {
    const metadata = await getFileMetadata(fileId);
    const token = await getAccessToken();
    return `${BASE_URL}/files/${fileId}?alt=media&access_token=${token}`;
  } catch (error) {
    console.error('Error getting download link:', error);
    throw error;
  }
}; 