'use strict';

var app = require('electron').app;
var BrowserWindow = require('electron').BrowserWindow;
var globalShortcut = require('electron').globalShortcut;
const {dialog} = require('electron');
const ipcMain = require('electron').ipcMain;

var fs = require('fs');
var marked = require('marked');

var mainWindow = null;

var images_dir = 'data/cell-data';

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

        showTag('clicked');
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

    var saveTags = function() {
        var f = fs.openSync("tags.out", "w");

        Object.keys(tags).forEach(function(key) {
            fs.writeSync(f, key + '\t' + tags[key] + '\n');
        });

        for(var i = 0; i < imageSets.length; i++) {
            f = fs.openSync(imageSets[i].jsonFilename, "w");
            fs.writeSync(f, JSON.stringify(imageSets[i].metadata, null, '\t'));
        }
    }

    var quiteImageTagger = function() {
        if (tags) {
            saveTags();
        }
        app.quit();
    }

    var tags;
    var dataArrays;

    mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    //mainWindow.openDevTools();

    var currentFile = 0;

    // mainWindow.webContents.on('did-finish-load', function() {
    //     mainWindow.webContents.send('load-many-images', {files: dataArrays[0], tag: "Untagged"});
    //     mainWindow.show();
    // });
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


    var showTag = function(newTag) {
        mainWindow.webContents.send('set-tag',
          {tag: newTag, pos: currentFile, tot: dataArrays.length});       
    }

    var nextFile = function () {
        if ((currentFile+1) < dataArrays.length) {
            currentFile++;
            mainWindow.webContents.send('load-many-images', {files: dataArrays[currentFile], 
                pos: currentFile, 
                tot: dataArrays.length,
                imageSet: imageSets[currentFile]
            });    
            console.log(dataArrays[currentFile]);
            //showTag(tags[dataArrays[currentFile][0]]);                    
        };
    };

    var prevFile = function() {
        if (currentFile > 0) {
            currentFile--;
            mainWindow.webContents.send('load-many-images', {files: dataArrays[currentFile], pos: currentFile, tot: dataArrays.length});
            showTag(tags[dataArrays[currentFile][0]]);                    
        };
    };

    var toggleHelp = function() {
        mainWindow.webContents.send('toggle-help', {});
    }

    globalShortcut.register('1', function() {
        var newTag = 'good';
        tags[dataArrays[currentFile][0]] = newTag;
        showTag(newTag);
	setTimeout(nextFile, 100);
    });

    globalShortcut.register('2', function() {
        var newTag = 'bad';
        tags[dataArrays[currentFile][0]] = newTag;
        showTag(newTag);
	setTimeout(nextFile, 100);
    });

    globalShortcut.register('h', toggleHelp);

    globalShortcut.register('l', nextFile);
    globalShortcut.register('Right', nextFile);

    globalShortcut.register('h', prevFile);
    globalShortcut.register('Left', prevFile);

    globalShortcut.register('s', saveTags);

    globalShortcut.register('q', quiteImageTagger);
    globalShortcut.register('Esc', quiteImageTagger);

    globalShortcut.register('o', function() {
        var dir = dialog.showOpenDialog({properties: ['openDirectory']});

        dataArrays = findFileNamesFromDirectory(dir[0]);

        console.log(dataArrays);
        imageSets = loadImagesetsFromDirectory(dir[0]);

        mainWindow.webContents.send('load-many-images', {files: dataArrays[0], 
            pos: 0, tot: dataArrays.length, 
            tag: "Untagged",
            imageSet: imageSets[currentFile]
        });
        //jd = loadJSONData(dataArrays[0][3]);


        tags = setInitialTags(dataArrays);


    })


});
