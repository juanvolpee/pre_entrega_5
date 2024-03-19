const express = require('express');
const router = express.Router();
const fs = require('fs');
const uuid = require('uuid');

const cartsFilePath = './data/carts.json';

// Crear un nuevo carrito
router.post('/', (req, res) => {
  const newCart = {
    id: uuid.v4(),
    products: []
  };
  fs.readFile(cartsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al crear el carrito');
    }
    const carts = JSON.parse(data);
    carts.push(newCart);
    fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2), err => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al crear el carrito');
      }
      res.status(201).json(newCart);
    });
  });
});

router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 10; // Establecer el límite predeterminado como 10 si no se proporciona
  const page = parseInt(req.query.page) || 1; // Página predeterminada como 1 si no se proporciona
  const sort = req.query.sort; 
  const category = req.query.category || ''; 
  const availability = req.query.availability || ''; 

  fs.readFile(productsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Error al obtener los productos' });
    }
    const products = JSON.parse(data);

    let filteredProducts = products;

    // Aplicar filtro por categoría si se proporciona
    if (category) {
      filteredProducts = products.filter(product => {
        // Realiza la lógica de filtrado por categoría
        return product.category.toLowerCase() === category.toLowerCase();
      });
    }

    // Aplicar filtro por disponibilidad si se proporciona
    if (availability) {
      filteredProducts = filteredProducts.filter(product => {
        // Realiza la lógica de filtrado por disponibilidad
        return product.availability.toLowerCase() === availability.toLowerCase();
      });
    }

    // Aplicar orden si se proporciona 
    if (sort === 'asc') {
      filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sort === 'desc') {
      filteredProducts.sort((a, b) => b.price - a.price);
    }

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    // Calcula el número total de páginas
    const totalPages = Math.ceil(filteredProducts.length / limit);

    // Verifica si hay una página previa
    const hasPrevPage = page > 1;

    // Verifica si hay una página siguiente
    const hasNextPage = page < totalPages;

    // Construye los enlaces directos a las páginas previa y siguiente
    const prevLink = hasPrevPage ? `/products?page=${page - 1}&limit=${limit}` : null;
    const nextLink = hasNextPage ? `/products?page=${page + 1}&limit=${limit}` : null;

    res.json({
      status: 'success',
      payload: paginatedProducts,
      totalPages: totalPages,
      prevPage: page - 1,
      nextPage: page + 1,
      page: page,
      hasPrevPage: hasPrevPage,
      hasNextPage: hasNextPage,
      prevLink: prevLink,
      nextLink: nextLink
    });
  });
});



// Agregar un producto a un carrito
router.post('/:cid/product/:pid', (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;
  const quantity = req.body.quantity || 1; // Si no se proporciona, agregar 1 por defecto
  fs.readFile(cartsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error al agregar el producto al carrito');
    }
    let carts = JSON.parse(data);
    const cartIndex = carts.findIndex(cart => cart.id === cartId);
    if (cartIndex === -1) {
      return res.status(404).send('Carrito no encontrado');
    }
    const productIndex = carts[cartIndex].products.findIndex(product => product.id === productId);
    if (productIndex !== -1) {
      // Si el producto ya está en el carrito, aumentar la cantidad
      carts[cartIndex].products[productIndex].quantity += quantity;
    } else {
      // Si el producto no está en el carrito, agregarlo
      carts[cartIndex].products.push({ id: productId, quantity });
    }
    fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2), err => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error al agregar el producto al carrito');
      }
      res.status(201).send('Producto agregado al carrito');
    });
  });
});

// Eliminar un producto específico del carrito
router.delete('/:cid/products/:pid', (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;

  fs.readFile(cartsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Error al obtener el carrito' });
    }

    let carts = JSON.parse(data);
    const cartIndex = carts.findIndex(cart => cart.id === cartId);
    if (cartIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
    }

    const productIndex = carts[cartIndex].products.findIndex(product => product.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado en el carrito' });
    }

    // Eliminar el producto del carrito
    carts[cartIndex].products.splice(productIndex, 1);

    // Guardar los cambios en el archivo
    fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2), err => {
      if (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: 'Error al eliminar el producto del carrito' });
      }
      res.json({ status: 'success', message: 'Producto eliminado del carrito correctamente' });
    });
  });
});


// Actualizar el carrito con un nuevo arreglo de productos
router.put('/:cid', (req, res) => {
  const cartId = req.params.cid;
  const newProducts = req.body.products;

  fs.readFile(cartsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Error al obtener el carrito' });
    }

    let carts = JSON.parse(data);
    const cartIndex = carts.findIndex(cart => cart.id === cartId);
    if (cartIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
    }

    // Actualizar los productos del carrito con el nuevo arreglo de productos
    carts[cartIndex].products = newProducts;

    // Guardar los cambios en el archivo
    fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2), err => {
      if (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: 'Error al actualizar el carrito' });
      }
      res.json({ status: 'success', message: 'Carrito actualizado correctamente' });
    });
  });
});


// Actualizar la cantidad de ejemplares de un producto en el carrito
router.put('/:cid/products/:pid', (req, res) => {
  const cartId = req.params.cid;
  const productId = req.params.pid;
  const newQuantity = req.body.quantity;

  fs.readFile(cartsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Error al obtener el carrito' });
    }

    let carts = JSON.parse(data);
    const cartIndex = carts.findIndex(cart => cart.id === cartId);
    if (cartIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
    }

    const productIndex = carts[cartIndex].products.findIndex(product => product.id === productId);
    if (productIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado en el carrito' });
    }

    // Actualizar la cantidad de ejemplares del producto en el carrito
    carts[cartIndex].products[productIndex].quantity = newQuantity;

    // Guardar los cambios en el archivo
    fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2), err => {
      if (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: 'Error al actualizar la cantidad del producto en el carrito' });
      }
      res.json({ status: 'success', message: 'Cantidad del producto en el carrito actualizada correctamente' });
    });
  });
});



// Eliminar todos los productos del carrito
router.delete('/:cid', (req, res) => {
  const cartId = req.params.cid;

  fs.readFile(cartsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ status: 'error', message: 'Error al obtener el carrito' });
    }

    let carts = JSON.parse(data);
    const cartIndex = carts.findIndex(cart => cart.id === cartId);
    if (cartIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
    }

    // Eliminar todos los productos del carrito
    carts[cartIndex].products = [];

    // Guardar los cambios en el archivo
    fs.writeFile(cartsFilePath, JSON.stringify(carts, null, 2), err => {
      if (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: 'Error al eliminar todos los productos del carrito' });
      }
      res.json({ status: 'success', message: 'Todos los productos del carrito han sido eliminados correctamente' });
    });
  });
});



// Actualizar la ruta para traer todos los productos completos en el carrito mediante populate
router.get('/:cid', (req, res) => {
  const cartId = req.params.cid;

  Cart.findById(cartId)
    .populate('products') // Hace referencia al campo 'products' del modelo Cart, que contiene IDs de productos
    .exec((err, cart) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: 'Error al obtener el carrito' });
      }
      if (!cart) {
        return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
      }
      res.json({ status: 'success', payload: cart });
    });
});





module.exports = router;
