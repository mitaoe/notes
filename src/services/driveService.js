import axios from 'axios';
import { config } from '../config';

const FOLDER_TYPE = 'application/vnd.google-apps.folder';

class GoogleDrive {
  constructor() {
    this.paths = {};
    this.paths['/'] = config.roots[0].id;
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
    try {
      const response = await axios.get('/api/files', {
        params: {
          path: parentId,
          folderName: folderName
        }
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

    try {
      const response = await axios.get('/api/files', {
        params: {
          path: folderId,
          pageToken
        }
      });

      // Process files
      const files = response.data.files.map(file => ({
        ...file,
        downloadUrl: file.mimeType === FOLDER_TYPE ? null : async () => {
          const response = await axios.get(`/api/stream?fileId=${file.id}`, {
            responseType: 'blob'
          });
          return response.data;
        }
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
      const response = await axios.get('/api/files', {
        params: {
          fileId
        }
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
    try {
      const response = await axios.get('/api/files', {
        params: {
          search: query,
          pageToken
        }
      });

      const files = response.data.files.map(file => ({
        ...file,
        downloadUrl: file.mimeType === FOLDER_TYPE ? null : async () => {
          const response = await axios.get(`/api/stream?fileId=${file.id}`, {
            responseType: 'blob'
          });
          return response.data;
        }
      }));

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

export default new GoogleDrive(); 