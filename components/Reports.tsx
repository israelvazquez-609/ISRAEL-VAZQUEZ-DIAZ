import React, { useState } from 'react';
import { Transaction, Product, Employee } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Filter, User } from 'lucide-react';

interface ReportsProps {
  transactions: Transaction[];
  products: Product[];
  employees: Employee[];
}

const Reports: React.FC<ReportsProps> = ({ transactions, products, employees }) => {
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('ALL');

  // 1. Top 5 Requested Products
  const productConsumption: { [key: string]: number } = {};
  
  transactions.forEach(t => {
    t.productos_entregados.forEach(item => {
      productConsumption[item.nombre_producto] = (productConsumption[item.nombre_producto] || 0) + item.cantidad;
    });
  });

  const topProductsData = Object.entries(productConsumption)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 2. Consumption by Classification
  const classConsumption: { [key: string]: number } = {};
  
  transactions.forEach(t => {
    t.productos_entregados.forEach(item => {
      const prod = products.find(p => p.id === item.producto_id);
      if (prod) {
        classConsumption[prod.clasificacion] = (classConsumption[prod.clasificacion] || 0) + item.cantidad;
      }
    });
  });

  const classificationData = Object.entries(classConsumption).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // 3. Filtered History
  const filteredTransactions = filterEmployeeId === 'ALL'
    ? transactions
    : transactions.filter(t => t.empleado_id === filterEmployeeId);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Reportes Mensuales</h2>
        <button className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors shadow-sm">
          <FileText className="w-4 h-4" /> Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top 5 Products Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-lg mb-4 text-slate-700">Top 5 Productos Más Solicitados</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickMargin={5} />
                <YAxis fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Classification Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold text-lg mb-4 text-slate-700">Consumo por Clasificación</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classificationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {classificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-semibold text-slate-700">Historial Detallado de Transacciones</h3>
          
          {/* Employee Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterEmployeeId}
                onChange={(e) => setFilterEmployeeId(e.target.value)}
                className="w-full sm:w-64 pl-8 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option value="ALL">Todos los Empleados</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
              <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 font-medium border-b">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Empleado</th>
                <th className="p-3">Productos</th>
                <th className="p-3">Notas</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-medium text-slate-700">{new Date(t.fecha).toLocaleDateString()}</div>
                    <div className="text-xs text-slate-400">{new Date(t.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </td>
                  <td className="p-3 font-medium text-slate-800">{t.empleado_nombre}</td>
                  <td className="p-3">
                    {t.productos_entregados.map(i => `${i.nombre_producto} (${i.cantidad})`).join(', ')}
                  </td>
                  <td className="p-3 text-slate-500 italic max-w-xs truncate">{t.notas_supervisor || '-'}</td>
                  <td className="p-3">
                    {t.bloqueo_activado ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        ⚠️ Desbloqueado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No se encontraron transacciones con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;