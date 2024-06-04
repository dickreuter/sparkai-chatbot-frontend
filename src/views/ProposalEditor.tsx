import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Dropdown } from 'react-bootstrap';
import CustomEditor from "../components/TextEditor.tsx";
import withAuth from '../routes/withAuth.tsx';
import TemplateLoader from '../components/TemplateLoader.tsx';
import { useAuthUser } from 'react-auth-kit';
import handleGAEvent from '../utilities/handleGAEvent.tsx';

function ProposalEditor({ bidData, appendResponse, selectedQuestionId, setSelectedQuestionId }) {
    const [responses, setResponses] = useState([]);
    const proposalContainerRef = useRef(null); // Ref for the proposal container
    const [response, setResponse] = useState('');

    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");

    useEffect(() => {
        if (bidData && bidData.text) {
            const parsedResponses = parseResponses(bidData.text);
            setResponses(parsedResponses);
            if (selectedQuestionId && selectedQuestionId !== "navigate") {
                updateSelection(selectedQuestionId, parsedResponses);
            }
        }
    }, [bidData, selectedQuestionId]);

    function updateSelection(questionId, parsedResponses) {
        const foundResponse = parsedResponses.find(res => res.id.toString() === questionId);
        if (foundResponse) {
            scrollToQuestion(foundResponse.question);
        }
    }

    function parseResponses(text) {
        const questionsAnswers = [];
        const questionRegex = /Question:\s*(.*?)\s*Answer:\s*(.*?)(?=\s*Question:|$)/gs;
        let match;
        while ((match = questionRegex.exec(text)) !== null) {
            if (match[1].trim() !== '') { // Exclude empty questions
                questionsAnswers.push({
                    question: match[1].trim(),
                    answer: match[2].trim()
                });
            }
        }
        return questionsAnswers.map((item, index) => ({
            id: index,
            question: item.question,
            answer: item.answer
        }));
    }

    function scrollToQuestion(question) {
        const container = proposalContainerRef.current;
        if (container) {
            const regex = new RegExp(question, 'i');
            const index = container.textContent.search(regex);
            if (index >= 0) {
                const proportion = index / container.textContent.length;
                container.scrollTop = proportion * container.scrollHeight;
            }
        }
    }

    const handleSelect = (eventKey) => {
        if (eventKey !== "navigate") {
            setSelectedQuestionId(eventKey);
        }
    };

    const handleSelectTemplate = (selectedKey) => {
        setResponse(selectedKey);
        handleGAEvent('Chatbot', 'Select', 'Template Select Button');

    };

    const truncateText = (text, maxLength) => {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    };

    return (
        <>
             <div className="proposal-header">
                <h1 className='heavy'>Proposal</h1>
                <div className="dropdown-container">
                    <TemplateLoader token={tokenRef.current} handleSelect={handleSelectTemplate} />
                    <Dropdown onSelect={handleSelect}>
                    <Dropdown.Toggle className="upload-button" style={{ backgroundColor: 'black' }} id="dropdown-basic">
                        Navigate to Question
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        {responses.length > 0 ? (
                        responses.map((response, index) => (
                            <Dropdown.Item key={index} eventKey={response.id.toString()}>
                            {truncateText(response.question, 50)} {/* Limit to 50 characters */}
                            </Dropdown.Item>
                        ))
                        ) : (
                        <Dropdown.Item eventKey="navigate" disabled>
                            Add some Question/Answer blocks to navigate!
                        </Dropdown.Item>
                        )}
                    </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>
            
            <div className="proposal-container" ref={proposalContainerRef}>
                <Row className="justify-content-md-center">
                    <Col md={12}>
                        <CustomEditor
                            bidText={bidData.text}
                            appendResponse={appendResponse}
                            navigatedFromBidsTable={localStorage.getItem('navigatedFromBidsTable') === 'true'}
                        />
                    </Col>
                </Row>
            </div>
        </>
    );
}

export default withAuth(ProposalEditor);
