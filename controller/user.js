const { Product, Order } = require('../models/models')
const handleError = require('../others/handleError')
const path = require('path')
const fs = require('fs')


const PDFDoc = require('pdfkit')
//Account
exports.getAccount = (req, res)=> {
    res.render('./user/account', {title: 'My Account', path: '/customer/account'})
}
exports.getWishlist = (req, res)=> {
    res.render('./user/wishlist', {title: 'My Wishlist', path: '/wishlist'})
}

const ITEM_PER_PAGE = 8
exports.getIndex = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const products = await Product.find().skip((page - 1) * ITEM_PER_PAGE ).limit(ITEM_PER_PAGE)
    const totalProduct = await Product.countDocuments()
    res.render('./user/index', {title: 'Home', products, path: '/shop', 
    currentPage: page, hasNextPage: ITEM_PER_PAGE * page < totalProduct, hasPreviousPage: page > 1,
    nextPage : page + 1, previousPage: page - 1, lastPage: Math.ceil(totalProduct/ITEM_PER_PAGE)
    })
}

exports.getProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const products = await Product.find().skip((page - 1) * ITEM_PER_PAGE ).limit(ITEM_PER_PAGE)
    const totalProduct = await Product.countDocuments()
    res.render('./user/index', {title: 'Home', products, path: '/products', 
    currentPage: page, hasNextPage: ITEM_PER_PAGE * page < totalProduct, hasPreviousPage: page > 1,
    nextPage : page + 1, previousPage: page - 1, lastPage: Math.ceil(totalProduct/ITEM_PER_PAGE)
    })
}
exports.getCart = async (req, res, next) => {
    if(req.user.isSeller) {
        res.redirect('/')
    }
    try{
        await req.user.populate('cart.items.productId')
        const cartProducts = req.user.cart.items
        let total = 0
        if (cartProducts.length > 0){
            cartProducts.forEach( prod => {
            total = total + prod.productId.price * prod.quantity
        })
        }
        res.render('./user/cart', {title: 'Your Cart', products: cartProducts, total, 
        path: '/cart'})
    }
    catch(err){
        handleError(err, next)
    }

}
exports.postAddToCart = async (req, res, next) => {
    try
    {
        let product = await Product.findById(req.body.productId)
        if(product){
            await req.user.addToCart(req.body.productId, parseInt(req.body.quantity))
            console.log('add to cart called')
        }
        res.redirect('/cart')
    }
    catch(err){
        handleError(err, next)
    }
}

exports.postOrder =  async (req, res, next) => {
    try{
        await req.user.populate('cart.items.productId', 'title price quantity -_id')
        const cartProds = await req.user.cart.items
        let cartItems = cartProds.map(item => {
            let title = item.productId.title
            let price = item.productId.price
            let quantity = item.quantity
            return {title, price, quantity}
        })
        if(cartItems.length === 0) {
            return res.redirect('/cart')
        }
        const userOrder = await Order.create({items: cartItems, userId: req.user._id})
        req.user.cart.items = []
        await req.user.save()
        res.redirect('/orders')
    }
    catch(e){
        handleError(err, next)
    }
}

exports.getOrders = async (req, res, next) => {
    try{
       const orders = await Order.find({userId: req.user._id}).populate('userId', 'email')
       res.render('./user/orders', {title: 'Your Orders',orders, 
       path: '/orders'})
    }
    catch(err){
        handleError(err, next)
    }
}

exports.postDeleteCartItem = async (req, res, next) => {
   try{
        req.user.cart.items = req.user.cart.items.filter(item => {
            return item.productId.toString() !== req.body.productId.toString()
        })
        await req.user.save()
        res.redirect('/cart')
   } catch(err){
        handleError(err, next)
   }
}

exports.getCheckout = async (req, res) => {
    try{
        await req.user.populate('cart.items.productId')
        const cartProducts = req.user.cart.items
        let total = 0
        cartProducts.forEach( prod => {
            total = total + parseInt(prod.productId.price) * parseInt(prod.quantity)
        })
        res.render('./user/checkout', {title: 'Checkout', products: cartProducts, 
        path: '/checkout', total: total})
    }
    catch(err){
        handleError(err, next)
    }
}
exports.getProductDetails = async (req, res, next) => {
    try{
        const product = await Product.findById(req.params.id)
        return res.render('./user/product-details.ejs', {title: 'Product', product, 
        path: '/single-product'})
    }
    catch(err) {
        handleError(err, next)
    }
}

exports.getInvoice = async (req, res, next) => {
    try{
        const orderId = req.params.id
        const order = await Order.findOne({_id: orderId, userId: req.user._id})
        if(!order){
            return next(new Error ('No Invoice found with this ID'))
        }
        const invoiceName = 'Invoice-' + orderId +'.pdf'
        const invoicePath = path.join(__dirname, `../invoices/${invoiceName}`)
        const invoice = new PDFDoc()
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename= ${invoiceName} `)
        invoice.pipe(fs.createWriteStream(invoicePath))
        invoice.pipe(res)
//      ############################ Starting Style ###################################
        invoice.fontSize(20).text('         --------------------Invoice----------------------').moveDown()
        invoice.fontSize(12).text(`Invoice No. - ${orderId}`)
        invoice.fontSize(12).text(`Customer Email. - ${req.user.email}`)
        invoice.fontSize(12).text(`Shipping Address: xxxxxxxx, xxxxxx, xxxx`).moveDown()
        invoice.fontSize(18).text(`Invoice Details`)
        invoice.fontSize(15).text(`Product Name         Price/unit       Quantity        Total`)
        let cartTotal = 0
        for(let i=0; i< order.items.length; i++) {
            let title = order.items[i].title
            let price = order.items[i].price
            let quantity = order.items[i].quantity
            let prodTotal = price * quantity
            invoice.fontSize(13).text(`${title}                  ${price}                     ${quantity}                    ${prodTotal}`)
            cartTotal = cartTotal + prodTotal
        }
        invoice.fontSize(12).text('-----------------------------------------------------------------------------------------------------------')
        invoice.fontSize(15).text(`Total Amount                                                  = ${cartTotal}`).moveDown(5)
        invoice.fontSize(13).text('Thanks for visiting my Porfolio')
        invoice.fontSize(12).text('Samiul Fahad')
        invoice.fontSize(10).text('Contact: +8801723939836, +8801518918551')
        invoice.fontSize(12).text('Email: samiul_fahad@yahoo.com')
// ############################### Ending Style ##################################
        invoice.end()
    } 
    catch(err) {
        handleError(err, next)
    }
}