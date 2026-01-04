import AdminDashboard from "./pages/AdminDashboard";
import DisasterMap from "./components/DisasterMap";

function App() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  return <DisasterMap />;
}

export default App;
