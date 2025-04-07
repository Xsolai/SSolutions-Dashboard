import React, { useState, useEffect, useCallback, useRef } from 'react';

const CompanyDropdown = ({ onCompanyChange }) => {
  const [companies, setCompanies] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loading, setLoading] = useState(true);
  
  const STORAGE_KEY = 'selectedCompany';
  const COMPANIES_CACHE_KEY = 'cachedCompanies';
  const CACHE_EXPIRY_KEY = 'companiesCacheExpiry';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Memoize the fetch function to prevent recreating it on each render
  const fetchData = useCallback(async () => {
    try {
      // Check if we have cached data that's not expired
      const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      const cachedCompanies = localStorage.getItem(COMPANIES_CACHE_KEY);
      const now = Date.now();
      
      if (cacheExpiry && cachedCompanies && parseInt(cacheExpiry) > now) {
        // Use cached data
        const companiesData = JSON.parse(cachedCompanies);
        setCompanies(companiesData);
        setIsAdmin(true);
        
        // Get previously selected company
        const savedCompany = localStorage.getItem(STORAGE_KEY);
        const companyExists = savedCompany && 
          companiesData.some(c => c.company === savedCompany);
        const companyToSelect = companyExists ? savedCompany : companiesData[0].company;
        
        setSelectedCompany(companyToSelect);
        onCompanyChange(companyToSelect);
        setLoading(false);
        
        // Refresh cache in background
        refreshCacheInBackground();
        return;
      }
      
      // No valid cache, fetch from API
      const access_token = localStorage.getItem('access_token');
      
      // Set up headers once
      const headers = {
        'Authorization': `Bearer ${access_token}`,
        'Cache-Control': 'no-cache'
      };
      
      // Use Promise.all with timeout to abort slow requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const [profileResponse, companiesResponse] = await Promise.all([
        fetch('https://solasolution.ecomtask.de/profile', {
          headers,
          signal: controller.signal
        }),
        fetch('https://solasolution.ecomtask.de/admin/companies', {
          headers,
          signal: controller.signal
        })
      ]);
      
      clearTimeout(timeoutId);
      
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      if (!companiesResponse.ok) {
        throw new Error('Failed to fetch companies data');
      }
      
      const profileData = await profileResponse.json();
      const companiesData = await companiesResponse.json();
      
      // Allow both admin and customer roles to see company dropdown
      if (profileData.role === 'admin' || profileData.role === 'customer') {
        setIsAdmin(true);
        
        // Set companies in state
        if (companiesData && Array.isArray(companiesData) && companiesData.length > 0) {
          // Cache the companies data
          localStorage.setItem(COMPANIES_CACHE_KEY, JSON.stringify(companiesData));
          localStorage.setItem(CACHE_EXPIRY_KEY, (now + CACHE_DURATION).toString());
          
          setCompanies(companiesData);
          
          // Try to get previously selected company from localStorage
          const savedCompany = localStorage.getItem(STORAGE_KEY);
          
          // Check if the saved company exists in the companies list
          const companyExists = savedCompany && 
            companiesData.some(c => c.company === savedCompany);
          
          // Use saved company if it exists, otherwise use first company
          const companyToSelect = companyExists ? savedCompany : companiesData[0].company;
          
          setSelectedCompany(companyToSelect);
          onCompanyChange(companyToSelect);
        }
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      
      // Try to use stale cache as fallback
      const cachedCompanies = localStorage.getItem(COMPANIES_CACHE_KEY);
      if (cachedCompanies) {
        try {
          const companiesData = JSON.parse(cachedCompanies);
          setCompanies(companiesData);
          setIsAdmin(true);
          
          const savedCompany = localStorage.getItem(STORAGE_KEY);
          const companyExists = savedCompany && 
            companiesData.some(c => c.company === savedCompany);
          const companyToSelect = companyExists ? savedCompany : companiesData[0].company;
          
          setSelectedCompany(companyToSelect);
          onCompanyChange(companyToSelect);
        } catch (e) {
          console.error('Error parsing cached companies:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [onCompanyChange]);
  
  // Refresh cache in background without blocking UI
  const refreshCacheInBackground = async () => {
    try {
      const access_token = localStorage.getItem('access_token');
      
      // Fetch new data silently
      const [profileResponse, companiesResponse] = await Promise.all([
        fetch('https://solasolution.ecomtask.de/profile', {
          headers: { 'Authorization': `Bearer ${access_token}` }
        }),
        fetch('https://solasolution.ecomtask.de/admin/companies', {
          headers: { 'Authorization': `Bearer ${access_token}` }
        })
      ]);
      
      if (profileResponse.ok && companiesResponse.ok) {
        const profileData = await profileResponse.json();
        const companiesData = await companiesResponse.json();
        
        if (profileData.role === 'admin' || profileData.role === 'customer') {
          if (companiesData && Array.isArray(companiesData) && companiesData.length > 0) {
            // Update cache
            localStorage.setItem(COMPANIES_CACHE_KEY, JSON.stringify(companiesData));
            localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
          }
        }
      }
    } catch (error) {
      // Silently fail - this is just a background refresh
      console.debug('Background cache refresh failed:', error);
    }
  };

  // Only run once when the component mounts
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCompanyChange = (e) => {
    const company = e.target.value;
    setSelectedCompany(company);
    
    // Save selection to localStorage
    localStorage.setItem(STORAGE_KEY, company);
    
    // Notify parent component
    onCompanyChange(company);
  };

  if (loading) {
    return (
      <div className="px-4 py-2 rounded-lg border border-[#E6E2DF] bg-white text-[#001E4A]/50 font-nexa-book flex items-center">
        <div className="w-4 h-4 mr-2 border-2 border-t-transparent border-[#F0B72F] rounded-full animate-spin"></div>
        Loading...
      </div>
    );
  }

  if (!isAdmin || !companies || companies.length === 0) {
    return null;
  }

  return (
    <select
      value={selectedCompany}
      onChange={handleCompanyChange}
      className="
        px-4 py-2 rounded-lg 
        text-[17px] leading-[27px] font-nexa-book text-[#001E4A]
        border border-[#E6E2DF] bg-white 
        hover:border-[#F0B72F] 
        focus:outline-none focus:ring-2 focus:ring-[#F0B72F] focus:border-[#F0B72F] 
        transition-all
      "
    >
      {companies.map((company, index) => (
        <option key={index} value={company.company}>
          {company.company}
        </option>
      ))}
    </select>
  );
};

export default CompanyDropdown;