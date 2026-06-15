import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AreaPersonale from "./pages/AreaPersonale";

function App() {
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/area-personale" element={<AreaPersonale />} />
    </Routes>
  );
}
export default App;
