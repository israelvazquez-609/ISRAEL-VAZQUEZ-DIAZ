
export enum Role {
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN'
}

export enum Classification {
  MATERIAL = 'Materiales',
  CHEMICAL = 'Químicos',
  PAPER = 'Papel',
  PPE = 'EPP'
}

export interface Area {
  id: string;
  nombre: string;
}

export interface Product {
  id: string;
  nombre: string;
  marca: string;
  unidad: string;
  clasificacion: Classification;
  stock_actual: number;
  stock_minimo: number;
  fecha_ingreso: string;
}

export interface Employee {
  id: string;
  nombre: string;
  num_empleado: string;
  areas_asignadas: string[];
  productos_permitidos: string[];
  limite_alerta_cantidad: number;
}

export interface TransactionItem {
  producto_id: string;
  cantidad: number;
  nombre_producto: string;
}

export interface Transaction {
  id: string;
  empleado_id: string;
  empleado_nombre: string;
  fecha: string;
  productos_entregados: TransactionItem[];
  bloqueo_activado: boolean;
  desbloqueo_supervisor: boolean;
  notas_supervisor?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  sources?: { title: string; uri: string }[];
}

export interface AppConfig {
  masterPassword: string;
  supervisorPin: string;
}
