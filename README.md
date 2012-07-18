photoshop-jsx-export-ios
========================
Daniel Wood's (runloop.com) Photoshop JSX Script to export for iOS Retina display

* Author: Daniel Wood (runloop.com)
* Twitter: @loadedwino

This script is intended to be used on a photoshop document containing retina artwork for iOS. It will resize, trim and save the selected layer or group, into a directory you select using the layer name (normalised) as the default file name. There are a  couple of resizing options you can select such as the resizing method and whether to scale styles or not. It does not alter your original document in anyway.

## Running the script

In Photoshop, access *File > Scripts > Browse* and browse to the location of the **"Export for iOS.jsx"** file.


## Installing the script

To install, simply copy the "Export for iOS.jsx" file to your Photoshop script directory. 

* On Mac OSX: **/Applications/Adobe Photoshop CSXXX/Presets/Scripts**.
* On Windows: **C:\Program Files\Adobe\Photoshop CS3\Preset\Scripts**

You must restart Photoshop for the script to be available in the application.

Now you can launch the script by accessing *File > Scripts > Export for iOS*

## Creating a script action button

You can create a script action button for this script by first installing the script. 

* Open the actions pane: *Window > Actions*
* Create a new set , name it "iOS"
* Create a new action: name: "Export", set: "iOS", Function key: "None"
* Now launch the script *File > Scripts > Export for iOS*
* In your action pane stop recording and switch to button mode!

