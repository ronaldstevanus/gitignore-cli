#!/usr/bin/env node

`use strict`;

const { version } = require('../package.json');
const program = require('commander');
const axios = require('axios');
const fs = require('fs');
const { performance } = require('perf_hooks');

program
    .version(version)
    .usage('<programming language or technology>')
    .parse(process.argv);

// must have argument
if (program.args.length != 1) {
    program.help();
    return;
}

// argument must not be empty
const arg = program.args[0];
if (arg.trim().length == 0) {
    console.log('Invalid argument');
    return;
}

console.log('Fetching gitignore for %s...', arg);

const expectedGitignoreFile = arg.trim().toLocaleLowerCase() + '.gitignore';

let startTime = performance.now();
axios.get('https://api.github.com/repos/github/gitignore/contents')
    .then(response => { // success
        if (Array.isArray(response.data)) {
            const contents = response.data;
            let result = null;
            for (let value of contents) {
                if (value.type == 'file' && 
                    value.name.trim().toLocaleLowerCase() == expectedGitignoreFile) {
                    result = value;
                    break;
                }
            }
            if (result === null) {
                console.log('Gitignore file is not found for: ' + arg);
                return;
            }

            console.log('Gitignore file found: ' + result.download_url);
            return axios({
                method:'get',
                url:result.download_url,
                responseType:'stream'
            })
            .then(function (response) {
                response.data.pipe(fs.createWriteStream('.gitignore'))
            });
        } else {
            console.log('Unexpected response: ' + response);
        }
    })
    .catch(error => { // error
        console.log(error);
    })
    .then(() => { // complete
        console.log(`Done in ${((performance.now() - startTime) / 1000).toFixed(2)} seconds`);
    })
