import React from 'react';
import { UserCircle } from 'lucide-react';

const UserAvatar = ({ email }) => {
  const getCompanyLogo = (email) => {
    if (!email) return null;
    
    const domain = email.split('@')[1]?.toLowerCase();
    
    // Prüfe, ob die Domain einen der Strings enthält
    if (domain?.includes('5vorflug')) return '/logo/5vF.png';
    if (domain?.includes('adacreisen')) return '/logo/ADAC.png';
    if (domain?.includes('urlaubsguru')) return '/logo/guru.png';
    if (domain?.includes('ai-mitarbeiter')) return '/logo/EcomTask.png';
    if (domain?.includes('solasolution.de')) return '/logo/solasolution.png';
    
    return null;
  };

  const logo = getCompanyLogo(email);

  if (!logo) {
    return (
      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
        <UserCircle className="w-8 h-8 text-[#1e3a6f]" />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden">
      <img 
        src={logo} 
        alt="Company Logo" 
        className="w-8 h-8 object-contain"
      />
    </div>
  );
};

export default UserAvatar; 