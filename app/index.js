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

var mainLog = function(message) {
    ipcRenderer.send('mainlog', {msg: message});
}


var prepImage = function(selectorName) {
    var item = document.querySelector(selectorName);
    item.addEventListener('click', function(event) {
        var elemRect = item.getBoundingClientRect();
        mainLog('clicked ' + selectorName + ' ' + (event.clientX - elemRect.left) + ',' + (event.clientY - elemRect.top));       
    });
};

ipcRenderer.on('load-many-images', function(event, data) {
    var filenames = data.files;

    for( var i = 0; i < filenames.length; i++) {
        document.getElementById(positionIds[i]).src = filenames[i];

    }

    document.getElementById('tag').innerHTML = data.tag;

    //console.log('loaded');

    // var tl = document.querySelector('#topLeft');
    // tl.addEventListener('click', function(event) {
    //     mainLog('clicked ' + event.clientX + ',' + event.clientY);
    // });

    // var tl = document.querySelector('#topRight');
    // tl.addEventListener('click', function(event) {
    //     var elemRect = tl.getBoundingClientRect();
    //     mainLog('clicked ' + (event.clientX - elemRect.left) + ',' + (event.clientY - elemRect.top));
    // });

    prepImage('#topRight');
    prepImage('#bottomLeft');
    prepImage('#topLeft');


});



