import { useState } from 'react';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import SalesForm from './components/SalesForm';
import CashControl from './components/CashControl';
import './App.css';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'productos':
        return <ProductList />;
      case 'ventas':
        return <SalesForm />;
      case 'caja':
        return <CashControl />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <img src="/inventario-antorcahdplata/logo_antorcha.png" alt="Antorcha de Plata" className="logo" />
          <h1>Antorcha de Plata - Inventario</h1>
        </div>
        <nav className="nav">
          <button 
            className={activeSection === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveSection('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={activeSection === 'productos' ? 'active' : ''}
            onClick={() => setActiveSection('productos')}
          >
            Productos
          </button>
          <button 
            className={activeSection === 'ventas' ? 'active' : ''}
            onClick={() => setActiveSection('ventas')}
          >
            Ventas
          </button>
          <button 
            className={activeSection === 'caja' ? 'active' : ''}
            onClick={() => setActiveSection('caja')}
          >
            Caja
          </button>
        </nav>
      </header>
      <main className="app-main">
        {renderSection()}
      </main>
    </div>
  );
}

export default App;
