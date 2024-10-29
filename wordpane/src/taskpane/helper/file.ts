export const getBase64FromBlob = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string); // Remove the 'data:image/png;base64,' part
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const getBase64FromUrl = async (imageUrl: string): Promise<string> => {
  const response = await fetch(imageUrl);
  return getBase64FromBlob(await response.blob());
};
