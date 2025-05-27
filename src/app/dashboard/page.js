// src/app/dashboard/page.js
"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
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
  Mail,
  Settings,
  Phone,
  FileText,
  Download,
  Calendar,
  Building2,
  Home as HomeIcon,
  BarChart3,
  Shield,
  Bot,
  Lock,
} from "lucide-react";
import logo from "@/assets/images/logo.png";
import ProtectedRoute from "@/components/ProtectedRoute";
import CustomDateRangeFilter from "@/components/FilterComponent";
import CompanyDropdown from "@/components/Company";
import { ExportButton } from '@/components/MonthYearPicker';
import ModernButton from "@/components/ModernButton";
import UserAvatar from '@/components/UserAvatar';

// Lazy load heavy components
const CallAnalysisDashboard = lazy(() => import("@/components/CallAnalysisDashboard"));
const EmailAnalysisDashboard = lazy(() => import("@/components/EmailAnalysisDashboard"));
const AnalyticsDashboard = lazy(() => import("@/components/AnalyticsDashboard"));
const TaskAnalysisDashboard = lazy(() => import("@/components/TaskAnalyis"));
const AdminDashboard = lazy(() => import("@/components/AdminDashboard"));

// Constants
const API_BASE_URL = "https://solasolution.ecomtask.de";
const HISTORY_REFRESH_INTERVAL = 30000;

// Status map constant
const STATUS_MAP = {
  'added': {
    icon: <Check className="w-5 h-5 text-[#4CAF50]" />,
    label: 'Hinzugefügt'
  },
  'added for email data': {
    icon: <Mail className="w-5 h-5 text-[#F0B72F]" />,
    label: 'E-Mail-Daten hinzugefügt'
  },
  'processing': {
    icon: <Clock className="w-5 h-5 text-[#F0B72F]" />,
    label: 'Wird verarbeitet'
  },
  'error': {
    icon: <AlertTriangle className="w-5 h-5 text-[#DC3545]" />,
    label: 'Fehler'
  }
};

// Utility functions
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    return dateString;
  }
};

const getStatusInfo = (status) => {
  return STATUS_MAP[status?.toLowerCase()] || {
    icon: <Clock className="w-5 h-5 text-[#F0B72F]" />,
    label: status
  };
};

// Optimized HistorySidebar component
const HistorySidebar = React.memo(({ isOpen, onClose }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  const fetchHistory = useCallback(async () => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const accessToken = localStorage.getItem('access_token');
    
    if (!accessToken) {
      setError("Nicht autorisiert. Bitte melden Sie sich erneut an.");
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/history`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setHistoryData(data);
      setError(null);
    } catch (error) {
      if (error.name !== 'AbortError') {
        // console.error("Fehler beim Abrufen des Verlaufs:", error);
        setError(
          error.message.includes('401')
            ? "Nicht autorisiert. Bitte melden Sie sich erneut an."
            : "Fehler beim Laden des Verlaufs. Bitte versuchen Sie es später erneut."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      
      // Set up interval
      intervalRef.current = setInterval(fetchHistory, HISTORY_REFRESH_INTERVAL);
    }
    
    return () => {
      // Cleanup interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Abort ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isOpen, fetchHistory]);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#001E4A]/10 backdrop-blur-sm transition-opacity z-40" 
          onClick={onClose}
        />
      )}
      
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-80 bg-[#001E4A] shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-[26px] leading-[36px] font-nexa-black text-white flex items-center gap-2">
                <History className="w-6 h-6" />
                History
              </h2>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors duration-200"
                aria-label="Schließen"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-[#001E4A] scrollbar-thumb-[#F0B72F40] hover:scrollbar-thumb-[#F0B72F60]">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-[17px] leading-[27px] font-nexa-book text-white/70">
                  Verlauf wird geladen...
                </div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-[17px] leading-[27px] font-nexa-book text-[#DC3545] px-4 text-center">
                  {error}
                </div>
              </div>
            ) : historyData.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-[17px] leading-[27px] font-nexa-book text-white/70">
                  Kein Verlauf verfügbar
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {historyData.map((item) => {
                  const statusInfo = getStatusInfo(item.status);
                  
                  return (
                    <div 
                      key={item.id}
                      className="bg-white/5 rounded-xl p-3.5 hover:bg-white/10 transition-colors duration-200 cursor-pointer group border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <span className="font-nexa-black text-[17px] leading-[27px] text-white group-hover:text-white transition-colors">
                            {item.filename}
                          </span>
                          <div className="text-[14px] font-nexa-book text-white/70 group-hover:text-white/80 transition-colors mt-1">
                            {statusInfo.label}
                          </div>
                        </div>
                        {statusInfo.icon}
                      </div>
                      <div className="text-[14px] font-nexa-book text-white/70 group-hover:text-white/80 transition-colors">
                        {formatDate(item.processed_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

HistorySidebar.displayName = 'HistorySidebar';

// Navigation items constant
const getNavigationItems = (role) => {
  const items = [
    { id: "overview", label: "Übersicht", icon: HomeIcon, description: "Allgemeine Dashboard-Übersicht" },
    { id: "analytics", label: "Globale Analyse", icon: BarChart3, description: "Umfassende Analyse aller Bereiche" },
    { id: "call-analysis", label: "Anruf Analyse", icon: Phone, description: "Detaillierte Auswertung der Anrufdaten" },
    { id: "email-analysis", label: "E-Mail Analyse", icon: Mail, description: "Detaillierte Auswertung der E-Mail-Daten" },
    { id: "task-analysis", label: "Aufgaben Analyse", icon: FileText, description: "Detaillierte Auswertung der Aufgabendaten" }
  ];

  if (role === "admin") {
    items.push({ id: "admin", label: "Admin Bereich", icon: Shield, description: "Administrative Aufgaben und Einstellungen" });
  }
  return items;
};

// Optimized DashboardSidebar component
const DashboardSidebar = React.memo(({ 
  activeTab, 
  setActiveTab, 
  role, 
  onHistoryClick, 
  dateRange,
  onDateRangeChange,
  selectedCompany,
  onCompanyChange,
  isMobileOpen,
  setIsMobileOpen 
}) => {
  const [userInfo, setUserInfo] = useState(() => ({
    username: localStorage.getItem("username") || 'Benutzer',
    email: localStorage.getItem("email") || 'email@example.com'
  }));

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      if (response.ok) {
        // Clear all auth data
        localStorage.removeItem("access_token");
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        localStorage.removeItem("role");
        window.location.href = "/";
      }
    } catch (error) {
      // console.error("Fehler beim Abmelden:", error);
    }
  }, []);

  const navigationItems = useMemo(() => getNavigationItems(role), [role]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  }, [setActiveTab, setIsMobileOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-72 bg-[#001E4A] text-white z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:z-0
        flex flex-col
      `}>
        {/* User Profile Section */}
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <UserAvatar email={userInfo.email} />
            <div className="flex-1">
              <h3 className="font-bold text-sm uppercase">{userInfo.username}</h3>
              <p className="text-xs text-white/70">{userInfo.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`
                w-full px-6 py-3 flex items-center space-x-3
                transition-all duration-200 relative
                ${activeTab === item.id 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {activeTab === item.id && (
                <div className="absolute left-0 top-0 h-full w-1 bg-white" />
              )}
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          {/* Historie Button - nur für Admin */}
          {role === "admin" && (
            <button
              onClick={onHistoryClick}
              className="w-full px-6 py-3 flex items-center space-x-3 text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <History className="w-5 h-5" />
              <span className="font-medium">Historie</span>
            </button>
          )}
        </nav>

        {/* Filter Section */}
        <div className="p-4 border-t border-white/10 space-y-4 flex-shrink-0 overflow-visible">
          {/* Date Filter */}
          <div className="bg-white/5 rounded-lg p-3 overflow-visible">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-white/70" />
              <span className="text-sm font-medium text-white/70">Datum</span>
            </div>
            <div className="[&_button]:bg-transparent [&_button]:text-white [&_button]:border-white/10 [&_button]:hover:bg-white/10 [&_svg]:text-white overflow-visible">
              <CustomDateRangeFilter onFilterChange={onDateRangeChange} sidebarMode={true} />
            </div>
          </div>

          {/* Company Filter */}
          <div className="bg-white/5 rounded-lg p-3 overflow-visible">
            <div className="flex items-center space-x-2 mb-2">
              <Building2 className="w-4 h-4 text-white/70" />
              <span className="text-sm font-medium text-white/70">Kunde</span>
            </div>
            <div className="[&_button]:bg-transparent [&_button]:text-white [&_button]:border-white/10 [&_button]:hover:bg-white/10 [&_svg]:text-white overflow-visible">
              <CompanyDropdown onCompanyChange={onCompanyChange} sidebarMode={true} />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 flex items-center space-x-2 bg-[#F0B72F] hover:bg-[#F0B72F]/80 text-[#001E4A] rounded-lg transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-nexa-black">Abmelden</span>
          </button>
        </div>
      </div>
    </>
  );
});

DashboardSidebar.displayName = 'DashboardSidebar';

// Loading component
const DashboardLoading = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-lg text-gray-600">Wird geladen...</div>
  </div>
);

const Home = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [role, setRole] = useState("");
  const [hasCompanyAccess, setHasCompanyAccess] = useState(null);
  const [hasCompanyPermissions, setHasCompanyPermissions] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    // Default to last 7 days for a more useful initial view
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    return {
      startDate: sevenDaysAgo,
      endDate: today,
      isAllTime: false
    };
  });
  const [selectedCompany, setSelectedCompany] = useState('');

  const handleCompanyChange = useCallback((company) => {
    setSelectedCompany(company);
    if (company) {
      setHasCompanyAccess(true);
      setHasCompanyPermissions(true);
    }
  }, []);

  const handleDateRangeChange = useCallback((newRange) => {
    setDateRange({
      startDate: newRange.startDate,
      endDate: newRange.endDate,
      isAllTime: newRange.isAllTime
    });
  }, []);

  const checkCompanyPermissions = useCallback(async () => {
    try {
      const access_token = localStorage.getItem('access_token');
      
      // Prüfe sowohl Profil als auch verfügbare Unternehmen
      const [profileResponse, companiesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${access_token}` }
        }),
        fetch(`${API_BASE_URL}/admin/companies`, {
          headers: { 'Authorization': `Bearer ${access_token}` }
        })
      ]);

      if (profileResponse.ok && companiesResponse.ok) {
        const profileData = await profileResponse.json();
        const companiesData = await companiesResponse.json();
        
        // Prüfe ob der Benutzer Admin ist oder Kundenzugang hat
        const isAdmin = profileData.role === 'admin';
        const hasCustomerRole = profileData.role === 'customer';
        const hasCompanies = companiesData && Array.isArray(companiesData) && companiesData.length > 0;
        
        if (isAdmin || (hasCustomerRole && hasCompanies)) {
          setHasCompanyPermissions(true);
          setHasCompanyAccess(true);
          
          // Setze automatisch das erste verfügbare Unternehmen, falls noch keines ausgewählt
          if (hasCompanies && !selectedCompany) {
            const savedCompany = localStorage.getItem('selectedCompany');
            const companyToSelect = savedCompany && companiesData.some(c => c.company === savedCompany) 
              ? savedCompany 
              : companiesData[0].company;
            setSelectedCompany(companyToSelect);
          }
        } else {
          setHasCompanyPermissions(false);
          setHasCompanyAccess(false);
        }
      } else {
        setHasCompanyPermissions(false);
        setHasCompanyAccess(false);
      }
    } catch (error) {
      // console.error('Error checking company permissions:', error);
      setHasCompanyPermissions(false);
      setHasCompanyAccess(false);
    }
  }, [selectedCompany]);

  const checkCompanyAccess = useCallback(async () => {
    try {
      const access_token = localStorage.getItem('access_token');
      const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      if (profileResponse.ok) {
        setHasCompanyAccess(true);
      } else {
        setHasCompanyAccess(false);
      }
    } catch (error) {
      setHasCompanyAccess(true); 
    }
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setRole(data.role);
          localStorage.setItem("username", data.username);
          localStorage.setItem("email", data.email);
          localStorage.setItem("role", data.role);
        }
      } catch (error) {
        // console.error("Fehler beim Abrufen des Profils:", error);
      }
    };
    fetchUserRole();
    checkCompanyPermissions();
  }, [checkCompanyPermissions]);

  const navigationItems = useMemo(() => getNavigationItems(role), [role]);

  // Function to render the new overview dashboard
  const renderOverviewDashboard = () => {
    // Filter out the 'overview' tab itself from the navigation items for cards
    const dashboardCards = navigationItems.filter(item => item.id !== 'overview');

    return (
      <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#001E4A] via-[#002B6B] to-[#001E4A] px-8 py-16 mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F0B72F]/10 to-transparent"></div>
          <div className="relative text-center">
            <h1 className="text-5xl font-nexa-black text-white mb-4 tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="text-xl text-white/80 font-nexa-book max-w-2xl mx-auto leading-relaxed">
              Umfassende Einblicke in alle Geschäftsbereiche - von Anrufen bis zu Aufgaben
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F0B72F]/5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#F0B72F]/5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Analysis Cards Grid */}
        <div className="px-8 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {dashboardCards.map((item, index) => (
                (!item.adminOnly || role === 'admin') && (
                  <div
                    key={item.id}
                    className="group relative"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <button
                      onClick={() => !item.comingSoon && setActiveTab(item.id)}
                      disabled={item.comingSoon}
                      className={`w-full h-full p-8 rounded-2xl shadow-lg transition-all duration-500 ease-out transform focus:outline-none border relative overflow-hidden group ${
                        item.comingSoon 
                          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-75' 
                          : 'bg-white hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] focus:ring-4 focus:ring-[#F0B72F]/30 border-gray-100 hover:border-[#F0B72F]/30'
                      }`}
                    >
                      {/* Background gradient on hover - only for available items */}
                      {!item.comingSoon && (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#F0B72F]/5 via-transparent to-[#001E4A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      )}
                      
                      {/* Coming Soon Badge */}
                      {item.comingSoon && (
                        <div className="absolute top-4 right-4 bg-gray-400 text-white text-xs px-2 py-1 rounded-full font-nexa-bold">
                          Demnächst
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="relative z-10 flex flex-col items-center text-center h-full min-h-[280px] justify-between">
                        {/* Icon Section */}
                        <div className="flex-shrink-0 mb-6">
                          <div className="relative">
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 ${
                              item.comingSoon 
                                ? 'bg-gray-200' 
                                : 'bg-gradient-to-br from-[#F0B72F]/20 to-[#F0B72F]/10 group-hover:scale-110 group-hover:shadow-[#F0B72F]/20'
                            }`}>
                              <item.icon className={`w-10 h-10 transition-colors duration-300 ${
                                item.comingSoon 
                                  ? 'text-gray-400' 
                                  : 'text-[#F0B72F] group-hover:text-[#E09F1F]'
                              }`} />
                              {/* Lock overlay for coming soon items */}
                              {item.comingSoon && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                    <Lock className="w-3 h-3 text-gray-500" />
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Decorative ring */}
                            <div className={`absolute inset-0 rounded-2xl border-2 transition-colors duration-300 ${
                              item.comingSoon 
                                ? 'border-gray-300' 
                                : 'border-[#F0B72F]/20 group-hover:border-[#F0B72F]/40'
                            }`}></div>
                          </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex-grow flex flex-col justify-center">
                          <h3 className={`text-2xl font-nexa-black mb-3 transition-colors duration-300 ${
                            item.comingSoon 
                              ? 'text-gray-500' 
                              : 'text-gray-800 group-hover:text-[#001E4A]'
                          }`}>
                            {item.label}
                          </h3>
                          <p className={`text-sm font-nexa-book leading-relaxed transition-colors duration-300 px-2 ${
                            item.comingSoon 
                              ? 'text-gray-400' 
                              : 'text-gray-600 group-hover:text-gray-700'
                          }`}>
                            {item.description || `Detailanalyse für ${item.label}`}
                          </p>
                        </div>

                        {/* Action Indicator */}
                        <div className="flex-shrink-0 mt-6">
                          <div className={`inline-flex items-center transition-colors duration-300 ${
                            item.comingSoon 
                              ? 'text-gray-400' 
                              : 'text-[#F0B72F] group-hover:text-[#E09F1F]'
                          }`}>
                            <span className="text-sm font-nexa-bold mr-2">
                              {item.comingSoon ? 'Bald verfügbar' : 'Öffnen'}
                            </span>
                            {item.comingSoon ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Subtle border animation - only for available items */}
                      {!item.comingSoon && (
                        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[#F0B72F]/20 transition-colors duration-500"></div>
                      )}
                    </button>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (hasCompanyPermissions === null) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#001130] flex items-center justify-center">
          <div className="bg-[#001E4A] border border-white/10 rounded-2xl shadow-2xl p-12 text-center max-w-md">
            <div className="w-16 h-16 border-4 border-[#F0B72F] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-nexa-black text-white mb-4">
              Dashboard wird geladen...
            </h2>
            <p className="text-white/70 font-nexa-book">
              Berechtigungen werden überprüft...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Neue gesperrte Ansicht für Benutzer ohne Kundenberechtigungen
  if (hasCompanyPermissions === false) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#001130] relative overflow-hidden">
          {/* Blur Overlay */}
          <div className="absolute inset-0 backdrop-blur-md bg-[#001130]/80 z-50"></div>
          
          {/* Locked Content */}
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-sm border border-[#E6E2DF] rounded-3xl shadow-2xl p-12 text-center max-w-md mx-auto">
              {/* Lock Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-[#F0B72F]/20 to-[#F0B72F]/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <svg className="w-10 h-10 text-[#F0B72F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              {/* Title */}
              <h2 className="text-3xl font-nexa-black text-[#001E4A] mb-4">
                Dashboard gesperrt
              </h2>
              
              {/* Message */}
              <p className="text-[#001E4A]/70 font-nexa-book mb-8 leading-relaxed">
                Ein Administrator muss Ihnen Zugriff erteilen.
              </p>
              
              {/* Logout Button */}
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                className="px-8 py-3 bg-[#F0B72F] hover:bg-[#E09F1F] text-[#001E4A] rounded-xl font-nexa-black transition-all duration-200 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <LogOut className="w-5 h-5" />
                Abmelden
              </button>
            </div>
          </div>
          
          {/* Background Dashboard (blurred) */}
          <div className="opacity-30">
            <div className="flex h-screen bg-[#001130]">
              {/* Sidebar */}
              <div className="w-64 bg-[#001E4A] border-r border-white/10">
                <div className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#F0B72F] rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-white/20 rounded w-20 mb-1"></div>
                      <div className="h-3 bg-white/10 rounded w-16"></div>
                    </div>
                  </div>
                </div>
                <div className="px-6 space-y-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="h-10 bg-white/5 rounded-lg"></div>
                  ))}
                </div>
              </div>
              
              {/* Main Content */}
              <div className="flex-1 p-8">
                <div className="space-y-6">
                  <div className="h-8 bg-white/10 rounded w-1/3"></div>
                  <div className="grid grid-cols-3 gap-6">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-32 bg-white/5 rounded-xl"></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {[1,2].map(i => (
                      <div key={i} className="h-64 bg-white/5 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (hasCompanyAccess === false) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#001130] flex items-center justify-center">
          <div className="bg-[#001E4A] border border-white/10 rounded-2xl shadow-2xl p-12 text-center max-w-md">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-nexa-black text-white mb-4">
              Zugriff verweigert
            </h2>
            <p className="text-white/70 font-nexa-book mb-6">
              Sie haben keinen Zugriff auf Kundendaten. Bitte wenden Sie sich an Ihren Administrator, um die erforderlichen Berechtigungen zu erhalten oder wählen Sie einen Kunden aus.
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              className="px-6 py-3 bg-[#F0B72F] hover:bg-[#F0B72F]/90 text-[#001E4A] rounded-lg font-nexa-bold transition-all duration-200 flex items-center gap-2 mx-auto shadow-md hover:shadow-lg"
            >
              <LogOut className="w-5 h-5" />
              Abmelden
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#000715] flex overflow-hidden">
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          role={role}
          onHistoryClick={() => setIsHistoryOpen(true)}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          selectedCompany={selectedCompany}
          onCompanyChange={handleCompanyChange}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />

        <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
          <div className="bg-white shadow-md px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-gray-200"> {/* Geändert: bg-white, border-gray-200 */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700" /* Geändert für weißen Hintergrund */
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 flex items-center justify-center lg:justify-start">
              <img src={logo.src} alt="Dashboard Logo" className="h-6" /> 
            </div>
            <div className="hidden lg:block">
              <ExportButton companyId={selectedCompany} dateRange={dateRange} />
            </div>
          </div>

          <div className="flex-1 p-2 sm:p-4 md:p-6 lg:p-8 overflow-y-auto bg-white">
            <Suspense fallback={<DashboardLoading />}>
              {activeTab === "overview" && renderOverviewDashboard()}
              {activeTab === "analytics" && <AnalyticsDashboard dateRange={dateRange} selectedCompany={selectedCompany} />}
              {activeTab === "call-analysis" && <CallAnalysisDashboard dateRange={dateRange} selectedCompany={selectedCompany} />}
              {activeTab === "email-analysis" && <EmailAnalysisDashboard dateRange={dateRange} selectedCompany={selectedCompany} />}
              {activeTab === "task-analysis" && <TaskAnalysisDashboard dateRange={dateRange} selectedCompany={selectedCompany} />}
              {activeTab === "admin" && role === "admin" && <AdminDashboard />}
              {activeTab === "admin" && role !== "admin" && 
                <div className="text-white p-4 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl mb-2">Zugriff verweigert</h2>
                    <p>Sie haben keine Berechtigung, auf den Admin-Bereich zuzugreifen.</p>
                </div>
              }
            </Suspense>
          </div>
        </div>
        <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      </div>
    </ProtectedRoute>
  );
};

export default Home;