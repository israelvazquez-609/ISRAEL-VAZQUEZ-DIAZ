
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  getDoc,
  onSnapshot, 
  writeBatch,
  query,
  increment,
  limit
} from "firebase/firestore";
import { dbFirestore } from "./firebaseConfig";
import { Area, Employee, Product, Transaction, AppConfig } from "../types";
import { INITIAL_AREAS, INITIAL_EMPLOYEES, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS } from "./mockData";

const COLLECTIONS = {
  PRODUCTS: 'products',
  EMPLOYEES: 'employees',
  AREAS: 'areas',
  TRANSACTIONS: 'transactions',
  CONFIG: 'config'
};

const LOCAL_KEYS = {
  PRODUCTS: 'smartmaint_products',
  EMPLOYEES: 'smartmaint_employees',
  AREAS: 'smartmaint_areas',
  TRANSACTIONS: 'smartmaint_transactions',
  CONFIG: 'smartmaint_config'
};

const DB_CHANNEL = new BroadcastChannel('smartmaint_cloud_sync');

type DataEventType = 'UPDATE_PRODUCTS' | 'UPDATE_EMPLOYEES' | 'UPDATE_AREAS' | 'UPDATE_TRANSACTIONS' | 'UPDATE_CONFIG';

interface DBEvent {
  type: DataEventType;
  payload: any;
}

class DatabaseService {
  private subscribers: Function[] = [];
  private unsubscribeListeners: Function[] = [];
  public isCloudActive = false;

  constructor() {
    DB_CHANNEL.onmessage = (event) => {
      this.notifySubscribers(event.data.type, event.data.payload);
    };
  }

  async initialize(): Promise<{
    products: Product[];
    employees: Employee[];
    areas: Area[];
    transactions: Transaction[];
    config: AppConfig;
  }> {
    const defaultConfig: AppConfig = { masterPassword: 'admin123', supervisorPin: '1234' };
    
    // CARGA INICIAL: Siempre empezamos con lo que hay en el dispositivo para velocidad y offline
    const local = this.loadLocalData();
    const localConfig = this.loadLocalConfig() || defaultConfig;

    try {
      // Intentamos conectar a la nube con un timeout corto
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 3000)
      );
      
      const connectionTest = getDocs(query(collection(dbFirestore, COLLECTIONS.PRODUCTS), limit(1)));
      await Promise.race([connectionTest, timeoutPromise]);

      this.isCloudActive = true;
      console.log("✅ Conexión con la Nube establecida");
      
      // Si la nube está vacía, la sembramos con los datos actuales del local
      await this.seedDatabaseIfEmpty(localConfig);

      // Los listeners de Firestore se encargarán de actualizar el estado si hay cambios en otros dispositivos
      this.setupFirestoreListeners();

      return { ...local, config: localConfig };

    } catch (error) {
      console.warn("⚠️ Modo Local Persistente Activado:", error);
      this.isCloudActive = false;
      return { ...local, config: localConfig };
    }
  }

  private loadLocalConfig(): AppConfig | null {
    const saved = localStorage.getItem(LOCAL_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : null;
  }

  subscribe(callback: (event: DBEvent) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(type: DataEventType, payload: any) {
    this.subscribers.forEach(cb => cb({ type, payload }));
  }

  private async seedDatabaseIfEmpty(defaultConfig: AppConfig) {
    try {
      const snapshot = await getDocs(collection(dbFirestore, COLLECTIONS.PRODUCTS));
      if (!snapshot.empty) return;

      const batch = writeBatch(dbFirestore);
      const data = this.loadLocalData();
      
      data.products.forEach(p => batch.set(doc(dbFirestore, COLLECTIONS.PRODUCTS, p.id), p));
      data.employees.forEach(e => batch.set(doc(dbFirestore, COLLECTIONS.EMPLOYEES, e.id), e));
      data.areas.forEach(a => batch.set(doc(dbFirestore, COLLECTIONS.AREAS, a.id), a));
      data.transactions.forEach(t => batch.set(doc(dbFirestore, COLLECTIONS.TRANSACTIONS, t.id), t));
      batch.set(doc(dbFirestore, COLLECTIONS.CONFIG, 'security'), defaultConfig);
      await batch.commit();
    } catch (e) {
      console.error("Error al sembrar datos:", e);
    }
  }

  private setupFirestoreListeners() {
    if (this.unsubscribeListeners.length > 0) return;

    const attachListener = (colName: string, eventType: DataEventType, docId?: string) => {
      const ref = docId ? doc(dbFirestore, colName, docId) : collection(dbFirestore, colName);
      const unsub = onSnapshot(ref as any, (snapshot: any) => {
        const data = docId ? snapshot.data() : snapshot.docs.map((d: any) => d.data());
        if (data) {
          // Guardamos siempre una copia local de lo que viene de la nube
          const localKey = LOCAL_KEYS[eventType.replace('UPDATE_', '') as keyof typeof LOCAL_KEYS];
          localStorage.setItem(localKey, JSON.stringify(data));
          this.notifySubscribers(eventType, data);
        }
      });
      return unsub;
    };

    this.unsubscribeListeners.push(
      attachListener(COLLECTIONS.PRODUCTS, 'UPDATE_PRODUCTS'),
      attachListener(COLLECTIONS.EMPLOYEES, 'UPDATE_EMPLOYEES'),
      attachListener(COLLECTIONS.AREAS, 'UPDATE_AREAS'),
      attachListener(COLLECTIONS.TRANSACTIONS, 'UPDATE_TRANSACTIONS'),
      attachListener(COLLECTIONS.CONFIG, 'UPDATE_CONFIG', 'security')
    );
  }

  private loadLocalData() {
    const load = (key: string, fallback: any) => {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
      // Si no hay nada, guardamos el fallback por primera vez para persistirlo
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    };
    return {
      products: load(LOCAL_KEYS.PRODUCTS, INITIAL_PRODUCTS),
      employees: load(LOCAL_KEYS.EMPLOYEES, INITIAL_EMPLOYEES),
      areas: load(LOCAL_KEYS.AREAS, INITIAL_AREAS),
      transactions: load(LOCAL_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS)
    };
  }

  private saveBoth(key: string, data: any, type: DataEventType, cloudAction: () => Promise<void>) {
    // 1. Guardado Local Inmediato (Siempre funciona)
    localStorage.setItem(key, JSON.stringify(data));
    this.notifySubscribers(type, data);
    DB_CHANNEL.postMessage({ type, payload: data });

    // 2. Guardado en Nube (Si está disponible)
    if (this.isCloudActive) {
      cloudAction().catch(err => console.error("Error guardando en nube:", err));
    }
  }

  async saveConfig(config: AppConfig) {
    this.saveBoth(LOCAL_KEYS.CONFIG, config, 'UPDATE_CONFIG', async () => {
      await setDoc(doc(dbFirestore, COLLECTIONS.CONFIG, 'security'), config);
    });
  }

  async saveProducts(products: Product[]) {
    this.saveBoth(LOCAL_KEYS.PRODUCTS, products, 'UPDATE_PRODUCTS', async () => {
      const batch = writeBatch(dbFirestore);
      products.forEach(p => batch.set(doc(dbFirestore, COLLECTIONS.PRODUCTS, p.id), p, { merge: true }));
      await batch.commit();
    });
  }

  async saveEmployees(employees: Employee[]) {
    this.saveBoth(LOCAL_KEYS.EMPLOYEES, employees, 'UPDATE_EMPLOYEES', async () => {
      const batch = writeBatch(dbFirestore);
      employees.forEach(e => batch.set(doc(dbFirestore, COLLECTIONS.EMPLOYEES, e.id), e, { merge: true }));
      await batch.commit();
    });
  }

  async saveAreas(areas: Area[]) {
    this.saveBoth(LOCAL_KEYS.AREAS, areas, 'UPDATE_AREAS', async () => {
      const batch = writeBatch(dbFirestore);
      areas.forEach(a => batch.set(doc(dbFirestore, COLLECTIONS.AREAS, a.id), a, { merge: true }));
      await batch.commit();
    });
  }

  async addTransaction(transaction: Transaction) {
    const current = JSON.parse(localStorage.getItem(LOCAL_KEYS.TRANSACTIONS) || '[]');
    const next = [transaction, ...current];
    
    this.saveBoth(LOCAL_KEYS.TRANSACTIONS, next, 'UPDATE_TRANSACTIONS', async () => {
      await setDoc(doc(dbFirestore, COLLECTIONS.TRANSACTIONS, transaction.id), transaction);
    });
  }

  async updateProductStock(items: { id: string; qty: number }[]) {
    const products = JSON.parse(localStorage.getItem(LOCAL_KEYS.PRODUCTS) || '[]');
    items.forEach(item => {
      const p = products.find((x: any) => x.id === item.id);
      if (p) p.stock_actual = Math.max(0, p.stock_actual - item.qty);
    });

    this.saveBoth(LOCAL_KEYS.PRODUCTS, products, 'UPDATE_PRODUCTS', async () => {
      const batch = writeBatch(dbFirestore);
      items.forEach(item => {
        const ref = doc(dbFirestore, COLLECTIONS.PRODUCTS, item.id);
        batch.update(ref, { stock_actual: increment(-item.qty) });
      });
      await batch.commit();
    });
  }
}

export const db = new DatabaseService();
