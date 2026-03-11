import React, { useState, useRef, useEffect } from 'react';
import { Bell, Flame, Search, ChevronDown, LogOut, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileImageModal } from './ProfileImageModal';
import { toast } from 'sonner';

export const Header = () => {
  const { logout, user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const name = user?.full_name || user?.username || 'Guest';
  const levelTitle = user?.level_title || `Level ${user?.level || 0}`;
  const streak = user?.streak_days ?? 0;
  const avatar = localAvatar || user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleSignOut = () => {
    setIsDropdownOpen(false);
    logout();
    toast.success('Signed out successfully');
  };

  const handleEditImage = () => {
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  };

  return (
    <>
      <header className="h-20 bg-[var(--color-card)] border-b border-[var(--color-border)] px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4 flex-1">
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">Dashboard</h2>
          <div className="relative max-w-md w-full ml-8 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted-foreground)]" />
            <input 
              type="text" 
              placeholder="Search for lessons, skills, or history..." 
              className="w-full bg-[var(--color-input-background)] border-none rounded-full py-2 pl-10 pr-4 text-sm text-[var(--color-foreground)] focus:ring-2 focus:ring-indigo-500 placeholder-[var(--color-muted-foreground)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span className="text-sm font-bold text-orange-400">{streak} Day Streak</span>
          </div>

          <button className="relative p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--color-card)]" />
          </button>

          {/* Profile Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 pl-6 border-l border-[var(--color-border)] hover:opacity-80 transition-opacity group"
            >
              <img 
                src={avatar} 
                alt="User" 
                className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/50 group-hover:ring-indigo-400"
              />
              <div className="hidden md:flex md:flex-col">
                <p className="text-sm font-medium text-[var(--color-foreground)]">{name}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">{levelTitle}</p>
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-[var(--color-muted-foreground)] transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-2xl shadow-black/50 overflow-hidden z-50 animation-in fade-in slide-in-from-top-2">
                {/* Header */}
                <div className="px-4 py-3 border-b border-[var(--color-border)]/50 bg-gradient-to-r from-indigo-600/10 to-indigo-500/5">
                  <div className="flex items-center gap-3">
                    <img 
                      src={avatar} 
                      alt="User" 
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/50"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">{name}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleEditImage}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 text-[var(--color-foreground)] hover:bg-indigo-600/10 transition-colors group"
                  >
                    <ImageIcon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-sm font-medium">Edit Profile Picture</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">Change your avatar</p>
                    </div>
                  </button>

                  <div className="border-t border-[var(--color-border)]/30 my-2" />

                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 text-red-400 hover:bg-red-500/10 transition-colors group"
                  >
                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-sm font-medium">Sign Out</p>
                      <p className="text-xs text-red-400/70">Exit your account</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Image Modal */}
      <ProfileImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentImage={avatar}
        onImageUpdate={(imageUrl) => {
          setLocalAvatar(imageUrl);
        }}
      />
    </>
  );
};
