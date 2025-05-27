"use client";
import React, { useState, useEffect } from 'react';
// Router removed for component
import { motion } from 'framer-motion';
import { CircularProgress } from '@mui/material';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Avatar,
  Chip,
  TablePagination,
  InputAdornment,
  Menu,
  MenuItem,
  Select,
  Skeleton,
  FormControl,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { toast, Toaster } from 'react-hot-toast';
import {
  Eye, EyeOff, PhoneCall, Mail, ListTodo, BarChart3, Phone, CheckSquare,
  Calendar, ChevronDown, ChevronUp, UserPlus, Building2, BarChart2, X
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import dashboard styles
import { dashboardStyles } from '../styles/dashboardStyles';

const schema = z.object({
  username: z.string()
    .min(3, 'Der Benutzername muss mindestens 3 Zeichen lang sein')
    .max(30, 'Der Benutzername darf nicht länger als 30 Zeichen sein')
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9_]*[a-z0-9]$/, 'Der Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten')
    .refine(val => !val.includes(' '), 'Der Benutzername darf keine Leerzeichen enthalten'),
  email: z.string()
    .email('Ungültige E-Mail-Adresse')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Das Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Das Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Das Passwort muss mindestens eine Zahl enthalten')
    .regex(/[^A-Za-z0-9]/, 'Das Passwort muss mindestens ein Sonderzeichen enthalten'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Die Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

const CreateUserForm = ({ open, onClose, onUserCreated }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await fetch('https://solasolution.ecomtask.de/admin/create_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Fehler beim Erstellen des Benutzers');
      }

      const responseData = await response.json();

      // Create a user object that matches the structure expected by the table
      const newUser = {
        'user id': responseData.user_id, // Adjust if backend provides different structure
        username: data.username,
        email: data.email,
        role: responseData.role || 'customer', // Default to customer if not provided
        status: 'approved' // Default status for newly created users
      };

      toast.success(responseData.message || 'Benutzer erfolgreich erstellt');
      onUserCreated(newUser);
      reset();
      onClose();
    } catch (error) {
      // console.error('Error creating user:', error);
      toast.error(error.message || 'Fehler beim Erstellen des Benutzers');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    reset(); // Reset form when closing
    onClose();
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-[#001E4A]/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-[90vw] max-w-2xl">
        <button
          onClick={handleClose}
          className="absolute -right-2 -top-2 sm:right-2 sm:-top-2 z-40 bg-[#F0B72F] hover:bg-[#F0B72F]/80 rounded-full p-2 transition-all shadow-lg"
        >
          <X className="w-5 h-5 text-[#001E4A]" />
        </button>

        <div className="bg-white rounded-[30px] overflow-hidden shadow-2xl border border-[#E6E2DF]">
          <div className="p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`${dashboardStyles.textSizes.pageTitle} ${dashboardStyles.fonts.black} text-[#001E4A] mb-6`}
            >
              Benutzer erstellen
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${dashboardStyles.fonts.book}`}>
              <div>
                <label className={`block ${dashboardStyles.textSizes.body} font-medium text-[#001E4A] mb-2`}>
                  Benutzername
                </label>
                <input
                  {...register('username')}
                  type="text"
                  className={`w-full px-4 py-3 border ${errors.username ? 'border-red-500' : 'border-[#E6E2DF]'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F0B72F] focus:border-[#F0B72F] ${dashboardStyles.textSizes.body} text-[#001E4A] transition-all duration-200`}
                  placeholder="maxmustermann123"
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className={`block ${dashboardStyles.textSizes.body} font-medium text-[#001E4A] mb-2`}>
                  E-Mail
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-[#E6E2DF]'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F0B72F] focus:border-[#F0B72F] ${dashboardStyles.textSizes.body} text-[#001E4A] transition-all duration-200`}
                  placeholder="max.mustermann@beispiel.de"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className={`block ${dashboardStyles.textSizes.body} font-medium text-[#001E4A] mb-2`}>
                  Passwort
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? "text" : "password"}
                    className={`w-full px-4 py-3 pr-12 border ${errors.password ? 'border-red-500' : 'border-[#E6E2DF]'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F0B72F] focus:border-[#F0B72F] ${dashboardStyles.textSizes.body} text-[#001E4A] transition-all duration-200`}
                    placeholder="********"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#001E4A]/60 hover:text-[#001E4A] transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className={`block ${dashboardStyles.textSizes.body} font-medium text-[#001E4A] mb-2`}>
                  Passwort bestätigen
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? "text" : "password"}
                    className={`w-full px-4 py-3 pr-12 border ${errors.confirmPassword ? 'border-red-500' : 'border-[#E6E2DF]'} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F0B72F] focus:border-[#F0B72F] ${dashboardStyles.textSizes.body} text-[#001E4A] transition-all duration-200`}
                    placeholder="********"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#001E4A]/60 hover:text-[#001E4A] transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="pt-6 border-t border-[#E6E2DF] flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-xl border border-[#E6E2DF] hover:bg-[#E6E2DF]/20 transition-all duration-200 disabled:opacity-50 ${dashboardStyles.textSizes.body} text-[#001E4A] ${dashboardStyles.fonts.black}`}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-xl bg-[#F0B72F] hover:bg-[#F0B72F]/80 text-[#001E4A] ${dashboardStyles.fonts.black} ${dashboardStyles.textSizes.body} transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-[#001E4A] border-t-transparent rounded-full"
                      />
                      Wird erstellt...
                    </div>
                  ) : 'Benutzer erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Theme configuration - modernized
const theme = createTheme({
  typography: {
    fontFamily: '"Nexa Book", sans-serif',
    h1: {
      fontFamily: '"Nexa Black", sans-serif',
      fontSize: '42px',
      lineHeight: '54px',
      padding: '5px 0px',
      color: '#001e4a',
    },
    h2: {
      fontFamily: '"Nexa Black", sans-serif',
      fontSize: '26px',
      lineHeight: '36px',
      color: '#001e4a',
    },
    h4: {
      fontFamily: '"Nexa Black", sans-serif',
      fontSize: '19px',
      color: '#001e4a',
    },
    body1: {
      fontSize: '17px',
      lineHeight: '27px',
      color: '#001e4a',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: '"Nexa Black", sans-serif',
          textTransform: 'none',
          borderRadius: '12px',
          padding: '12px 24px',
          fontSize: '15px',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(240, 183, 47, 0.3)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: '"Nexa Book", sans-serif',
          padding: '20px 16px',
          fontSize: '15px',
          borderBottom: '1px solid #E6E2DF',
        },
        head: {
          fontFamily: '"Nexa Black", sans-serif',
          fontWeight: 600,
          color: '#001e4a',
          backgroundColor: '#F8F9FA',
          fontSize: '16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
          boxShadow: '0 4px 20px rgba(0, 30, 74, 0.08)',
          border: '1px solid #E6E2DF',
        },
      },
    },
  },
});

// Styled components - modernized
const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  padding: '12px 24px',
  fontSize: '15px',
  fontFamily: '"Nexa Black", sans-serif',
  border: '2px solid',
  boxShadow: 'none',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
}));

const SearchBox = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    fontFamily: '"Nexa Book", sans-serif',
    borderRadius: '12px',
    backgroundColor: '#fff',
    border: `2px solid #E6E2DF`,
    transition: 'all 0.2s ease-in-out',
    '& fieldset': {
      border: 'none',
    },
    '&:hover': {
      borderColor: '#F0B72F',
      boxShadow: '0 4px 12px rgba(240, 183, 47, 0.15)',
    },
    '&.Mui-focused': {
      borderColor: '#F0B72F',
      boxShadow: '0 4px 20px rgba(240, 183, 47, 0.25)',
    },
  },
});

// Mapping of company display names to domain values expected by the backend
const COMPANY_DOMAIN_MAP = {
  '5vorflug': '5vorflug',
  'urlaubsguru': 'urlaubsguru',
  'urlaubsgurukf': 'gurukf',
  'bild': 'bild',
  'galeria': 'galeria',
  'adac': 'adac',
  'urlaub': 'urlaub'
};

const permissionGroups = [
  {
    title: 'Call Center APIs',
    icon: <Phone className="h-5 w-5" />,
    permissions: [
      { key: 'call_overview_api', label: 'Call Overview' },
      { key: 'call_performance_api', label: 'Call Performance' },
      { key: 'call_sub_kpis_api', label: 'Call Sub KPIs' }
    ]
  },
  {
    title: 'Email APIs',
    icon: <Mail className="h-5 w-5" />,
    permissions: [
      { key: 'email_overview_api', label: 'Email Overview' },
      { key: 'email_performance_api', label: 'Email Performance' },
      { key: 'email_sub_kpis_api', label: 'Email Sub KPIs' }
    ]
  },
  {
    title: 'Task APIs',
    icon: <CheckSquare className="h-5 w-5" />,
    permissions: [
      { key: 'tasks_overview_api', label: 'Task Overview' },
      { key: 'tasks_performance_api', label: 'Task Performance' },
      { key: 'tasks_kpis_api', label: 'Task Sub KPIs' }
    ]
  },
  {
    title: 'Analytics APIs',
    icon: <BarChart2 className="h-5 w-5" />,
    permissions: [
      { key: 'analytics_email_api', label: 'Email Analytics' },
      { key: 'analytics_email_subkpis_api', label: 'Email Sub KPIs Analytics' },
      { key: 'analytics_sales_service_api', label: 'Sales Service Analytics' },
      { key: 'analytics_booking_api', label: 'Booking Analytics' },
      { key: 'analytics_booking_subkpis_api', label: 'Booking Sub KPIs Analytics' },
      { key: 'analytics_conversion_api', label: 'Conversion Analytics' }
    ]
  }
];

// In FilterSection component
const FilterSection = ({ title, icon, items, type, permissions, onFilterToggle, showAll = true, maxItems = 6, loading = false }) => {
  const [showAllItems, setShowAllItems] = useState(false);
  const displayItems = showAll ? items : items.slice(0, showAllItems ? items.length : maxItems);

  // Helper function to check if item is selected
  const isItemSelected = (itemKey) => {
    if (type === 'domains') {
      const selectedDomains = permissions.domains?.toLowerCase().split(',').map(d => d.trim()).filter(Boolean) || [];
      const domainKey = COMPANY_DOMAIN_MAP[itemKey.toLowerCase()] || itemKey.toLowerCase();
      return selectedDomains.includes(domainKey);
    } else {
      const selectedItems = permissions[type]?.split(',').map(d => d.trim()).filter(Boolean) || [];
      return selectedItems.includes(itemKey);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[#E6E2DF] rounded-2xl p-6 mb-6 hover:shadow-lg hover:border-[#F0B72F] transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-[#F0B72F]/15 to-[#F0B72F]/5 text-[#001E4A] shadow-lg">
          {icon}
        </div>
        <h3 className={`${dashboardStyles.textSizes.sectionTitle} ${dashboardStyles.fonts.black} text-[#001E4A]`}>
          {title}
        </h3>
      </div>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        {displayItems.map(item => (
          <label
            key={item.key}
            className="flex items-center justify-between p-4 bg-gradient-to-br from-[#E6E2DF]/20 to-[#E6E2DF]/10 rounded-xl cursor-pointer hover:from-[#F0B72F]/10 hover:to-[#F0B72F]/5 hover:border-[#F0B72F] transition-all duration-200 border border-[#E6E2DF] group"
          >
            <span className={`${dashboardStyles.textSizes.body} text-[#001E4A] group-hover:text-[#F0B72F] transition-colors`}>
              {item.label}
            </span>
            <input
              type="checkbox"
              checked={isItemSelected(item.key)}
              onChange={() => onFilterToggle(type, item.key)}
              className="h-5 w-5 text-[#F0B72F] border-[#E6E2DF] rounded-md focus:ring-[#F0B72F] transition-all"
            />
          </label>
        ))}
      </motion.div>
      {!showAll && items.length > maxItems && (
        <button
          onClick={() => setShowAllItems(!showAllItems)}
          className={`mt-4 ${dashboardStyles.textSizes.body} ${dashboardStyles.fonts.black} text-[#001E4A] hover:text-[#F0B72F] transition-colors flex items-center gap-2`}
        >
          {showAllItems ? (
            <>Weniger anzeigen <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Mehr anzeigen <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      )}
    </motion.div>
  );
};

const PermissionFilters = ({ permissions, onPermissionChange }) => {
  const [allPermissions, setAllPermissions] = useState({
    dates: [
      { key: 'all', label: 'Alle Zeit' },
      { key: 'yesterday', label: 'Gestern' },
      { key: 'last_week', label: 'Letzte Woche' },
      { key: 'last_month', label: 'Letzter Monat' },
      { key: 'last_year', label: 'Letztes Jahr' }
    ],
    companies: []
  });
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://solasolution.ecomtask.de/admin/companies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch companies');

      const data = await response.json();
      const companyList = data.map(item => ({
        key: item.company.toLowerCase(),
        label: item.company
      }));

      setAllPermissions(prev => ({
        ...prev,
        companies: companyList
      }));
    } catch (err) {
      // console.error('Error fetching companies:', err);
      toast.error('Error loading companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // In PermissionFilters component
  const handleFilterToggle = (filterType, key) => {
    if (filterType === 'domains') {
      const currentDomains = permissions.domains?.toLowerCase().split(',').map(d => d.trim()).filter(Boolean) || [];
      const domainKey = COMPANY_DOMAIN_MAP[key.toLowerCase()] || key.toLowerCase();
      let newDomains;

      if (currentDomains.includes(domainKey)) {
        newDomains = currentDomains.filter(d => d !== domainKey);
      } else {
        newDomains = [...currentDomains, domainKey];
      }

      onPermissionChange({
        ...permissions,
        domains: newDomains.join(',')
      });
    } else {
      const currentSelections = permissions[filterType]?.split(',').map(d => d.trim()).filter(Boolean) || [];
      let newSelections;

      if (currentSelections.includes(key)) {
        newSelections = currentSelections.filter(f => f !== key);
      } else {
        newSelections = [...currentSelections, key];
      }

      onPermissionChange({
        ...permissions,
        [filterType]: newSelections.join(',')
      });
    }
  };

  return (
    <div className="space-y-6">
      <FilterSection
        title="Zeitfilter"
        icon={<Calendar />}
        items={allPermissions.dates}
        type="date_filter"
        permissions={permissions}
        onFilterToggle={handleFilterToggle}
        showAll={true}
      />
      <FilterSection
        title="Unternehmenszugang"
        icon={<Building2 />}
        items={allPermissions.companies}
        type="domains"
        permissions={permissions}
        onFilterToggle={handleFilterToggle}
        showAll={false}
        maxItems={6}
        loading={loading}
      />
    </div>
  );
};

const PermissionForm = ({ open, onClose, user }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // In the PermissionForm component, update the initial state and permission handling:
  const [permissions, setPermissions] = useState({
    date_filter: '',
    domains: '',  // Use domains consistently
    ...Object.fromEntries(
      permissionGroups.flatMap(group =>
        group.permissions.map(p => [p.key, false])
      )
    )
  });

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('https://solasolution.ecomtask.de/admin/view-role-permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) throw new Error('Fehler beim Abrufen der Berechtigungen');

      const data = await response.json();
      const userPermissions = data.find(p => p.user_id === user['user id']);

      if (userPermissions) {
        const { permissions: userPerms } = userPermissions;
        setPermissions({
          ...userPerms,
          date_filter: userPerms.date_filter || '',
          domains: userPerms.domains || ''
        });
      }
    } catch (err) {
      // console.error('Fehler beim Abrufen der Berechtigungen:', err);
      toast.error('Fehler beim Laden der Berechtigungen');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError(null);

      const queryParams = new URLSearchParams({
        user_id: user['user id'],
        ...permissions,
      });

      const response = await fetch(`https://solasolution.ecomtask.de/assign-permission?${queryParams.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Fehler beim Speichern der Berechtigungen');
      }

      toast.success('Berechtigungen erfolgreich gespeichert');
      onClose();
    } catch (err) {
      // console.error('Fehler beim Speichern der Berechtigungen:', err);
      toast.error(err.message || 'Fehler beim Speichern der Berechtigungen');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (open && user?.['user id']) {
      fetchUserPermissions();
    }
  }, [open, user]);

  const handleToggle = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleGroupToggle = (group) => {
    const allEnabled = group.permissions.every(p => permissions[p.key]);
    const newValue = !allEnabled;

    const updatedPermissions = { ...permissions };
    group.permissions.forEach(p => {
      updatedPermissions[p.key] = newValue;
    });

    setPermissions(updatedPermissions);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[#001E4A]/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-[90vw] max-w-5xl">
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 sm:right-2 sm:-top-2 z-40 bg-[#F0B72F] hover:bg-[#F0B72F]/80 rounded-full p-2 transition-all shadow-lg"
        >
          <X className="h-5 w-5 text-[#001E4A]" />
        </button>

        <div className="bg-white rounded-[30px] h-[95vh] overflow-hidden shadow-2xl border border-[#E6E2DF]">
          <div className="p-4 sm:p-8 h-full flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${dashboardStyles.textSizes.pageTitle} ${dashboardStyles.fonts.black} text-[#001E4A] mb-4`}
            >
              Berechtigungen verwalten
            </motion.div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-br from-[#E6E2DF]/10 to-[#E6E2DF]/5 rounded-xl mb-6 p-4 border border-[#E6E2DF]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className={`${dashboardStyles.textSizes.body} text-[#001E4A]/60`}>Benutzername:</span>
                  <span className={`${dashboardStyles.textSizes.body} ${dashboardStyles.fonts.black} text-[#001E4A]`}>@{user?.username}</span>
                </div>
                <div className="hidden sm:block text-[#E6E2DF]">|</div>
                <div className="flex items-center gap-2">
                  <span className={`${dashboardStyles.textSizes.body} text-[#001E4A]/60`}>E-Mail:</span>
                  <span className={`${dashboardStyles.textSizes.body} ${dashboardStyles.fonts.black} text-[#001E4A] break-all`}>{user?.email}</span>
                </div>
              </div>
            </motion.div>

            <div className="flex-grow overflow-y-auto pr-2 modern-scrollbar">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-8 bg-[#E6E2DF] rounded-lg mb-4 w-1/3" />
                      <div className="space-y-3">
                        {[1, 2, 3].map(j => (
                          <div key={j} className="h-12 bg-[#E6E2DF]/50 rounded-lg" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <PermissionFilters
                    permissions={permissions}
                    onPermissionChange={setPermissions}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                    {permissionGroups.map((group, idx) => (
                      <motion.div
                        key={group.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="border border-[#E6E2DF] rounded-2xl p-6 hover:shadow-lg hover:border-[#F0B72F] transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-[#F0B72F]/15 to-[#F0B72F]/5 text-[#001E4A] shadow-lg">
                              {group.icon}
                            </div>
                            <h3 className={`${dashboardStyles.textSizes.sectionTitle} ${dashboardStyles.fonts.black} text-[#001E4A]`}>
                              {group.title}
                            </h3>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={group.permissions.every(p => permissions[p.key])}
                              onChange={() => handleGroupToggle(group)}
                            />
                            <div className="w-11 h-6 bg-[#E6E2DF] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E6E2DF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F0B72F]"></div>
                          </label>
                        </div>

                        <div className="space-y-3">
                          {group.permissions.map(permission => (
                            <div
                              key={permission.key}
                              className="flex items-center justify-between p-3 rounded-xl border border-[#E6E2DF] hover:bg-[#E6E2DF]/10 hover:border-[#F0B72F] transition-all duration-200"
                            >
                              <span className={`${dashboardStyles.textSizes.body} text-[#001E4A]/80`}>{permission.label}</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={permissions[permission.key]}
                                  onChange={() => handleToggle(permission.key)}
                                />
                                <div className="w-11 h-6 bg-[#E6E2DF] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E6E2DF] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F0B72F]"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E6E2DF] flex justify-end gap-4">
              <button
                onClick={onClose}
                disabled={saving}
                className={`px-6 py-3 rounded-xl border border-[#E6E2DF] hover:bg-[#E6E2DF]/10 transition-all duration-200 disabled:opacity-50 ${dashboardStyles.textSizes.body} ${dashboardStyles.fonts.black} text-[#001E4A]`}
              >
                Abbrechen
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={saving || loading}
                className={`px-6 py-3 rounded-xl bg-[#F0B72F] hover:bg-[#F0B72F]/80 text-[#001E4A] ${dashboardStyles.fonts.black} ${dashboardStyles.textSizes.body} transition-all duration-200 shadow-lg hover:shadow-xl ${(saving || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    Speichern...
                  </div>
                ) : 'Änderungen speichern'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TableSkeleton = () => {
  return (
    <>
      {[1, 2, 3, 4, 5].map((row) => (
        <TableRow key={row}>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width={120} height={24} />
            </Box>
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={180} height={24} />
          </TableCell>
          <TableCell>
            <Skeleton variant="rectangular" width={90} height={28} sx={{ borderRadius: '20px' }} />
          </TableCell>
          <TableCell>
            <Skeleton variant="rectangular" width={90} height={28} sx={{ borderRadius: '20px' }} />
          </TableCell>
          <TableCell align="right">
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: '8px' }} />
              <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: '8px' }} />
              <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: '8px' }} />
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

const DeleteConfirmationDialog = ({ open, onClose, onConfirm, username }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-[#001E4A]/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-[90vw] max-w-md">
        <div className="bg-white rounded-[24px] overflow-hidden shadow-2xl border border-[#E6E2DF]">
          <div className="p-8">
            <h3 className={`${dashboardStyles.textSizes.cardTitle} ${dashboardStyles.fonts.black} text-[#001E4A] mb-4`}>
              Benutzer löschen bestätigen
            </h3>
            
            <p className={`${dashboardStyles.fonts.book} ${dashboardStyles.textSizes.body} text-[#001E4A] mb-8`}>
              Sind Sie sicher, dass Sie den Benutzer{' '}
              <span className={dashboardStyles.fonts.black}>@{username}</span>{' '}
              löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                disabled={isLoading}
                className={`px-6 py-3 rounded-xl border border-[#E6E2DF] text-[#001E4A] hover:bg-[#E6E2DF]/10 ${dashboardStyles.fonts.black} ${dashboardStyles.textSizes.body} transition-all duration-200`}
              >
                Abbrechen
              </button>

              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`px-6 py-3 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white ${dashboardStyles.fonts.black} ${dashboardStyles.textSizes.body} transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ 
                        duration: 1, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>Löschen...</span>
                  </div>
                ) : (
                  'Löschen'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionsMenu = ({ user, onApprove, onReject, onPermissions, onDelete, loadingStates }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action) => {
    handleClose();
    action();
  };

  const isApproved = user.status === 'approved';
  const isRejected = user.status === 'rejected';
  const isLoading = loadingStates.approve.has(user['user id']) || loadingStates.reject.has(user['user id']);

  return (
    <>
      <button
        onClick={handleClick}
        className={`p-2 rounded-full hover:bg-[#F0B72F]/10 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isLoading}
      >
        <MoreVertIcon className="text-[#001E4A]" />
      </button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: '16px',
            border: '1px solid #E6E2DF',
            minWidth: '200px',
            overflow: 'hidden',
            mt: 1,
            '& .MuiMenuItem-root': {
              fontFamily: '"Nexa Book", sans-serif',
              fontSize: '15px',
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: '#F0B72F/10',
              },
            },
          },
        }}
      >
        {!isApproved && (
          <MenuItem 
            onClick={() => handleAction(() => onApprove(user['user id']))}
            sx={{ color: 'success.main' }}
          >
            {loadingStates.approve.has(user['user id']) ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-emerald-700 border-t-transparent rounded-full mr-2"
              />
            ) : null}
            Genehmigen
          </MenuItem>
        )}
        {!isRejected && (
          <MenuItem 
            onClick={() => handleAction(() => onReject(user['user id']))}
            sx={{ color: '#F0B72F' }}
          >
            {loadingStates.reject.has(user['user id']) ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-[#F0B72F] border-t-transparent rounded-full mr-2"
              />
            ) : null}
            Ablehnen
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => handleAction(() => onPermissions(user))}
          sx={{ color: '#001E4A' }}
        >
          Berechtigungen
        </MenuItem>
        <MenuItem 
          onClick={() => handleAction(() => onDelete({
            open: true,
            userId: user['user id'],
            username: user.username
          }))}
          sx={{ color: 'error.main' }}
        >
          Löschen
        </MenuItem>
      </Menu>
    </>
  );
};

const AdminDashboard = () => {
  // Router removed
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [permissionPopup, setPermissionPopup] = useState(false);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, userId: null, username: '' });
  // Add new state for tracking loading states per user
  const [loadingStates, setLoadingStates] = useState({
    approve: new Set(),
    reject: new Set()
  });

  const handleApprove = async (userId) => {
    const access_token = localStorage.getItem('access_token');

    // Set loading state for this specific user's approve action
    setLoadingStates(prev => ({
      ...prev,
      approve: new Set([...prev.approve, userId])
    }));

    try {
      const response = await fetch(`https://solasolution.ecomtask.de/admin/approve/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to approve user');
      }

      // Optimistically update the UI
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user['user id'] === userId 
            ? { 
                ...user, 
                status: 'approved',
              } 
            : user
        )
      );
      
      toast.success('Benutzer erfolgreich genehmigt', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      // console.error('Error approving user:', error);
      toast.error(error.message || 'Fehler bei der Genehmigung des Benutzers');
      
      // Revert the optimistic update on error
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user['user id'] === userId 
            ? { 
                ...user, 
                status: 'pending' // or whatever the previous status was
              } 
            : user
        )
      );
    } finally {
      // Remove loading state
      setLoadingStates(prev => ({
        ...prev,
        approve: new Set([...prev.approve].filter(id => id !== userId))
      }));
    }
  };

  const handleReject = async (userId) => {
    const access_token = localStorage.getItem('access_token');

    // Set loading state for this specific user's reject action
    setLoadingStates(prev => ({
      ...prev,
      reject: new Set([...prev.reject, userId])
    }));

    try {
      const response = await fetch(`https://solasolution.ecomtask.de/admin/reject/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reject user');
      }

      // Optimistically update the UI
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user['user id'] === userId 
            ? { 
                ...user, 
                status: 'rejected'
              } 
            : user
        )
      );
      
      toast.success('Benutzer erfolgreich abgelehnt', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error) {
      // console.error('Error rejecting user:', error);
      toast.error(error.message || 'Fehler bei der Ablehnung des Benutzers');
      
      // Revert the optimistic update on error
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user['user id'] === userId 
            ? { 
                ...user, 
                status: 'pending' // or whatever the previous status was
              } 
            : user
        )
      );
    } finally {
      // Remove loading state
      setLoadingStates(prev => ({
        ...prev,
        reject: new Set([...prev.reject].filter(id => id !== userId))
      }));
    }
  };

  // Updated delete handler to match POST endpoint
  const handleDeleteUser = async (userId) => {
    const access_token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`https://solasolution.ecomtask.de/admin/delete_user/${userId}`, {
        method: 'POST', // Changed from DELETE to POST
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Fehler beim Löschen des Benutzers');
      }

      // Update users state to remove the deleted user
      setUsers(prevUsers => prevUsers.filter(user => user['user id'] !== userId));
      toast.success('Benutzer erfolgreich gelöscht');
      setDeleteConfirmation({ open: false, userId: null, username: '' });
    } catch (error) {
      // console.error('Error deleting user:', error);
      toast.error(error.message || 'Fehler beim Löschen des Benutzers');
    }
  };

  const handlePermissionClick = (user) => {
    setSelectedUser(user);
    setPermissionPopup(true);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const access_token = localStorage.getItem('access_token');
      const response = await fetch('https://solasolution.ecomtask.de/admin/users', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch users');
      }

      const usersData = await response.json();
      // console.log('📊 Geladene Benutzer-Daten:', usersData);
      // console.log('📊 Status-Verteilung:', usersData.reduce((acc, user) => {
      //   acc[user.status] = (acc[user.status] || 0) + 1;
      //   return acc;
      // }, {}));
      setUsers(usersData);
    } catch (error) {
      // console.error('Error fetching users:', error);
      toast.error(error.message || 'Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserCreated = (newUser) => {
    setUsers(prevUsers => [...prevUsers, newUser]);
  };

  const filteredUsers = users.filter(user => {
    const roleMatch = roleFilter === 'all' || user.role === roleFilter;
    const statusMatch = statusFilter === 'all' || user.status === statusFilter;
    const searchMatch = searchTerm === '' ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.status.toLowerCase().includes(searchTerm.toLowerCase());

    return roleMatch && statusMatch && searchMatch;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRoleChange = (event) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };

  const handleStatusChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  return (
    <div className="bg-[#E6E2DF]/10 rounded-[50px]">
      <ThemeProvider theme={theme}>
        <Toaster />
        <div className="max-w-full mx-auto p-4 sm:p-6">
          
          <Paper elevation={0} className="rounded-[24px] bg-white/80 backdrop-blur-sm border border-[#E6E2DF]">
            <Box sx={{ maxWidth: '100%', mx: 'auto', p: { xs: 3, sm: 4 } }}>
              {/* Header with controls */}
              <Box sx={{
                mb: 6,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', md: 'center' },
                gap: 3
              }}>
                <div className="w-full md:w-auto">
                  <h1 className={`text-[38px] font-black text-[#001E4A] leading-tight`}>
                    Admin Bereich
                  </h1>
                </div>
  
                <Box sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap'
                }}>
                  <SearchBox
                    size="small"
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon className="text-[#001E4A]" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ minWidth: '200px' }}
                  />
  
                  <button
                    onClick={() => setCreateUserModal(true)}
                    className="px-4 py-2 text-[15px] font-black text-[#001E4A] bg-[#F0B72F] hover:bg-[#F0B72F]/80 rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
                  >
                    <UserPlus size={18} />
                    Benutzer erstellen
                  </button>
  
                  <FormControl className="min-w-[160px]">
                    <Select
                      value={roleFilter}
                      onChange={handleRoleChange}
                      displayEmpty
                      className={`h-[48px] rounded-xl bg-white ${dashboardStyles.fonts.book} transition-all`}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        }
                      }}
                    >
                      <MenuItem value="all">Alle Rollen</MenuItem>
                      <MenuItem value="admin">Administrator</MenuItem>
                      <MenuItem value="employee">Mitarbeiter</MenuItem>
                      <MenuItem value="customer">Kunde</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl className="min-w-[160px]">
                    <Select
                      value={statusFilter}
                      onChange={handleStatusChange}
                      displayEmpty
                      className={`h-[48px] rounded-xl bg-white ${dashboardStyles.fonts.book} transition-all`}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: 'none'
                        }
                      }}
                    >
                      <MenuItem value="all">Alle Status</MenuItem>
                      <MenuItem value="approved">Genehmigt</MenuItem>
                      <MenuItem value="pending">Ausstehend</MenuItem>
                      <MenuItem value="rejected">Abgelehnt</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
  
              {/* Users Table */}
              <TableContainer component={Paper} elevation={0} className="rounded-2xl border border-[#E6E2DF] overflow-hidden">
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell className={`${dashboardStyles.fonts.black} ${dashboardStyles.textSizes.body}`}>Benutzername</TableCell>
                      <TableCell className={`${dashboardStyles.fonts.black} ${dashboardStyles.textSizes.body}`}>E-Mail</TableCell>
                      <TableCell className={`${dashboardStyles.fonts.black} ${dashboardStyles.textSizes.body}`}>Rolle</TableCell>
                      <TableCell className={`${dashboardStyles.fonts.black} ${dashboardStyles.textSizes.body}`}>Status</TableCell>
                      <TableCell align="right" className={`${dashboardStyles.fonts.black} ${dashboardStyles.textSizes.body}`}>Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableSkeleton />
                    ) : (
                      filteredUsers
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((user) => {
                          // Smart button logic based on status
                          const isApproved = user.status === 'approved';
                          const isRejected = user.status === 'rejected';
                          const isPending = user.status === 'pending';
                          
                          return (
                            <TableRow key={user['user id']} className="hover:bg-[#F0B72F]/5 transition-colors">
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar className="bg-gradient-to-br from-[#F0B72F] to-[#F0B72F]/80 text-[#001E4A] font-bold shadow-lg">
                                    {user.username[0].toUpperCase()}
                                  </Avatar>
                                  <Typography className={`${dashboardStyles.fonts.black} ${dashboardStyles.textSizes.body} text-[#001E4A]`}>
                                    @{user.username}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell className={`${dashboardStyles.fonts.book} ${dashboardStyles.textSizes.body}`}>{user.email}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${dashboardStyles.fonts.black} ${
                                  user.role === 'admin' 
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                    : user.role === 'employee'
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                  {getRoleLabel(user.role)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${dashboardStyles.fonts.black} ${
                                  user.status === 'approved' 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : user.status === 'pending'
                                    ? 'bg-[#F0B72F]/20 text-[#B8860B] border border-[#F0B72F]/30'
                                    : user.status === 'rejected'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                  {getStatusLabel(user.status)}
                                </span>
                              </TableCell>
                              <TableCell align="right">
                                <ActionsMenu
                                  user={user}
                                  onApprove={handleApprove}
                                  onReject={handleReject}
                                  onPermissions={handlePermissionClick}
                                  onDelete={setDeleteConfirmation}
                                  loadingStates={loadingStates}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={filteredUsers.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Zeilen pro Seite:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} von ${count}`}
                  className={`${dashboardStyles.fonts.book} border-t border-[#E6E2DF]`}
                />
              </TableContainer>
            </Box>
          </Paper>
        </div>
  
        {/* Modals */}
        <DeleteConfirmationDialog
          open={deleteConfirmation.open}
          onClose={() => setDeleteConfirmation({ open: false, userId: null, username: '' })}
          onConfirm={() => handleDeleteUser(deleteConfirmation.userId)}
          username={deleteConfirmation.username}
        />
        <CreateUserForm
          open={createUserModal}
          onClose={() => setCreateUserModal(false)}
          onUserCreated={handleUserCreated}
        />
        <PermissionForm
          open={permissionPopup}
          onClose={() => setPermissionPopup(false)}
          user={selectedUser}
        />
      </ThemeProvider>
    </div>
  );
};

// Utility functions for styles
const getRoleLabel = (role) => ({
  admin: 'Administrator',
  employee: 'Mitarbeiter',
  customer: 'Kunde',
}[role] || role);

const getStatusLabel = (status) => ({
  approved: 'Genehmigt',
  pending: 'Ausstehend', 
  rejected: 'Abgelehnt',
  active: 'Aktiv',
  inactive: 'Inaktiv',
}[status] || status);

export default AdminDashboard;