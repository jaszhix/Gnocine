/* ========================================================================================================
 * cg_applets.js - Module for display the Gnocine xlet applets -
 * ========================================================================================================
 */

const Lang = imports.lang;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const _ = Gettext.gettext;

const ExtensionCore = cimports.settings.extensionCore;

const Module = new GObject.Class({
    Name: 'Module.Applet',
    GTypeName: 'ModuleApplet',
    //name = "applets",
    //comment = _("Manage Cinnamon applets"),
    //category = "prefs",

    _init: function() {
        this.name = "applets";
        this.comment = _("Manage Cinnamon applets");
        this.category = "prefs";
    },

    can_load_with_arguments: function(args) {
        return ((args.length > 1) && (args[0] == "applets"));
    },

    get_side_page: function(args, window) {
        if(!this.sidePage) {
            let keywords = [_("xlet"), _("applet"), _("extension"), _("settings"), _("configuration")];
            this.sidePage = new AppletsViewSidePage(_("Applets"), "cs-applets", keywords, null, "applet", args, window, this);
        }
        return this.sidePage;
    },

    on_module_selected: function() {
        if(this.sidePage) {
            if (!this.sidePage.isLoaded) {
                global.log("Loading Applets module");
                this.sidePage.load();
            }
            this.sidePage.build();
        }
    },
});

const AppletsViewSidePage = new GObject.Class({
    Name: 'AppletsViewSidePage',
    GTypeName: 'AppletsViewSidePage',
    Extends: ExtensionCore.ExtensionSidePage,

    _init: function(name, icon, keywords, content_box, collection_type, argv, window, module) {
        this.RemoveString = _("You can remove specific instances in panel edit mode via the context menu.");
        this.parent(name, icon, keywords, content_box, collection_type, argv, window, module);
    },

    toSettingString: function(self, uuid, instanceId) {
        panelno = "panel1";
        if (module._arguments.length > 2) {
            if ((module._arguments[0] == "applets") && (module._arguments[2].substring(0, 5) == "panel"))
                panelno = module._arguments[2];
        }
        return "%s:right:0:%s:%d".format(panelno, uuid, instanceId);
    },

    fromSettingString: function(string) {
        let [panel, side, position, uuid, instanceId] = string.split(":");
        return uuid;
    },

    getAdditionalPage: function() {
        return null;
    },
});
