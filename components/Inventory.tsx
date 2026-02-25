import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit, Save, X, Package, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { Product, Classification } from '../types';

interface ProductRowProps {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, onEdit, onDelete }) => {
  const prevStock = useRef(product.stock_actual);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {
    const diff = product.stock_actual - prevStock.current;
    
    // Only trigger animation if there is a difference
    if (diff !== 0) {
      setFlash(diff > 0 ? 'up' : 'down');
      setDelta(diff);
      prevStock.current = product.stock_actual;

      const timer = setTimeout(() => {
        setFlash(null);
        setDelta(null);
      }, 2000); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [product.stock_actual]);

  // Dynamic background based on stock change
  const bgClass = flash === 'up' ? 'bg-green-50' : flash === 'down' ? 'bg-red-50' : 'hover:bg-slate-50';

  return (
    <tr className={`transition-colors duration-500 border-b border-slate-100 ${bgClass}`}>
      <td className="p-4 font-semibold text-slate-800">{product.nombre}</td>
      <td className="p-4 text-slate-600">{product.marca}</td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium border
          ${product.clasificacion === Classification.CHEMICAL ? 'bg-purple-50 text-purple-700 border-purple-200' : 
            product.clasificacion === Classification.PAPER ? 'bg-orange-50 text-orange-700 border-orange-200' :
            product.clasificacion === Classification.PPE ? 'bg-green-50 text-green-700 border-green-200' :
            'bg-blue-50 text-blue-700 border-blue-200'}`}>
          {product.clasificacion}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2 relative w-fit">
          <span className={`font-bold transition-all duration-300 ${flash ? 'scale-110' : ''} ${product.stock_actual <= product.stock_minimo ? 'text-red-600' : 'text-slate-700'}`}>
            {product.stock_actual}
          </span>
          <span className="text-slate-400 text-xs">{product.unidad}</span>
          
          {/* Delta Indicator Animation */}
          {delta !== null && (
            <span className={`absolute -right-10 top-0 flex items-center text-xs font-bold animate-bounce ${delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {delta > 0 ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>}
              {Math.abs(delta)}
            </span>
          )}
        </div>
      </td>
      <td className="p-4 text-slate-500">{product.stock_minimo}</td>
      <td className="p-4 flex gap-2 justify-end">
        <button 
          onClick={() => onEdit(product)} 
          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          title="Editar"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onDelete(product)} 
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

interface InventoryProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const Inventory: React.FC<InventoryProps> = ({ products, setProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null, name: string}>({
    isOpen: false,
    id: null,
    name: ''
  });

  const initialFormState: Partial<Product> = {
    nombre: '',
    marca: '',
    unidad: 'Pieza',
    clasificacion: Classification.MATERIAL,
    stock_actual: 0,
    stock_minimo: 5
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);

  const openAddModal = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setFormData(product);
    setEditingId(product.id);
    setIsModalOpen(true);
  };

  const handleSaveProduct = () => {
    if (!formData.nombre || !formData.marca) return;
    
    if (editingId) {
      // Edit Mode
      setProducts(prev => prev.map(p => {
        if (p.id === editingId) {
          return {
            ...p,
            nombre: formData.nombre!,
            marca: formData.marca!,
            unidad: formData.unidad!,
            clasificacion: formData.clasificacion!,
            stock_actual: Number(formData.stock_actual),
            stock_minimo: Number(formData.stock_minimo)
          };
        }
        return p;
      }));
    } else {
      // Add Mode
      const product: Product = {
        id: Date.now().toString(),
        nombre: formData.nombre!,
        marca: formData.marca!,
        unidad: formData.unidad || 'Pieza',
        clasificacion: formData.clasificacion as Classification,
        stock_actual: Number(formData.stock_actual),
        stock_minimo: Number(formData.stock_minimo),
        fecha_ingreso: new Date().toISOString()
      };
      setProducts(prev => [...prev, product]);
    }

    setIsModalOpen(false);
  };

  const promptDelete = (product: Product) => {
    setDeleteModal({
      isOpen: true,
      id: product.id,
      name: product.nombre
    });
  };

  const confirmDelete = () => {
    if (deleteModal.id) {
      setProducts(prev => prev.filter(p => p.id !== deleteModal.id));
      setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Inventario</h2>
          <p className="text-slate-500 text-sm">Administra, edita y monitorea los materiales disponibles.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" /> Nuevo Producto
        </button>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-medium text-sm uppercase tracking-wider">
              <tr>
                <th className="p-4">Producto</th>
                <th className="p-4">Marca</th>
                <th className="p-4">Clasificación</th>
                <th className="p-4">Stock Actual</th>
                <th className="p-4">Stock Mínimo</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {products.map(product => (
                <ProductRow 
                  key={product.id} 
                  product={product} 
                  onEdit={openEditModal} 
                  onDelete={promptDelete} 
                />
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    No hay productos en el inventario.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-xl text-slate-800">
                {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto</label>
                <input 
                  autoFocus
                  placeholder="Ej. Cloro Concentrado" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                  <input 
                    placeholder="Ej. Clorox" 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.marca}
                    onChange={e => setFormData({...formData, marca: e.target.value})} 
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Unidad</label>
                   <input 
                    placeholder="Ej. Litros" 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.unidad}
                    onChange={e => setFormData({...formData, unidad: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Clasificación</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                  value={formData.clasificacion}
                  onChange={e => setFormData({...formData, clasificacion: e.target.value as Classification})}
                >
                  {Object.values(Classification).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Stock Actual</label>
                   <input 
                    type="number" 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.stock_actual}
                    onChange={e => setFormData({...formData, stock_actual: Number(e.target.value)})} 
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1 text-red-600">Alerta Mínimo</label>
                   <input 
                    type="number" 
                    className="w-full p-2 border border-red-200 bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" 
                    value={formData.stock_minimo}
                    onChange={e => setFormData({...formData, stock_minimo: Number(e.target.value)})} 
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex gap-3 justify-end">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveProduct} 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" /> {editingId ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">¿Eliminar Producto?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Estás a punto de eliminar <span className="font-bold text-slate-700">{deleteModal.name}</span>. 
                Esta acción no se puede deshacer y podría afectar el historial.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteModal({ isOpen: false, id: null, name: '' })} 
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete} 
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

export default Inventory;