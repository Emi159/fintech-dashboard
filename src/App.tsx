import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardProvider } from "./context/DashboardContext";
import { FilterProvider } from "./context/FilterContext";
import { MainLayout } from "./components/layout/MainLayout";
import Overview from "./pages/Overview";
import Projects from "./pages/Projects";
import Performance from "./pages/Performance";
import Analytics from "./pages/Analytics";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <DashboardProvider>
        <FilterProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </MainLayout>
        </FilterProvider>
      </DashboardProvider>
    </BrowserRouter>
  );
}
