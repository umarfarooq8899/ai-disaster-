export default function StatsCard({ label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    teal: "bg-teal-50 text-teal-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}
