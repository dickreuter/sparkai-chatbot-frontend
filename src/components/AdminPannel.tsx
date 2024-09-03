import axios from "axios";
import "bootstrap/dist/css/bootstrap.css";
import {useEffect, useRef, useState} from "react";
import {useAuthHeader, useAuthUser} from "react-auth-kit";
import {API_URL, HTTP_PREFIX} from "../helper/Constants";
import withAuthAdmin from "../routes/withAuthAdmin";
import "./AdminPannel.css";

interface IAttributesConfig {
    active: string;
    login: string;
    password: string;

    email: string;
    company: string;
    jobRole: string;
    stripe_customer_id: string;
    organisation_id: string;
    region: string;
    product_name: string;
    userType: string;
    licenses: number;

    prompt1: string;
    prompt2: string;
    prompt3a: string;
    prompt3b: string;

    prompt1expand: string;
    prompt1summarise: string;
    prompt1improve_grammar: string;
    prompt1translate_to_english: string;
    prompt1change_tense: string;
    prompt1rephrase: string;
    prompt1incorporate: string;
    prompt1we_will_active_voice: string;
    prompt1list_creator: string;
    prompt1reduce_word_character_count: string;
    prompt1word_cutting_adverbs: string;
    prompt1word_cutting_adjectives: string;
    prompt1word_cutting_commas_with_dashes: string;
    prompt1explain_how: string;
    prompt1add_statistics: string;
    prompt1for_example: string;
    prompt1adding_case_study: string;
    prompt1company_library: string;
    question_extractor: string;

    forbidden: string;
    numbers_allowed_prefixes: string;
    selectedModelType: string;


    generate_opportunity_information: string;
    generate_compliance_requirements: string;
    generate_cover_letter: string;
    generate_exec_summary: string;
}

const defaultAttributesConfig: IAttributesConfig = {
    active: "On",
    login: "",
    password: "",
    email: "",
    company: "",
    jobRole: "",
    stripe_customer_id: "",
    organisation_id: "",
    region: "",
    product_name: "",
    userType: "member",
    licenses: 0,
    prompt1: "",
    prompt2: "",
    prompt3a: "",
    prompt3b: "",
    prompt1expand: "",
    prompt1summarise: "",
    prompt1improve_grammar: "",
    prompt1translate_to_english: "",
    prompt1change_tense: "",
    prompt1rephrase: "",
    prompt1incorporate: "",
    prompt1we_will_active_voice: "",
    prompt1list_creator: "",
    prompt1reduce_word_character_count: "",
    prompt1word_cutting_adverbs: "",
    prompt1word_cutting_adjectives: "",
    prompt1word_cutting_commas_with_dashes: "",
    prompt1explain_how: "",
    prompt1add_statistics: "",
    prompt1for_example: "",
    prompt1adding_case_study: "",
    prompt1company_library: "",
    question_extractor: "",
    forbidden: "",
    numbers_allowed_prefixes: "",
    selectedModelType: "gpt-3.5-turbo",
    generate_opportunity_information: "",
    generate_compliance_requirements: "",
    generate_cover_letter: "",
    generate_exec_summary: ""
};

const AdminPannel = () => {
    const getAuth = useAuthUser();
    const auth = getAuth();
    const tokenRef = useRef(auth?.token || "default");
    const email = auth?.email || "default";

    const getAuthHeader = useAuthHeader();
    const authHeader = getAuthHeader();
    // console.log(authHeader);  // Outputs: 'Bearer your_token_here'

    const [availableUsers, setAvailableUsers] = useState<string[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>("");
    const [data, setData] = useState<IAttributesConfig>(defaultAttributesConfig);

    // Function to display Bootstrap alerts
    const displayAlert = (message, type) => {
        const alertDiv = document.createElement("div");
        alertDiv.className = `alert alert-${type} fixed-bottom text-center mb-0 rounded-0`;
        alertDiv.innerHTML = message;
        document.body.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 3000);
    };

    const saveUser = () => {
        console.log(data);
        axios
            .post(
                `http${HTTP_PREFIX}://${API_URL}/save_user`,
                {generic_dict: data},
                {
                    headers: {
                        Authorization: `Bearer ${tokenRef.current}`,
                    },
                }
            )

            .then((response) => {
                // console.log("Response from server:", response.data);
                load_available_users();
                loadUser(data.login);
                displayAlert("User successfully saved", "success");
            })
            .catch((error) => {
                console.error("Error saving user:", error);
                displayAlert("Failed to save user", "danger");
            });
    };

    const load_available_users = () => {
        axios
            .post(
                `http${HTTP_PREFIX}://${API_URL}/get_users`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${tokenRef.current}`,
                    },
                }
            )
            .then((res) => {
                setAvailableUsers(res.data.users || []);
                // console.log('Available users:', res.data.users);
                setData(defaultAttributesConfig);
            })
            .catch((error) => {
                console.error("Error fetching strategies:", error);
            });
    };

    useEffect(() => {
        load_available_users();
    }, []);

    const loadUser = (strat) => {
        const userToLoad = typeof strat === "string" ? strat : selectedUser;
        setSelectedUser(userToLoad);
        // console.log("Loading Strategy:", strategyToLoad);  // Debug log

        // Initialize data with defaultAttributesConfig
        setData(defaultAttributesConfig);

        axios
            .post(
                `http${HTTP_PREFIX}://${API_URL}/load_user`,
                {username: userToLoad},
                {headers: {Authorization: `Bearer ${tokenRef.current}`}}
            )

            .then((res) => {
                // Merge the default attributes with the loaded strategy data
                const mergedData = {...defaultAttributesConfig, ...res.data};

                // Update the state to re-render your component
                setData(mergedData);
            })
            .catch((error) => {
                console.error("Error loading user:", error);
                displayAlert("Failed to load user", "danger");
            });
    };

    const deleteUser = () => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            setSelectedUser(selectedUser);

            axios
                .post(
                    `http://${API_URL}/delete_user`,
                    {username: selectedUser},
                    {
                        headers: {
                            Authorization: `Bearer ${tokenRef.current}`,
                        },
                    }
                )
                .then((res) => {
                    setAvailableUsers([]);
                    load_available_users();
                    displayAlert("Strategy successfully deleted", "success");
                })
                .catch((error) => {
                    console.error("Error loading strategy:", error);
                    displayAlert("Failed to load strategy", "danger");
                });
        } else {
            displayAlert("User deletion cancelled", "warning");
        }
    };

    const handleChange = (attr: keyof IAttributesConfig, value: any) => {
        setData((prevConfig) => ({...prevConfig, [attr]: value}));
    };

    // Render
    return (
    <div className="adminContainer">
        <div className="strategy-form">
            <h2>User Configuration</h2>

            {/* Load existing strategy */}
            <div className="selections-box">
                <label>Select User:</label>
                <div className="selections">
                    <select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        <option value="" disabled>
                            Select a user
                        </option>
                        {" "}
                        {/* This option is added */}
                        {availableUsers.map((strategy) => (
                            <option key={strategy} value={strategy}>
                                {strategy}
                            </option>
                        ))}
                    </select>
                    <button onClick={loadUser}>Load</button>
                    <button
                        style={{backgroundColor: "red", color: "white"}}
                        onClick={deleteUser}
                    >
                        Del
                    </button>
                </div>
            </div>

            {/* username Name
      <div className="strategy-name">
        <label>Update / Create User:</label>
        <input type="text" value={data.login} onChange={(e) => handleChange('login', e.target.value)} />
      </div> */}

            {/* status */}
            <div className="selection-box d-flex">
                <label>User status:</label>
                <div className="selections">
                    <select
                        value={data.active}
                        onChange={(e) => handleChange("active", e.target.value)}
                    >
                        <option value="off">Active</option>
                    </select>
                </div>
            </div>

            {/* Model selection */}
            <label>Select LLM Model</label>
            <div className="sport-type">
                <select
                    value={data.selectedModelType}
                    onChange={(e) => handleChange("selectedModelType", e.target.value)}
                >
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo (£0.02 / request)</option>
                    <option value="gpt-4-turbo-preview">gpt-4-1106-preview-128k (£0.50 / request)</option>
                    {/*<option value="gemini-pro">Google Gemini pro</option>*/}
                    {/*<option value="microsoft/Orca-2-13b">Microsoft Orca-2 13b</option>*/}
                </select>
            </div>

            <div className="login">
                <label>login:</label>
                <input
                    rows="5"
                    disabled
                    value={data.login}
                    onChange={(e) => handleChange("login", e.target.value)}
                />
            </div>

            <div className="login">
                <label>Password:</label>
                <input
                    value={data.password}
                    disabled
                    type="password"
                    onChange={(e) => handleChange("password", e.target.value)}
                />
            </div>

            <div className="form-group">
                <label>Email:</label>
                <input
                    type="email"
                    value={data.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Company:</label>
                <input
                    type="text"
                    value={data.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Job Role:</label>
                <input
                    type="text"
                    value={data.jobRole}
                    onChange={(e) => handleChange("jobRole", e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Stripe Customer ID:</label>
                <input
                    type="text"
                    value={data.stripe_customer_id}
                    onChange={(e) => handleChange("stripe_customer_id", e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Organisation ID:</label>
                <input
                    type="text"
                    value={data.organisation_id}
                    onChange={(e) => handleChange("organisation_id", e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Region:</label>
                <input
                    type="text"
                    value={data.region}
                    onChange={(e) => handleChange("region", e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Product Name:</label>
                <input
                    type="text"
                    value={data.product_name}
                    onChange={(e) => handleChange("product_name", e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>User Type:</label>
                <select
                    value={data.userType}
                    onChange={(e) => handleChange("userType", e.target.value)}
                >
                    <option value="member">Member</option>
                    <option value="owner">Owner</option>
                </select>
            </div>
            <div className="form-group">
                <label>Licenses:</label>
                <input
                    type="number"
                    value={data.licenses}
                    onChange={(e) => handleChange("licenses", parseInt(e.target.value))}
                />
            </div>

            <div className="prompt">
                <label>Prompt2 (Q/A pairs) </label>
                <textarea
                    value={data.prompt2}
                    onChange={(e) => handleChange("prompt2", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Prompt3a: get relevant topic headers</label>
                <textarea
                    value={data.prompt3a}
                    onChange={(e) => handleChange("prompt3a", e.target.value)}
                />
            </div>

            <div className="prompt">
                <label>Prompt3b: use headers to generate subsection</label>
                <textarea
                    value={data.prompt3b}
                    onChange={(e) => handleChange("prompt3b", e.target.value)}
                />
            </div>


            <div className="prompt">
                <label>Copilot: Expand</label>
                <textarea
                    value={data.prompt1expand}
                    onChange={(e) => handleChange("prompt1expand", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Summarise</label>
                <textarea
                    value={data.prompt1summarise}
                    onChange={(e) => handleChange("prompt1summarise", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Improve grammar</label>
                <textarea
                    value={data.prompt1improve_grammar}
                    onChange={(e) => handleChange("prompt1improve_grammar", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Translate to English</label>
                <textarea
                    value={data.prompt1translate_to_english}
                    onChange={(e) => handleChange("prompt1translate_to_english", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Change tense</label>
                <textarea
                    value={data.prompt1change_tense}
                    onChange={(e) => handleChange("prompt1change_tense", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Rephrase</label>
                <textarea
                    value={data.prompt1rephrase}
                    onChange={(e) => handleChange("prompt1rephrase", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Incorporate</label>
                <textarea
                    value={data.prompt1incorporate}
                    onChange={(e) => handleChange("prompt1incorporate", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: We will active voice</label>
                <textarea
                    value={data.prompt1we_will_active_voice}
                    onChange={(e) => handleChange("prompt1we_will_active_voice", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: List creator</label>
                <textarea
                    value={data.prompt1list_creator}
                    onChange={(e) => handleChange("prompt1list_creator", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Reduce word character count</label>
                <textarea
                    value={data.prompt1reduce_word_character_count}
                    onChange={(e) => handleChange("prompt1reduce_word_character_count", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Word cutting adverbs</label>
                <textarea
                    value={data.prompt1word_cutting_adverbs}
                    onChange={(e) => handleChange("prompt1word_cutting_adverbs", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Word cutting adjectives</label>
                <textarea
                    value={data.prompt1word_cutting_adjectives}
                    onChange={(e) => handleChange("prompt1word_cutting_adjectives", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Word cutting commas with dashes</label>
                <textarea
                    value={data.prompt1word_cutting_commas_with_dashes}
                    onChange={(e) => handleChange("prompt1word_cutting_commas_with_dashes", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Explain how</label>
                <textarea
                    value={data.prompt1explain_how}
                    onChange={(e) => handleChange("prompt1explain_how", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Add statistics</label>
                <textarea
                    value={data.prompt1add_statistics}
                    onChange={(e) => handleChange("prompt1add_statistics", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: For example</label>
                <textarea
                    value={data.prompt1for_example}
                    onChange={(e) => handleChange("prompt1for_example", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Adding case study</label>
                <textarea
                    value={data.prompt1adding_case_study}
                    onChange={(e) => handleChange("prompt1adding_case_study", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Copilot: Company library</label>
                <textarea
                    value={data.prompt1company_library}
                    onChange={(e) => handleChange("prompt1company_library", e.target.value)}
                />
            </div>
            <div className="prompt">
                <label>Question extractor from PDF</label>
                <textarea
                    value={data.question_extractor}
                    onChange={(e) => handleChange("question_extractor", e.target.value)}
                />
            </div>



            <div className="prompt">
                <label>Comma separated words that are replaced with [ ] </label>
                <textarea
                    value={data.forbidden}
                    onChange={(e) => handleChange("forbidden", e.target.value)}
                />
            </div>

            <div className="prompt">
                <label>Replace numbers from the context with [number] except when they have the following prefixes
                    (comma separated list)</label>
                <textarea
                    value={data.numbers_allowed_prefixes}
                    onChange={(e) => handleChange("numbers_allowed_prefixes", e.target.value)}
                />
            </div>
            <div className="prompt">
          <label>Generate Opportunity Information</label>
          <textarea
            value={data.generate_opportunity_information}
            onChange={(e) => handleChange("generate_opportunity_information", e.target.value)}
          />
        </div>

        <div className="prompt">
          <label>Generate Compliance Requirements</label>
          <textarea
            value={data.generate_compliance_requirements}
            onChange={(e) => handleChange("generate_compliance_requirements", e.target.value)}
          />
        </div>

        <div className="prompt">
          <label>Generate Cover Letter</label>
          <textarea
            value={data.generate_cover_letter}
            onChange={(e) => handleChange("generate_cover_letter", e.target.value)}
          />
        </div>

        <div className="prompt">
          <label>Generate Exec Summary</label>
          <textarea
            value={data.generate_exec_summary}
            onChange={(e) => handleChange("generate_exec_summary", e.target.value)}
          />
        </div>
            {/* Submit button */}
            <div className="submit-btn">
                <button onClick={saveUser}>Save</button>
                {" "}
                {/* Invoke saveStrategy when clicked */}
            </div>
        </div>

        </div>
    );
};

export default withAuthAdmin(AdminPannel);
