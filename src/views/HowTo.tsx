import React, { useState, useEffect } from "react";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import SideBarSmall from "../routes/SidebarSmall.tsx";
import VideoCard from "../components/VideoCard.tsx";
import "./HowTo.css";
import "./Chatbot.css";
import BidResponseProposal from "../resources/videos/BidResponseProposal.mp4";
import BidPlannerV1 from "../resources/videos/BidPlanner.mp4";
import CompanyLibrarySecurity from "../resources/videos/CompanyLibarySecurity.mp4";
import CompanyLibraryV1 from "../resources/videos/CompanyLibary.mp4";
import DashboardBidRegistrar from "../resources/videos/DashboardBidRegister.mp4";
import IntroBest from "../resources/videos/Introduction.mp4";
import QAChatFunction from "../resources/videos/Q&AChatFunction.mp4";
import Spinner from "react-bootstrap/Spinner"; // Ensure you have react-bootstrap installed

const HowTo = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();

  const videoData = [
    {
      videoUrl: IntroBest,
      videoTitle: "Introduction to mytender.io",
      channelName: "Intro",
      views: "An introduction to mytender.io",
      time: "3:45"
    },
    {
      videoUrl: DashboardBidRegistrar,
      videoTitle: "Dashboard Navigation",
      channelName: "Dashboard + Bid Registrar",
      views: "Learn how to navigate the platform",
      time: "5:30"
    },
    {
      videoUrl: BidPlannerV1,
      videoTitle: "Bid Planner Guide",
      channelName: "Bid Planner",
      views: "Start writing a proposal",
      time: "4:20"
    },
    {
      videoUrl: BidResponseProposal,
      videoTitle: "Bid Response & Proposal",
      channelName: "Bid Response + Proposal",
      views: "How to write your tender",
      time: "6:10"
    },
    {
      videoUrl: CompanyLibrarySecurity,
      videoTitle: "Data Security Overview",
      channelName: "Data Security",
      views: "How we make sure your data is secure",
      time: "2:45"
    },
    {
      videoUrl: CompanyLibraryV1,
      videoTitle: "Company Library Usage",
      channelName: "Company Library",
      views: "Upload documents to mytender.io",
      time: "3:55"
    },
    {
      videoUrl: QAChatFunction,
      videoTitle: "Q&A Chat Function",
      channelName: "Q&A Chat Function",
      views: "Quickly retrieve information from your library",
      time: "4:05"
    }
  ];

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time by using a timeout
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); // Adjust this delay as necessary

    return () => clearTimeout(timer); // Clean up the timer if the component unmounts
  }, []);

  if (loading) {
    return (
      <div>
        <SideBarSmall />
        <div className="loading-container">
          <div style={{ marginLeft: "8%" }}>
            <Spinner animation="border" className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chatpage">
      <SideBarSmall />

      <div className="lib-container">
        <div className="scroll-container">
          <h1 className="heavy">How To</h1>

          <div className="howto-container mt-1">
            <div className="row">
              {videoData.map((video, index) => (
                <div className="col-lg-4 col-md-6 col-sm-12 mb-4" key={index}>
                  <VideoCard
                    videoUrl={video.videoUrl}
                    videoTitle={video.videoTitle}
                    channelName={video.channelName}
                    views={video.views}
                    time={video.time}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(HowTo);
