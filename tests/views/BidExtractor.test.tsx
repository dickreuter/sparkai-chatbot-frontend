// BidExtractor.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { BidContext } from "../../src/views/BidWritingStateManagerView";
import BidExtractor from "../../src/views/BidExtractor";
import { AuthProvider } from "react-auth-kit";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mock = new MockAdapter(axios);

const renderWithContext = (ui, { contextValue } = {}) => {
  return render(
    <AuthProvider authType={"cookie"} authName={"auth"}>
      <MemoryRouter>
        <BidContext.Provider value={contextValue}>{ui}</BidContext.Provider>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe("BidExtractor Component", () => {
  const contextValue = {
    sharedState: {
      bidInfo: "Test Bid",
      opportunity_information: "",
      compliance_requirements: "",
      questions: "",
      bid_qualification_result: "",
      client_name: "",
      opportunity_owner: "",
      submission_deadline: "",
      bid_manager: "",
      contributors: ""
    },
    setSharedState: vi.fn(),
    getBackgroundInfo: vi.fn()
  };

  beforeEach(() => {
    mock.reset();
  });

  it("should render the component", () => {
    renderWithContext(<BidExtractor />, { contextValue });

    expect(screen.getByText(/Test Bid/i)).toBeInTheDocument();
    expect(screen.getByText(/Retrieve Questions/i)).toBeInTheDocument();
  });

  it("should handle file upload and extract questions", async () => {
    const extractedQuestions = ["Question 1", "Question 2", "Question 3"];
    mock
      .onPost(`/http://localhost:8000/extract_questions_from_pdf`)
      .reply(200, extractedQuestions);

    renderWithContext(<BidExtractor />, { contextValue });

    const fileInput = screen.getByLabelText(/Retrieve Questions/i);
    const file = new File(["dummy content"], "example.pdf", {
      type: "application/pdf"
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(mock.history.post.length).toBe(1));
    expect(contextValue.setSharedState).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: extractedQuestions.join(",")
      })
    );
  });

  it("should handle bid name editing and validation", () => {
    renderWithContext(<BidExtractor />, { contextValue });

    const editButton = screen.getByText(/edit/i);
    fireEvent.click(editButton);

    const bidNameSpan = screen.getByText(/Test Bid/i);
    fireEvent.input(bidNameSpan, { target: { innerText: "New Bid Name" } });
    fireEvent.blur(bidNameSpan);

    expect(contextValue.setSharedState).toHaveBeenCalledWith(
      expect.objectContaining({
        bidInfo: "New Bid Name"
      })
    );
  });
});
