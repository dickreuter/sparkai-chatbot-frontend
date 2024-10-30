export const apiURL = (path: string) => {
  return `${process.env.REACT_APP_API_URL}/${path}`;
};
