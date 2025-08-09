
import { useNavigate } from "react-router-dom";

const Navigation = () =>{
    const navigate=useNavigate();

    const handleNavigation =(path:string) =>{
        navigate(path);
    }
    return {handleNavigation};
}
 export default Navigation;
