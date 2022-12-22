const { User } = require("../models/models")
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { validationResult } = require('express-validator')
const handleError = require("../others/handleError")

const getLogin = (req, res, next) => {
    // Retriving old data and error information (if any) from postLogin via connect-flash
    const errorMessage = req.flash('errorMessage')[0]
    const oldData = req.flash('oldData')[0] || {}
    const success = req.flash('success')[0] || ''
    const errorField = req.flash('errorField')[0] || ''
    res.render('./user/login.ejs', {
    title: 'Login', path: '/login', errorMessage, oldData, success, errorField})
}

const postLogin = async (req, res, next) => {
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
        const user = await User.findOne({email: req.body.email})
        if(!user){
            // Sending error info and old data to getLogin via connect-flash
            req.flash('errorMessage', 'Invalid Login details')
            req.flash('oldData', oldData)
            return res.redirect('/login')
        }
        const matchedPass = await bcrypt.compare(req.body.password, user.password)
        if(!matchedPass) {
            req.flash('errorMessage', 'Password did not match')
            req.flash('oldData', oldData)
            req.flash('errorField', 'password')
            return res.redirect('/login') 
        }
        // Add redirect url to the session that came from authentication.js middleware via flesh-connect
        req.session.url = req.flash('info')[0]
        req.session.user = user
        req.session.isLoggedIn = true
        req.session.isCustomer = true
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

const postLogout = (req, res, next) => {
    req.session.destroy(err=> {
        if(err){
            console.log(err)
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
        }
        res.redirect('/')
    })
}

const getSignup = (req, res) => {
    // Retriving old data and error info (if any) from postSighUp
    const oldData = req.flash('oldData')[0] || {}
    const errorMessage = req.flash('errorMessage')[0] || ''
    const errorField = req.flash('errorField')[0] || ''
    res.render('./auth/signup.ejs', {
    title: 'Signup', path: '/signup', oldData, errorMessage, errorField})
}

const postSignup = async (req, res, next) => {
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
        return res.redirect('/signup')
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 8)
    try{
        const user = await User.create({email: req.body.email, 
            password: hashedPassword, cart: {items: []}})
        req.flash('success', 'Signup Seccessful. Now you can login')
        res.redirect('/login')
    }
    catch(err) {
        handleError(err, next)
    }
}

const getResetPassword = (req, res) => {
    const errorMessage = req.flash('errorMessage')[0]
    const oldEmail = req.flash('oldEmail')[0] || ''
    res.render('./auth/reset-password', {title: 'Reset Password', errorMessage, oldEmail, path: '/reset-password'})
}

const postResetPassword = async (req, res, next) => {
    try{
        const user = await User.findOne({email: req.body.email})
        if(!user) {
            req.flash('errorMessage', 'No user found with this email')
            req.flash('oldEmail', req.body.email)
            return res.redirect('/reset-password')
        }
        const buffer = await crypto.randomBytes(32)
        const token = buffer.toString('hex')
        user.resetToken = token
        user.tokenExpiration= Date.now() + 15*60*1000
        await user.save()
        res.send(user)
    }
    catch(err) {
        handleError(err, next)
    }
}

const getResetSlashToken = async (req, res, next) => {
    const token = req.params.token
    try{
        const user = await User.findOne({resetToken: token, tokenExpiration: {$gt: Date.now()}})
        if(!user){
            req.flash('errorMessage', 'Invalid Token')
            return res.redirect('/reset-password')
        }
        const passLengthErr = req.flash('passLengthErr')[0] || ''
        const oldPassword = req.flash('oldPassword')[0] || ''
        res.render('./auth/new-password', {title: 'New Password', passLengthErr, oldPassword, path: '/new-password', 
                    userId: user._id, resetToken: token})
    }
    catch(err){
        handleError(err, next)
    }
}
const postNewPassword = async (req, res, next) => {
    const errObj = validationResult(req)
    if(!errObj.isEmpty()){
        req.flash('oldPassword', req.body.password)
        req.flash('passLengthErr', errObj.errors[0].msg)
        console.log(errObj.errors[0].msg)
        return res.redirect(`/reset-password/${req.body.token}`)
    }
    const userId = req.body.userId
    const token = req.body.token
    try{
        const user = await User.findOne({_id: userId, resetToken:token, tokenExpiration: {$gt: Date.now()}})
        if(!user) {
            req.flash('errorMessage', 'Invalid Token')
            return res.redirect(`/reset-password`)
        }
        user.password = await bcrypt.hash(req.body.password, 12)
        user.resetToken = undefined
        user.tokenExpiration = undefined
        await user.save()
        req.flash('success', 'Password Reset successful. Now you can login')
        res.redirect('/login')
    }
    catch(err){
        handleError(err, next)
    }
}
module.exports = {
    getLogin, postLogin, postLogout, getSignup, postSignup, getResetPassword, postResetPassword,
    getResetSlashToken, postNewPassword
}