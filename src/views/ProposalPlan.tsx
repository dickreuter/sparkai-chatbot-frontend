import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import SideBarSmall from "../routes/SidebarSmall.tsx";
import BidNavbar from "../routes/BidNavbar.tsx";
import "./BidExtractor.css";
import { BidContext, Section } from "./BidWritingStateManagerView.tsx";
import { displayAlert } from "../helper/Alert.tsx";
import "./ProposalPlan.css";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import StatusMenu from "../components/StatusMenu.tsx";
import OutlineInstructionsModal from "../modals/OutlineInstructionsModal.tsx";
import SectionMenu from "../components/SectionMenu.tsx";
import { MenuItem, Select, SelectChangeEvent, Skeleton } from "@mui/material";
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
  "& MuiOutlinedInputNotchedOutline": {
    borderColor: "#ced4da"
  },
  "&:hover MuiOutlinedInputNotchedOutline": {
    borderColor: "#86b7fe"
  },
  "&.MuiFocused MuiOutlinedInputNotchedOutline": {
    borderColor: "#86b7fe",
    borderWidth: "1px"
  }
};

const menuStyle = {
  fontSize: "12px",
  fontFamily: '"ClashDisplay", sans-serif'
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

const QuestionTypeDropdown = ({
  value,
  onChange,
  onBlur
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as string);
  };

  return (
    <Select
      value={value || "3b"}
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
      <MenuItem value="3b" style={menuStyle}>
        <em>General</em>
      </MenuItem>
      <MenuItem value="3b_case_study" style={menuStyle}>
        <em>Case Study</em>
      </MenuItem>
      <MenuItem value="3b_commercial" style={menuStyle}>
        <em>Compliance</em>
      </MenuItem>
      <MenuItem value="3b_personnel" style={menuStyle}>
        <em>Team</em>
      </MenuItem>
      <MenuItem value="3b_technical" style={menuStyle}>
        <em>Technical</em>
      </MenuItem>
    </Select>
  );
};

const SkeletonRow = () => (
  <tr className="hover:bg-gray-50">
    <td className="py-2 px-4">
      <Skeleton variant="text" />
    </td>
    <td className="py-2 px-4">
      <Skeleton variant="rectangular" />
    </td>
    <td className="py-2 px-4">
      <Skeleton variant="rectangular" />
    </td>
    <td className="py-2 px-4 text-center">
      <Skeleton variant="text" />
    </td>
    <td className="py-2 px-4 text-center">
      <Skeleton variant="text" width={40} style={{ margin: "0 auto" }} />
    </td>
    <td className="py-2 px-4 text-center">
      <Skeleton variant="rectangular" style={{ margin: "0 auto" }} />
    </td>
    <td className="py-2 px-4 text-center">
      <Skeleton
        variant="rounded"
        width={20}
        height={20}
        style={{ marginLeft: "22px" }}
      />
    </td>
  </tr>
);

const ProposalPlan = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const navigate = useNavigate();
  const tokenRef = useRef(auth?.token || "default");
  const { sharedState, setSharedState } = useContext(BidContext);
  const [isLoading, setIsLoading] = useState(false);

  const { object_id, contributors, outline } = sharedState;

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

      const updatedOutline = [...sharedState.outline];
      updatedOutline.splice(selectedRowIndex, 0, {
        ...newSection,
        section_id: response.data.section_id
      });

      setSharedState((prevState) => ({
        ...prevState,
        outline: updatedOutline
      }));

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
        bid_id: object_id,
        state_outline: outline
      }
    });
  };

  const showViewOnlyMessage = () => {
    displayAlert("You only have permission to view this bid.", "danger");
  };

  useEffect(() => {
    console.log(outline.lengths);

    if (outline.length === 0) {
      setShowModal(true);
    }
  }, [outline.length]);

  const handleRegenerateClick = () => {
    setShowModal(true);
  };

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

      const newOutline = sharedState.outline.filter(
        (_, index) => index !== sectionIndex
      );
      setSharedState((prevState) => ({
        ...prevState,
        outline: newOutline
      }));

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
    const newOutline = [...sharedState.outline];
    newOutline[index] = {
      ...newOutline[index],
      [field]: value
    };

    setSharedState((prevState) => ({
      ...prevState,
      outline: newOutline
    }));

    if (field === "status") {
      posthog.capture("proposal_section_status_changed", {
        bidId: object_id,
        sectionIndex: index,
        newStatus: value
      });
    }
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

      const outlineWithStatus = response.data.map((section: any) => ({
        ...section,
        status:
          section.status ||
          (section.completed
            ? "Completed"
            : section.in_progress
              ? "In Progress"
              : "Not Started")
      }));

      setSharedState((prevState) => ({
        ...prevState,
        outline: outlineWithStatus
      }));
    } catch (err) {
      console.error("Error fetching outline:", err);
      displayAlert("Failed to fetch outline", "danger");
    } finally {
      setIsLoading(false);
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
            object_id={object_id}
            handleRegenerateClick={handleRegenerateClick}
          />
          <OutlineInstructionsModal
            show={showModal}
            onHide={() => setShowModal(false)}
            bid_id={object_id}
            fetchOutline={fetchOutline}
          />

          {outline.length === 0 ? (
            <div></div>
          ) : (
            <div>
              <div className="table-responsive mt-3">
                <table
                  className="outline-table"
                  style={{ tableLayout: "fixed" }}
                >
                  <thead style={{ width: "100%" }}>
                    <tr>
                      <th className="" style={{ width: "45%" }}>
                        Section
                      </th>
                      <th className="" style={{ width: "13.5%" }}>
                        Reviewer
                      </th>
                      <th className="" style={{ width: "13.5%" }}>
                        Question Type
                      </th>
                      <th className=" text-center" style={{ width: "8%" }}>
                        Subsections
                      </th>
                      <th className=" text-center" style={{ width: "6.5%" }}>
                        Words
                      </th>
                      <th className=" text-center" style={{ width: "8%" }}>
                        Completed
                      </th>
                      <th className=" text-center" style={{ width: "6%" }}>
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading
                      ? // Show 5 skeleton rows while loading
                        [...Array(15)].map((_, index) => (
                          <SkeletonRow key={index} />
                        ))
                      : outline.map((section, index) => (
                          <tr
                            key={index}
                            onContextMenu={(e) => handleContextMenu(e, index)}
                            className="hover:bg-gray-50"
                          >
                            <td className="">
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
                            <td className="">
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
                            <td className="">
                              <QuestionTypeDropdown
                                value={section.choice}
                                onChange={(value) =>
                                  handleSectionChange(index, "choice", value)
                                }
                                onBlur={() =>
                                  updateSection(outline[index], index)
                                }
                              />
                            </td>
                            <td className="text-center">
                              {section.subsections}
                            </td>
                            <td className="text-center">
                              {section.word_count}
                            </td>
                            <td className="text-center">
                              <StatusMenu
                                value={section.status}
                                onChange={(value) => {
                                  handleSectionChange(index, "status", value);
                                  // Create updated section with new status
                                  const updatedSection = {
                                    ...outline[index],
                                    status: value
                                  };
                                  updateSection(updatedSection, index);
                                }}
                              />
                            </td>
                            <td className="text-center">
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
                        ))}
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
