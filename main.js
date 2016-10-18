'use strict';

var app = require('electron').app;
var BrowserWindow = require('electron').BrowserWindow;
var globalShortcut = require('electron').globalShortcut;
const {dialog} = require('electron');
const ipcMain = require('electron').ipcMain;

var fs = require('fs');
var marked = require('marked');

var mainWindow = null;

var ImageSet = function() {};
var imageSets = [];

var generateImagePathArrays = function(imagesDir, keywords) {
    /* Load files from a directory. The keywords are used to split the files
    up into different arrays. The function returns three arrays. */

    var files = fs.readdirSync(imagesDir);

    var nKeywords = keywords.length

    var pathArrays = [];

    for (var i = 0; i < nKeywords; i++) {
        pathArrays.push([]);
    }

    for (var i = 0; i < files.length; i++) {
        for (var j = 0; j < nKeywords; j++) {
            if (files[i].indexOf(keywords[j]) !== -1) {
                pathArrays[j].push(imagesDir + '/' + files[i]);
            }
        }
    }
    
    return pathArrays

};

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

var loadImagesetsFromDirectory = function(imagesDir) {

    var keywords = ['wall', 'marker', 'combined', 'json'];

    var fileNameArrays = generateImagePathArrays(imagesDir, keywords);

    var dataArrays = zipArrays(fileNameArrays);

    var imageSets = [];

    for(var i = 0; i < dataArrays.length; i++) {
        var is = new ImageSet();
        is.metadata = loadJSONData(dataArrays[i][3]);
        is.jsonFilename = dataArrays[i][3];
        is.filenames = dataArrays[i];
        imageSets.push(is);       
    }

    return imageSets;
}

app.on('ready', function() {

    ipcMain.on('mainlog', function(event, data) {
        console.log('From renderer: ' + data.msg);
    });

    ipcMain.on('registerClick', function(event, data) {

        imageSets[currentFile].metadata['normalised_marker_x_coord'] = data.x;
        imageSets[currentFile].metadata['normalised_marker_y_coord'] = data.y;
        var x = data.x.toFixed(3);
        var y = data.y.toFixed(3);
        imageSets[currentFile].metadata['tag'] = 'clicked (' + x + ',' + y + ')';

        showCurrentImageSet();
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

        saveImageSetData();

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
            var help_markdown = data;
            var help_html = marked(help_markdown);
            mainWindow.webContents.send('set-help', {help_html:
                help_html});
        });
    });

    var setInitialTags = function(nameArrays) {

        var initialTags = new Object();
        nameArrays.forEach(function(files) {
            initialTags[files[0]] = "Untagged";
        });

        return initialTags;
    }

    var showCurrentImageSet = function() {
        mainWindow.webContents.send('load-imageSet', imageSets[currentFile]);
        var statusText = 'Image ' + (currentFile + 1).toString() + ' of ' + (1 + imageSets.length).toString();
        updateStatus(statusText);
    }

    var updateStatus = function(text) {
        mainWindow.webContents.send('update-status', text);
    }

    var setCurrentTag = function(tagText) {
        imageSets[currentFile].metadata['tag'] = tagText;
        showCurrentImageSet();
    }

    var nextFile = function () {
        if ((currentFile+1) < imageSets.length) {
            currentFile++;
            showCurrentImageSet();
        };
    };

    var prevFile = function() {
        if (currentFile > 0) {
            currentFile--;
            showCurrentImageSet();
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

    globalShortcut.register('h', toggleHelp);

    globalShortcut.register('l', nextFile);
    globalShortcut.register('Right', nextFile);

    globalShortcut.register('h', prevFile);
    globalShortcut.register('Left', prevFile);

    globalShortcut.register('s', saveImageSetData);

    globalShortcut.register('q', quitImageTagger);
    globalShortcut.register('Esc', quitImageTagger);

    globalShortcut.register('o', function() {
        var dir = dialog.showOpenDialog({properties: ['openDirectory']});

        imageSets = loadImagesetsFromDirectory(dir[0]);

        currentFile = 0;
        //mainWindow.webContents.send('load-imageSet', imageSets[curentFile]);
        showCurrentImageSet();
    })


});
