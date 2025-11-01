import { createClient } from '@supabase/supabase-js';

// Estas variables se deben configurar en las variables de entorno
// o directamente aquí (para desarrollo)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yjcpxtnkfbrawoqrfcan.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqY3B4dG5rZmJyYXdvcXJmY2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTU4MDcsImV4cCI6MjA3NzU5MTgwN30.BFQ3c0kQVC-h2UOP8GKVNaAr1OBEWoyUWiuY8RXa6mM';

// Crear cliente de Supabase solo si hay credenciales configuradas
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper para verificar si Supabase está disponible
export const isSupabaseEnabled = () => {
  return supabase !== null;
};

// Helper para verificar conectividad
export const checkSupabaseConnection = async () => {
  if (!isSupabaseEnabled()) {
    return { connected: false, error: 'Supabase no configurado' };
  }
  
  try {
    const { error } = await supabase.from('productos').select('count', { count: 'exact', head: true });
    return { connected: !error, error: error?.message };
  } catch (err) {
    return { connected: false, error: err.message };
  }
};
