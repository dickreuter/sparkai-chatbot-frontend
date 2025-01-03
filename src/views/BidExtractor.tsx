import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import SideBarSmall from "../routes/SidebarSmall.tsx";
import { useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Col,
  Row,
  Spinner,
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import "./BidExtractor.css";
import { BidContext } from "./BidWritingStateManagerView.tsx";
import { displayAlert } from "../helper/Alert";
import { FormControl } from "@mui/material";
import ContributorModal from "../modals/ContributorModal.tsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScrewdriverWrench } from "@fortawesome/free-solid-svg-icons";
import TenderLibrary from "../components/TenderLibrary.tsx";
import CustomDateInput from "../buttons/CustomDateInput.tsx";

import {
  StyledSelect,
  StyledMenuItem
} from "../components/StyledMuiComponents";

const BidExtractor = () => {
  const getAuth = useAuthUser();
  const auth = useMemo(() => getAuth(), [getAuth]);
  const tokenRef = useRef(auth?.token || "default");

  const { sharedState, setSharedState } = useContext(BidContext);
  const {
    bidInfo,
    opportunity_information,
    compliance_requirements,
    questions,
    contributors,
    object_id
  } = sharedState;

  const location = useLocation();
  const bidData = location.state?.bid || "";
  const initialBidName = location.state?.bidName; // Retrieve bidName from location state

  const [loading, setLoading] = useState(false);

  const [existingBidNames, setExistingBidNames] = useState([]);

  const [organizationUsers, setOrganizationUsers] = useState([]);
  const [showContributorModal, setShowContributorModal] = useState(false);

  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const currentUserPermission = contributors[auth.email] || "viewer"; // Default to 'viewer' if not found
  console.log("currentUserpermissionextract" + currentUserPermission);
  const canUserEdit =
    currentUserPermission === "admin" || currentUserPermission === "editor";

  const showViewOnlyMessage = () => {
    console.log(currentUserPermission);
    displayAlert("You only have permission to view this bid.", "danger");
  };

  const [isGeneratingCompliance, setIsGeneratingCompliance] = useState(false);

  const generateComplianceRequirements = async () => {
    if (!canUserEdit) {
      showViewOnlyMessage();
      return;
    }

    setIsGeneratingCompliance(true);
    const formData = new FormData();
    formData.append("bid_id", object_id);

    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/generate_compliance_requirements`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setSharedState((prevState) => ({
        ...prevState,
        compliance_requirements: result.data.requirements
      }));

      displayAlert(
        "Compliance requirements generated successfully!",
        "success"
      );
    } catch (err) {
      console.error("Error generating compliance requirements:", err);
      if (err.response && err.response.status === 404) {
        displayAlert(
          "No documents found in the tender library. Please upload documents before generating compliance requirements.",
          "warning"
        );
      } else {
        displayAlert(
          "No documents found in the tender library. Please upload documents before generating compliance requirements.",
          "danger"
        );
      }
    } finally {
      setIsGeneratingCompliance(false);
    }
  };

  const [isGeneratingOpportunity, setIsGeneratingOpportunity] = useState(false);

  const generateOpportunityInformation = async () => {
    if (!canUserEdit) {
      showViewOnlyMessage();
      return;
    }

    setIsGeneratingOpportunity(true);
    const formData = new FormData();
    formData.append("bid_id", object_id);

    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/generate_opportunity_information`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setSharedState((prevState) => ({
        ...prevState,
        opportunity_information: result.data.opportunity_information
      }));

      displayAlert(
        "Opportunity information generated successfully!",
        "success"
      );
    } catch (err) {
      console.error("Error generating opportunity information:", err);
      if (err.response && err.response.status === 404) {
        displayAlert(
          "No documents found in the tender library. Please upload documents before generating opportunity information.",
          "warning"
        );
      } else {
        displayAlert(
          "No documents found in the tender library. Please upload documents before generating opportunity information.",
          "danger"
        );
      }
    } finally {
      setIsGeneratingOpportunity(false);
    }
  };

  const fetchOrganizationUsers = async () => {
    try {
      const response = await axios.get(
        `http${HTTP_PREFIX}://${API_URL}/organization_users`,
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );
      setOrganizationUsers(response.data);
      console.log(contributors);
    } catch (err) {
      console.log("Error fetching organization users:");
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await axios.get(
        `http${HTTP_PREFIX}://${API_URL}/profile`,
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );
      setCurrentUserEmail(response.data.email);
    } catch (err) {
      console.log("Failed to load profile data");
      setLoading(false);
    }
  };

  const fetchExistingBidNames = async () => {
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
        setExistingBidNames(response.data.bids.map((bid) => bid.bid_title));
      }
    } catch (error) {
      console.error("Error fetching bid names:", error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([
        fetchUserData(),
        fetchOrganizationUsers(),
        fetchExistingBidNames()
      ]);
    };
    fetchInitialData();
  }, []);

  const handleAddContributor = (user, permission) => {
    setSharedState((prevState) => ({
      ...prevState,
      contributors: {
        ...prevState.contributors,
        [user]: permission
      }
    }));
  };

  const handleRemoveContributor = (login) => {
    setSharedState((prevState) => {
      const updatedContributors = { ...prevState.contributors };
      delete updatedContributors[login];
      return { ...prevState, contributors: updatedContributors };
    });
  };

  const handleUpdateContributor = (login, newPermission) => {
    setSharedState((prevState) => ({
      ...prevState,
      contributors: {
        ...prevState.contributors,
        [login]: newPermission
      }
    }));
  };

  const ContributorsCard = () => {
    const contributorCount = Object.keys(contributors).length;

    return (
      <Card className="mb-4 same-height-card">
        <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
          <h1 className="inputbox-title mb-0 mt-1">Contributors:</h1>

          <OverlayTrigger
            placement="top"
            overlay={
              <Tooltip id="contributors-tooltip">
                Add or manage contributors for this tender
              </Tooltip>
            }
          >
            <Button
              className="p-0 contributors-button"
              variant="link"
              id="contributors-card"
              onClick={() => setShowContributorModal(true)}
              style={{
                fontSize: "1rem",
                color: "#4a4a4a",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                textDecoration: "none"
              }}
            >
              <i className="fas fa-plus"></i>
            </Button>
          </OverlayTrigger>
        </Card.Header>
        <Card.Body className="py-2 px-3 d-flex">
          <div>
            This Proposal has {contributorCount} Contributor
            {contributorCount !== 1 ? "s" : ""}
          </div>
        </Card.Body>
      </Card>
    );
  };

  useEffect(() => {
    const navigatedFromBidsTable = localStorage.getItem(
      "navigatedFromBidsTable"
    );

    if (
      navigatedFromBidsTable === "true" &&
      location.state?.fromBidsTable &&
      bidData
    ) {
      console.log("from bids table");
      console.log(bidData);

      setSharedState((prevState) => {
        const original_creator = bidData?.original_creator || auth.email;
        let contributors = bidData?.contributors || {};

        if (
          !bidData?.original_creator ||
          Object.keys(contributors).length === 0
        ) {
          console.log("length 0");

          console.log(currentUserEmail);
          //had to change to user their login
          contributors = { [auth.email]: "admin" };
        }

        return {
          ...prevState,
          bidInfo: bidData?.bid_title || "",
          opportunity_information:
            bidData?.opportunity_information?.trim() || "",
          compliance_requirements:
            bidData?.compliance_requirements?.trim() || "",
          client_name: bidData?.client_name || "",
          bid_qualification_result: bidData?.bid_qualification_result || "",
          questions: bidData?.questions || "",
          opportunity_owner: bidData?.opportunity_owner || "",
          submission_deadline: bidData?.submission_deadline || "",
          bid_manager: bidData?.bid_manager || "",
          contributors: contributors,
          original_creator: original_creator,
          object_id: bidData?._id || "",
          outline: bidData?.outline || []
        };
      });

      localStorage.setItem("navigatedFromBidsTable", "false");
    } else if (initialBidName && initialBidName !== "") {
      // Update bidInfo with the initial bid name if it's provided and not empty
      // USER CREATES A NEW BID
      console.log("newbid created");
      setSharedState((prevState) => ({
        ...prevState,
        bidInfo: initialBidName,
        original_creator: auth.email,
        contributors: auth.email ? { [auth.email]: "admin" } : {}
      }));
    }
    const updatedBid = { bidData };
    window.dispatchEvent(new CustomEvent("bidUpdated", { detail: updatedBid }));
  }, []);

  const handleOpportunityInformationChange = (e) => {
    const newOpportunityInformation = e.target.value;

    setSharedState((prevState) => ({
      ...prevState,
      opportunity_information: newOpportunityInformation
    }));
  };

  const handleComplianceRequirementsChange = (e) => {
    const newComplianceRequirements = e.target.value;
    setSharedState((prevState) => ({
      ...prevState,
      compliance_requirements: newComplianceRequirements
    }));
  };

  const handleBidQualificationResultChange = (e) => {
    const newBidQualificationResult = e.target.value;
    setSharedState((prevState) => ({
      ...prevState,
      bid_qualification_result: newBidQualificationResult
    }));
  };

  const handleClientNameResultChange = (e) => {
    const newClientName = e.target.value;
    setSharedState((prevState) => ({
      ...prevState,
      client_name: newClientName
    }));
  };

  const handleOpportunityOwnerChange = (e) => {
    const newOpportunityOwner = e.target.value;
    setSharedState((prevState) => ({
      ...prevState,
      opportunity_owner: newOpportunityOwner
    }));
  };

  const handleSubmissionDeadlineChange = (newDate) => {
    setSharedState((prevState) => ({
      ...prevState,
      submission_deadline: newDate
    }));
  };

  const handleBidManagerChange = (e) => {
    const newBidManager = e.target.value;
    setSharedState((prevState) => ({
      ...prevState,
      bid_manager: newBidManager
    }));
  };

  const clientNameRef = useRef(null);
  const submissionDeadlineRef = useRef(null);
  const bidManagerRef = useRef(null);
  const opportunityOwnerRef = useRef(null);
  const bidQualificationResultRef = useRef(null);
  const opportunityInformationRef = useRef(null);
  const complianceRequirementsRef = useRef(null);

  const handleDisabledClick = (e) => {
    if (!canUserEdit) {
      e.preventDefault();
      e.stopPropagation();
      showViewOnlyMessage();
    }
  };

  const createClickHandler = (ref) => (e) => {
    if (!canUserEdit && ref.current && ref.current.contains(e.target)) {
      handleDisabledClick(e);
    }
  };

  useEffect(() => {
    const refs = [
      clientNameRef,
      submissionDeadlineRef,
      bidManagerRef,
      opportunityOwnerRef,
      bidQualificationResultRef,
      opportunityInformationRef,
      complianceRequirementsRef
    ];

    const clickHandlers = refs.map((ref) => createClickHandler(ref));

    refs.forEach((ref, index) => {
      if (ref.current) {
        ref.current.addEventListener("click", clickHandlers[index]);
      }
    });

    return () => {
      refs.forEach((ref, index) => {
        if (ref.current) {
          ref.current.removeEventListener("click", clickHandlers[index]);
        }
      });
    };
  }, [canUserEdit]);

  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <div className="scroll-container">
          <BidNavbar
            showViewOnlyMessage={showViewOnlyMessage}
            initialBidName={initialBidName}
          />
          <div>
            <div className="input-container mt-3">
              <Row className="no-gutters mx-n2">
                <Col md={4} className="px-2">
                  <Card className="mb-4 same-height-card">
                    <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                      <h1 className="inputbox-title mb-0 mt-1">Client Name:</h1>
                    </Card.Header>
                    <Card.Body className="py-0 pl-2">
                      <div
                        ref={clientNameRef}
                        style={{ width: "100%", height: "100%" }}
                      >
                        <textarea
                          className="form-control single-line-textarea"
                          value={sharedState.client_name}
                          onChange={handleClientNameResultChange}
                          disabled={!canUserEdit}
                        ></textarea>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4} className="px-2">
                  <Card className="mb-4 same-height-card">
                    <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                      <h1 className="inputbox-title mb-0 mt-1">
                        Submission Deadline:
                      </h1>
                    </Card.Header>
                    <Card.Body
                      className="py-0 px-1"
                      ref={submissionDeadlineRef}
                    >
                      <CustomDateInput
                        value={sharedState.submission_deadline}
                        onChange={handleSubmissionDeadlineChange}
                        disabled={!canUserEdit}
                      />
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4} className="px-2">
                  <Card className="mb-4 same-height-card">
                    <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                      <h1 className="inputbox-title mb-0 mt-1">Bid Manager:</h1>
                    </Card.Header>
                    <Card.Body className="py-0 pl-2" ref={bidManagerRef}>
                      <textarea
                        className="form-control single-line-textarea"
                        value={sharedState.bid_manager}
                        onChange={handleBidManagerChange}
                        onClick={handleDisabledClick}
                        disabled={!canUserEdit}
                      ></textarea>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row className="no-gutters mt-0 mx-n2">
                <Col md={4} className="px-2">
                  <Card className="mb-4 same-height-card">
                    <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                      <h1 className="inputbox-title mb-0 mt-1">
                        Opportunity Owner:
                      </h1>
                    </Card.Header>
                    <Card.Body className="py-0 pl-2" ref={opportunityOwnerRef}>
                      <textarea
                        className="form-control single-line-textarea"
                        value={sharedState.opportunity_owner}
                        onChange={handleOpportunityOwnerChange}
                        onClick={handleDisabledClick}
                        disabled={!canUserEdit}
                      ></textarea>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={4} className="px-2">
                  <ContributorsCard />
                </Col>

                <Col md={4} className="px-2">
                  <Card className="mb-4 same-height-card">
                    <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                      <h1 className="inputbox-title mb-0 mt-1">Bid Result:</h1>
                    </Card.Header>
                    <Card.Body
                      className="py-0 pl-2"
                      ref={bidQualificationResultRef}
                    >
                      <FormControl fullWidth variant="standard">
                        <StyledSelect
                          value={sharedState.bid_qualification_result || ""}
                          onChange={handleBidQualificationResultChange}
                          onClick={handleDisabledClick}
                          disabled={!canUserEdit}
                          displayEmpty
                        >
                          <StyledMenuItem value="" disabled>
                            <em>Select result...</em>
                          </StyledMenuItem>
                          <StyledMenuItem value="Win">Win</StyledMenuItem>
                          <StyledMenuItem value="Lose">Lose</StyledMenuItem>
                        </StyledSelect>
                      </FormControl>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>

            <Row className="mt-4 mb-4">
              <Col md={6}>
                <Card className="mb-4 custom-grey-border">
                  <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                    <h1 className="requirements-title">
                      Opportunity Information
                    </h1>
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip id="opportunity-info-tooltip">
                          Extract opportunity information automatically from
                          your uploaded tender documents
                        </Tooltip>
                      }
                    >
                      <span
                        onClick={
                          canUserEdit
                            ? generateOpportunityInformation
                            : showViewOnlyMessage
                        }
                        style={{
                          cursor: canUserEdit ? "pointer" : "not-allowed",
                          opacity: canUserEdit ? 1 : 0.5,
                          color: "#4a4a4a",
                          fontSize: "1.2rem",
                          marginRight: "5px"
                        }}
                      >
                        {isGeneratingOpportunity ? (
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faScrewdriverWrench}
                            id="opportunity-information-card"
                          />
                        )}
                      </span>
                    </OverlayTrigger>
                  </Card.Header>
                  <Card.Body
                    className="px-0 py-1"
                    ref={opportunityInformationRef}
                  >
                    <textarea
                      className="form-control requirements-textarea"
                      placeholder="Click the tool icon to extract opportunity information from your tender documents..."
                      value={opportunity_information || ""}
                      onChange={handleOpportunityInformationChange}
                      disabled={!canUserEdit}
                      style={{ overflowY: "auto" }}
                    ></textarea>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="mb-4 custom-grey-border">
                  <Card.Header className="d-flex justify-content-between align-items-center dark-grey-header">
                    <h1 className="requirements-title">
                      Compliance Requirements
                    </h1>

                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip id="compliance-req-tooltip">
                          Extract compliance requirements automatically from
                          your uploaded tender documents
                        </Tooltip>
                      }
                    >
                      <span
                        onClick={
                          canUserEdit
                            ? generateComplianceRequirements
                            : showViewOnlyMessage
                        }
                        style={{
                          cursor: canUserEdit ? "pointer" : "not-allowed",
                          opacity: canUserEdit ? 1 : 0.5,
                          color: "#4a4a4a",
                          fontSize: "1.2rem",
                          marginRight: "5px"
                        }}
                      >
                        {isGeneratingCompliance ? (
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faScrewdriverWrench}
                            id="compliance-requirements-card"
                          />
                        )}
                      </span>
                    </OverlayTrigger>
                  </Card.Header>
                  <Card.Body
                    className="px-0 py-1"
                    ref={complianceRequirementsRef}
                  >
                    <textarea
                      className="form-control requirements-textarea"
                      placeholder="Click the tool icon to extract compliance requirements from your tender documents..."
                      value={compliance_requirements || ""}
                      onChange={handleComplianceRequirementsChange}
                      disabled={!canUserEdit}
                      style={{ overflowY: "auto" }}
                    ></textarea>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row></Row>

            <Row className="mb-0">
              <Col md={12}>
                <TenderLibrary key={object_id} object_id={object_id} />
              </Col>
            </Row>

            <ContributorModal
              show={showContributorModal}
              onHide={() => setShowContributorModal(false)}
              onAddContributor={handleAddContributor}
              onUpdateContributor={handleUpdateContributor}
              onRemoveContributor={handleRemoveContributor}
              organizationUsers={organizationUsers}
              currentContributors={contributors}
              currentUserEmail={currentUserEmail}
              currentUserPermission={currentUserPermission}
            />
          </div>
        </div>
      </div>
      {/*<BidExtractorWizard />*/}
    </div>
  );
};

export default withAuth(BidExtractor);
