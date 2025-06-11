import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import './App.css'
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Scheduler from './pages/Scheduler';
import Fleet from './pages/Fleets';
import Hittracker from './pages/Piracy';
import Warehouse from "./pages/Warehouse";
import Info from './pages/Info';
import Leaderboards from './pages/Leaderboards';
import { UserProvider } from "./context/UserContext";
import AdminBadges from "./pages/admin_badges";

function App() {
  const [count, setCount] = useState(0)

  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/info" element={<Info />} />
        <Route path="/piracy" element={<Hittracker />} />
        <Route path="/fleets" element={<Fleet />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/scheduler" element={<Scheduler />} />
        <Route path="/warehouse" element={<Warehouse />} />
        <Route path="/admin/badges" element={<AdminBadges />} />
      </Routes>
    </UserProvider>
  )
}

export default App
