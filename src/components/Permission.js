"use client";
import React from "react";
import { useVisibility } from "@/context/VisibilityContext";

const AdminPanel = () => {
  const { visibility, toggleVisibility } = useVisibility();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white p-4 shadow-md rounded-md">
          <span className="text-lg font-medium">Call Analysis Dashboard</span>
          <button
            onClick={() => toggleVisibility("callAnalysis")}
            className={`px-4 py-2 rounded ${
              visibility.callAnalysis ? "bg-red-500" : "bg-green-500"
            } text-white`}
          >
            {visibility.callAnalysis ? "Hide" : "Show"}
          </button>
        </div>
        <div className="flex items-center justify-between bg-white p-4 shadow-md rounded-md">
          <span className="text-lg font-medium">Email Analysis Dashboard</span>
          <button
            onClick={() => toggleVisibility("emailAnalysis")}
            className={`px-4 py-2 rounded ${
              visibility.emailAnalysis ? "bg-red-500" : "bg-green-500"
            } text-white`}
          >
            {visibility.emailAnalysis ? "Hide" : "Show"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
