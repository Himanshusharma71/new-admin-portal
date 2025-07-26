import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function HealthCheck() {
  const { tenantId } = useParams();
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8000/health/${tenantId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        setHealthData(data);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Error fetching health data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthData();
    const interval = setInterval(fetchHealthData, 5000);
    return () => clearInterval(interval);
  }, [tenantId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'green': return 'bg-green-100 border-green-500 text-green-700';
      case 'yellow': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'red': return 'bg-red-100 border-red-500 text-red-700';
      default: return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'green': return '✓';
      case 'yellow': return '⚠';
      case 'red': return '✗';
      default: return '?';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">System Health Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Tenant ID: {tenantId}</p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1">Last updated: {lastUpdated}</p>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : healthData ? (
          <div className="p-6 space-y-6">
            <div className={`border-l-4 p-4 ${getStatusColor(healthData.status)}`}>
              <div className="flex items-center">
                <span className="font-bold text-xl mr-3">{getStatusIcon(healthData.status)}</span>
                <div>
                  <h3 className="text-lg font-medium">Current Status</h3>
                  <p className="capitalize">{healthData.status}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Last Sync</h3>
                <p className="text-lg font-semibold">
                  {new Date(healthData.last_sync_time).toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Last Error</h3>
                <p className="text-lg font-semibold">
                  {healthData.last_error || 'No errors detected'}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800 mb-2">System Information</h3>
              <p className="text-sm text-blue-700">
                Health data refreshes automatically every 5 seconds.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-red-500">
            Failed to load health data. Please try again later.
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthCheck;