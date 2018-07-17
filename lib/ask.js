// 异步处理工具
const async = require('async');
// 命令行与用户之间的交互
const inquirer = require('inquirer');


const evaluate = require('./eval');

const promptMapping = {
    string: 'input',
    boolean: 'confirm'
}

module.exports = function ask(prompts, data, done) {
    // 遍历处理prompts下的每一个字段
    async.eachSeries(Object.keys(prompts), (key, next) => {
        // console.log('data 0000000:', data);
        prompt(data, key, prompts[key], next)
    }, done);
}

function prompt(data, key, prompt, done) {
    // 不知道 为什么， 就是没有这个字段
    data.isNotTest = true;
    // skip prompts whose when condition is not met
    /*
      data:  {
        destDirName: 'myProgramm',
        inPlace: false,
        noEscape: true,
        isNotTest: true
      }

      exp: isNotTest
    */
    // console.log('data 11111:', data);
    // console.log('exp 22222:', prompt.when);
    // console.log('exp 33333:', prompt.message);
    if (prompt.when && !evaluate(prompt.when, data)) {
        return done()
    }

    // 获取默认值
    let promptDefault = prompt.default
    if (typeof prompt.default === 'function') {
        promptDefault = function() {
            return prompt.default.bind(this)(data)
        }
    }

    // 设置问题，具体使用方法可去https://github.com/SBoudrias/Inquirer.js上面查看
    inquirer.prompt([{
        type: promptMapping[prompt.type] || prompt.type,
        name: key,
        message: prompt.message || prompt.label || key,
        default: promptDefault,
        choices: prompt.choices || [],
        validate: prompt.validate || (() => true)
    }]).then(answers => {
        if (Array.isArray(answers[key])) {
            // 当答案是一个数组时
            data[key] = {}
            answers[key].forEach(multiChoiceAnswer => {
                data[key][multiChoiceAnswer] = true
            })
        } else if (typeof answers[key] === 'string') {
            // 当答案是一个字符串时
            data[key] = answers[key].replace(/"/g, '\\"')
        } else {
            // 其他情况
            data[key] = answers[key]
        }
        done()
    }).catch(done)
}