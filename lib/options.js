const path = require('path');
const exists = require('fs').existsSync;

module.exports = function options (dir) {
    const opts = getMetadata(dir);

    return opts;
}

function getMetadata (dir) {
    const json = path.join(dir, 'meta.json');
    const js = path.join(dir, 'meta.js');

    let opts = {};
    if (exists(json)) {
        opts = metadata.sync(json);
    } else if(exists(js)) {
        const req = require(path.resolve(js));
        if (req !== Object(req)) {
            throw new Error ('meta.js 要求是个object');
        }
        opts = req;
    }

    return opts;
}