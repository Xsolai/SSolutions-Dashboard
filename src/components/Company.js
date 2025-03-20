import React, { useState, useEffect } from 'react';

const CompanyDropdown = ({ onCompanyChange }) => {
  const [companies, setCompanies] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAndFetchCompanies = async () => {
      try {
        const access_token = localStorage.getItem('access_token');
        // First check if user is admin using profile API
        const profileResponse = await fetch('https://solasolution.ecomtask.de/profile', {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });
        const profileData = await profileResponse.json();

        if (profileData.role === 'admin' || profileData.role === 'customer') { // changing to customers for now
          setIsAdmin(true);
          // If admin, fetch companies
          const companiesResponse = await fetch('https://solasolution.ecomtask.de/admin/companies', {
            headers: {
              'Authorization': `Bearer ${access_token}`
            }
          });
          const companiesData = await companiesResponse.json();
          setCompanies(companiesData);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    checkAdminAndFetchCompanies();
  }, []);

  // if (!isAdmin) return null;

  // if (!isAdmin) return null;

  return (
    <select
      onChange={(e) => onCompanyChange(e.target.value)}
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