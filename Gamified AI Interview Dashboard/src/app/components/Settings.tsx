"use client";

import { useState, useEffect } from 'react';
import { User, Lock, Sliders, Bell, AlertTriangle, Save, Eye, EyeOff, Moon, Sun, Keyboard, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { usePreferences, ThemeOption, KeybindingOption, FontSizeOption } from '../../context/PreferencesContext';

type TabId = 'account' | 'security' | 'preferences' | 'notifications';

export const Settings = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('account');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Account form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [title, setTitle] = useState(user?.title || '');
  const [profileSummary, setProfileSummary] = useState(user?.profile_summary || '');
  const [visibility, setVisibility] = useState('public');
  const [githubUrl, setGithubUrl] = useState(user?.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio_url || '');

  // Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactor, setTwoFactor] = useState(false);

  // Preferences form state is backed by preferences context
  const { theme, setTheme, keybinding, setKeybinding, fontSize, setFontSize } = usePreferences();

  // Notifications form state
  const [notifications, setNotifications] = useState({
    weeklyProgress: localStorage.getItem('notif_weeklyProgress') ? JSON.parse(localStorage.getItem('notif_weeklyProgress') || 'true') : true,
    newQuestions: localStorage.getItem('notif_newQuestions') ? JSON.parse(localStorage.getItem('notif_newQuestions') || 'true') : true,
    achievements: localStorage.getItem('notif_achievements') ? JSON.parse(localStorage.getItem('notif_achievements') || 'true') : true,
  });


  // Update user data when auth user changes
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setTitle(user.title || '');
      setProfileSummary(user.profile_summary || '');
      setGithubUrl(user.github_url || '');
      setLinkedinUrl(user.linkedin_url || '');
      setPortfolioUrl(user.portfolio_url || '');
    }
  }, [user]);

  // Track changes
  const handleAccountChange = () => {
    setHasChanges(true);
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    const newValue = !notifications[key];
    setNotifications(prev => ({ ...prev, [key]: newValue }));
    localStorage.setItem(`notif_${key}`, JSON.stringify(newValue));
    setHasChanges(true);
  };

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
    toast.success(`Theme set to ${newTheme}`);
  };

  const handleEditorSettingChange = (
    type: 'keybinding' | 'fontSize',
    value: string
  ) => {
    if (type === 'keybinding') {
      setKeybinding(value as KeybindingOption);
      toast.success(`Keybindings switched to ${value}`);
    } else {
      setFontSize(value as FontSizeOption);
      toast.success(`Editor font size set to ${value}px`);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      // Only update profile if on account tab
      if (activeTab === 'account') {
        const hasProfileChanges = fullName !== user?.full_name || 
                                  title !== (user?.title || '') ||
                                  profileSummary !== (user?.profile_summary || '') ||
                                  githubUrl !== (user?.github_url || '') ||
                                  linkedinUrl !== (user?.linkedin_url || '') ||
                                  portfolioUrl !== (user?.portfolio_url || '');
        
        if (hasProfileChanges) {
          await updateProfile(fullName, undefined, {
            github: githubUrl,
            linkedin: linkedinUrl,
            portfolio: portfolioUrl,
          }, title, profileSummary);
          toast.success('Profile updated successfully!');
        }
      }

      // Only change password if on security tab
      if (activeTab === 'security' && currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          toast.error('Passwords do not match');
          setIsSaving(false);
          return;
        }
        if (newPassword.length < 8) {
          toast.error('Password must be at least 8 characters long');
          setIsSaving(false);
          return;
        }
        await changePassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast.success('Password changed successfully!');
      }

      setHasChanges(false);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to save changes';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account Info', icon: User },
    { id: 'security', label: 'Security & Privacy', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8 h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">Settings</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Manage your profile, security, and preferences.</p>
        </div>
        <button 
          onClick={handleSaveChanges}
          disabled={!hasChanges || isSaving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-[var(--color-border)] disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-900/20"
        >
          {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`w-full group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all border backdrop-blur-md overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 text-white border-indigo-400/60 shadow-lg shadow-indigo-900/50 ring-1 ring-indigo-400/30'
                      : 'text-[var(--color-muted-foreground)] bg-gradient-to-br from-white/8 via-indigo-500/15 to-indigo-500/8 border-indigo-400/25 shadow-sm shadow-indigo-900/20 hover:bg-gradient-to-br hover:from-white/12 hover:via-indigo-500/20 hover:to-indigo-500/12 hover:border-indigo-400/45 hover:shadow-md hover:shadow-indigo-900/30 hover:ring-1 hover:ring-indigo-400/25 ring-1 ring-white/5'
                  }`}
                  style={{
                    backgroundImage: !isActive ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(99,102,241,0.08) 50%, rgba(99,102,241,0.03) 100%)' : undefined
                  }}
                >
                  <Icon className={`w-4 h-4 transition-all ${
                    isActive ? 'text-white drop-shadow-lg' : 'text-[var(--color-sidebar-accent)] group-hover:text-indigo-300 group-hover:drop-shadow-lg group-hover:scale-105'
                  }`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 border border-indigo-400/20 backdrop-blur-xl rounded-2xl p-8 overflow-y-auto custom-scrollbar shadow-2xl shadow-indigo-900/20 ring-1 ring-white/5 bg-gradient-to-br from-indigo-500/8 via-transparent to-indigo-500/5" style={{
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(99,102,241,0.05) 50%, rgba(99,102,241,0.02) 100%)'
        }}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Tab 1: Account Info */}
            {activeTab === 'account' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-6">Profile Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-muted-foreground)]">Full Name</label>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          handleAccountChange();
                        }}
                        className="w-full bg-[var(--color-input-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-muted-foreground)]">Email Address</label>
                      <input 
                        type="email" 
                        value={email}
                        disabled
                        className="w-full bg-[var(--color-input-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-not-allowed"
                      />
                      <p className="text-xs text-[var(--color-muted-foreground)]">Email cannot be changed</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-muted-foreground)]">Designation</label>
                      <input 
                        type="text" 
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          handleAccountChange();
                        }}
                        placeholder="e.g., Software Engineer, Developer"
                        className="w-full bg-[var(--color-input-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-muted-foreground)]">Profile Summary</label>
                      <textarea 
                        value={profileSummary}
                        onChange={(e) => {
                          setProfileSummary(e.target.value);
                          handleAccountChange();
                        }}
                        placeholder="Brief description about yourself..."
                        rows={3}
                        className="w-full bg-[var(--color-input-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-4">Profile Visibility</h2>
                  <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 rounded-lg p-2 inline-flex border border-indigo-400/20 backdrop-blur-md shadow-sm shadow-indigo-900/15">
                    <button
                      onClick={() => setVisibility('public')}
                      className={`group flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        visibility === 'public'
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-900/30'
                          : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-indigo-500/15'
                      }`}
                    >
                      <Eye className={`w-4 h-4 transition-all ${visibility === 'public' ? 'text-white' : 'text-[var(--color-muted-foreground)] group-hover:text-indigo-300 group-hover:drop-shadow-lg group-hover:scale-105'}`} /> Public
                    </button>
                    <button
                      onClick={() => setVisibility('private')}
                      className={`group flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        visibility === 'private'
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-900/30'
                          : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-indigo-500/15'
                      }`}
                    >
                      <EyeOff className={`w-4 h-4 transition-all ${visibility === 'private' ? 'text-white' : 'text-[var(--color-muted-foreground)] group-hover:text-indigo-300 group-hover:drop-shadow-lg group-hover:scale-105'}`} /> Private
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
                    {visibility === 'public' 
                      ? 'Your profile, badges, and progress are visible to other users.' 
                      : 'Only you can see your profile and activity.'}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-6">Social Media Links</h2>
                  <p className="text-sm text-[var(--color-muted-foreground)] mb-4">Add your social profiles to make them accessible from your profile</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-muted-foreground)]">GitHub URL</label>
                      <input 
                        type="url" 
                        placeholder="https://github.com/username"
                        value={githubUrl}
                        onChange={(e) => {
                          setGithubUrl(e.target.value);
                          handleAccountChange();
                        }}
                        className="w-full bg-[var(--color-input-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-muted-foreground)]">LinkedIn URL</label>
                      <input 
                        type="url" 
                        placeholder="https://linkedin.com/in/username"
                        value={linkedinUrl}
                        onChange={(e) => {
                          setLinkedinUrl(e.target.value);
                          handleAccountChange();
                        }}
                        className="w-full bg-[var(--color-input-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-muted-foreground)]">Portfolio/Website</label>
                      <input 
                        type="url" 
                        placeholder="https://yourportfolio.com"
                        value={portfolioUrl}
                        onChange={(e) => {
                          setPortfolioUrl(e.target.value);
                          handleAccountChange();
                        }}
                        className="w-full bg-[var(--color-input-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-indigo-400/10">
                  <div className="border border-red-500/30 bg-gradient-to-br from-red-500/8 via-red-500/5 to-transparent rounded-2xl p-6 backdrop-blur-md shadow-lg shadow-red-900/10">
                    <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2 group">
                      <AlertTriangle className="w-5 h-5 transition-all text-red-400 group-hover:drop-shadow-lg group-hover:scale-105" /> Danger Zone
                    </h3>
                    <p className="text-[var(--color-muted-foreground)] text-sm mb-6">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors">
                        Deactivate Account
                      </button>
                      <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-900/20">
                        Delete All Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Security */}
            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-6">Change Password</h2>
                  <div className="max-w-md space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-muted-foreground)]">Current Password</label>
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          handleAccountChange();
                        }}
                        className="w-full bg-[var(--color-input-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="••••••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-muted-foreground)]">New Password</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          handleAccountChange();
                        }}
                        className="w-full bg-[var(--color-input-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="••••••••••••"
                      />
                      <p className="text-xs text-[var(--color-muted-foreground)]">Must be at least 8 characters</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-muted-foreground)]">Confirm Password</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          handleAccountChange();
                        }}
                        className="w-full bg-[var(--color-input-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="••••••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-1">Two-Factor Authentication</h3>
                      <p className="text-sm text-[var(--color-muted-foreground)]">Add an extra layer of security to your account.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setTwoFactor(!twoFactor);
                        handleAccountChange();
                      }}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        twoFactor ? 'bg-indigo-600' : 'bg-[var(--color-border)]'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        twoFactor ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Preferences */}
            {activeTab === 'preferences' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">Theme Settings</h2>
                  <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
                    Choose between light or dark mode. The UI switches instantly.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                    ].map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleThemeChange(t.id as ThemeOption)}
                          className={`group flex items-center justify-center gap-3 p-4 rounded-lg border transition-all transform hover:scale-105 backdrop-blur-md ${
                            theme === t.id
                              ? 'bg-gradient-to-br from-indigo-600 to-indigo-500 border-indigo-400/60 text-white shadow-lg shadow-indigo-900/40 ring-1 ring-indigo-400/30'
                              : 'bg-gradient-to-br from-white/8 via-indigo-500/15 to-indigo-500/8 border-indigo-400/25 text-[var(--color-muted-foreground)] hover:bg-gradient-to-br hover:from-white/12 hover:via-indigo-500/20 hover:to-indigo-500/12 hover:border-indigo-400/45 hover:text-[var(--color-foreground)] ring-1 ring-white/5'
                          }`}
                        >
                          <Icon className="w-5 h-5 transition-all text-[var(--color-muted-foreground)] group-hover:text-indigo-300 group-hover:drop-shadow-lg group-hover:scale-105" />
                          <span className="font-medium">
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2 flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-indigo-400" /> Editor Settings
                  </h2>
                  <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
                    Adjust keybindings and font size; settings apply right away in the code editor.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-muted-foreground)]">Keybindings</label>
                      <select 
                        value={keybinding}
                        onChange={(e) => handleEditorSettingChange('keybinding', e.target.value)}
                        className="w-full bg-[var(--color-input-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                      >
                        <option value="standard">Standard</option>
                        <option value="vim">Vim</option>
                        <option value="emacs">Emacs</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--color-muted-foreground)]">Font Size</label>
                      <select 
                        value={fontSize}
                        onChange={(e) => handleEditorSettingChange('fontSize', e.target.value)}
                        className="w-full bg-[var(--color-input-background)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                      >
                        <option value="12">12px</option>
                        <option value="14">14px</option>
                        <option value="16">16px</option>
                        <option value="18">18px</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-6">Email Notifications</h2>
                
                <div className="space-y-4">
                  {[
                    { id: 'weeklyProgress', label: 'Weekly Progress Emails', desc: 'Get a summary of your learning progress every Monday.' },
                    { id: 'newQuestions', label: 'New Question Alerts', desc: 'Be notified when new practice problems are added.' },
                    { id: 'achievements', label: 'Achievement Notifications', desc: 'Get celebrated when you unlock new badges and levels.' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-400/20 backdrop-blur-md shadow-sm shadow-indigo-900/15 hover:border-indigo-400/35 hover:shadow-md hover:shadow-indigo-900/20 transition-all">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={notifications[item.id as keyof typeof notifications]}
                          onChange={() => handleNotificationChange(item.id as keyof typeof notifications)}
                          className="w-5 h-5 rounded bg-[var(--color-border)] border-[var(--color-border)] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-[var(--color-background)]"
                        />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-[var(--color-foreground)]">{item.label}</h3>
                        <p className="text-sm text-[var(--color-muted-foreground)]">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
