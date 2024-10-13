declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_API_URL: string;
      REACT_APP_API_URL_PREFIX_HTTPS: string;
    }
  }
}

console.log('Environment variables at load time:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_API_URL_PREFIX_HTTPS: process.env.REACT_APP_API_URL_PREFIX_HTTPS
});

export const API_URL = process.env.REACT_APP_API_URL || 'localhost:7860';
export const HTTP_PREFIX = '';
export const placeholder_upload = `
Paste bid material here...
`;

console.log('Exported constants:', { API_URL, HTTP_PREFIX });