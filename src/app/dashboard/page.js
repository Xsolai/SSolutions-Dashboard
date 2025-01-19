"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  UserCircle,
  LogOut,
  History,
  X,
  Check,
  AlertTriangle,
  Clock,
  Menu,
  Settings,
} from "lucide-react";
import CallAnalysisDashboard from "@/components/CallAnalysisDashboard";
import EmailAnalysisDashboard from "@/components/EmailAnalysisDashboard";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import logo from "@/assets/images/logo.png";
import ProtectedRoute from "@/components/ProtectedRoute";
import TaskAnalysisDashboard from "@/components/TaskAnalyis";

const HistorySidebar = ({ isOpen, onClose }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get("https://app.saincube.com/app2/history");
        setHistoryData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Fehler beim Abrufen des Verlaufs:", error);
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchHistory();
    }

    let interval;
    if (isOpen) {
      interval = setInterval(fetchHistory, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "success":
      case "completed":
        return <Check className="w-5 h-5 text-green-500" />;
      case "error":
      case "failed":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "pending":
      case "processing":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-[#001E4A]/10 backdrop-blur-sm transition-opacity z-40" onClick={onClose} />
      )}
      <div className={`fixed top-0 right-0 h-full w-full md:w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-[#E6E2DF]">
            <div className="flex items-center justify-between">
              <h2 className="text-[26px] leading-[36px] font-nexa-black text-[#001E4A] flex items-center gap-2">
                <History className="w-6 h-6" />
                Geschichte
              </h2>
              <button onClick={onClose} className="p-1.5 hover:bg-[#E6E2DF]/10 rounded-full transition-colors duration-200">
                <X className="w-5 h-5 text-[#001E4A]" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-[17px] leading-[27px] font-nexa-book text-[#001E4A]/70">
                  Verlauf wird geladen...
                </div>
              </div>
            ) : historyData.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-[17px] leading-[27px] font-nexa-book text-[#001E4A]/70">
                  Kein Verlauf verfügbar
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {historyData.map((item) => (
                  <div key={item.id} className="bg-[#E6E2DF]/10 rounded-xl p-3.5 hover:bg-[#E6E2DF]/20 transition-colors duration-200 cursor-pointer group border border-[#E6E2DF]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-nexa-black text-[17px] leading-[27px] text-[#001E4A] group-hover:text-[#001E4A] transition-colors">
                        {item.filename}
                      </span>
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="text-[14px] font-nexa-book text-[#001E4A]/70 group-hover:text-[#001E4A]/80 transition-colors">
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

const ProfileDropdown = ({ role }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("https://app.saincube.com/app2/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem("access_token");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Fehler beim Abmelden:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-[#E6E2DF]/10 transition-all duration-200">
        <UserCircle className="w-6 h-6 text-[#001E4A]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-[#E6E2DF] z-50">
          <div className="p-4 border-b border-[#E6E2DF]">
            <p className="font-nexa-black text-[17px] leading-[27px] text-[#001E4A]">
              {localStorage.getItem("username")}
            </p>
            <p className="font-nexa-book text-[14px] text-[#001E4A]/70">
              {localStorage.getItem("email")}
            </p>
          </div>
          {role === "admin" && (
            <div className="p-2">
              <a href="/dashboard/admin" className="w-full px-4 py-2 text-left text-[#001E4A] hover:bg-[#E6E2DF]/10 rounded-md flex items-center gap-2 transition-all duration-200 font-nexa-book">
                <Settings className="w-4 h-4" />
                Admin Bereich
              </a>
            </div>
          )}
          <div className="p-2">
            <button onClick={handleLogout} className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2 transition-all duration-200 font-nexa-book">
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const [activeTab, setActiveTab] = useState("analytics");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState("");

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("https://app.saincube.com/app2/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setRole(data.role);
          localStorage.setItem("username", data.username);
          localStorage.setItem("email", data.email);
        }
      } catch (error) {
        console.error("Fehler beim Abrufen des Profils:", error);
      }
    };

    fetchUserRole();
  }, []);

  const navigationLinks = [
    { id: "analytics", label: "Analyse" },
    { id: "call-analysis", label: "Anrufanalyse" },
    { id: "email-analysis", label: "E-Mail-Analyse" },
    { id: "task-analysis", label: "Aufgabenanalyse" },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white text-[#001E4A]">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-shrink-0">
              <img src={logo.src} alt="Dashboard Logo" className="w-auto h-8" />
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center space-x-4">
                {navigationLinks.map((link) => (
                  <button
                    key={link.id}
                    className={`px-4 py-2 rounded-xl font-nexa-black text-[17px] leading-[27px] transition-all duration-200 ${
                      activeTab === link.id
                        ? "text-[#001E4A] bg-[#F0B72F]"
                        : "text-[#001E4A] border-[#F0B72F] border-2 hover:bg-[#F0B72F]/10"
                    }`}
                    onClick={() => setActiveTab(link.id)}
                  >
                    {link.label}
                  </button>
                ))}
                {role === "admin" && (
                  <button
                    className="px-4 py-2 rounded-xl font-nexa-black text-[17px] leading-[27px] bg-[#001E4A] text-[#F0B72F] hover:bg-[#001E4A]/90 transition-all duration-200 flex items-center gap-2"
                    onClick={() => setIsHistoryOpen(true)}
                  >
                    <History className="w-5 h-5" />
                    Geschichte
                  </button>
                )}
                <ProfileDropdown role={role} />
              </div>

              <div className="md:hidden flex items-center gap-4">
                <button
                  className="p-2 rounded-lg bg-[#001E4A] text-[#F0B72F] hover:bg-[#001E4A]/90"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <Menu className="w-6 h-6" />
                </button>
                <ProfileDropdown role={role} />
              </div>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-[#001E4A] border-2 rounded-xl mt-4 p-4 space-y-3">
              {navigationLinks.map((link) => (
                <button
                  key={link.id}
                  className={`w-full px-4 py-2 rounded-xl font-nexa-black text-[17px] leading-[27px] transition-all duration-200 ${
                    activeTab === link.id
                      ? "bg-[#F0B72F] text-[#001E4A]"
                      : "text-[#F0B72F] hover:bg-[#001E4A]/10"
                  }`}
                  onClick={() => setActiveTab(link.id)}
                >
                  {link.label}
                </button>
              ))}
              {role === "admin" && (
                <button
                  className="w-full px-4 py-2 rounded-xl font-nexa-black text-[17px] leading-[27px] text-[#F0B72F] hover:bg-[#001E4A]/10 transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={() => {
                    setIsHistoryOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <History className="w-5 h-5" />
                  Geschichte
                </button>
              )}
            </div>
          )}

          <div className="mt-6">
            {activeTab === "analytics" && <AnalyticsDashboard />}
            {activeTab === "call-analysis" && <CallAnalysisDashboard />}
            {activeTab === "email-analysis" && <EmailAnalysisDashboard />}
            {activeTab === "task-analysis" && <TaskAnalysisDashboard />}
          </div>
        </div>

        <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      </div>
    </ProtectedRoute>
  );
};

export default Home;