const express = require('express')
const userAuth = require('../controller/userAuth')
const { body } = require("express-validator")
const { User } = require('../models/models')
const shopController = require('../controller/user')
const { isAuthenticated } = require('../middlewares/checkPoint')
const router = express.Router()

router.get('/', shopController.getIndex )
router.get('/customer/account', shopController.getAccount)
router.get('/wishlist', shopController.getWishlist)
router.get('/cart',isAuthenticated, shopController.getCart)
router.post('/checkout', isAuthenticated, shopController.getCheckout)
router.post('/cart', isAuthenticated, shopController.postAddToCart)
router.post('/cart-delete-item', isAuthenticated, shopController.postDeleteCartItem)
router.post('/create-order', isAuthenticated, shopController.postOrder)
router.get('/orders', isAuthenticated, shopController.getOrders)
router.get('/checkout', isAuthenticated,shopController.getCheckout)
router.get('/products', shopController.getProducts)
router.get('/product/:id', shopController.getProductDetails)
router.get('/invoice/:id', isAuthenticated, shopController.getInvoice)

//###################### User Auth Routing Part ###########################//
router.get('/login', userAuth.getLogin)
router.post('/login', 
            body('email', 'Enter a valid email').isEmail().normalizeEmail().trim(),
            body('password', 'Minimum password length should be 3').isLength({min:3, max: 20}),
            userAuth.postLogin)
router.post('/logout', userAuth.postLogout)
router.get('/signup', userAuth.getSignup)
router.post('/signup', 
            body('email', 'Enter a valid Email').trim().normalizeEmail().isEmail().custom( async (value, {req})=> {
                const user = await User.findOne({email: req.body.email})
                if(user) {
                    throw new Error(' Email already exists')
                }

            }), 
            body('password', 'Password should be at least 3 characters long').isLength({min:3, max: 20}),
            body('confirmPassword').custom((value, {req}) => {
                if(value !== req.body.password) {
                    throw new Error('Password did not match')
                }
                return true
            }),
            userAuth.postSignup)
router.get('/reset-password', userAuth.getResetPassword)
router.post('/reset-password', userAuth.postResetPassword)
router.get('/reset-password/:token', userAuth.getResetSlashToken)
router.post('/new-password', 
        body('password', 'Password should have a minimum length of 3').isLength({min: 3, max: 20}),
        userAuth.postNewPassword)

module.exports = router