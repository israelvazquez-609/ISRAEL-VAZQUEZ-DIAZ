import React, { useState } from 'react';
import { AlertTriangle, Package, Users, TrendingUp, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { Product, Transaction } from '../types';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ products, transactions, onNavigate }) => {
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const lowStockProducts = products.filter(p => p.stock_actual <= p.stock_minimo);
  const totalStock = products.reduce((acc, p) => acc + p.stock_actual, 0);
  const recentTransactions = [...transactions].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 5);

  const toggleExpand = (id: string) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Panel de Control</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Productos en Stock</p>
            <p className="text-2xl font-bold text-slate-900">{totalStock}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('inventory')}>
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Alertas de Stock Bajo</p>
            <p className="text-2xl font-bold text-slate-900">{lowStockProducts.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
           <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Entregas Recientes</p>
            <p className="text-2xl font-bold text-slate-900">{transactions.length}</p>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-pulse-slow">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-medium text-red-800">Atención Requerida: Inventario Crítico</h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            <p className="mb-2">Los siguientes productos están por debajo del nivel mínimo:</p>
            <ul className="list-disc list-inside space-y-1">
              {lowStockProducts.map(p => (
                <li key={p.id}>
                  <span className="font-semibold">{p.nombre}</span>: Actual {p.stock_actual} {p.unidad} (Mín: {p.stock_minimo})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Transacciones Recientes</h3>
          <span className="text-xs text-slate-400">Clic para ver detalles</span>
        </div>
        <div className="divide-y divide-slate-100">
          {recentTransactions.map((t) => (
            <div key={t.id} className="transition-colors hover:bg-slate-50">
              <div 
                className="px-6 py-4 flex items-center justify-between cursor-pointer group"
                onClick={() => toggleExpand(t.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${t.bloqueo_activado ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{t.empleado_nombre}</p>
                    <p className="text-sm text-slate-500">{new Date(t.fecha).toLocaleDateString()} - {new Date(t.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {t.productos_entregados.length} items
                    </p>
                    {t.bloqueo_activado && (
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 uppercase tracking-wide">
                         Autorizado
                       </span>
                    )}
                  </div>
                  {expandedTxId === t.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedTxId === t.id && (
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 text-sm animate-in slide-in-from-top-2">
                  <p className="font-semibold text-slate-700 mb-2">Detalle de Entrega:</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {t.productos_entregados.map((item, idx) => (
                      <li key={idx} className="flex justify-between bg-white p-2 rounded border border-slate-200">
                        <span className="text-slate-700">{item.nombre_producto}</span>
                        <span className="font-bold text-blue-600">x{item.cantidad}</span>
                      </li>
                    ))}
                  </ul>
                  {t.notas_supervisor && (
                    <div className="mt-2 text-xs text-slate-500 italic border-l-2 border-amber-300 pl-2">
                      Nota Supervisor: "{t.notas_supervisor}"
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {recentTransactions.length === 0 && (
            <div className="p-6 text-center text-slate-500">No hay transacciones recientes.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;