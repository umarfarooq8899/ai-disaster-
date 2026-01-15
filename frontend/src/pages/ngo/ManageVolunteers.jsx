import React, { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { CheckCircle, XCircle, Mail, Phone, MapPin } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ManageNgoVolunteers() {
  const { user } = useContext(AuthContext);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter local volunteers who belong to this org
  // In a real app backend would filter, but for now we fetch all/users and filter? 
  // Actually standard /api/users might return everyone if admin, need robust solution.
  // Ideally: GET /api/users?organization=ID

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      // Since we don't have a specific endpoint, we'll assume a generic one or filter locally
      // NOTE: For now, reusing generic user fetch and filtering by my Org ID if possible
      // But users endpoint is likely admin protected.
      // Let's rely on the user details embedded in my org? No.

      // Let's try fetching all users and filtering (only works if endpoint allows non-admin or we are essentially admin for our org)
      // If this fails, we need a backend endpoint like /api/organizations/my-volunteers

      // TEMPORARY: Mock data to demonstrate UI since backend endpoint wasn't explicitly in plan/approved scope to be modified for this specific query
      const mock = [
        { _id: 1, name: "Ali Khan", email: "ali@test.com", phone: "03001234567", city: "Karachi", status: "active" },
        { _id: 2, name: "Sara Ahmed", email: "sara@test.com", phone: "03339876543", city: "Lahore", status: "pending" },
      ];
      setVolunteers(mock);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load volunteers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  return (
    <div className="p-8">
      <Toaster />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Manage Volunteers</h1>
        <p className="text-gray-500">Volunteers registered with {user?.organization?.name || "your organization"}</p>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {volunteers.map(v => (
                <tr key={v._id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{v.name}</td>
                  <td className="p-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {v.email}</div>
                    <div className="flex items-center gap-2 mt-1"><Phone className="w-3 h-3" /> {v.phone}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {v.city}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-sm text-blue-600 hover:underline mr-3">View Profile</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
