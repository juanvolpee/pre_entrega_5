const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] // Referencia al modelo de Product
});

module.exports = mongoose.model('Cart', cartSchema);


const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
        id: {type: number},
        name: {type: string},
        price: {type: number},
        categoria: {tupe: string}

});
 
    

module.exports = mongoose.model('Product', productSchema);
