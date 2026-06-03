import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { exportUserData } from '../lib/gdprUtils';
import { Download, Trash2, Lock, User, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface UserProfile {
  first_name: string;
  last_name: string;
  shop_code: string;
  created_at: string;
}

export function ProfileSecurity() {
  const navigate = useNavigate();
  const { user, signOut, resetPassword } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [shopCode, setShopCode] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, shop_code, created_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setUserProfile(data);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setShopCode(data.shop_code || 'SHP');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    const trimmedShopCode = shopCode.trim().toUpperCase();

    if (trimmedShopCode.length < 2 || trimmedShopCode.length > 4) {
      setMessage({ type: 'error', text: 'Shop code must be 2-4 characters long.' });
      return;
    }

    if (!/^[A-Z]+$/.test(trimmedShopCode)) {
      setMessage({ type: 'error', text: 'Shop code must contain only letters (A-Z).' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        shop_code: trimmedShopCode,
      })
      .eq('user_id', user.id);

    setIsSaving(false);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      await fetchUserProfile();
    }
  };

  const handleExportData = async () => {
    if (!user) return;

    setMessage({ type: 'success', text: 'Preparing your data export...' });
    const result = await exportUserData(user.id);

    if (result.success) {
      setMessage({ type: 'success', text: 'Your data has been downloaded successfully!' });
    } else {
      setMessage({ type: 'error', text: 'Failed to export data. Please try again.' });
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;

    setIsSendingReset(true);
    setMessage(null);

    const { error } = await resetPassword(user.email);

    setIsSendingReset(false);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to send password reset email. Please try again.' });
    } else {
      setMessage({ type: 'success', text: 'Password reset email sent. Please check your inbox.' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmationText !== 'DELETE') return;

    setIsDeleting(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.rpc('delete_user_account');

      if (error) {
        console.error('Error deleting account:', error);
        setMessage({ type: 'error', text: `Failed to delete account: ${error.message}` });
        setIsDeleting(false);
        return;
      }

      if (!data) {
        setMessage({ type: 'error', text: 'Failed to delete account. Please contact support.' });
        setIsDeleting(false);
        return;
      }

      await signOut();

      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ type: 'error', text: 'Failed to delete account. Please contact support.' });
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-[#E8EAE7]">Profile & Security</h1>
        <p className="mt-2 text-gray-600 dark:text-[#B7BAAE]">
          Manage your account information, data, and privacy settings
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white dark:bg-[#1B1F23] rounded-lg border border-gray-200 dark:border-[#2A3136] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <User className="w-6 h-6 text-[#6B8E65] dark:text-[#8BA888]" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7]">Account Information</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#B7BAAE] mb-1">
              Email Address
            </label>
            <p className="text-gray-900 dark:text-[#E8EAE7]">{user?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#B7BAAE] mb-1">
              Member Since
            </label>
            <p className="text-gray-900 dark:text-[#E8EAE7]">
              {userProfile?.created_at ? formatDate(userProfile.created_at) : 'Loading...'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#B7BAAE] mb-1">
                First Name
              </label>
              {isEditing ? (
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                />
              ) : (
                <p className="text-gray-900 dark:text-[#E8EAE7]">{firstName || 'Not set'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#B7BAAE] mb-1">
                Last Name
              </label>
              {isEditing ? (
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter last name"
                />
              ) : (
                <p className="text-gray-900 dark:text-[#E8EAE7]">{lastName || 'Not set'}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-[#2A3136]">
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-[#B7BAAE]">
                Shop Code
              </label>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Used in order ID format: SHOP-YYMMDD-SEQ"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Used in order numbers (e.g., {shopCode || 'XXX'}-250115-001)
            </p>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={shopCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (/^[A-Z]*$/.test(value) && value.length <= 4) {
                      setShopCode(value);
                    }
                  }}
                  maxLength={4}
                  className="w-32 uppercase font-mono"
                  placeholder="WBB"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  2-4 uppercase letters only
                </p>
              </div>
            ) : (
              <p className="text-gray-900 dark:text-[#E8EAE7] font-mono font-bold">{shopCode || 'Not set'}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {isEditing ? (
              <>
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setFirstName(userProfile?.first_name || '');
                    setLastName(userProfile?.last_name || '');
                    setShopCode(userProfile?.shop_code || 'SHP');
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1B1F23] rounded-lg border border-gray-200 dark:border-[#2A3136] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Lock className="w-6 h-6 text-[#6B8E65] dark:text-[#8BA888]" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7]">Password & Security</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-[#B7BAAE]">
            Your password is securely encrypted and managed by Supabase authentication.
            Click below to receive a password reset email.
          </p>
          <Button variant="secondary" onClick={handleChangePassword} disabled={isSendingReset}>
            {isSendingReset ? 'Sending Email...' : 'Change Password'}
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1B1F23] rounded-lg border border-gray-200 dark:border-[#2A3136] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Download className="w-6 h-6 text-[#6B8E65] dark:text-[#8BA888]" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7]">Your Data Rights</h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Download Your Data</h3>
            <p className="text-sm text-gray-600 dark:text-[#B7BAAE] mb-3">
              Export all your data including clients, sessions, measurements, and fabrics in JSON format.
              This is your right under GDPR Article 15 (Right to Access).
            </p>
            <Button variant="secondary" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Download My Data
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-[#2A3136]">
            <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-2">Data Storage Information</h3>
            <p className="text-sm text-gray-600 dark:text-[#B7BAAE]">
              Your data is currently stored in: <span className="font-medium">European Union - Stockholm, Sweden (eu-north-1)</span>
            </p>
            <p className="text-sm text-green-700 dark:text-green-400 mt-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded border border-green-200 dark:border-green-900/50">
              ✓ GDPR Compliant: Your data is stored within the EU in accordance with GDPR requirements.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1B1F23] rounded-lg border border-red-200 dark:border-red-900/50 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Delete Account</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-300">
                <p className="font-medium mb-2">Warning: This action cannot be undone!</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your account and login credentials will be permanently deleted</li>
                  <li>Your profile information (name, email) will be removed</li>
                  <li>You will be immediately logged out and cannot log back in</li>
                  <li>Business data (clients, sessions, fabrics) will be preserved for other users</li>
                </ul>
              </div>
            </div>
          </div>

          {!showDeleteConfirmation ? (
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirmation(true)}
              className="!bg-red-50 dark:!bg-red-900/20 !text-red-600 dark:!text-red-400 !border-red-200 dark:!border-red-900/50 hover:!bg-red-100 dark:hover:!bg-red-900/30"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Account
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-900 dark:text-[#E8EAE7] font-medium">
                Type <span className="font-mono bg-gray-100 dark:bg-[#2A3136] px-2 py-1 rounded">DELETE</span> to confirm:
              </p>
              <Input
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="font-mono"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
                  className="!bg-red-600 dark:!bg-red-700 !text-white hover:!bg-red-700 dark:hover:!bg-red-800"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteConfirmation(false);
                    setDeleteConfirmationText('');
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-[#1B1F23] rounded-lg border border-gray-200 dark:border-[#2A3136] p-6">
        <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7] mb-3">Privacy & Legal</h3>
        <div className="space-y-2 text-sm">
          <button
            onClick={() => navigate('/privacy-policy')}
            className="block text-[#6B8E65] dark:text-[#8BA888] hover:underline text-left"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => navigate('/terms-of-service')}
            className="block text-[#6B8E65] dark:text-[#8BA888] hover:underline text-left"
          >
            Terms of Service
          </button>
        </div>
        <p className="text-xs text-gray-600 dark:text-[#B7BAAE] mt-4">
          This application complies with GDPR (General Data Protection Regulation). You have the right to
          access, rectify, erase, restrict processing, and port your personal data.
        </p>
      </div>
    </div>
  );
}
