export const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "dev.mytender.io:7861";
export const HTTP_PREFIX = import.meta.env.VITE_REACT_APP_API_URL_PREFIX_HTTPS
  ? ""
  : "s";

export const placeholder_upload = `
Paste bid material here...
    `;
