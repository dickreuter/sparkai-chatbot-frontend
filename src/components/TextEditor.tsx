import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, Modifier, SelectionState } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { BidContext } from '../views/BidWritingStateManagerView.tsx';

function CustomEditor({ appendResponse }) {
    const { sharedState, setSharedState } = useContext(BidContext);
    
    // Function to apply bold to "Question:" and "Answer:" headings
    const applyBoldToHeadings = useCallback((editorState) => {
        const blocks = editorState.getCurrentContent().getBlocksAsArray();
        let newContentState = editorState.getCurrentContent();
        blocks.forEach(block => {
            const text = block.getText();
            if (text.startsWith('Question:') || text.startsWith('Answer:')) {
                const blockKey = block.getKey();
                const range = SelectionState.createEmpty(blockKey).merge({
                    anchorOffset: 0,
                    focusOffset: text.length,
                });
                newContentState = Modifier.applyInlineStyle(newContentState, range, 'BOLD');
            }
        });
        return EditorState.push(editorState, newContentState, 'change-inline-style');
    }, []);

    // State to manage the editor state locally
    const [editorState, setEditorState] = useState(() => applyBoldToHeadings(sharedState.editorState));

    // Update local editor state when shared state updates
    useEffect(() => {
        setEditorState(applyBoldToHeadings(sharedState.editorState));
    }, [sharedState.editorState, applyBoldToHeadings]);

    // Handle editor state changes
    const onEditorStateChange = useCallback((newEditorState) => {
        const styledState = applyBoldToHeadings(newEditorState);
        setEditorState(styledState);
        setSharedState(prevState => ({
            ...prevState,
            editorState: styledState
        }));
    }, [setSharedState, applyBoldToHeadings]);

    // Append response and reapply styles
    useEffect(() => {
        if (appendResponse) {
            const newEditorState = appendResponseAndStyle(editorState, appendResponse);
            setEditorState(newEditorState);
            setSharedState(prevState => ({
                ...prevState,
                editorState: newEditorState
            }));
        }
    }, [appendResponse, editorState, setSharedState]);

    // Function to append response text and apply styles
    const appendResponseAndStyle = useCallback((editorState, response) => {
        const currentContent = editorState.getCurrentContent();
        const lastBlock = currentContent.getBlockMap().last();
        const lengthOfLastBlock = lastBlock.getLength();
        const selectionState = SelectionState.createEmpty(lastBlock.getKey()).merge({
            anchorOffset: lengthOfLastBlock,
            focusOffset: lengthOfLastBlock,
        });

        let newContentState = Modifier.insertText(
            currentContent,
            selectionState,
            `\nQuestion:\n${response.question}\n\nAnswer:\n${response.answer}\n\n`
        );

        return applyBoldToHeadings(EditorState.push(editorState, newContentState, 'insert-characters'));
    }, [applyBoldToHeadings]);

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
