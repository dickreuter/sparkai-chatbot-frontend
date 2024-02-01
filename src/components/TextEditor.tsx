import React, { useEffect, useState } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, ContentState, Modifier } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

function CustomEditor({ response, appendResponse }) {
    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

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

            const newContentState = Modifier.insertText(currentContent, selectionState, `\n${response}`);
            const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');
            setEditorState(newEditorState);
        }
    }, [response, appendResponse]);

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
