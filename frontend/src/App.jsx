import { Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import PublicStatistics from "./pages/public/Statistics";

function App() {
  return (
    <Routes>

      {/* PUBLIC LAYOUT */}
      <Route path="/" element={<PublicLayout />}>
        <Route path="statistics" element={<PublicStatistics />} />
      </Route>

    </Routes>
  );
}

export default App;

