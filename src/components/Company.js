import React, { useState, useEffect } from 'react';

const CompanyDropdown = ({ onCompanyChange }) => {
  const [companies, setCompanies] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");

  useEffect(() => {
    const checkAdminAndFetchCompanies = async () => {
      try {
        const access_token = localStorage.getItem('access_token');
        
        // First, check if user is admin or customer
        const profileResponse = await fetch('https://solasolution.ecomtask.de/profile', {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });
        const profileData = await profileResponse.json();

        if (profileData.role === 'admin' || profileData.role === 'customer') {
          setIsAdmin(true);

          // Fetch companies
          const companiesResponse = await fetch('https://solasolution.ecomtask.de/admin/companies', {
            headers: {
              'Authorization': `Bearer ${access_token}`
            }
          });
          const companiesData = await companiesResponse.json();

          if (companiesData.length > 0) {
            setCompanies(companiesData);
            setSelectedCompany(companiesData[0].company); // Set first company as default
            onCompanyChange(companiesData[0].company); // Trigger change callback
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    checkAdminAndFetchCompanies();
  }, [onCompanyChange]);

  return (
    <select
      value={selectedCompany}
      onChange={(e) => {
        setSelectedCompany(e.target.value);
        onCompanyChange(e.target.value);
      }}
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
