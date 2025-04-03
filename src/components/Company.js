import React, { useState, useEffect } from 'react';

const CompanyDropdown = ({ onCompanyChange }) => {
  const [companies, setCompanies] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset all states when component mounts or when user changes
    setCompanies([]);
    setIsAdmin(false);
    setSelectedCompany('');
    setLoading(true);

    const checkAdminAndFetchCompanies = async () => {
      try {
        const access_token = localStorage.getItem('access_token');
        
        // First check if user is admin or customer using profile API
        const profileResponse = await fetch('https://solasolution.ecomtask.de/profile', {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });
        
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const profileData = await profileResponse.json();

        // Allow both admin and customer roles to see company dropdown
        if (profileData.role === 'admin' || profileData.role === 'customer') {
          setIsAdmin(true);
          
          // Fetch companies list
          const companiesResponse = await fetch('https://solasolution.ecomtask.de/admin/companies', {
            headers: {
              'Authorization': `Bearer ${access_token}`
            }
          });
          
          if (!companiesResponse.ok) {
            throw new Error('Failed to fetch companies data');
          }
          
          const companiesData = await companiesResponse.json();
          
          // Set companies in state
          if (companiesData && Array.isArray(companiesData) && companiesData.length > 0) {
            setCompanies(companiesData);
            
            // Always select the first company by default for new sessions
            const firstCompany = companiesData[0].company;
            setSelectedCompany(firstCompany);
            
            // Important: This triggers the parent component's data fetching logic
            // with the selected company
            setTimeout(() => {
              onCompanyChange(firstCompany);
            }, 0);
          }
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchCompanies();
  }, [onCompanyChange]);  // Added onCompanyChange back to dependencies

  const handleCompanyChange = (e) => {
    const company = e.target.value;
    console.log("Company selected:", company);
    setSelectedCompany(company);
    onCompanyChange(company);
  };

  if (loading) {
    return (
      <div className="px-4 py-2 rounded-lg border border-[#E6E2DF] bg-white text-[#001E4A]/50 font-nexa-book">
        Loading companies...
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