import React, { useState, useEffect } from 'react';

const CompanyDropdown = ({ onCompanyChange }) => {
  const [companies, setCompanies] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAndFetchCompanies = async () => {
      try {
        const access_token = localStorage.getItem('access_token');
        // First check if user is admin using profile API
        const profileResponse = await fetch('https://app.saincube.com/app2/profile', {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });
        const profileData = await profileResponse.json();

        if (profileData.role === 'admin') {
          setIsAdmin(true);
          // If admin, fetch companies
          const companiesResponse = await fetch('https://app.saincube.com/app2/admin/companies', {
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

  if (!isAdmin) return null;

  return (
    <select
      onChange={(e) => onCompanyChange(e.target.value)}
      className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white hover:border-yellow-400 focus:outline-none focus:border-yellow-400 transition-colors"
    >
      <option value="">Keine Filter</option>
      {companies.map((company, index) => (
        <option key={index} value={company.company}>
          {company.company}
        </option>
      ))}
    </select>
  );
};

export default CompanyDropdown;