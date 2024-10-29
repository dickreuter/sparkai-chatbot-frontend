import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import { Button, Spinner } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import './BidExtractor.css';
import { BidContext } from "./BidWritingStateManagerView.tsx";
import { displayAlert } from "../helper/Alert.tsx";
import BidTitle from "../components/BidTitle.tsx";
import './ProposalPlan.css';
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";

interface Section {
  section_id: string;
  heading: string;
  word_count: number;
  reviewer: string;
  completed: boolean;
  weighting?: string;
  page_limit?: string;
}

const EditableCell = ({ 
  value: initialValue, 
  onChange,
  onBlur,
  type = "text"
}: { 
  value: string | number | undefined,
  onChange: (value: string) => void,
  onBlur: () => void,
  type?: string 
}) => {
  // State to hold the current input value
  const [value, setValue] = useState(initialValue || '');

  // Update local state when prop changes
  useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);  // Update local state immediately
    onChange(newValue);  // Update parent state
  };

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      className="editable-cell"
      placeholder="-"
    />
  );
};

const ProposalPlan = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const navigate = useNavigate();
  const tokenRef = useRef(auth?.token || "default");
  const { sharedState, setSharedState } = useContext(BidContext);
  const [outline, setOutline] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    object_id,
    contributors
  } = sharedState;
  
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const currentUserPermission = contributors[auth.email] || "viewer";

  const handleEditClick = (section: Section) => {
    navigate('/question-crafter', { 
      state: { 
        section,
        bid_id: object_id 
      } 
    });
  };

  const showViewOnlyMessage = () => {
    displayAlert("You only have permission to view this bid.", "danger");
  };

  const fetchOutline = async () => {
    if (!object_id) return;
    const formData = new FormData();
    formData.append('bid_id', object_id);
    setIsLoading(true);
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_bid_outline`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      setOutline(response.data);
    } catch (err) {
      console.error('Error fetching outline:', err);
      displayAlert("Failed to fetch outline", 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutline();
  }, [object_id]);

  const generateOutline = async () => {
    setIsGeneratingOutline(true);
    const formData = new FormData();
    formData.append('bid_id', object_id);
    
    try {
      await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/generate_outline`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      
      displayAlert("Outline generated successfully!", 'success');
      fetchOutline();
    } catch (err) {
      console.error('Error generating outline:', err);
      if (err.response?.status === 404) {
        displayAlert("No documents found in the tender library. Please upload documents before generating outline.", 'warning');
      } else {
        displayAlert("Failed to generate outline", 'danger');
      }
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const updateSection = async (section: Section, sectionIndex: number) => {
    try {
      await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/update_section`,
        {
          bid_id: object_id,
          section,
          section_index: sectionIndex // Add section index to the payload
        },
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (err) {
      console.error('Error updating section:', err);
     
    }
  };

  const deleteSection = async (sectionId: string, sectionIndex: number) => {
    try {
      await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/delete_section`,
        {
          bid_id: object_id,
          section_id: sectionId,
          section_index: sectionIndex
        },
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
            'Content-Type': 'application/json',
          }
        }
      );
      
      // Update the local state after successful deletion
      const newOutline = outline.filter((_, index) => index !== sectionIndex);
      setOutline(newOutline);
      displayAlert("Section deleted successfully", 'success');
    } catch (err) {
      console.error('Error deleting section:', err);
      displayAlert("Failed to delete section", 'danger');
    }
  };

  const handleDeleteClick = (section: Section, index: number) => {
    if (window.confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
      deleteSection(section.section_id, index);
    }
  };


  const handleSectionChange = (index: number, field: keyof Section, value: any) => {
    const newOutline = [...outline];
    const processedValue = field === 'completed' ? Boolean(value) : value;
    
    newOutline[index] = {
      ...newOutline[index],
      [field]: processedValue
    };
    
    setOutline(newOutline);
    
    // For checkboxes, update immediately since there's no blur event
    if (field === 'completed') {
      updateSection(newOutline[index], index);
    }
  };
  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <div className="scroll-container">
          <BidNavbar />
          <BidTitle
            canUserEdit={true}
            displayAlert={displayAlert}
            setSharedState={setSharedState}
            sharedState={sharedState}
            showViewOnlyMessage={showViewOnlyMessage}
            initialBidName={"initialBidName"}
          />
          
          <div>
            <Button 
              onClick={generateOutline}
              disabled={isGeneratingOutline}
              className="mb-4"
              variant="primary"
            >
              {isGeneratingOutline ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Generating...
                </>
              ) : (
                'Generate Outline'
              )}
            </Button>

            <div className="table-responsive">
              <table className="outline-table w-100">
                <thead>
                  <tr>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4" style={{width: '10%'}}>Word Count</th>
                    <th className="py-3 px-4" style={{width: '10%'}}>Weighting</th>
                    <th className="py-3 px-4">Page Limit</th>
                    <th className="py-3 px-4">Reviewer</th>
                    <th className="py-3 px-4" style={{width: '5%'}}>Edit</th>
                    <th className="py-3 px-4">Completed</th>
                    
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        <Spinner animation="border" size="sm" /> Loading...
                      </td>
                    </tr>
                  ) : outline.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        No sections found. Generate an outline to get started.
                      </td>
                    </tr>
                  ) : (
                    outline.map((section, index) => (
                      <tr key={index}>
                        <td className="py-2 px-4">
                          <EditableCell
                            value={section.heading}
                            onChange={(value) => handleSectionChange(index, 'heading', value)}
                            onBlur={() => updateSection(outline[index], index)}
                          />
                        </td>
                        <td className="py-2 px-4">{section.word_count}</td>
                        <td className="py-2 px-4">
                          <EditableCell
                            value={section.weighting}
                            onChange={(value) => handleSectionChange(index, 'weighting', value)}
                            onBlur={() => updateSection(outline[index], index)}
                          />
                        </td>
                        <td className="py-2 px-4">
                          <EditableCell
                            value={section.page_limit}
                            onChange={(value) => handleSectionChange(index, 'page_limit', value)}
                            onBlur={() => updateSection(outline[index], index)}
                          />
                        </td>
                        <td className="py-2 px-4">
                          <EditableCell
                            value={section.reviewer}
                            onChange={(value) => handleSectionChange(index, 'reviewer', value)}
                            onBlur={() => updateSection(outline[index], index)}
                          />
                        </td>
                        <td className="py-2 px-4 text-center">
                          <div className="d-flex justify-content-center gap-3">
                            <button
                              onClick={() => handleEditClick(section)}
                              className="bg-transparent border-0 text-primary hover:text-blue-700 cursor-pointer"
                              title="Edit section"
                            >
                              <FontAwesomeIcon icon={faPencil} size="sm" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(section, index)}
                              className="bg-transparent border-0 text-danger hover:text-red-700 cursor-pointer"
                              title="Delete section"
                            >
                              <FontAwesomeIcon icon={faTrash} size="sm" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-4 text-center checkbox-cell">
                          <div className="custom-checkbox">
                            <input
                              id={`section-${index}`}
                              type="checkbox"
                              checked={!!section.completed}
                              onChange={(e) => handleSectionChange(index, 'completed', e.target.checked)}
                            />
                            <label htmlFor={`section-${index}`}></label>
                          </div>
                        </td>
                        
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withAuth(ProposalPlan);