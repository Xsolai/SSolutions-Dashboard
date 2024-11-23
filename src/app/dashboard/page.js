"use client";
import React, { useState } from 'react';
import { LayoutDashboard, History, X, Check, AlertTriangle, Clock } from 'lucide-react';
import CallAnalysisDashboard from "@/components/CallAnalysisDashboard";
import EmailAnalysisDashboard from "@/components/EmailAnalysisDashboard";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { useVisibility } from "@/context/VisibilityContext";

const HistorySidebar = ({ isOpen, onClose }) => {
  const histories = [
    { fileName: 'Sales_Call_2024.mp3', fetchTime: '2024-03-28 14:30', status: 'success' },
    { fileName: 'Customer_Support.mp3', fetchTime: '2024-03-28 13:15', status: 'error' },
    { fileName: 'Team_Meeting.mp3', fetchTime: '2024-03-28 12:00', status: 'success' },
    { fileName: 'Client_Feedback.mp3', fetchTime: '2024-03-28 11:45', status: 'pending' },
    { fileName: 'Client_Feedback.mp3', fetchTime: '2024-03-28 11:45', status: 'pending' },
    { fileName: 'Client_Feedback.mp3', fetchTime: '2024-03-28 11:45', status: 'pending' },
    { fileName: 'Client_Feedback.mp3', fetchTime: '2024-03-28 11:45', status: 'pending' },
    { fileName: 'Client_Feedback.mp3', fetchTime: '2024-03-28 11:45', status: 'pending' },
    { fileName: 'Client_Feedback.mp3', fetchTime: '2024-03-28 11:45', status: 'pending' },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-white/60 backdrop-blur-sm transition-opacity z-40"
          onClick={onClose}
        />
      )}
      <div className={`fixed top-0 right-0 h-full w-80 bg-gray-800/95 backdrop-blur-md shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <History className="w-6 h-6" />
                History
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-700 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-200" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-gray-700 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500">
            <div className="p-4 space-y-3">
              {histories.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-3.5 hover:bg-gray-600/50 transition-colors duration-200 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-200 group-hover:text-white transition-colors">
                      {item.fileName}
                    </span>
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    {item.fetchTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Home = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { visibility } = useVisibility();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-white text-[#001E4A]">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="block sm:flex items-center justify-between mb-6 space-y-6 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <LayoutDashboard className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-semibold">Dashboard</span>
          </div>

          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-[#FDCC00] text-white hover:bg-gray-700'
              }`}
              onClick={() => handleTabChange('analytics')}
            >
              Analytics
            </button>
            <button
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'call-analysis'
                  ? 'bg-blue-500 text-white shadow-lg shadow-white'
                  : 'bg-[#FDCC00] text-white hover:bg-gray-700'
              }`}
              onClick={() => handleTabChange('call-analysis')}
            >
              Call Analysis
            </button>
            <button
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                activeTab === 'email-analysis'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-[#FDCC00] text-white hover:bg-gray-700'
              }`}
              onClick={() => handleTabChange('email-analysis')}
            >
              Email Analysis
            </button>
            <button
              className="px-4 py-2 rounded-xl font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-all duration-200 flex items-center gap-2"
              onClick={() => setIsHistoryOpen(true)}
            >
              <History className="w-5 h-5" />
              History
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="mt-6">
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'call-analysis' && <CallAnalysisDashboard />}
          {activeTab === 'email-analysis' && <EmailAnalysisDashboard />}
        </div>
      </div>

      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};

export default Home;