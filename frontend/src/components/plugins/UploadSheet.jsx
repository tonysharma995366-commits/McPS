import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, ShoppingBag, AlertCircle } from 'lucide-react';
import BottomSheet from '../BottomSheet.jsx';
import UploadProgress from './UploadProgress.jsx';
import { api } from '../../lib/api.js';

export default function UploadSheet({
  isOpen,
  onClose,
  onOpenInstallUrl,
  onOpenStore,
  onSuccessUpload,
  showToast,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['.jar', '.mcaddon', '.mcpack', '.zip'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    // Validate extension
    if (!allowed.includes(ext)) {
      showToast?.('Only .jar, .mcaddon, .mcpack, and .zip files are allowed', 'error');
      return;
    }

    // Validate size: max 50 MB
    if (file.size > 50 * 1024 * 1024) {
      showToast?.('File exceeds maximum size of 50 MB', 'error');
      return;
    }

    setSelectedFile(file);
    startUpload(file);
  };

  const startUpload = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      await api.uploadPlugin(file, (progress) => {
        setUploadProgress(progress);
      });
      showToast?.(`Uploaded ${file.name} successfully`, 'success');
      setSelectedFile(null);
      setIsUploading(false);
      onClose();
      onSuccessUpload();
    } catch (err) {
      showToast?.(err.message || 'Plugin upload failed', 'error');
      setIsUploading(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Add Plugin or Bedrock Addon">
      <div className="space-y-4">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jar,.mcaddon,.mcpack,.zip"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Option A: Big Dashed Drop Zone */}
        {!isUploading ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-6 rounded-[12px] border-2 border-dashed border-[#262a33] hover:border-[#4ade80] bg-[#0f1115] hover:bg-[#1a1d24] flex flex-col items-center justify-center text-center cursor-pointer transition-colors duration-150 select-none group"
          >
            <div className="w-12 h-12 rounded-full bg-[#1a1d24] group-hover:bg-[#4ade80]/10 flex items-center justify-center text-[#9ca3af] group-hover:text-[#4ade80] mb-3 transition-colors duration-150">
              <Upload size={24} />
            </div>
            <h4 className="text-[14px] font-semibold text-[#e5e7eb] mb-1">
              Tap to select file (.jar, .mcaddon, .mcpack, .zip)
            </h4>
            <p className="text-[12px] text-[#9ca3af]">
              Upload directly from your device
            </p>
            <span className="text-[11px] text-[#6b7280] mt-2">
              Max size: 50 MB
            </span>
          </div>
        ) : (
          <UploadProgress
            filename={selectedFile?.name || 'plugin.jar'}
            progress={uploadProgress}
          />
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#262a33] w-full" />
          <span className="bg-[#1a1d24] px-2 text-[11px] text-[#6b7280] absolute">
            OR CHOOSE METHOD
          </span>
        </div>

        {/* Alternate Options */}
        <div className="grid grid-cols-2 gap-2">
          {/* Option B: Install from URL */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenInstallUrl();
            }}
            className="min-h-[44px] p-2.5 rounded-[8px] bg-[#0f1115] hover:bg-[#262a33] border border-[#262a33] flex items-center justify-center gap-2 text-[12.5px] font-medium text-[#e5e7eb] transition-colors duration-150 cursor-pointer"
          >
            <LinkIcon size={16} className="text-[#60a5fa]" />
            <span>Install from URL</span>
          </button>

          {/* Option C: Plugin Store */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenStore();
            }}
            className="min-h-[44px] p-2.5 rounded-[8px] bg-[#0f1115] hover:bg-[#262a33] border border-[#262a33] flex items-center justify-center gap-2 text-[12.5px] font-medium text-[#e5e7eb] transition-colors duration-150 cursor-pointer"
          >
            <ShoppingBag size={16} className="text-[#4ade80]" />
            <span>Plugin Store</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
