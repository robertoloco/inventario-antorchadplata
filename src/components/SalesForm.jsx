import { useState, useEffect } from 'react';
import { productosDB, registrarVenta, ventasDB } from '../db';

function SalesForm() {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [formData, setFormData] = useState({
    productoId: '',
    cantidad: '1',
    precioVenta: ''
  });
  const [busquedaProducto, setBusquedaProducto] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const prods = await productosDB.getAll();
    setProductos(prods);
    
    const vents = await ventasDB.getAll();
    const ventasConProducto = await Promise.all(
      vents.map(async (venta) => {
        const producto = await productosDB.getById(venta.productoId);
        return { ...venta, producto };
      })
    );
    setVentas(ventasConProducto.filter(v => v.tipo === 'venta'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registrarVenta(
        parseInt(formData.productoId),
        parseInt(formData.cantidad),
        parseFloat(formData.precioVenta)
      );
      setFormData({ productoId: '', cantidad: '1', precioVenta: '' });
      loadData();
      alert('Venta registrada correctamente');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleProductoChange = (productoId) => {
    const producto = productos.find(p => p.id === parseInt(productoId));
    setFormData({
      productoId,
      cantidad: '1',
      precioVenta: producto ? producto.precio : ''
    });
    setBusquedaProducto(''); // Limpiar búsqueda al seleccionar
  };

  const productosFiltrados = productos.filter(p => {
    if (!busquedaProducto) return true;
    const busqueda = busquedaProducto.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(busqueda) ||
      p.codigo?.toLowerCase().includes(busqueda) ||
      p.categoria?.toLowerCase().includes(busqueda)
    );
  });

  return (
    <div className="sales-form">
      <h2>Registrar Venta</h2>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
          <label>🔍 Buscar producto</label>
          <input
            type="text"
            placeholder="Buscar por nombre, código o categoría..."
            value={busquedaProducto}
            onChange={(e) => setBusquedaProducto(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="form-field">
          <label>Producto *</label>
          <select
            value={formData.productoId}
            onChange={(e) => handleProductoChange(e.target.value)}
            required
          >
            <option value="">Seleccionar producto</option>
            {productosFiltrados.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre} (Stock: {producto.stock})
              </option>
            ))}
          </select>
          {busquedaProducto && productosFiltrados.length === 0 && (
            <p className="no-results">No se encontraron productos</p>
          )}
        </div>

        <div className="form-field">
          <label>Cantidad *</label>
          <input
            type="number"
            placeholder="1"
            value={formData.cantidad}
            onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
            required
            min="1"
          />
        </div>

        <div className="form-field">
          <label>Precio de venta (€) *</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.precioVenta}
            onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="btn-primary btn-form-submit">
          💸 Registrar Venta
        </button>
      </form>

      <div className="ventas-list">
        <h3>Últimas Ventas</h3>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((venta) => (
              <tr key={venta.id}>
                <td>{new Date(venta.fecha).toLocaleDateString()}</td>
                <td>{venta.producto?.nombre || 'N/A'}</td>
                <td>{venta.cantidad}</td>
                <td>{venta.precioVenta.toFixed(2)} €</td>
                <td>{(venta.cantidad * venta.precioVenta).toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SalesForm;
