import React, { useState, useEffect } from "react";
import { Editor, EditorState, ContentState } from "draft-js";
import "draft-js/dist/Draft.css";

const ExtraInstructionsEditor = ({
  initialContent,
  subheadingId,
  wordCount,
  onChange,
  readOnly = false
}) => {
  // Initialize editor state with the initial content
  const [editorState, setEditorState] = useState(() =>
    EditorState.createWithContent(ContentState.createFromText(initialContent))
  );

  // Update editor content when initialContent prop changes
  useEffect(() => {
    const content = ContentState.createFromText(initialContent);
    const newEditorState = EditorState.createWithContent(content);
    setEditorState(newEditorState);
  }, [initialContent]);

  const handleChange = (newState) => {
    setEditorState(newState);
    const plainText = newState.getCurrentContent().getPlainText();
    onChange(plainText, subheadingId, wordCount);
  };

  return (
    <div className="editor-container">
      <Editor
        editorState={editorState}
        onChange={handleChange}
        readOnly={readOnly}
        placeholder="Add extra information here about what you want to write about..."
      />
    </div>
  );
};

export default ExtraInstructionsEditor;
