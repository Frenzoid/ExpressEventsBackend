const fs = require("fs");


module.exports = class images {

    static saveImage(pathname, base64){
        let avabuff =  Buffer.from(base64.split(',')[1], "base64");
        fs.writeFileSync(pathname, avabuff);
    }

    static getFormat(encoded){
        var result = null;
        
        if (typeof encoded !== 'string') {
            return result;
        }

        var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);

        if (mime && mime.length) {
            mime = mime[1].split('/');
            return mime[1];
        }

        return result;
    }

}    