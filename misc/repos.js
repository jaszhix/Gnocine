// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const DEFAULT_REPOSITORIES = {
    "default": {
        server_url: "http://cinnamon-spices.linuxmint.com/",
        collections: {
            applet: {
                index: "json/applets.json",
                assets: "",
                packages: "",
            },
             desklet: {
                index: "json/desklets.json",
                assets: "",
                packages: "",
            },
            extension: {
                index: "json/extensions.json",
                assets: "",
                packages: "",
            },
            theme: {
                index: "json/themes.json",
                assets: "uploads/themes/thumbs/",
                packages: "",
            },
        },
    },
}
