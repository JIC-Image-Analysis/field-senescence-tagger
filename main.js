'use strict';

var app = require('electron').app;
var BrowserWindow = require('electron').BrowserWindow;
var globalShortcut = require('electron').globalShortcut;
const {dialog} = require('electron')

var fs = require('fs');

var mainWindow = null;

var images_dir = 'data/cell-data';

var TaggedImage = function() {};

var generateImagePathArrays = function(imagesDir, keywords) {
    /* Load files from a directory. The keywords are used to split the files
    up into different arrays. The function returns three arrays. */

    var files = fs.readdirSync(imagesDir);

    var nKeywords = keywords.length

    var pathArrays = [[], [], []]

    for (var i = 0; i < files.length; i++) {
        for (var j = 0; j < nKeywords; j++) {
            if (files[i].indexOf(keywords[j]) !== -1) {
                pathArrays[j].push(imagesDir + '/' + files[i]);
            }
        }
    }
    
    return pathArrays

};

var zipArrays = function(arrays) {

    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });

}

app.on('ready', function() {

    mainWindow = new BrowserWindow({
        height: 620,
        width: 820,
        resizable: false,
        frame: false
    });


    //var files = fs.readdirSync(images_dir);


    var keywords = ['wall', 'marker', 'combined']

    var fileNameArrays = generateImagePathArrays(images_dir, keywords);
    var tripletArrays = zipArrays(fileNameArrays);

    console.log(tripletArrays);


    mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    //mainWindow.openDevTools();

    var currentFile = 0;

    mainWindow.webContents.on('did-finish-load', function() {
        mainWindow.webContents.send('load-many-images', {files: tripletArrays[0], tag: "Untagged"});
        mainWindow.show();
    });

    var tags = new Object();
    tripletArrays.forEach(function(files) {
        tags[files[0]] = "Untagged";
    });

    var nextFile = function () {
        if ((currentFile+1) < tripletArrays.length) {
            currentFile++;
            mainWindow.webContents.send('load-many-images', {files: tripletArrays[currentFile], tag: 'hello'});                        
        };
    };

    var prevFile = function() {
        if (currentFile > 0) {
            currentFile--;
            mainWindow.webContents.send('load-many-images', {files: tripletArrays[currentFile]});
        };
    };

    globalShortcut.register('1', function() {
        tags[files[currentFile]] = 'good';
        var fq_file_path = '../' + images_dir + '/' + files[currentFile];
        mainWindow.webContents.send('load-image', {msg: fq_file_path, tag: tags[files[currentFile]]});       

        //nextFile();
    });

    globalShortcut.register('2', function() {
        tags[files[currentFile]] = 'bad';
        var fq_file_path = '../' + images_dir + '/' + files[currentFile];
        mainWindow.webContents.send('load-image', {msg: fq_file_path, tag: tags[files[currentFile]]});       
        //nextFile();
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

    globalShortcut.register('o', function() {
        var dir = dialog.showOpenDialog({properties: ['openDirectory']});
        console.log(dir);
    })

});
