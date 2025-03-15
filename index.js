require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors')

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) throw error;
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
});

app.get('/api/products/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Producto no encontrado.' });
      }
      throw error;
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener el producto:', error);
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { sku, name, description, price } = req.body;
    
    // Validate required fields
    if (!sku || !name || !price) {
      return res.status(400).json({ error: 'SKU, nombre y precio son requeridos.' });
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert([
        { sku, name, description, price }
      ])
      .select();
    
    if (error) throw error;
    
    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({ error: 'Error al crear el producto' });
  }
});

app.put('/api/products/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { name, description, price } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    const { data, error } = await supabase
      .from('products')
      .update({ name, description, price })
      .eq('sku', sku)
      .select();

    if (error) throw error;

    res.status(200).json(data[0]);
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
});

app.delete('/api/products/:sku', async (req, res) => {
  try {
    const { sku } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('sku', sku);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

app.get('/api/terms', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('terms')
      .select('*');

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener los términos:', error);
    res.status(500).json({ error: 'Error al obtener los términos' });
  }
});

app.post('/api/terms', async (req, res) => {
  try {
    const { weeks, normal_rate, punctual_rate } = req.body;

    // Validate required fields
    if (!weeks || !normal_rate || !punctual_rate) {
      return res.status(400).json({ error: 'Semanas, tasa normal y tasa puntual son requeridos' });
    }

    const { data, error } = await supabase
      .from('terms')
      .insert([
        { weeks, normal_rate, punctual_rate }
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Error al crear el término:', error);
    res.status(500).json({ error: 'Error al crear el término' });
  }
});

app.post('/api/quote', async (req, res) => {
  try {
    const { sku, weeks } = req.body;

    // Fetch product and term
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('sku', sku)
      .single();

    if (productError) throw productError;

    const { data: term, error: termError } = await supabase
      .from('terms')
      .select('*')
      .eq('weeks', weeks)
      .single();

    if (termError) throw termError;

    // Calculate payments
    const normalPayment = ((product.price * term.normal_rate) + product.price) / weeks;
    const punctualPayment = ((product.price * term.punctual_rate) + product.price) / weeks;

    res.status(200).json({
      normalPayment,
      punctualPayment
    });
  } catch (error) {
    console.error('Error al calcular la cotización:', error);
    res.status(500).json({ error: 'Error al calcular la cotización' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});