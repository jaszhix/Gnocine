// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
// Load shell theme from ~/.themes/name/gnome-shell

const Lang = imports.lang;
const Signals = imports.signals;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Main = cimports.ui.main;

const SETTINGS_SCHEMA = 'org.cinnamon.theme';
const SETTINGS_KEY = 'name';

function ThemeManager() {
    this._init();
}

ThemeManager.prototype = {
    _init: function() {
    try {
        this._settings = new Gio.Settings({ schema_id: SETTINGS_SCHEMA });
        this._changedId = this._settings.connect('changed::'+SETTINGS_KEY, Lang.bind(this, this._changeTheme));
        this._changeTheme();
    } catch(e) {
        Main.notify("eeee " + e);
    }
    },

    _getCurrentFile: function() {
        let path = null;
        try {
            let stack = (new Error()).stack;

            // Assuming we're importing this directly from an extension (and we shouldn't
            // ever not be), its UUID should be directly in the path here.
            let stackLine = stack.split('\n')[1];
            if (!stackLine)
                throw new Error('Could not find current file');

            // The stack line is like:
            //   init([object Object])@/home/user/data/gnome-shell/extensions/u@u.id/prefs.js:8
            //
            // In the case that we're importing from
            // module scope, the first field is blank:
            //   @/home/user/data/gnome-shell/extensions/u@u.id/prefs.js:8
            let match = new RegExp('@(.+):\\d+').exec(stackLine);
            if (!match)
                throw new Error('Could not find current file');
            path = match[1];
        } catch(e) {
            global.logError("Unlocalizad default theme");
            return null;
        }
        return Gio.File.new_for_path(path);
    },
    
    _findTheme: function(themeName) {
        let themeDirectory = null;

        let file = this._getCurrentFile();
        if(file) {
            let path = GLib.build_filenamev([file.get_parent().get_parent().get_path(), 'themes', themeName]);
            file = Gio.file_new_for_path(GLib.build_filenamev([path, 'cinnamon.css']));
            if (file.query_exists(null))
                themeDirectory = path;
        }
        if(!themeDirectory) {
            let path = GLib.build_filenamev([GLib.get_home_dir(), '.themes', themeName, 'cinnamon']);
            let file = Gio.file_new_for_path(GLib.build_filenamev([path, 'cinnamon.css']));
            if (file.query_exists(null))
                themeDirectory = path;
            else {
                let sysdirs = GLib.get_system_data_dirs();
                for (let i = 0; i < sysdirs.length; i++) {
                    path = GLib.build_filenamev([sysdirs[i], 'themes', themeName, 'cinnamon']);
                    let file = Gio.file_new_for_path(GLib.build_filenamev([path, 'cinnamon.css']));
                    if (file.query_exists(null)) {
                        themeDirectory = path;
                        break;
                    }
               }
            }
        }
        return themeDirectory;
    },

    _changeTheme: function() {
        let iconTheme = Gtk.IconTheme.get_default();
        if (this.themeDirectory) {
            let searchPath = iconTheme.get_search_path();
            for (let i = 0; i < searchPath.length; i++) {
                if (searchPath[i] == this.themeDirectory) {
                    searchPath.splice(i,1);
                    iconTheme.set_search_path(searchPath);
                    break;
                }
            }
        }
        let _stylesheet = null;
        let _themeName = this._settings.get_string(SETTINGS_KEY);        
        if (_themeName) {
            this.themeDirectory = this._findTheme(_themeName);
            if (this.themeDirectory) _stylesheet = GLib.build_filenamev([this.themeDirectory, 'cinnamon.css']);
        }

        if (_stylesheet)
            global.log('loading user theme: ' + _stylesheet);
        else
            global.log('loading default theme');
        Main.setThemeStylesheet(_stylesheet);
        Main.loadTheme();
        if (this.themeDirectory) {
            iconTheme.append_search_path(this.themeDirectory);
            global.log('added icon directory: ' + this.themeDirectory);
        }
        this.emit('theme-set');
    }
};
Signals.addSignalMethods(ThemeManager.prototype);

