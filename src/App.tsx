import { useState } from 'react'
import { Routes, Route } from "react-router-dom";
import './App.css'
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Scheduler from './pages/Scheduler';
import Fleet from './pages/Fleets';
import Hittracker from './pages/Piracy';
import Warehouse from "./pages/Warehouse";
import { UserProvider } from "./context/UserContext";

function App() {
  const [count, setCount] = useState(0)

  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/piracy" element={<Hittracker />} />
        <Route path="/fleets" element={<Fleet />} />
        <Route path="/scheduler" element={<Scheduler />} />
        <Route path="/warehouse" element={<Warehouse />} />
      </Routes>
    </UserProvider>
  )
}

export default App
