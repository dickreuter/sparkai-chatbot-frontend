
import { Route, Routes } from "react-router-dom"
import SignInComponent from "../components/auth/SignIn"
import SignOut from "../components/auth/SignOutButton"
import Chatbot from "../views/Chatbot"
import Pannels from "../views/Pannels"
import UploadPDF from "../views/UploadPDF"
import UploadText from "../views/UploadText"
import Log from "../components/Log"
import FLog from "../components/FLog"
import UploadTemplateText from "../components/UploadTemplateText.tsx";
import Bids from "../views/Bids"
import Library from "../views/Library"
import Proposal from "../views/Proposal.tsx"
import Dashboard from "../views/Dashboard.tsx"
import ChatbotResponse from "../views/ChatbotResponse.tsx"
import BidExtractor from "../views/BidExtractor.tsx"
import QuestionCrafter from "../views/QuestionCrafter.tsx"
import Calculator from "../views/Calculator.tsx"
import BidManagement from "../views/BidWritingStateManagerView.tsx"
import HowTo from "../views/HowTo.tsx"
import ProfilePage from "../views/Profile.tsx"

function Routing() {
    return (
        <div>
            <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/chatResponse" element={<ChatbotResponse />} />
                <Route path="/login" element={<SignInComponent />} />
                <Route path="/logout" element={<SignOut />} />
                <Route path="/adminpannel" element={<Pannels />} />
                <Route path="/uploadtemplatetext" element={<UploadTemplateText />} />
                <Route path="/qlog" element={<Log />} />
                <Route path="/flog" element={<FLog />} />
                <Route path="/bids" element={<Bids />} />
                <Route path="/library" element={<Library />} />
                <Route path="/howto" element={<HowTo/>} />
                <Route path="/profile" element={<ProfilePage/>} />
                {/* Wrap related routes inside a single parent Route with BidManagement */}
                <Route element={<BidManagement />}>
                    <Route path="/bid-extractor" element={<BidExtractor />} />
                    <Route path="/question-crafter" element={<QuestionCrafter />} />
                    <Route path="/proposal" element={<Proposal />} />
                </Route>
            </Routes>
        </div>
    );
}

export default Routing;