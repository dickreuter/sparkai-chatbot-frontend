import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import { useAuthUser } from "react-auth-kit";
import "./Log.css";

const Log = () => {
  const [logs, setLogs] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true); // Start loading
        const response = await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/get_log/`,
          {},
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`
            }
          }
        );

        if (response.data && response.data.length > 0) {
          setLogs(response.data);
          setColumns(Object.keys(response.data[0]));
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setIsLoading(false); // Stop loading whether success or error
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="log-table">
      {isLoading ? (
        <div className="loading-spinner">Loading...</div> // Display loading spinner
      ) : (
        <table>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                {columns.map((column, cellIndex) => (
                  <td key={cellIndex}>{log[column]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Log;
