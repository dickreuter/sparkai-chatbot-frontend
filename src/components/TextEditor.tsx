import React, { useContext, useEffect, useCallback, useState } from "react";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, Modifier, SelectionState } from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { BidContext } from "../views/BidWritingStateManagerView.tsx";
import { debounce } from "lodash"; // Make sure to install lodash if not already present

function CustomEditor({
  editorState,
  setEditorState,
  appendResponse,
  disabled
}) {
  const { setSharedState } = useContext(BidContext);
  const [localEditorState, setLocalEditorState] = useState(editorState);

  useEffect(() => {
    setLocalEditorState(editorState);
  }, [editorState]);

  // Function to apply bold to "Question:" and "Answer:" headings
  const applyBoldToHeadings = useCallback((editorState) => {
    const blocks = editorState.getCurrentContent().getBlocksAsArray();
    let newContentState = editorState.getCurrentContent();
    let modified = false;

    blocks.forEach((block) => {
      const text = block.getText();
      if (text.startsWith("Question:") || text.startsWith("Answer:")) {
        const blockKey = block.getKey();
        const range = SelectionState.createEmpty(blockKey).merge({
          anchorOffset: 0,
          focusOffset: text.indexOf(":") + 1
        });
        newContentState = Modifier.applyInlineStyle(
          newContentState,
          range,
          "BOLD"
        );
        modified = true;
      }
    });

    return modified
      ? EditorState.push(editorState, newContentState, "change-inline-style")
      : editorState;
  }, []);

  // Debounced function to update shared state
  const debouncedUpdateSharedState = useCallback(
    debounce((newEditorState) => {
      setSharedState((prevState) => ({
        ...prevState,
        documents: prevState.documents.map((doc, index) =>
          index === prevState.currentDocumentIndex
            ? { ...doc, editorState: newEditorState }
            : doc
        )
      }));
    }, 500),
    [setSharedState]
  );

  // Handle editor state changes
  const onEditorStateChange = useCallback(
    (newEditorState) => {
      const styledState = applyBoldToHeadings(newEditorState);
      setLocalEditorState(styledState);
      setEditorState(styledState);
      debouncedUpdateSharedState(styledState);
    },
    [setEditorState, debouncedUpdateSharedState, applyBoldToHeadings]
  );

  // Append response and reapply styles
  useEffect(() => {
    if (appendResponse) {
      const newEditorState = appendResponseAndStyle(
        localEditorState,
        appendResponse
      );
      setLocalEditorState(newEditorState);
      setEditorState(newEditorState);
      debouncedUpdateSharedState(newEditorState);
    }
  }, [
    appendResponse,
    localEditorState,
    setEditorState,
    debouncedUpdateSharedState
  ]);

  // Function to append response text and apply styles
  const appendResponseAndStyle = useCallback(
    (editorState, response) => {
      const currentContent = editorState.getCurrentContent();
      const lastBlock = currentContent.getBlockMap().last();
      const lengthOfLastBlock = lastBlock.getLength();
      const selectionState = SelectionState.createEmpty(
        lastBlock.getKey()
      ).merge({
        anchorOffset: lengthOfLastBlock,
        focusOffset: lengthOfLastBlock
      });
      let newContentState = Modifier.insertText(
        currentContent,
        selectionState,
        `\nQuestion:\n${response.question}\n\nAnswer:\n${response.answer}\n\n`
      );
      return applyBoldToHeadings(
        EditorState.push(editorState, newContentState, "insert-characters")
      );
    },
    [applyBoldToHeadings]
  );

  return (
    <Editor
      editorState={localEditorState}
      onEditorStateChange={onEditorStateChange}
      toolbarClassName="toolbarClassName"
      wrapperClassName="wrapperClassName"
      readOnly={disabled}
      toolbarHidden={disabled}
    />
  );
}

export default CustomEditor;
