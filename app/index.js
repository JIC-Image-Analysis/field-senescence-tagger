'use strict';

const electron = require('electron');
const ipcRenderer = require('electron').ipcRenderer;

var positionIds = ['topLeft', 'bottomLeft', 'topRight'];

var getTagText = function(data) {
    var pos = data.pos + 1
    return data.tag + " [" + pos + "/" + data.tot + "]";
};

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

ipcRenderer.on('set-help', function(event, data) {
    console.log('set-help');
    document.getElementById('help').innerHTML = data.help_html;
});

ipcRenderer.on('set-tag', function(event, data) {
    var text = getTagText(data);
    document.getElementById('tag').innerHTML = text;
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
    console.log('load-many-images...');
    var filenames = data.files;

    for( var i = 0; i < filenames.length; i++) {
        document.getElementById(positionIds[i]).src = filenames[i];

    }

    prepImage('#topRight');
    prepImage('#bottomLeft');
    prepImage('#topLeft');

    var text = getTagText(data);
    document.getElementById('tag').innerHTML = text;
    document.getElementById('help').style.display = 'none';
    document.getElementById('viewer').style.display = 'block';

});


ipcRenderer.on('toggle-help', function(event, data) {
    var help_element = document.getElementById('help'),
        help_style = window.getComputedStyle(help_element),
        help_display = help_style.getPropertyValue('display');
    if (help_display != 'none') {
        document.getElementById('help').style.display = 'none';
        document.getElementById('viewer').style.display = 'block';
    } else {
        document.getElementById('help').style.display = 'block';
        document.getElementById('viewer').style.display = 'none';
    }

});

console.log(global.location.search);