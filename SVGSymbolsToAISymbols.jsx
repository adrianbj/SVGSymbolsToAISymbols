/**********************************************************

ADOBE SYSTEMS INCORPORATED
Copyright 2005-2008 Adobe Systems Incorporated
All Rights Reserved

NOTICE:  Adobe permits you to use, modify, and
distribute this file in accordance with the terms
of the Adobe license agreement accompanying it.
If you have received this file from a source
other than Adobe, then your use, modification,
or distribution of it requires the prior
written permission of Adobe.

*********************************************************/

/**
*
* Created by Adrian Jones from the FreehandToAI.jsx script by Adobe
* Updated for modern Illustrator versions
*
*/

/**********************************************************

SVGToAISymbols.jsx

DESCRIPTION

Open all SVG symbol ready files specified in the user selected folder and save them as AI symbol palettes

A compatible SVG file must include SVG symbols with an id attribute, like:
<symbol id='Name_of_Symbol' ..... >

The ID will be used for the name of the symbol once converted to an Illustrator symbol palette.

With an appropriate server-side script, online SVG image libraries can be converted into separate
SVG files with multiple images (symbols) per file. Each file will be converted into a symbol palette
containing each of the included symbols.

**********************************************************/

// Global variables
var inputFolderPrefix = "";
var destFolder = null;
var totalFilesConverted = 0;
var rootInputFolder = null;

// Main Code [Execution of script begins here]

try
{
    // Get the folder to read files from
    var inputFolderPath = Folder.selectDialog('Select SVG Files Location.', '~');

    if (inputFolderPath != null) {
        rootInputFolder = inputFolderPath;
        // Parse the folder name to get Folder Name Prefix
        var inputFolderStr = inputFolderPath.fullName;
        var selectedFolderName = inputFolderPath.name;

        // Decode URL encoding
        if (selectedFolderName) {
            selectedFolderName = decodeURI(selectedFolderName);
        }

        if (inputFolderStr && selectedFolderName) {
            var inputFolderArray = inputFolderStr.split(selectedFolderName);
            inputFolderPrefix = inputFolderArray[0];
        }

        // Get the folder to save the files into
        destFolder = Folder.selectDialog('Select Output AI Location.', '~');

        if (destFolder != null) {
            app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

            // Recursively read all SVG files and convert to AI
            ConvertSVGToAI(inputFolderPath);

            app.userInteractionLevel = UserInteractionLevel.DISPLAYALERTS;
            alert(totalFilesConverted + ' SVG files were converted to AI');
        }
    }
}
catch (err)
{
    app.userInteractionLevel = UserInteractionLevel.DISPLAYALERTS;
    var errMsg = "ERROR: " + err.number;
    if (err.description) {
        errMsg += ", " + err.description;
    }
    if (err.line) {
        errMsg += "\nLine: " + err.line;
    }
    alert(errMsg);
}


/**  Function to recursively read all SVG files from the input folder and save them as AI file in the destination folder
    @param inputFolderPath the input folder path from where SVG files would be read
*/
function ConvertSVGToAI(inputFolderPath)
{
    if (!inputFolderPath || !inputFolderPath.exists) {
        return;
    }

    var testFiles = [];
    var index = 0;

    // Create output folder path to be created
    var saveFolder = destFolder.fullName;

    if (rootInputFolder && inputFolderPath.fullName !== rootInputFolder.fullName) {
        var relativePath =
            inputFolderPath.fullName.substring(rootInputFolder.fullName.length);

        // Remove leading slash if present
        if (relativePath.charAt(0) === "/" || relativePath.charAt(0) === "\\") {
            relativePath = relativePath.substring(1);
        }

        if (relativePath.length > 0) {
            saveFolder = destFolder.fullName + "/" + relativePath;
        }
    }

    // Create folder
    var fldr = new Folder(saveFolder);
    if (!fldr.exists) {
        fldr.create();
    }

    if (!fldr.exists) {
        throw new Error('Access is denied - could not create folder: ' + saveFolder);
    }

    // Get list of files/folders in the current working folder
    testFiles = inputFolderPath.getFiles();

    if (!testFiles) {
        return;
    }

    for (index = 0; index < testFiles.length; index++)
    {
        if (!testFiles[index]) continue;

        // Check if current item is file or folder
        if (testFiles[index] instanceof Folder)
        {
            ConvertSVGToAI(testFiles[index]);
        }
        else
        {
            // Selected Item is a file
            var fileName = testFiles[index].name;

            if (!fileName) continue;

            // Check if file has an extension
            var lastDotIndex = fileName.lastIndexOf(".");
            if (lastDotIndex === -1) continue;

            var fileExtension = fileName.substring(lastDotIndex + 1).toUpperCase();

            // Check if file is a SVG file
            if (fileExtension === "SVG")
            {
                try {
                    // Open SVG file
                    var docRef = app.open(testFiles[index]);

                    if (!docRef) {
                        continue;
                    }

                    var obj_doc = app.activeDocument;

                    // Delete all symbol instances (not the symbols themselves)
                    if (obj_doc.symbolItems && obj_doc.symbolItems.length > 0) {
                        obj_doc.symbolItems.removeAll();
                    }

                    // Create output file path
                    var filePreName = fileName.substring(0, lastDotIndex);
                    var sDocumentPath = saveFolder + "/" + filePreName + ".ai";

                    // Save file as AI
                    SaveAsAI(sDocumentPath);

                    // Increment counter of total number of files converted
                    totalFilesConverted = totalFilesConverted + 1;

                    // Close the document
                    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
                }
                catch (fileErr) {
                    var fileErrMsg = "Error processing file: " + fileName;
                    if (fileErr.description) {
                        fileErrMsg += "\n" + fileErr.description;
                    }
                    alert(fileErrMsg);

                    // Try to close any open document
                    try {
                        if (app.documents.length > 0) {
                            app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
                        }
                    } catch (e) {
                        // Ignore close errors
                    }
                }
            }
        }
    }
}

/** Save the current opened document as AI file
    @param sDocumentPath the name of output path where file needs to be saved
*/
function SaveAsAI(sDocumentPath)
{
    if (!sDocumentPath) {
        throw new Error("No document path provided");
    }

    var theFile = new File(sDocumentPath);

    // Create AI Save options
    var aiOptions = new IllustratorSaveOptions();

    // v15 is CC5 (2010)
    aiOptions.compatibility = Compatibility.ILLUSTRATOR15;
    aiOptions.compressed = true;
    aiOptions.embedICCProfile = false;
    aiOptions.embedLinkedFiles = false;
    aiOptions.flattenOutput = OutputFlattening.PRESERVEAPPEARANCE;
    aiOptions.fontSubsetThreshold = 100;
    aiOptions.pdfCompatible = true;

    var obj_doc = app.activeDocument;

    if (!obj_doc) {
        throw new Error("No active document");
    }

    var artboardLength = obj_doc.artboards.length;

    // Uncomment the code below if you want to save each Artboard to separate file
    /*
    if (artboardLength > 1)
    {
        aiOptions.saveMultipleArtboards = true;
        aiOptions.artboardRange = "";
    }
    */

    // Save as AI file
    obj_doc.saveAs(theFile, aiOptions);
}
