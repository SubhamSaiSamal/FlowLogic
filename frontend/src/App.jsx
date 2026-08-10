import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Workspace from "./pages/Workspace";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/app" element={<Navigate to="/app/surface" replace />} />
      <Route path="/app/:labView" element={<Workspace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
