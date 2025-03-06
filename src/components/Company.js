import React, { useState, useEffect } from 'react';

const CompanyDropdown = ({ onCompanyChange }) => {
  const [companies, setCompanies] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminAndFetchCompanies = async () => {
      setIsLoading(true);
      try {
        const access_token = localStorage.getItem('access_token');
        if (!access_token) {
          setIsLoading(false);
          return;
        }
        
        // First check if user is admin using profile API
        const profileResponse = await fetch('https://solasolution.ecomtask.de/dev/profile', {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });
        
        if (!profileResponse.ok) {
          setIsLoading(false);
          return;
        }
        
        const profileData = await profileResponse.json();

        if (profileData.role === 'admin' || profileData.role === 'customer') {
          setIsAdmin(true);
          // If admin, fetch companies
          try {
            const companiesResponse = await fetch('https://solasolution.ecomtask.de/dev/admin/companies', {
              headers: {
                'Authorization': `Bearer ${access_token}`
              }
            });
            
            if (companiesResponse.ok) {
              const companiesData = await companiesResponse.json();
              if (Array.isArray(companiesData)) {
                setCompanies(companiesData);
              } else {
                // Handle case where response is not an array
                setCompanies([]);
              }
            }
          } catch (companyError) {
            console.log('Error fetching companies:', companyError);
            // Don't set error state, just log it and continue with empty array
            setCompanies([]);
          }
        }
      } catch (error) {
        console.log('Error:', error);
        // Don't set error state, just log it
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndFetchCompanies();
  }, []);

  // Always render the dropdown, but with appropriate options based on state
  return (
    <select
      onChange={(e) => onCompanyChange && onCompanyChange(e.target.value)}
      disabled={isLoading}
      className="
        px-4 py-2 rounded-lg 
        text-[17px] leading-[27px] font-nexa-book text-[#001E4A]
        border border-[#E6E2DF] bg-white 
        hover:border-[#F0B72F] 
        focus:outline-none focus:ring-2 focus:ring-[#F0B72F] focus:border-[#F0B72F] 
        transition-all
      "
    >
      <option value="">Keine Filter</option>
      {!isLoading && companies && companies.length > 0 && 
        companies.map((company, index) => (
          <option key={index} value={company.company || ''}>
            {company.company || 'No Company'}
          </option>
        ))
      }
    </select>
  );
};

export default CompanyDropdown;