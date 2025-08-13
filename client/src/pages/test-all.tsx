import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  TestTube, 
  Database, 
  Wifi, 
  CreditCard,
  MapPin,
  MessageCircle,
  Shield,
  Users,
  Car
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  details?: string;
}

export default function TestAll() {
  const { user, isAuthenticated } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Test API endpoints
  const runAPITests = async () => {
    const tests: TestResult[] = [];
    
    try {
      // Test authentication
      const authResponse = await fetch('/api/auth/user');
      tests.push({
        name: 'Authentication API',
        status: authResponse.ok ? 'pass' : 'fail',
        message: authResponse.ok ? 'User authentication working' : 'Authentication failed',
        details: `Status: ${authResponse.status}`
      });

      // Test rides API
      const ridesResponse = await fetch('/api/rides');
      tests.push({
        name: 'Rides API',
        status: ridesResponse.ok ? 'pass' : 'fail',
        message: ridesResponse.ok ? 'Rides API accessible' : 'Rides API failed',
        details: `Status: ${ridesResponse.status}`
      });

      // Test vehicles API
      const vehiclesResponse = await fetch('/api/vehicles');
      tests.push({
        name: 'Vehicles API',
        status: vehiclesResponse.ok ? 'pass' : 'fail',
        message: vehiclesResponse.ok ? 'Vehicles API working' : 'Vehicles API failed',
        details: `Status: ${vehiclesResponse.status}`
      });

      // Test PayPal setup
      const paypalResponse = await fetch('/paypal/setup');
      tests.push({
        name: 'PayPal Integration',
        status: paypalResponse.ok ? 'pass' : 'fail',
        message: paypalResponse.ok ? 'PayPal setup accessible' : 'PayPal setup failed',
        details: `Status: ${paypalResponse.status}`
      });

    } catch (error) {
      tests.push({
        name: 'API Tests',
        status: 'fail',
        message: 'API test suite failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return tests;
  };

  // Test WebSocket connection
  const testWebSocket = async () => {
    return new Promise<TestResult>((resolve) => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
          ws.close();
          resolve({
            name: 'WebSocket Connection',
            status: 'fail',
            message: 'WebSocket connection timeout',
            details: 'Connection took too long to establish'
          });
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve({
            name: 'WebSocket Connection',
            status: 'pass',
            message: 'WebSocket connection successful',
            details: 'Real-time features available'
          });
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve({
            name: 'WebSocket Connection',
            status: 'fail',
            message: 'WebSocket connection failed',
            details: 'Real-time features unavailable'
          });
        };
      } catch (error) {
        resolve({
          name: 'WebSocket Connection',
          status: 'fail',
          message: 'WebSocket test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  };

  // Test GPS functionality
  const testGPS = async () => {
    return new Promise<TestResult>((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          name: 'GPS Location Services',
          status: 'fail',
          message: 'Geolocation not supported',
          details: 'GPS tracking unavailable'
        });
        return;
      }

      const timeout = setTimeout(() => {
        resolve({
          name: 'GPS Location Services',
          status: 'fail',
          message: 'GPS permission timeout',
          details: 'Location access denied or unavailable'
        });
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        () => {
          clearTimeout(timeout);
          resolve({
            name: 'GPS Location Services',
            status: 'pass',
            message: 'GPS location access granted',
            details: 'Live tracking available'
          });
        },
        (error) => {
          clearTimeout(timeout);
          resolve({
            name: 'GPS Location Services',
            status: 'fail',
            message: 'GPS access denied',
            details: error.message
          });
        },
        { timeout: 8000 }
      );
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const allTests: TestResult[] = [];

    // Run API tests
    const apiTests = await runAPITests();
    allTests.push(...apiTests);
    setTestResults([...allTests]);

    // Run WebSocket test
    const wsTest = await testWebSocket();
    allTests.push(wsTest);
    setTestResults([...allTests]);

    // Run GPS test
    const gpsTest = await testGPS();
    allTests.push(gpsTest);
    setTestResults([...allTests]);

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'fail':
        return <Badge variant="destructive">FAIL</Badge>;
      default:
        return <Badge variant="secondary">PENDING</Badge>;
    }
  };

  const passedTests = testResults.filter(t => t.status === 'pass').length;
  const failedTests = testResults.filter(t => t.status === 'fail').length;
  const totalTests = testResults.length;

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-6 h-6 text-sky-600" />
            One Route - Complete System Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">User: {(user as any)?.firstName || 'Not logged in'}</Badge>
              <Badge variant={isAuthenticated ? "default" : "destructive"}>
                {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              </Badge>
            </div>
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </div>

          {totalTests > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card className="p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                <div className="text-sm text-gray-600">Passed</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-2xl font-bold text-sky-600">{totalTests}</div>
                <div className="text-sm text-gray-600">Total</div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((test, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{test.name}</span>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{test.message}</p>
                    {test.details && (
                      <p className="text-xs text-gray-500">{test.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Feature Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-sm">User Management</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Car className="w-5 h-5 text-blue-600" />
              <span className="text-sm">Ride System</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              <span className="text-sm">Real-time Chat</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
              <MapPin className="w-5 h-5 text-orange-600" />
              <span className="text-sm">GPS Tracking</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
              <span className="text-sm">Emergency SOS</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-sky-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-sky-600" />
              <span className="text-sm">PayPal Payments</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
              <Wifi className="w-5 h-5 text-indigo-600" />
              <span className="text-sm">WebSocket</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Database className="w-5 h-5 text-gray-600" />
              <span className="text-sm">Database</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}