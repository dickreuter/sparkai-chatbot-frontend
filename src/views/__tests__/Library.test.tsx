import { describe, it, expect, beforeAll, vi } from "vitest";
import { getAuthenticatedAxios } from "../../test/setup";

const authenticatedAxios = await getAuthenticatedAxios();

describe("Library Component", () => {
  it("fetches collections from API", async () => {
    const collectionsResponse = await authenticatedAxios.post(
      `https://dev.mytender.io:7861/get_collections`,
      {},
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    // Log response for debugging
    console.log("API Response status:", collectionsResponse.status);
    console.log(
      "Number of collections:",
      collectionsResponse.data.collections?.length || 0
    );

    // Basic assertions on the API response
    expect(collectionsResponse.status).toBe(200);
    expect(collectionsResponse.data).toHaveProperty("collections");
    expect(Array.isArray(collectionsResponse.data.collections)).toBe(true);
  });

  it("fetches folder contents from API", async () => {
    const folderContentsResponse = await authenticatedAxios.post(
      `https://dev.mytender.io:7861/get_folder_filenames`,
      { collection_name: "default" },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    // Log response for debugging
    console.log("API Response status:", folderContentsResponse.status);
    console.log("Folder contents:", folderContentsResponse.data);

    // Basic assertions on the API response
    expect(folderContentsResponse.status).toBe(200);
    expect(Array.isArray(folderContentsResponse.data)).toBe(true);

    // Check if each item has the required properties
    if (folderContentsResponse.data.length > 0) {
      const firstItem = folderContentsResponse.data[0];
      expect(firstItem).toHaveProperty("meta");
      expect(firstItem).toHaveProperty("unique_id");
    }
  });

  //   it("creates a test folder", async () => {
  //     // Create a new axios instance with multipart/form-data content type

  //     const testFolderName = `test_folder_${Date.now()}`;
  //     const formData = new FormData();
  //     formData.append("folder_name", testFolderName);

  //     // Create folder
  //     const createResponse = await authenticatedAxios.post(
  //       `https://dev.mytender.io:7861/create_upload_folder`,
  //       formData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data"
  //         }
  //       }
  //     );

  //     expect(createResponse.status).toBe(200);

  //     console.log("createdfolder")
  //     const deleteFormData = new FormData();
  //     deleteFormData.append("profile_name", testFolderName);

  //     const deleteResponse = await authenticatedAxios.post(
  //       `https://dev.mytender.io:7861/delete_template/`,
  //       deleteFormData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data"
  //         }
  //       }
  //     );
  //     console.log(deleteResponse);

  //     expect(deleteResponse.data).toHaveProperty("message");
  //     expect(deleteResponse.data.message).toBe(
  //       `Deleted folder '${testFolderName}' and all its subfolders.`
  //     );

  //   }, 50000);
});
