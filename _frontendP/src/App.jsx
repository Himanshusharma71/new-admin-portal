import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import TenantList from './pages/TenantList';
import CreateTenant from './pages/CreateTenant';
import SourceConfig from './pages/SourceConfig';
import PipelineControl from './pages/PipelineControl';
import Login from './pages/Login';
import HealthCheck from './pages/HealthCheck'; 
import { useState } from 'react'; 
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('viewer');

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-blue-600 p-4 text-white shadow-md">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex space-x-4">
              <Link to="/" className="hover:bg-blue-700 px-3 py-2 rounded">Tenants</Link>
              {isAuthenticated && userRole === 'admin' && (
                <Link to="/create-tenant" className="hover:bg-blue-700 px-3 py-2 rounded">Create Tenant</Link>
              )}
            </div>
            {isAuthenticated ? (
              <button 
                onClick={() => setIsAuthenticated(false)}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded">Login</Link>
            )}
          </div>
        </nav>

        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/" element={<TenantList />} />
            <Route path="/create-tenant" element={<CreateTenant />} />
            <Route path="/tenant/:tenantId/source-config" element={<SourceConfig />} />
            <Route path="/tenant/:tenantId/pipeline" element={<PipelineControl />} />
            <Route path="/tenant/:tenantId/health" element={<HealthCheck />} />
            <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;