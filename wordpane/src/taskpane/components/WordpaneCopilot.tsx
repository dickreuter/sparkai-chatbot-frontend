import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import { Button, Col, Dropdown, Row, Spinner } from "react-bootstrap";
import "./WordpaneCopilot.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { EditorState, Modifier, SelectionState, convertToRaw, ContentState } from "draft-js";
import "draft-js/dist/Draft.css";
import { useNavigate } from "react-router-dom";
import useSelectedText from "../hooks/useSelectedText";
import { apiURL } from "../helper/urls";
import { IPilotOption, IPromptType } from "../../types";
import { getBase64FromBlob } from "../helper/file";

const WordpaneCopilot = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const navigate = useNavigate();

  const [dataset, setDataset] = useState("default");

  const [isCopilotVisible, setIsCopilotVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [tempText, setTempText] = useState("");
  const [copilotOptions, setCopilotOptions] = useState<IPilotOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<IPilotOption>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [actionOnClick, setActionOnClick] = useState<"Insert" | "Replace">("Replace");

  const [inputText, setInputText] = useState(localStorage.getItem("inputText") || "");
  const [responseEditorState, setResponseEditorState] = useState(
    EditorState.createWithContent(ContentState.createFromText(localStorage.getItem("response") || ""))
  );

  const responseBoxRef = useRef(null); // Ref for the response box
  const promptsContainerRef = useRef(null); // Ref for the prompts container

  const [selectedDropdownOption, setSelectedDropdownOption] = useState("library-chat");
  const bidPilotRef = useRef(null);

  useSelectedText({ onChange: setSelectedText });

  useEffect(() => {
    localStorage.setItem(
      "response",
      convertToRaw(responseEditorState.getCurrentContent())
        .blocks.map((block) => block.text)
        .join("\n")
    );
  }, [responseEditorState]);

  const handleClearMessages = () => {
    setMessages([
      {
        type: "bot",
        text: "Welcome to Bid Pilot! Ask questions about your company library data or search the internet for up to date information. Select text in the response box to use copilot and refine the response.",
      },
    ]);
    localStorage.removeItem("messages");

    setIsCopilotVisible(false);

    if (showOptions == true) {
      resetEditorState();
    }
    setShowOptions(false);
  };

  const askCopilot = async (copilotInput, instructions, copilot_mode) => {
    setQuestionAsked(true);
    localStorage.setItem("questionAsked", "true");
    setCopilotLoading(true);
    setStartTime(Date.now()); // Set start time for the timer

    try {
      const requests = [
        axios.post(
          apiURL("copilot"),
          {
            input_text: copilotInput,
            extra_instructions: instructions,
            copilot_mode: copilot_mode,
            datasets: [],
            bid_id: "32212",
          },
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`,
            },
          }
        ),
      ];

      const results = await Promise.all(requests);
      const options: IPilotOption[] = results
        .map((result) => result.data)
        .map((data: string) => ({
          type: "text",
          value: data,
        }));
      setCopilotOptions(options);
    } catch (error) {
      console.error("Error sending question:", error);
    }
    setCopilotLoading(false);
  };

  const askDiagram = (prompt: string) => {
    setQuestionAsked(true);
    localStorage.setItem("questionAsked", "true");
    setCopilotLoading(true);
    setStartTime(Date.now()); // Set start time for the timer

    axios
      .post(apiURL("generate_diagram"), prompt, { responseType: "blob" })
      .then(async (response) => {
        console.log(response);
        setCopilotOptions([
          {
            type: "image",
            value: await getBase64FromBlob(response.data),
          },
        ]);
      })
      .catch((error) => {
        console.error("Error sending question:", error);
      })
      .finally(() => {
        setCopilotLoading(false);
      });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      console.log("click outside");
      if (
        responseBoxRef.current &&
        promptsContainerRef.current &&
        bidPilotRef.current &&
        !responseBoxRef.current.contains(event.target) &&
        !promptsContainerRef.current.contains(event.target) &&
        !bidPilotRef.current.contains(event.target)
      ) {
        setIsCopilotVisible(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showOptions, isCopilotVisible]);

  const optionsContainerRef = useRef(null); // Ref for the options container

  const [originalEditorState, setOriginalEditorState] = useState(responseEditorState);

  const resetEditorState = () => {
    const contentState = originalEditorState.getCurrentContent();
    const blocks = contentState.getBlockMap();

    let newContentState = contentState;

    // Remove ORANGE style from all blocks
    blocks.forEach((block) => {
      const blockKey = block.getKey();
      const length = block.getLength();
      const blockSelection = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: 0,
        focusOffset: length,
      });

      newContentState = Modifier.removeInlineStyle(newContentState, blockSelection, "ORANGE");
    });

    const newEditorState = EditorState.createWithContent(newContentState);
    setResponseEditorState(newEditorState);
    setIsCopilotVisible(false);
    setSelectedText("");
  };

  //only hide options if show Options equals true and the user clicks somewhere else in the response box. So clicking on an option and the selected text changing should not trigger this
  useEffect(() => {
    const handleClickOutsideOptions = (event) => {
      if (
        responseBoxRef.current &&
        optionsContainerRef.current &&
        responseBoxRef.current.contains(event.target) &&
        !optionsContainerRef.current.contains(event.target) &&
        showOptions
      ) {
        setShowOptions(false);
        // Clear the orange style and reset the text
        resetEditorState();
      }
    };

    document.addEventListener("click", handleClickOutsideOptions);
    return () => {
      document.removeEventListener("click", handleClickOutsideOptions);
    };
  }, [showOptions, responseEditorState]);

  const handleTick = () => {
    const contentState = responseEditorState.getCurrentContent();
    const blocks = contentState.getBlockMap();

    let newContentState = contentState;

    // Remove ORANGE style from all blocks
    blocks.forEach((block) => {
      const blockKey = block.getKey();
      const length = block.getLength();
      const blockSelection = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: 0,
        focusOffset: length,
      });

      newContentState = Modifier.removeInlineStyle(newContentState, blockSelection, "ORANGE");
    });

    let newEditorState = EditorState.push(responseEditorState, newContentState, "change-inline-style");

    // Clear the selection
    const firstBlockKey = newEditorState.getCurrentContent().getFirstBlock().getKey();
    const emptySelection = SelectionState.createEmpty(firstBlockKey);
    newEditorState = EditorState.forceSelection(newEditorState, emptySelection);

    if (actionOnClick === "Insert") {
      insertToWord(selectedOption, "End");
    } else {
      insertToWord(selectedOption, "Replace");
    }

    setResponseEditorState(newEditorState);
    setShowOptions(false);
    setIsCopilotVisible(false);
    setSelectedText("");
    setSelectedOptionIndex(null);

    console.log("handleTick - clearedText");
  };

  useEffect(() => {
    if (selectedText.trim() && selectedText.trim().length > 0) {
      // added extra check because sometimes an empty string would be passed to the copilot
      setIsCopilotVisible(true);
      if (selectedOptionIndex === null) {
        setShowOptions(false);
      }
    } else {
      setIsCopilotVisible(false);
    }
  }, [selectedText, responseEditorState]);

  // Dummy state to force re-render of the editor component
  const [dummyState, setDummyState] = useState(false);

  const [highlightedRange, setHighlightedRange] = useState(null);

  const handleLinkClick = (linkName: IPromptType) => (e) => {
    e.preventDefault();
    const copilot_mode = linkName.toLowerCase().replace(/\s+/g, "_");
    const instructions = "";

    setOriginalEditorState(responseEditorState);

    const contentState = responseEditorState.getCurrentContent();
    const selection = responseEditorState.getSelection();
    const startKey = selection.getStartKey();
    const endKey = selection.getEndKey();
    const startOffset = selection.getStartOffset();
    const endOffset = selection.getEndOffset();

    let newContentState = contentState;

    // Store the highlighted range
    setHighlightedRange({
      startKey,
      endKey,
      startOffset,
      endOffset,
    });

    // Apply ORANGE style (rest of the function remains the same)
    if (startKey === endKey) {
      const blockSelection = SelectionState.createEmpty(startKey).merge({
        anchorOffset: startOffset,
        focusOffset: endOffset,
      });
      newContentState = Modifier.applyInlineStyle(newContentState, blockSelection, "ORANGE");
    } else {
      // If the selection spans multiple blocks
      const blocks = contentState.getBlockMap();
      let isWithinSelection = false;

      newContentState = blocks.reduce((updatedContent, block, blockKey) => {
        if (blockKey === startKey) {
          isWithinSelection = true;
          const blockSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: startOffset,
            focusOffset: block.getLength(),
          });
          return Modifier.applyInlineStyle(updatedContent, blockSelection, "ORANGE");
        } else if (blockKey === endKey) {
          isWithinSelection = false;
          const blockSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: 0,
            focusOffset: endOffset,
          });
          return Modifier.applyInlineStyle(updatedContent, blockSelection, "ORANGE");
        } else if (isWithinSelection) {
          const blockSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: 0,
            focusOffset: block.getLength(),
          });
          return Modifier.applyInlineStyle(updatedContent, blockSelection, "ORANGE");
        }
        return updatedContent;
      }, newContentState);
    }

    let newEditorState = EditorState.push(responseEditorState, newContentState, "change-inline-style");
    newEditorState = EditorState.forceSelection(newEditorState, selection);

    setResponseEditorState(newEditorState);

    setTimeout(() => {
      if (linkName === "Diagram") {
        askDiagram(selectedText);
        setActionOnClick("Insert");
      } else {
        askCopilot(selectedText, instructions, "1" + copilot_mode);
        setActionOnClick("Replace");
      }
      setShowOptions(true);
      setIsCopilotVisible(false);
    }, 0);
  };

  const handleOptionSelect = (option: IPilotOption, index) => {
    console.log("handleOptionSelect called", { option: option.value, index, highlightedRange });
    if (!highlightedRange) {
      console.log("No highlighted range, exiting");
      return;
    }

    const contentState = responseEditorState.getCurrentContent();
    const { startKey, endKey, startOffset, endOffset } = highlightedRange;

    console.log("Creating highlight selection", { startKey, endKey, startOffset, endOffset });
    const highlightSelection = SelectionState.createEmpty(startKey).merge({
      anchorOffset: startOffset,
      focusKey: endKey,
      focusOffset: endOffset,
    });

    console.log("Removing highlighted text");
    let newContentState = Modifier.removeRange(contentState, highlightSelection, "backward");

    console.log("Inserting new option text");
    newContentState = Modifier.insertText(
      newContentState,
      highlightSelection.merge({
        focusKey: startKey,
        focusOffset: startOffset,
      }),
      option.value
    );

    console.log("Applying ORANGE style to new text");
    const styledSelection = SelectionState.createEmpty(startKey).merge({
      anchorOffset: startOffset,
      focusOffset: startOffset + option.value.length,
    });
    newContentState = Modifier.applyInlineStyle(newContentState, styledSelection, "ORANGE");

    console.log("Creating new editor state");
    let newEditorState = EditorState.push(responseEditorState, newContentState, "insert-fragment");
    newEditorState = EditorState.forceSelection(newEditorState, styledSelection);

    console.log("Setting new editor state");
    setResponseEditorState(newEditorState);
    setTempText(option.value);
    setSelectedOption(option);
    setSelectedOptionIndex(index);
    setShowOptions(true);

    console.log("Clearing highlighted range");
    setHighlightedRange(null);

    setDummyState((prev) => !prev);
  };

  const insertToWord = (
    { type, value }: IPilotOption,
    insertLocation:
      | Word.InsertLocation.replace
      | Word.InsertLocation.start
      | Word.InsertLocation.end
      | "Replace"
      | "Start"
      | "End"
  ) => {
    Word.run(async (context) => {
      const range = context.document.getSelection();
      range.paragraphs.load("items");
      return context
        .sync()
        .then(async function () {
          const par = range.paragraphs.items[0];
          if (type === "image") {
            const newPar = par.insertParagraph("", "After");
            newPar.insertInlinePictureFromBase64(value.split(",")[1], insertLocation);
          } else if (type === "text") {
            par.insertText(value, insertLocation);
          }
          return await context.sync();
        })
        .catch((error) => {
          console.error("Error: ", error);
        });
    });
  };

  const handleCustomPromptFocus = () => {
    console.log("handleCustomPromptFocus called");
    setOriginalEditorState(responseEditorState);

    const contentState = responseEditorState.getCurrentContent();
    const selection = responseEditorState.getSelection();
    const startKey = selection.getStartKey();
    const endKey = selection.getEndKey();
    const startOffset = selection.getStartOffset();
    const endOffset = selection.getEndOffset();

    console.log("Current selection", {
      isCollapsed: selection.isCollapsed(),
      startKey,
      endKey,
      startOffset,
      endOffset,
    });

    // Always set the highlighted range, even if the selection is collapsed
    setHighlightedRange({
      startKey,
      endKey,
      startOffset,
      endOffset,
    });

    let newContentState = contentState;

    // Apply ORANGE style
    if (startKey === endKey) {
      const blockSelection = SelectionState.createEmpty(startKey).merge({
        anchorOffset: startOffset,
        focusOffset: endOffset,
      });
      newContentState = Modifier.applyInlineStyle(newContentState, blockSelection, "ORANGE");
    } else {
      // If the selection spans multiple blocks
      const blocks = contentState.getBlockMap();
      let isWithinSelection = false;

      newContentState = blocks.reduce((updatedContent, block, blockKey) => {
        if (blockKey === startKey) {
          isWithinSelection = true;
          const blockSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: startOffset,
            focusOffset: block.getLength(),
          });
          return Modifier.applyInlineStyle(updatedContent, blockSelection, "ORANGE");
        } else if (blockKey === endKey) {
          isWithinSelection = false;
          const blockSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: 0,
            focusOffset: endOffset,
          });
          return Modifier.applyInlineStyle(updatedContent, blockSelection, "ORANGE");
        } else if (isWithinSelection) {
          const blockSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: 0,
            focusOffset: block.getLength(),
          });
          return Modifier.applyInlineStyle(updatedContent, blockSelection, "ORANGE");
        }
        return updatedContent;
      }, newContentState);
    }

    console.log("Applying ORANGE style");
    const newEditorState = EditorState.push(responseEditorState, newContentState, "change-inline-style");
    setResponseEditorState(newEditorState);

    console.log("Set highlighted range", { startKey, endKey, startOffset, endOffset });
  };

  let isSubmitButtonClicked = false;

  const handleMouseDownOnSubmit = () => {
    isSubmitButtonClicked = true;
  };

  const handleCustomPromptBlur = () => {
    if (!isSubmitButtonClicked) {
      const contentState = responseEditorState.getCurrentContent();
      const blocks = contentState.getBlockMap();

      // Remove ORANGE style from all blocks
      let newContentState = contentState;
      blocks.forEach((block) => {
        const blockKey = block.getKey();
        const length = block.getLength();
        const blockSelection = SelectionState.createEmpty(blockKey).merge({
          anchorOffset: 0,
          focusOffset: length,
        });

        newContentState = Modifier.removeInlineStyle(newContentState, blockSelection, "ORANGE");
      });

      const newEditorState = EditorState.push(responseEditorState, newContentState, "change-inline-style");
      setResponseEditorState(newEditorState);

      // Clear the highlighted range
      //setHighlightedRange(null);
    }
    isSubmitButtonClicked = false; // Reset flag after handling
  };

  const handleCustomPromptSubmit = () => {
    console.log("handleCustomPromptSubmit called", { inputValue: inputValue.trim() });
    if (inputValue.trim()) {
      isSubmitButtonClicked = true;

      const copilot_mode = inputValue.toLowerCase().replace(/\s+/g, "_");
      const instructions = "";

      const contentState = responseEditorState.getCurrentContent();

      let selectedText;
      if (highlightedRange) {
        const { startKey, endKey, startOffset, endOffset } = highlightedRange;
        console.log("Using highlighted range", { startKey, endKey, startOffset, endOffset });

        selectedText = getTextFromRange(responseEditorState, highlightedRange);
      } else {
        console.log("No highlighted range, using full content");
        selectedText = contentState.getPlainText();
      }

      console.log("Selected text", { selectedText });

      setTimeout(() => {
        console.log("Calling askCopilot");
        askCopilot(selectedText, instructions, "4" + copilot_mode);
        setShowOptions(true);
        setSelectedDropdownOption("internet-search");
      }, 0);

      setInputValue("");
      setIsCopilotVisible(false);
    }
  };

  // Helper function to get text from a range
  const getTextFromRange = (editorState, range) => {
    const contentState = editorState.getCurrentContent();
    const startBlock = contentState.getBlockForKey(range.startKey);
    const endBlock = contentState.getBlockForKey(range.endKey);
    let text = "";

    if (startBlock === endBlock) {
      text = startBlock.getText().slice(range.startOffset, range.endOffset);
    } else {
      const blockMap = contentState.getBlockMap();
      const blocksInRange = blockMap
        .skipUntil((_, k) => k === range.startKey)
        .takeUntil((_, k) => k === range.endKey)
        .concat(new Map([[range.endKey, endBlock]]));

      blocksInRange.forEach((block, blockKey) => {
        let blockText = block.getText();
        if (blockKey === range.startKey) {
          blockText = blockText.slice(range.startOffset);
        }
        if (blockKey === range.endKey) {
          blockText = blockText.slice(0, range.endOffset);
        }
        text += blockText + "\n";
      });
    }

    return text.trim();
  };

  /////////////////////////////////////////////////////////////////////////////////////////////

  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("messages");
    console.log("Saved messages:", savedMessages);

    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      if (parsedMessages.length > 0) {
        return parsedMessages;
      }
    }

    return [
      {
        type: "bot",
        text: "Welcome to Bid Pilot! Ask questions about your company library data or search the internet for up to date information. Select text in the response box to use copilot and refine the response.",
      },
    ];
  });

  useEffect(() => {
    // Save messages to localStorage whenever they change
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  const [inputValue, setInputValue] = useState("");

  const [bidPilotchoice, setBidPilotChoice] = useState("2");
  const [bidPilotbroadness, setBidPilotBroadness] = useState("4");
  const [isBidPilotLoading, setIsBidPilotLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [questionAsked, setQuestionAsked] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

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

  const handleSendMessage = () => {
    console.log("handleMessage");
    if (inputValue.trim() !== "") {
      if (showOptions == true) {
        resetEditorState();
      }

      setIsCopilotVisible(false);
      setShowOptions(false);
      setMessages([...messages, { type: "user", text: inputValue }]);
      sendQuestion(inputValue);
      setInputValue("");
    }
  };

  const handleInternetSearch = () => {
    // Implement your internet search logic here
    console.log("Internet Search function called");
    if (inputValue.trim() !== "") {
      if (showOptions == true) {
        resetEditorState();
      }

      setIsCopilotVisible(false);
      setShowOptions(false);
      setMessages([...messages, { type: "user", text: inputValue }]);
      sendInternetQuestion(inputValue);
      setInputValue("");
    }
  };

  const sendInternetQuestion = async (question) => {
    setQuestionAsked(true);
    setIsBidPilotLoading(true);
    setStartTime(Date.now()); // Set start time for the timer
    console.log(dataset);
    // Add a temporary bot message with loading dots
    setMessages((prevMessages) => [...prevMessages, { type: "bot", text: "loading" }]);

    try {
      const result = await axios.post(
        apiURL("perplexity"),
        {
          input_text: question + "Respond in a full sentence format.",
          dataset: "default",
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );

      // Replace the temporary loading message with the actual response
      setMessages((prevMessages) => [...prevMessages.slice(0, -1), { type: "bot", text: result.data }]);
    } catch (error) {
      console.error("Error sending question:", error);
      // Replace the temporary loading message with the error message
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        {
          type: "bot",
          text: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
        },
      ]);
    }
    setIsBidPilotLoading(false);
  };

  useEffect(() => {
    if (showOptions) {
      setSelectedDropdownOption("internet-search");
    }
  }, [selectedDropdownOption]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isBidPilotLoading) {
      if (selectedDropdownOption === "internet-search") {
        handleInternetSearch();
      } else if (selectedDropdownOption === "custom-prompt" && isCopilotVisible) {
        handleCustomPromptSubmit();
      } else {
        handleSendMessage();
      }
    }
  };

  useEffect(() => {
    if (isCopilotVisible) {
      setSelectedDropdownOption("custom-prompt");
    } else {
      setSelectedDropdownOption("internet-search");
    }
  }, [isCopilotVisible]);

  const formatResponse = (response) => {
    // Handle numbered lists
    response = response.replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>");
    if (response.includes("<li>")) {
      response = `<ol>${response}</ol>`;
    }

    // Handle bullet points
    response = response.replace(/^[-•]\s(.+)$/gm, "<li>$1</li>");
    if (response.includes("<li>") && !response.includes("<ol>")) {
      response = `<ul>${response}</ul>`;
    }

    // Handle bold text
    response = response.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Handle italic text
    response = response.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Handle newlines for better readability
    response = response.replace(/\n/g, "<br>");

    return response;
  };

  const sendQuestion = async (question) => {
    setQuestionAsked(true);
    setIsBidPilotLoading(true);
    setStartTime(Date.now()); // Set start time for the timer

    // Add a temporary bot message with loading dots
    setMessages((prevMessages) => [...prevMessages, { type: "bot", text: "loading" }]);

    const chatHistory = messages.map((msg) => `${msg.type}: ${msg.text}`).join("\n");
    console.log(chatHistory);
    console.log(bidPilotbroadness);
    console.log(bidPilotchoice);

    try {
      const result = await axios.post(
        apiURL("question"),
        {
          choice: bidPilotchoice,
          broadness: bidPilotbroadness,
          input_text: question,
          extra_instructions: chatHistory,
          datasets: ["default"],
          bid_id: "sharedState.object_id",
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );

      // Replace the temporary loading message with the actual response
      const formattedResponse = formatResponse(result.data);

      setMessages((prevMessages) => [...prevMessages.slice(0, -1), { type: "bot", text: formattedResponse }]);
    } catch (error) {
      console.error("Error sending question:", error);
      // Replace the temporary loading message with the error message
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        {
          type: "bot",
          text: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
        },
      ]);
    }
    setIsBidPilotLoading(false);
  };

  return (
    <div>
      <Row>
        <Col lg={5} md={12}>
          <div className="input-header">
            <div className="proposal-header mb-2">
              <h1 className="lib-title" style={{ color: "white" }} id="bid-pilot-section">
                Bid Pilot
              </h1>
              <Button className="option-button" onClick={() => navigate("/logout")}>
                Sign Out
              </Button>
              <div className="dropdown-container"></div>
            </div>
          </div>

          <div className="bid-pilot-container">
            {showOptions ? (
              <div className="options-container" ref={optionsContainerRef}>
                {copilotLoading ? (
                  <div className="spinner-container">
                    <Spinner animation="border" />
                    <p>Generating Options...</p>
                  </div>
                ) : (
                  copilotOptions.map((option, index) => (
                    <div key={index} className="option">
                      <div className="option-content">
                        <Button
                          onClick={() => handleOptionSelect(option, index)}
                          className={`upload-button ${selectedOptionIndex === index ? "selected" : ""}`}
                          style={{
                            backgroundColor: selectedOptionIndex === index ? "orange" : "#262626",
                            color: selectedOptionIndex === index ? "black" : "#fff",
                            fontSize: "16px",
                          }}
                        >
                          <span>Move to word</span>
                        </Button>
                        {selectedOptionIndex === index && (
                          <Button onClick={handleTick} className="tick-button">
                            <FontAwesomeIcon icon={faCheck} className="tick-icon" />
                          </Button>
                        )}
                      </div>
                      <div className="option-item mt-2">
                        {option.type === "image" ? (
                          <img src={option.value} alt="option" style={{ maxWidth: "100%" }} />
                        ) : (
                          <p>{option.value}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : isCopilotVisible ? (
              <div className={`prompts-container ${!isCopilotVisible ? "fade-out" : ""}`} ref={promptsContainerRef}>
                <div className="prompts">
                  <Button
                    className="prompt-button"
                    style={{ borderTop: "2px solid #555555" }}
                    onClick={handleLinkClick("Summarise")}
                  >
                    Summarise
                  </Button>
                  <Button className="prompt-button" onClick={handleLinkClick("Diagram")}>
                    Diagram
                  </Button>
                  <Button className="prompt-button" onClick={handleLinkClick("Expand")}>
                    Expand
                  </Button>
                  <Button className="prompt-button" onClick={handleLinkClick("Rephrase")}>
                    Rephrase
                  </Button>
                  <Button className="prompt-button" onClick={handleLinkClick("Inject Company Voice")}>
                    Inject Company Voice
                  </Button>
                  <Button className="prompt-button" onClick={handleLinkClick("Inject Tender Context")}>
                    Inject Tender Context
                  </Button>
                  <Button className="prompt-button" onClick={handleLinkClick("Improve Grammar")}>
                    Improve Grammar
                  </Button>
                  <Button className="prompt-button" onClick={handleLinkClick("Add Statistics")}>
                    Add Statistic
                  </Button>
                  <Button className="prompt-button" onClick={handleLinkClick("For Example")}>
                    For Example
                  </Button>
                  <Button className="prompt-button" onClick={handleLinkClick("Translate to English")}>
                    Translate to English
                  </Button>
                  <Button className="prompt-button" onClick={handleLinkClick("We will Active Voice")}>
                    We will
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mini-messages">
                {messages.map((message, index) => (
                  <div key={index} className={`message-bubble-small ${message.type}`}>
                    {message.text === "loading" ? (
                      <div className="loading-dots">
                        <span>. </span>
                        <span>. </span>
                        <span>. </span>
                      </div>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: message.text }} />
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="input-console">
              <div className="dropdown-clear-container mb-3">
                <Dropdown
                  onSelect={(key) => setSelectedDropdownOption(key)}
                  className="chat-dropdown"
                  id="bid-pilot-options"
                >
                  <Dropdown.Toggle
                    className="upload-button"
                    style={{
                      backgroundColor: selectedDropdownOption === "custom-prompt" ? "orange" : "#383838",
                      color: selectedDropdownOption === "custom-prompt" ? "black" : "white",
                    }}
                  >
                    {selectedDropdownOption === "internet-search"
                      ? "Internet Search"
                      : selectedDropdownOption === "custom-prompt"
                        ? "Custom Prompt"
                        : "Library Chat"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="internet-search">Internet Search</Dropdown.Item>
                    <Dropdown.Item eventKey="library-chat">Library Chat</Dropdown.Item>
                    {/* Removed the Custom Prompt option */}
                  </Dropdown.Menu>
                </Dropdown>
                <Button className="option-button" onClick={handleClearMessages}>
                  Clear
                </Button>
              </div>
              <div className="bid-input-bar" ref={bidPilotRef}>
                <input
                  type="text"
                  placeholder={
                    selectedDropdownOption === "internet-search"
                      ? "Please type your question in here..."
                      : selectedDropdownOption === "custom-prompt"
                        ? "Type in a custom prompt here..."
                        : "Please type your question in here..."
                  }
                  value={inputValue}
                  onFocus={selectedDropdownOption === "custom-prompt" ? handleCustomPromptFocus : null}
                  onBlur={handleCustomPromptBlur}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{
                    color: selectedDropdownOption === "custom-prompt" ? "white" : "lightgray",
                  }}
                />
                <button
                  onMouseDown={handleMouseDownOnSubmit}
                  onClick={
                    !isBidPilotLoading
                      ? selectedDropdownOption === "internet-search"
                        ? handleInternetSearch
                        : selectedDropdownOption === "custom-prompt" && isCopilotVisible
                          ? handleCustomPromptSubmit
                          : handleSendMessage
                      : null
                  }
                  disabled={isBidPilotLoading}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default withAuth(WordpaneCopilot);
