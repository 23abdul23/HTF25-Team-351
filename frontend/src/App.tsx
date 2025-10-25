import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import UploadFiles from "./pages/UploadFiles";
import ShowFiles from "./pages/ShowFiles";
import LoginPage from "./pages/ShowFiles";

function App() {
  return (
    <Router>
      <nav>
        <Link to="/upload">Upload Files</Link> 
        <Link to="/show">See Files</Link>
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
