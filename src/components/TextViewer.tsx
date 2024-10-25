import React, { useState, useEffect, useRef } from "react";
import { Modal, Button } from "react-bootstrap";

const TextViewer = ({ show, onHide, textContent, searchTerm, snippet }) => {
  const [highlightedContent, setHighlightedContent] = useState("");
  const snippetRef = useRef(null);

  useEffect(() => {
    if (textContent) {
      let content = textContent;

      // Highlight the search term in yellow
      if (searchTerm) {
        const searchRegex = new RegExp(`(${searchTerm})`, "gi");
        content = content.replace(
          searchRegex,
          '<mark style="background-color: yellow;">$1</mark>'
        );
      }

      // Highlight the snippet in orange
      if (snippet) {
        const snippetRegex = new RegExp(
          `(${snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
          "gi"
        );
        content = content.replace(
          snippetRegex,
          '<mark id="snippet" style="background-color: orange;">$1</mark>'
        );
      }

      setHighlightedContent(content);
    }
  }, [textContent, searchTerm, snippet]);

  useEffect(() => {
    if (show && snippetRef.current) {
      snippetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [show, highlightedContent]);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Text Viewer</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          style={{
            width: "100%",
            height: "600px",
            overflow: "auto",
            whiteSpace: "pre-wrap"
          }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: highlightedContent }}
            ref={snippetRef}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TextViewer;
