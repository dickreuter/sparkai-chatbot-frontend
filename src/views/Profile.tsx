import React, { useState, useEffect, useRef } from "react";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import SideBarSmall from "../routes/SidebarSmall.tsx";
import {
  Form,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Table,
  Spinner
} from "react-bootstrap";
import axios from "axios";
import "./Profile.css";
import { API_URL, HTTP_PREFIX } from "../helper/Constants.tsx";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ProfilePage = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    region: "",
    company: "",
    jobRole: "",
    userType: "",
    licences: 0,
    productName: "",
    companyObjectives: "",
    toneOfVoice: ""
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [organizationUsers, setOrganizationUsers] = useState([]);

  const [saveButtonState, setSaveButtonState] = useState("normal"); // 'normal', 'loading', 'success'

  useEffect(() => {
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
        setFormData({
          username: response.data.login || "",
          email: response.data.email || "",
          region: response.data.region || "",
          company: response.data.company || "",
          jobRole: response.data.jobRole || "",
          userType: response.data.userType || "",
          licences: response.data.licenses || 0,
          productName: response.data.product_name || "",
          companyObjectives: response.data.company_objectives || "",
          toneOfVoice: response.data.tone_of_voice || ""
        });
        setLoading(false);
      } catch (err) {
        setError("Failed to load profile data");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [tokenRef]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveButtonState("loading");
    try {
      const dataToSend = {
        company_objectives: formData.companyObjectives,
        tone_of_voice: formData.toneOfVoice
      };

      await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/update_company_info`,
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );
      setSaveButtonState("success");
      setTimeout(() => setSaveButtonState("normal"), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Error updating profile:", err);
      setSaveButtonState("normal");
      // Handle error (e.g., show an error message)
    }
  };

  const renderSaveButton = () => {
    switch (saveButtonState) {
      case "success":
        return (
          <Button
            type="submit"
            className="upload-button"
            style={{ backgroundColor: "green", borderColor: "green" }}
          >
            Saved{" "}
            <FontAwesomeIcon
              icon={faCheckCircle}
              style={{ marginLeft: "5px" }}
            />
          </Button>
        );
      default:
        return (
          <Button type="submit" className="upload-button">
            Save Changes
          </Button>
        );
    }
  };

  useEffect(() => {
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
      } catch (err) {
        console.error("Error fetching organization users:", err);
      }
    };

    if (formData.userType === "owner") {
      fetchOrganizationUsers();
    }
  }, [formData.userType]);

  if (error) return <p>{error}</p>;

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/invite_user`,
        { email: inviteEmail },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );
      setInviteSuccess("Invitation sent successfully!");
      setFormData((prevData) => ({
        ...prevData,
        licences: prevData.licences - 1 // Deduct the license count
      }));
    } catch (err) {
      console.error("Error inviting user:", err);

      if (err.response) {
        // Handle specific error status codes
        switch (err.response.status) {
          case 400:
            setInviteError("User with this email already exists.");
            break;
          case 403:
            setInviteError(
              "Permission denied: You do not have the rights to invite users."
            );
            break;
          case 404:
            setInviteError(
              "Your account was not found. Please contact support."
            );
            break;
          case 500:
            setInviteError("Internal server error. Please try again later.");
            break;
          default:
            setInviteError("Failed to send invitation. Please try again.");
        }
      } else {
        setInviteError(
          "Failed to send invitation. Please check your connection and try again."
        );
      }
    }
  };

  if (loading) {
    return (
      <div>
        <SideBarSmall />
        <div className="loading-container">
          <div style={{ marginLeft: "8%" }}>
            <Spinner animation="border" className="spinner" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <div className="scroll-container">
          <h1 className="heavy">Profile</h1>
          <Card>
            <Card.Body>
              <Form>
                <Row className="profile-form-row">
                  <Col>
                    <Form.Group controlId="formUsername">
                      <Form.Label className="profile-form-label">
                        Username
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your username"
                        name="username"
                        value={formData.username}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group controlId="formEmail">
                      <Form.Label className="profile-form-label">
                        Email
                      </Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="name@company.com"
                        name="email"
                        value={formData.email}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="profile-form-row">
                  <Col>
                    <Form.Group controlId="formCompany">
                      <Form.Label className="profile-form-label">
                        Company
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your company"
                        name="company"
                        value={formData.company}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group controlId="formJobRole">
                      <Form.Label className="profile-form-label">
                        Job Role
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your job role"
                        name="jobRole"
                        value={formData.jobRole}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="profile-form-row">
                  <Col>
                    <Form.Group controlId="formRegion">
                      <Form.Label className="profile-form-label">
                        Region
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your region"
                        name="region"
                        value={formData.region}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group controlId="formProductName">
                      <Form.Label className="profile-form-label">
                        Subscription Type
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your product name"
                        name="productName"
                        value={formData.productName}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          <Card className="mt-4 mb-4">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formCompanyObjectives">
                  <Form.Label>Company Objectives</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="companyObjectives"
                    value={formData.companyObjectives}
                    onChange={handleInputChange}
                    placeholder="Outline your company’s overall mission and key goals, focusing on how your products or services deliver value. Highlight your strengths, such as innovation, efficiency, or expertise, and how they align with client needs or industry challenges. Emphasise outcomes that demonstrate your ability to provide measurable impact (e.g., increased performance, cost savings, or long-term value)"
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formToneOfVoice">
                  <Form.Label>Tone of Voice</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="toneOfVoice"
                    value={formData.toneOfVoice}
                    onChange={handleInputChange}
                    placeholder="Define the preferred tone for your bids, whether it should be professional, approachable, technical, or accessible. Ensure the tone matches the client’s level of formality and understanding. Specify whether industry-specific language should be detailed or simplified."
                  />
                </Form.Group>

                {renderSaveButton()}
              </Form>
            </Card.Body>
          </Card>

          {formData.userType === "owner" && (
            <>
              <Card className="mb-3">
                <Card.Body>
                  <div className="proposal-header ">
                    <Card.Title>Admin Panel</Card.Title>
                    <Button
                      onClick={() => setShowModal(true)}
                      className="upload-button"
                    >
                      Add New User
                    </Button>
                  </div>
                  <Card.Text>Licenses available: {formData.licences}</Card.Text>

                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Username</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizationUsers.map((user, index) => (
                        <tr key={index}>
                          <td>{user.email}</td>
                          <td>{user.username || "Request Pending"}</td>
                          <td>{user.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
              <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                  <Modal.Title>Invite New User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {inviteError && <p style={{ color: "red" }}>{inviteError}</p>}
                  {inviteSuccess && (
                    <p style={{ color: "green" }}>{inviteSuccess}</p>
                  )}
                  <p>
                    This will consume a license. Licenses left:{" "}
                    {formData.licences}
                  </p>
                  <Form onSubmit={handleInviteSubmit}>
                    <Form.Group controlId="formInviteEmail">
                      <Form.Label>Email address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        required
                      />
                    </Form.Group>
                    <Button className="upload-button mt-3" type="submit">
                      Send Invite
                    </Button>
                  </Form>
                </Modal.Body>
              </Modal>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(ProfilePage);
