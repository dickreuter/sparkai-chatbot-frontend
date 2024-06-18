import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import { Button, Row } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import ProposalEditor from "./ProposalEditor.tsx";
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { EditorState, convertToRaw, convertFromRaw, ContentState } from 'draft-js';
import "./Proposal.css";
import { BidContext } from "./BidWritingStateManagerView.tsx";

const Proposal = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const { sharedState, setSharedState } = useContext(BidContext);
  const { bidInfo, backgroundInfo, editorState } = sharedState;

  const [isLoading, setIsLoading] = useState(false);
  const [appendResponse, setAppendResponse] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState("-1");
  


  const exportToDocx = (editorState) => {
    if (!editorState) {
      console.error("No editor state available");
      return;
    }
  
    const contentState = editorState.getCurrentContent();
    const contentText = contentState.getPlainText('\n');
  
    const doc = new Document({
      sections: [{
        properties: {},
        children: contentText.split('\n').map(line => new Paragraph({
          children: [new TextRun(line)]
        }))
      }]
    });
  
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, 'proposal.docx');
    }).catch(err => {
      console.error('Error creating DOCX:', err);
    });
  };
  

  

  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
      <BidNavbar />
        <ProposalEditor
              bidData={editorState}
              appendResponse={appendResponse}
              selectedQuestionId={selectedQuestionId}
              setSelectedQuestionId={setSelectedQuestionId}
            />
        <Row>
          <div className="mb-4">
            <Button
              variant={"primary"}
              onClick={() => exportToDocx(editorState)}
              className="mt-1 ml-2 upload-button"
              disabled={isLoading}
              style={{ marginLeft: "5px", backgroundColor: "black" }}
            >
              Export to Word
            </Button>

          </div>
        </Row>
      </div>
    </div>
  );
};

export default withAuth(Proposal);
