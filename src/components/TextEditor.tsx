import {useEffect, useState} from 'react';
import {Editor} from 'react-draft-wysiwyg';
import {EditorState, Modifier, RichUtils, SelectionState, convertToRaw, convertFromRaw}} from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

function CustomEditor({content, onContentChange}) {
    // Initialize editorState with empty state or from localStorage
    const [editorState, setEditorState] = useState(() => {
        const storedState = localStorage.getItem('editorContent');
        return storedState
            ? EditorState.createWithContent(convertFromRaw(JSON.parse(storedState)))
            : EditorState.createEmpty();
    });

    // Save the content to localStorage whenever it changes
    useEffect(() => {
        const contentState = editorState.getCurrentContent();
        localStorage.setItem('editorContent', JSON.stringify(convertToRaw(contentState)));
    }, [editorState]);


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
            `\nQuestion:\n${appendResponse.question}\n\nAnswer:\n${appendResponse.answer}\n\n` // Added an extra newline character here
        );

        let newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');

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
}, [appendResponse]);

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
