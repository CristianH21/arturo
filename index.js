// products-api.js
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors')

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Product Routes
// 1. Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) throw error;
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 2. Get product by SKU
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
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// 3. Create a new product
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
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// 4. Update an existing product
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
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// 5. Delete a product
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
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// 6. Get all terms
app.get('/api/terms', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('terms')
      .select('*');

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ error: 'Failed to fetch terms' });
  }
});

// 7. Create a new term
app.post('/api/terms', async (req, res) => {
  try {
    const { weeks, normal_rate, punctual_rate } = req.body;

    // Validate required fields
    if (!weeks || !normal_rate || !punctual_rate) {
      return res.status(400).json({ error: 'Weeks, normal_rate, and punctual_rate are required' });
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
    console.error('Error creating term:', error);
    res.status(500).json({ error: 'Failed to create term' });
  }
});

// 8. Calculate credit quote
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
    console.error('Error calculating quote:', error);
    res.status(500).json({ error: 'Failed to calculate quote' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});