'use strict';

var app = require('electron').app;
var BrowserWindow = require('electron').BrowserWindow;
var globalShortcut = require('electron').globalShortcut;
const {dialog} = require('electron');
const ipcMain = require('electron').ipcMain;

var fs = require('fs');
const path = require('path');
var marked = require('marked');

var mainWindow = null;

var FieldImageData = function() {};
var fieldImages = [];
var imageFileNames = [];

var clickLocations = [ 'topLeftPlot', 'topRightPlot', 'bottomLeftPlot', 'bottomRightPlot' ];
var clickLocation = 0;

var loadJSONData = function(fq_filename) {
    /* Read data from the fully qualifiled filename, parse as JSON and return
    the result. */

    var JSONData = JSON.parse(fs.readFileSync(fq_filename, 'utf8'));

    return JSONData;

}

var zipArrays = function(arrays) {
    /* Input arrays of arrays the form [[1, 2, ...], [a, b, ...], ...] and
    return arrays of the form [[1, a, ...], [2, b, ..], ..] */

    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });

}

var loadImagesFromDirectory = function(imagesDir) {
    var extension = 'JPG';

    var files = fs.readdirSync(imagesDir);

    var imageFileNames = [];

    for (var i = 0; i < files.length; i++) {
        // FIXME - this will also match when JPG is in the name but not the final characters
        if (files[i].indexOf(extension) !== -1) {
            var fid = new FieldImageData();
            fid.filename = imagesDir + '/' + files[i];
            fid.metadata = {}
            fieldImages.push(fid);
        }

    }
    console.log(imageFileNames);
}

app.on('ready', function() {

    ipcMain.on('mainlog', function(event, data) {
        console.log('From renderer: ' + data.msg);
    });

    ipcMain.on('registerClick', function(event, data) {
        // console.log('Received registerClick');

        // console.log(data.x);
        // console.log(data.y);

        fieldImages[currentFile].metadata[clickLocations[clickLocation]] = data.x + ',' + data.y;
        clickLocation++;
        if (clickLocation >= clickLocations.length) {
            console.log(JSON.stringify(fieldImages[currentFile].metadata, null, '\t'));
            nextFile();
            clickLocation = 0;
        }
        updateStatus();
        //if (clickLocation >= clickLocations.length) clickLocation = 0;

        // imageSets[currentFile].metadata['normalised_marker_x_coord'] = data.x;
        // imageSets[currentFile].metadata['normalised_marker_y_coord'] = data.y;
        // var x = data.x.toFixed(3);
        // var y = data.y.toFixed(3);
        // imageSets[currentFile].metadata['tag'] = 'clicked (' + x + ',' + y + ')';

        // showCurrentImageSet();

        // setTimeout(nextFile, 0);
    });

    mainWindow = new BrowserWindow({
        height: 620,
        width: 820,
        resizable: false,
        frame: false
    });

    var findFileNamesFromDirectory = function(imagesDir) {

        var keywords = ['wall', 'marker', 'combined', 'json'];

        var fileNameArrays = generateImagePathArrays(imagesDir, keywords);

        var dataArrays = zipArrays(fileNameArrays);

        return dataArrays;
    }

    var saveImageSetData = function() {


        for(var i = 0; i < imageSets.length; i++) {
            var f = fs.openSync(imageSets[i].jsonFilename, "w");
            fs.writeSync(f, JSON.stringify(imageSets[i].metadata, null, '\t'));
        }

        updateStatus('Saved');
    }

    var quitImageTagger = function() {

        //saveImageSetData();

        app.quit();
    }

    mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    //mainWindow.openDevTools();

    var currentFile = 0;

    mainWindow.webContents.on('did-finish-load', function() {
        fs.readFile("README.md", "utf8", function(err, data) {
            if (err) {
                return console.log(err);
            }
            // var help_markdown = data;
            // var help_html = marked(help_markdown);
            // mainWindow.webContents.send('set-help', {help_html:
            //     help_html});
        });

        mainWindow.webContents.send('set-clickFunctions');

    });

    var setInitialTags = function(nameArrays) {

        var initialTags = new Object();
        nameArrays.forEach(function(files) {
            initialTags[files[0]] = "Untagged";
        });

        return initialTags;
    }


    var showCurrentImage = function() {
        console.log(fieldImages[currentFile].filename);
        mainWindow.webContents.send('load-image', fieldImages[currentFile]);
        updateStatus();      
    }

    var updateStatus = function() {
        var statusText = 'Image ' + (currentFile + 1).toString() + ' of ' + (1 + fieldImages.length).toString();
        statusText += '                  '
        statusText += clickLocations[clickLocation];
        mainWindow.webContents.send('update-status', statusText);
    }

    var setCurrentTag = function(tagText) {
        imageSets[currentFile].metadata['tag'] = tagText;
        showCurrentImageSet();
    }

    var nextFile = function () {    
        if ((currentFile+1) < fieldImages.length) {
            currentFile++;
            showCurrentImage();
        };
    };

    var prevFile = function() {
        if (currentFile > 0) {
            currentFile--;
            showCurrentImage();
        };
    };

    var toggleHelp = function() {
        mainWindow.webContents.send('toggle-help', {});
    }

    var possibleTags = ['Untagged', 'No marker', 'Border cell', 'Segmentation failure', 'Stoma'];

    possibleTags.forEach(function(tag, index) {
        globalShortcut.register(index.toString(), function() {
            setCurrentTag(tag);
            setTimeout(nextFile, 100);
        });
    });

    //globalShortcut.register('h', toggleHelp);

    globalShortcut.register('l', nextFile);
    globalShortcut.register('Right', nextFile);
    globalShortcut.register('Space', nextFile);

    globalShortcut.register('h', prevFile);
    globalShortcut.register('Left', prevFile);

    globalShortcut.register('s', saveImageSetData);

    globalShortcut.register('q', quitImageTagger);
    globalShortcut.register('Esc', quitImageTagger);

    globalShortcut.register('o', function() {
        var dir = dialog.showOpenDialog({properties: ['openDirectory']});

        imageFileNames = loadImagesFromDirectory(dir[0]);

        currentFile = 0;
        //mainWindow.webContents.send('load-imageSet', imageSets[curentFile]);
        showCurrentImage();
        //showCurrentImageSet();
    })


});
