import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Users, Shield, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/one-route-logo.png" 
              alt="One Route Logo" 
              className="h-10 w-10"
            />
            <h1 className="text-3xl font-bold text-sky-600">One Route</h1>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="flex justify-center mb-8">
          <img 
            src="/one-route-logo.png" 
            alt="One Route Logo" 
            className="h-32 w-32"
          />
        </div>
        <h2 className="text-5xl font-bold text-gray-800 mb-6">
          Share the Journey, <span className="text-sky-500">Share the Cost</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Connect with fellow travelers and make your commute more affordable, social, and eco-friendly.
        </p>
        <Button 
          size="lg"
          onClick={() => window.location.href = '/api/login'}
          className="bg-sky-500 hover:bg-sky-600 text-white text-lg px-8 py-4"
        >
          Get Started Today
        </Button>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardContent className="pt-8">
              <Car className="w-12 h-12 text-sky-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Easy Ride Sharing</h3>
              <p className="text-gray-600">
                Create or find rides with just a few clicks. Simple, fast, and reliable.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-8">
              <Users className="w-12 h-12 text-sky-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Trusted Community</h3>
              <p className="text-gray-600">
                All users are verified with ratings and reviews for your peace of mind.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-8">
              <Shield className="w-12 h-12 text-sky-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
              <p className="text-gray-600">
                Advanced safety features including GPS tracking and emergency support.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-sky-50 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            What Our Users Say
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                </div>
                <p className="text-gray-600 mb-4">
                  "One Route has transformed my daily commute. I've met great people and saved money!"
                </p>
                <p className="font-semibold">- Sarah Johnson</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                </div>
                <p className="text-gray-600 mb-4">
                  "Safe, reliable, and eco-friendly. The verification process gives me confidence."
                </p>
                <p className="font-semibold">- Michael Chen</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                </div>
                <p className="text-gray-600 mb-4">
                  "As a driver, I love sharing costs and meeting new people on long trips."
                </p>
                <p className="font-semibold">- Emma Rodriguez</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h3 className="text-3xl font-bold text-gray-800 mb-6">
          Ready to Start Your Journey?
        </h3>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of users who are already saving money and making connections.
        </p>
        <Button 
          size="lg"
          onClick={() => window.location.href = '/api/login'}
          className="bg-sky-500 hover:bg-sky-600 text-white text-lg px-8 py-4"
        >
          Sign Up Now
        </Button>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 One Route. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
