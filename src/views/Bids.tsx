import React, { useState, useEffect, useRef } from "react";
import { useAuthUser } from "react-auth-kit";
import axios from "axios";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import { Link } from "react-router-dom";
import "./Bids.css";
import { useNavigate } from "react-router-dom";
import SideBarSmall from "../routes/SidebarSmall.tsx";
import handleGAEvent from "../utilities/handleGAEvent.tsx";
import { Button, Form, Modal, Pagination } from "react-bootstrap";
import { displayAlert } from "../helper/Alert.tsx";
import {
  faPlus,
  faSort,
  faSortDown,
  faSortUp,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select, MenuItem, FormControl, Skeleton } from "@mui/material";
import { styled } from "@mui/material/styles";
import withAuth from "../routes/withAuth.tsx";
import DashboardWizard from "../wizards/DashboardWizard.tsx"; // Adjust the import path as needed

const Bids = () => {
  const [bids, setBids] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [bidName, setBidName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bidToDelete, setBidToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const navigate = useNavigate();

  // Sorting bids based on the selected criteria
  const [sortConfig, setSortConfig] = useState({
    key: "timestamp",
    direction: "desc"
  });

  const sortData = (data, sortConfig) => {
    const sortedData = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Helper function to check if value is empty (null, undefined, or empty string)
      const isEmpty = (value) => {
        return (
          value === null ||
          value === undefined ||
          value === "" ||
          String(value).trim() === ""
        );
      };

      // Always put empty values at the end
      if (isEmpty(aValue) && !isEmpty(bValue)) return 1; // a is empty, b has value -> a goes to end
      if (!isEmpty(aValue) && isEmpty(bValue)) return -1; // a has value, b is empty -> b goes to end
      if (isEmpty(aValue) && isEmpty(bValue)) return 0; // both empty -> keep original order

      let comparison = 0;
      switch (sortConfig.key) {
        case "timestamp":
        case "submission_deadline":
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          const isValidDateA = !isNaN(dateA);
          const isValidDateB = !isNaN(dateB);

          // Handle invalid dates
          if (!isValidDateA && isValidDateB) return 1; // Invalid date goes to end
          if (isValidDateA && !isValidDateB) return -1; // Invalid date goes to end
          if (!isValidDateA && !isValidDateB) return 0; // Both invalid, keep order

          comparison = dateA - dateB;
          break;

        case "status":
          comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
          break;

        default:
          comparison = String(aValue)
            .toLowerCase()
            .localeCompare(String(bValue).toLowerCase());
      }

      // Apply sort direction for non-empty values
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return sortedData;
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <FontAwesomeIcon icon={faSort} />;
    }
    return sortConfig.direction === "asc" ? (
      <FontAwesomeIcon icon={faSortUp} />
    ) : (
      <FontAwesomeIcon icon={faSortDown} />
    );
  };

  // Update the table header to include sorting
  const headers = [
    { key: "bid_title", label: "Tender Name", width: "18%" },
    { key: "timestamp", label: "Last edited" },
    { key: "status", label: "Status" },
    { key: "client_name", label: "Client" },
    { key: "submission_deadline", label: "Deadline", width: "10%" },
    { key: "bid_manager", label: "Bid Manager", width: "15%" },
    { key: "opportunity_owner", label: "Opportunity Owner", width: "15%" },
    { key: "bid_qualification_result", label: "Result" }
  ];
  // Sort the bids before pagination
  const sortedBids = sortData(bids, sortConfig);

  const [currentPage, setCurrentPage] = useState(1);
  const bidsPerPage = 11;

  // Calculate the current bids to display
  const indexOfLastBid = currentPage * bidsPerPage;
  const indexOfFirstBid = indexOfLastBid - bidsPerPage;
  const currentBids = sortedBids.slice(indexOfFirstBid, indexOfLastBid);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const navigateToChatbot = (bid) => {
    localStorage.setItem("navigatedFromBidsTable", "true");
    localStorage.removeItem("bidState");
    navigate("/bid-extractor", { state: { bid: bid, fromBidsTable: true } });
    handleGAEvent("Bid Tracker", "Navigate to Bid", "Bid Table Link");
  };

  const StyledSelect = styled(Select)(({ theme, status }) => ({
    fontFamily: '"ClashDisplay", sans-serif',
    fontWeight: "bold",
    fontSize: "14px",
    padding: "5px 10px",
    borderRadius: "5px",
    width: "140px",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    backgroundColor: status === "ongoing" ? "orange" : "black",

    "& .MuiSelect-select": {
      padding: "2px 2px"
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none"
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: "none"
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      border: "none"
    },
    "& .MuiSvgIcon-root": {
      color: status === "ongoing" ? "inherit" : "#fff"
    }
  }));

  const StyledMenuItem = styled(MenuItem)({
    fontFamily: '"ClashDisplay", sans-serif',
    fontSize: "14px"
  });

  const fetchBids = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_bids_list/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );
      if (response.data && response.data.bids) {
        setBids(response.data.bids);
      }
    } catch (error) {
      console.error("Error fetching bids:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
    localStorage.removeItem("lastActiveBid");
  }, []);

  const confirmDeleteBid = async () => {
    if (bidToDelete) {
      const formData = new FormData();
      formData.append("bid_id", bidToDelete);

      try {
        const response = await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/delete_bid/`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`,
              "Content-Type": "multipart/form-data"
            }
          }
        );

        if (response.data && response.data.status === "success") {
          fetchBids();
          handleGAEvent("Bid Tracker", "Delete Bid", "Delete Bid Button");
        } else {
          displayAlert("Failed to delete bid", "error");
        }
      } catch (error) {
        console.error("Error deleting bid:", error);
        if (error.response) {
          if (error.response.status === 403) {
            displayAlert(
              "Only admins can delete bids. You don't have permission to delete this bid",
              "danger"
            );
          } else if (error.response.status === 404) {
            displayAlert("Bid not found", "danger");
          } else {
            displayAlert(
              `Error: ${error.response.data.detail || "Failed to delete bid"}`,
              "danger"
            );
          }
        } else if (error.request) {
          displayAlert(
            "No response received from server. Please try again.",
            "danger"
          );
        } else {
          displayAlert("Error deleting bid. Please try again.", "danger");
        }
      } finally {
        setShowDeleteModal(false);
      }
    }
  };

  const handleDeleteClick = (bidId) => {
    setBidToDelete(bidId);
    setShowDeleteModal(true);
  };

  const updateBidStatus = async (bidId, newStatus) => {
    try {
      const formData = new FormData();
      formData.append("bid_id", bidId);
      formData.append("status", newStatus);

      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/update_bid_status/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.data && response.data.status === "success") {
        handleGAEvent(
          "Bid Tracker",
          "Change Bid Status",
          "Bid Status Dropdown"
        );

        setTimeout(fetchBids, 500);
      } else {
        displayAlert("Failed to update bid status", "danger");
      }
    } catch (error) {
      console.error("Error updating bid status:", error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 403) {
          displayAlert(
            "You are a viewer. You don't have permission to update this bid's status",
            "danger"
          );
        } else if (error.response.status === 404) {
          displayAlert("Bid not found", "error");
        } else {
          displayAlert(
            `Error: ${error.response.data.detail || "Failed to update bid status"}`,
            "danger"
          );
        }
      } else if (error.request) {
        // The request was made but no response was received
        displayAlert(
          "No response received from server. Please try again.",
          "danger"
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        displayAlert("Error updating bid status. Please try again.", "danger");
      }
    }
  };

  const handleWriteProposalClick = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setBidName("");
  };

  const handleOngoingSidebarLinkClick = (label) => {
    handleGAEvent(
      "Sidebar Navigation",
      "Ongoing Link Click",
      "ongoing link nav"
    );
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!bidName) {
      displayAlert("Bid name cannot be empty", "danger");
      return;
    }
    if (bidName.length > 80) {
      displayAlert("Bid name cannot exceed 80 characters", "danger");
      return;
    }
    if (bids.some((bid) => bid.bid_title === bidName)) {
      displayAlert("Bid name already exists", "danger");
      return;
    }

    localStorage.removeItem("bidInfo");
    localStorage.removeItem("backgroundInfo");
    localStorage.removeItem("response");
    localStorage.removeItem("inputText");
    localStorage.removeItem("editorState");
    localStorage.removeItem("messages");
    localStorage.removeItem("bidState");
    handleOngoingSidebarLinkClick("Write a Proposal click");
    navigate("/bid-extractor", { state: { bidName } });
    setShowModal(false);
  };

  const SkeletonRow = () => (
    <tr className="py-4">
      <td>
        <Skeleton variant="text" width="100%" />
      </td>
      <td>
        <Skeleton variant="text" width="100%" />
      </td>
      <td>
        <Skeleton variant="text" width="100%" />
      </td>
      <td>
        <Skeleton variant="text" width="100%" />
      </td>
      <td>
        <Skeleton variant="text" width="100%" />
      </td>
      <td>
        <Skeleton variant="text" width="100%" />
      </td>
      <td>
        <Skeleton variant="text" width="100%" />
      </td>
      <td>
        <Skeleton variant="text" width="100%" />
      </td>
      <td style={{ textAlign: "center" }}>
        <Skeleton
          variant="rounded"
          width={20}
          height={20}
          style={{ marginLeft: "22px" }}
        />
      </td>
    </tr>
  );

  return (
    <div>
      <SideBarSmall />

      <div className="lib-container">
        <div className="scroll-container">
          <div className="proposal-header">
            <h1 id="dashboard-title" className="heavy">
              Dashboard
            </h1>
            <div style={{ display: "flex" }}>
              <Button
                onClick={handleWriteProposalClick}
                className="upload-button"
                id="new-bid-button"
              >
                <FontAwesomeIcon icon={faPlus} style={{ marginRight: "8px" }} />
                New Tender
              </Button>
              <label></label>
            </div>
          </div>

          <table className="bids-table mt-1">
            <thead>
              <tr>
                {headers.map((header) => (
                  <th
                    key={header.key}
                    style={{ width: header.width, cursor: "pointer" }}
                    onClick={() => requestSort(header.key)}
                    className="sortable-header"
                  >
                    {header.label}
                    {getSortIcon(header.key)}
                  </th>
                ))}
                <th style={{ textAlign: "center", width: "5%" }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(13)].map((_, index) => <SkeletonRow key={index} />)
                : currentBids.map((bid, index) => (
                    <tr key={index}>
                      <td>
                        <Link
                          to="/bid-extractor"
                          state={{ bid: bid, fromBidsTable: true }}
                          onClick={() => navigateToChatbot(bid)}
                        >
                          {bid.bid_title}
                        </Link>
                      </td>
                      <td>
                        {bid.timestamp
                          ? new Date(bid.timestamp).toLocaleDateString()
                          : ""}
                      </td>
                      <td>
                        <FormControl fullWidth>
                          <StyledSelect
                            value={bid.status.toLowerCase()}
                            onChange={(e) =>
                              updateBidStatus(bid._id, e.target.value)
                            }
                            className={`status-dropdown ${bid.status.toLowerCase()}`}
                          >
                            <StyledMenuItem value="ongoing">
                              Ongoing
                            </StyledMenuItem>
                            <StyledMenuItem value="complete">
                              Complete
                            </StyledMenuItem>
                          </StyledSelect>
                        </FormControl>
                      </td>
                      <td>{bid.client_name}</td>
                      <td>
                        {bid.submission_deadline &&
                        !isNaN(new Date(bid.submission_deadline))
                          ? new Date(
                              bid.submission_deadline
                            ).toLocaleDateString()
                          : ""}
                      </td>
                      <td>{bid.bid_manager}</td>
                      <td>{bid.opportunity_owner}</td>
                      <td>{bid.bid_qualification_result || ""}</td>
                      <td style={{ textAlign: "center" }}>
                        <FontAwesomeIcon
                          icon={faTrash}
                          onClick={() => handleDeleteClick(bid._id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          <div className="pagination-container">
            {[...Array(Math.ceil(sortedBids.length / bidsPerPage))].map(
              (_, index) => (
                <button
                  key={index + 1}
                  className={`pagination-button ${currentPage === index + 1 ? "active" : ""}`}
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </button>
              )
            )}
          </div>
          <DashboardWizard />
        </div>
        <Modal
          show={showModal}
          onHide={handleModalClose}
          className="custom-modal-newbid"
        >
          <Modal.Header closeButton className="py-3 px-4">
            <Modal.Title>Enter Tender Name</Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-4 py-4" style={{ height: "12vh" }}>
            <div className="content-scaler">
              <Form onSubmit={handleModalSubmit}>
                <div className="search-input-group">
                  <Form.Control
                    type="text"
                    value={bidName}
                    onChange={(e) => setBidName(e.target.value)}
                    placeholder="Enter tender name"
                    maxLength={80}
                    className="form-control"
                  />
                  <Button type="submit" className="search-button">
                    Submit
                  </Button>
                </div>
              </Form>
            </div>
          </Modal.Body>
        </Modal>

        <Modal
          show={showDeleteModal}
          onHide={() => setShowDeleteModal(false)}
          className=""
        >
          <Modal.Header closeButton className="py-3 px-4">
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-4 py-4" style={{ height: "12vh" }}>
            Are you sure you want to delete this tender?
          </Modal.Body>
          <Modal.Footer>
            <div className="">
              <Button
                className="upload-button"
                style={{ backgroundColor: "red" }}
                onClick={confirmDeleteBid}
              >
                Delete
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default withAuth(Bids);
