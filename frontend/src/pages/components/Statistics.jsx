import { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

export default function Statistics() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user?.token) return;
        const res = await axios.get("/statistics", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load statistics", err);
      }
    };

    fetchStats();
  }, [user]);

  if (!stats) return <div>Loading statistics...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-blue-100 p-4 rounded shadow">
        <h2 className="text-lg font-semibold">Total Users</h2>
        <p className="text-2xl font-bold">{stats.totalUsers}</p>
      </div>
      <div className="bg-green-100 p-4 rounded shadow">
        <h2 className="text-lg font-semibold">Rescue Teams</h2>
        <p className="text-2xl font-bold">{stats.totalRescue}</p>
      </div>
      <div className="bg-yellow-100 p-4 rounded shadow">
        <h2 className="text-lg font-semibold">NGOs</h2>
        <p className="text-2xl font-bold">{stats.totalNGO}</p>
      </div>
      <div className="bg-red-100 p-4 rounded shadow">
        <h2 className="text-lg font-semibold">Disasters</h2>
        <p className="text-2xl font-bold">{stats.totalDisasters}</p>
      </div>
    </div>
  );
}
