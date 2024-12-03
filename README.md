# Google Drive Index

A modern React-based Google Drive Index application that allows you to browse and search your Google Drive files through a web interface. Built with Vite, React, and Mantine UI.

## Features

- 📁 Browse files and folders in your Google Drive
- 🔍 Powerful search functionality
- ⬇️ File download support
- 📱 Responsive design (mobile-friendly)
- 🌙 Dark mode
- 🗺️ Breadcrumb navigation
- 📄 Pagination support
- 🎥 Video player support
- 🔒 Secure configuration with environment variables

## Prerequisites

- Node.js 16 or higher
- A Google Cloud Project with Drive API enabled
- Google OAuth 2.0 credentials

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gdrive-index.git
   cd gdrive-index
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your Google Drive API credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the Google Drive API
   - Create OAuth 2.0 credentials (Web application type)
   - Add authorized redirect URIs for your domain
   - Download the client credentials

4. Get your refresh token:
   - Use the OAuth 2.0 Playground or any other method to get a refresh token
   - Make sure to authorize with the required Drive API scopes:
     - https://www.googleapis.com/auth/drive
     - https://www.googleapis.com/auth/drive.file
     - https://www.googleapis.com/auth/drive.readonly

5. Create your environment file:
   ```bash
   cp .env.example .env
   ```
   Then edit .env with your Google credentials:
   ```env
   VITE_GOOGLE_CLIENT_ID="your-client-id"
   VITE_GOOGLE_CLIENT_SECRET="your-client-secret"
   VITE_GOOGLE_REFRESH_TOKEN="your-refresh-token"
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Add your environment variables in the Vercel project settings.

### Other Platforms

The application can be deployed to any platform that supports Node.js applications:

1. Build the application:
   ```bash
   npm run build
   ```

2. The build output will be in the `dist` directory.

## Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_GOOGLE_CLIENT_ID | Your Google OAuth 2.0 client ID |
| VITE_GOOGLE_CLIENT_SECRET | Your Google OAuth 2.0 client secret |
| VITE_GOOGLE_REFRESH_TOKEN | Your Google OAuth 2.0 refresh token |

## Security

- Never commit your `.env` file to version control
- Keep your Google API credentials secure
- Regularly rotate your refresh token
- Use environment variables for all sensitive data

## Technologies Used

- React 18
- Vite
- Mantine UI
- React Router
- Axios
- Google Drive API

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Acknowledgments

- Based on the original Google Drive Index project
- Icons by Tabler Icons
- UI components by Mantine
