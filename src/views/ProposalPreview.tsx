import React, { useContext, useRef, useState, useEffect } from "react";
import { Button, Card, CardContent } from "@mui/material";
import { useAuthUser } from "react-auth-kit";
import { BidContext } from "./BidWritingStateManagerView";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import DescriptionIcon from "@mui/icons-material/Description";
import ArticleIcon from "@mui/icons-material/Article";
import BidNavbar from "../routes/BidNavbar";
import SideBarSmall from "../routes/SidebarSmall";
import CircularProgress from "@mui/material/CircularProgress";
import { displayAlert } from "../helper/Alert";
import withAuth from "../routes/withAuth";
import mammoth from "mammoth";

const ProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const { sharedState } = useContext(BidContext);

  const loadPreview = async () => {
    try {
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

      // Add style mapping options for mammoth
      const options = {
        styleMap: [
          "p[style-name='Title'] => h1.document-title",
          "p[style-name='Subtitle'] => p.document-subtitle",
          "p[style-name='Heading 1'] => h1",
          "p[style-name='Heading 2'] => h2"
        ]
      };

      const result = await mammoth.convertToHtml({ arrayBuffer }, options);
      setHtmlContent(`
        <style>
          h1.document-title {
            font-size: 42px;
            font-weight: normal;
            text-align: left;
            margin-bottom: 24px;
            font-family: Arial, sans-serif;
          }
          p.document-subtitle {
            font-size: 24px;
            margin-bottom: 40px;
          }
          h1 { font-size: 24px; margin-top: 24px; margin-bottom: 16px; }
          h2 { font-size: 18px; margin-top: 20px; margin-bottom: 12px; }
        </style>
        ${result.value}
      `);

      const url = URL.createObjectURL(response.data);
      setDocUrl(url);
      setIsLoading(false);
    } catch (err) {
      console.error("Preview loading error:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
    return () => {
      if (docUrl) {
        URL.revokeObjectURL(docUrl);
      }
    };
  }, [sharedState.object_id]);

  const handleWordDownload = async () => {
    if (docUrl) {
      const link = document.createElement("a");
      link.href = docUrl;
      link.download = `proposal_${sharedState.bidInfo || "document"}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
                  overflow: "auto",
                  backgroundColor: "#ffffff",
                  padding: "2rem 3rem"
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
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                    style={{
                      fontFamily: "Calibri, sans-serif",
                      fontSize: "11pt",
                      lineHeight: "1.5",
                      width: "100%",
                      margin: "0"
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
