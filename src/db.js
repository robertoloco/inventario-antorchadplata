import Dexie from 'dexie';

export const db = new Dexie('InventarioAntorcaDB');

db.version(2).stores({
  productos: '++id, nombre, categoria, precio, stock, imagen, createdAt',
  ventas: '++id, productoId, cantidad, precioVenta, fecha, tipo, metodoPago',
  caja: '++id, fecha, tipo, monto, descripcion, ventaId, metodoPago'
});

// Funciones helper para productos
export const productosDB = {
  async getAll() {
    return await db.productos.toArray();
  },
  
  async add(producto) {
    return await db.productos.add({
      ...producto,
      createdAt: new Date().toISOString()
    });
  },
  
  async update(id, producto) {
    return await db.productos.update(id, producto);
  },
  
  async delete(id) {
    return await db.productos.delete(id);
  },
  
  async getById(id) {
    return await db.productos.get(id);
  },
  
  async updateStock(id, cantidad) {
    const producto = await db.productos.get(id);
    if (producto) {
      return await db.productos.update(id, {
        stock: producto.stock + cantidad
      });
    }
  }
};

// Funciones helper para ventas
export const ventasDB = {
  async getAll() {
    return await db.ventas.orderBy('fecha').reverse().toArray();
  },
  
  async add(venta) {
    return await db.ventas.add({
      ...venta,
      fecha: new Date().toISOString()
    });
  },
  
  async getByFecha(fecha) {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db.ventas
      .where('fecha')
      .between(startOfDay.toISOString(), endOfDay.toISOString())
      .toArray();
  }
};

// Funciones helper para caja
export const cajaDB = {
  async getAll() {
    return await db.caja.orderBy('fecha').reverse().toArray();
  },
  
  async add(movimiento) {
    return await db.caja.add({
      ...movimiento,
      fecha: new Date().toISOString()
    });
  },
  
  async getBalance() {
    const movimientos = await db.caja.toArray();
    return movimientos.reduce((total, mov) => {
      return mov.tipo === 'ingreso' ? total + mov.monto : total - mov.monto;
    }, 0);
  },
  
  async getBalanceByFecha(fecha) {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);
    
    const movimientos = await db.caja
      .where('fecha')
      .between(startOfDay.toISOString(), endOfDay.toISOString())
      .toArray();
    
    return movimientos.reduce((total, mov) => {
      return mov.tipo === 'ingreso' ? total + mov.monto : total - mov.monto;
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
