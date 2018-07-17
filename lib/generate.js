// 静态网站生成器
const path = require('path')
const Metalsmith = require('metalsmith');
const async = require('async');
const multimatch = require('multimatch');
const render = require('consolidate').handlebars.render
const Handlebars = require('handlebars');

const getOptions = require('./options')
const ask = require('./ask')
const filter = require('./filter')


Handlebars.registerHelper('if_eq', function(a, b, opts) {
    return a === b ? opts.fn(this) : opts.inverse(this)
})

Handlebars.registerHelper('unless_eq', function(a, b, opts) {
    return a === b ? opts.inverse(this) : opts.fn(this)
})

module.exports = function generate (name, src, dest , done) {
    const opts = getOptions(src);
    // 初始化Metalsmith对象
    const metalsmith = Metalsmith(path.join(src, 'template'));
    const data = Object.assign(metalsmith.metadata(), {
        destDirName: name,
        inPlace: dest === process.cwd(),
        noEscape: true
    });

    // 注册配置对象中的helper
    opts.helpers && Object.keys(opts.helpers).map(key => {
        Handlebars.registerHelper(key, opts.helpers[key])
    })

    // 询问问题     过滤文件            渲染模板
    metalsmith
        .use(askQuestions(opts.prompts))
        .use(filterFiles(opts.filters))
        .use(renderTemplateFiles([]));

    // 渲染模板
    metalsmith
        .use(renderTemplateFiles([]));

    metalsmith.clean(false)
        .source('.')
        .destination(dest)
        .build((err, files) => {
            done(err);
        })

    return data;
}

function renderTemplateFiles(skipInterpolation) {
    skipInterpolation = typeof skipInterpolation === 'string' ? [skipInterpolation] : skipInterpolation
    return (files, metalsmith, done) => {
        const keys = Object.keys(files);
        const metalsmithMetadata = metalsmith.metadata();
        async.each(keys, (file, next) => {
            if (multimatch([file], skipInterpolation, {dot: true}).length) {
                return next();
            }

            const str = files[file].contents.toString();
            // 跳过不符合handlebars语法的file
            if (!/{{([^{}]+)}}/g.test(str)) {
                return next()
            }
            // 渲染文件
            render(str, metalsmithMetadata, (err, res) => {
                if (err) {
                    err.message = `[${file}] ${err.message}`;
                    return next(err);
                }
                files[file].contents = new Buffer(res);
                next();
            })
        }, done);
    }
}


// 询问问题
function askQuestions(prompts) {
    return (files, metalsmith, done) => {
        // console.log('metalsmith aaaaaaaa:', metalsmith);
        // console.log('metalsmith.metadata() 22222222222:', metalsmith.metadata());
        ask(prompts, metalsmith.metadata(), done)
    }
}
// 过滤文件
function filterFiles(filters) {
    return (files, metalsmith, done) => {
        filter(files, filters, metalsmith.metadata(), done)
    }
}