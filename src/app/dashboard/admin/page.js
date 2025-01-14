"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import logo from "@/assets/images/logo.png";
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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { Skeleton } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import CloseIcon from '@mui/icons-material/Close';
import { toast, Toaster } from 'react-hot-toast';
import {
  Eye, EyeOff, PhoneCall, Mail, ListTodo, BarChart3,
  Calendar, ChevronDown, ChevronUp, UserPlus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';


// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1',
      contrastText: '#fff',
    },
    secondary: {
      main: '#000000',
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '16px',
        },
        head: {
          fontWeight: 600,
          color: '#1e293b',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
  },
});

// Styled components remain the same as in your original code
const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: '6px 16px',
  fontWeight: 600,
  fontSize: '0.875rem',
  textTransform: 'none',
  border: '1.5px solid',
  boxShadow: 'none',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-1px)',
  },
}));

const SearchBox = styled(TextField)({
  width: '280px',
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#fff',
    border: '1.5px solid #fdcc00',
    overflow: 'hidden',
    transition: 'all 0.2s ease-in-out',
    '& fieldset': {
      border: 'none',
    },
    '&:hover': {
      borderColor: '#fbbf24',
    },
    '&.Mui-focused': {
      borderColor: '#f59e0b',
      boxShadow: '0 0 0 2px rgba(251, 191, 36, 0.1)',
    },
  },
});


const dateFilters = [
  { key: 'all', label: 'Alle Zeit' },
  { key: 'yesterday', label: 'Gestern' },
  { key: 'last_week', label: 'Letzte Woche' },
  { key: 'last_month', label: 'Letzter Monat' },
  { key: 'last_year', label: 'Letztes Jahr' }
];

const permissionGroups = [
  {
    title: "Analytik",
    icon: <BarChart3 className="h-5 w-5" />,
    permissions: [
      { key: 'analytics_email_api', label: 'E-Mail-Analytik' },
      { key: 'analytics_email_subkpis_api', label: 'E-Mail-Unterkennzahlen' },
      { key: 'analytics_sales_service_api', label: 'Verkaufsservice-Analytik' },
      { key: 'analytics_booking_api', label: 'Buchungs-Analytik' },
      { key: 'analytics_booking_subkpis_api', label: 'Buchungs-Unterkennzahlen' },
      { key: 'analytics_conversion_api', label: 'Konversions-Analytik' },
    ],
  },
  {
    title: "Anrufverwaltung",
    icon: <PhoneCall className="h-5 w-5" />,
    permissions: [
      { key: 'call_overview_api', label: 'Anrufübersicht' },
      { key: 'call_performance_api', label: 'Anrufleistung' },
      { key: 'call_sub_kpis_api', label: 'Anruf-Unterkennzahlen' },
    ],
  },
  {
    title: "E-Mail-Verwaltung",
    icon: <Mail className="h-5 w-5" />,
    permissions: [
      { key: 'email_overview_api', label: 'E-Mail-Übersicht' },
      { key: 'email_performance_api', label: 'E-Mail-Leistung' },
      { key: 'email_sub_kpis_api', label: 'E-Mail-Unterkennzahlen' },
    ],
  },
  {
    title: "Aufgabenverwaltung",
    icon: <ListTodo className="h-5 w-5" />,
    permissions: [
      { key: 'task_overview_api', label: 'Aufgabenübersicht' },
      { key: 'task_performance_api', label: 'Aufgabenleistung' },
      { key: 'task_sub_kpis_api', label: 'Aufgaben-Unterkennzahlen' },
    ],
  },
];

const PermissionForm = ({ open, onClose, user }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [permissions, setPermissions] = useState({
    call_overview_api: false,
    call_performance_api: false,
    call_sub_kpis_api: false,
    email_overview_api: false,
    email_performance_api: false,
    email_sub_kpis_api: false,
    task_overview_api: false,
    task_performance_api: false,
    task_sub_kpis_api: false,
    analytics_email_api: false,
    analytics_email_subkpis_api: false,
    analytics_sales_service_api: false,
    analytics_booking_api: false,
    analytics_booking_subkpis_api: false,
    analytics_conversion_api: false,
    date_filter: ''
  });

  useEffect(() => {
    if (open && user?.['user id']) {
      fetchUserPermissions();
    }
  }, [open, user]);

  const fetchUserPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const access_token = localStorage.getItem('access_token');

      const response = await fetch(`https://app.saincube.com/app2/admin/view-role-permissions`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Berechtigungen');
      }

      const data = await response.json();
      const userPermissions = data.find(p => p.user_id === user['user id']);

      if (userPermissions) {
        const { permissions: userPerms } = userPermissions;
        const formattedDateFilter = userPerms.date_filter ?
          userPerms.date_filter.split(',')
            .map(f => f.trim())
            .filter(Boolean)
            .join(', ')
          : '';

        setPermissions({
          ...userPerms,
          date_filter: formattedDateFilter
        });
      }
    } catch (err) {
      console.error('Fehler beim Abrufen der Berechtigungen:', err);
      setError('Berechtigungen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError(null);
      const access_token = localStorage.getItem('access_token');
  
      const queryParams = new URLSearchParams({
        user_id: user['user id'],
        call_overview_api: String(permissions.call_overview_api || false),
        call_performance_api: String(permissions.call_performance_api || false),
        call_sub_kpis_api: String(permissions.call_sub_kpis_api || false),
        email_overview_api: String(permissions.email_overview_api || false),
        email_performance_api: String(permissions.email_performance_api || false),
        email_sub_kpis_api: String(permissions.email_sub_kpis_api || false),
        task_overview_api: String(permissions.task_overview_api || false),
        task_performance_api: String(permissions.task_performance_api || false),
        task_sub_kpis_api: String(permissions.task_sub_kpis_api || false),
        analytics_email_api: String(permissions.analytics_email_api || false),
        analytics_email_subkpis_api: String(permissions.analytics_email_subkpis_api || false),
        analytics_sales_service_api: String(permissions.analytics_sales_service_api || false),
        analytics_booking_api: String(permissions.analytics_booking_api || false),
        analytics_booking_subkpis_api: String(permissions.analytics_booking_subkpis_api || false),
        analytics_conversion_api: String(permissions.analytics_conversion_api || false),
        date_filter: permissions.date_filter || ''
      });
  
      const response = await fetch(`https://app.saincube.com/app2/assign-permission?${queryParams.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        const errorMessage = data.detail?.[0]?.msg || data.detail || 'Fehler beim Speichern der Berechtigungen';
        throw new Error(errorMessage);
      }
  
      toast.success('Berechtigungen erfolgreich gespeichert');
      onClose();
    } catch (err) {
      console.error('Fehler beim Speichern der Berechtigungen:', err);
      const errorMessage = err.message || 'Fehler beim Speichern der Berechtigungen';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDateFilterToggle = (filterKey) => {
    setPermissions(prev => {
      const currentFilters = prev.date_filter ? prev.date_filter.split(',').map(f => f.trim()) : [];
      let newFilters = currentFilters.includes(filterKey) 
        ? currentFilters.filter(f => f !== filterKey)
        : [...currentFilters, filterKey];
      return {
        ...prev,
        date_filter: newFilters.join(',')
      };
    });
  };

  const handleGroupToggle = (group) => {
    const groupKeys = group.permissions.map(p => p.key);
    const allEnabled = groupKeys.every(key => permissions[key]);
  
    setPermissions(prev => {
      const newPermissions = { ...prev };
      groupKeys.forEach(key => {
        newPermissions[key] = !allEnabled;
      });
      return newPermissions;
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-20"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-[90vw] max-w-5xl">
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 sm:right-2 sm:-top-2 z-40 bg-[#fdcc00] hover:bg-[#eab308] rounded-full p-1 px-2 transition-all shadow-lg"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="bg-white rounded-[30px] h-[95vh] overflow-hidden sm:mx-5">
          <div className="p-4 sm:p-8 h-full flex flex-col">
          <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-[#fdcc00] mb-4"
            >
              Berechtigungen verwalten
            </motion.div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 rounded-lg mb-6 p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Benutzername:</span>
                  <span className="font-semibold">@{user?.username}</span>
                </div>
                <div className="hidden sm:block text-gray-300">|</div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">E-Mail:</span>
                  <span className="font-semibold break-all">{user?.email}</span>
                </div>
              </div>
            </motion.div>

            {loading ? (
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded-lg mb-4 w-1/3" />
                    <div className="space-y-3">
                      {[1, 2, 3].map(j => (
                        <div key={j} className="h-12 bg-gray-100 rounded-lg" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-grow overflow-y-auto pr-2 modern-scrollbar">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-xl p-6 mb-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#fdcc00]/10 text-[#fdcc00]">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        Datumsfilter
                      </h3>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
                  >
                    {dateFilters.map(filter => (
                      <label
                        key={filter.key}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <span className="text-sm font-medium text-gray-600">{filter.label}</span>
                        <input
                          type="checkbox"
                          checked={permissions.date_filter.split(',').map(f => f.trim()).includes(filter.key)}
                          onChange={() => handleDateFilterToggle(filter.key)}
                          className="h-4 w-4 text-[#fdcc00] border-gray-300 rounded focus:ring-[#fdcc00]"
                        />
                      </label>
                    ))}
                  </motion.div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {permissionGroups.map((group, idx) => (
                    <motion.div
                      key={group.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#fdcc00]/10 text-[#fdcc00]">
                            {group.icon}
                          </div>
                          <h3 className="font-semibold text-lg text-gray-800">
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
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fdcc00]"></div>
                        </label>
                      </div>

                      <div className="space-y-3">
                        {group.permissions.map(permission => (
                          <div
                            key={permission.key}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-sm text-gray-600">{permission.label}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={permissions[permission.key]}
                                onChange={() => handleToggle(permission.key)}
                              />
                              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fdcc00]"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-4">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-6 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={saving || loading}
                className={`px-6 py-2 rounded-lg bg-[#fdcc00] hover:bg-[#eab308] text-black font-medium transition-colors
                  ${(saving || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
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
              <Skeleton variant="circular" width={30} height={30} />
              <Skeleton variant="text" width={100} height={20} />
            </Box>
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={150} height={20} />
          </TableCell>
          <TableCell>
            <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: '16px' }} />
          </TableCell>
          <TableCell>
            <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: '16px' }} />
          </TableCell>
          <TableCell align="right">
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Skeleton variant="rectangular" width={70} height={20} sx={{ borderRadius: '4px' }} />
              <Skeleton variant="rectangular" width={70} height={20} sx={{ borderRadius: '4px' }} />
              <Skeleton variant="rectangular" width={70} height={30} sx={{ borderRadius: '4px' }} />
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

// Main Page Component
const Page = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [permissionPopup, setPermissionPopup] = useState(false);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const handlePermissionClick = (user) => {
    setSelectedUser(user);
    setPermissionPopup(true);
  };


  // Function to approve user
  const handleApprove = async (userId) => {
    const access_token = localStorage.getItem('access_token');

    // Set processing state for this user
    setProcessingStates(prev => ({ ...prev, [userId]: 'processing' }));

    try {
      const response = await fetch(`https://app.saincube.com/app2/admin/approve/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve user');
      }

      // Update users state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user['user id'] === userId ? { ...user, status: 'approved' } : user
        )
      );
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      // Clear processing state
      setProcessingStates(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  // Function to reject user
  const handleReject = async (userId) => {
    const access_token = localStorage.getItem('access_token');

    // Set processing state for this user
    setProcessingStates(prev => ({ ...prev, [userId]: 'processing' }));

    try {
      const response = await fetch(`https://app.saincube.com/app2/admin/reject/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject user');
      }

      // Update users state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user['user id'] === userId ? { ...user, status: 'rejected' } : user
        )
      );
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      // Clear processing state
      setProcessingStates(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };


  const fetchUsers = async () => {
    try {
      setLoading(true);
      const access_token = localStorage.getItem('access_token');
      const response = await fetch('https://app.saincube.com/app2/admin/users', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Fehler beim Laden der Benutzer');
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
    const searchMatch = searchTerm === '' ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.status.toLowerCase().includes(searchTerm.toLowerCase());

    return roleMatch && searchMatch;
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

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-white/50 text-black">
        <Toaster />
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          {/* Header with logo */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex-shrink-0">
            <img src={logo.src} alt="Dashboard Logo" className="w-auto h-8" />
            </div>
          </div>

          <Paper elevation={0} sx={{
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }} className='bg-gray-50 rounded-[50px]'>
            <Box sx={{ maxWidth: '100%', mx: 'auto', p: { xs: 3, sm: 4 } }}>
              {/* Header with controls */}
              <Box sx={{
                mb: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 3
              }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#fdcc00' }}>
                  Admin Bereich
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <StyledButton
                    variant="contained"
                    size="small"
                    startIcon={<UserPlus size={18} />}
                    sx={{
                      backgroundColor: '#fdcc00',
                      color: '#000000',
          
                    }}
                    onClick={() => setCreateUserModal(true)}
                  >
                    Benutzer erstellen
                  </StyledButton>

                  <SearchBox
                    size="small"
                    placeholder="Suche nach Benutzername, E-Mail oder Status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#94a3b8' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <FormControl size="small" sx={{
                    minWidth: 120,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      border: '1.5px solid #fdcc00',
                      '& fieldset': {
                        border: 'none',
                      },
                    },
                  }}>
                    <Select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <MenuItem value="all">Alle Rollen</MenuItem>
                      <MenuItem value="admin">Administrator</MenuItem>
                      <MenuItem value="employee">Mitarbeiter</MenuItem>
                      <MenuItem value="customer">Kunde</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Users Table */}
              <TableContainer component={Paper} elevation={0} sx={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                overflow: 'auto',
              }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Benutzername</TableCell>
                      <TableCell>E-Mail</TableCell>
                      <TableCell>Rolle</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableSkeleton />
                    ) : (
                      filteredUsers
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((user) => (
                          <TableRow key={user['user id']}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{
                                  bgcolor: '#f0f9ff',
                                  color: '#0369a1',
                                  fontWeight: 600
                                }}>
                                  {user.username[0].toUpperCase()}
                                </Avatar>
                                <Typography variant="subtitle2" sx={{
                                  fontWeight: 600,
                                  color: '#1e293b'
                                }}>
                                  @{user.username}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Chip
                                label={getRoleLabel(user.role)}
                                size="small"
                                sx={getRoleStyle(user.role)}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(user.status)}
                                size="small"
                                sx={getStatusStyle(user.status)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                <StyledButton
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleApprove(user['user id'])}
                                  sx={getApproveButtonStyle()}
                                >
                                  Genehmigen
                                </StyledButton>
                                <StyledButton
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleReject(user['user id'])}
                                  sx={getRejectButtonStyle()}
                                >
                                  Ablehnen
                                </StyledButton>
                                <StyledButton
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handlePermissionClick(user)}
                                  sx={getPermissionButtonStyle()}
                                >
                                  Berechtigungen
                                </StyledButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
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
                />
              </TableContainer>
            </Box>
          </Paper>
        </div>

        {/* Modals */}
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
      </div>
    </ThemeProvider>
  );
};

// Utility functions for styles
const getRoleLabel = (role) => ({
  admin: 'Administrator',
  employee: 'Mitarbeiter',
  customer: 'Kunde',
}[role] || role);

const getStatusLabel = (status) => ({
  active: 'Aktiv',
  pending: 'Ausstehend',
  inactive: 'Inaktiv',
}[status] || status);

const getRoleStyle = (role) => ({
  backgroundColor: role === 'admin' ? '#f8fafc' : role === 'employee' ? '#f0f9ff' : '#fff7ed',
  color: role === 'admin' ? '#1e293b' : role === 'employee' ? '#0369a1' : '#9a3412',
  borderColor: 'transparent',
  fontWeight: 500,
});

const getStatusStyle = (status) => ({
  backgroundColor: status === 'active' ? '#f0fdf4' : status === 'pending' ? '#fff7ed' : '#fef2f2',
  color: status === 'active' ? '#15803d' : status === 'pending' ? '#9a3412' : '#991b1b',
  borderColor: 'transparent',
  fontWeight: 500,
});

const getApproveButtonStyle = () => ({
  borderColor: '#22c55e',
  color: '#16a34a',
  '&:hover': {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  }
});

const getRejectButtonStyle = () => ({
  borderColor: '#f43f5e',
  color: '#e11d48',
  '&:hover': {
    borderColor: '#e11d48',
    backgroundColor: '#fef2f2',
  }
});

const getPermissionButtonStyle = () => ({
  borderColor: '#fdcc00',
  color: '#000000',
  '&:hover': {
    borderColor: '#eab308',
    backgroundColor: '#fef9c3',
  }
});

export default Page;