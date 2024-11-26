import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import SideBarSmall from "../routes/SidebarSmall.tsx";
import { Button, Spinner } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import "./BidExtractor.css";
import { BidContext } from "./BidWritingStateManagerView.tsx";
import { displayAlert } from "../helper/Alert.tsx";
import "./ProposalPlan.css";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencil, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import StatusMenu, { Section } from "../components/StatusMenu.tsx";
import OutlineInstructionsModal from "../modals/OutlineInstructionsModal.tsx";
import GenerateProposalModal from "../modals/GenerateProposalModal.tsx";
import SectionMenu from "../components/SectionMenu.tsx";
import { MenuItem, Select } from "@mui/material";
import posthog from "posthog-js";

const EditableCell = ({
  value: initialValue,
  onChange,
  onBlur,
  type = "text"
}: {
  value: string | number | undefined;
  onChange: (value: string) => void;
  onBlur: () => void;
  type?: string;
}) => {
  const [value, setValue] = useState(initialValue || "");

  useEffect(() => {
    setValue(initialValue || "");
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

const selectStyle = {
  fontFamily: '"ClashDisplay", sans-serif',
  fontSize: "0.875rem",
  minWidth: "220px",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#ced4da"
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#86b7fe"
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#86b7fe",
    borderWidth: "1px"
  }
};

const menuStyle = {
  fontSize: "0.875rem"
};

const ReviewerDropdown = ({
  value,
  onChange,
  onBlur,
  contributors
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  contributors: Record<string, string>;
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as string);
  };

  return (
    <Select
      value={value || ""}
      onChange={handleChange}
      onBlur={onBlur}
      size="small"
      style={selectStyle}
      displayEmpty
      MenuProps={{
        PaperProps: {
          style: menuStyle
        }
      }}
    >
      <MenuItem value="" style={menuStyle}>
        <em>Select Reviewer</em>
      </MenuItem>
      {Object.entries(contributors).length > 0 ? (
        Object.entries(contributors).map(([email, role], index) => (
          <MenuItem key={index} value={email} style={menuStyle}>
            {email} ({role})
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled value="" style={menuStyle}>
          No Contributors Available
        </MenuItem>
      )}
    </Select>
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

  const { object_id, contributors } = sharedState;

  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const currentUserPermission = contributors[auth.email] || "viewer";
  const [showModal, setShowModal] = useState(false);

  const [contextMenu, setContextMenu] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);

  const handleContextMenu = (e, index) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedRowIndex(index);
  };

  const handleClickOutside = (e) => {
    if (contextMenu && !e.target.closest(".context-menu")) {
      setContextMenu(null);
      setSelectedRowIndex(null);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  const handleAddSection = async () => {
    if (!object_id || selectedRowIndex === null) return;

    const newSection = {
      heading: "New Section",
      word_count: 0,
      reviewer: "",
      status: "Not Started",
      subsections: 0
    };

    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/add_section`,
        {
          bid_id: object_id,
          section: newSection,
          insert_index: selectedRowIndex
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "application/json"
          }
        }
      );

      const updatedOutline = [...outline];
      updatedOutline.splice(selectedRowIndex, 0, {
        ...newSection,
        section_id: response.data.section_id
      });
      setOutline(updatedOutline);
      displayAlert("Section added successfully", "success");
    } catch (err) {
      console.error("Error adding section:", err);
      displayAlert("Failed to add section", "danger");
    }
    setContextMenu(null);
  };

  const handleDeleteSection = async (
    sectionId: string,
    sectionIndex: number
  ) => {
    try {
      posthog.capture("proposal_section_delete_started", {
        bidId: object_id,
        sectionId,
        sectionIndex
      });

      await deleteSection(sectionId, sectionIndex);

      displayAlert("Section deleted successfully", "success");
      posthog.capture("proposal_section_delete_succeeded", {
        bidId: object_id,
        sectionId
      });
    } catch (err) {
      displayAlert("Failed to delete section", "danger");
      posthog.capture("proposal_section_delete_failed", {
        bidId: object_id,
        sectionId,
        error: err.message
      });
    }
  };

  const handleEditClick = (section: Section) => {
    posthog.capture("proposal_section_edit", {
      bidId: object_id,
      sectionId: section.section_id,
      sectionHeading: section.heading
    });
    navigate("/question-crafter", {
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
    return (
      outline.length > 0 &&
      outline.every((section) => section.status === "Completed")
    );
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
    formData.append("bid_id", object_id);
    setIsLoading(true);
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_bid_outline`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      // Map the response data and preserve or set the status field
      const outlineWithStatus = response.data.map((section: any) => ({
        ...section,
        // If status exists in the response, use it; otherwise convert from completed boolean
        status:
          section.status ||
          (section.completed
            ? "Completed"
            : section.in_progress
              ? "In Progress"
              : "Not Started")
      }));
      setOutline(outlineWithStatus);
    } catch (err) {
      console.error("Error fetching outline:", err);
      displayAlert("Failed to fetch outline", "danger");
    } finally {
      setIsLoading(false);
      setOutlineFetched(true);
    }
  };

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
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "application/json"
          }
        }
      );
    } catch (err) {
      console.error("Error updating section:", err);
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
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Update the local state after successful deletion
      const newOutline = outline.filter((_, index) => index !== sectionIndex);
      setOutline(newOutline);
      displayAlert("Section deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting section:", err);
      displayAlert("Failed to delete section", "danger");
    }
  };

  const handleDeleteClick = (section: Section, index: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this section? This action cannot be undone."
      )
    ) {
      deleteSection(section.section_id, index);
    }
  };

  const handleSectionChange = (
    index: number,
    field: keyof Section,
    value: any
  ) => {
    const newOutline = [...outline];

    // Update the section with the new value
    newOutline[index] = {
      ...newOutline[index],
      [field]: value
    };

    // Update local state
    setOutline(newOutline);

    // For status changes, update immediately
    if (field === "status") {
      posthog.capture("proposal_section_status_changed", {
        bidId: object_id,
        sectionIndex: index,
        newStatus: value
      });
    }
  };
  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <div className="scroll-container">
          <BidNavbar
            showViewOnlyMessage={showViewOnlyMessage}
            initialBidName={"initialBidName"}
            outline={outline}
            outlinefetched={outlinefetched}
            object_id={object_id}
            handleRegenerateClick={handleRegenerateClick}
          />
          <OutlineInstructionsModal
            show={showModal}
            onHide={() => setShowModal(false)}
            bid_id={object_id}
            fetchOutline={fetchOutline}
          />

          {outline.length === 0 && outlinefetched === true ? (
            <div></div>
          ) : (
            <div>
              <div className="table-responsive mt-3">
                <table className="outline-table w-100">
                  <thead>
                    <tr>
                      <th className="py-3 px-4" style={{ width: "50%" }}>
                        Section
                      </th>
                      <th className="py-3 px-4" style={{ width: "15%" }}>
                        Reviewer
                      </th>
                      <th
                        className="py-3 px-4 text-center"
                        style={{ width: "9%" }}
                      >
                        Subsections
                      </th>
                      <th
                        className="py-3 px-4 text-center"
                        style={{ width: "6.5%" }}
                      >
                        Words
                      </th>
                      <th
                        className="py-3 px-4 text-center"
                        style={{ width: "10%" }}
                      >
                        Completed
                      </th>
                      <th
                        className="py-3 px-4 text-center"
                        style={{ width: "6.5%" }}
                      >
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />{" "}
                          Loading Sections...
                        </td>
                      </tr>
                    ) : (
                      outline.map((section, index) => (
                        <tr
                          key={index}
                          onContextMenu={(e) => handleContextMenu(e, index)}
                          className="hover:bg-gray-50"
                        >
                          <td className="py-2 px-4">
                            <Link
                              to="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleEditClick(section);
                              }}
                              style={{
                                cursor: "pointer",
                                textDecoration: "none"
                              }}
                            >
                              {section.heading}
                            </Link>
                          </td>
                          <td className="py-2 px-4">
                            <ReviewerDropdown
                              value={section.reviewer}
                              onChange={(value) =>
                                handleSectionChange(index, "reviewer", value)
                              }
                              onBlur={() =>
                                updateSection(outline[index], index)
                              }
                              contributors={contributors}
                            />
                          </td>
                          <td className="py-2 px-4 text-center">
                            {section.subsections}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {section.word_count}
                          </td>
                          <td className="py-2 px-4 text-center">
                            <StatusMenu
                              value={section.status}
                              onChange={(value) =>
                                handleSectionChange(index, "status", value)
                              }
                            />
                          </td>
                          <td className="py-2 px-4 text-center">
                            <div className="d-flex justify-content-center">
                              <button
                                onClick={() =>
                                  handleDeleteClick(section, index)
                                }
                                className="bg-transparent border-0 cursor-pointer text-black"
                                title="Delete section"
                              >
                                <FontAwesomeIcon icon={faTrash} size="sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {contextMenu && (
                <SectionMenu
                  x={contextMenu.x}
                  y={contextMenu.y}
                  onClose={() => setContextMenu(null)}
                  onAddSection={handleAddSection}
                  onDeleteSection={handleDeleteSection}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(ProposalPlan);
