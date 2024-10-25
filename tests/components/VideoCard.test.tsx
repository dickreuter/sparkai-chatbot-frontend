import React from "react";
import { render, screen } from "@testing-library/react";
import VideoCard from "../../src/components/VideoCard.tsx";
import { it, expect, describe } from "vitest";

const mockProps = {
  videoUrl: "http://example.com/video.mp4",
  videoTitle: "Sample Video",
  channelName: "Sample Channel",
  views: "1.2M views",
  time: "2 hours ago"
};

describe("VideoCard", () => {
  it("renders the VideoCard component correctly", () => {
    render(<VideoCard {...mockProps} />);

    // Check if video element is rendered
    const videoElement = screen.getByTestId("video-element");
    expect(videoElement).toBeInTheDocument();

    // Check if source element inside the video element has the correct src attribute
    const sourceElement = screen.getByTestId("video-source");
    expect(sourceElement).toBeInTheDocument();
    expect(sourceElement).toHaveAttribute("src", mockProps.videoUrl);

    // Check if channel name is displayed
    const channelNameElement = screen.getByText(mockProps.channelName);
    expect(channelNameElement).toBeInTheDocument();

    // Check if views are displayed
    const viewsElement = screen.getByText(mockProps.views);
    expect(viewsElement).toBeInTheDocument();

    // Check if avatar is rendered
    const avatarElement = screen.getByAltText("Channel Icon");
    expect(avatarElement).toBeInTheDocument();
    expect(avatarElement).toHaveAttribute(
      "src",
      "/src/resources/images/mytender.io_badge.png"
    );
  });
});
