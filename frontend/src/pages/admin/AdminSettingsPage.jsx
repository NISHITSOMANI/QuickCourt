import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import {
  Cog6ToothIcon,
  UserGroupIcon,
  ServerIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UnauthorizedPage from '../UnauthorizedPage';
import { adminApi } from '../../api/dashboardApi';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AdminSettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'QuickCourt',
    siteDescription: 'Book sports facilities easily',
    maintenanceMode: false,
    enableRegistration: true,
    contactEmail: 'support@quickcourt.com',
    itemsPerPage: 10
  });

  // User Management
  const [userSettings, setUserSettings] = useState({
    requireEmailVerification: true,
    allowProfileUpdates: true,
    defaultUserRole: 'user',
    maxLoginAttempts: 5,
    accountLockoutTime: 30 // minutes
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    cacheEnabled: true,
    cacheTtl: 3600, // seconds
    logLevel: 'info',
    backupEnabled: true,
    backupFrequency: 'daily',
    lastBackup: null
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireStrongPassword: true,
    enable2FA: false,
    sessionTimeout: 30, // minutes
    enableCors: true,
    allowedOrigins: ['https://quickcourt.com']
  });

  // Check if user is admin
  useEffect(() => {
    const checkAccess = () => {
      if (!user) {
        navigate('/login', { state: { from: '/admin/settings' } });
        return;
      }
      
      if (user.role !== 'admin') {
        toast.error('You do not have permission to access this page');
        navigate(user.role === 'owner' ? '/owner' : '/', { replace: true });
        return;
      }
      
      setIsLoading(false);
    };

    checkAccess();
  }, [user, navigate]);

  // Redirect to login if not authenticated
  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Show unauthorized if not admin
  if (user.role !== 'admin') {
    return <UnauthorizedPage />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleGeneralSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUserSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSystemSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSecuritySettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async (settingsType, settingsData) => {
    try {
      setIsSaving(true);
      setError(null);

      // In a real app, we would save these settings to the API
      // await adminApi.updateSettings(settingsType, settingsData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success(`${settingsType} settings saved successfully`);
      return true;
    } catch (err) {
      console.error(`Error saving ${settingsType} settings:`, err);
      const errorMsg = err.response?.data?.message || `Failed to save ${settingsType} settings`;
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneralSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      // Basic validation
      if (!generalSettings.siteName.trim()) {
        throw new Error('Site name is required');
      }

      // Simulate API call with timeout
      const response = await Promise.race([
        // In a real app, you would call your API here
        // adminApi.updateGeneralSettings(generalSettings),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timed out')), 10000)
        )
      ]);
      
      // Handle successful save
      toast.success('Settings saved successfully');
      
      // In a real app, you might update the local state with the response
      // setGeneralSettings(response.data);
      
    } catch (err) {
      console.error('Error saving settings:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save settings';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUserSettings = async (e) => {
    e.preventDefault();
    const success = await handleSaveSettings('User', userSettings);
    if (success) {
      // Update UI or show success message
    }
  };

  const handleSaveSystemSettings = async (e) => {
    e.preventDefault();
    const success = await handleSaveSettings('System', systemSettings);
    if (success) {
      // Update UI or show success message
    }
  };

  const handleSaveSecuritySettings = async (e) => {
    e.preventDefault();
    const success = await handleSaveSettings('Security', securitySettings);
    if (success) {
      // Update UI or show success message
    }
  };

  const handleRunBackup = async () => {
    try {
      setIsSaving(true);
      // In a real app, we would call the backup API
      // await adminApi.runBackup();

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Backup completed successfully');
      // Update last backup time
      setSystemSettings(prev => ({
        ...prev,
        lastBackup: new Date().toISOString()
      }));
    } catch (err) {
      console.error('Error running backup:', err);
      toast.error('Failed to run backup');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 mx-auto text-indigo-600 animate-spin" />
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md max-w-4xl mx-auto mt-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading settings</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage application settings and configurations
          </p>
        </div>

        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            {['General', 'Users', 'System', 'Security'].map((category) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white shadow'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  )
                }
              >
                {category}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-6">
            {/* General Settings Tab */}
            <Tab.Panel className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSaveGeneralSettings} className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">General Settings</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure general application settings
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error saving settings</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                        Site Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="siteName"
                          id="siteName"
                          value={generalSettings.siteName}
                          onChange={handleGeneralSettingsChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          disabled={isSaving}
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700">
                        Site Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="siteDescription"
                          name="siteDescription"
                          rows={3}
                          value={generalSettings.siteDescription}
                          onChange={handleGeneralSettingsChange}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isSaving
                          ? 'bg-indigo-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                      }`}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </Tab.Panel>

            {/* Users Tab */}
            <Tab.Panel className="bg-white rounded-lg shadow p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">User Management</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure user registration and permissions
                  </p>
                </div>
                <div className="text-center py-12">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">User Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">User management settings will appear here</p>
                </div>
              </div>
            </Tab.Panel>

            {/* System Tab */}
            <Tab.Panel className="bg-white rounded-lg shadow p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">System Configuration</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    System settings and maintenance
                  </p>
                </div>
                <div className="text-center py-12">
                  <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">System Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">System configuration options will appear here</p>
                </div>
              </div>
            </Tab.Panel>

            {/* Security Tab */}
            <Tab.Panel className="bg-white rounded-lg shadow p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Configure security and access control
                  </p>
                </div>
                <div className="text-center py-12">
                  <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Security Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">Security configuration options will appear here</p>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
