const fs = require('fs');
exports.deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if(err)
        return next(err);
    })
}