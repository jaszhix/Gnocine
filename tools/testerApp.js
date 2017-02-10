#!/usr/bin/env gjs
//#!/usr/bin/gjs
/* ========================================================================================================
 * testerApp.js - A Gio.Application to test the ui.downloadManager class for Gnocine -
 * ========================================================================================================
 *
 * Usage: Execute the file: testerApp.js
 */

const Lang = imports.lang;
const Signals = imports.signals;
const Mainloop = imports.mainloop;
const Notify = imports.gi.Notify;
const GLib = imports.gi.GLib;
const Format = imports.format;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
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
    };
    Gettext.bindtextdomain(
         global.domain,
         GLib.build_filenamev([GLib.get_home_dir(), ".local", "share", "locale"])
    );

    window._ = Gettext.gettext;
    window.C_ = Gettext.pgettext;
    window.ngettext = Gettext.ngettext;

    Notify.init ("org.classic.gnome.settings.daemon");
    String.prototype.format = Format.format;
}

initEnvironment();

const DownloadManager = cimports.ui.downloadManager;

function recursivelyDeleteDir(dir) {
    let children = dir.enumerate_children('standard::name,standard::type',
                                          Gio.FileQueryInfoFlags.NONE, null);
    let info, child;
    while ((info = children.next_file(null)) != null) {
        let type = info.get_file_type();
        let child = dir.get_child(info.get_name());
        if (type == Gio.FileType.REGULAR)
            child['delete'](null);
        else if (type == Gio.FileType.DIRECTORY)
            recursivelyDeleteDir(child);
    }
    dir['delete'](null);
}

const DownloaderSpices = new GObject.Class({
    Name: 'Gnocine.DownloaderSpices',
    GTypeName: 'GnocineDownloaderSpices',
    Extends: DownloadManager.DownloaderManager,

    _init: function(serverURL, collectionType) {
        this.parent(10); //Just 10 simultaneuslly downloads.
        this.serverURL = serverURL;
        this.collectionType = collectionType;
        this._loadCache();
    },

    getIndexURL: function() {
        return this.serverURL + "/json/%ss.json".format(this.collectionType);
    },

    getAssetsURL: function(uuid) {
        if (collectionType != "theme")
            return this.serverURL + this.indexCache[uuid]['icon'];
        return "%s/uploads/themes/thumbs/%s".format(this.serverURL, this.indexCache[uuid]['icon_filename']);
    },

    getInstallFolder: function() {
        let installFolder = null;
        if (['applet','desklet','extension'].indexOf(this.collectionType) != -1) {
            installFolder = GLib.build_filenamev([
                GLib.get_home_dir(), ".local", "share", "gnocine", this.collectionType + "s"
            ]);
        } else if (this.collectionType == 'theme') {
            installFolder = GLib.build_filenamev([GLib.get_home_dir(), ".themes"]);
        }
        return installFolder;
    },

    getConfigFolder: function () {
        let config = Gio.file_new_for_path(GLib.build_filenamev([
            GLib.get_home_dir(), ".gnocine", "config"
        ]));
        return config;
    },

    getCacheFolder: function () {
        let cacheFolder = Gio.file_new_for_path(GLib.build_filenamev([
            GLib.get_home_dir(), ".gnocine", "xlet.cache", this.collectionType
        ]));
        return cacheFolder;
    },

    _downloadIndexFile: function() {
        this.clearAll();
        let indexURL = this.getIndexURL();
        let cacheFolder = this.getCacheFolder();
        if (cacheFolder.query_exists(null))
            recursivelyDeleteDir(cacheFolder);
        this.addJob(new DownloadManager.DownloadJob(indexURL, GLib.build_filenamev([cacheFolder.get_path(), "index.json"])));
        this.startDownloads();
    },

    _downloadAssetsFiles: function() {
        this.clearAll();
        let cacheFolder = this.getCacheFolder();
        for (uuid in uuids) {
            let indexURL = this.getAssetsURL();
            this.addJob(new DownloadManager.DownloadJob(indexURL, GLib.build_filenamev([cacheFolder.get_path(), "index.json"])));
            this.startDownloads();
        }
    },

    refresh_cache: function() {
        this._downloadIndexFile();
        this._loadCache();
        // global.log("Loaded index, now we know about %d spices.".format(this.index_cache.length));

        if (load_assets) {
            if (!this.themes)
                download_url = URL_SPICES_HOME + this.index_cache[uuid]['icon'];
            else
                download_url = "%s/uploads/themes/thumbs/%s".format(URL_SPICES_HOME, this.index_cache[uuid]['icon_filename']);
        }
    },

    _loadCache: function() {
        let cacheFolder = this.getCacheFolder();
        let jsonFile = cacheFolder.get_child("index.json");
        try {
            let [ok, json_data] = GLib.file_get_contents(jsonFile.get_path());
            this.indexCache = JSON.parse(json_data);
        } catch(e) {
            try {
                jsonFile['delete'](null);
            } catch(e) {}
            this.errorMessage(_("Something went wrong with the spices download.  Please try refreshing the list again."), e.message);
        }
    },

    loadAssets: function() {
        let needsRefresh = 0;
        this.usedThumbs = [];

        let uuids = this.indexCache.keys();
        let iconBasename, iconFile, iconPath;
        for (uuid in uuids) {
            if (!this.themes) {
                iconBasename = Gio.file_new_for_path(this.indexCache[uuid]['icon']).get_basename();
                iconFile = this.cacheFolder.get_child(iconBasename);
                this.usedThumbs.push(iconBasename);
            } else {
                iconBasename = this.sanitizeThumb(
                    Gio.file_new_for_path(this.indexCache[uuid]['screenshot']).get_basename()
                );
                iconFile = this.cacheFolder.get_child(iconBasename);
                this.usedThumbs.push(iconBasename);
            }
            this.indexCache[uuid]['icon_filename'] = iconBasename;
            this.indexCache[uuid]['icon_path'] = iconFile.get_path();

            if ((iconFile.query_file_type(Gio.FileQueryInfoFlags.NONE, null) == Gio.FileType.REGULAR) ||
                this.isBadImage(iconFile.get_path())) {
                needsRefresh += 1;
            }
        }
        this.downloadTotalFiles = needsRefresh;
        this.downloadCurrentFile = 0;

        let needToDownload = false;
        for (uuid in uuids) {
            if (this.abortDownload > ABORT_NONE)
                return;
            iconFile = Gio.file_new_for_path(this.indexCache[uuid]['icon_path']);
            if ((iconFile.query_file_type(Gio.FileQueryInfoFlags.NONE, null) == Gio.FileType.REGULAR) ||
                this.isBadImage(iconFile.get_path())) {
                needToDownload = true;
                //this.progress_bar_pulse();
                this.downloadCurrentFile += 1;
                let downloadURL = "";
                if (!this.themes)
                    downloadURL = this.serverURL + this.indexCache[uuid]['icon'];
                else
                    downloadURL = "%s/uploads/themes/thumbs/%s".format(this.serverURL, this.indexCache[uuid]['icon_filename']);
                this.download_manager.push((this.load_assets_thread, (iconFile.get_path(), downloadURL)));
                // thread.start_new_thread(this.loadAssetsThread, (iconFile.get_path(), downloadURL));
            }
        }
        if (!needToDownload)
            this.loadAssetsDone();
    },

/*
    _reporthook: function(count, blockSize, totalSize) {
        let fraction = 0
        if (this.download_total_files > 1) {
            fraction = 1.0 - (parseFloat(this.download_manager.get_n_jobs()) / parseFloat(this.download_total_files));
            let current = parseInt(fraction*100).toString() + '%';
            let total this.download_total_files - this.download_manager.get_n_jobs();
            this.progressbar.set_text("%s - %d / %d files".format(current, total, this.download_total_files);
        } else {
            fraction = count * blockSize / parseFloat((totalSize / blockSize + 1) * (blockSize));
            this.progressbar.set_text(parseInt(fraction * 100).toString() + '%');
        }
        if (fraction > 0)
            this.progressbar.set_fraction(fraction);
        else
            this.progress_bar_pulse();

        while (Gtk.events_pending()) {
            Gtk.main_iteration();
        }
    },

    gotExtensionZipFile: function(session, message, uuid, dir, callback, errback) {
        let [success, pid] = GLib.spawn_async(null,
                                              ['unzip', '-uod', dir.get_path(), '--', file.get_path()],
                                              null,
                                              GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                                              null);
        if (!success) {
            errback('ExtractExtensionError');
            return;
        }
        GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, function(pid, status) {
            GLib.spawn_close_pid(pid);

            if (status != 0)
                this.errback('ExtractExtensionError');
            else
                this.callback();
        });
    },

*/
});
 
const SettingDaemonApp = new Lang.Class ({
    Name: 'Gnocine.SettingDaemonApp',
    GTypeName: 'GnocineSettingDaemonApp',
    Extends: Gio.Application,
 
    _init: function() {
        this.parent({ application_id: "org.classic.gnome.settings.daemon" });
        this._argv = null;
    },
 
    vfunc_activate: function() {
        this.hold(); // close with: this.quit();
    },

    downloadTest: function() {
        let dwnlMang = new DownloaderSpices("http://cinnamon-spices.linuxmint.com", "applet");
        let url = dwnlMang.getIndexURL();
        print(url);
        dwnlMang.connect("download-header", Lang.bind(this, this.onDownloadHeader));
        dwnlMang.connect("download-hook", Lang.bind(this, this.onDownloadHook));
        dwnlMang.connect("download-done", Lang.bind(this, this.onDownloadDone));
        dwnlMang._downloadIndexFile();
    },

    onDownloadHeader: function(dwnlMang, job, contentType, downloadLength) {
        print("Download Header " + contentType + " " + downloadLength);
    },

    onDownloadHook: function(dwnlMang, job, downloadSize, downloadLength) {
        let percent = Math.floor((downloadSize / downloadLength) * 100);
        print("Download %s%s done (%d / %d bytes)".format(percent, "%", downloadSize, downloadLength));
    },

    onDownloadDone: function(dwnlMang, job) {
        print('Download is done');
        this.quit();
    },

    run: function(argv) {
        this._argv = argv;
        Gio.Application.prototype.run.call(this, argv);
    },

    notify: function(summary, body, iconName) {
        this.notification = new Notify.Notification ({
            "summary": summary,
            "body": body,
            "icon-name": iconName
        });
        this.notification.connect("closed", Lang.bind(this, function() {
            let reason = this.notification.get_closed_reason(); // The reason never seem to change.
            print("close reason: " + reason + "\n");
        }));
   
        this.notification.add_action("say_hello", "Say Hello", Lang.bind(this, function() {
            print("Hello\n");
        }));
 
        this.notification.add_action("say_hi", "Say Hi!", Lang.bind(this, function() {
            print("Hi!\n");
        }));
        this.notification.show();
    },
});

function main(argv) {
    var app = new SettingDaemonApp();
    app.downloadTest();
    return app.run(argv);
}

main (ARGV);
