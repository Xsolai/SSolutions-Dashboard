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
import {
  PhoneCall, Mail, ListTodo, BarChart3,
  Calendar, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';  // Add this import


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
  '& .MuiInputBase-input': {
    padding: '10px 2px',
  },
});

const getRoleColors = (role) => {
  const roleColors = {
    admin: { bg: '#f8fafc', text: '#1e293b' },
    customer: { bg: '#fff7ed', text: '#9a3412' },
    employee: { bg: '#f0f9ff', text: '#0369a1' },
  };
  return roleColors[role] || { bg: '#f1f5f9', text: '#64748b' };
};


const getStatusColors = (status) => {
  const statusColors = {
    active: { bg: '#f0fdf4', text: '#15803d' },
    pending: { bg: '#fff7ed', text: '#9a3412' },
    inactive: { bg: '#fef2f2', text: '#991b1b' },
  };
  return statusColors[status] || { bg: '#f1f5f9', text: '#64748b' };
};


const AnimatedText = () => {
  const titleLines = ["Admin", "Panel"];
  return (
    <div className="inline-flex">
      {titleLines.map((line, lineIndex) => (
        <motion.div
          key={lineIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1,
            staggerChildren: 0.1,
          }}
          className="text-2xl sm:text-4xl md:text-4xl px-1 sm:px-1.5 lg:text-5xl font-bold text-[#fdcc00] flex"
        >
          {line.split("").map((letter, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1 + lineIndex * 0.5,
              }}
              className="block"
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

const PermissionForm = ({ open, onClose, user }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const dateFilters = [
    { key: 'all', label: 'All Time' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'last_week', label: 'Last Week' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'last_year', label: 'Last Year' }
  ];

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
    analytics_booking_subkpis_api: false, // Fixed name to match API
    analytics_conversion_api: false,
    date_filter: ''
  });
  
  // Update permission groups to match the exact API naming
  const permissionGroups = [
    {
      title: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      permissions: [
        { key: 'analytics_email_api', label: 'Email Analytics' },
        { key: 'analytics_email_subkpis_api', label: 'Email Sub KPIs Analytics' },
        { key: 'analytics_sales_service_api', label: 'Sales Service Analytics' },
        { key: 'analytics_booking_api', label: 'Booking Analytics' },
        { key: 'analytics_booking_subkpis_api', label: 'Booking Sub KPIs Analytics' }, // Fixed name
        { key: 'analytics_conversion_api', label: 'Conversion Analytics' },
      ],
    },
    {
      title: "Call Management",
      icon: <PhoneCall className="h-5 w-5" />,
      permissions: [
        { key: 'call_overview_api', label: 'Call Overview' },
        { key: 'call_performance_api', label: 'Call Performance' },
        { key: 'call_sub_kpis_api', label: 'Call Sub KPIs' },
      ],
    },
    {
      title: "Email Management",
      icon: <Mail className="h-5 w-5" />,
      permissions: [
        { key: 'email_overview_api', label: 'Email Overview' },
        { key: 'email_performance_api', label: 'Email Performance' },
        { key: 'email_sub_kpis_api', label: 'Email Sub KPIs' },
      ],
    },
    {
      title: "Task Management",
      icon: <ListTodo className="h-5 w-5" />,
      permissions: [
        { key: 'task_overview_api', label: 'Task Overview' },
        { key: 'task_performance_api', label: 'Task Performance' },
        { key: 'task_sub_kpis_api', label: 'Task Sub KPIs' },
      ],
    },
  ];

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
        throw new Error('Failed to fetch permissions');
      }

      const data = await response.json();
      const userPermissions = data.find(p => p.user_id === user['user id']);

      if (userPermissions) {
        const { permissions: userPerms } = userPermissions;

        // Ensure date_filter string is properly formatted with spaces
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
      console.error('Error fetching permissions:', err);
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError(null);
      const access_token = localStorage.getItem('access_token');
  
      // Convert boolean values to strings and use correct naming
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
        analytics_booking_subkpis_api: String(permissions.analytics_booking_subkpis_api || false), // Fixed name
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
        const errorMessage = data.detail?.[0]?.msg || data.detail || 'Failed to save permissions';
        throw new Error(errorMessage);
      }
  
      toast.success('Permissions saved successfully');
      onClose();
    } catch (err) {
      console.error('Error saving permissions:', err);
      const errorMessage = err.message || 'Failed to save permissions';
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
      // Split and trim each filter
      const currentFilters = prev.date_filter ? prev.date_filter.split(',').map(f => f.trim()) : [];
      let newFilters;
  
      if (currentFilters.includes(filterKey)) {
        // Remove the filter
        newFilters = currentFilters.filter(f => f !== filterKey);
      } else {
        // Add the filter
        newFilters = [...currentFilters, filterKey];
      }
  
      // Join with commas, no spaces for API compatibility
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
              Manage Permissions
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
                  <span className="text-gray-500">Username:</span>
                  <span className="font-semibold">@{user?.username}</span>
                </div>
                <div className="hidden sm:block text-gray-300">|</div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Email:</span>
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
                        Date Filters
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
                Cancel
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
                    Saving...
                  </div>
                ) : 'Save Changes'}
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

const Page = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [permissionPopup, setPermissionPopup] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [processingStates, setProcessingStates] = useState({});


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



  // Fetch all users and update status concurrently using Promise.all
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const access_token = localStorage.getItem('access_token');

        // Fetching users concurrently using Promise.all
        const [usersResponse] = await Promise.all([
          fetch('https://app.saincube.com/app2/admin/users', {
            headers: {
              'Authorization': `Bearer ${access_token}`,
            },
          }),
        ]);

        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users');
        }

        const usersData = await usersResponse.json();
        setUsers(usersData);

      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

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
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-shrink-0">
              <img
                src={logo.src}
                alt="Dashboard Logo"
                className="w-auto h-8"
              />
            </div>
          </div>
          <Paper
            elevation={0}
            sx={{
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            className='bg-gray-50 rounded-[50px]'
          >
            <Box sx={{ maxWidth: '100%', mx: 'auto', p: { xs: 3, sm: 4 } }}>
              <Box sx={{
                mb: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 3
              }}>
                <AnimatedText />
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <SearchBox
                    size="small"
                    placeholder="Search by username, email or status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#94a3b8' }} />
                        </InputAdornment>
                      ),
                      style: {
                        fontSize: '0.875rem' // This makes the placeholder text smaller
                      }
                    }}
                    sx={{
                      '& .MuiInputBase-input::placeholder': {
                        fontSize: '0.78rem', // This ensures placeholder is also smaller
                      }
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
                      label="Role"
                      onChange={handleRoleChange}
                    >
                      <MenuItem value="all">All Roles</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                      <MenuItem value="employee">Employee</MenuItem>
                      <MenuItem value="customer">Customer</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    height: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f1f5f9',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#cbd5e1',
                    },
                  },
                }}
                className='md:mt-10'
              >
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableSkeleton />
                    ) : (
                      filteredUsers
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((user) => {
                          const roleColor = getRoleColors(user.role);
                          const statusColor = getStatusColors(user.status);
                          return (
                            <TableRow key={user['user id']}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{
                                    bgcolor: roleColor.bg,
                                    color: roleColor.text,
                                    border: `2px solid ${roleColor.border}`,
                                    fontWeight: 600,
                                    width: 40,
                                    height: 40
                                  }}>
                                    {user.username[0].toUpperCase()}
                                  </Avatar>
                                  <Typography variant="subtitle2" sx={{
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    fontSize: '0.95rem'
                                  }}>
                                    @{user.username}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ color: '#475569' }}>{user.email}</TableCell>
                              <TableCell>
                                <Chip
                                  label={user.role}
                                  size="small"
                                  sx={{
                                    backgroundColor: roleColor.bg,
                                    color: roleColor.text,
                                    border: `1px solid ${roleColor.border}`,
                                    fontWeight: 500,
                                    padding: '4px 0',
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                {processingStates[user['user id']] === 'processing' ? (
                                  <Chip
                                    label={
                                      <div className="flex items-center gap-2">
                                        <motion.div
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                          className="w-4 h-4 border-2 border-[#fdcc00] border-t-transparent rounded-full"
                                        />
                                        Processing...
                                      </div>
                                    }
                                    size="small"
                                    sx={{
                                      backgroundColor: '#fef9c3',
                                      color: '#854d0e',
                                      border: '1px solid #fcd34d',
                                      fontWeight: 500,
                                      padding: '4px 0',
                                      '& .MuiChip-label': {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                      }
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    label={user.status}
                                    size="small"
                                    sx={{
                                      backgroundColor: statusColor.bg,
                                      color: statusColor.text,
                                      border: `1px solid ${statusColor.border}`,
                                      fontWeight: 500,
                                      padding: '4px 0',
                                    }}
                                  />
                                )}
                              </TableCell>

                              <TableCell align="right">
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                  <StyledButton
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                      borderColor: '#22c55e',
                                      color: '#16a34a',
                                      '&:hover': {
                                        borderColor: '#16a34a',
                                        backgroundColor: '#f0fdf4',
                                      }
                                    }}
                                    onClick={() => handleApprove(user['user id'])}
                                  >
                                    Approve
                                  </StyledButton>
                                  <StyledButton
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                      borderColor: '#f43f5e',
                                      color: '#e11d48',
                                      '&:hover': {
                                        borderColor: '#e11d48',
                                        backgroundColor: '#fef2f2',
                                      }
                                    }}
                                    onClick={() => handleReject(user['user id'])}
                                  >
                                    Reject
                                  </StyledButton>
                                  <StyledButton
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                      borderColor: '#fdcc00',
                                      color: '#000000',
                                      '&:hover': {
                                        borderColor: '#eab308',
                                        backgroundColor: '#fef9c3',
                                      }
                                    }}
                                    onClick={() => handlePermissionClick(user)}
                                  >
                                    Permissions
                                  </StyledButton>
                                </Box>
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
                  sx={{
                    borderTop: '1px solid #e2e8f0',
                    '.MuiTablePagination-select': {
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      '&:hover': {
                        borderColor: '#6366f1',
                      }
                    }
                  }}
                />
              </TableContainer>
            </Box>
          </Paper>
        </div>
      </div>
      <PermissionForm
        open={permissionPopup}
        onClose={() => setPermissionPopup(false)}
        user={selectedUser}
      />
    </ThemeProvider>
  );
};

export default Page;