module.exports = (req, res, next) => {
    if(!req.session.isAdminLoggedIn){
        return res.redirect('/admin/login');
    }
    next()
}