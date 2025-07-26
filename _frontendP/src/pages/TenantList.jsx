import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function TenantList() {
  const [tenants, setTenants] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/tenants/')
      .then(response => response.json())
      .then(data => setTenants(data));
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tenants</h1>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timezone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.timezone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-4">
                      <Link 
                        to={`/tenant/${tenant.id}/source-config`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Configure Source
                      </Link>
                      <Link 
                        to={`/tenant/${tenant.id}/pipeline`}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        Pipeline Control
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TenantList;