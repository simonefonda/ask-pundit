YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "pundit.authenticatedRequester",
        "pundit.baseComponent"
    ],
    "modules": [
        "pundit"
    ],
    "allModules": [
        {
            "displayName": "pundit",
            "name": "pundit",
            "description": "Provides common facilities used by other pundit\ncomponents, such as callback creation, initialization, logging, etc.\n\nEvery component extending this class will be able to use these methods,\nand the options passed to the constructor.\n\nIf the component has an .opts field, it will be used as defaults for the\ncomponent, overwritable when calling new"
        }
    ]
} };
});