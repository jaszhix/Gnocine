#!/usr/bin/cjs

imports.gi.versions.Gio = '2.0';

const Mainloop = imports.mainloop;
const Format = imports.format;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Gettext = imports.gettext;

function getCurrentFile() {
    let path = null;
    try {
        let stack = (new Error()).stack;
        let stackLine = stack.split('\n')[1];
        if (!stackLine)
            throw new Error('Could not find current file');
        let match = new RegExp('@(.+):\\d+').exec(stackLine);
        if (!match)
            throw new Error('Could not find current file');
        path = match[1];
    } catch(e) {
        global.logError("Unlocalizad reqiered librarys");
        return null;
    }
    return Gio.File.new_for_path(path);
}

function initEnvironment() {
    // Monkey-patch in a "global" object that fakes some Shell utilities
    // that ExtensionUtils depends on.
    let rootFile = getCurrentFile().get_parent().get_parent();
    imports.searchPath.unshift(rootFile.get_path());
    window.cimports = imports;

    window.global = {
        log: function() {
            print([].join.call(arguments, ', '));
        },

        logError: function(s) {
            log('ERROR: ' + s);
        },
        cinnamon_settings: new Gio.Settings({ schema_id: "org.cinnamon" }),

        rootdatadir: rootFile.get_path(),
        domain: rootFile.get_basename(),
        userclassicdatadir: GLib.build_filenamev([GLib.get_user_data_dir(), imports.misc.config.USER_INSTALL_FOLDER]),

    };
    Gettext.bindtextdomain(
         global.domain,
         GLib.build_filenamev([GLib.get_home_dir(), ".local", "share", "locale"])
    );

    window.cimports = imports;
    window._ = Gettext.gettext;
    window.C_ = Gettext.pgettext;
    window.ngettext = Gettext.ngettext;

    String.prototype.format = Format.format;
}

initEnvironment();

function Application() {
    this._init.apply(this, arguments);
}

Application.prototype = {
    _init: function(arg) {
        this._arg = arg;
        this._credentials = new Gio.Credentials();
    },

    getArguments: function() {
        return ["-i", "-u"];
    },

    executeOption: function() {
        if(this._arg[0] == "-i") {
            return this.install();
        } else if(this._arg[0] == "-u") {
            return this.uninstall();
        }
        return false;
    },

    haveValidArguments: function() {
        return ((this._arg.length == 2) && (this.getArguments().indexOf(this._arg[0]) != -1));
    },

    printHelp: function() {
        global.log("\n" + _("Gnocine Schema Installer Usage"));
        global.log("    " + _("Install schemas") + ": schemaInstaller.js -i \"path1,path2,...,pathn\"");
        global.log("     " + _("Remove schemas") + ": schemaInstaller.js -u \"path1,path2,...,pathn\"\n");
    },

    isRuningAsRoot: function() {
        return (this._credentials.get_unix_user() == 0);
    },

    recursivelyCopyDir: function(dirname, dest) {
        //shutil.copytree(dirname, dest);
    },

    install: function() {
        try {
            if(!this.isRuningAsRoot()) {
                return this._runAsRoot();
            } else {
                let files = this._arg[1].substring(1, this._arg[1].length -1).split(",")
                for (let pos in files) {
                    file_from = Gio.file_new_for_path(files[pos]);
                    file_to = Gio.file_new_for_path("/usr/share/glib-2.0/schemas/").get_child(file_from.get_basename())
                    if (file_to.query_exists(null)) {
                        file_to['delete'](null);
                        file_from.copy(file_to, 0, null, function(){});
                        this._systemCall("glib-compile-schemas /usr/share/glib-2.0/schemas/");
                    }
                }
                return true;
            }
        } catch(e) {
            global.logError(e);
        }
        return false;
    },

    uninstall: function() {
        try {
            if(!this.isRuningAsRoot()) {
                return this._runAsRoot();
            } else {
                let files = this._arg[1].substring(1, this._arg[1].length -1).split(",")
                for (let pos in files) {
                    file_from = Gio.file_new_for_path(files[pos]);
                    file_to = Gio.file_new_for_path("/usr/share/glib-2.0/schemas/").child(file_from.get_basename())
                    if (file_to.query_exists()) {
                        file_to['delete'](null);
                    }
                }
                this._systemCall("glib-compile-schemas /usr/share/glib-2.0/schemas/");
                return true;
            }
        } catch(e) {
            global.logError(e);
        }
        return false;
    },

    _runAsRoot: function() {
        if(!this.isRuningAsRoot()) {
            try {
                let file = getCurrentFile();
                let prgPath = file.get_path();
                let command = null;
                let resultPath = GLib.find_program_in_path("gksudo");
                if(resultPath) {
                    let message = _("Please enter your password to install the required settings schema for %s").format("xlet");
                    command = "'" + resultPath + "' \"sh -c '" + prgPath + " " + this._arg + "'\" -m '" + message + "'";
                } else {
                    resultPath = GLib.find_program_in_path("pkexec");
                    if(resultPath) {
                        command = "'" + resultPath + "' '" + prgPath + "' " + this._arg;
                    }
                }
                if(command) {
                    let sucess = this._spawn_sync(command, null);
                    if(!sucess)
                        throw new Error(_("Could not acquire root privileges"));
                    return true;
                }
            } catch(e) {
                global.logError(e);
            }
        }
        return false;
    },

    _getCurrentFile: function () {
        let stack = (new Error()).stack;
        let stackLine = stack.split('\n')[1];
        if (!stackLine)
            throw new Error(_("Could not find current file"));

        let match = new RegExp('@(.+):\\d+').exec(stackLine);
        if (!match)
            throw new Error(_("Could not find current file"));

        let path = match[1];
        let file = Gio.File.new_for_path(path);
        return file;
    },

    _systemCall: function(cmd) {
        try {
            let [success, argv] = GLib.shell_parse_argv(cmd);
            if(success) {
                GLib.spawn_async(null, argv, null,
                                 GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.STDOUT_TO_DEV_NULL  | GLib.SpawnFlags.STDERR_TO_DEV_NULL,
                                 null, null);
            }
        } catch (e) {
            global.logError(e);
        }
    },

    _spawn_sync: function(cmd, callBack) {
        try {
            let [ok, standard_output, standard_error, exit_status] =
                GLib.spawn_command_line_sync(cmd, null, null, null, callBack);
            return ok && (exit_status == 0);
        } catch (e) {
            throw e;
        }
        return false;
    },
};

let myapp = new Application(ARGV);
if (myapp.haveValidArguments()) {
    let result = myapp.executeOption();
    print("" + result);
} else {
    myapp.printHelp();
}
