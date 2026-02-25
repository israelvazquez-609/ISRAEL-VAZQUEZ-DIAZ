import { Area, Classification, Employee, Product, Transaction } from "../types";

export const INITIAL_AREAS: Area[] = [
  { id: '1', nombre: 'Salones' },
  { id: '2', nombre: 'Bodegas' },
  { id: '3', nombre: 'Oficinas' },
  { id: '4', nombre: 'Enfermería' },
  { id: '5', nombre: 'Canchas' },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    nombre: 'Cloro Concentrado',
    marca: 'Clorox',
    unidad: 'Litros',
    clasificacion: Classification.CHEMICAL,
    stock_actual: 50,
    stock_minimo: 10,
    fecha_ingreso: '2023-01-15'
  },
  {
    id: 'p2',
    nombre: 'Papel Higiénico Jumbo',
    marca: 'Kimberly Clark',
    unidad: 'Rollo',
    clasificacion: Classification.PAPER,
    stock_actual: 8,
    stock_minimo: 20, // Low stock example
    fecha_ingreso: '2023-02-10'
  },
  {
    id: 'p3',
    nombre: 'Limpiador Multiusos',
    marca: 'Fabuloso',
    unidad: 'Litros',
    clasificacion: Classification.CHEMICAL,
    stock_actual: 30,
    stock_minimo: 5,
    fecha_ingreso: '2023-03-01'
  },
  {
    id: 'p4',
    nombre: 'Guantes de Látex',
    marca: 'Ambiderm',
    unidad: 'Caja',
    clasificacion: Classification.PPE,
    stock_actual: 100,
    stock_minimo: 15,
    fecha_ingreso: '2023-01-20'
  },
    {
    id: 'p5',
    nombre: 'Trapeador Industrial',
    marca: 'Vileda',
    unidad: 'Pieza',
    clasificacion: Classification.MATERIAL,
    stock_actual: 12,
    stock_minimo: 5,
    fecha_ingreso: '2023-05-20'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'e1',
    nombre: 'Juan Pérez',
    num_empleado: 'M-001',
    areas_asignadas: ['Salones', 'Bodegas'],
    productos_permitidos: ['p1', 'p2', 'p3', 'p5'],
    limite_alerta_cantidad: 10 // Smart Lock Limit
  },
  {
    id: 'e2',
    nombre: 'Maria González',
    num_empleado: 'M-002',
    areas_asignadas: ['Enfermería', 'Oficinas'],
    productos_permitidos: ['p1', 'p3', 'p4'],
    limite_alerta_cantidad: 5
  }
];

// Helper to generate some history for testing Smart Lock
const today = new Date();
const lastWeek = new Date(today);
lastWeek.setDate(today.getDate() - 7);

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    empleado_id: 'e1',
    empleado_nombre: 'Juan Pérez',
    fecha: lastWeek.toISOString(),
    productos_entregados: [{ producto_id: 'p1', cantidad: 12, nombre_producto: 'Cloro Concentrado' }], // Over limit last week
    bloqueo_activado: true,
    desbloqueo_supervisor: true,
    notas_supervisor: "Limpieza profunda autorizada"
  }
];