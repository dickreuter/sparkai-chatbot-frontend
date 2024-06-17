import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, Modifier, SelectionState } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { BidContext } from '../views/BidWritingStateManagerView.tsx';

function CustomEditor({ appendResponse }) {
    const { sharedState, setSharedState } = useContext(BidContext);
    
    const applyBoldToHeadings = useCallback((editorState) => {
        const blocks = editorState.getCurrentContent().getBlocksAsArray();
        let newContentState = editorState.getCurrentContent();
        blocks.forEach(block => {
            const text = block.getText();
            if (text.startsWith('Question:') || text.startsWith('Answer:')) {
                const blockKey = block.getKey();
                const range = new SelectionState({
                    anchorKey: blockKey,
                    anchorOffset: 0,
                    focusKey: blockKey,
                    focusOffset: text.length,
                });
                newContentState = Modifier.applyInlineStyle(newContentState, range, 'BOLD');
            }
        });
        return EditorState.push(editorState, newContentState, 'change-inline-style');
    }, []);

    const [editorState, setEditorState] = useState(() => applyBoldToHeadings(sharedState.editorState));

    const onEditorStateChange = useCallback((newEditorState) => {
        const styledEditorState = applyBoldToHeadings(newEditorState);
        setEditorState(styledEditorState);
        setSharedState(prevState => ({
            ...prevState,
            editorState: styledEditorState
        }));
    }, [setSharedState, applyBoldToHeadings]);

    const appendResponseAndStyle = useCallback((response) => {
        const currentContent = editorState.getCurrentContent();
        const currentContentBlock = currentContent.getBlockMap().last();
        const lengthOfLastBlock = currentContentBlock.getLength();
        const selectionState = new SelectionState({
            anchorKey: currentContentBlock.getKey(),
            anchorOffset: lengthOfLastBlock,
            focusKey: currentContentBlock.getKey(),
            focusOffset: lengthOfLastBlock,
        });

        const newText = `\nQuestion:\n${response.question}\n\nAnswer:\n${response.answer}\n\n`;
        let newContentState = Modifier.insertText(currentContent, selectionState, newText);
        return applyBoldToHeadings(EditorState.push(editorState, newContentState, 'insert-characters'));
    }, [editorState, applyBoldToHeadings]);

    // Handle appending responses
    useEffect(() => {
        if (appendResponse) {
            const newEditorState = appendResponseAndStyle(appendResponse);
            setEditorState(newEditorState);
            setSharedState(prevState => ({
                ...prevState,
                editorState: newEditorState
            }));
        }
    }, [appendResponse, appendResponseAndStyle, setSharedState]);

    return (
        <Editor
            editorState={editorState}
            onEditorStateChange={onEditorStateChange}
            toolbarClassName="toolbarClassName"
            wrapperClassName="wrapperClassName"
        />
    );
}

export default CustomEditor;
