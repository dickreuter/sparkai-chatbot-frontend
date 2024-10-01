import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal, Button, Spinner, Nav } from 'react-bootstrap';
import InterrogateTender from './InterrogateTender';
import { displayAlert } from '../helper/Alert';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import { useAuthUser } from 'react-auth-kit';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import TenderLibraryChat from './TenderLibraryChat';
import './InterrogateTenderModal.css';

const InterrogateTenderModal = ({ bid_id }) => {
    const [show, setShow] = useState(false);
    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);

    const [textContent, setTextContent] = useState('');
    const [currentSearchTerm, setCurrentSearchTerm] = useState('');
    const [currentSnippet, setCurrentSnippet] = useState('');
    const [isViewingText, setIsViewingText] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoadingText, setIsLoadingText] = useState(false);
    const [activeTab, setActiveTab] = useState('search');

    const textContentRef = useRef(null);

    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");


    const viewFile = useCallback(async (fileName, pageNumber, searchTerm, snippet) => {
        console.log('viewFile called with:', { fileName, pageNumber, searchTerm, snippet });
        setIsLoadingText(true);
        setIsViewingText(true);
        try {
            const formData = new FormData();
            formData.append('bid_id', bid_id);
            formData.append('file_name', fileName);
        
            const response = await axios.post(
                `http${HTTP_PREFIX}://${API_URL}/show_tenderLibrary_file_content_word_format`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${tokenRef.current}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            console.log('API response:', response.data);
            setTextContent(response.data.content);
            setCurrentSearchTerm(searchTerm);
            setCurrentSnippet(snippet);
        } catch (error) {
            console.error('Error viewing file:', error);
            displayAlert('Error viewing file', "danger");
            setIsViewingText(false);
        } finally {
            setIsLoadingText(false);
        }
    }, [bid_id]);


    const highlightContent = useCallback((content, snippet) => {
        console.log('highlightContent called with:', { contentLength: content?.length, snippet });
        if (!content || !snippet) return content;

        // Remove ellipsis from the beginning and end of the snippet
        const trimmedSnippet = snippet.replace(/^\.\.\./, '').replace(/\.\.\.$/, '').trim();
        console.log('Trimmed snippet:', trimmedSnippet);

        // Create a flexible regex pattern
        const flexiblePattern = trimmedSnippet
            .split(/\s+/)
            .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('\\s*');
        
        const snippetRegex = new RegExp(`(${flexiblePattern})`, 'gi');
        
        let highlightedContent = content;
        let match;
        const matches = [];

        while ((match = snippetRegex.exec(content)) !== null) {
            matches.push({index: match.index, length: match[0].length});
        }

        for (let i = matches.length - 1; i >= 0; i--) {
            const { index, length } = matches[i];
            highlightedContent = 
                highlightedContent.slice(0, index) +
                `<mark id="snippet-${i}" class="highlighted-snippet" style="background-color: orange;">` +
                highlightedContent.slice(index, index + length) +
                '</mark>' +
                highlightedContent.slice(index + length);
        }

        console.log('Highlighted content:', highlightedContent.substring(0, 100) + '...');
        console.log('Number of highlights:', matches.length);
        return highlightedContent;
    }, []);

    const scrollToHighlight = useCallback(() => {
        if (textContentRef.current && currentSnippet) {
            const highlightedElements = textContentRef.current.querySelectorAll('.highlighted-snippet');
            console.log('Highlighted elements found:', highlightedElements.length);
            if (highlightedElements.length > 0) {
                const firstHighlight = highlightedElements[0];
                const container = textContentRef.current;
                const containerRect = container.getBoundingClientRect();
                const highlightRect = firstHighlight.getBoundingClientRect();

                // Calculate the scroll position
                const highlightTop = highlightRect.top + container.scrollTop - containerRect.top;
                const highlightBottom = highlightTop + highlightRect.height;

                // Define a padding (in pixels) to add some space above and below the highlight
                const padding = 500;

                // Calculate the new scroll position
                let newScrollTop;
                if (highlightTop < container.scrollTop + padding) {
                    // If highlight is above the visible area, scroll up
                    newScrollTop = highlightTop - padding;
                } else if (highlightBottom > container.scrollTop + containerRect.height - padding) {
                    // If highlight is below the visible area, scroll down
                    newScrollTop = highlightBottom - containerRect.height + padding;
                } else {
                    // If highlight is already visible, don't scroll
                    return;
                }

                // Scroll to the new position
                container.scrollTo({
                    top: newScrollTop,
                    behavior: 'smooth'
                });

                console.log('Scrolled to first highlighted element');
                console.log('New scroll position:', newScrollTop);
            } else {
                console.log('No highlighted elements found to scroll to');
            }
        }
    }, [currentSnippet]);

    useEffect(() => {
        console.log('useEffect triggered with:', { textContentLength: textContent?.length, currentSnippet, isLoadingText });
        let scrollTimeoutId;

        if (!isLoadingText && textContent && currentSnippet) {
            scrollTimeoutId = setTimeout(() => {
                scrollToHighlight();
            }, 500); // Wait for 0.5 seconds after content is loaded before scrolling
        }

        return () => {
            if (scrollTimeoutId) {
                clearTimeout(scrollTimeoutId);
            }
        };
    }, [textContent, currentSnippet, isLoadingText, scrollToHighlight]);

    const handleSearch = useCallback((results, query) => {
        console.log('handleSearch called with:', { resultsCount: results.length, query });
        setSearchResults(results);
        setCurrentSearchTerm(query);
    }, []);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'search':
                return isViewingText ? (
                    <>
                        {isLoadingText ? (
                            <div className="spinner-container">
                                <Spinner animation="border" role="status" style={{color: '#ff7f50'}}>
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                            </div>
                        ) : (
                            <div 
                                ref={textContentRef}
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    overflow: 'auto', 
                                    whiteSpace: 'pre-wrap',
                                }}
                                dangerouslySetInnerHTML={{ 
                                    __html: highlightContent(textContent, currentSnippet) 
                                }} 
                            />
                        )}
                    </>
                ) : (
                    <InterrogateTender 
                        bid_id={bid_id} 
                        viewFile={viewFile} 
                        onSearch={handleSearch}
                        initialSearchTerm={currentSearchTerm}
                        initialSearchResults={searchResults}
                    />
                );
            case 'chat':
                return <TenderLibraryChat bid_id={bid_id} />;
            default:
                return null;
        }
    };

    return (
        <>
            <Button className='upload-button' id='select-folder' onClick={handleShow}>
                Interrogate Tender
            </Button>
            <Modal
                show={show}
                onHide={handleClose}
                dialogClassName="interrogate-modal-dialog"
                contentClassName="interrogate-modal-content"
            >
                <Modal.Header closeButton style={{padding: '0' , paddingTop: '10px', paddingRight: '20px'}}>
                    <Nav variant="tabs" className="w-100">
                    <Nav.Item>
                            <Nav.Link 
                                active={activeTab === 'chat'} 
                                onClick={() => setActiveTab('chat')}
                            >
                                Tender Library Chat
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link 
                                active={activeTab === 'search'} 
                                onClick={() => setActiveTab('search')}
                            >
                                {isViewingText && activeTab === 'search' && (
                                    <FontAwesomeIcon 
                                        icon={faArrowLeft} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsViewingText(false);
                                        }} 
                                        style={{marginRight: '10px', cursor: 'pointer', color: '#6c757d'}}
                                    />
                                )}
                                {isViewingText ? 'Document Viewer' : 'Search Tender Docs'}
                            </Nav.Link>
                        </Nav.Item>
                        
                    </Nav>
                </Modal.Header>
                <Modal.Body>
                    <div className="content-scaler">
                        <div className="interrogate-tender-container">
                            {renderTabContent()}
                        </div>
                    </div>
                </Modal.Body>
             
            </Modal>
         
        </>
    );
};

export default InterrogateTenderModal;