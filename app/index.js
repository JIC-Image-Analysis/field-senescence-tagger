'use strict';

const electron = require('electron');
const ipcRenderer = require('electron').ipcRenderer;

var positionIds = ['topLeft', 'bottomLeft', 'topRight'];

ipcRenderer.on('global-shortcut', function(arg) {

    console.log('hello');
    console.log(arg);
    document.getElementById("mainImage").src = "../data/sequence/z250.png";
});

ipcRenderer.on('load-image', function(event, data) {
    var filename = data.msg;
    var pos = data.pos;

    document.getElementById(pos).src = filename;
    document.getElementById("tag").innerHTML = data.tag;

    console.log(filename);

});

ipcRenderer.on('set-tag', function(event, data) {
    document.getElementById('tag').innerHTML = data.tag;
});

ipcRenderer.on('load-many-images', function(event, data) {
    var filenames = data.files;

    var relativise = function(fn) {
        return '../' + fn;
    }

    for( var i = 0; i < filenames.length; i++) {
        document.getElementById(positionIds[i]).src = relativise(filenames[i]);
    }

    document.getElementsByIf('tag').innerHTML = data.tag;

});

console.log(global.location.search);