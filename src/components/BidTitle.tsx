import { useEffect, useRef, useState } from "react";

const BidTitle = ({
    canUserEdit,
    displayAlert,
    setSharedState,
    sharedState,
    showViewOnlyMessage,
    initialBidName
    }) => {

    const {
        bidInfo: contextBidInfo,
      } = sharedState;
    
    const [isEditing, setIsEditing] = useState(false);
    const bidInfo = contextBidInfo || initialBidName;
    const bidNameTempRef = useRef(bidInfo);
    const bidNameRef = useRef(null);

    const handleBlur = () => {
        const newBidName = bidNameTempRef.current.trim();
        if (!newBidName) {
        displayAlert("Bid name cannot be empty", "warning");
        bidNameRef.current.innerText = bidInfo;
        return;
        }
        if (
        existingBidNames.includes(newBidName) &&
        newBidName !== contextBidInfo
        ) {
        displayAlert("Bid name already exists", "warning");
        bidNameRef.current.innerText = bidInfo;
        return;
        }

        // Ensure text starts from the beginning
        if (bidNameRef.current) {
        bidNameRef.current.scrollLeft = 0;
        }

        setSharedState((prevState) => ({
        ...prevState,
        bidInfo: newBidName
        }));
        setIsEditing(false);
    };

    const handleBidNameChange = (e) => {
        const span = bidNameRef.current;
        const wrapper = span.parentElement;

        // Create a hidden span to measure text width
        const measurer = document.createElement("span");
        measurer.style.visibility = "hidden";
        measurer.style.position = "absolute";
        measurer.style.whiteSpace = "nowrap";
        measurer.style.font = window.getComputedStyle(span).font;
        document.body.appendChild(measurer);

        // Get available width (container width minus padding)
        const availableWidth = wrapper.offsetWidth;

        // Get the new text content
        const newText = e.target.innerText.replace(/\n/g, "");
        measurer.textContent = newText;

        // Check if text would be truncated
        if (measurer.offsetWidth > availableWidth) {
        // Text would be truncated, prevent change
        e.preventDefault();
        // Restore previous text
        e.target.innerText = bidNameTempRef.current;
        // Set cursor to end
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(e.target);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        } else {
        // Text fits, update the ref
        bidNameTempRef.current = newText;
        }

        document.body.removeChild(measurer);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
        e.preventDefault();
        return;
        }

        // Create a hidden span to measure what text width would be after keypress
        const span = bidNameRef.current;
        const wrapper = span.parentElement;
        const measurer = document.createElement("span");
        measurer.style.visibility = "hidden";
        measurer.style.position = "absolute";
        measurer.style.whiteSpace = "nowrap";
        measurer.style.font = window.getComputedStyle(span).font;
        document.body.appendChild(measurer);

        const availableWidth = wrapper.offsetWidth;

        // Simulate the text after the keypress
        let newText = span.innerText;
        if (
        ![
            "Backspace",
            "Delete",
            "ArrowLeft",
            "ArrowRight",
            "Home",
            "End"
        ].includes(e.key) &&
        e.key.length === 1
        ) {
        newText += e.key;
        }
        measurer.textContent = newText;

        // If text would be truncated, prevent typing
        if (
        measurer.offsetWidth > availableWidth &&
        ![
            "Backspace",
            "Delete",
            "ArrowLeft",
            "ArrowRight",
            "Home",
            "End"
        ].includes(e.key)
        ) {
        e.preventDefault();
        }

        document.body.removeChild(measurer);
    };

    useEffect(() => {
        bidNameTempRef.current = bidInfo;
        if (bidNameRef.current) {
        bidNameRef.current.innerText = bidInfo;
        }
    }, [bidInfo]);

    return (
        <div className="bidname-header">
        <h1>
            <div
            className="bidname-wrapper"
            onClick={
                canUserEdit ? () => setIsEditing(true) : showViewOnlyMessage
            }
            >
            <span
                contentEditable={isEditing && canUserEdit}
                suppressContentEditableWarning={true}
                onBlur={handleBlur}
                onInput={handleBidNameChange}
                onKeyDown={handleKeyDown}
                className={isEditing ? "editable" : ""}
                ref={bidNameRef}
                spellCheck="false"
                style={{ WebkitTextFillColor: "currentColor" }}
            >
                {bidInfo}
            </span>
            </div>
        </h1>
        </div>
    );
    };

export default BidTitle;