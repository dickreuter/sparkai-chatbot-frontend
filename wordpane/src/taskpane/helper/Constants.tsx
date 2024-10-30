// src/config.ts

// Type declarations for environment variables
declare global {
  interface Window {
    process?: {
      env: {
        REACT_APP_API_URL?: string;
        REACT_APP_API_URL_PREFIX_HTTPS?: string;
      };
    };
  }
}

// Safe access to environment variables
export const getEnvVar = (key: string): string => {
  if (typeof window !== "undefined" && window.process && window.process.env) {
    return window.process.env[key] || "";
  }
  return "";
};

export const placeholder_upload = `
Paste bid material here...
`;
