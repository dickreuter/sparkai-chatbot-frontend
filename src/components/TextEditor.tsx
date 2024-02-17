import React, { useEffect, useState } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, convertFromRaw, Modifier, SelectionState, ContentState } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

function CustomEditor({ bidText, response, appendResponse }) {
    const [editorState, setEditorState] = useState(() => {
        try {
            const savedData = localStorage.getItem('editorState');
            if (savedData) {
                const rawContentState = JSON.parse(savedData);
                const contentState = convertFromRaw(rawContentState);
                return EditorState.createWithContent(contentState);
            }
        } catch (error) {
            console.error("Error loading editor state:", error);
            // Handle the error or set a fallback editor state
        }
        return EditorState.createEmpty();
    });
    
    

useEffect(() => {
    if (appendResponse) {
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
            focusOffset: lengthOfLastBlock + 9, // end of the word "Question"
        });

        // Create selection range for the word "Answer"
        const answerRange = new SelectionState({
            anchorKey: blockKey,
            anchorOffset: lengthOfLastBlock + 14 + appendResponse.question.length, // start of the word "Answer"
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
    }
}, [appendResponse, editorState]);

    useEffect(() => {
        // Save the editor state to localStorage whenever it changes
        const contentState = editorState.getCurrentContent();
        localStorage.setItem('editorState', JSON.stringify(convertToRaw(contentState)));
    }, [editorState]);

    useEffect(() => {
        if (bidText) {
            let contentState = ContentState.createFromText(bidText);
            let newEditorState = EditorState.createWithContent(contentState);
            setEditorState(newEditorState);
        }
    }, [bidText]);

    const onEditorStateChange = (newEditorState) => {
        setEditorState(newEditorState);
    };

    

    return (
        <Editor
            editorState={editorState}
            onEditorStateChange={onEditorStateChange}

            toolbarClassName="toolbarClassName"
            wrapperClassName="wrapperClassName"
            editorClassName="editorClassName"
        />
    );
    }

export default CustomEditor;