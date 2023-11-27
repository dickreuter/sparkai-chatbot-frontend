import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { Button, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import withAuth from "../routes/withAuth";
import "./Chatbot.css";

const Chatbot = () => {
  const [choice, setChoice] = useState("2");
  const [broadness, setBroadness] = useState("1");
  const [dataset, setDataset] = useState("default");
  const [inputText, setInputText] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [backgroundInfo, setBackgroundInfo] = useState("");
  const [availableCollections, setAvailableCollections] = useState<string[]>(
    []
  );

  const [feedback, setFeedback] = useState("");
  const [questionAsked, setQuestionAsked] = useState(false);

  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const email = auth?.email || "default";

  useEffect(() => {
    let interval = null;
    if (isLoading && startTime) {
      interval = setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000); // Update elapsed time in seconds
      }, 100);
    } else if (!isLoading) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  const get_collections = () => {
    axios
      .post(
        `http${HTTP_PREFIX}://${API_URL}/get_collections`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      )
      .then((res) => {
        setAvailableCollections(res.data.collections || []);
        // console.log('Available collections:', res.data.collections);
      })
      .catch((error) => {
        console.error("Error fetching strategies:", error);
      });
  };
  useEffect(() => {
    get_collections();
  }, []);

  const sendQuestion = async () => {
    setQuestionAsked(true);
    setResponse("");
    setIsLoading(true);
    setStartTime(Date.now()); // Set start time for the timer
    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question`,
        {
          choice: choice,
          broadness: broadness,
          input_text: inputText,
          extra_instructions: backgroundInfo,
          dataset,
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );
      setResponse(result.data);
    } catch (error) {
      console.error("Error sending question:", error);
      setResponse(error.message);
    }
    setIsLoading(false);
  };

  const submitFeedback = async () => {
    const formData = new FormData();
    formData.append('text', `Question: ${inputText} \n Feedback: ${feedback}`);
    formData.append('profile_name', dataset); // Assuming email is the profile_name
    formData.append('mode', 'feedback');
    console.log(formData)
  
    try {
      await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/uploadtext`,
        formData,
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      );
      // Handle successful submission, e.g., clear feedback or show a message
    } catch (error) {
      console.error("Error sending feedback:", error);
      // Handle error
    }
  };

  return (
    <Container fluid="md" className="mt-4">
      <Row className="justify-content-md-center">
        <Col md={9}>
          {" "}
          {/* Adjusted width for the question box */}
          <Form.Group className="mb-3">
            <Form.Label>Enter your question or input:</Form.Label>
            <Form.Control
              as="textarea"
              className="chat-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <Form.Text className="text-muted">
              Word Count: {inputText.split(/\s+/).filter(Boolean).length}
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={3}>
          {" "}
          {/* New column for background information */}
          <Form.Group className="mb-3">
            <Form.Label>Additional instructions (optional):</Form.Label>
            <Form.Control
              as="textarea"
              className="background-info-input"
              value={backgroundInfo}
              onChange={(e) => setBackgroundInfo(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row className="justify-content-md-center">
        <Col md={12}>
          <div className="dropdowns">
            <Form.Group className="mb-3">
              <Form.Label>Select dataset:</Form.Label>
              <Form.Select
                aria-label="Dataset selection"
                className="w-100 mx-auto chat-dropdown"
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
              >
                <option value="" disabled>
                  Select a dataset
                </option>{" "}
                {/* This option is added */}
                {availableCollections.map((collection) => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Select Function:</Form.Label>
              <Form.Select
                aria-label="Function selection"
                className="w-100 mx-auto chat-dropdown"
                value={choice}
                onChange={(e) => setChoice(e.target.value)}
              >
                <option value="2">Answer Question from Q/A pair</option>
                <option value="3">
                  Question about uploaded PDFs and plain text
                </option>
                <option value="1">Continue Answer (Copilot)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Broadness of database search:</Form.Label>
              <Form.Select
                aria-label="Function selection"
                className="w-100 mx-auto chat-dropdown"
                value={broadness}
                onChange={(e) => setBroadness(e.target.value)}
              >
                <option value="1">Narrow (single database entry)</option>
                <option value="2">Extended (up to 2 entries)</option>
                <option value="3">Broad (up to 3 entries)</option>
              </Form.Select>
            </Form.Group>
          </div>

          <div className="d-flex justify-content-center mb-3">
            <Button
              variant="primary"
              onClick={sendQuestion}
              className="chat-button"
            >
              Submit
            </Button>
          </div>

          {isLoading && (
            <div className="text-center my-3">
              <Spinner animation="border" />
              <div>Elapsed Time: {elapsedTime.toFixed(1)}s</div>
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Response:</Form.Label>
            <Form.Control
              as="textarea"
              className="chat-output"
              readOnly
              value={response}
            />
          </Form.Group>
        </Col>
      </Row>
      {/* Feedback Section */}
{/* Feedback Section */}
<Row className="justify-content-md-center">
  <Col md={12}>
    <Form.Group className="mb-3">
      <Form.Label>Feedback: (describe how the question can be answered better in the future) </Form.Label>
      <Form.Control
        as="textarea"
        className="feedback-textarea"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        disabled={!questionAsked} // Disabled until a question is asked
      />
    </Form.Group>
    <div className="d-flex justify-content-center mb-3">
      <Button
        variant="primary"
        onClick={submitFeedback}
        className="chat-button"
        disabled={!questionAsked} // Disabled until a question is asked
      >
        Submit Feedback
      </Button>
    </div>
  </Col>
</Row>

    </Container>
  );
};

export default withAuth(Chatbot);
