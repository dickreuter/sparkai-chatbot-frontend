import React, { useEffect, useState, useRef } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, convertFromRaw, Modifier, SelectionState, ContentState } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';


function CustomEditor({ bidText, appendResponse, navigatedFromBidsTable}) {

    const appendedIds = useRef(new Set()); // Track IDs of appended responses

    const initializeEditorState = () => {
        // First, attempt to load from localStorage if available
        const savedData = localStorage.getItem('editorState');
        if (savedData) {
            try {
                const contentState = convertFromRaw(JSON.parse(savedData));
                return EditorState.createWithContent(contentState);
            } catch (error) {
                console.error("Error loading editor state from localStorage:", error);
            }
        }
        // Default to an empty editor if no saved state or bidText is available
        return EditorState.createEmpty();
    };

    const [editorState, setEditorState] = useState(initializeEditorState);

    useEffect(() => {
        // Only update editor from bidText if specifically navigated from bids table
        // and bidText is different from current content (to avoid unnecessary reinitializations)
        if (navigatedFromBidsTable && bidText) {
            const currentContentText = editorState.getCurrentContent().getPlainText();
            if (bidText !== currentContentText) {
                const contentState = ContentState.createFromText(bidText);
                let newEditorState = EditorState.createWithContent(contentState);
                newEditorState = applyBoldToHeadings(newEditorState);
                setEditorState(newEditorState);
            }
        }
    }, [navigatedFromBidsTable, bidText, editorState]);

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

            // Apply 'BOLD' style to the words "Question" and "Answer"
            const blockKey = newEditorState.getSelection().getStartKey();
            const blockLength = newEditorState.getCurrentContent().getBlockForKey(blockKey).getLength();

            // Create selection range for the word "Question"
            const questionRange = new SelectionState({
                anchorKey: blockKey,
                anchorOffset: lengthOfLastBlock + 1, // start of the word "Question"
                focusKey: blockKey,
                focusOffset: lengthOfLastBlock + 10, // end of the word "Question"
            });

            // Create selection range for the word "Answer"
            const answerRange = new SelectionState({
                anchorKey: blockKey,
                anchorOffset: lengthOfLastBlock + 13 + appendResponse.question.length, // start of the word "Answer"
                focusKey: blockKey,
                focusOffset: lengthOfLastBlock + 20 + appendResponse.question.length, // end of the word "Answer"
            });

            // Apply 'BOLD' style to the word "Question"
            newContentState = Modifier.applyInlineStyle(
                newEditorState.getCurrentContent(),
                questionRange,
                'BOLD'
            );

            newEditorState = EditorState.push(newEditorState, newContentState, 'change-inline-style');

            // Apply 'BOLD' style to the word "Answer"
            newContentState = Modifier.applyInlineStyle(
                newEditorState.getCurrentContent(),
                answerRange,
                'BOLD'
            );

            newEditorState = EditorState.push(newEditorState, newContentState, 'change-inline-style');

            setEditorState(newEditorState);
            appendedIds.current.add(appendResponse.id);
        }
    }, [appendResponse, editorState]);



    useEffect(() => {
        // Save the editor state to localStorage whenever it changes
        //console.log("saved");
        const contentState = editorState.getCurrentContent();
        localStorage.setItem('editorState', JSON.stringify(convertToRaw(contentState)));
    }, [editorState]);


    function applyBoldToHeadings(editorState) {
        const contentState = editorState.getCurrentContent();
        const blocks = contentState.getBlockMap();

        let newContentState = contentState;
        blocks.forEach((block) => {
            const blockText = block.getText();
            const questionMatch = /Question:/.exec(blockText);
            const answerMatch = /Answer:/.exec(blockText);

            if (questionMatch) {
                const questionRange = new SelectionState({
                    anchorKey: block.getKey(),
                    anchorOffset: questionMatch.index,
                    focusKey: block.getKey(),
                    focusOffset: questionMatch.index + "Question:".length,
                });
                newContentState = Modifier.applyInlineStyle(newContentState, questionRange, 'BOLD');
            }

            if (answerMatch) {
                const answerRange = new SelectionState({
                    anchorKey: block.getKey(),
                    anchorOffset: answerMatch.index,
                    focusKey: block.getKey(),
                    focusOffset: answerMatch.index + "Answer:".length,
                });
                newContentState = Modifier.applyInlineStyle(newContentState, answerRange, 'BOLD');
            }
        });

        return EditorState.push(editorState, newContentState, 'change-inline-style');
    }

    const onEditorStateChange = (newEditorState) => {
        setEditorState(newEditorState);
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