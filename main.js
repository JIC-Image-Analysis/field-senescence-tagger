'use strict';

var app = require('electron').app;
var BrowserWindow = require('electron').BrowserWindow;
var globalShortcut = require('electron').globalShortcut;

var fs = require('fs');

var mainWindow = null;

var images_dir = 'data/yeast_data';

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        height: 620,
        width: 820,
        resizable: false,
        frame: false
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

    var currentFile = 0;

    var tags = new Object();

    var nextFile = function () {
        currentFile++;
        var fq_file_path = '../' + images_dir + '/' + files[currentFile];
        mainWindow.webContents.send('load-image', {msg: fq_file_path});
    };

    var prevFile = function() {
        currentFile--;
        var fq_file_path = '../' + images_dir + '/' + files[currentFile];
        mainWindow.webContents.send('load-image', {msg: fq_file_path});       
    };

    globalShortcut.register('1', function() {
        tags[files[currentFile]] = 'good';
        nextFile();
    });

    globalShortcut.register('2', function() {
        tags[files[currentFile]] = 'bad';
        nextFile();
    });

    globalShortcut.register('l', nextFile);
    globalShortcut.register('h', prevFile);

    globalShortcut.register('s', function() {

        var f = fs.openSync("tags.out", "w");

        Object.keys(tags).forEach(function(key) {
            fs.writeSync(f, key + '\t' + tags[key] + '\n');
        });

    });

    globalShortcut.register('q', function() {
        app.quit();
    });

    globalShortcut.register('Esc', function() {
        app.quit();
    });

});
