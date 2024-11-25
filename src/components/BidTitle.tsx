import { useContext, useEffect, useRef, useState } from "react";
import { BidContext } from "../views/BidWritingStateManagerView";


const BidTitle = ({
    canUserEdit,
    displayAlert,
    initialBidName,
    showViewOnlyMessage
}) => {
    const { sharedState, setSharedState } = useContext(BidContext);
    const [isEditing, setIsEditing] = useState(false);
    const bidInfo = sharedState.bidInfo || initialBidName;
    const bidNameTempRef = useRef(bidInfo);
    const bidNameRef = useRef(null);

    const handleBlur = () => {
        const newBidName = bidNameTempRef.current.trim();
        if (!newBidName) {
            displayAlert("Bid name cannot be empty", "warning");
            bidNameRef.current.innerText = bidInfo;
            return;
        }

        setSharedState(prevState => ({
            ...prevState,
            bidInfo: newBidName,
            isSaved: false
        }));
        setIsEditing(false);
    };

    const handleBidNameChange = (e) => {
        bidNameTempRef.current = e.target.innerText;
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            bidNameRef.current.blur();
        }
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
                    onClick={canUserEdit ? () => setIsEditing(true) : showViewOnlyMessage}
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
                    >
                        {bidInfo}
                    </span>
                </div>
            </h1>
        </div>
    );
};

export default BidTitle;