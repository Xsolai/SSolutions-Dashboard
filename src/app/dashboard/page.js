"use client";
import React, { useState, useEffect ,useRef} from 'react';
import axios from 'axios';
import {UserCircle, LogOut , History, X, Check, AlertTriangle, Clock, Menu } from 'lucide-react';
import CallAnalysisDashboard from "@/components/CallAnalysisDashboard";
import EmailAnalysisDashboard from "@/components/EmailAnalysisDashboard";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import logo from "@/assets/images/logo.png";
import ProtectedRoute from '@/components/ProtectedRoute';
import TaskAnalysisDashboard from '@/components/TaskAnalyis';

const HistorySidebar = ({ isOpen, onClose }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get('https://app.saincube.com/app2/history');
        setHistoryData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching history:', error);
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchHistory();
    }

    // Optional: Set up polling for real-time updates
    let interval;
    if (isOpen) {
      interval = setInterval(fetchHistory, 30000); // Update every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'completed':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'error':
      case 'failed':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity z-40"
          onClick={onClose}
        />
      )}
      <div className={`fixed top-0 right-0 h-full w-full md:w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <History className="w-6 h-6" />
                History
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500">Loading history...</div>
              </div>
            ) : historyData.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500">No history available</div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {historyData.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-xl p-3.5 hover:bg-gray-100 transition-colors duration-200 cursor-pointer group border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-800 group-hover:text-black transition-colors">
                        {item.filename}
                      </span>
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                      {item.processed_at}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};


const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('https://app.saincube.com/app2/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('https://app.saincube.com/app2/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        localStorage.removeItem('access_token');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
      >
        <UserCircle className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <p className="font-medium text-gray-900">{userData?.username}</p>
            <p className="text-sm text-gray-500">{userData?.email}</p>
          </div>
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


const Home = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Handle resize events
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigationLinks = [
    { id: 'analytics', label: 'Analytics' },
    { id: 'call-analysis', label: 'Call Analysis' },
    { id: 'email-analysis', label: 'Email Analysis' },
    { id: 'task-analysis', label: 'Task Analysis' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white text-black">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-shrink-0">
              <img
                src={logo.src}
                alt="Dashboard Logo"
                className="w-auto h-6 px-2"
              />
            </div>
  
            <div className="flex items-center gap-4">
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-4">
                {navigationLinks.map((link) => (
                  <button
                    key={link.id}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === link.id
                        ? 'text-black bg-yellow-400'
                        : 'text-black border-[#FDCC00] border-2'
                    }`}
                    onClick={() => handleTabChange(link.id)}
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  className="px-4 py-2 rounded-xl font-medium bg-black text-[#FDCC00] hover:bg-gray-800 transition-all duration-200 flex items-center gap-2"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  <History className="w-5 h-5" />
                  History
                </button>
                <ProfileDropdown />
              </div>
  
              {/* Mobile View */}
              <div className="md:hidden flex items-center gap-4">
                <button
                  className="p-2 rounded-lg bg-black text-[#FDCC00] hover:bg-gray-800"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <ProfileDropdown />

              </div>
            </div>
          </div>
  
          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-black border-2 rounded-xl mt-4 p-4 space-y-3">
              {navigationLinks.map((link) => (
                <button
                  key={link.id}
                  className={`w-full px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === link.id
                      ? 'bg-[#FDCC00] text-black'
                      : 'text-[#FDCC00] hover:bg-gray-800'
                  }`}
                  onClick={() => handleTabChange(link.id)}
                >
                  {link.label}
                </button>
              ))}
              <button
                className="w-full px-4 py-2 rounded-xl font-medium text-[#FDCC00] hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2"
                onClick={() => {
                  setIsHistoryOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                <History className="w-5 h-5" />
                History
              </button>
            </div>
          )}
          {/* Dashboard Content */}
          <div className="mt-6">
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'call-analysis' && <CallAnalysisDashboard />}
            {activeTab === 'email-analysis' && <EmailAnalysisDashboard />}
            {activeTab === 'task-analysis' && <TaskAnalysisDashboard />}
          </div>
        </div>

        <HistorySidebar
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
};

export default Home;