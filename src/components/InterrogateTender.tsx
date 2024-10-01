import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Form, Button, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { useAuthUser } from 'react-auth-kit';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import "./InterrogateTender.css";
const InterrogateTender = ({ bid_id, viewFile, onSearch, initialSearchTerm = '', initialSearchResults = [] }) => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchTerm);
  const [searchResults, setSearchResults] = useState(initialSearchResults);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialSearchResults.length > 0) {
      setSearchResults(initialSearchResults);
    }
  }, [initialSearchResults]);

  const searchTenderDocs = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      console.log('Sending request to:', `http${HTTP_PREFIX}://${API_URL}/search_tender_documents`);
      console.log('Search query:', searchQuery);
      console.log('Bid ID:', bid_id);
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/search_tender_documents`,
        { input_text: searchQuery, bid_id: bid_id },
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      );
      console.log('Response:', response.data);
      setSearchResults(response.data);
      onSearch(response.data, searchQuery);
      if (response.data.length === 0) {
        setError('No results found. Please try a different search query.');
      }
    } catch (error) {
      console.error("Error searching tender documents:", error);
      setError(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, bid_id, onSearch]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    searchTenderDocs();
  }, [searchTenderDocs]);

  const highlightKeywords = useCallback((text, keywords) => {
    const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <span key={index} style={{ backgroundColor: 'orange' }}>{part}</span> : part
    );
  }, []);
 
  const handleSnippetClick = useCallback(async (result) => {
    setIsLoadingText(true);
    await viewFile(result.document_name, result.page_number, searchQuery, result.snippet);
    setIsLoadingText(false);
  }, [viewFile, searchQuery]);

  return (
    <div className="interrogate-tender">
    <p>
  This search feature lets you search for specific words across documents in your tender library. 
  Enter specific terms or phrases related to the buyer's requirements, evaluation criteria, or any other 
  relevant aspects of the tender. Clicking on a search result will take you to the approximate location of the snippet in the relevant document.
</p>
      <Form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-group">
          <Form.Control
            type="text"
            placeholder="Enter your search query"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" disabled={isLoading} className="search-button">
            {isLoading ? <Spinner animation="border" size="sm" /> : 'Search'}
          </Button>
        </div>
      </Form>
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      <div className='snippets'> 
      {searchResults.length > 0 && (
        <ListGroup className="mt-3 p-0">
          {searchResults.map((result, index) => (
           
            <ListGroup.Item 
              key={index} 
              action 
              onClick={() => handleSnippetClick(result)} 
              className='card-effect mb-4' 
              style={{border: 'none', marginRight: 'none'}}
              disabled={isLoadingText}
            >
              <h5>{result.document_name}</h5>
              <p>{highlightKeywords(result.snippet, searchQuery.split(' '))}</p>
            </ListGroup.Item>
           
          ))}
        </ListGroup>
      )}
       </div>
    </div>
  );
};

export default InterrogateTender;