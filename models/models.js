const mongoose = require('mongoose')

//productSchema Definition
const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    imageURL: {
        type: String,
        required: false
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
    }
})
const Product = mongoose.model('Product', productSchema)

//userSchema Definition
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        items: [{
            productId: { type: mongoose.Schema.Types.ObjectId, ref:'Product', required: true },
            quantity: { type: Number, required: true}
        }]
    },
    delivery_address: {
        area: {type:  String, maxlength: 100, default: ''},
        upazilla: {type:  String, maxlength: 50, default: ''},
        postCode: {type:  Number, maxlength: 6},
        district: {type:  String, maxlength: 50, default: ''}
    },
    resetToken: String,
    tokenExpiration: Date
})

userSchema.methods.addToCart = async function(productId, quantity){
    const user = this
    if(user.cart.items.length === 0) {
        await user.cart.items.push({productId, quantity})
    } else {
        const doesExit = user.cart.items.some(item => item.productId.toString() === productId.toString())
        if(!doesExit) {
            user.cart.items.push({productId, quantity})
        } else {
            const index = user.cart.items.findIndex(item => item.productId.toString() === productId.toString())
            user.cart.items[index].quantity = user.cart.items[index].quantity + quantity 
        }
    }
    await user.save()
}
const User = mongoose.model('User', userSchema)

// Seller Schema 
const sellerSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isSeller: {
        required: true,
        type: Boolean,
        default: true
    },
    isActive: {
        required: true,
        type: Boolean,
        default: false
    },
    resetToken: String,
    tokenExpiration: Date
})
const Seller = mongoose.model('Seller', sellerSchema)

//orderSchema Definition
const orderSchema = new mongoose.Schema({
    items: [{
        _id: false, 
        title: String, 
        price: Number, 
        quantity: Number
    }],
    userId: { 
        _id: false,
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: 'User'
    }
})
const Order = mongoose.model('Order', orderSchema)
module.exports = {
    Product,
    User, 
    Order,
    Seller
}