import Dexie from 'dexie';
import { getFirebaseDatabase, isFirebaseConfigured } from './firebaseClient';
import { ref, get, set, update, remove, push, query, orderByChild, startAt, endAt } from 'firebase/database';

// IndexedDB local (fallback)
export const db = new Dexie('InventarioAntorcaDB');

db.version(2).stores({
  productos: '++id, nombre, categoria, precio, stock, imagen, createdAt',
  ventas: '++id, productoId, cantidad, precioVenta, fecha, tipo, metodoPago',
  caja: '++id, fecha, tipo, monto, descripcion, ventaId, metodoPago'
});

// Helper para convertir nombres de columnas (camelCase <-> snake_case)
const toSnakeCase = (obj) => {
  const result = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = obj[key];
  }
  return result;
};

const toCamelCase = (obj) => {
  const result = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
};

// Helpers Firebase <-> modelo local
const firebaseProductosPath = 'productos';
const firebaseVentasPath = 'ventas';
const firebaseCajaPath = 'caja';

const getRTDB = () => {
  if (!isFirebaseConfigured()) return null;
  return getFirebaseDatabase();
};

// Funciones helper para productos (híbrido Firebase + IndexedDB)
export const productosDB = {
  async getAll() {
    const rtdb = getRTDB();
    if (rtdb) {
      try {
        const snapshot = await get(query(ref(rtdb, firebaseProductosPath), orderByChild('created_at')));
        const val = snapshot.val();
        if (val) {
          const productos = Object.entries(val).map(([id, p]) => ({ id, ...toCamelCase(p) }));
          // ordenamos por created_at desc
          return productos.sort((a, b) => (b.createdAt || b.created_at || '').localeCompare(a.createdAt || a.created_at || ''));
        }
      } catch (error) {
        console.warn('Firebase error, usando IndexedDB local:', error);
      }
    }
    return await db.productos.toArray();
  },
  
  async add(producto) {
    const nowISO = new Date().toISOString();
    const rtdb = getRTDB();
    if (rtdb) {
      try {
        const productosRef = ref(rtdb, firebaseProductosPath);
        const newRef = push(productosRef);
        const productoData = { ...toSnakeCase(producto), created_at: nowISO };
        await set(newRef, productoData);
        const newId = newRef.key;
        // también guardamos en IndexedDB para modo offline
        await db.productos.add({ ...producto, createdAt: nowISO, id: newId });
        return newId;
      } catch (error) {
        console.warn('Firebase error, usando IndexedDB local:', error);
      }
    }
    return await db.productos.add({ ...producto, createdAt: nowISO });
  },
  
  async update(id, producto) {
    const rtdb = getRTDB();
    if (rtdb && id != null) {
      try {
        const productoRef = ref(rtdb, `${firebaseProductosPath}/${id}`);
        const productoData = { ...toSnakeCase(producto), updated_at: new Date().toISOString() };
        await update(productoRef, productoData);
        await db.productos.update(id, producto);
        return;
      } catch (error) {
        console.warn('Firebase error, usando IndexedDB local:', error);
      }
    }
    return await db.productos.update(id, producto);
  },
  
  async delete(id) {
    const rtdb = getRTDB();
    if (rtdb && id != null) {
      try {
        const productoRef = ref(rtdb, `${firebaseProductosPath}/${id}`);
        await remove(productoRef);
        await db.productos.delete(id);
        return;
      } catch (error) {
        console.warn('Firebase error, usando IndexedDB local:', error);
      }
    }
    return await db.productos.delete(id);
  },
  
  async getById(id) {
    const rtdb = getRTDB();
    if (rtdb && id != null) {
      try {
        const productoRef = ref(rtdb, `${firebaseProductosPath}/${id}`);
        const snapshot = await get(productoRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          return { id, ...toCamelCase(data) };
        }
      } catch (error) {
        console.warn('Firebase error, usando IndexedDB local:', error);
      }
    }
    return await db.productos.get(id);
  },
  
  async updateStock(id, cantidad) {
    const producto = await this.getById(id);
    if (producto) {
      const nuevoStock = (parseInt(producto.stock) || 0) + cantidad;
      return await this.update(id, { stock: nuevoStock });
    }
  }
};

// Funciones helper para ventas (híbrido Firebase + IndexedDB)
export const ventasDB = {
  async getAll() {
    const rtdb = getRTDB();
    if (rtdb) {
      try {
        const snapshot = await get(query(ref(rtdb, firebaseVentasPath), orderByChild('fecha')));
        const val = snapshot.val();
        if (val) {
          const ventas = Object.entries(val).map(([id, v]) => ({ id, ...toCamelCase(v) }));
          return ventas.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
        }
      } catch (error) {
        console.warn('Firebase error, usando IndexedDB local:', error);
      }
    }
    return await db.ventas.orderBy('fecha').reverse().toArray();
  },
  
  async add(venta) {
    const fecha = new Date().toISOString();
    const rtdb = getRTDB();
    if (rtdb) {
      try {
        const ventasRef = ref(rtdb, firebaseVentasPath);
        const newRef = push(ventasRef);
        const ventaData = { ...toSnakeCase(venta), fecha };
        await set(newRef, ventaData);
        const newId = newRef.key;
        await db.ventas.add({ ...venta, fecha, id: newId });
        return newId;
      } catch (error) {
        console.warn('Firebase error, usando IndexedDB local:', error);
      }
    }
    return await db.ventas.add({ ...venta, fecha });
  },
  
  async getByFecha(fecha) {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);
    
    const rtdb = getRTDB();
    if (rtdb) {
      try {
        const q = query(
          ref(rtdb, firebaseVentasPath),
          orderByChild('fecha'),
          startAt(startOfDay.toISOString()),
          endAt(endOfDay.toISOString())
        );
        const snapshot = await get(q);
        const val = snapshot.val();
        if (val) {
          return Object.entries(val).map(([id, v]) => ({ id, ...toCamelCase(v) }));
        }
      } catch (error) {
        console.warn('Firebase error, usando IndexedDB local:', error);
      }
    }
    return await db.ventas.where('fecha').between(startOfDay.toISOString(), endOfDay.toISOString()).toArray();
  }
};

// Funciones helper para caja (híbrido Firebase + IndexedDB)
export const cajaDB = {
  async getAll() {
    const rtdb = getRTDB();
    if (rtdb) {
      try {
        const snapshot = await get(query(ref(rtdb, firebaseCajaPath), orderByChild('fecha')));
        const val = snapshot.val();
        if (val) {
          const movimientos = Object.entries(val).map(([id, m]) => ({ id, ...toCamelCase(m) }));
          return movimientos.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
        }
      } catch (error) {
        console.warn('Firebase error, usando IndexedDB local:', error);
      }
    }
    return await db.caja.orderBy('fecha').reverse().toArray();
  },
  
  async add(movimiento) {
    const fecha = new Date().toISOString();
    const rtdb = getRTDB();
    if (rtdb) {
      try {
        const cajaRef = ref(rtdb, firebaseCajaPath);
        const newRef = push(cajaRef);
        const cajaData = { ...toSnakeCase(movimiento), fecha };
        await set(newRef, cajaData);
        const newId = newRef.key;
        await db.caja.add({ ...movimiento, fecha, id: newId });
        return newId;
      } catch (error) {
        console.warn('Firebase error, usando IndexedDB local:', error);
      }
    }
    return await db.caja.add({ ...movimiento, fecha });
  },
  
  async getBalance() {
    const movimientos = await this.getAll();
    return movimientos.reduce((total, mov) => {
      const monto = parseFloat(mov.monto) || 0;
      return mov.tipo === 'ingreso' ? total + monto : total - monto;
    }, 0);
  },
  
  async getBalanceByFecha(fecha) {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);
    
    const rtdb = getRTDB();
    if (rtdb) {
      try {
        const q = query(
          ref(rtdb, firebaseCajaPath),
          orderByChild('fecha'),
          startAt(startOfDay.toISOString()),
          endAt(endOfDay.toISOString())
        );
        const snapshot = await get(q);
        const val = snapshot.val();
        if (val) {
          const movimientos = Object.entries(val).map(([id, m]) => ({ id, ...toCamelCase(m) }));
          return movimientos.reduce((total, mov) => {
            const monto = parseFloat(mov.monto) || 0;
            return mov.tipo === 'ingreso' ? total + monto : total - monto;
          }, 0);
        }
      } catch (error) {
        console.warn('Firebase error, usando IndexedDB local:', error);
      }
    }
    
    const movimientos = await db.caja.where('fecha').between(startOfDay.toISOString(), endOfDay.toISOString()).toArray();
    return movimientos.reduce((total, mov) => {
      const monto = parseFloat(mov.monto) || 0;
      return mov.tipo === 'ingreso' ? total + monto : total - monto;
    }, 0);
  }
};

// Función para registrar una venta completa (actualiza stock, caja y ventas)
export const registrarVenta = async (productoId, cantidad, precioVenta, metodoPago = 'efectivo') => {
  try {
    const producto = await productosDB.getById(productoId);
    
    if (!producto) {
      throw new Error('Producto no encontrado');
    }
    
    if (producto.stock < cantidad) {
      throw new Error('Stock insuficiente');
    }
    
    // Registrar venta
    const ventaId = await ventasDB.add({
      productoId,
      cantidad,
      precioVenta,
      tipo: 'venta',
      metodoPago
    });
    
    // Actualizar stock
    await productosDB.updateStock(productoId, -cantidad);
    
    // Registrar en caja
    await cajaDB.add({
      tipo: 'ingreso',
      monto: precioVenta * cantidad,
      descripcion: `Venta: ${producto.nombre} x${cantidad}`,
      ventaId,
      metodoPago
    });
    
    return ventaId;
  } catch (error) {
    console.error('Error al registrar venta:', error);
    throw error;
  }
};

// Función para registrar producción (aumenta stock)
export const registrarProduccion = async (productoId, cantidad) => {
  try {
    await productosDB.updateStock(productoId, cantidad);
    
    const producto = await productosDB.getById(productoId);
    await ventasDB.add({
      productoId,
      cantidad,
      precioVenta: 0,
      tipo: 'produccion'
    });
    
    return true;
  } catch (error) {
    console.error('Error al registrar producción:', error);
    throw error;
  }
};
