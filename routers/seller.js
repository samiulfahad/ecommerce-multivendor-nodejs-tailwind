const express = require('express')
const {  isSeller } = require('../middlewares/checkPoint')
const sellerAuth = require('../controller/sellerAuth')
const sellerController = require('../controller/seller')
const { Seller } = require ('../models/models')
const { body } = require('express-validator')
const router = express.Router()

router.get('/signup', sellerAuth.getSignup)
router.get('/account', sellerController.getAccount)
router.post('/signup', 
        body('email', 'Enter a valid Email').trim().normalizeEmail().isEmail().custom( async (value, {req})=> {
                const user = await Seller.findOne({email: req.body.email})
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
        sellerAuth.postSignup)

router.get('/login', sellerAuth.getLogin)
router.post('/login',
            body('email', "Enter a Valid Email").isEmail(),
            body('password', 'Minimum password length should be 3').isLength({min:3, max: 20}),
            sellerAuth.postLogin)
router.get('/add-product', isSeller, sellerController.getAddProduct)
router.post('/add-product', isSeller,
            body('title', 'Title should have a minimum length of 3').isLength({min: 3}).trim(),
            body('price', 'Price should be a number').trim().isFloat(),
            body('description', "Description should have a minimum length of 5").isLength({min: 5}).trim(),
            sellerController.postAddProduct)
router.get('/edit-product/:id', isSeller, sellerController.getEditProduct)
router.post('/edit-product', 
            body('title', 'Title should have a minimum length of 3').isLength({min: 3}).trim(),
            body('price', 'Price should be a number').trim().isFloat(),
            body('description', "Description should have a minimum length of 5").isLength({min: 5}).trim(),
            isSeller, sellerController.postEditProduct)
router.delete('/product/:productId', isSeller, sellerController.deleteProduct)
router.get('/products', isSeller, sellerController.getProducts)
router.get('/reset-password', sellerAuth.getResetPassword)
router.post('/reset-password', sellerAuth.postResetPassword)
router.get('/reset-password/:token', sellerAuth.getResetSlashToken)
router.post('/new-password', 
        body('password', 'Password should have a minimum length of 3 and max 20').isLength({min: 3, max: 20}),
        sellerAuth.postNewPassword)



module.exports = router