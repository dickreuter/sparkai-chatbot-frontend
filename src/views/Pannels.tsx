import AddUser from "../components/AddUser";
import AdminPannel from "../components/AdminPannel";
import "./Pannels.css";

function Pannels() {
  return (
    <div className="Pannels">
      <AddUser />
      <AdminPannel />
    </div>
  );
}

export default Pannels;
