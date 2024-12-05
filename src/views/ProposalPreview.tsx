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
import mammoth from "mammoth";

const ProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const { sharedState } = useContext(BidContext);

  const loadPreview = async () => {
    try {
      console.log("Starting to load Word preview...");

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

      const arrayBuffer = await response.data.arrayBuffer();

      const options = {
        arrayBuffer,
        styleMap: [
          "p[style-name='Normal'] => p.normal-text:fresh",
          "p[style-name='Heading 1'] => h1.main-header:fresh",
          "p[style-name='Heading 2'] => h2.sub-header:fresh",
          "b => strong"
        ]
      };

      const result = await mammoth.convertToHtml(options);
      console.log("Conversion result:", result);
      console.log("Warnings:", result.messages);

      const styledContent = `
        <style>
          div[class*="proposal-preview"] h1.main-header {
            font-size: 24px !important;
            font-weight: bold !important;
            margin-top: 24px !important;
            margin-bottom: 12px !important;
            color: #333 !important;
          }
          
          div[class*="proposal-preview"] h2.sub-header {
            font-size: 18px !important;
            font-weight: bold !important;
            margin-top: 18px !important;
            margin-bottom: 9px !important;
            color: #444 !important;
          }
          
          div[class*="proposal-preview"] p.normal-text {
            font-size: 14px !important;
            line-height: 1.6 !important;
            margin-bottom: 12px !important;
            color: #555 !important;
          }
          
          div[class*="proposal-preview"] strong {
            font-weight: bold !important;
          }
        </style>
        ${result.value}
      `;

      setHtmlContent(styledContent);
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
      if (htmlContent) {
        window.URL.revokeObjectURL(htmlContent);
      }
    };
  }, [sharedState.object_id]);

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
              flexDirection: "column",
              height: "calc(100vh - 120px)"
            }}
          >
            <CardContent
              sx={{
                p: 3,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
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
                <Button
                  variant="outlined"
                  onClick={handleWordDownload}
                  startIcon={<ArticleIcon />}
                >
                  Download Word
                </Button>
              </div>

              <div
                style={{
                  flex: 1,
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  overflow: "hidden",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  flexDirection: "column"
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
                ) : htmlContent ? (
                  <div
                    style={{
                      flex: 1,
                      overflow: "auto",
                      padding: "20px"
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                      style={{
                        maxWidth: "1400px",
                        margin: "0 auto",
                        fontFamily: "Calibri, sans-serif",
                        padding: "20px"
                      }}
                      className="proposal-preview-container"
                    />
                  </div>
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
