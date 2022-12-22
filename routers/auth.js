// const express = require('express')
// const auth = require('../controller/userAuth')
// const router = express.Router()
// const { body } = require("express-validator")
// const { User } = require('../models/models')

// router.get('/login', auth.getLogin)
// router.post('/login', 
//             body('email', 'Enter a valid email').isEmail().normalizeEmail().trim(),
//             body('password', 'Minimum password length should be 3').isLength({min:3, max: 20}),
//             auth.postLogin)
// router.post('/logout', auth.postLogout)
// router.get('/signup', auth.getSignup)
// router.post('/signup', 
//             body('email', 'Enter a valid Email').trim().normalizeEmail().isEmail().custom( async (value, {req})=> {
//                 const user = await User.findOne({email: req.body.email})
//                 if(user) {
//                     throw new Error(' Email already exists')
//                 }

//             }), 
//             body('password', 'Password should be at least 3 characters long').isLength({min:3, max: 20}),
//             body('confirmPassword').custom((value, {req}) => {
//                 if(value !== req.body.password) {
//                     throw new Error('Password did not match')
//                 }
//                 return true
//             }),
//             auth.postSignup)
// router.get('/reset-password', auth.getResetPassword)
// router.post('/reset-password',auth.postResetPassword)
// router.get('/reset-password/:token', auth.getResetSlashToken)
// router.post('/new-password', 
//         body('password', 'Password should have a minimum length of 3').isLength({min: 3, max: 20}),
//         auth.postNewPassword)


// module.exports = router