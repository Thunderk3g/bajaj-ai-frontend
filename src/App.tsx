import { Routes, Route } from "react-router-dom";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { MonitoringOverview } from "@/monitoring/MonitoringOverview";
import { AgentMonitor } from "@/monitoring/AgentMonitor";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Landing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitoring"
        element={
          <ProtectedRoute>
            <MonitoringOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitoring/:agentId"
        element={
          <ProtectedRoute>
            <AgentMonitor />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
