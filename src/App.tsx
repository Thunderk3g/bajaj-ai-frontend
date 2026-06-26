import { Routes, Route } from "react-router-dom";
import { Landing } from "@/pages/Landing";
import { MonitoringOverview } from "@/monitoring/MonitoringOverview";
import { AgentMonitor } from "@/monitoring/AgentMonitor";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/monitoring" element={<MonitoringOverview />} />
      <Route path="/monitoring/:agentId" element={<AgentMonitor />} />
    </Routes>
  );
}
