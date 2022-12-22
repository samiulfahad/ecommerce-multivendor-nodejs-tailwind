const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const session = require('express-session')
const csrf = require('csurf')
const MongoDBStore = require('connect-mongodb-session')(session)
const flash = require('connect-flash')
const multer = require('multer')
const { User, Seller } = require('./models/models')
const sellerRouter = require('./routers/seller')
const userRouter = require('./routers/user')

const app = express()
app.set('view engine', 'ejs')
app.set('views', 'views')
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, 'images')))

// Session storage
const store = new MongoDBStore({
    uri: 'mongodb://127.0.0.1:27017/shop',
    collection: 'sessions'
})
// Initialize Session
app.use(session({
    secret: 'my secret str',
    resave: false,
    saveUninitialized: false,
    store: store
}))
// Initialize connect-flash
app.use(flash())
//=========== Starting Multer Configuration ==============//
const storage = multer.diskStorage({
    destination: (req, file, cb)=> {
        cb(null, './images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().getTime().toString() + Math.floor(Math.random()*1000000) + '-' + file.originalname)
    }
})
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpg'  ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ) {
           return cb(null, true)
        }
        req.flash('fileType', 'Only JPF, JPEG and PNG files are allowed')
        cb(null, false)
}
app.use(multer({storage: storage, fileFilter: fileFilter}).single('image'))
//============ Ending Multer Configuration ==============//

// CSRF Attack Protection
const csrfProtection = csrf()
app.use(csrfProtection)
app.use( async (req, res, next) => {
    try{
        if(req.session.isSeller){
            req.user = await Seller.findById(req.session.user._id)
        } else if(req.session.user) {
            req.user = await User.findById(req.session.user._id)
        }
    }
    catch(err){
        console.log(err)
    }
    next()
})

// Pass some values to all rendered views
app.use((req, res, next)=> {
    res.locals.isSeller = req.session.isSeller || false
    res.locals.isCustomer = req.session.isCustomer || false
    res.locals.isLoggedIn = req.session.isLoggedIn || false
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use('/a', (req, res, next)=>{
    return res.render('./shop/home', {path: '/shop'})
})
app.use(userRouter)
app.use('/seller', sellerRouter)
app.use('*', (req, res)=>{
    res.render('404.ejs', {title: '404 Page NOT Found', path:'404'})
})

// Global error handling
app.use((err, req, res, next) => {
    console.log(err)
    res.status(500).render('./500', {title: 'Server Error', path: '500'})
})
const port = process.env.PORT || 3000
const connectDB = async () => {
   await mongoose.connect('mongodb://127.0.0.1:27017/shop')
   console.log(`Connected to DB successfully`)
   app.listen(port, _ => {
    console.log(`Server listening on port ${port}`)
})}
connectDB()