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

ipcRenderer.on('load-image', function(event, fieldImage) {
    var filename = fieldImage.filename;
    //var pos = data.pos;

    document.getElementById("fieldImage").src = filename;

    console.log(filename);

});

ipcRenderer.on('set-help', function(event, data) {
    console.log('set-help');
    document.getElementById('help').innerHTML = data.help_html;
});

var setTag = function(text) {
    document.getElementById('tag').innerHTML = text;
}

ipcRenderer.on('set-tag', function(event, data) {
    var text = getTagText(data);
    setTag(text);
});

var mainLog = function(message) {
    ipcRenderer.send('mainlog', {msg: message});
}

var sendClickToMain = function(x, y) {
    ipcRenderer.send('registerClick', {x: x, y: y});
}

var prepImage = function(selectorName) {
    var item = document.querySelector(selectorName);
    item.addEventListener('click', function(event) {
        var elemRect = item.getBoundingClientRect();
        var height = item.height;
        var width = item.width;
        var absX = event.clientX - elemRect.left;
        var absY = event.clientY - elemRect.top;
        var normX = absX / width;
        var normY = absY / height;
        sendClickToMain(normX, normY);      
    });

};

ipcRenderer.on('set-clickFunctions', function(event) {

    prepImage('#topRight');
    prepImage('#bottomLeft');
    prepImage('#topLeft');   
});

ipcRenderer.on('load-imageSet', function(event, imageSet) {

    var filenames = imageSet.filenames;

    for( var i = 0; i < 3; i++) {
        document.getElementById(positionIds[i]).src = filenames[i];
    }


    if ('tag' in imageSet.metadata) {
        document.getElementById('tag').innerHTML = imageSet.metadata['tag'];
    } else {
        document.getElementById('tag').innerHTML = 'untagged';
    }

    document.getElementById('help').style.display = 'none';
    document.getElementById('viewer').style.display = 'block';

});

ipcRenderer.on('update-status', function(event, data) {
    document.getElementById('status').innerHTML = data;
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