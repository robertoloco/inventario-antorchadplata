-- Script SQL para crear las tablas en Supabase
-- Ejecuta este script en el SQL Editor de Supabase

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id BIGSERIAL PRIMARY KEY,
  codigo TEXT,
  nombre TEXT NOT NULL,
  categoria TEXT,
  coleccion TEXT,
  tamano TEXT,
  precio NUMERIC(10, 2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  imagen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
  id BIGSERIAL PRIMARY KEY,
  producto_id BIGINT REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL,
  precio_venta NUMERIC(10, 2) NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  tipo TEXT NOT NULL, -- 'venta' o 'produccion'
  metodo_pago TEXT DEFAULT 'efectivo', -- 'efectivo' o 'tarjeta'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de caja (movimientos)
CREATE TABLE IF NOT EXISTS caja (
  id BIGSERIAL PRIMARY KEY,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  tipo TEXT NOT NULL, -- 'ingreso' o 'egreso'
  monto NUMERIC(10, 2) NOT NULL,
  descripcion TEXT,
  venta_id BIGINT REFERENCES ventas(id) ON DELETE SET NULL,
  metodo_pago TEXT DEFAULT 'efectivo', -- 'efectivo' o 'tarjeta'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_coleccion ON productos(coleccion);
CREATE INDEX IF NOT EXISTS idx_ventas_producto_id ON ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_tipo ON ventas(tipo);
CREATE INDEX IF NOT EXISTS idx_caja_fecha ON caja(fecha);
CREATE INDEX IF NOT EXISTS idx_caja_tipo ON caja(tipo);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (puedes ajustarlas según necesites autenticación)
-- IMPORTANTE: Estas políticas permiten acceso público. 
-- Si quieres seguridad, configura autenticación y modifica las políticas.

CREATE POLICY "Enable read access for all users" ON productos
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON productos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON productos
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON productos
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON ventas
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON ventas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON ventas
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON ventas
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON caja
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON caja
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON caja
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON caja
  FOR DELETE USING (true);
