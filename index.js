const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:27017/shopping-cart';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connected');
  Order.find({})
    .then(orders => {
      console.log('Orders:');
      orders.forEach(order => {
        console.log('Order ID:', order.orderId);
        console.log('Customer Care Number:', order.customerCareNumber);
        console.log('Items:');
        order.items.forEach(item => {
          console.log('Name:', item.name);
          console.log('Price:', item.price);
          console.log('Quantity:', item.quantity);
        });
        console.log('-----------------------');
      });
    })
    .catch(err => {
      console.error('Error fetching orders:', err);
    });
})

// Define product schema and model
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  quantity: Number,
});
const Product = mongoose.model('Product', productSchema);
// Define order schema and model
const orderSchema = new mongoose.Schema({
  orderId: Number,
  customerCareNumber: String,
  items: [productSchema] // Array of products in the order
});
const Order = mongoose.model('Order', orderSchema);

// ShoppingCart class
class ShoppingCart {
  constructor() {
    this.cart = [];
  }

  addProduct(productName, productPrice, productQuantity) {
    let existingProduct = this.findProduct(productName);
    if (existingProduct) {
      existingProduct.quantity += productQuantity;
    } else {
      let newProduct = new Product({ name: productName, price: productPrice, quantity: productQuantity });
      this.cart.push(newProduct);
    }
    console.log(productQuantity + " " + productName + "(s) added to the cart.");
  }

  viewCart() {
    return this.cart;
  }

  calculateTotal() {
    let total = 0;
    for (let product of this.cart) {
      total += product.price * product.quantity;
    }
    return total;
  }

  removeProduct(productName) {
    let productToRemove = this.findProduct(productName);
    if (productToRemove) {
      this.cart = this.cart.filter(product => product.name !== productName);
      console.log(productName + " removed from the cart.");
    } else {
      console.log("Product not found in the cart.");
    }
  }

  clearCart() {
    this.cart = [];
    console.log("Cart cleared.");
  }

  findProduct(productName) {
    return this.cart.find(product => product.name.toLowerCase() === productName.toLowerCase());
  }
}

const cart = new ShoppingCart();

// Routes for cart
app.post('/api/cart/addProduct', async (req, res) => {
  const { productName, productPrice, productQuantity } = req.body;
  cart.addProduct(productName, productPrice, productQuantity);
  const product = new Product({ name: productName, price: productPrice, quantity: productQuantity });
  await product.save();
  res.status(201).send(`${productQuantity} ${productName}(s) added to the cart.`);
});

app.get('/api/cart/viewCart', (req, res) => {
  res.json(cart.viewCart().map(product => ({
    name: product.name,
    price: product.price,
    quantity: product.quantity,
  })));
});

app.get('/api/cart/calculateTotal', (req, res) => {
  res.send(`Total amount: ${cart.calculateTotal()}`);
});

app.delete('/api/cart/removeProduct/:productName', async (req, res) => {
  const productName = req.params.productName;
  cart.removeProduct(productName);
  await Product.deleteOne({ name: productName });
  res.send(`${productName} removed from the cart.`);
});

// New route to clear the cart after placing an order
app.delete('/api/cart/clearCart', (req, res) => {
  cart.clearCart();
  res.send("Cart cleared successfully.");
});

// Route to serve order-details.html
app.get('/order-details.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order-details.html'));
});
// Routes for orders
// Route to place an order
app.post('/api/orders/placeOrder', async (req, res) => {
  try {
      const { orderId, customerCareNumber, items } = req.body;
      // Add server-side validation here if needed
      const order = new Order({ orderId, customerCareNumber, items });
      await order.save();
      res.status(201).json({ orderId }); // Send the order ID in the response
  } catch (error) {
      console.error('Error placing order:', error);
      res.status(500).send('Error placing order');
  }
});

// Route to view order history
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send('Error fetching orders');
  }
});
// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
