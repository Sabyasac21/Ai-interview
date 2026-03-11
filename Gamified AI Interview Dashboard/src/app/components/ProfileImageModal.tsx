import React, { useState, useRef } from 'react';
import { X, Upload, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage: string;
  onImageUpdate?: (imageUrl: string) => void;
}

export const ProfileImageModal: React.FC<ProfileImageModalProps> = ({
  isOpen,
  onClose,
  currentImage,
  onImageUpdate,
}) => {
  const { user, updateProfile } = useAuth();
  const [preview, setPreview] = useState<string>(currentImage);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreview(result);
        setSelectedFile(file);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to process image');
    }
  };

  const handleSave = async () => {
    if (!user || !selectedFile) return;
    
    try {
      setIsLoading(true);
      const updatedUser = await updateProfile(user.full_name || user.username, selectedFile);
      
      // Update local avatar if callback provided
      if (onImageUpdate && updatedUser.avatar_url) {
        onImageUpdate(updatedUser.avatar_url);
      }
      
      toast.success('Profile picture updated successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update profile image');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-foreground)]">Edit Profile Picture</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-[var(--color-border)] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-[var(--color-muted-foreground)]" />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6 flex justify-center">
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-32 h-32 rounded-full object-cover ring-4 ring-indigo-500/50"
            />
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <Upload className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className="mb-6 relative border-2 border-dashed border-indigo-500/30 rounded-xl p-6 hover:border-indigo-500/60 transition-colors cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="hidden"
          />
          <div className="text-center">
            <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
              PNG, JPG, GIF, WebP up to 5MB
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]/30 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !selectedFile}
            className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-[var(--color-border)] text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Image'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
