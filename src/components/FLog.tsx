import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import { useAuthUser } from 'react-auth-kit';
import './Log.css';

const FLog = () => {
  const [logs, setLogs] = useState([]);
  const [columns, setColumns] = useState([]);
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.post(`http${HTTP_PREFIX}://${API_URL}/get_feedback/`, 
        {}, {  
        headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        });

        if (response.data && response.data.length > 0) {
          setLogs(response.data);
          // Infer column names from the first log entry
          setColumns(Object.keys(response.data[0]));
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    fetchLogs();
  }, []);

  const handleDelete = async (entryId) => {
    // Confirmation pop-up
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        // Using FormData to send data
        const formData = new FormData();
        formData.append('entry_id', entryId);
  
        await axios.post(`http${HTTP_PREFIX}://${API_URL}/delete_feedback`, formData, {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
            'Content-Type': 'multipart/form-data', // This header is important for FormData
          },
        });
  
        // Remove the deleted log from the state
        setLogs(logs.filter(log => log._id !== entryId));
      } catch (error) {
        console.error('Error deleting log:', error);
      }
    }
  };
  
  return (
    <div className="log-table">
      <table>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column}</th>
            ))}
            <th>Delete</th> {/* Header for delete actions */}
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => (
            <tr key={index}>
              {columns.map((column, cellIndex) => (
                <td key={cellIndex}>{log[column]}</td>
              ))}
              <td>
                <button onClick={() => handleDelete(log._id)}>X</button> {/* Delete button */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FLog;
