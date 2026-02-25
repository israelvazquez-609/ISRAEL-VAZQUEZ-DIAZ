
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Archive, Users, FileBarChart, LogOut, ShieldCheck, HardHat, Settings, KeyRound, X, Loader2, Cloud, CloudOff, Wifi, WifiOff } from 'lucide-react';
import { Role, Product, Employee, Transaction, Area, AppConfig } from './types';
import { db } from './services/database';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Checkout from './components/Checkout';
import Reports from './components/Reports';
import Personnel from './components/Personnel';
import SecuritySettings from './components/SecuritySettings';
import AIChat from './components/AIChat';

const App: React.FC = () => {
  const [role, setRole] = useState<Role | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [config, setConfig] = useState<AppConfig>({ masterPassword: 'admin123', supervisorPin: '1234' });

  useEffect(() => {
    const initData = async () => {
      setIsDbLoading(true);
      try {
        const data = await db.initialize();
        setProducts(data.products);
        setEmployees(data.employees);
        setAreas(data.areas);
        setTransactions(data.transactions);
        if (data.config) setConfig(data.config);
        setIsCloud(db.isCloudActive);
      } catch (error) {
        console.error("Failed to load DB", error);
      } finally {
        setIsDbLoading(false);
      }
    };
    initData();

    const unsubscribe = db.subscribe((event) => {
      setIsCloud(db.isCloudActive);
      switch (event.type) {
        case 'UPDATE_PRODUCTS': setProducts(event.payload); break;
        case 'UPDATE_EMPLOYEES': setEmployees(event.payload); break;
        case 'UPDATE_AREAS': setAreas(event.payload); break;
        case 'UPDATE_TRANSACTIONS': setTransactions(event.payload); break;
        case 'UPDATE_CONFIG': setConfig(event.payload); break;
      }
    });
    return () => unsubscribe();
  }, []);

  const verifySupervisorPassword = () => {
    if (loginPassword === config.masterPassword) {
      setRole(Role.SUPERVISOR);
      setShowAuthModal(false);
      setLoginPassword('');
      setLoginError('');
    } else {
      setLoginError('Contraseña incorrecta');
    }
  };

  const handleLogout = () => {
    setRole(null);
    setCurrentView('dashboard');
  };

  // Handlers con actualización instantánea (Optimistic UI)
  const handleUpdateProducts = async (action: React.SetStateAction<Product[]>) => {
    const next = typeof action === 'function' ? (action as (prev: Product[]) => Product[])(products) : action;
    setProducts(next); // Update UI immediately
    await db.saveProducts(next);
  };

  const handleUpdateEmployees = async (action: React.SetStateAction<Employee[]>) => {
    const next = typeof action === 'function' ? (action as (prev: Employee[]) => Employee[])(employees) : action;
    setEmployees(next);
    await db.saveEmployees(next);
  };

  const handleUpdateAreas = async (action: React.SetStateAction<Area[]>) => {
    const next = typeof action === 'function' ? (action as (prev: Area[]) => Area[])(areas) : action;
    setAreas(next);
    await db.saveAreas(next);
  };

  const handleAddTransaction = async (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
    await db.addTransaction(transaction);
  };

  const handleUpdateStock = async (items: { id: string; qty: number }[]) => {
    // Local stock update for immediate UI feedback
    setProducts(prev => prev.map(p => {
      const item = items.find(i => i.id === p.id);
      if (item) return { ...p, stock_actual: Math.max(0, p.stock_actual - item.qty) };
      return p;
    }));
    await db.updateProductStock(items);
  };

  const handleUpdateConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    await db.saveConfig(newConfig);
  };

  if (isDbLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-white font-medium">Iniciando base de datos...</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-sm w-full relative overflow-hidden">
          
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-blue-600 rounded-2xl shadow-lg mb-4">
              <Archive className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">SmartMaint</h1>
            <p className="text-slate-500 font-medium italic">Preparatoria - Inventario</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => setRole(Role.ADMIN)}
              className="w-full p-5 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-2xl flex items-center gap-4 transition-all active:scale-95"
            >
              <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><Users className="w-6 h-6" /></div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">Administrador</h3>
                <p className="text-[10px] text-slate-400 uppercase font-black">Entregas</p>
              </div>
            </button>
            
            <button 
              onClick={() => setShowAuthModal(true)}
              className="w-full p-5 bg-slate-50 hover:bg-purple-50 border border-slate-100 rounded-2xl flex items-center gap-4 transition-all active:scale-95"
            >
              <div className="bg-purple-100 text-purple-600 p-3 rounded-xl"><ShieldCheck className="w-6 h-6" /></div>
              <div className="text-left">
                <h3 className="font-bold text-slate-800">Supervisor</h3>
                <p className="text-[10px] text-slate-400 uppercase font-black">Control Total</p>
              </div>
            </button>
          </div>
          
          <div className="mt-8 flex justify-center gap-2">
             {isCloud ? (
               <span className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase">
                 <Cloud className="w-3 h-3" /> Nube Activa
               </span>
             ) : (
               <span className="flex items-center gap-1 text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full uppercase">
                 <CloudOff className="w-3 h-3" /> Modo Local
               </span>
             )}
          </div>
        </div>

        {showAuthModal && (
          <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-6 backdrop-blur-md">
            <div className="bg-white rounded-3xl shadow-2xl max-w-xs w-full overflow-hidden">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-xl text-slate-800 mb-4">PIN Supervisor</h3>
                <input 
                  type="password" 
                  className={`w-full px-4 py-4 border-2 rounded-2xl text-center text-2xl font-black tracking-widest outline-none mb-2 ${loginError ? 'border-red-500' : 'border-slate-100'}`}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && verifySupervisorPassword()}
                  autoFocus
                />
                {loginError && <p className="text-red-500 text-xs font-bold mb-4">{loginError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => {setShowAuthModal(false); setLoginError('');}} className="flex-1 py-4 text-slate-400 font-bold">Cerrar</button>
                  <button onClick={verifySupervisorPassword} className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-bold">Entrar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20 md:pb-0 md:flex-row h-screen overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex-shrink-0 hidden md:flex flex-col">
        <div className="p-8">
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl"><Archive className="w-6 h-6" /></div>
            SmartMaint
          </h1>
          <div className="mt-4">
             {isCloud ? (
               <span className="flex items-center gap-2 text-[10px] font-black text-green-400 uppercase tracking-widest">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Nube Sincronizada
               </span>
             ) : (
               <span className="flex items-center gap-2 text-[10px] font-black text-orange-400 uppercase tracking-widest">
                 <div className="w-2 h-2 rounded-full bg-orange-500"></div> Solo Local
               </span>
             )}
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <NavItem active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
          <NavItem active={currentView === 'checkout'} onClick={() => setCurrentView('checkout')} icon={<ShoppingCart />} label="Entregar" />
          <NavItem active={currentView === 'inventory'} onClick={() => setCurrentView('inventory')} icon={<Archive />} label="Inventario" />
          {role === Role.SUPERVISOR && (
            <>
              <NavItem active={currentView === 'personnel'} onClick={() => setCurrentView('personnel')} icon={<HardHat />} label="Personal" />
              <NavItem active={currentView === 'reports'} onClick={() => setCurrentView('reports')} icon={<FileBarChart />} label="Reportes" />
              <NavItem active={currentView === 'security'} onClick={() => setCurrentView('security')} icon={<Settings />} label="Seguridad" />
            </>
          )}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 font-bold rounded-xl transition-colors">
            <LogOut className="w-5 h-5" /> Salir
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-full relative no-scrollbar bg-slate-50">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:hidden flex justify-between items-center sticky top-0 z-[40]">
           <div className="flex flex-col">
             <h1 className="font-black text-slate-900 tracking-tight text-lg leading-none">SmartMaint</h1>
             <span className={`text-[9px] font-black uppercase mt-1 ${isCloud ? 'text-green-600' : 'text-orange-600'}`}>
                {isCloud ? 'En Línea' : 'Offline'}
             </span>
           </div>
           <button onClick={handleLogout} className="p-2 text-slate-400"><LogOut className="w-5 h-5" /></button>
        </header>

        <div className="max-w-6xl mx-auto pb-10">
          {currentView === 'dashboard' && <Dashboard products={products} transactions={transactions} onNavigate={setCurrentView} />}
          {currentView === 'inventory' && <Inventory products={products} setProducts={handleUpdateProducts} />}
          {currentView === 'checkout' && (
            <Checkout 
              employees={employees} 
              products={products} 
              transactions={transactions} 
              onAddTransaction={handleAddTransaction}
              onUpdateStock={handleUpdateStock}
              currentUserRole={role}
              supervisorPin={config.supervisorPin}
            />
          )}
          {currentView === 'personnel' && role === Role.SUPERVISOR && (
            <Personnel 
              employees={employees} 
              setEmployees={handleUpdateEmployees} 
              areas={areas} 
              setAreas={handleUpdateAreas} 
              products={products} 
              transactions={transactions}
            />
          )}
          {currentView === 'reports' && role === Role.SUPERVISOR && <Reports transactions={transactions} products={products} employees={employees} />}
          {currentView === 'security' && role === Role.SUPERVISOR && <SecuritySettings config={config} onUpdateConfig={handleUpdateConfig} />}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 border-t border-slate-200 px-2 py-3 flex justify-around items-center z-[50]">
        <MobileTab active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard />} />
        <MobileTab active={currentView === 'checkout'} onClick={() => setCurrentView('checkout')} icon={<ShoppingCart />} />
        <MobileTab active={currentView === 'inventory'} onClick={() => setCurrentView('inventory')} icon={<Archive />} />
        {role === Role.SUPERVISOR && <MobileTab active={currentView === 'security'} onClick={() => setCurrentView('security')} icon={<Settings />} />}
      </nav>

      <AIChat products={products} employees={employees} areas={areas} />
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
  >
    {React.cloneElement(icon, { className: "w-5 h-5" })}
    <span className="font-bold text-sm">{label}</span>
  </button>
);

const MobileTab = ({ active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
  >
    {React.cloneElement(icon, { className: "w-6 h-6" })}
  </button>
);

export default App;
