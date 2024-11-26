import React, { useContext, useRef, useState, useEffect } from "react";
import { Alert, Button, Card, CardContent } from "@mui/material";
import { useAuthUser } from "react-auth-kit";
import { BidContext } from "./BidWritingStateManagerView";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import DescriptionIcon from "@mui/icons-material/Description";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArticleIcon from "@mui/icons-material/Article";
import ErrorIcon from "@mui/icons-material/Error";
import BidNavbar from "../routes/BidNavbar";
import SideBarSmall from "../routes/SidebarSmall";
import CircularProgress from "@mui/material/CircularProgress";
import { displayAlert } from "../helper/Alert";
import withAuth from "../routes/withAuth";
import posthog from "posthog-js";

const ProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const { sharedState } = useContext(BidContext);

  const loadPreview = async () => {
    try {
      console.log("Starting to load PDF preview...");

      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_proposal_pdf`,
        {
          bid_id: sharedState.object_id,
          extra_instructions: "",
          datasets: []
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          },
          responseType: "blob"
        }
      );

      console.log("Response received:", {
        size: response.data.size,
        type: response.data.type,
        status: response.status
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      setIsLoading(false);
    } catch (err) {
      console.error("Preview loading error:", err);
      setError("Failed to load the proposal preview");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [sharedState.object_id]);

  const handlePdfDownload = () => {
    if (pdfUrl) {
      posthog.capture("proposal_pdf_downloaded", {
        bidId: sharedState.object_id,
        bidName: sharedState.bidInfo
      });
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `proposal_${sharedState.bidInfo || "document"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleWordDownload = async () => {
    try {
      posthog.capture("proposal_word_downloaded", {
        bidId: sharedState.object_id,
        bidName: sharedState.bidInfo
      });
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_proposal`,
        {
          bid_id: sharedState.object_id,
          extra_instructions: "",
          datasets: []
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          },
          responseType: "blob"
        }
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `proposal_${sharedState.bidInfo || "document"}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Word download error:", err);
    }
  };

  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <div className="scroll-container">
          <BidNavbar
            showViewOnlyMessage={() =>
              displayAlert(
                "You only have permission to view this bid.",
                "danger"
              )
            }
            initialBidName={"initialBidName"}
          />
          <Card
            sx={{
              width: "100%",
              mt: 2,
              flex: 1,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <CardContent
              sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <DescriptionIcon />
                  <h3
                    style={{ fontSize: "1.2rem", fontWeight: 600, margin: 0 }}
                  >
                    Proposal Preview
                  </h3>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <Button
                    variant="outlined"
                    onClick={handleWordDownload}
                    startIcon={<ArticleIcon />}
                  >
                    Download Word
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handlePdfDownload}
                    startIcon={<FileDownloadIcon />}
                  >
                    Download PDF
                  </Button>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px"
                }}
              >
                {isLoading ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                      backgroundColor: "#f5f5f5"
                    }}
                  >
                    <CircularProgress />
                  </div>
                ) : pdfUrl ? (
                  <embed
                    src={`${pdfUrl}#toolbar=0&zoom=100&view=FitH`}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    style={{
                      border: "none",
                      overflow: "auto"
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                      backgroundColor: "#f5f5f5",
                      padding: "20px",
                      textAlign: "center"
                    }}
                  >
                    <p>Generate a Proposal to preview it here.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default withAuth(ProposalPreview);
