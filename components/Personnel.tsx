import React, { useState } from 'react';
import { Plus, Trash2, Save, Search, Check, Shield, MapPin, Package, History, X, Clock, Edit, AlertTriangle, Settings, Filter } from 'lucide-react';
import { Employee, Area, Product, Classification, Transaction } from '../types';

interface PersonnelProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  areas: Area[];
  setAreas: React.Dispatch<React.SetStateAction<Area[]>>;
  products: Product[];
  transactions: Transaction[];
}

const Personnel: React.FC<PersonnelProps> = ({ employees, setEmployees, areas, setAreas, products, transactions }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [isAreaManagerOpen, setIsAreaManagerOpen] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilters, setProductCategoryFilters] = useState<string[]>(['ALL']);
  
  // Area CRUD States
  const [newAreaName, setNewAreaName] = useState('');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [tempAreaName, setTempAreaName] = useState('');
  
  // State for History Modal
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);
  
  // State for Delete Confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, id: string | null, name: string}>({
    isOpen: false,
    id: null,
    name: ''
  });
  
  // Form State
  const initialFormState = {
    nombre: '',
    num_empleado: '',
    areas_asignadas: [],
    productos_permitidos: [],
    limite_alerta_cantidad: 10
  };

  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>(initialFormState);

  // --- Employee Functions ---

  const handleOpenAddForm = () => {
    setEmployeeForm(initialFormState);
    setEditingEmployeeId(null);
    setProductCategoryFilters(['ALL']);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (emp: Employee) => {
    setEmployeeForm({
      nombre: emp.nombre,
      num_empleado: emp.num_empleado,
      areas_asignadas: [...emp.areas_asignadas],
      productos_permitidos: [...emp.productos_permitidos],
      limite_alerta_cantidad: emp.limite_alerta_cantidad
    });
    setEditingEmployeeId(emp.id);
    setProductCategoryFilters(['ALL']);
    setIsFormOpen(true);
    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveEmployee = () => {
    if (!employeeForm.nombre || !employeeForm.num_empleado) return;

    if (editingEmployeeId) {
      // Update Existing
      setEmployees(prev => prev.map(emp => {
        if (emp.id === editingEmployeeId) {
          return {
            ...emp,
            nombre: employeeForm.nombre!,
            num_empleado: employeeForm.num_empleado!,
            areas_asignadas: employeeForm.areas_asignadas || [],
            productos_permitidos: employeeForm.productos_permitidos || [],
            limite_alerta_cantidad: Number(employeeForm.limite_alerta_cantidad)
          };
        }
        return emp;
      }));
    } else {
      // Create New
      const newEmployee: Employee = {
        id: Date.now().toString(),
        nombre: employeeForm.nombre || '',
        num_empleado: employeeForm.num_empleado || '',
        areas_asignadas: employeeForm.areas_asignadas || [],
        productos_permitidos: employeeForm.productos_permitidos || [],
        limite_alerta_cantidad: Number(employeeForm.limite_alerta_cantidad) || 10
      };
      setEmployees(prev => [...prev, newEmployee]);
    }

    setIsFormOpen(false);
    setEditingEmployeeId(null);
    setEmployeeForm(initialFormState);
  };

  const promptDeleteEmployee = (employee: Employee) => {
    setDeleteConfirmation({
      isOpen: true,
      id: employee.id,
      name: employee.nombre
    });
  };

  const confirmDeleteEmployee = () => {
    if (deleteConfirmation.id) {
      setEmployees(prev => prev.filter(e => e.id !== deleteConfirmation.id));
      setDeleteConfirmation({ isOpen: false, id: null, name: '' });
    }
  };

  // --- Area Functions ---

  const handleAddArea = () => {
    if (!newAreaName.trim()) return;
    const newArea: Area = {
      id: Date.now().toString(),
      nombre: newAreaName.trim()
    };
    setAreas(prev => [...prev, newArea]);
    setNewAreaName('');
  };

  const startEditArea = (area: Area) => {
    setEditingAreaId(area.id);
    setTempAreaName(area.nombre);
  };

  const saveEditArea = () => {
    if (!tempAreaName.trim()) return;
    
    // Find the old name to update references
    const areaToUpdate = areas.find(a => a.id === editingAreaId);
    if (!areaToUpdate) return;
    
    const oldName = areaToUpdate.nombre;
    const newName = tempAreaName.trim();

    // 1. Update Area List
    setAreas(prev => prev.map(a => a.id === editingAreaId ? { ...a, nombre: newName } : a));
    
    // 2. Propagate rename to all employees
    setEmployees(prev => prev.map(emp => ({
      ...emp,
      areas_asignadas: emp.areas_asignadas.map(aName => aName === oldName ? newName : aName)
    })));

    setEditingAreaId(null);
    setTempAreaName('');
  };

  const cancelEditArea = () => {
    setEditingAreaId(null);
    setTempAreaName('');
  };

  const deleteArea = (id: string) => {
    const areaToDelete = areas.find(a => a.id === id);
    if (!areaToDelete) return;

    if (confirm(`¿Estás seguro de eliminar el área "${areaToDelete.nombre}"? Se desasignará de todos los empleados.`)) {
      // 1. Remove from Areas
      setAreas(prev => prev.filter(a => a.id !== id));
      
      // 2. Remove reference from Employees
      setEmployees(prev => prev.map(emp => ({
        ...emp,
        areas_asignadas: emp.areas_asignadas.filter(aName => aName !== areaToDelete.nombre)
      })));
    }
  };

  // --- Toggle Functions ---

  const toggleArea = (areaName: string) => {
    setEmployeeForm(prev => {
      const current = prev.areas_asignadas || [];
      if (current.includes(areaName)) {
        return { ...prev, areas_asignadas: current.filter(a => a !== areaName) };
      } else {
        return { ...prev, areas_asignadas: [...current, areaName] };
      }
    });
  };

  const toggleCategoryFilter = (category: string) => {
    setProductCategoryFilters(prev => {
      // If clicking ALL, reset to just ALL
      if (category === 'ALL') return ['ALL'];
      
      let newFilters = prev.filter(c => c !== 'ALL');
      
      if (newFilters.includes(category)) {
        newFilters = newFilters.filter(c => c !== category);
      } else {
        newFilters = [...newFilters, category];
      }
      
      return newFilters.length === 0 ? ['ALL'] : newFilters;
    });
  };

  const toggleProduct = (productId: string) => {
    setEmployeeForm(prev => {
      const current = prev.productos_permitidos || [];
      if (current.includes(productId)) {
        return { ...prev, productos_permitidos: current.filter(p => p !== productId) };
      } else {
        return { ...prev, productos_permitidos: [...current, productId] };
      }
    });
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.clasificacion.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilters.includes('ALL') || productCategoryFilters.includes(p.clasificacion);
    return matchesSearch && matchesCategory;
  });

  const toggleAllFilteredProducts = () => {
    const idsToToggle = filteredProducts.map(p => p.id);
    setEmployeeForm(prev => {
      const current = prev.productos_permitidos || [];
      const allSelected = idsToToggle.every(id => current.includes(id));
      
      let newSelection;
      if (allSelected) {
        // Deselect all visible
        newSelection = current.filter(id => !idsToToggle.includes(id));
      } else {
        // Select all visible (union)
        newSelection = Array.from(new Set([...current, ...idsToToggle]));
      }
      return { ...prev, productos_permitidos: newSelection };
    });
  };

  const getEmployeeTransactions = (empId: string) => {
    return transactions
      .filter(t => t.empleado_id === empId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Personal</h2>
          <p className="text-slate-500 text-sm">Administra empleados, asigna áreas y autoriza materiales.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAreaManagerOpen(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-slate-300"
          >
            <Settings className="w-4 h-4" /> Gestionar Áreas
          </button>
          {!isFormOpen && (
            <button 
              onClick={handleOpenAddForm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Nuevo Empleado
            </button>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-xl mb-8 animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-lg mb-4 text-slate-800 flex items-center gap-2">
            {editingEmployeeId ? (
              <><Edit className="w-5 h-5 text-blue-600" /> Editar Empleado</>
            ) : (
              <><Shield className="w-5 h-5 text-blue-600" /> Nuevo Registro de Personal</>
            )}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={employeeForm.nombre}
                  onChange={e => setEmployeeForm({...employeeForm, nombre: e.target.value})}
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">No. Empleado</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={employeeForm.num_empleado}
                  onChange={e => setEmployeeForm({...employeeForm, num_empleado: e.target.value})}
                  placeholder="Ej. M-005"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Límite Semanal (Smart Lock)
                  <span className="ml-1 text-xs text-slate-400" title="Cantidad máxima de un mismo producto por semana antes de alerta">?</span>
                </label>
                <input 
                  type="number" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={employeeForm.limite_alerta_cantidad}
                  onChange={e => setEmployeeForm({...employeeForm, limite_alerta_cantidad: Number(e.target.value)})}
                />
              </div>
            </div>

            {/* Area Selection for New Employee */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Áreas Asignadas
              </label>
              <div className="text-xs text-slate-400 mb-2">Selecciona las áreas donde labora.</div>
              
              <div className="space-y-1 max-h-48 overflow-y-auto flex-1">
                {areas.length === 0 && <p className="text-xs text-slate-400 italic">No hay áreas registradas.</p>}
                {areas.map(area => (
                  <label key={area.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1.5 rounded">
                    <input 
                      type="checkbox" 
                      checked={employeeForm.areas_asignadas?.includes(area.nombre)}
                      onChange={() => toggleArea(area.nombre)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">{area.nombre}</span>
                  </label>
                ))}
              </div>
              <button onClick={() => setIsAreaManagerOpen(true)} className="text-xs text-blue-600 mt-2 hover:underline text-left">
                + Crear/Editar Áreas
              </button>
            </div>

            {/* Product Permissions */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Materiales Autorizados
                </label>
              </div>
              
              {/* Multi-Select Filters */}
              <div className="flex gap-1 mb-2 overflow-x-auto pb-1 no-scrollbar">
                 <button 
                  onClick={() => toggleCategoryFilter('ALL')}
                  className={`px-3 py-1 text-[10px] rounded-full whitespace-nowrap border transition-all ${productCategoryFilters.includes('ALL') ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Todos
                </button>
                {Object.values(Classification).map(c => (
                  <button 
                    key={c}
                    onClick={() => toggleCategoryFilter(c)}
                    className={`px-3 py-1 text-[10px] rounded-full whitespace-nowrap border transition-all ${productCategoryFilters.includes(c) ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="relative mb-2">
                <Search className="w-4 h-4 absolute left-2 top-1.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar..."
                  className="w-full pl-8 p-1 text-sm border border-slate-300 rounded bg-white"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] text-slate-400 font-medium">
                   {filteredProducts.length} visibles
                 </span>
                <button onClick={toggleAllFilteredProducts} className="text-xs text-blue-600 hover:underline font-medium">
                  {filteredProducts.length > 0 && filteredProducts.every(p => employeeForm.productos_permitidos?.includes(p.id)) ? 'Deseleccionar Visibles' : 'Seleccionar Visibles'}
                </button>
              </div>

              <div className="space-y-1 max-h-40 overflow-y-auto flex-1">
                {filteredProducts.map(prod => (
                  <label key={prod.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                    <input 
                      type="checkbox" 
                      checked={employeeForm.productos_permitidos?.includes(prod.id)}
                      onChange={() => toggleProduct(prod.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{prod.nombre}</p>
                      <p className="text-[10px] text-slate-400 truncate">{prod.clasificacion} - {prod.marca}</p>
                    </div>
                  </label>
                ))}
                {filteredProducts.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No hay productos.</p>}
              </div>
              <p className="text-xs text-slate-500 mt-2 text-right">
                {employeeForm.productos_permitidos?.length} seleccionados (Total)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              onClick={() => {
                setIsFormOpen(false);
                setEditingEmployeeId(null);
                setEmployeeForm(initialFormState);
              }}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveEmployee}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all hover:scale-105"
            >
              <Save className="w-4 h-4" /> {editingEmployeeId ? 'Actualizar Empleado' : 'Guardar Empleado'}
            </button>
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{emp.nombre}</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {emp.num_empleado}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleOpenEditForm(emp)} 
                  className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                  title="Editar Empleado"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => promptDeleteEmployee(emp)} 
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                  title="Eliminar Empleado"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Áreas Asignadas
                </p>
                <div className="flex flex-wrap gap-1">
                  {emp.areas_asignadas.length > 0 ? (
                    emp.areas_asignadas.map((area, idx) => (
                      <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                        {area}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">Sin asignación</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Package className="w-3 h-3" /> Permisos ({emp.productos_permitidos.length})
                </p>
                <div className="text-xs text-slate-600 h-16 overflow-hidden relative">
                   {emp.productos_permitidos.length > 0 ? (
                     <p>
                       {emp.productos_permitidos.slice(0, 5).map(pid => {
                         const p = products.find(prod => prod.id === pid);
                         return p ? p.nombre : pid;
                       }).join(', ')}
                       {emp.productos_permitidos.length > 5 && '...'}
                     </p>
                   ) : (
                     <p className="italic text-slate-400">Sin materiales autorizados</p>
                   )}
                   <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent"></div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>Límite Smart Lock:</span>
                <span className="font-bold text-slate-700">{emp.limite_alerta_cantidad} u/sem</span>
              </div>

              {/* View History Button */}
              <button 
                onClick={() => setHistoryEmployee(emp)}
                className="w-full mt-2 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <History className="w-4 h-4" /> Ver Historial
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Area Manager Modal */}
      {isAreaManagerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in zoom-in-95 flex flex-col max-h-[85vh]">
             <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
               <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                 <Settings className="w-5 h-5" /> Gestionar Áreas
               </h3>
               <button onClick={() => setIsAreaManagerOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50">
                <div className="mb-4 flex gap-2">
                   <input 
                    type="text" 
                    placeholder="Nombre de nueva área..."
                    className="flex-1 p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newAreaName}
                    onChange={e => setNewAreaName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddArea()}
                   />
                   <button 
                    onClick={handleAddArea}
                    disabled={!newAreaName.trim()}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     <Plus className="w-5 h-5" />
                   </button>
                </div>

                <div className="space-y-2">
                  {areas.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">No hay áreas configuradas.</p>}
                  {areas.map(area => (
                    <div key={area.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group">
                      {editingAreaId === area.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input 
                            type="text" 
                            autoFocus
                            className="flex-1 p-1.5 text-sm border border-blue-300 rounded outline-none"
                            value={tempAreaName}
                            onChange={e => setTempAreaName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') saveEditArea();
                                if (e.key === 'Escape') cancelEditArea();
                            }}
                          />
                          <button onClick={saveEditArea} className="text-green-600 hover:bg-green-50 p-1 rounded"><Check className="w-4 h-4" /></button>
                          <button onClick={cancelEditArea} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm font-medium text-slate-700">{area.nombre}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditArea(area)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => deleteArea(area.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
             </div>

             <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
               <p className="text-xs text-slate-500 text-center">
                 Nota: Renombrar un área actualizará automáticamente a los empleados asignados.
               </p>
             </div>
           </div>
        </div>
      )}

      {/* History Modal */}
      {historyEmployee && (() => {
         const empTransactions = getEmployeeTransactions(historyEmployee.id);
         return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-6 h-6 text-blue-600" /> 
                  Historial de Consumo
                </h3>
                <div className="flex items-center gap-3 mt-2">
                    <p className="text-slate-600 font-medium">
                    {historyEmployee.nombre} 
                    </p>
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                        {historyEmployee.num_empleado}
                    </span>
                     <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {empTransactions.length} Transacciones
                    </span>
                </div>
              </div>
              <button 
                onClick={() => setHistoryEmployee(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto p-6 flex-1">
              {empTransactions.length > 0 ? (
                <div className="overflow-hidden border border-slate-200 rounded-lg shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-4">Fecha</th>
                        <th className="p-3">Productos Entregados</th>
                        <th className="p-3 text-center">Cant. Total</th>
                        <th className="p-3">Detalles / Notas</th>
                        <th className="p-3 text-right pr-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {empTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 pl-4 text-slate-600 whitespace-nowrap">
                             <div className="flex flex-col">
                                <span className="font-medium text-slate-700">{new Date(t.fecha).toLocaleDateString()}</span>
                                <span className="text-xs text-slate-400">{new Date(t.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             </div>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              {t.productos_entregados.map((item, idx) => (
                                <div key={idx} className="flex items-center text-slate-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>
                                  <span className="font-medium mr-1">{item.nombre_producto}</span> 
                                  <span className="text-slate-500 text-xs bg-slate-100 px-1.5 py-0.5 rounded">x{item.cantidad}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                {t.productos_entregados.reduce((acc, curr) => acc + curr.cantidad, 0)}
                            </span>
                          </td>
                          <td className="p-3">
                             {t.notas_supervisor ? (
                                 <div className="text-xs text-slate-600 italic bg-yellow-50 p-2 rounded border border-yellow-100">
                                     "{t.notas_supervisor}"
                                 </div>
                             ) : <span className="text-slate-400 text-xs">-</span>}
                          </td>
                          <td className="p-3 text-right pr-4">
                             {t.bloqueo_activado ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                <Shield className="w-3 h-3 mr-1" /> Desbloqueado
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                <Check className="w-3 h-3 mr-1" /> Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <History className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-medium">No se encontraron transacciones recientes.</p>
                  <p className="text-sm">Este empleado no ha realizado solicitudes aún.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end">
              <button 
                onClick={() => setHistoryEmployee(null)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      );
    })()}

      {/* Delete Confirmation Modal for Employees */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar Empleado?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Estás a punto de eliminar a <span className="font-bold text-slate-700">{deleteConfirmation.name}</span>. 
                Se perderá su configuración de permisos y áreas.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmation({ isOpen: false, id: null, name: '' })} 
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDeleteEmployee} 
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Personnel;