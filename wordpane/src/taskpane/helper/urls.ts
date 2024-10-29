import { API_URL, HTTP_PREFIX } from "./Constants";

export const apiURL = (path: string) => {
  return `http${HTTP_PREFIX}://${API_URL}/${path}`;
};
