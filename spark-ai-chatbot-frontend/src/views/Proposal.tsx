import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import {useAuthUser} from "react-auth-kit";
import {Button, Col, Container, Form, Row, Spinner, Card} from "react-bootstrap";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import withAuth from "../routes/withAuth";
import CustomEditor from "../components/TextEditor.tsx";
import SideBar from '../routes/Sidebar.tsx' ;


const Proposal = () => {

    const [dataset, setDataset] = useState("default");
    const [inputText, setInputText] = useState("");
    const [response, setResponse] = useState("");

    const [feedback, setFeedback] = useState("");
    const [questionAsked, setQuestionAsked] = useState(false);

    const [appendResponse, setAppendResponse] = useState(false);

    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");

    const [editorContent, setEditorContent] = useState("");

    // Load the content from localStorage when the component mounts
    useEffect(() => {
        const savedContent = localStorage.getItem('editorContent');
        if (savedContent) {
            setEditorContent(savedContent);
        }
    }, []);

    // Save the content to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('editorContent', editorContent);
    }, [editorContent]);

    // Update editor content state when appendResponse is called
    // Inside Proposal component
    const handleAppendResponseToEditor = () => {
        // Get the current content from localStorage
        const storedState = localStorage.getItem('editorContent');
        const contentState = storedState ? convertFromRaw(JSON.parse(storedState)) : EditorState.createEmpty().getCurrentContent();

        // Create an updated editor state with the appended response
        const updatedContentState = Modifier.insertText(
            contentState,
            contentState.getSelectionAfter(),
            `\nQuestion: ${inputText}\nAnswer: ${response}\n`
        );

        // Save the updated editor content to localStorage
        localStorage.setItem('editorContent', JSON.stringify(convertToRaw(updatedContentState)));

        // Update the local state
        setEditorContent(JSON.stringify(convertToRaw(updatedContentState)));
    };


    return (
        <div id="proposal-page">
            <SideBar />

            <div className="chat-container">
                <h3 className="text-center mb-2 fw-bold">Text Editor</h3>
                <div className="proposal-container">
                    <Row className="justify-content-md-center">
                        <Col md={12}>
                            <div className="d-flex justify-content-center mb-3">
                                <CustomEditor response={response} appendResponse={appendResponse}/>
                            </div>

                        </Col>
                    </Row>
                </div>
            </div>
        </div>
    );
};
export default withAuth(Proposal);
