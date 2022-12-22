const handleError = require('../others/handleError')
const { Seller } = require('../models/models')
const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

exports.getSignup = (req, res) => {
    // Retriving old data and error info (if any) from postSighUp
    const oldData = req.flash('oldData')[0] || {}
    const errorMessage = req.flash('errorMessage')[0] || ''
    const errorField = req.flash('errorField')[0] || ''
    res.render('./seller/signup.ejs', {
    title: 'Seller Signup', path: '/seller/signup', oldData, errorMessage, errorField})
}

exports.postSignup = async (req, res, next) => {
    const errObj = validationResult(req)
     const oldData = { 
            email: req.body.email,
            password: req.body.password,
            confirmPassword: req.body.confirmPassword
            }
    if(!errObj.isEmpty()){
        // Sending error information and old data to getSignUp via connect-flash
        req.flash('errorMessage', errObj.errors[0].msg)
        req.flash('errorField', errObj.errors[0].param)
        req.flash('oldData', oldData)
        return res.redirect('/seller/signup')
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 8)
    try{
        await Seller.create({
                email: req.body.email, 
                password: hashedPassword,
                })
        req.flash('success', 'Registration form submitted. Please wait while admin approves you')
        res.redirect('/seller/login')
    }
    catch(err) {
        handleError(err, next)
    }
}


exports.getLogin = (req, res, next) => {
    // Retriving old data and error information (if any) from postLogin via connect-flash
    const errorMessage = req.flash('errorMessage')[0]
    const oldData = req.flash('oldData')[0] || {}
    const success = req.flash('success')[0] || ''
    const errorField = req.flash('errorField')[0] || ''
    res.render('./seller/login.ejs', {
    title: 'Login', path: '/seller/login', errorMessage, oldData, success, errorField})
}

exports.postLogin = async (req, res, next) => {
    const errObj = validationResult(req)
    if(!errObj.isEmpty()){
        req.flash('errorMessage', errObj.errors[0].msg)
        req.flash('oldEmail', req.body.email)
    }
    try{
        const oldData = {
            email: req.body.email,
            password: req.body.password
        }
        const seller = await Seller.findOne({email: req.body.email})
        if(!seller){
            // Sending error info and old data to getLogin via connect-flash
            req.flash('errorMessage', 'Invalid Login details')
            req.flash('oldData', oldData)
            return res.redirect('/seller/login')
        }
        const matchedPass = await bcrypt.compare(req.body.password, seller.password)
        if(!matchedPass) {
            req.flash('errorMessage', 'Password did not match')
            req.flash('oldData', oldData)
            req.flash('errorField', 'password')
            return res.redirect('/seller/login') 
        }
        // Add redirect url to the session that came from authentication.js middleware via flesh-connect
        req.session.url = req.flash('info')[0]
        req.session.user = seller
        req.session.isLoggedIn = true
        req.session.isSeller = true
        req.session.save((err) => {
            if(err){
                return next(err)
            }
            // Redirect back to the previous URL the client requested before authentication
            if(req.session.url){
                return res.redirect(req.session.url)
            }
            res.redirect('/')
        })
    } 
    catch(err) {
        handleError(err, next)
    }
}

exports.getResetPassword = (req, res, next) => {
    const errorMessage = req.flash('errorMessage')[0] || ''
    const oldEmail = req.flash('oldEmail')[0] || ''
    res.render('./seller/reset-password', {title: 'Seller Account Recovery', oldEmail, path: '/reset-password', errorMessage})
}

exports.postResetPassword = async (req, res, next) => {
    try{
        const seller = await Seller.findOne({email: req.body.email})
        if(!seller) {
            req.flash('errorMessage', 'No seller found with this email')
            req.flash('oldEmail', req.body.email)
            return res.redirect('/seller/reset-password')
        }
        const buffer = await crypto.randomBytes(32)
        const token = buffer.toString('hex')
        seller.resetToken = token
        seller.tokenExpiration= Date.now() + 15*60*1000
        await seller.save()
        res.send(seller)
    }
    catch(err) {
        handleError(err, next)
    }
}

exports.getResetSlashToken = async (req, res, next) => {
    const token = req.params.token
    try{
        const seller = await Seller.findOne({resetToken: token, tokenExpiration: {$gt: Date.now()}})
        if(!seller){
            req.flash('errorMessage', 'Invalid Token')
            return res.redirect('/seller/reset-password')
        }
        const passLengthErr = req.flash('passLengthErr')[0]
        res.render('./seller/new-password', {title: 'New Password', path: '/new-password', passLengthErr, 
                    sellerId: seller._id, resetToken: token})
    }
    catch(err){
        handleError(err, next)
    }
}
exports.postNewPassword = async (req, res, next) => {
    const errObj = validationResult(req)
    if(!errObj.isEmpty()){
        req.flash('passLengthErr', errObj.errors[0].msg)
        return res.redirect(`/seller/reset-password/${req.body.token}`)
    }
    const sellerId = req.body.sellerId
    const token = req.body.token
    try{
        const seller = await Seller.findOne({_id: sellerId, resetToken:token, tokenExpiration: {$gt: Date.now()}})
        if(!seller) {
            req.flash('errorMessage', 'Invalid Token')
            return res.redirect(`/reset-password`)
        }
        seller.password = await bcrypt.hash(req.body.password, 12)
        seller.resetToken = undefined
        seller.tokenExpiration = undefined
        await seller.save()
        req.flash('success', 'Password Reset successful. Now you can login')
        res.redirect('/seller/login')
    }
    catch(err){
        handleError(err, next)
    }
}