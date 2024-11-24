import React, { useContext, useRef, useState, useEffect } from 'react';
import { Alert, Button, Card, CardContent } from '@mui/material';
import { useAuthUser } from 'react-auth-kit';
import { BidContext } from './BidWritingStateManagerView';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import DescriptionIcon from '@mui/icons-material/Description';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ErrorIcon from '@mui/icons-material/Error';
import BidNavbar from '../routes/BidNavbar';
import SideBarSmall from '../routes/SidebarSmall';
import CircularProgress from '@mui/material/CircularProgress';
import { displayAlert } from '../helper/Alert';

const ProposalPreview = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const { sharedState } = useContext(BidContext);

  // Create the viewer URL using the GET endpoint
  const previewUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    `http${HTTP_PREFIX}://${API_URL}/preview_proposal/${sharedState.object_id}?token=${tokenRef.current}`
  )}`;

  console.log(previewUrl);

  useEffect(() => {
    // Set loading to false after a brief delay to allow iframe to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [sharedState.object_id]);

  const handleDownload = async () => {
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_proposal`,
        {
          bid_id: sharedState.object_id,
          extra_instructions: "",
          datasets: []
        },
        {
          headers: {
            'Authorization': `Bearer ${tokenRef.current}`,
          },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal_${sharedState.bidInfo}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download the proposal. Please try again.');
    }
  };

  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <div className="scroll-container">
          <BidNavbar 
            showViewOnlyMessage={() => displayAlert("You only have permission to view this bid.", "danger")}
            initialBidName={"initialBidName"}
          />
          <Card sx={{ width: '100%', mt: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DescriptionIcon />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Proposal Preview</h3>
                </div>
                <Button
                  variant="outlined"
                  onClick={handleDownload}
                  startIcon={<FileDownloadIcon />}
                >
                  Download
                </Button>
              </div>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ErrorIcon />
                    {error}
                  </div>
                </Alert>
              )}

              <div style={{ height: '600px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                {isLoading ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100%',
                    backgroundColor: '#f5f5f5'
                  }}>
                    <CircularProgress />
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    width="100%"
                    height="100%"
                    title="Proposal Preview"
                    frameBorder="0"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProposalPreview;