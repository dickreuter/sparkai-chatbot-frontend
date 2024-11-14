import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import './SectionMenu.css';

const SectionMenu = ({ x, y, onClose, onAddSection, onDeleteSection }) => {
    return (
      <div 
        className="context-menu"
        style={{ 
          position: 'fixed', 
          top: y, 
          left: x,
          zIndex: 1000,
          backgroundColor: 'white',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          borderRadius: '4px',
         
        }}
      >
        <button 
          className="context-menu-item"
          onClick={onAddSection}
        >
          <FontAwesomeIcon icon={faPlus} className="me-3" /> Add Section
        </button>
        <button 
          className="context-menu-item"
          onClick={onDeleteSection}
        >
          <FontAwesomeIcon icon={faTrash} className="me-3" /> Delete Section
        </button>
      </div>
    );
  };

  export default SectionMenu;