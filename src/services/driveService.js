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

const FOLDER_TYPE = 'application/vnd.google-apps.folder';
const SHORTCUT_TYPE = 'application/vnd.google-apps.shortcut';
const DOCUMENT_TYPE = 'application/vnd.google-apps.document';
const SPREADSHEET_TYPE = 'application/vnd.google-apps.spreadsheet';
const FORM_TYPE = 'application/vnd.google-apps.form';
const SITE_TYPE = 'application/vnd.google-apps.site';

export const listFiles = async (folderId = 'root', pageToken = null) => {
  try {
    const params = {
      q: `'${folderId}' in parents and trashed = false AND name !='.password' and mimeType != '${SHORTCUT_TYPE}' and mimeType != '${DOCUMENT_TYPE}' and mimeType != '${SPREADSHEET_TYPE}' and mimeType != '${FORM_TYPE}' and mimeType != '${SITE_TYPE}'`,
      orderBy: 'folder,name,modifiedTime desc',
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, fileExtension, iconLink, thumbnailLink, parents, md5Checksum)',
      pageSize: config.files_list_page_size,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: config.search_all_drives ? 'allDrives' : 'user',
      ...(pageToken && { pageToken }),
    };

    const response = await driveApi.get('/files', { params });
    
    // Sort folders first, then files
    response.data.files.sort((a, b) => {
      const aIsFolder = a.mimeType === FOLDER_TYPE;
      const bIsFolder = b.mimeType === FOLDER_TYPE;
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
      q: `fullText contains '${query}' and trashed = false and mimeType != '${SHORTCUT_TYPE}' and mimeType != '${DOCUMENT_TYPE}' and mimeType != '${SPREADSHEET_TYPE}' and mimeType != '${FORM_TYPE}' and mimeType != '${SITE_TYPE}'`,
      orderBy: 'folder,name,modifiedTime desc',
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, fileExtension, iconLink, thumbnailLink, parents, md5Checksum)',
      pageSize: config.search_result_list_page_size,
      supportsAllDrives: true,
      includeItemsFromAllDrives: config.search_all_drives,
      corpora: config.search_all_drives ? 'allDrives' : 'user',
      ...(pageToken && { pageToken }),
    };

    const response = await driveApi.get('/files', { params });
    
    // Sort folders first, then files
    response.data.files.sort((a, b) => {
      const aIsFolder = a.mimeType === FOLDER_TYPE;
      const bIsFolder = b.mimeType === FOLDER_TYPE;
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
        fields: 'id, name, mimeType, size, modifiedTime, fileExtension, iconLink, thumbnailLink, webContentLink, parents, md5Checksum',
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
    const token = await getAccessToken();
    return `${BASE_URL}/files/${fileId}?alt=media&access_token=${token}`;
  } catch (error) {
    console.error('Error getting download link:', error);
    throw error;
  }
};

export const findPathById = async (fileId) => {
  try {
    const response = await driveApi.get(`/files/${fileId}`, {
      params: {
        fields: 'id, name, parents',
        supportsAllDrives: true,
      },
    });

    const file = response.data;
    if (!file.parents) {
      return [file.name];
    }

    const parentPath = await findPathById(file.parents[0]);
    return [...parentPath, file.name];
  } catch (error) {
    console.error('Error finding path:', error);
    throw error;
  }
}; 