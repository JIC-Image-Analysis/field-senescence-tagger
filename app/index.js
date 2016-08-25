'use strict';

const electron = require('electron');
const ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on('global-shortcut', function(arg) {

    console.log('hello');
    console.log(arg);
    document.getElementById("mainImage").src = "../data/sequence/z250.png";
});

ipcRenderer.on('load-image', function(event, data) {
    var filename = data.msg;

    document.getElementById("mainImage").src = filename;

    console.log(filename);

});

console.log(global.location.search);