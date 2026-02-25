
import React, { useState } from 'react';
import { Search, ShoppingCart, Lock, AlertOctagon, CheckCircle, AlertTriangle } from 'lucide-react';
import { Employee, Product, Transaction, Role, TransactionItem } from '../types';

interface CheckoutProps {
  employees: Employee[];
  products: Product[];
  transactions: Transaction[];
  onAddTransaction: (transaction: Transaction) => void;
  onUpdateStock: (items: { id: string; qty: number }[]) => void;
  currentUserRole: Role;
  supervisorPin: string;
}

const Checkout: React.FC<CheckoutProps> = ({ 
  employees, 
  products, 
  transactions, 
  onAddTransaction, 
  onUpdateStock,
  currentUserRole,
  supervisorPin
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Smart Lock States
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  
  const allowedProducts = selectedEmployee 
    ? products.filter(p => selectedEmployee.productos_permitidos.includes(p.id))
    : [];

  const filteredProducts = allowedProducts.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prev => {
      const currentQty = prev[productId] || 0;
      if (currentQty >= product.stock_actual) return prev; 
      return { ...prev, [productId]: currentQty + 1 };
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[productId] > 1) {
        next[productId]--;
      } else {
        delete next[productId];
      }
      return next;
    });
  };

  const checkFraudRisk = () => {
    if (!selectedEmployee) return { blocked: false, reason: '' };

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentHistory = transactions.filter(t => 
      t.empleado_id === selectedEmployee.id && 
      new Date(t.fecha) >= twoWeeksAgo
    );

    let fraudDetected = false;
    let reason = '';

    for (const [prodId, qty] of Object.entries(cart)) {
      const product = products.find(p => p.id === prodId);
      if (!product) continue;

      let currentWeekTotal = qty;
      let previousWeekTotal = 0;

      recentHistory.forEach(t => {
        const item = t.productos_entregados.find(i => i.producto_id === prodId);
        if (item) {
          const tDate = new Date(t.fecha);
          if (tDate >= oneWeekAgo) {
            currentWeekTotal += item.cantidad;
          } else {
            previousWeekTotal += item.cantidad;
          }
        }
      });

      const limit = selectedEmployee.limite_alerta_cantidad;

      if (currentWeekTotal > limit && previousWeekTotal > limit) {
        fraudDetected = true;
        reason = `Bloqueo de Seguridad: Uso excesivo de ${product.nombre} por 2 semanas consecutivas. (Límite: ${limit})`;
        break;
      }
    }

    return { blocked: fraudDetected, reason };
  };

  const handleCheckout = () => {
    const { blocked, reason } = checkFraudRisk();
    if (blocked) {
      setIsBlocked(true);
      setBlockReason(reason);
      return;
    }
    finalizeTransaction(false, false);
  };

  const handleSupervisorUnlock = () => {
    if (pin === supervisorPin) {
      setShowPinModal(false);
      setIsBlocked(false);
      setPin('');
      finalizeTransaction(true, true);
    } else {
      setPinError('PIN Incorrecto');
    }
  };

  const finalizeTransaction = (wasBlocked: boolean, wasUnlocked: boolean) => {
    if (!selectedEmployee) return;

    const items: TransactionItem[] = Object.entries(cart).map(([id, qty]) => {
      const prod = products.find(p => p.id === id);
      return {
        producto_id: id,
        cantidad: Number(qty),
        nombre_producto: prod?.nombre || 'Desconocido'
      };
    });

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      empleado_id: selectedEmployee.id,
      empleado_nombre: selectedEmployee.nombre,
      fecha: new Date().toISOString(),
      productos_entregados: items,
      bloqueo_activado: wasBlocked,
      desbloqueo_supervisor: wasUnlocked,
      notas_supervisor: wasUnlocked ? "Autorizado por supervisor" : undefined
    };

    onAddTransaction(newTransaction);
    onUpdateStock(items.map(i => ({ id: i.producto_id, qty: i.cantidad })));
    
    setCart({});
    setSelectedEmployeeId('');
    alert('✅ Registro completado con éxito.');
  };

  return (
    <div className="p-6 md:p-8">
      <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
        <ShoppingCart className="text-blue-600" /> Entrega de Material
      </h2>

      {/* Selector de Empleado */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Empleado que solicita:</label>
        <select 
          className="w-full p-4 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none text-lg font-semibold"
          value={selectedEmployeeId}
          onChange={(e) => {
            setSelectedEmployeeId(e.target.value);
            setCart({});
            setIsBlocked(false);
          }}
        >
          <option value="">Seleccione personal...</option>
          {employees.map(e => (
            <option key={e.id} value={e.id}>{e.nombre} - {e.num_empleado}</option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Listado de Productos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar material autorizado..."
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-400 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map(product => {
                const currentQty = cart[product.id] || 0;
                const isMaxed = currentQty >= product.stock_actual;

                return (
                  <div 
                    key={product.id} 
                    className={`p-5 rounded-2xl flex flex-col justify-between transition-all border-2 
                      ${product.stock_actual === 0 ? 'bg-slate-50 opacity-50 border-transparent' : 'bg-white border-slate-50 hover:border-blue-100 shadow-sm'}
                      ${currentQty > 0 ? 'border-blue-200 ring-2 ring-blue-50' : ''}
                    `}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-800 leading-tight">{product.nombre}</h4>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded">{product.clasificacion}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{product.marca} · {product.unidad}</p>
                      
                      <div className="flex items-center gap-2">
                         <span className={`text-xs font-bold ${product.stock_actual <= product.stock_minimo ? 'text-red-500' : 'text-slate-500'}`}>
                           Disponibles: {product.stock_actual}
                         </span>
                         {isMaxed && currentQty > 0 && <span className="text-[10px] text-orange-500 font-bold uppercase">Límite Stock</span>}
                      </div>
                    </div>

                    <div className="mt-5">
                       {currentQty > 0 ? (
                         <div className="flex items-center justify-between bg-blue-50 p-2 rounded-xl">
                           <button onClick={() => removeFromCart(product.id)} className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center font-black text-blue-600 active:scale-90">-</button>
                           <span className="font-black text-blue-700 text-lg">{currentQty}</span>
                           <button 
                              onClick={() => addToCart(product.id)} 
                              disabled={isMaxed} 
                              className="w-10 h-10 rounded-lg bg-blue-600 text-white shadow-md flex items-center justify-center font-black disabled:opacity-50 active:scale-90"
                            >
                              +
                            </button>
                         </div>
                       ) : (
                         <button 
                          onClick={() => addToCart(product.id)} 
                          disabled={product.stock_actual === 0}
                          className="w-full py-3 bg-slate-100 text-slate-600 hover:bg-blue-600 hover:text-white rounded-xl font-bold transition-all disabled:text-slate-300 active:scale-95"
                         >
                           {product.stock_actual === 0 ? 'Agotado' : 'Agregar'}
                         </button>
                       )}
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && <p className="text-slate-400 italic text-center py-10 col-span-full">Sin materiales autorizados para este empleado.</p>}
            </div>
          </div>

          {/* Resumen Final */}
          <div className="bg-slate-900 p-6 rounded-3xl shadow-xl h-fit sticky top-6 text-white">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-400" /> Confirmar Entrega
            </h3>
            
            {Object.keys(cart).length === 0 ? (
              <div className="text-slate-500 text-sm py-10 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                No hay productos seleccionados.
              </div>
            ) : (
              <ul className="space-y-4 mb-8">
                {Object.entries(cart).map(([id, qty]) => {
                  const p = products.find(x => x.id === id);
                  return (
                    <li key={id} className="flex justify-between items-center text-sm">
                      <span className="text-slate-300 font-medium">{p?.nombre}</span>
                      <span className="font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-lg">x{qty}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            {isBlocked ? (
              <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-4 mb-4 animate-pulse">
                <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                  <Lock className="w-5 h-5" /> BLOQUEO ACTIVO
                </div>
                <p className="text-xs text-red-200/70 mb-4">{blockReason}</p>
                <button 
                  onClick={() => setShowPinModal(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all active:scale-95"
                >
                  Supervisor: Desbloquear
                </button>
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={Object.keys(cart).length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Registrar Entrega
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal PIN */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-md p-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full">
            <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">PIN Supervisor</h3>
            <p className="text-sm text-slate-500 mb-6 text-center leading-relaxed">Se detectó uso excesivo de material. Ingrese el PIN para autorizar.</p>
            <input 
              type="password" 
              className="w-full text-center text-4xl tracking-[0.5em] p-5 border-2 border-slate-100 rounded-3xl mb-2 outline-none focus:border-red-500"
              maxLength={4}
              value={pin}
              autoFocus
              onChange={(e) => { setPin(e.target.value); setPinError(''); }}
              placeholder="0000"
              onKeyDown={(e) => e.key === 'Enter' && handleSupervisorUnlock()}
            />
            {pinError && <p className="text-red-500 text-xs font-bold mb-6 text-center">{pinError}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setShowPinModal(false); setPin(''); setPinError(''); }} className="flex-1 py-4 text-slate-400 font-bold">Cerrar</button>
              <button onClick={handleSupervisorUnlock} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-500/20">Autorizar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
