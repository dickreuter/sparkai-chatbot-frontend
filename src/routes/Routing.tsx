
import { Route, Routes } from "react-router-dom"
import SignInComponent from "../components/auth/SignIn"
import SignOut from "../components/auth/SignOutButton"
import Chatbot from "../views/Chatbot"
import Pannels from "../views/Pannels"
import UploadPDF from "../views/UploadPDF"
import UploadText from "../views/UploadText"
import Log from "../components/Log"
import FLog from "../components/FLog"
import Bids from "../views/Bids"
import Library from "../views/Library"

function Routing() {
    return (
        <div>
            <Routes>

                <Route path="/" element={<Chatbot />} />
                <Route path="/login" element={<SignInComponent />} />
                <Route path="/logout" element={<SignOut />} />
                <Route path="/chatbot" element={<Chatbot />} />
                <Route path="/adminpannel" element={<Pannels />} />
                <Route path="/uploadpdf" element={<UploadPDF />} />
                <Route path="/uploadtext" element={<UploadText />} />
                <Route path="/qlog" element={<Log />} />
                <Route path="/flog" element={<FLog />} />
                <Route path="/bids" element={<Bids />} />
                <Route path="/library" element={<Library />} />

            </Routes>
        </div>
    )
}

export default Routing