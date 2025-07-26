import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function PipelineControl() {
  const { tenantId } = useParams();
  const [status, setStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPipelineStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/tenants/${tenantId}/pipeline/`);
        const data = await response.json();
        setStatus(data.is_active);
      } catch (error) {
        console.error('Error fetching pipeline status:', error);
      }
    };

    fetchPipelineStatus();
  }, [tenantId]);

  const togglePipeline = async () => {
    setIsLoading(true);
    try {
      const newStatus = !status;
      const response = await fetch(`http://localhost:8000/tenants/${tenantId}/pipeline/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (response.ok) {
        setStatus(newStatus);
      } else {
        console.error('Failed to update pipeline status');
      }
    } catch (error) {
      console.error('Error toggling pipeline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Pipeline Control</h1>
        
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mb-6">
          <div className="flex items-center space-x-3">
            <div className={`h-3 w-3 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-medium text-gray-700">
              Current status: <span className={status ? 'text-green-600' : 'text-red-600'}>
                {status ? 'Running' : 'Stopped'}
              </span>
            </span>
          </div>
          
          <button
            onClick={togglePipeline}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md font-medium text-white ${
              status 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              'Processing...'
            ) : (
              status ? 'Stop Pipeline' : 'Start Pipeline'
            )}
          </button>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Tenant ID: <span className="font-mono">{tenantId}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PipelineControl;