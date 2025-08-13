import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

interface ProfilePictureUploaderProps {
  currentImageUrl?: string;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  fallbackText?: string;
}

/**
 * A profile picture upload component that renders as an avatar with camera icon overlay
 * and provides a modal interface for uploading images.
 */
export function ProfilePictureUploader({
  currentImageUrl,
  onComplete,
  fallbackText = "U",
}: ProfilePictureUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedFileTypes: ['image/*'],
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async () => {
          // Fetch presigned URL from backend
          const response = await fetch('/api/profile-picture/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error('Failed to get upload URL');
          }
          
          const data = await response.json();
          return {
            method: 'PUT' as const,
            url: data.uploadURL,
          };
        },
      })
      .on("complete", (result) => {
        setShowModal(false);
        onComplete?.(result);
      })
  );

  return (
    <div className="relative inline-block">
      <div 
        className="relative cursor-pointer group"
        onClick={() => setShowModal(true)}
      >
        <Avatar className="w-20 h-20">
          <AvatarImage src={currentImageUrl} alt="Profile picture" />
          <AvatarFallback className="text-lg font-medium bg-sky-100 text-sky-700">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
        
        {/* Camera overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Camera className="w-6 h-6 text-white" />
        </div>
        
        {/* Edit indicator */}
        <div className="absolute -bottom-1 -right-1 bg-sky-500 rounded-full p-1.5 shadow-lg">
          <Camera className="w-3 h-3 text-white" />
        </div>
      </div>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}