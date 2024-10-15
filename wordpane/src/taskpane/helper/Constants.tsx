// src/config.ts

// Type declarations for environment variables
declare global {
  interface Window {
    process?: {
      env: {
        REACT_APP_API_URL?: string;
        REACT_APP_API_URL_PREFIX_HTTPS?: string;
      }
    }
  }
}

// Safe access to environment variables
const getEnvVar = (key: string): string => {
  if (typeof window !== 'undefined' && window.process && window.process.env) {
    return window.process.env[key] || '';
  }
  return '';
};

console.log('Environment variables at load time:', {
  REACT_APP_API_URL: getEnvVar('REACT_APP_API_URL'),
  REACT_APP_API_URL_PREFIX_HTTPS: getEnvVar('REACT_APP_API_URL_PREFIX_HTTPS')
});

export const API_URL = getEnvVar('REACT_APP_API_URL') || 'localhost:7860';
export const HTTP_PREFIX = '';
export const placeholder_upload = `
Paste bid material here...
`;

console.log('Exported constants:', { API_URL, HTTP_PREFIX });