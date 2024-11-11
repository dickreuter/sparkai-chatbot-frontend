import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import withAuth from "../../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import "./WordpaneCopilot.css";
import { EditorState, Modifier, SelectionState, convertToRaw, ContentState } from "draft-js";
import "draft-js/dist/Draft.css";
import useSelectedText from "../../hooks/useSelectedText";
import { apiURL } from "../../helper/urls";
import { IMessage, IPromptType, IShortcutType, IPromptOption, IButtonStatus } from "../../../types";
import { getBase64FromBlob } from "../../helper/file";
import { Box, Button, Grid, MenuItem, MenuList, Paper, Tab, Tabs } from "@mui/material";
import MessageBox from "../MessageBox";
import { customPrompts } from "./constants";
import { formatResponse, getExtraInstruction, refineResponse, removeDoubleBr, withId } from "./helper";
import Welcome from "./Welcome";

const getDefaultMessage = (
  type: "library-chat" | "internet-search" | "custom-prompt",
  useCache: boolean = false
): IMessage[] => {
  const savedMessages = localStorage.getItem(type);

  if (useCache && savedMessages) {
    const parsedMessages = JSON.parse(savedMessages);
    if (parsedMessages.length > 0) {
      return parsedMessages;
    }
  }

  return [];
};

const WordpaneCopilot = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const [isCustomPromptMenuVisible, setCustomPromptMenuVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [customPromptMessages, setCustomPromptMessages] = useState<IMessage[]>(
    getDefaultMessage("custom-prompt", true)
  );

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
      if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;
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
    setInputValue("");
    switch (selectedTab) {
      case "library-chat":
        setLibraryChatMessages(getDefaultMessage("library-chat"));
        break;
      case "internet-search":
        setInternetResearchMessages(getDefaultMessage("internet-search"));
        break;
      case "custom-prompt":
        setCustomPromptMessages(getDefaultMessage("custom-prompt"));
      default:
        break;
    }

    setCustomPromptMenuVisible(false);

    if (showOptions == true) {
      resetEditorState();
    }
    setShowOptions(false);
  };

  const askCopilot = async (
    text: string,
    _promptType: IPromptType,
    copilot_mode: string,
    messages: IMessage[],
    option: IPromptOption
  ): Promise<IMessage> => {
    localStorage.setItem("questionAsked", "true");
    setStartTime(Date.now()); // Set start time for the timer
    try {
      const response = await axios.post(
        apiURL("copilot"),
        {
          input_text: option.isRefine ? `Refine the previous response.${text}` : text,
          extra_instructions: getExtraInstruction(messages),
          copilot_mode: copilot_mode,
          datasets: [],
          bid_id: "32212",
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );

      return withId({
        type: "text",
        value: response.data,
        createdBy: "bot",
        action: "default",
        isRefine: option.isRefine,
      });
    } catch (error) {
      console.error("Error sending question:", error);
      return withId({
        type: "text",
        value: "Message failed, please contact support...",
        createdBy: "bot",
        action: "default",
        isRefine: option.isRefine,
      });
    }
  };

  const askDiagram = async (
    text: string,
    _promptType: IPromptType,
    messages: IMessage[],
    option: IPromptOption
  ): Promise<IMessage> => {
    localStorage.setItem("questionAsked", "true");
    setStartTime(Date.now()); // Set start time for the timer

    try {
      const response = await axios.post(
        apiURL("generate_diagram"),
        `${getExtraInstruction(messages)}\n\n user: ${option.isRefine ? `Refine the previous response. ${text}` : text}`,
        {
          responseType: "blob",
        }
      );
      return withId({
        type: "image",
        value: await getBase64FromBlob(response.data),
        createdBy: "bot",
        action: "default",
        isRefine: option.isRefine,
      });
    } catch (error) {
      console.error("Error sending question:", error);
      return withId({
        type: "text",
        value: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
        createdBy: "bot",
        action: "default",
        isRefine: option.isRefine,
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const handleClickMessageShortcut = (action: IShortcutType, message: IMessage) => {
    if (action === "refine") {
      if (isLibraryChatTab) {
        const refine = refineResponse(inputValue, message, libraryChatMessages);
        handleLibraryChatMessage(refine.prompt, refine.messages, { isRefine: true });
      } else if (isInternetSearchTab) {
        const refine = refineResponse(inputValue, message, internetResearchMessages);
        handleInternetSearchMessage(refine.prompt, refine.messages, { isRefine: true });
      } else {
        const refine = refineResponse(inputValue, message, customPromptMessages);
        handleCustomPromptMessage(selectedText, selectedCustomPrompt, refine.messages, { isRefine: true });
      }
    } else if (action === "insert") {
      insertToWord(message, "End");
    } else if (action === "replace") {
      insertToWord(message, "Replace");
    }

    setCustomPromptMenuVisible(false);
    setSelectedText("");
  };

  useEffect(() => {
    if (selectedText.trim() && selectedText.trim().length > 0) {
      setCustomPromptMenuVisible(true);
    } else {
      setCustomPromptMenuVisible(false);
    }
  }, [selectedText]);

  const askCustomPrompt = async (
    text: string,
    promptType: IPromptType,
    messages: IMessage[],
    option: IPromptOption
  ): Promise<IMessage> => {
    try {
      const copilot_mode = promptType.toLowerCase().replace(/\s+/g, "_");
      if (promptType === "Graph") {
        return await askDiagram(text, promptType, messages, option);
      } else {
        return await askCopilot(text, promptType, "1" + copilot_mode, messages, option);
      }
    } catch (error) {
      console.error("Error sending question:", error);
      // Replace the temporary loading message with the error message
      return withId({
        createdBy: "bot",
        type: "text",
        value: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
        action: "default",
        isRefine: option.isRefine,
      });
    }
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
            par.insertHtml(removeDoubleBr(value), insertLocation);
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

  useEffect(() => {
    localStorage.setItem("internet-search", JSON.stringify(internetResearchMessages));
  }, [internetResearchMessages]);

  useEffect(() => {
    localStorage.setItem("library-chat", JSON.stringify(libraryChatMessages));
  }, [libraryChatMessages]);

  useEffect(() => {
    localStorage.setItem("custom-prompt", JSON.stringify(customPromptMessages));
  }, [customPromptMessages]);

  const handleClickSubmitButton = () => {
    if (isLibraryChatTab) {
      handleLibraryChatMessage(inputValue, libraryChatMessages, { isRefine: false });
    } else if (isInternetSearchTab) {
      handleInternetSearchMessage(inputValue, internetResearchMessages, { isRefine: false });
    } else if (isCustomPromptTab) {
      handleCustomPromptMessage(selectedText, selectedCustomPrompt, internetResearchMessages, { isRefine: false });
    }
  };

  const handleLibraryChatMessage = (prompt: string, messages: IMessage[], option: IPromptOption) => {
    if (prompt.trim() !== "") {
      setStartTime(Date.now());
      setLibraryChatMessages([
        ...messages,
        withId({ type: "text", createdBy: "user", value: prompt, action: "default", isRefine: option.isRefine }),
        withId({ type: "loading", createdBy: "bot", value: "loading", action: "default", isRefine: false }),
      ]);
      askLibraryChatQuestion(prompt, messages, option)
        .then((message) => {
          setLibraryChatMessages((messages) => [...messages.slice(0, -1), message]);
        })
        .catch(console.log);
      setInputValue("");
    }
  };

  const handleInternetSearchMessage = (prompt: string, messages: IMessage[], option: IPromptOption) => {
    if (prompt.trim() !== "") {
      setStartTime(Date.now());
      setInternetResearchMessages([
        ...messages,
        withId({ type: "text", createdBy: "user", value: prompt, action: "default", isRefine: option.isRefine }),
        withId({ type: "loading", createdBy: "bot", value: "loading", action: "default", isRefine: false }),
      ]);
      askInternetQuestion(prompt, messages, option)
        .then((message) => {
          setInternetResearchMessages((messages) => [...messages.slice(0, -1), message]);
        })
        .catch(console.log);
      setInputValue("");
    }
  };

  const handleCustomPromptMessage = (
    text: string,
    promptType: IPromptType,
    messages: IMessage[],
    option: IPromptOption
  ) => {
    setSelectedTab("custom-prompt");
    if (text.trim()) {
      setStartTime(Date.now());
      setCustomPromptMessages([
        ...messages,
        withId({ type: "text", createdBy: "user", value: text, action: promptType, isRefine: option.isRefine }),
        withId({ type: "loading", createdBy: "bot", value: "loading", action: "default", isRefine: false }),
      ]);
      askCustomPrompt(text, promptType, messages, option)
        .then((message) => {
          setCustomPromptMessages((messages) => [...messages.slice(0, -1), message]);
        })
        .catch(console.log);
      setInputValue("");
    }
  };

  const askInternetQuestion = async (
    question: string,
    messages: IMessage[],
    option: IPromptOption
  ): Promise<IMessage> => {
    try {
      const result = await axios.post(
        apiURL("perplexity"),
        {
          input_text:
            getExtraInstruction(messages) +
            "\n\nuser: " +
            (option.isRefine ? `Refine the previous response.${question}` : question) +
            "\n\n Respond in a full sentence format.",
          dataset: "default",
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );
      return withId({ createdBy: "bot", type: "text", value: result.data, action: "default", isRefine: false });
    } catch (error) {
      console.error("Error sending question:", error);
      // Replace the temporary loading message with the error message
      return withId({
        createdBy: "bot",
        type: "text",
        value: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
        action: "default",
        isRefine: option.isRefine,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleClickSubmitButton();
    }
  };

  const askLibraryChatQuestion = async (
    question: string,
    messages: IMessage[],
    option: IPromptOption
  ): Promise<IMessage> => {
    try {
      const result = await axios.post(
        apiURL("question"),
        {
          choice: bidPilotChoice,
          broadness: bidPilotBroadness,
          input_text: option.isRefine ? `Refine the previous response.${question}` : question,
          extra_instructions: getExtraInstruction(messages),
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
      return withId({
        type: "text",
        value: formattedResponse,
        createdBy: "bot",
        action: "default",
        isRefine: option.isRefine,
      });
    } catch (error) {
      console.error("Error sending question:", error);

      return withId({
        type: "text",
        value: error.response?.status === 400 ? "Message failed, please contact support..." : error.message,
        createdBy: "bot",
        action: "default",
        isRefine: false,
      });
    }
  };

  const shortcutVisible = (message: IMessage, type: IShortcutType): IButtonStatus => {
    if (message.type === "text" && type === "replace") return "enabled";
    if (message.type === "image" && type === "insert" && isCustomPromptTab) return "enabled";
    if (type === "refine" && inputValue.trim().length > 0) return "enabled";
    if (type === "refine" && inputValue.trim().length === 0) return "disabled";
    return "hidden";
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
          <Tab label="Library" value="library-chat" />
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
            customPromptMessages.length ? (
              <MessageBox
                messages={customPromptMessages}
                showShortcuts={true}
                handleClickShortcut={handleClickMessageShortcut}
                shortcutVisible={shortcutVisible}
              />
            ) : (
              <Welcome />
            )
          ) : isInternetSearchTab ? (
            internetResearchMessages.length ? (
              <MessageBox
                messages={internetResearchMessages}
                showShortcuts={true}
                handleClickShortcut={handleClickMessageShortcut}
                shortcutVisible={shortcutVisible}
              />
            ) : (
              <Welcome />
            )
          ) : libraryChatMessages.length ? (
            <MessageBox
              messages={libraryChatMessages}
              showShortcuts={true}
              handleClickShortcut={handleClickMessageShortcut}
              shortcutVisible={shortcutVisible}
            />
          ) : (
            <Welcome />
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
                    <MenuItem
                      onClick={() =>
                        handleCustomPromptMessage(`${selectedText}. ${inputValue}`, item.id, customPromptMessages, {
                          isRefine: false,
                        })
                      }
                      key={item.id}
                    >
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
                  onClick={() =>
                    handleCustomPromptMessage(`${selectedText}. ${inputValue}`, "Graph", customPromptMessages, {
                      isRefine: false,
                    })
                  }
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
            onClick={handleClickSubmitButton}
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