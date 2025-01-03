import { describe, it, expect, beforeAll, vi } from "vitest";
import { getAuthenticatedAxios } from "../../test/setup";

describe("Bids Component", () => {
  it(
    "fetches bids from API",
    async () => {
      const axiosInstance = await getAuthenticatedAxios();

      const bidsResponse = await axiosInstance.post(
        `https://dev.mytender.io:7861/get_bids_list/`,
        {}
      );

      expect(bidsResponse.status).toBe(200);
      expect(bidsResponse.data).toHaveProperty("bids");
      expect(Array.isArray(bidsResponse.data.bids)).toBe(true);
    },
    { timeout: 15000 }
  );
});
