/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */
/* ========================================================================================================
 * cg_settings.js - Module for display the Classic Gnome xlet settings -
 * ========================================================================================================
 */
//imageNew = new Gtk.Image ({ icon_name: 'go-previous-symbolic', icon_size: Gtk.IconSize.BUTTON });
//new_from_icon_name
//this.xlet_dir = "/usr/share/cinnamon/%ss/%s".format(this.type, this.uuid);
//        if (!Gio.file_new_for_path(this.xlet_dir).query_exists(null)
//const home = GLib.get_home_dir();
//GLib.build_filenamev([])
//GLib.build_filenamev([home, ".local", "share", "locale"])
//Gtk.ButtonBox.new(Gtk.Orient
//Gtk.Label({ label: _(""), use_markup: true, xalign: 0, margin_top: 5, margin_bottom: 5});
//Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });

const Lang = imports.lang;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

const XletSettings = cimports.settings.xletSettings;

const Module = new GObject.Class({
    Name: 'Module.Settings',
    GTypeName: 'ModuleSettings',

    _init: function() {
         this.loaded = false;
    },

    can_load_with_arguments: function(argv) {
        return ((argv.length > 2) && (argv[0] == "settings") &&
                (["applet", "desklet", "extension"].indexOf(argv[1]) != -1));
    },

    get_side_page: function(argv, window) {
        if(!this.sidePage)
            this.sidePage = new XletSettings.XLetSidePage(argv, window, this);
        return this.sidePage;
    },

    on_module_selected: function() {
        if (this.sidePage && !this.loaded) {
            global.log("Loading Settings module");
            this.sidePage.load();
            this.loaded = true;
        }
    },
});
