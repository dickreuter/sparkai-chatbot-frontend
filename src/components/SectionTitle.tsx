import { useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";

const SectionTitle = ({
  canUserEdit,
  displayAlert,
  showViewOnlyMessage,
  sectiontitle,
  section,
  sectionIndex,
  bid_id,
  tokenRef
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const title = sectiontitle;
  const sectionNameTempRef = useRef(title);
  const sectionNameRef = useRef(null);

  const updateSection = async (section, sectionIndex) => {
    try {
      await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/update_section`,
        {
          bid_id: bid_id,
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
      displayAlert("Failed to update section title", "danger");
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
    updateSection(updatedSection, sectionIndex);
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
