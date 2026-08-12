import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import ProductDetailsPage from './pages/ProductDetailsPage.jsx';
import Videos from './pages/Videos.jsx';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Routes>
          <Route path="/" element={<Dashboard onMenuClick={() => setSidebarOpen(true)} />} />
          <Route path="/products" element={<Products onMenuClick={() => setSidebarOpen(true)} />} />
          <Route
            path="/products/:id"
            element={<ProductDetailsPage onMenuClick={() => setSidebarOpen(true)} />}
          />
          <Route path="/videos" element={<Videos onMenuClick={() => setSidebarOpen(true)} />} />
          <Route
            path="*"
            element={
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                Page not found.
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
