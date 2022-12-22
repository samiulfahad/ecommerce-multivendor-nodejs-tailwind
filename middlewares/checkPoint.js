exports.isAuthenticated = (req, res, next) => {
    if(!req.session.isLoggedIn){
        req.flash('redirect', req.url)
        return res.redirect('/login')
    }
    next()
}

exports.isSeller = (req, res, next) => {
    if(!req.session.isSeller){
        req.flash('redirect', req.url)
        return res.redirect('/seller/signup')
    }
    next()
}

exports.isActive = (req, res, next) => {
    if(!req.session.isLoggedIn && !req.session.user.isSeller && !req.session.isActive){
        req.flash('redirect', req.url)
        return res.redirect('/login')
    }
    next()
}