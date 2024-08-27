const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');


// Create Express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb+srv://bilalshehroz420:00000@cluster0.wru7job.mongodb.net/merchants?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define data models
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  imageUrl: String,
});

const merchantSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  products: [productSchema],
});

const checkoutSchema = new mongoose.Schema({
  productId: String,
  merchantId: String,
  response: String,
  headers:Object,
  CheckoutResponsData:Object,
  amount: Number,
  currency: String,
  status: String,
  customerEmail: String,
  customerPhone: String,
  createdAt: { type: Date, default: Date.now }
});
const Checkout = mongoose.model('Checkout', checkoutSchema);

const Merchant = mongoose.model('Merchant', merchantSchema);

// API Endpoints
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the HTML file for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Create a merchant
app.post('/api/merchants', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const newMerchant = new Merchant({ name, email, phone });
    await newMerchant.save();
    res.status(201).json({ message: 'Merchant created successfully', merchant: newMerchant });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create merchant' });
  }
});

// Get all merchants
app.get('/api/merchants', async (req, res) => {
  try {
    const merchants = await Merchant.find();
    res.status(200).json(merchants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch merchants' });
  }
});

// Add a product to a merchant
app.post('/api/merchants/:merchantId/products', async (req, res) => {
  try {
    const merchantId = req.params.merchantId;
    const { name, description, price, imageUrl } = req.body;
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
    const newProduct = { name, description, price, imageUrl };
    merchant.products.push(newProduct);
    await merchant.save();
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add product' });
  }
});

// Get products for a merchant
app.get('/api/merchants/:merchantId/products', async (req, res) => {
  try {
    const merchantId = req.params.merchantId;
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
    res.status(200).json({ products: merchant.products });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});
// Get products for all merchants
app.get('/api/products', async (req, res) => {
    try {
        // Fetch merchants with their products
        const merchants = await Merchant.find().populate('products');
        
        // Flatten products array and add merchant ID to each product
        const products = merchants.flatMap(merchant => 
            merchant.products.map(product => ({
                ...product.toObject(),
                merchantId: merchant._id // Add merchant ID to each product
            }))
        );

        res.status(200).json({ products });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve products' });
    }
});
// Get product details by ID
app.get('/api/products/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
        // Find the product by ID, populate merchant details if needed
        const product = await Merchant.findOne({ 'products._id': productId }, { 'products.$': 1 });
        if (!product || !product.products.length) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Extract the product details
        const productDetails = product.products[0];
        res.status(200).json({ product: productDetails });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve product details' });
    }
});

app.post('/api/checkout', async (req, res) => {
  try {
      const { productId, merchantId, response,headers,CheckoutResponsData, amount, currency, status, customerEmail, customerPhone } = req.body;

      const newCheckout = new Checkout({
          productId,
          merchantId,
          response,
          headers,
          CheckoutResponsData,
          amount,
          currency,
          status,
          customerEmail,
          customerPhone
      });

      await newCheckout.save();
      res.status(201).json({ message: 'Checkout data saved successfully', checkout: newCheckout });
  } catch (error) {
      res.status(500).json({ error: 'Failed to save checkout data' });
  }
});


// Serve a simple HTML interface for testing


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
