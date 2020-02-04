exports.get404 = (req, res, next) => {
    res.status(404).render('404', {
        pagetitle : 'Page Not Found',
        path : '/error'
    })
}