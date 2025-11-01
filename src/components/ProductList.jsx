import { useState, useEffect } from 'react';
import { productosDB, registrarProduccion } from '../db';
import DataManager from './DataManager';

function ProductList() {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    stock: 0
  });
  const [produccionData, setProduccionData] = useState({
    productoId: null,
    cantidad: ''
  });
  const [filtros, setFiltros] = useState({
    busqueda: '',
    categoria: 'todas',
    coleccion: 'todas'
  });

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    const data = await productosDB.getAll();
    setProductos(data);
    setProductosFiltrados(data);
  };

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, productos]);

  const aplicarFiltros = () => {
    let filtered = [...productos];

    // Filtro de búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      filtered = filtered.filter(p => 
        p.nombre?.toLowerCase().includes(busqueda) ||
        p.codigo?.toLowerCase().includes(busqueda) ||
        p.categoria?.toLowerCase().includes(busqueda)
      );
    }

    // Filtro por categoría
    if (filtros.categoria !== 'todas') {
      filtered = filtered.filter(p => p.categoria === filtros.categoria);
    }

    // Filtro por colección
    if (filtros.coleccion !== 'todas') {
      filtered = filtered.filter(p => p.coleccion === filtros.coleccion);
    }

    setProductosFiltrados(filtered);
  };

  const getCategorias = () => {
    const cats = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
    return cats.sort();
  };

  const getColecciones = () => {
    const cols = [...new Set(productos.map(p => p.coleccion).filter(Boolean))];
    return cols.sort();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await productosDB.update(editingId, formData);
      } else {
        await productosDB.add({
          ...formData,
          precio: parseFloat(formData.precio),
          stock: parseInt(formData.stock) || 0
        });
      }
      resetForm();
      loadProductos();
    } catch (error) {
      console.error('Error guardando producto:', error);
    }
  };

  const handleEdit = (producto) => {
    setEditingId(producto.id);
    setFormData({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio,
      stock: producto.stock
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este producto?')) {
      await productosDB.delete(id);
      loadProductos();
    }
  };

  const handleProduccion = async (e) => {
    e.preventDefault();
    try {
      await registrarProduccion(
        produccionData.productoId,
        parseInt(produccionData.cantidad)
      );
      setProduccionData({ productoId: null, cantidad: '' });
      loadProductos();
      alert('Producción registrada correctamente');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', categoria: '', precio: '', stock: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="product-list">
      <div className="section-header">
        <h2>Productos</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancelar' : '+ Nuevo Producto'}
        </button>
      </div>

      <DataManager onDataImported={loadProductos} />

      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, código o categoría..."
            value={filtros.busqueda}
            onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
            className="search-input"
          />
        </div>
        <div className="filter-selects">
          <select
            value={filtros.categoria}
            onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
            className="filter-select"
          >
            <option value="todas">Todas las categorías</option>
            {getCategorias().map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filtros.coleccion}
            onChange={(e) => setFiltros({ ...filtros, coleccion: e.target.value })}
            className="filter-select"
          >
            <option value="todas">Todas las colecciones</option>
            {getColecciones().map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          {(filtros.busqueda || filtros.categoria !== 'todas' || filtros.coleccion !== 'todas') && (
            <button
              onClick={() => setFiltros({ busqueda: '', categoria: 'todas', coleccion: 'todas' })}
              className="btn-clear-filters"
            >
              ✖ Limpiar filtros
            </button>
          )}
        </div>
        <p className="filter-results">
          Mostrando {productosFiltrados.length} de {productos.length} productos
        </p>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-field">
            <label>Nombre del Producto *</label>
            <input
              type="text"
              placeholder="Ej: Anillo de plata"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label>Categoría / Tipo</label>
            <input
              type="text"
              placeholder="Ej: Anillo, Collar, Pulsera"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label>Precio (€) *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label>Stock Inicial</label>
            <input
              type="number"
              placeholder="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary btn-form-submit">
            {editingId ? '✔️ Actualizar Producto' : '➕ Crear Producto'}
          </button>
        </form>
      )}

      <div className="products-grid">
        {productosFiltrados.map((producto) => (
          <div key={producto.id} className="product-card">
            <div className="product-info">
              <h3>{producto.nombre}</h3>
              <p className="categoria">{producto.categoria}</p>
              <p className="precio">{producto.precio?.toFixed(2)} €</p>
              <p className="stock">
                Stock: <strong>{producto.stock || 0}</strong> unidades
              </p>
            </div>
            <div className="product-actions">
              <button onClick={() => handleEdit(producto)} className="btn-edit">
                Editar
              </button>
              <button onClick={() => handleDelete(producto.id)} className="btn-delete">
                Eliminar
              </button>
              <button
                onClick={() => setProduccionData({ productoId: producto.id, cantidad: '' })}
                className="btn-secondary"
              >
                + Producción
              </button>
            </div>
          </div>
        ))}
      </div>

      {produccionData.productoId && (
        <div className="modal">
          <div className="modal-content">
            <h3>Registrar Producción</h3>
            <p className="modal-subtitle">
              {productos.find(p => p.id === produccionData.productoId)?.nombre}
            </p>
            
            <div className="produccion-quick-buttons">
              <button
                type="button"
                onClick={() => {
                  setProduccionData({ ...produccionData, cantidad: '1' });
                  setTimeout(() => {
                    handleProduccion({ preventDefault: () => {} });
                  }, 0);
                }}
                className="btn-quick"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => {
                  setProduccionData({ ...produccionData, cantidad: '5' });
                  setTimeout(() => {
                    handleProduccion({ preventDefault: () => {} });
                  }, 0);
                }}
                className="btn-quick"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => {
                  setProduccionData({ ...produccionData, cantidad: '10' });
                  setTimeout(() => {
                    handleProduccion({ preventDefault: () => {} });
                  }, 0);
                }}
                className="btn-quick"
              >
                +10
              </button>
            </div>

            <div className="divider-text">o cantidad personalizada</div>

            <form onSubmit={handleProduccion}>
              <input
                type="number"
                placeholder="Cantidad producida"
                value={produccionData.cantidad}
                onChange={(e) => setProduccionData({ ...produccionData, cantidad: e.target.value })}
                min="1"
              />
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Registrar</button>
                <button
                  type="button"
                  onClick={() => setProduccionData({ productoId: null, cantidad: '' })}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;
