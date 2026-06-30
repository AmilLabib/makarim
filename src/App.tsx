import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TodoListPage from "./pages/TodoListPage";
import JobPage from "./pages/JobPage";
import AbsenPage from "./pages/Absen";
import CalendarPage from "./pages/CalendarPage";
import HealthPage from "./pages/HealthPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="todos" element={<TodoListPage />} />
          <Route path="jobs" element={<JobPage />} />
          <Route path="absen" element={<AbsenPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="health" element={<HealthPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
