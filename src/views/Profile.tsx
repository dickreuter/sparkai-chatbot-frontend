import React, { useState, useEffect, useRef } from "react";
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import { Form, Row, Col, Card, Button, Modal, Table, Spinner } from 'react-bootstrap';
import axios from 'axios';
import './Profile.css';
import { API_URL, HTTP_PREFIX } from "../helper/Constants.tsx";

const ProfilePage = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  
  const [formData, setFormData] = useState({
    username: '', 
    email: '',
    region: '', 
    company: '', 
    jobRole: '',
    userType: '',  
    licences: 0,
    productName: '' // Added productName field
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [organizationUsers, setOrganizationUsers] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http${HTTP_PREFIX}://${API_URL}/profile`,  {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        });
        setFormData({
          username: response.data.login || '', 
          email: response.data.email || '',
          region: response.data.region || '',
          company: response.data.company || '',
          jobRole: response.data.jobRole || '',
          userType: response.data.userType || '', 
          licences: response.data.licenses || 0,
          productName: response.data.product_name || '' // Fetch productName from the response
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to load profile data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [tokenRef]);

  useEffect(() => {
    const fetchOrganizationUsers = async () => {
      try {
        const response = await axios.get(`http${HTTP_PREFIX}://${API_URL}/organization_users`,  {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        });
        setOrganizationUsers(response.data);
      } catch (err) {
        console.error('Error fetching organization users:', err);
      }
    };

    if (formData.userType === 'owner') {
      fetchOrganizationUsers();
    }
  }, [formData.userType]);

  if (error) return <p>{error}</p>;

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
  
    try {
      const response = await axios.post(`http${HTTP_PREFIX}://${API_URL}/invite_user`, { email: inviteEmail }, {
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
        },
      });
      setInviteSuccess('Invitation sent successfully!');
      setFormData((prevData) => ({
        ...prevData,
        licences: prevData.licences - 1 // Deduct the license count
      }));
    } catch (err) {
      console.error('Error inviting user:', err);
  
      if (err.response) {
        // Handle specific error status codes
        switch (err.response.status) {
          case 400:
            setInviteError('User with this email already exists.');
            break;
          case 403:
            setInviteError('Permission denied: You do not have the rights to invite users.');
            break;
          case 404:
            setInviteError('Your account was not found. Please contact support.');
            break;
          case 500:
            setInviteError('Internal server error. Please try again later.');
            break;
          default:
            setInviteError('Failed to send invitation. Please try again.');
        }
      } else {
        setInviteError('Failed to send invitation. Please check your connection and try again.');
      }
    }
  };

  if (loading) {
    return (
      <div>
        <SideBarSmall />
        <div className="loading-container">
          <div style={{marginLeft: "8%"}}>
          <Spinner animation="border" variant="primary" className="spinner" />
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
        <Card >
          <Card.Body>
            <Form>
              <Row className="profile-form-row">
                <Col>
                  <Form.Group controlId="formUsername">
                    <Form.Label className="profile-form-label">Username</Form.Label>
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
                    <Form.Label className="profile-form-label">Email</Form.Label>
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
                    <Form.Label className="profile-form-label">Company</Form.Label>
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
                    <Form.Label className="profile-form-label">Job Role</Form.Label>
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
                    <Form.Label className="profile-form-label">Region</Form.Label>
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
                    <Form.Label className="profile-form-label">Subscription Type</Form.Label>
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
        {formData.userType === 'owner' && (
          <>
            <Card className="mt-4 mb-4">
              <Card.Body>
              <div className="proposal-header ">
                <Card.Title>Admin Panel</Card.Title>
                <Button onClick={() => setShowModal(true)} className="upload-button">Add New User</Button>
              </div>
                <Card.Text>
                  Licenses available: {formData.licences}
                </Card.Text>
                
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
                        <td>{user.username || 'Request Pending'}</td>
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
                  {inviteError && <p style={{ color: 'red' }}>{inviteError}</p>}
                  {inviteSuccess && <p style={{ color: 'green' }}>{inviteSuccess}</p>}
                  <p>
                    This will consume a license. Licenses left: {formData.licences}
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
}

export default withAuth(ProfilePage);
