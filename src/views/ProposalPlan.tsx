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
import { faCheckCircle, faPencil, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Menu, MenuItem } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import StatusMenu, { Section } from "../components/StatusMenu.tsx";
import OutlineInstructionsModal from "../modals/OutlineInstructionsModal.tsx";




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
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    setValue(initialValue || '');
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
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
  const [outlinefetched, setOutlineFetched] = useState(false);
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

  const isAllSectionsComplete = () => {
    return outline.length > 0 && outline.every(section => section.status === 'Completed');
  };
  
  const generateProposal = async () => {
    try {
      const formData = new FormData();
      formData.append('bid_id', object_id);
      
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/generate_proposal`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob'  // Important for handling file downloads
        }
      );
      
      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'application/msword' });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = response.headers['content-disposition']?.split('filename=')[1] || 'proposal.docx';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      displayAlert("Proposal downloaded successfully!", 'success');
    } catch (err) {
      console.error('Error generating proposal:', err);
      displayAlert("Failed to generate proposal", 'danger');
    }
  };

  useEffect(() => {
    if (outline.length === 0 && outlinefetched === true) {
      setShowModal(true);
    }
  }, [outline.length, outlinefetched]);

  const handleRegenerateClick = () => {
    setShowModal(true);
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
      // Map the response data and preserve or set the status field
      const outlineWithStatus = response.data.map((section: any) => ({
        ...section,
        // If status exists in the response, use it; otherwise convert from completed boolean
        status: section.status || (section.completed ? 'Completed' : 
          section.in_progress ? 'In Progress' : 'Not Started')
      }));
      setOutline(outlineWithStatus);
    } catch (err) {
      console.error('Error fetching outline:', err);
      displayAlert("Failed to fetch outline", 'danger');
    } finally {
      setIsLoading(false);
      setOutlineFetched(true);
    }
  };

  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    if (!object_id) return;
    fetchOutline();
  }, [object_id]);


  const updateSection = async (section: Section, sectionIndex: number) => {
    try {
      await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/update_section`,
        {
          bid_id: object_id,
          section: section,
          section_index: sectionIndex
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
    
    // Update the section with the new value
    newOutline[index] = {
      ...newOutline[index],
      [field]: value
    };
    
    // Update local state
    setOutline(newOutline);
    
    // For status changes, update immediately
    if (field === 'status') {
      updateSection(newOutline[index], index);
    }
  };
  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <div className="scroll-container">
          <BidNavbar />
          <OutlineInstructionsModal
              show={showModal}
              onHide={() => setShowModal(false)}
              bid_id = {object_id}
              fetchOutline = {fetchOutline}
              
            />
          {outline.length === 0 && outlinefetched === true ? (
            <div>
              </div>
          ) : (
            <div>
              <div className="proposal-header">
              <BidTitle
                canUserEdit={true}
                displayAlert={displayAlert}
                setSharedState={setSharedState}
                sharedState={sharedState}
                showViewOnlyMessage={showViewOnlyMessage}
                initialBidName={"initialBidName"}
              />
              <button
                onClick={handleRegenerateClick}
                className="upload-button"
                style={{ minWidth: "fit-content" }}
              >
                <FontAwesomeIcon icon={faPlus} className="pr-2"></FontAwesomeIcon> 
                New Outline
              </button>
              </div>
              {isAllSectionsComplete() && (
                <Button 
                  onClick={generateProposal}
                  className="mb-4 ms-2 d-flex align-items-center gap-2"
                  variant="success"
                >
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    style={{ marginLeft: "5px" }}
                  />
                  Generate Proposal
                </Button>
              )}
  
              <div className="table-responsive">
                <table className="outline-table w-100">
                  <thead>
                    <tr>
                      <th className="py-3 px-4" style={{width: '30%'}}>Section</th>
                      <th className="py-3 px-4" style={{width: '10%'}}>Word Count</th>
                      <th className="py-3 px-4" style={{width: '10%'}}>Weighting</th>
                      <th className="py-3 px-4" style={{width: '15%'}}>Page Limit</th>
                      <th className="py-3 px-4">Reviewer</th>
                      <th className="py-3 px-4" style={{width: '8%'}}>Edit</th>
                      <th className="py-3 px-4 text-center">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <Spinner animation="border" size="sm" /> Loading...
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
                            <div className="d-flex justify-content-centers">
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
                          <td className="py-2 px-4 text-center">
                            <StatusMenu
                              value={section.status}
                              onChange={(value) => handleSectionChange(index, 'status', value)}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(ProposalPlan);