#!/usr/bin/env node
'use strict';
/* eslint-disable no-console */
const argv = require('yargs')
  .usage(
    `Usage:\n $0 <file> [-d=?]

  If no file is specified, reads from stdin`,
  )
  .option('d', {
    alias: 'delimiter',
    describe: 'Specify a custom delimiter ( i.e. <? instead of <% )',
    type: 'string',
  })
  .option('preprocessor-include', {
    describe: 'Allow old (pre-EJS v3) preprocessor-style includes',
    type: 'boolean',
  })
  .option('caret', {
    describe: 'Display a caret (^) in the line below an error',
    type: 'boolean'
  }).argv;
const glob = require('globby').sync;
const read = require('read-input');
const ejsLint = require('./index.js');

const opts = {
  delimiter: argv.delimiter,
  preprocessorInclude: argv['preprocessor-include'],
  caret: argv['caret']
};
read(glob(argv._))
  .then((res) => {
    let errored = false;
    res.files.forEach((file) => {
      const err = ejsLint(file.data, opts);
      if (err) {
        errored = true;
        let message = `${err.message} (${err.line}:${err.column})`;
        if (file.name) {
          message += ` in ${file.name}`;
        }
        message += `\n${errorContext(err, file, opts)}`;
        console.error(message);
      }
    });
    if (errored) process.exit(1);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

function errorContext(err, file, options = { } ) {
  console.log(options)
  require('colors');
  const lines = file.data.split(/\r?\n/);
  const lineText = lines[err.line - 1];
  const before = lineText.substr(0, err.column - 1);
  const during = lineText.substr(err.column - 1, 1);
  const after = lineText.substr(err.column);
  const caret = '^';
  const lineBreak = '\n';
  const caretLine = spaces(err.column - 1) + caret;
  // let highlight = '';
  // if (options.bg == 'red') { 
  let highlight = before + during.bgRed + after; 
  // }
  // else { 
  //  highlight = lineText;
  // }
  if (options.caret == true) return highlight + lineBreak + caretLine;
  else return highlight;
}

function spaces(n) {
  let str = '';
  for (var i=0; i<n; i++) {
    str += ' ';
  }
  return str;
}
