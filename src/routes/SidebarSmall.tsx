import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import "./SidebarSmall.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuthUser, useSignOut } from "react-auth-kit";
import { 
  faHome, 
  faSignOutAlt ,
  faBookOpen,
  faLayerGroup,
  faFileAlt,  // Icon representing documents or information
  faFileCircleQuestion, // Icon for questions
  faReply, // Icon for comments or responses
  faFileContract // Icon for proposals or contracts
} from '@fortawesome/free-solid-svg-icons';

const SideBarSmall = () => { 
 
  const imageUrl = 'https://d23mvtytxhuzbg.cloudfront.net/static/images/mytender.io_badge_F-removebg-preview.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEJX%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCWV1LXdlc3QtMiJHMEUCIQDzqvkxM1xhzLZqPpjR144FcLn0gIQRPDIko9elj5yDugIgZggtedN6MxCbO0eVZNw3d8NMe9BeLaNQfCxTPaxkDvYq7QIIjf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw4NTE3MzYzODI5OTEiDFc8GighwekXt0JSByrBAvg5wBjMk5WF6f1IhK0uO87ARU7rPvr9onJllF8rtdsIvwlwx2E2usTyMIaUHvhnIfdvSEWMZsX2I%2Fug7KothJd1h18hTPrMB3m3eZSaR1CyoDCqYTuI%2BqspQsY4gllCrMAUQyOKjoXq1F83vQosdoKpU4gTKQdNC%2FsGH3uOOgbcB%2BX0glckjbqIzMjaRGv1vNTahcMWL8Uu2U4QwhAb8DVjjMXIOEozVtke%2F8mf%2FfuhocMTv3%2B4zZ6jcFKrKKOUrVJD21qkTm2knoX1mhayubd56zUsVRHXkF%2BEJpkBZiD3f0QK0zVE%2B5ivGvw7VwXip2%2FByyJsOU3vL0rkLq71VDi1v6N%2Bd1JT7fMoX0q%2FYlSXN5xy8Lr5z00s43MDKlfrXoFq%2F3YB5%2BkgKCrEwYiT7TbbOuSEMwqmiKyc%2Fb2xGnjmOzDdm5yvBjqzApUA38bS4YjpNrfF4yEMsk%2Fm8QqjJ8ZOqtD6N8MT4YduTllXa4Sa8xz6OVgOQzt9xzb0y6RqMKaPwEb6PyTKl6WI0s4sDY0epCaJ9DaDy7cmduOLwSxJ8uibw4cruz0cAjzLSis6yh5HCLupjLCtjcdhSOr68iE%2F5w6XgpZYY53G%2FCxmCdnkCuQcS7jOXclTaWy2kNIufz4OZZ3%2FHyk894v%2BNxWEXuCOulA%2FLJsn%2BqLUr7BhLjmTlUAKDXxY0D4qHnUbLug7jAmSa38%2BIdrDJIejnLWKsnUoMvjn3AzVW%2BLB6YpSxhx%2BfxcZzgtQWSc3oD%2BsieWxnGSNtFL5F7vLSIpip8wYY7jb99%2FGEQtUzSUxNIa6rzB0q9lrgsXnarsAoU%2B3xmn%2F8tlO4V%2BKl6t4rlZM%2B%2B0%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240305T124138Z&X-Amz-SignedHeaders=host&X-Amz-Expires=300&X-Amz-Credential=ASIA4MT3RZYHX4YHJJEL%2F20240305%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=c65132e1437c555b9d32b4ccf6fd1772f07fd892e2f01cad9a6c4e0312602476'; // Replace this URL with your image's direct link

  const location = useLocation(); // Hook to get the current location

  // Function to determine if the link is active based on the current path
  const isActive = (path) => location.pathname === path;
  const signOut = useSignOut();
  return (
    <div className="sidebarsmall">
      {/* ...other links... */}
      
      <Link to="/chatbot" className={`sidebarsmalllink ${isActive('/chatbot') ? 'sidebarsmalllink-active' : ''}`}>
        <FontAwesomeIcon icon={faFileContract} />
      </Link>
      <Link to="/library" className={`sidebarsmalllink ${isActive('/library') ? 'sidebarsmalllink-active' : ''}`}>
        <FontAwesomeIcon icon={faBookOpen} />
      </Link>
      <Link to="/bids" className={`sidebarsmalllink ${isActive('/bids') ? 'sidebarsmalllink-active' : ''}`}>
        <FontAwesomeIcon icon={faLayerGroup} />
      </Link>
      
      
      <Link to="/login" onClick={signOut} className="sidebarsmalllink">
        <FontAwesomeIcon icon={faReply} />
      </Link>
      {/* ... */}
      <img src={imageUrl} alt="Sidebar Icon" className="sidebarsmall-image" />
    </div>

  );
};

export default SideBarSmall;