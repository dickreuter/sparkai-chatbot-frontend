import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import Bids from "../Bids";
import { API_URL, HTTP_PREFIX } from "../../helper/Constants";

// Create the mock before using it
jest.mock("axios", () => {
  const mockPost = jest.fn();
  return {
    post: mockPost,
    isAxiosError: (err: unknown) =>
      err && typeof err === "object" && "isAxiosError" in err,
    __esModule: true,
    default: {
      post: mockPost
    }
  };
});

// Get reference to the mocked function
const mockPost = axios.post as jest.Mock;

// Mock modules
jest.mock("react-auth-kit", () => ({
  useAuthUser: () => () => ({ token: "mock-token" }),
  useIsAuthenticated: () => () => true
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate
}));

jest.mock("../../helper/Constants", () => ({
  API_URL: "dev.mytender.io:7861",
  HTTP_PREFIX: "",
  placeholder_upload: "Paste bid material here..."
}));

describe("Bids Component API Calls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getBidsList", () => {
    it("should fetch bids list successfully", async () => {
      const mockBids = [
        {
          _id: "1",
          bid_title: "Test Bid",
          status: "ongoing" as const,
          timestamp: "2024-01-01"
        }
      ];

      mockPost.mockResolvedValueOnce({
        data: { bids: mockBids }
      });

      render(
        <BrowserRouter>
          <Bids />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith(
          `http${HTTP_PREFIX}://${API_URL}/get_bids_list/`,
          {},
          {
            headers: {
              Authorization: "Bearer mock-token"
            }
          }
        );
      });

      expect(screen.getByText("Test Bid")).toBeInTheDocument();
    });

    it("should handle getBidsList error", async () => {
      const consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockPost.mockRejectedValueOnce(new Error("Failed to fetch"));

      render(
        <BrowserRouter>
          <Bids />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });
});
