import React, { useState } from 'react';
import { FormControl, InputLabel, MenuItem, Select, List, ListItem, ListItemText, IconButton } from "@mui/material";
import { Button, Modal } from "react-bootstrap";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import withAuth from "../routes/withAuth";

const ContributorModal = ({ 
    show, 
    onHide, 
    onAddContributor, 
    onUpdateContributor, 
    onRemoveContributor,
    organizationUsers, 
    currentContributors,
    currentUserEmail,
    currentUserPermission
  }) => {
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedPermission, setSelectedPermission] = useState('viewer');
    const [permissionToChange, setPermissionToChange] = useState(null);
  
    const fontStyle = {
      fontFamily: '"ClashDisplay", sans-serif'
    };
  
    const isAdmin = currentUserPermission === 'admin';

    const handleAddContributor = () => {
      if (isAdmin) {
        onAddContributor(selectedUser, selectedPermission);
        setSelectedUser('');
        setSelectedPermission('viewer');
        onHide();
      }
    };

    const handleUpdatePermission = (email, newPermission) => {
      if (isAdmin) {
        setPermissionToChange({ email, newPermission });
      }
    };

    const confirmPermissionChange = () => {
      if (permissionToChange) {
        if (permissionToChange.newPermission === 'remove') {
          onRemoveContributor(permissionToChange.email);
        } else {
          onUpdateContributor(permissionToChange.email, permissionToChange.newPermission);
        }
        setPermissionToChange(null);
      }
    };

    const cancelPermissionChange = () => {
      setPermissionToChange(null);
    };

    const selectStyle = {
      ...fontStyle,
      height: '45px',
    };

    const labelStyle = {
      ...fontStyle,
      transform: 'translate(14px, -6px) scale(0.75)',
      background: 'white',
      padding: '0 4px',
    };

    return (
      <Modal
        show={show}
        onHide={onHide}
        dialogClassName="contributor-modal wide-modal"
      >
        <Modal.Header closeButton className="px-4 py-3">
          <Modal.Title style={fontStyle}>Manage Contributors</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 py-3">
          <h5 style={fontStyle}>Current Contributors</h5>
          <List>
            {Object.entries(currentContributors).map(([email, permission]) => (
              <ListItem key={email} style={{ padding: '0', marginBottom: '8px', alignItems: 'center' }}>
                <ListItemText 
                  primary={email} 
                  primaryTypographyProps={{ style: { ...fontStyle, flex: '1 1 auto' } }}
                />
                <FormControl style={{ minWidth: 120, marginLeft: 16 }}>
                  <Select
                    value={permissionToChange && permissionToChange.email === email ? permissionToChange.newPermission : permission}
                    onChange={(e) => handleUpdatePermission(email, e.target.value)}
                    style={{ ...fontStyle, border: 'none' }}
                    variant="standard"
                    disabled={!isAdmin}
                  >
                    <MenuItem value="viewer" style={fontStyle}>Viewer</MenuItem>
                    <MenuItem value="editor" style={fontStyle}>Editor</MenuItem>
                    <MenuItem value="admin" style={fontStyle}>Admin</MenuItem>
                    <MenuItem value="remove" style={{...fontStyle, color: 'red'}}>Remove</MenuItem>
                  </Select>
                </FormControl>
                {permissionToChange && permissionToChange.email === email && (
                  <>
                    <IconButton onClick={confirmPermissionChange} size="small" style={{ marginLeft: '8px' }}>
                      <CheckIcon style={{ color: 'green' }} />
                    </IconButton>
                    <IconButton onClick={cancelPermissionChange} size="small">
                      <CloseIcon style={{ color: 'red' }} />
                    </IconButton>
                  </>
                )}
              </ListItem>
            ))}
          </List>

          {isAdmin && (
            <>
              <h5 style={{ ...fontStyle, marginTop: 24 }}>Add New Contributor</h5>
              <FormControl fullWidth margin="normal" style={{ marginBottom: '10px' }}>
                <InputLabel id="select-user-label" style={labelStyle}>Select User</InputLabel>
                <Select
                  labelId="select-user-label"
                  id="select-user"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  label="Select User"
                  style={selectStyle}
                  MenuProps={{
                    PaperProps: {
                      style: fontStyle
                    }
                  }}
                >
                  {organizationUsers
                    .filter(user => !currentContributors.hasOwnProperty(user.email))
                    .map((user, index) => (
                      <MenuItem key={index} value={user.email} style={fontStyle}>{user.email}</MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
             
              <FormControl fullWidth margin="normal" style={{ marginBottom: '10px' }}>
                <InputLabel id="select-permission-label" style={labelStyle}>Select Permission</InputLabel>
                <Select
                  labelId="select-permission-label"
                  id="select-permission"
                  value={selectedPermission}
                  onChange={(e) => setSelectedPermission(e.target.value)}
                  label="Select Permission"
                  style={selectStyle}
                  MenuProps={{
                    PaperProps: {
                      style: fontStyle
                    }
                  }}
                >
                  <MenuItem value="viewer" style={fontStyle}>Viewer</MenuItem>
                  <MenuItem value="editor" style={fontStyle}>Editor</MenuItem>
                  <MenuItem value="admin" style={fontStyle}>Admin</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="px-4 py-3">
          {isAdmin && (
            <Button
              onClick={handleAddContributor}
              className="upload-button"
              style={{...fontStyle, textTransform: 'none'}}
              disabled={!selectedUser}
            >
              Add Contributor
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    );
};

export default withAuth(ContributorModal);