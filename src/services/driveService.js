import axios from 'axios';
import { config } from '../config';

const BASE_URL = 'https://www.googleapis.com/drive/v3';
const FOLDER_TYPE = 'application/vnd.google-apps.folder';
const SHORTCUT_TYPE = 'application/vnd.google-apps.shortcut';
const DOCUMENT_TYPE = 'application/vnd.google-apps.document';
const SPREADSHEET_TYPE = 'application/vnd.google-apps.spreadsheet';
const FORM_TYPE = 'application/vnd.google-apps.form';
const SITE_TYPE = 'application/vnd.google-apps.site';

class GoogleDrive {
  constructor() {
    this.paths = {};
    this.files = {};
    this.accessToken = null;
    this.tokenExpiry = null;
    this.paths['/'] = config.roots[0].id;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post('https://www.googleapis.com/oauth2/v4/token', {
        client_id: config.client_id,
        client_secret: config.client_secret,
        refresh_token: config.refresh_token,
        grant_type: 'refresh_token',
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + 3500 * 1000; // Token expires in 1 hour
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async requestOptions(headers = {}, method = 'GET') {
    const token = await this.getAccessToken();
    return {
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
    };
  }

  async findPathId(path) {
    if (path === '/') {
      return config.roots[0].id;
    }

    // Remove leading and trailing slashes and split path
    const parts = path.split('/').filter(Boolean);
    let currentId = config.roots[0].id;

    for (const part of parts) {
      try {
        const decodedName = decodeURIComponent(part);
        const files = await this.listFolderContents(currentId, decodedName);
        
        if (!files || files.length === 0) {
          return null;
        }
        
        currentId = files[0].id;
      } catch (error) {
        console.error('Error finding path:', error);
        return null;
      }
    }

    return currentId;
  }

  async listFolderContents(parentId, folderName) {
    const params = {
      q: `'${parentId}' in parents and name = '${folderName}' and mimeType = '${FOLDER_TYPE}' and trashed = false`,
      fields: 'files(id, name, mimeType)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    };

    try {
      const response = await axios.get(`${BASE_URL}/files`, {
        params,
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
        },
      });

      return response.data.files;
    } catch (error) {
      console.error('Error listing folder contents:', error);
      return null;
    }
  }

  async listFiles(path, pageToken = null) {
    const folderId = await this.findPathId(path);
    
    if (!folderId) {
      return {
        files: [],
        nextPageToken: null,
      };
    }

    const params = {
      q: `'${folderId}' in parents and trashed = false AND name !='.password' and mimeType != '${SHORTCUT_TYPE}' and mimeType != '${DOCUMENT_TYPE}' and mimeType != '${SPREADSHEET_TYPE}' and mimeType != '${FORM_TYPE}' and mimeType != '${SITE_TYPE}'`,
      orderBy: 'folder,name,modifiedTime desc',
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, fileExtension, iconLink, thumbnailLink, parents, driveId)',
      pageSize: config.files_list_page_size,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: config.search_all_drives ? 'allDrives' : 'user',
      ...(pageToken && { pageToken }),
    };

    try {
      const response = await axios.get(`${BASE_URL}/files`, {
        params,
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
        },
      });

      // Process files
      const files = response.data.files.map((file) => ({
        ...file,
        link: file.mimeType !== FOLDER_TYPE ? `${BASE_URL}/files/${file.id}?alt=media` : null,
      }));

      return {
        files,
        nextPageToken: response.data.nextPageToken,
      };
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async generateDownloadLink(fileId) {
    return `${BASE_URL}/files/${fileId}?alt=media`;
  }

  async findPathById(fileId) {
    const parentFiles = [];
    let currentFile = await this.getFileMetadata(fileId);
    
    while (currentFile && currentFile.parents && currentFile.parents.length > 0) {
      parentFiles.unshift(currentFile);
      currentFile = await this.getFileMetadata(currentFile.parents[0]);
    }
    
    if (currentFile) {
      parentFiles.unshift(currentFile);
    }

    const path = parentFiles.map(file => encodeURIComponent(file.name)).join('/');
    return path ? '/' + path : '/';
  }

  async getFileMetadata(fileId) {
    try {
      const response = await axios.get(`${BASE_URL}/files/${fileId}`, {
        params: {
          fields: 'id, name, mimeType, size, modifiedTime, parents, driveId',
          supportsAllDrives: true,
        },
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  formatSearchKeyword(keyword) {
    if (!keyword) return '';
    return keyword
      .replace(/(!=)|['"=<>/\\:]/g, '')
      .replace(/[,，|(){}]/g, ' ')
      .trim();
  }

  async searchFiles(query, pageToken = null) {
    const formattedQuery = this.formatSearchKeyword(query);
    if (!formattedQuery) {
      return {
        nextPageToken: null,
        data: {
          files: [],
        },
      };
    }

    const words = formattedQuery.split(/\s+/);
    const nameSearchStr = `name contains '${words.join("' AND name contains '")}'`;

    const params = {
      q: `trashed = false AND mimeType != '${SHORTCUT_TYPE}' and mimeType != '${DOCUMENT_TYPE}' and mimeType != '${SPREADSHEET_TYPE}' and mimeType != '${FORM_TYPE}' and mimeType != '${SITE_TYPE}' AND name !='.password' AND (${nameSearchStr})`,
      orderBy: 'folder,name,modifiedTime desc',
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime)',
      pageSize: config.search_result_list_page_size,
      supportsAllDrives: true,
      includeItemsFromAllDrives: config.search_all_drives,
      corpora: config.search_all_drives ? 'allDrives' : 'user',
      ...(pageToken && { pageToken }),
    };

    try {
      const response = await axios.get(`${BASE_URL}/files`, {
        params,
        headers: {
          Authorization: `Bearer ${await this.getAccessToken()}`,
        },
      });

      // Remove file ID encryption
      const files = response.data.files;
      
      return {
        nextPageToken: response.data.nextPageToken,
        data: {
          files,
        },
      };
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }
}

const driveService = new GoogleDrive();
export default driveService; 