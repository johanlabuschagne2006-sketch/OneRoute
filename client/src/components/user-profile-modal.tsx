import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Shield, Phone, MessageCircle, Share, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ user, isOpen, onClose }: UserProfileModalProps) {
  // Validate required props
  if (!user || !user.id) {
    console.warn('UserProfileModal: Invalid user prop provided');
    return null;
  }
  const { toast } = useToast();

  // Fetch user reviews
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery<any[]>({
    queryKey: ["/api/reviews", user.id],
    enabled: isOpen && !!user.id,
  });

  const handleMessage = () => {
    toast({
      title: "Coming Soon",
      description: "In-app messaging will be available soon!",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user.firstName} ${user.lastName} - One Route Profile`,
        text: `Check out ${user.firstName}'s profile on One Route`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Profile link copied to clipboard!",
      });
    }
  };

  const averageRating = user.rating ? parseFloat(user.rating) : 0;
  const totalRides = user.totalRides || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20 border-4 border-sky-500">
              <AvatarImage src={user.profileImageUrl || ""} />
              <AvatarFallback className="text-xl">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-800">
                {user.firstName} {user.lastName}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{averageRating.toFixed(1)}</span>
                </div>
                <span className="text-gray-600">({totalRides} rides)</span>
              </div>
              <div className="flex space-x-2 mt-2">
                {user.isVerified && (
                  <Badge className="bg-green-100 text-green-800">
                    <Shield className="w-3 h-3 mr-1" />
                    ID Verified
                  </Badge>
                )}
                {user.phone && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Phone className="w-3 h-3 mr-1" />
                    Phone Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {(user.age || user.gender || user.address) && (
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium text-gray-700 mb-3">About</h4>
                <div className="space-y-2 text-sm">
                  {user.age && (
                    <p><span className="text-gray-600">Age:</span> {user.age}</p>
                  )}
                  {user.gender && (
                    <p><span className="text-gray-600">Gender:</span> {user.gender}</p>
                  )}
                  {user.address && (
                    <p><span className="text-gray-600">Location:</span> {user.address}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Reviews */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Recent Reviews</h4>
              {isLoadingReviews ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full" />
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No reviews yet
                </p>
              ) : (
                <div className="space-y-3 max-h-32 overflow-y-auto">
                  {reviews.slice(0, 3).map((review: any) => (
                    <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating 
                                  ? 'text-yellow-500 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                  {reviews.length > 3 && (
                    <p className="text-xs text-sky-600 text-center">
                      +{reviews.length - 3} more reviews
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rating Breakdown */}
          {reviews.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                <h4 className="font-medium text-gray-700 mb-3">Rating Breakdown</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviews.filter((r: any) => r.rating === rating).length;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    
                    return (
                      <div key={rating} className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 w-12">
                          <span className="text-sm">{rating}</span>
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              onClick={handleMessage}
              className="flex-1 bg-sky-500 hover:bg-sky-600"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button 
              onClick={handleShare}
              variant="outline"
              className="flex-1"
            >
              <Share className="w-4 h-4 mr-2" />
              Share Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
