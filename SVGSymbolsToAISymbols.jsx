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
*
*/

/**********************************************************

SVGToAISymbols.jsx

DESCRIPTION

Open all SVG symbol ready files specified in the user selected folder and save them as AI symbol palettes

A compatible SVG file must include SVG symbols with an id attribute, like:
<symbol id='Name_of_Symbol' ..... >

The ID will be used for the name of the symbol once converted to an Illustrator symbol palette.

With an appopriate server-side script, online SVG image libraries can be converted into separate
SVG files with multiple images (symbols) per file. Each file will be converted into a symbol palette
containing each of the included symbols.

**********************************************************/

// Main Code [Execution of script begins here]

try
{
	// Get the folder to read files from
	var inputFolderPath = null;
    var totalFilesConverted = 0;
	inputFolderPath = Folder.selectDialog( 'Select SVG Files Location.', '~' );

    if (inputFolderPath != null) {
        // Parse the folder name to get Folder Name Prefix
        var inputFolderStr = inputFolderPath.fullName;
        //var selectedFolderName = inputFolderPath.displayName;
        var selectedFolderName = inputFolderPath.name;
        while (selectedFolderName.indexOf ("%20") > 0)
        {
            selectedFolderName = selectedFolderName.replace ("%20", " ")
         }
        var inputFolderArray = inputFolderStr.split (selectedFolderName);
        var inputFolderPrefix = inputFolderArray[0];

        // Get the folder to save the files into
        var destFolder = null;
        destFolder = Folder.selectDialog( 'Select Output AI Location.', '~' );

        if (destFolder != null) {
            app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

            // Set SVG options
            //var SVGOptions = app.preferences.SVGFileOptions;
            //SVGOptions.convertTextToOutlines = false;
            //SVGOptions.importSinglePage = false;

            // Recursively read all SVG files and convert to AI
            ConvertSVGToAI(inputFolderPath);
        }
    }
        alert( totalFilesConverted + ' SVG files were converted to AI' );
}
catch (err)
{
   rs = ("ERROR: " + (err.number & 0xFFFF) + ", " + err.description);
   alert(rs);
}


/**  Function to recursively read all SVG files from the input folder and save them as AI file in the destination folder
	@param inputFolderPath the input folder path from where SVG files would be read
*/
function ConvertSVGToAI(inputFolderPath)
{

	var testFiles = new Array();
	var index = 0;

	// Create output folder path to be created
	pathToAppend = inputFolderPath.fullName.split(inputFolderPrefix);
	var saveFolder = destFolder + "/" + pathToAppend[1];

	// Create folder

	fldr = new Folder(saveFolder);
	fldr.create();

    if (!(fldr.exists))
    {
        throw new Error('Access is denied');
    }

	// Get list of files/folders in the current working folder
	testFiles = inputFolderPath.getFiles("*.*");

	for (index = 0; index < testFiles.length;index++)
	{
        // Check if current item is file or folder
        if (testFiles[index] instanceof Folder)
        {
            ConvertSVGToAI(testFiles[index]);
        }
        else
        {
            // Selected Item is a file
            fileName = testFiles[index].displayName;

            var fileExtensionArray = fileName.split(".", 2);
            var fileExtension = fileExtensionArray[1].toUpperCase();

            // Check is file is a SVG file
            if (fileExtension == "SVG" )
            {
                // Open SVG file
                var docRef =app.open(testFiles[index]);
                obj_doc=app.activeDocument;

				// Delete all paths
				app.activeDocument.symbolItems.removeAll();


                // Create output file path
                var filePreName = testFiles[index].displayName.split(".",1);
                sDocumentPath = saveFolder +"/"+ filePreName + ".ai" ;

                // Save file as AI
                SaveAsAI(sDocumentPath);

                // Increment counter of total number of files converted
                totalFilesConverted = totalFilesConverted + 1;

                // Close the document
                app.activeDocument.close( SaveOptions.DONOTSAVECHANGES );
            }
        }
    }
}

/** Save the current opened document as AI file
	@param sDocumentPath the name of output path where file needs to be saved
*/
function SaveAsAI(sDocumentPath)
{
    theFile = new File(sDocumentPath);

    // Create AI Save options
    var aiOptions  = new IllustratorSaveOptions();

    // For any changes to Save options please refer to IllustratorSaveOptions in the JavaScript Reference for available options

	// For example, to save file as AI CS5 file use
	// aiOptions.compatibility = Compatibility.ILLUSTRATOR15; //needs to be at minimum 12 (CS2) to support longer symbol names

    aiOptions.compatibility = Compatibility.ILLUSTRATOR12;
    aiOptions.compressed = true;
    aiOptions.embedICCProfile = false;
    aiOptions.embedLinkedFiles = false;
    aiOptions.flattenOutput = OutputFlattening.PRESERVEAPPEARANCE;
    aiOptions.fontSubsetThreshold = 100;
    aiOptions.pdfCompatible = true;

    obj_doc=app.activeDocument;
    var artboardLength = obj_doc.artboards.length;

    // Uncomment the code below if you want to save each Artboard to seperate file
  /*  if (artboardLength > 1)
    {
        aiOptions.saveMultipleArtboards = true;
        aiOptions.artboardRange = "";
    }
    */
    // Save as AI file
    obj_doc.saveAs (theFile, aiOptions);
}


