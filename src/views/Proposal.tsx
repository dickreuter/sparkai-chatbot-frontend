import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import SideBarSmall from "../routes/SidebarSmall.tsx";
import { Button, Row } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import ProposalEditor from "./ProposalEditor.tsx";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import {
  EditorState,
  convertToRaw,
  convertFromRaw,
  ContentState
} from "draft-js";
import "./Proposal.css";
import { BidContext } from "./BidWritingStateManagerView.tsx";
import { TabProvider } from "../routes/TabProvider.tsx";
import BidCompilerWizard from "../wizards/BidCompilerWizard.tsx";

const Proposal = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const { sharedState, saveProposal } = useContext(BidContext);
  const { bidInfo, contributors } = sharedState;

  const [isLoading, setIsLoading] = useState(false);
  const [appendResponse, setAppendResponse] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState("-1");
  const [isSaved, setIsSaved] = useState(false);

  const typingTimeout = useRef(null);

  const currentUserPermission = contributors[auth.email] || "viewer";
  const canUserEdit =
    currentUserPermission === "admin" || currentUserPermission === "editor";

  const exportToDocx = (editorState) => {
    if (!editorState) {
      console.error("No editor state available");
      return;
    }

    const contentState = editorState.getCurrentContent();
    const contentText = contentState.getPlainText("\n");

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: contentText.split("\n").map(
            (line) =>
              new Paragraph({
                children: [new TextRun(line)]
              })
          )
        }
      ]
    });

    Packer.toBlob(doc)
      .then((blob) => {
        saveAs(blob, "proposal.docx");
      })
      .catch((err) => {
        console.error("Error creating DOCX:", err);
      });
  };

  const handleSaveProposal = async () => {
    setIsLoading(true);
    setIsSaved(false);
    await saveProposal();
    setIsLoading(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); // Reset after 3 seconds
  };

  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <div className="scroll-container">
          <BidNavbar />
          <TabProvider>
            <ProposalEditor
              bidData={
                sharedState.documents[sharedState.currentDocumentIndex]
                  ?.editorState
              }
              appendResponse={appendResponse}
              selectedQuestionId={selectedQuestionId}
              setSelectedQuestionId={setSelectedQuestionId}
            />
          </TabProvider>
          <Row>
            <div className="mb-2">
              <Button
                variant={"primary"}
                onClick={() =>
                  exportToDocx(
                    sharedState.documents[sharedState.currentDocumentIndex]
                      ?.editorState
                  )
                }
                className="ml-2 upload-button"
              >
                Export to Word
              </Button>
              <Button
                style={{ marginLeft: "5px" }}
                onClick={handleSaveProposal}
                className="save-button"
                disabled={isLoading || !canUserEdit}
              >
                {isSaved ? "Saved" : "Save Document"}
              </Button>
            </div>
          </Row>
        </div>
      </div>
      {/* <BidCompilerWizard /> */}
    </div>
  );
};

export default withAuth(Proposal);
