const express = require('express');
const router = express.Router();

module.exports = function(io) {
  router.get('/realtimeproducts', (req, res) => {
    res.render('realTimeProducts');
  });

  // Socket.io para actualizar en tiempo real
  io.on('connection', socket => {
    console.log('Nuevo cliente conectado');
    // Manejar eventos de actualización de productos
     socket.on('actualizarProductos', data => {
       // Actualizar la lista de productos en la vista
       io.emit('productosActualizados', data);
     });
  });

  return router;
};

// Definir una ruta para mostrar todos los productos
router.get('/products', (req, res) => {
  // Aquí deberías obtener la lista de todos los productos desde tu base de datos o donde los tengas almacenados
  const products = [
    { id: 1, name: 'Producto 1', price: 10, category: 'Categoría 1' },
    { id: 2, name: 'Producto 2', price: 20, category: 'Categoría 2' },
    // Agrega más productos aquí según sea necesario
  ];

  // Renderiza la vista de productos y pasa los datos de los productos a la vista
  res.render('products', { products });
});


const Cart = require('../models/Cart'); // Importa el modelo de Carrito

// Definir una ruta para mostrar un carrito específico
router.get('/carts/:cid', async (req, res) => {
  const cartId = req.params.cid;

  try {
    // Busca el carrito por su ID y popula los productos asociados
    const cart = await Cart.findById(cartId).populate('products').exec();
    if (!cart) {
      return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
    }
    res.render('cart', { cart }); // Renderiza la vista de carrito y pasa los datos del carrito a la vista
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al obtener el carrito' });
  }
});

module.exports = router;