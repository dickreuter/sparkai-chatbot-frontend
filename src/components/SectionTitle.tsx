import { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import "./SectionTitle.css";
import { BidContext } from "../views/BidWritingStateManagerView";

const SectionTitle = ({
  canUserEdit,
  displayAlert,
  showViewOnlyMessage,
  sectiontitle,
  section,
  sectionIndex,
  bid_id,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const title = sectiontitle;
  const sectionNameTempRef = useRef(title);
  const sectionNameRef = useRef(null);
  const { sharedState, setSharedState } = useContext(BidContext);

  const updateSection = async (updatedSection) => {
    try {
      setSharedState(prevState => ({
        ...prevState,
        outline: prevState.outline.map((section, idx) => 
          idx === sectionIndex ? updatedSection : section
        )
      }));
      displayAlert("Section title updated successfully", "success");
    } catch (error) {
      console.error("Error updating section:", error);
      displayAlert("Failed to update section title", "danger");
      if (sectionNameRef.current) {
        sectionNameRef.current.innerText = title;
      }
    }
  };
    

  const handleBlur = () => {
    const newTitle = sectionNameTempRef.current.trim();
    if (!newTitle) {
      displayAlert("Section title cannot be empty", "warning");
      sectionNameRef.current.innerText = title;
      return;
    }

    // Create updated section with new title
    const updatedSection = {
      ...section,
      heading: newTitle
    };

    // Update the section on the server
    updateSection(updatedSection);
    setIsEditing(false);
  };

  // Rest of the component remains the same
  const handleSectionNameChange = (e) => {
    sectionNameTempRef.current = e.target.innerText;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sectionNameRef.current.blur();
    }
  };

  useEffect(() => {
    sectionNameTempRef.current = title;
    if (sectionNameRef.current) {
      sectionNameRef.current.innerText = title;
    }
  }, [title]);

  return (
    <div className="sectionname-header">
      <h1>
        <div
          className="sectionname-wrapper"
          onClick={canUserEdit ? () => setIsEditing(true) : showViewOnlyMessage}
        >
          <span
            contentEditable={isEditing && canUserEdit}
            suppressContentEditableWarning={true}
            onBlur={handleBlur}
            onInput={handleSectionNameChange}
            onKeyDown={handleKeyDown}
            className={isEditing ? "editable" : ""}
            ref={sectionNameRef}
            spellCheck="false"
          >
            {title}
          </span>
        </div>
      </h1>
    </div>
  );
};

export default SectionTitle;
