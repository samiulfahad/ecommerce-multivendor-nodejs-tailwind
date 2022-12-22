const { Product, Seller } = require('../models/models')
const handleError = require('../others/handleError')
const { validationResult } = require('express-validator')
const fs = require('fs').promises
const path = require('path')


//Seller Account
exports.getAccount = (req, res)=> {
    res.render('./seller/account', {title: 'My Account', path: '/seller/account'})
}


// Render Add-Product Form
exports.getAddProduct = (req, res)=>{
    // Retriving product data and error info (if any)
    const product = req.flash('productData')[0] || {title: '', price: '', imageUrl: '', description: ''}
    const errorMessage = req.flash('errorMessage')[0] || ''
    const errorField = req.flash('errorField')[0] || ''
    res.render('./seller/edit-product.ejs', {title: 'Add Product', 
    action: 'add-product', edit: false, product, btnTxt: 'Add Product', 
    errorMessage, errorField, path: '/seller/add-product'})
}

// Add a product
exports.postAddProduct = async (req, res, next) => {
    const productData = {
            title: req.body.title,
            price: req.body.price,
            description: req.body.description,
            sellerId: req.user._id
    }

    const errObj = validationResult(req)
    
    // Check for validation error via express-validator
    if( !errObj.isEmpty() ) {
        // Sending error information and product data to getAddProduct
        req.flash('errorMessage', errObj.errors[0].msg)
        req.flash('errorField', errObj.errors[0].param)
        req.flash('productData', productData)
        return res.redirect('/seller/add-product')
    }
    // Check if the file type is proper or not. This info comes from multer middleware via connect-flash
    const errMsg = req.flash('fileType')[0]
    if(errMsg){
        req.flash('errorMessage', errMsg)
        req.flash('errorField', 'image')
        req.flash('productData', productData)
        return res.redirect('/seller/add-product')
    }
    // Check if there is a product image or not
    if(!req.file){
        req.flash('errorMessage', 'Please select a product image')
        req.flash('errorField', 'image')
        req.flash('productData', productData)
        return res.redirect('/seller/add-product')
    }

    // Add Image URL to DB
    productData.imageURL = '/' + req.file.path

    try{
        await Product.create(productData)
        res.redirect('/seller/products')
    }
    catch(err) {
        handleError(err, next)
    }
}

// Render Edit-Product form
exports.getEditProduct = async (req, res, next) => {
    const editMode = req.query.edit === 'true' ? true : false
    if(!editMode) {
        const products = await Product.find()
        console.log(products)
        return res.render('./user/index', {title: 'Home', prods: products, path: '/'})
    }
    try {
        const product = req.flash('productData')[0] || await Product.findOne({_id: req.params.id, sellerId: req.user._id})
        const errorMessage = req.flash('errorMessage')[0] || ''
        const errorField = req.flash('errorField')[0] || ''
        if(!product) {
            return res.render('./seller/noProduct.ejs', {title: 'No Product Found', path: ''})
        }
        res.render('./seller/edit-product.ejs', {title: 'Edit Product', product, errorMessage, errorField, 
            action: 'edit-product', edit: true, btnTxt: 'Update Product', path: '/seller/edit-product'})
    }
    catch(err) {
        handleError(err, next)        
    }
}

exports.postEditProduct = async (req, res, next) => {
    // Collect validation error
    const errObj = validationResult(req)
    // Constract the updated product
    const productData = {
            title: req.body.title,
            price: req.body.price,
            description: req.body.description,
            sellerId: req.user._id,
            _id: req.body.productId
    }

    // Check if the file type is proper or not in case a new image is provided vai connect-flash
    const errMsg = req.flash('fileType')[0]
    if(errMsg){
        req.flash('errorMessage', errMsg)
        req.flash('errorField', 'image')
        req.flash('productData', productData)
        return res.redirect(`/seller/edit-product/${req.body.productId}/?edit=true`)
    }
    // Replace imageURL if new image is provided
    if(req.file){
        productData.imageURL = '/' + req.file.path
    }
    if(!errObj.isEmpty()){
        // Sending error information and product data to getAddProduct
        req.flash('errorMessage', errObj.errors[0].msg)
        req.flash('errorField', errObj.errors[0].param)
        req.flash('productData', productData)
        return res.redirect(`/seller/edit-product/${productData._id}/?edit=true`)
    }
    try{
        let product = await Product.findOne({_id: req.body.productId, sellerId: req.user._id})
        await Product.findOneAndUpdate({_id: req.body.productId, userId: req.user._id}, productData)
        await product.save()
        res.redirect(`/seller/products`)
        // Remove old image if new one is provided
        if(productData.imageURL){
            await fs.unlink(path.join(__dirname, `../${product.imageURL}`))
        }
    } 
    catch(err) {
        handleError(err, next)
    }
}

// Get All Products
exports.getProducts = async (req, res, next)=>{
    try{
        const products = await Product.find({sellerId: req.user._id})
        res.render('./seller/products.ejs', {title: `Seller's Products`, prods:products, path: '/seller/products'})
    }
    catch(err){
        handleError(err, next)
    }
}

// Delete a Product
exports.deleteProduct = async (req, res, next) => {
    try{
        const productId = req.params.productId
        const product = await Product.findOneAndDelete({_id: productId, sellerId: req.user._id})
        await fs.unlink(path.join(__dirname, `../${product.imageURL}`))
        res.status(200).json({status: "success"})
    }
    catch(err){
        console.log(err)
        res.status(200).send({status: "Failed"})
    }
}