/**
 * Export for iOS Photoshop Script
 *
 * Author: Daniel Wood (runloop.com)
 * Twitter: @loadedwino
 *
 * This script is intended to be used on a photoshop document containing retina 
 * artwork for iOS. It will resize, trim and save the selected layer or group, into a 
 * directory you select using the layer name (normalised) for the file name. There are a  
 * couple of resizing options you can select such as the
 * resizing method and whether to scale styles or not. It does not alter your original
 * document in anyway.
 *
 * Modified by Benoit Beausejour <b@turbulent.ca> 
 * - Bug fix for when ruler units are not set to pixels
 * - Added a textbox to allow user to edit the base name of the export
 *
 * Modified by Frederic Lemieux <flemieux@gmail.com> 
 * - Added support for cocos2d extensions scheme 
 * - Added an option to save for iPad: iOS standard generates ~ipad, cocos2d generates -hd and -ipadhd
 *
 * Feel free to share/reuse/modify to your hearts content. Attribution would be nice but
 * is not required.
 */
// constants
var ResizeMethod = {
    NEARESTNEIGHBOUR: {name: 'Nearest Neighbour', value: 'Nrst'},
    BILINEAR: {name: 'Bilinear', value: 'Blnr'},
    BICUBIC: {name: 'Bicubic', value: 'Bcbc'},
    BICUBICSMOOTHER: {name: 'Bicubic Smoother', value: 'bicubicSmoother'},
    BICUBICSHARPER: {name: 'Bicubic Sharper', value: 'bicubicSharper'}
};
var resizeMethodLookup = {};
resizeMethodLookup[ResizeMethod.NEARESTNEIGHBOUR.name] = ResizeMethod.NEARESTNEIGHBOUR.value;
resizeMethodLookup[ResizeMethod.BILINEAR.name] = ResizeMethod.BILINEAR.value;
resizeMethodLookup[ResizeMethod.BICUBIC.name] = ResizeMethod.BICUBIC.value;
resizeMethodLookup[ResizeMethod.BICUBICSMOOTHER.name] = ResizeMethod.BICUBICSMOOTHER.value;
resizeMethodLookup[ResizeMethod.BICUBICSHARPER.name] = ResizeMethod.BICUBICSHARPER.value;

var ResizeOptions = {
    REGULAR: 1,
    RETINA: 2
};

var exportDialog;

// http://davidchambersdesign.com/photoshop-save-for-web-javascript/
function saveForWebPNG(doc, outputFolderStr, filename)
{
    var opts, file;
    opts = new ExportOptionsSaveForWeb();
    opts.format = SaveDocumentType.PNG;
    opts.PNG8 = false;
    opts.quality = 100;
    if (filename.length > 27) {
        file = new File(outputFolderStr + "/temp.png");
        doc.exportDocument(file, ExportType.SAVEFORWEB, opts);
        file.rename(filename + ".png");
    }
    else {
        file = new File(outputFolderStr + "/" + filename + ".png");
        doc.exportDocument(file, ExportType.SAVEFORWEB, opts);
    }
}

function resizeImage(width, method, scaleStyles)
{
    var action = new ActionDescriptor();
    action.putUnitDouble( charIDToTypeID("Wdth"), charIDToTypeID("#Pxl"), width );
    
    if(scaleStyles == true)
        action.putBoolean( stringIDToTypeID("scaleStyles"), true );
    
    action.putBoolean( charIDToTypeID("CnsP"), true );
    action.putEnumerated( charIDToTypeID("Intr"), charIDToTypeID("Intp"), charIDToTypeID(method) );

    executeAction( charIDToTypeID("ImgS"), action, DialogModes.NO );
}

function exportImages(baseName, resizeOption, resizeMethod, scaleStyles)
{
    // select a folder to save to
    var folder = Folder.selectDialog(); 
    if(folder)
    {
        // Save original units
        var originalRulerUnits = app.preferences.rulerUnits ;
        var originalTypeUnits = app.preferences.typeUnits ;

        app.preferences.rulerUnits=Units.PIXELS;
        app.preferences.typeUnits=TypeUnits.PIXELS;


        // get currect document
        var doc = app.activeDocument;

        // create new document based on the current docs values except name which user 
        var dup = app.documents.add(doc.width, doc.height, doc.resolution, baseName, NewDocumentMode.RGB, DocumentFill.TRANSPARENT);

        // switch back to origal doc to allow duplicate
        app.activeDocument = doc;

        // duplicate the selected layer (only works for one) at place it in the new doc
        doc.activeLayer.duplicate(dup);

        // switch back to the new document
        app.activeDocument = dup;

        // trim the document so that all that appears is our element
        dup.trim(TrimType.TRANSPARENT);

        // adjust canvas size so that it is an even number of pixels (so scaling down fits on whole pixel)
        dup.resizeCanvas(Math.ceil(dup.width/2)*2, Math.ceil(dup.height/2)*2, AnchorPosition.TOPLEFT);
        
        // normalise name (basic normalisation lower case and hyphenated, modify or remove to taste)
        var normalisedName = dup.name.toLowerCase().replace(' ', '-');

        // export retina image
        if((resizeOption & ResizeOptions.RETINA) != 0) 
        {
            // Determine suffix to use
            suffix = "@2x";
            if (exportDialog.suffixPanel.standard.value == true) 
            {
                suffix = "@2x";                
                if (exportDialog.suffixPanel.saveForIPad.value == true) {
                    suffix += "~ipad";
                }
            }
            else if (exportDialog.suffixPanel.cocos2d.value == true)
                if (exportDialog.suffixPanel.saveForIPad.value == true)
                    suffix = "-ipadhd";
                else
                    suffix = "-hd";
            else if (exportDialog.suffixPanel.other.value == true)
                suffix = exportDialog.suffixPanel.suffixBox.text;

            saveForWebPNG(dup, folder.fullName, normalisedName + suffix);
        }

        if((resizeOption & ResizeOptions.REGULAR) != 0)
        {
            // resize image
            resizeImage(UnitValue(dup.width/2, "px"), resizeMethod, scaleStyles);
            //dup.resizeImage(dup.width/2, dup.height/2, dup.resolution, resizeMethod);
            
            // If chosen values are cocos2 and saveForIPad, need to add iPad.
            suffix = "";
            if (exportDialog.suffixPanel.saveForIPad.value == true) {
                suffix = "~ipad";
                if (exportDialog.suffixPanel.cocos2d.value == true) {
                    suffix = "-ipad";
                }
            }
            // export regular image
            saveForWebPNG(dup, folder.fullName, normalisedName + suffix);
        }
        
        dup.close(SaveOptions.DONOTSAVECHANGES);

        app.preferences.rulerUnits=originalRulerUnits;
        app.preferences.typeUnits=originalTypeUnits;
    }
}


function okClickedHandler()
{
    var resizeMethod = resizeMethodLookup[exportDialog.methodOptions.selection.text];
    var scaleStyles = exportDialog.scaleStylesCheckBox.value;
    var resizeOption;
    var baseName = exportDialog.namePanel.nameBox.text;
   
    if(exportDialog.sizesPanel.retina.value == true)
        resizeOption = ResizeOptions.RETINA;
    else if(exportDialog.sizesPanel.regular.value == true)
        resizeOption = ResizeOptions.REGULAR;
    else if(exportDialog.sizesPanel.both.value == true)
        resizeOption = (ResizeOptions.REGULAR | ResizeOptions.RETINA);
    
    exportImages(baseName, resizeOption, resizeMethod, scaleStyles);
}

exportDialog = new Window('dialog', 'Export Selected Layer for iOS'); 
exportDialog.alignChildren = 'left';

exportDialog.namePanel = exportDialog.add('panel', undefined, 'Base name');
exportDialog.namePanel.alignChildren = 'left';

var doc = app.activeDocument;
var defaultName = doc.activeLayer.name;

exportDialog.namePanel.nameBox = exportDialog.namePanel.add('edittext', undefined, 'Name');
exportDialog.namePanel.nameBox.preferredSize = [140,20];
exportDialog.namePanel.nameBox.text = defaultName;

exportDialog.sizesPanel = exportDialog.add('panel', undefined, 'Export Sizes');
exportDialog.sizesPanel.alignChildren = 'left';

exportDialog.sizesPanel.both = exportDialog.sizesPanel.add('radiobutton', undefined, 'Regular + Retina');
exportDialog.sizesPanel.regular = exportDialog.sizesPanel.add('radiobutton', undefined, 'Regular Only');
exportDialog.sizesPanel.retina = exportDialog.sizesPanel.add('radiobutton', undefined, 'Retina Only'); 
exportDialog.sizesPanel.both.value = true;

exportDialog.suffixPanel = exportDialog.add('panel', undefined, 'Suffix');
exportDialog.suffixPanel.alignChildren = 'left';

exportDialog.suffixPanel.standard = exportDialog.suffixPanel.add('radiobutton', undefined, 'Standard suffix convention');
exportDialog.suffixPanel.cocos2d = exportDialog.suffixPanel.add('radiobutton', undefined, 'cocos2d suffix convention');
exportDialog.suffixPanel.other = exportDialog.suffixPanel.add('radiobutton', undefined, 'Other'); 
exportDialog.suffixPanel.suffixBox = exportDialog.suffixPanel.add('edittext', undefined, 'Suffix');
exportDialog.suffixPanel.suffixBox.preferredSize = [140,20];
exportDialog.suffixPanel.suffixBox.text = "@2x";
exportDialog.suffixPanel.saveForIPad = exportDialog.suffixPanel.add('checkbox', undefined, 'Save for iPad');

exportDialog.methodOptions = exportDialog.add('dropdownlist', undefined, [ResizeMethod.NEARESTNEIGHBOUR.name, ResizeMethod.BILINEAR.name, ResizeMethod.BICUBIC.name, ResizeMethod.BICUBICSMOOTHER.name, ResizeMethod.BICUBICSHARPER.name]);
exportDialog.methodOptions.children[1].selected = true;
exportDialog.scaleStylesCheckBox = exportDialog.add('checkbox', undefined, 'Scale Styles');
exportDialog.scaleStylesCheckBox.value = true;

exportDialog.buttonGroup = exportDialog.add('group');
exportDialog.buttonGroup.cancelButton = exportDialog.buttonGroup.add('button', undefined, 'Cancel');
exportDialog.buttonGroup.okButton = exportDialog.buttonGroup.add('button', undefined, 'OK');
exportDialog.buttonGroup.okButton.addEventListener('click', okClickedHandler);
exportDialog.show();
