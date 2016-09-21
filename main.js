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
    /* Input arrays of arrays the form [[1, 2, ...], [a, b, ...], ...] and
    return arrays of the form [[1, a, ...], [2, b, ..], ..] */

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

    var findFileNamesFromDirectory = function(imagesDir) {

        var keywords = ['wall', 'marker', 'combined'];

        var fileNameArrays = generateImagePathArrays(imagesDir, keywords);

        var tripletArrays = zipArrays(fileNameArrays);

        return tripletArrays;
    }

    var saveTags = function() {
        var f = fs.openSync("tags.out", "w");

        Object.keys(tags).forEach(function(key) {
            fs.writeSync(f, key + '\t' + tags[key] + '\n');
        });
    }

    var quiteImageTagger = function() {
        saveTags();
        app.quit();
    }

    var tags;
    var tripletArrays;

    mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    //mainWindow.openDevTools();

    var currentFile = 0;

    // mainWindow.webContents.on('did-finish-load', function() {
    //     mainWindow.webContents.send('load-many-images', {files: tripletArrays[0], tag: "Untagged"});
    //     mainWindow.show();
    // });

    var setInitialTags = function(nameArrays) {

        var initialTags = new Object();
        nameArrays.forEach(function(files) {
            initialTags[files[0]] = "Untagged";
        });

        return initialTags;
    }


    var showTag = function(newTag) {
        mainWindow.webContents.send('set-tag',
          {tag: newTag, pos: currentFile, tot: tripletArrays.length});       
    }

    var nextFile = function () {
        if ((currentFile+1) < tripletArrays.length) {
            currentFile++;
            mainWindow.webContents.send('load-many-images', {files: tripletArrays[currentFile], pos: currentFile, tot: tripletArrays.length});    
            console.log(tripletArrays[currentFile]);
            showTag(tags[tripletArrays[currentFile][0]]);                    
        };
    };

    var prevFile = function() {
        if (currentFile > 0) {
            currentFile--;
            mainWindow.webContents.send('load-many-images', {files: tripletArrays[currentFile], pos: currentFile, tot: tripletArrays.length});
            showTag(tags[tripletArrays[currentFile][0]]);                    
        };
    };

    globalShortcut.register('1', function() {
        var newTag = 'good';
        tags[tripletArrays[currentFile][0]] = newTag;
        showTag(newTag);
    });

    globalShortcut.register('2', function() {
        var newTag = 'bad';
        tags[tripletArrays[currentFile][0]] = newTag;
        showTag(newTag);
    });

    globalShortcut.register('l', nextFile);
    globalShortcut.register('h', prevFile);

    globalShortcut.register('s', saveTags);

    globalShortcut.register('q', quiteImageTagger);
    globalShortcut.register('Esc', quiteImageTagger);

    globalShortcut.register('o', function() {
        var dir = dialog.showOpenDialog({properties: ['openDirectory']});

        tripletArrays = findFileNamesFromDirectory(dir[0]);

        mainWindow.webContents.send('load-many-images', {files: tripletArrays[0], pos: 0, tot: tripletArrays.length, tag: "Untagged"});

        tags = setInitialTags(tripletArrays);
    })

});
