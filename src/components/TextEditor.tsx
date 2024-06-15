import React, { useEffect, useRef, useContext, useState, useCallback } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, convertFromRaw, Modifier, SelectionState } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { BidContext } from '../views/BidWritingStateManagerView.tsx';
import { useDebouncedCallback } from './useDebouncedCallback.tsx';
// Import debounce hook

function CustomEditor({ bidText, appendResponse }) {
    const { setSharedState } = useContext(BidContext);
    const appendedIds = useRef(new Set()); // Track IDs of appended responses

    const initializeEditorState = () => {
        if (bidText) {
            try {
                const contentState = convertFromRaw(JSON.parse(bidText));
                return EditorState.createWithContent(contentState);
            } catch (error) {
                console.error("Error loading editor state from bidText:", error);
            }
        }
        return EditorState.createEmpty();
    };

    const [editorState, setEditorState] = useState(initializeEditorState);

    useEffect(() => {
        if (bidText) {
            try {
                const contentState = convertFromRaw(JSON.parse(bidText));
                setEditorState(EditorState.createWithContent(contentState));
            } catch (error) {
                console.error("Error updating editor state from bidText:", error);
            }
        }
    }, [bidText]);

    useEffect(() => {
        if (appendResponse && !appendedIds.current.has(appendResponse.id)) {
            const currentContent = editorState.getCurrentContent();
            const currentContentBlock = currentContent.getBlockMap().last();
            const lengthOfLastBlock = currentContentBlock.getLength();

            const selectionState = editorState.getSelection().merge({
                anchorKey: currentContentBlock.getKey(),
                anchorOffset: lengthOfLastBlock,
                focusKey: currentContentBlock.getKey(),
                focusOffset: lengthOfLastBlock,
            });

            let newContentState = Modifier.insertText(
                currentContent,
                selectionState,
                `\nQuestion:\n${appendResponse.question}\n\nAnswer:\n${appendResponse.answer}\n\n`
            );

            let newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');
            setEditorState(newEditorState);

            const blockKey = newEditorState.getSelection().getStartKey();
            const blockLength = newEditorState.getCurrentContent().getBlockForKey(blockKey).getLength();

            const questionRange = new SelectionState({
                anchorKey: blockKey,
                anchorOffset: lengthOfLastBlock + 1,
                focusKey: blockKey,
                focusOffset: lengthOfLastBlock + 10,
            });

            const answerRange = new SelectionState({
                anchorKey: blockKey,
                anchorOffset: lengthOfLastBlock + 13 + appendResponse.question.length,
                focusKey: blockKey,
                focusOffset: lengthOfLastBlock + 20 + appendResponse.question.length,
            });

            newContentState = Modifier.applyInlineStyle(
                newEditorState.getCurrentContent(),
                questionRange,
                'BOLD'
            );

            newEditorState = EditorState.push(newEditorState, newContentState, 'change-inline-style');

            newContentState = Modifier.applyInlineStyle(
                newEditorState.getCurrentContent(),
                answerRange,
                'BOLD'
            );

            newEditorState = EditorState.push(newEditorState, newContentState, 'change-inline-style');

            setEditorState(newEditorState);
            setSharedState(prevState => ({
                ...prevState,
                editorState: JSON.stringify(convertToRaw(newEditorState.getCurrentContent()))
            }));
            appendedIds.current.add(appendResponse.id);
        }
    }, [appendResponse, editorState, setSharedState]);

    const debouncedEditorStateChange = useDebouncedCallback((newEditorState) => {
        setSharedState(prevState => ({
            ...prevState,
            editorState: JSON.stringify(convertToRaw(newEditorState.getCurrentContent()))
        }));
    }, 500); // Adjust delay as needed

    const onEditorStateChange = (newEditorState) => {
        setEditorState(newEditorState);
        debouncedEditorStateChange(newEditorState);
    };

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
