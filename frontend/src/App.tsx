import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import UploadFiles from "./pages/UploadFiles";
import ShowFiles from "./pages/ShowFiles";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <Router>
      <nav>
        <Link to="/upload">Upload Files</Link> 
        <br />
        <Link to="/show">See Files</Link>
        <br />
        <Link to="/login">Login</Link>
      </nav>
      <Routes>
        <Route path="/upload" element={<UploadFiles />} />
        <Route path="/show" element={<ShowFiles />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
