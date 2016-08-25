'use strict';

var app = require('electron').app;
var BrowserWindow = require('electron').BrowserWindow;
var globalShortcut = require('electron').globalShortcut;

var fs = require('fs');

var mainWindow = null;

var images_dir = 'data/yeast_data';

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        height: 768,
        width: 1024
    });


    globalShortcut.register('1', function () {
        mainWindow.webContents.send('global-shortcut', 0);
        console.log('1');
    });

    var files = fs.readdirSync(images_dir);

    console.log(files);

    var startFile = '../' + images_dir + '/' + files[0];

    mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    mainWindow.webContents.on('did-finish-load', function() {
        mainWindow.webContents.send('load-image', {msg: startFile});
        mainWindow.show();
    });

    //mainWindow.openDevTools();

    var currentFile = 1;

    var tags = new Object();

    globalShortcut.register('2', function () {
        var fq_file_path = '../' + images_dir + '/' + files[currentFile];
        mainWindow.webContents.send('load-image', {msg: fq_file_path});
        tags[fq_file_path] = 'yay';
        currentFile++;

        //console.log(tags);
    });

    globalShortcut.register('s', function() {
        console.log('save');

        var f = fs.openSync("tags.out", "w");

        fs.writeFileSync(f, "Hello.", 'utf8');

        Object.keys(tags).forEach(function(key) {
            fs.writeSync(f, key + '\t' + tags[key] + '\n');
//            console.log(key);
        });

    });


});
