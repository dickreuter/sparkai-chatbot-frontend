import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import "./WordpaneCopilot.css";
import { EditorState, Modifier, SelectionState, convertToRaw, ContentState } from "draft-js";
import "draft-js/dist/Draft.css";
import useSelectedText from "../hooks/useSelectedText";
import { apiURL } from "../helper/urls";
import { IMessage, IPromptType, IShortcutType } from "../../types";
import { getBase64FromBlob } from "../helper/file";
import { Box, Button, Grid, MenuItem, MenuList, Paper, Tab, Tabs } from "@mui/material";
import MessageBox from "./MessageBox";
import { customPrompts } from "./WordpaneCopilot.constants";

const getDefaultMessage = (type: "library-chat" | "internet-search", useCache: boolean = false): IMessage[] => {
  const savedMessages = localStorage.getItem(type);

  if (useCache && savedMessages) {
    const parsedMessages = JSON.parse(savedMessages);
    if (parsedMessages.length > 0) {
      return parsedMessages;
    }
  }

  return [
    {
      createdBy: "bot",
      type: "text",
      value:
        "Welcome to Bid Pilot! Ask questions about your company library data or search the internet for up to date information. Select text in the response box to use copilot and refine the response.",
    },
  ];
};

const WordpaneCopilot = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [isCustomPromptMenuVisible, setCustomPromptMenuVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [customPromptMessages, setCustomPromptMessages] = useState<IMessage[]>([]);

  const [libraryChatMessages, setLibraryChatMessages] = useState<IMessage[]>(getDefaultMessage("library-chat", true));
  const [internetResearchMessages, setInternetResearchMessages] = useState<IMessage[]>(
    getDefaultMessage("internet-search", true)
  );
  const [selectedCustomPrompt, setSelectedCustomPrompt] = useState<IPromptType>(null);

  const [showOptions, setShowOptions] = useState(false);

  const [inputValue, setInputValue] = useState("");

  const [bidPilotChoice] = useState("2");
  const [bidPilotBroadness] = useState("4");
  const optionsContainerRef = useRef(null); // Ref for the options container
  const responseMessageBoxRef = useRef(null); // Ref for the response message box
  const textInputRef = useRef(null);

  const [responseEditorState, setResponseEditorState] = useState(
    EditorState.createWithContent(ContentState.createFromText(localStorage.getItem("response") || ""))
  );

  const [originalEditorState, setOriginalEditorState] = useState(responseEditorState);

  const [startTime, setStartTime] = useState(null);

  const responseBoxRef = useRef(null); // Ref for the response box

  const [selectedTab, setSelectedTab] = useState<"library-chat" | "internet-search" | "custom-prompt">("library-chat");

  const isLibraryChatTab = useMemo(() => selectedTab === "library-chat", [selectedTab]);
  const isInternetSearchTab = useMemo(() => selectedTab === "internet-search", [selectedTab]);
  const isCustomPromptTab = useMemo(() => selectedTab === "custom-prompt", [selectedTab]);

  const isLiveChatLoading = useMemo(
    () => isLibraryChatTab && libraryChatMessages.find((item) => item.type === "loading") !== undefined,
    [isLibraryChatTab, libraryChatMessages]
  );

  const isInternetSearchLoading = useMemo(
    () => isInternetSearchTab && internetResearchMessages.find((item) => item.type === "loading") !== undefined,
    [isInternetSearchTab, internetResearchMessages]
  );

  const isCustomPromptLoading = useMemo(
    () => isCustomPromptTab && customPromptMessages.find((item) => item.type === "loading") !== undefined,
    [isCustomPromptTab, customPromptMessages]
  );

  const isLoading = useMemo(
    () => isLiveChatLoading || isInternetSearchLoading || isCustomPromptLoading,
    [isLiveChatLoading, isInternetSearchLoading, isCustomPromptLoading]
  );

  useEffect(() => {
    if (responseMessageBoxRef?.current) {
      const scrollBox = responseMessageBoxRef.current.querySelector(".mini-messages");
      scrollBox.scrollTop = scrollBox.scrollHeight;
    }
    if (textInputRef?.current && isLoading === false) {
      textInputRef.current.focus();
    }
  }, [isLoading]);

  const toggleCustomPromptMenuVisible: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    setTimeout(() => {
      setCustomPromptMenuVisible(!isCustomPromptMenuVisible);
    }, 10);
  };

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
    console.log("Clearing messages");
    switch (selectedTab) {
      case "library-chat":
        setLibraryChatMessages(getDefaultMessage("library-chat"));
        break;
      case "internet-search":
        setInternetResearchMessages(getDefaultMessage("internet-search"));
        break;
      case "custom-prompt":
        setCustomPromptMessages([]);
        setSelectedTab("library-chat");
      default:
        break;
    }

    setCustomPromptMenuVisible(false);

    if (showOptions == true) {
      resetEditorState();
    }
    setShowOptions(false);
  };

  const askCopilot = async (copilotInput: string, instructions: string, copilot_mode: string) => {
    localStorage.setItem("questionAsked", "true");
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
      const options: IMessage[] = results
        .map((result) => result.data)
        .map((data: string) => ({
          type: "text",
          value: data,
          createdBy: "bot",
        }));
      return options;
    } catch (error) {
      console.error("Error sending question:", error);
      return [{ type: "text", value: "Message failed, please contact support...", createdBy: "bot" }];
    }
  };

  const askDiagram = async (prompt: string): Promise<IMessage[]> => {
    console.log("askDiagram called");
    localStorage.setItem("questionAsked", "true");
    setStartTime(Date.now()); // Set start time for the timer

    try {
      const response = await axios.post(apiURL("generate_diagram"), prompt, { responseType: "blob" });
      return [
        {
          type: "image",
          value: await getBase64FromBlob(response.data),
          createdBy: "bot",
        },
      ];
    } catch (error) {
      console.error("Error sending question:", error);
      return [];
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      console.log("click outside");
      setCustomPromptMenuVisible(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showOptions, isCustomPromptMenuVisible]);

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
    setCustomPromptMenuVisible(false);
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

  const handleClickMessageShortcut = (action: IShortcutType, option: IMessage) => {
    console.log("handleClickMessageShortcut called", { action });
    if (action === "refine") {
      handleLinkClick(selectedCustomPrompt, true)();
      return;
    }
    if (action === "insert") {
      insertToWord(option, "End");
    } else if (action === "replace") {
      insertToWord(option, "Replace");
    }

    setShowOptions(false);
    setCustomPromptMenuVisible(false);
    setSelectedText("");
    setCustomPromptMessages([]);
    setSelectedTab("library-chat");

    console.log("handleTick - clearedText");
  };

  useEffect(() => {
    if (selectedText.trim() && selectedText.trim().length > 0) {
    } else {
      setCustomPromptMenuVisible(false);
    }
  }, [selectedText]);

  const handleLinkClick =
    (promptId: IPromptType, isRefine: boolean | undefined = false) =>
    () => {
      console.log(`Custom prompt asked`, promptId);
      const copilot_mode = promptId.toLowerCase().replace(/\s+/g, "_");
      let instructions = "";

      setSelectedTab("custom-prompt");
      setCustomPromptMenuVisible(false);
      setSelectedCustomPrompt(promptId);
      setCustomPromptMessages([
        {
          createdBy: "user",
          type: "loading",
          value: "loading",
        },
      ]);

      let prompt = selectedText;

      if (isRefine) {
        if (promptId !== "Graph") {
          instructions = inputValue;
        }
        prompt = prompt + " instruction: " + inputValue;
      }

      setTimeout(async () => {
        let options = [];
        if (promptId === "Graph") {
          options = await askDiagram(prompt);
        } else {
          options = await askCopilot(prompt, instructions, "1" + copilot_mode);
        }
        setCustomPromptMessages(options);
        setShowOptions(true);
        if (isRefine) {
          setInputValue("");
        }
      }, 0);
    };

  const insertToWord = (
    { type, value }: IMessage,
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
            const parser = new DOMParser();
            const doc = parser.parseFromString(value, "text/html");
            par.insertText(doc.body.textContent || "", insertLocation);
          }
          return await context.sync();
        })
        .catch((error) => {
          console.error("Error: ", error);
        });
    });
  };

  let isSubmitButtonClicked = false;

  const handleMouseDownOnSubmit = () => {
    isSubmitButtonClicked = true;
  };

  const handleCustomPromptSubmit = () => {
    console.log("handleCustomPromptSubmit called", { inputValue: inputValue.trim() });
    if (inputValue.trim()) {
      isSubmitButtonClicked = true;
      handleLinkClick(selectedCustomPrompt, true)();
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

  useEffect(() => {
    localStorage.setItem("internet-search", JSON.stringify(internetResearchMessages));
  }, [internetResearchMessages]);

  useEffect(() => {
    localStorage.setItem("library-chat", JSON.stringify(libraryChatMessages));
  }, [libraryChatMessages]);

  const handleLibraryChatMessage = () => {
    console.log("Library chat function called");
    if (inputValue.trim() !== "") {
      if (showOptions == true) {
        resetEditorState();
      }
      setStartTime(Date.now());
      setLibraryChatMessages([
        ...libraryChatMessages,
        { type: "text", createdBy: "user", value: inputValue },
        { type: "loading", createdBy: "bot", value: "loading" },
      ]);
      askLibraryChatQuestion(inputValue, libraryChatMessages)
        .then((message) => {
          setLibraryChatMessages((libraryChatMessages) => [...libraryChatMessages.slice(0, -1), message]);
        })
        .catch(console.log);
      setInputValue("");
    }
  };

  const handleInternetSearchMessage = () => {
    // Implement your internet search logic here
    console.log("Internet Search function called");
    if (inputValue.trim() !== "") {
      if (showOptions == true) {
        resetEditorState();
      }
      setStartTime(Date.now());
      setInternetResearchMessages([
        ...internetResearchMessages,
        { type: "text", createdBy: "user", value: inputValue },
        { type: "loading", createdBy: "bot", value: "loading" },
      ]);
      askInternetQuestion(inputValue)
        .then((message) => {
          setInternetResearchMessages((internetResearchMessages) => [
            ...internetResearchMessages.slice(0, -1),
            message,
          ]);
        })
        .catch(console.log);
      setInputValue("");
    }
  };

  const askInternetQuestion = async (question: string): Promise<IMessage> => {
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
      return { createdBy: "bot", type: "text", value: result.data };
    } catch (error) {
      console.error("Error sending question:", error);
      // Replace the temporary loading message with the error message
      return {
        createdBy: "bot",
        type: "text",
        value: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
      };
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (selectedTab === "internet-search") {
        handleInternetSearchMessage();
      } else if (selectedTab === "custom-prompt") {
        handleCustomPromptSubmit();
      } else {
        handleLibraryChatMessage();
      }
    }
  };

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

  const askLibraryChatQuestion = async (question: string, messages: IMessage[]): Promise<IMessage> => {
    const chatHistory = messages.map((msg) => `${msg.createdBy}: ${msg.value}`).join("\n");

    try {
      const result = await axios.post(
        apiURL("question"),
        {
          choice: bidPilotChoice,
          broadness: bidPilotBroadness,
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

      const formattedResponse = formatResponse(result.data);
      return {
        type: "text",
        value: formattedResponse,
        createdBy: "bot",
      };
    } catch (error) {
      console.error("Error sending question:", error);

      return {
        type: "text",
        value: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
        createdBy: "bot",
      };
    }
  };

  const shortcutVisible = (message: IMessage, type: IShortcutType) => {
    if (message.type === "text" && type === "replace") return true;
    if (message.type === "image" && type === "insert" && isCustomPromptTab) return true;
    if (type === "refine" && isCustomPromptTab) return true;
    return false;
  };

  return (
    <Box display="flex" flexDirection="column" height="100%" padding={"3px"}>
      <Box>
        <Tabs
          variant="fullWidth"
          onChange={(_e, value) => setSelectedTab(value)}
          value={selectedTab}
          TabIndicatorProps={{ style: { display: "none" } }}
        >
          <Tab label="Chat" value="library-chat" />
          <Tab label="Research" value="internet-search" />
          <Tab label="Custom Prompt" value="custom-prompt" hidden />
        </Tabs>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
        }}
        ref={responseMessageBoxRef}
      >
        <div className="bid-pilot-container border-box">
          {isCustomPromptTab ? (
            <MessageBox
              messages={customPromptMessages}
              showShortcuts={true}
              handleClickShortcut={handleClickMessageShortcut}
              shortcutVisible={shortcutVisible}
            />
          ) : isInternetSearchTab ? (
            <MessageBox
              messages={internetResearchMessages}
              showShortcuts={true}
              handleClickShortcut={handleClickMessageShortcut}
              shortcutVisible={shortcutVisible}
            />
          ) : (
            <MessageBox
              messages={libraryChatMessages}
              showShortcuts={true}
              handleClickShortcut={handleClickMessageShortcut}
              shortcutVisible={shortcutVisible}
            />
          )}
        </div>
      </Box>
      <Box marginTop="2px">
        <div className="border-box" style={{ padding: "5px 10px" }}>
          {isCustomPromptMenuVisible && (
            <Paper variant="outlined" className="enhance-prompt-menu">
              <MenuList>
                {customPrompts.map((item) => {
                  return (
                    <MenuItem onClick={handleLinkClick(item.id)} key={item.id}>
                      {item.title}
                    </MenuItem>
                  );
                })}
              </MenuList>
            </Paper>
          )}
          <Box display="flex" flexDirection="row">
            <Grid item container spacing={1}>
              <Grid item>
                <Button
                  variant="outlined"
                  color="info"
                  disabled={selectedText.length === 0 || isLoading}
                  onClick={toggleCustomPromptMenuVisible}
                >
                  Enhance
                </Button>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  color="info"
                  onClick={handleLinkClick("Graph")}
                  disabled={selectedText.length === 0 || isLoading}
                >
                  Graph
                </Button>
              </Grid>
            </Grid>
            <Grid item>
              <Button variant="outlined" color="info" onClick={handleClearMessages} disabled={isLoading}>
                Clear
              </Button>
            </Grid>
          </Box>
        </div>
      </Box>
      <Box marginTop="2px">
        <div className="border-box" style={{ padding: "5px 10px", position: "relative" }}>
          <textarea
            placeholder={
              isInternetSearchTab
                ? "Please type your question in here..."
                : isCustomPromptTab
                  ? "Type in a custom prompt here..."
                  : "Please type your question in here..."
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading && (isCustomPromptTab ? customPromptMessages.length > 0 : true)}
            className="chat-input"
            rows={5}
            ref={textInputRef}
          />
          <Button
            onMouseDown={handleMouseDownOnSubmit}
            onClick={
              isLibraryChatTab ? handleLibraryChatMessage : isInternetSearchTab ? handleInternetSearchMessage : () => {}
            }
            disabled={isCustomPromptTab || isLoading || inputValue.trim() === ""}
            className="chat-send-button"
            color="primary"
            variant="contained"
          >
            Generate
          </Button>
        </div>
      </Box>
    </Box>
  );
};

export default withAuth(WordpaneCopilot);
