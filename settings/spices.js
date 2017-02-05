/* ========================================================================================================
 * spices.js - This is a library to handled xlet from the remote source -
 * ========================================================================================================
 */

const Gettext = imports.gettext;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

//const Gettext = imports.gettext.domain(ExtensionUtils.metadata['gettext-domain']);
const _ = Gettext.gettext;

const home = GLib.get_home_dir();
const locale_inst = GLib.build_filenamev([home, ".local", "share", "locale"]);
const settings_dir = GLib.build_filenamev([home, ".cinnamon", "configs"]);

const URL_SPICES_HOME = "http://cinnamon-spices.linuxmint.com";
const URL_SPICES_APPLET_LIST = URL_SPICES_HOME + "/json/applets.json";
const URL_SPICES_THEME_LIST = URL_SPICES_HOME + "/json/themes.json";
const URL_SPICES_DESKLET_LIST = URL_SPICES_HOME + "/json/desklets.json";
const URL_SPICES_EXTENSION_LIST = URL_SPICES_HOME + "/json/extensions.json";

const ABORT_NONE = 0;
const ABORT_ERROR = 1;
const ABORT_USER = 2;

function ui_thread_do(callback, args) {
    //GLib.idle_add (callback, args, GLib.PRIORITY_DEFAULT);
}

function removeEmptyFolders(path) {
   let dir = Gio.file_new_for_path(path);
   if (!(dir.query_exists(null) && (dir.query_file_type(Gio.FileQueryInfoFlags.NONE, null) == Gio.FileType.DIRECTORY)))
        return false;

    let fileEnum, info;
    // remove empty subfolders
    fileEnum = dir.enumerate_children('standard::name,standard::type', Gio.FileQueryInfoFlags.NONE, null);
    while ((info = fileEnum.next_file(null)) != null) {
        if (info.get_file_type() == Gio.FileType.DIRECTORY) {
            removeEmptyFolders(dir.get_child(info.get_name()));
        }
    }
    // if folder empty, delete it
    fileEnum = dir.enumerate_children('standard::name,standard::type', Gio.FileQueryInfoFlags.NONE, null);
    let files = 0;
    while ((info = fileEnum.next_file(null)) != null) {
        if (info.get_file_type() == Gio.FileType.DIRECTORY) {
            removeEmptyFolders(dir.get_child(info.get_name()));
        }
        files++;
    }
    if (files == 0) {
        //global.log("Removing empty folder:", path);
        file['delete'](null);
        return true;
    }
    return false;
}

function recursivelyDeleteDir(dir) {
    let children = dir.enumerate_children('standard::name,standard::type',
                                          Gio.FileQueryInfoFlags.NONE, null);

    let info, child;
    while ((info = children.next_file(null)) != null) {
        let type = info.get_file_type();
        let child = dir.get_child(info.get_name());
        if (type == Gio.FileType.REGULAR)
            deleteGFile(child);
        else if (type == Gio.FileType.DIRECTORY)
            recursivelyDeleteDir(child);
    }

    deleteGFile(dir);
}

const MAX_THREADS = 10;

const ThreadedDownloader = new GObject.Class({
    Name: 'ClassicGnome.ThreadedDownloader',
    GTypeName: 'ClassicGnomeThreadedDownloader',

    _init: function() {
        this.jobs = [];
        this.thread_ids = [];
    },

    get_n_jobs: function() {
        return this.jobs.length;
    },

    busy: function() {
        return ((this.jobs.length > 0) || (this.thread_ids.length > 0));
    },

    push: function(job) {
        this.jobs.insert(0, job);
        this.check_start_job();
    },

    check_start_job: function() {
        if (this.jobs.length > 0) {
            if (this.thread_ids.length == MAX_THREADS)
                return;

            func, payload = this.jobs.pop();
            handle = thread.start_new_thread(func, payload);
            this.thread_ids.push(handle);

            this.check_start_job();
        }
    },

    prune_thread: function(tid) {
        try {
            this.thread_ids.remove(tid);
        } catch(e) {}
        this.check_start_job();
    },
});

const SpiceHarvester = new GObject.Class({
    Name: 'ClassicGnome.SpiceHarvester',
    GTypeName: 'ClassicGnomeSpiceHarvester',

    _init: function(collection_type, window) {
        this.collection_type = collection_type;
        this.cache_folder = Gio.file_new_for_path(this.get_cache_folder());
        this.install_folder = this.get_install_folder();
        this.index_cache = {};
        //this.download_manager = new ThreadedDownloader();
        this.error = null;
        this.themes = (collection_type == "theme");
        if (!(this.cache_folder.get_child("index.json").query_exists(null)))
            this.has_cache = false;
        else
            this.has_cache = true;

        this.window = window;
        this.builder = new Gtk.Builder();
        this.builder.add_from_file("/usr/share/cinnamon/cinnamon-settings/cinnamon-settings-spice-progress.ui");
        this.progress_window = this.builder.get_object("progress_window");
        //this.progress_window.set_transient_for(window);
        this.progress_window.set_destroy_with_parent(true);
        this.progress_window.set_modal(true);
        this.progress_window.set_position(Gtk.WindowPosition.CENTER_ON_PARENT);
        this.progress_button_abort = this.builder.get_object("btnProgressAbort");
        this.progress_window.connect("delete-event", Lang.bind(this, this.on_progress_close));
        this.progresslabel = this.builder.get_object('progresslabel');
        this.progressbar = this.builder.get_object("progressbar");
        this.progressbar.set_text('');
        this.progressbar.set_fraction(0);

        this.progress_window.set_title("");

        this.abort_download = ABORT_NONE;
        this.download_total_files = 0;
        this.download_current_file = 0;
        this._sigLoadFinished = null;

        this.progress_button_abort.connect("clicked", Lang.bind(this, this.on_abort_clicked));

        this.spiceDetail = new Gtk.Dialog({
           title: _("Applet info"),
           //transient_for: this.window,
           modal: true,
           destroy_with_parent: true
        });
        this.spiceDetailSelectButton = this.spiceDetail.add_button(_("Select and Close"), Gtk.ResponseType.YES);
        this.spiceDetailSelectButton.connect("clicked", Lang.bind(this, this.close_select_detail));
        this.spiceDetailCloseButton = this.spiceDetail.add_button(_("Close"), Gtk.ResponseType.CANCEL);
        this.spiceDetailCloseButton.connect("clicked", Lang.bind(this, this.close_detail));
        this.spiceDetail.connect("destroy", Lang.bind(this, this.on_close_detail));
        this.spiceDetail.connect("delete_event", Lang.bind(this, this.on_close_detail));
        this.spiceDetail.set_default_size(640, 440);
        this.spiceDetail.set_size_request(640, 440);
        //FIXME: This help?
        //content_area = this.spiceDetail.get_content_area();
    },
       
    close_select_detail: function() {
        this.spiceDetail.hide();
        if (callable(this.on_detail_select))
            this.on_detail_select(this);
    },

    on_close_detail: function(args) {
        this.close_detail();
        return true;
    },

    close_detail: function() {
        this.spiceDetail.hide();
        if (this.hasOwnProperty('on_detail_close') && callable(this.on_detail_close))
            this.on_detail_close(this);
    },

    _systemCall: function(cmd) {
        try {
            let [success, argv] = GLib.shell_parse_argv(cmd);
            if(success) {
                GLib.spawn_async(null, argv, null,
                                 GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.STDOUT_TO_DEV_NULL  | GLib.SpawnFlags.STDERR_TO_DEV_NULL,
                                 null, null);
            }
        } catch (e) {}
    },

    show_detail: function(uuid, onSelect, onClose) { // onSelect=null, onClose=null
        this.on_detail_select = onSelect;
        this.on_detail_close = onClose;

        if (!this.has_cache)
            this.refresh_cache(false);
        else if (this.index_cache.length == 0)
            this.load_cache();

        if (!(uuid in this.index_cache)) {
            this.load(Lang.bind(this, function(obj, uuid) {
                this.show_detail(uuid);
            }, uuid));
            return;
        }

        let appletData = this.index_cache[uuid];

        // Browsing the info within the app would be great (ala mintinstall)
        // and it gives a better experience (layout, comments, reviewing) than
        // browsing online

        this._systemCall("xdg-open '%s/%ss/view/%s'".format(URL_SPICES_HOME, this.collection_type, appletData['spices-id']));
        return;

        // screenshot_filename = Gio.file_new_for_path(appletData['screenshot']).get_basename();
        // screenshot_path = GLib.build_filenamev([this.get_cache_folder(), screenshot_filename]);
        // appletData['screenshot_path'] = screenshot_path;
        // appletData['screenshot_filename'] = screenshot_filename;

        // if (!Gio.file_new_for_path(screenshot_path).query_exists(null)) {
        //     f = open(screenshot_path, 'w');
        //     this.download_url = URL_SPICES_HOME + appletData['screenshot'];
        //     this.download_with_progressbar(f, screenshot_path, _("Downloading screenshot"), false);
        // }
        // template = open(os.path.realpath(os.path.dirname(os.path.abspath(__file__)) + "/../data/spices/applet-detail.html")).read();
        // subs = {};
        // subs['appletData'] = json.dumps(appletData, sort_keys=false, indent=3);
        // html = string.Template(template).safe_substitute(subs);

        // // Prevent flashing previously viewed
        // this._sigLoadFinished = this.browser.connect("document-load-finished", Lang.bind(this, this.real_show_detail));
        // this.browser.load_html_string(html, "file:///");
    },

    real_show_detail: function() {
        this.browser.show();
        this.spiceDetail.show();
        this.browser.disconnect(this._sigLoadFinished);
    },

    browser_title_changed: function(view, frame, title) {
        let uuid;
        if (title.startswith("nop"))
            return;
        else if (title.startswith("install:"))
            uuid = title.split(':')[1];
            //this.install(uuid);
        else if (title.startswith("uninstall:"))
            uuid = title.split(':')[1];
            //this.uninstall(uuid, '');
        return;
    },

    browser_console_message: function(view, msg, line, sourceid) {
        //global.log(msg);
    },

    get_index_url: function() {
        if (this.collection_type == 'applet')
            return URL_SPICES_APPLET_LIST;
        else if (this.collection_type == 'extension')
            return URL_SPICES_EXTENSION_LIST;
        else if (this.collection_type == 'theme')
            return URL_SPICES_THEME_LIST;
        else if (this.collection_type == 'desklet')
            return URL_SPICES_DESKLET_LIST;
        return false;
    },

    get_cache_folder: function() {
        let cache_folder = Gio.file_new_for_path(GLib.build_filenamev([
          home, ".cinnamon", "spices.cache", this.collection_type
        ]));
        if (!cache_folder.query_exists(null))
            recursivelyDeleteDir(cache_folder);
        return cache_folder.get_path();
    },

    get_install_folder: function() {
        let install_folder = null;
        if (['applet','desklet','extension'].indexOf(this.collection_type) != -1) {
            install_folder = GLib.build_filenamev([
                home, ".local", "share", "cinnamon", this.collection_type + "s"
            ]);
        } else if (this.collection_type == 'theme') {
            install_folder = GLib.build_filenamev([home, ".themes"]);
        }
        return install_folder;
    },

    load: function(onDone, force) {
        this.abort_download = ABORT_NONE;
        if (this.has_cache && !force) {
            this.load_cache();
            ui_thread_do(onDone, this.index_cache);
        } else {
            ui_thread_do(this.ui_refreshing_index);
            this.refresh_cache_done_callback = onDone;
            this.refresh_cache();
        }
        //thread.exit();
    },

    ui_refreshing_index: function() {
        this.progresslabel.set_text(_("Refreshing index..."));
        this.progress_window.show();
        this.progressbar.set_fraction(0);
        this.progress_bar_pulse();
    },
 
    refresh_cache: function(load_assets) { // load_assets=true
        let download_url = this.get_index_url();

        let filename = this.cache_folder.get_child("index.json").get_path();
        let f = open(filename, 'w');
        this.download(f, filename, download_url);

        this.load_cache();
        // global.log("Loaded index, now we know about %d spices.".format(this.index_cache.length));

        if (load_assets) {
            ui_thread_do(this.ui_refreshing_cache);
            this.load_assets();
        }
    },

    ui_refreshing_cache: function() {
        this.progresslabel.set_text(_("Refreshing cache..."));
        this.progress_button_abort.set_sensitive(true);
    },

    load_cache: function() {
        let jsonFile = this.cache_folder.get_child("index.json");
        try {
            let [ok, json_data] = GLib.file_get_contents(jsonFile.get_path());
            this.index_cache = JSON.parse(json_data);
        } catch(e) {
            try {
                jsonFile['delete'](null);
            } catch(e) {}
            this.errorMessage(_("Something went wrong with the spices download.  Please try refreshing the list again."), e.message);
        }
    },

    load_assets: function() {
        let needs_refresh = 0;
        this.used_thumbs = [];

        let uuids = this.index_cache.keys();
        let icon_basename, iconFile, icon_path;
        for (uuid in uuids) {
            if (!this.themes) {
                icon_basename = Gio.file_new_for_path(this.index_cache[uuid]['icon']).get_basename();
                iconFile = this.cache_folder.get_child(icon_basename);
                this.used_thumbs.push(icon_basename);
            } else {
                icon_basename = this.sanitize_thumb(
                    Gio.file_new_for_path(this.index_cache[uuid]['screenshot']).get_basename()
                );
                iconFile = this.cache_folder.get_child(icon_basename);
                this.used_thumbs.push(icon_basename);
            }
            this.index_cache[uuid]['icon_filename'] = icon_basename;
            this.index_cache[uuid]['icon_path'] = iconFile.get_path();

            if ((iconFile.query_file_type(Gio.FileQueryInfoFlags.NONE, null) == Gio.FileType.REGULAR) ||
                this.is_bad_image(iconFile.get_path())) {
                needs_refresh += 1;
            }
        }
        this.download_total_files = needs_refresh;
        this.download_current_file = 0;

        let need_to_download = false;
        for (uuid in uuids) {
            if (this.abort_download > ABORT_NONE)
                return;
            iconFile = Gio.file_new_for_path(this.index_cache[uuid]['icon_path']);
            if ((iconFile.query_file_type(Gio.FileQueryInfoFlags.NONE, null) == Gio.FileType.REGULAR) ||
                this.is_bad_image(iconFile.get_path())) {
                need_to_download = true;
                //this.progress_bar_pulse();
                this.download_current_file += 1;
                let download_url = "";
                if (!this.themes)
                    download_url = URL_SPICES_HOME + this.index_cache[uuid]['icon'];
                else
                    download_url = "%s/uploads/themes/thumbs/%s".format(URL_SPICES_HOME, this.index_cache[uuid]['icon_filename']);
                this.download_manager.push((this.load_assets_thread, (iconFile.get_path(), download_url)));
                // thread.start_new_thread(this.load_assets_thread, (iconFile.get_path(), download_url));
            }
        }
        if (!need_to_download)
            this.load_assets_done();
    },

    is_bad_image: function(path) {
        try {
            let file = Gio.file_new_for_path(path);
            if(!file.query_exists(null))
                return true;
            let gicon = new Gio.FileIcon({file: file});
        } catch (e) {
            return true;
        }
        return false;
    },

    load_assets_thread: function(path, url) {
        let file = open(path, 'w');
        let valid = true;

        this.download(file, path, url);

        this.load_assets_done();
        //thread.exit();
    },

    load_assets_done: function() {
        this.download_manager.prune_thread(thread.get_ident());
        if (this.download_manager.busy())
            return;
        // Cleanup obsolete thumbs
        let trash = [];
        let fileEnum, info;
        fileEnum = dir.enumerate_children('standard::name,standard::type', Gio.FileQueryInfoFlags.NONE, null);
        while ((info = fileEnum.next_file(null)) != null) {
            let f = info.get_name()
            if (!(f in this.used_thumbs) && (f != "index.json")) {
                trash.push(f);
            }
        }
        for (let t in trash) {
            try {
                this.cache_folder.get_child(t)['delete'](null);
            } catch(e) {
                continue;
            }
        }
        ui_thread_do(this.progress_window.hide);
        ui_thread_do(this.refresh_cache_done_callback, this.index_cache);
        this.download_total_files = 0;
        this.download_current_file = 0;
    },

    sanitize_thumb: function(basename) {
        return basename.replace("jpg", "png").replace("JPG", "png").replace("PNG", "png");
    },

    install_all: function(install_list, onFinished) {// install_list=[], onFinished=null
        let need_restart = [];
        let success = false;
        for (let [uuid, is_update, is_active] in install_list) {
            success = this.install(uuid, is_update, is_active);

            if (is_update && is_active && success)
                need_restart.push(uuid);
        }
        ui_thread_do(this.progress_window.hide);
        this.abort_download = false;

        ui_thread_do(onFinished, need_restart);
        //thread.exit();
    },

    get_members: function(zip) {
        let parts = [];
        for (let name in zip.namelist()) {
            if (!name.endswith('/')) {
                parts.push(name.split('/'));
            }
        }
        let prefix = (os.path.commonprefix(parts) || '');
        if (prefix)
            prefix = '/'.join(prefix) + '/';
        let offset = prefix.length;
        let name;
        for (let zipinfo in zip.infolist()) {
            name = zipinfo.filename;
            if (name.length > offset) {
                //zipinfo.filename = name[offset:];
                yield zipinfo;
            }
        }
    },

    install: function(uuid, is_update, is_active) {
        //global.log("Start downloading and installation");
        let title = this.index_cache[uuid]['name'];

        let download_url = URL_SPICES_HOME + this.index_cache[uuid]['file'];
        this.current_uuid = uuid;

        ui_thread_do(this.ui_installing_xlet, title);

        let edited_date = this.index_cache[uuid]['last_edited'];

        if (!this.themes) {
            let [fd, filename] = tempfile.mkstemp();
            let dirname = tempfile.mkdtemp();
            let f = os.fdopen(fd, 'wb');
            try {
                this.download(f, filename, download_url);
                let dest = os.path.join(this.install_folder, uuid);
                let schema_filename = "";
                let zip = zipfile.ZipFile(filename);
                zip.extractall(dirname, this.get_members(zip));
                for (file in this.get_members(zip)) {
                    /*if (!file.filename.endswith('/') && ((file.external_attr >> 16L) & 0o755) == 0o755) {
                        os.chmod(os.path.join(dirname, file.filename), 0o755);
                    } else if (file.filename[:3] == 'po/') {
                        parts = os.path.splitext(file.filename);
                        if (parts[1] == '.po') {
                           this_locale_dir = os.path.join(locale_inst, parts[0][3:], 'LC_MESSAGES');
                           ui_thread_do(this.progresslabel.set_text, _("Installing translations for %s...").format(title));
                           rec_mkdir(this_locale_dir);
                           //global.log("/usr/bin/msgfmt -c %s -o %s".format(os.path.join(dest, file.filename), os.path.join(this_locale_dir, '%s.mo' % uuid)));
                           subprocess.call(["msgfmt", "-c", os.path.join(dirname, file.filename), "-o", os.path.join(this_locale_dir, "%s.mo".format(uuid))]);
                           ui_thread_do(this.progresslabel.set_text, _("Installing %s...").format(title));
                        }
                    } else */if ("gschema.xml" in file.filename) {
                        let sentence = _("Please enter your password to install the required settings schema for %s").format(uuid);
                        if (os.path.exists("/usr/bin/gksu") && os.path.exists("/usr/share/cinnamon/cinnamon-settings/bin/installSchema.py")) {
                            let launcher = "gksu  --message \"<b>%s</b>\"".format(sentence);
                            let tool = "/usr/share/cinnamon/cinnamon-settings/bin/installSchema.py %s".format(os.path.join(dirname, file.filename));
                            let command = "%s %s".format(launcher, tool);
                            this._systemCall(command);
                            let schema_filename = file.filename;
                        } else {
                            this.errorMessage(_("Could not install the settings schema for %s.  You will have to perform this step yourthis.").format(uuid));
                        }
                    }
                }
                let file = open(os.path.join(dirname, "metadata.json"), 'r');
                let raw_meta = file.read();
                file.close();
                let md = json.loads(raw_meta);
                md["last-edited"] = edited_date;
                if (schema_filename != "")
                    md["schema-file"] = schema_filename;
                raw_meta = json.dumps(md, indent=4);
                file = open(os.path.join(dirname, "metadata.json"), 'w+');
                file.write(raw_meta);
                file.close();
                if (os.path.exists(dest))
                    shutil.rmtree(dest);
                shutil.copytree(dirname, dest);
                shutil.rmtree(dirname);
                os.remove(filename);
            } catch(ge) {
                ui_thread_do(this.progress_window.hide);
                try {
                    shutil.rmtree(dirname);
                    os.remove(filename);
                } catch(e) {}
                if (!this.abort_download) {
                    let msg = _("An error occurred during installation or updating. \
                              You may wish to report this incident to the developer of %s.\n\n\
                              If this was an update, the previous installation is unchanged").format(uuid);
                    this.errorMessage(msg, detail.toString());
                }
                return false;
            }
        } else {
            let [fd, filename] = tempfile.mkstemp();
            let dirname = tempfile.mkdtemp();
            let f = os.fdopen(fd, 'wb');
            try {
                this.download(f, filename, download_url);
                let dest = this.install_folder;
                let zip = zipfile.ZipFile(filename);
                zip.extractall(dirname);

                // Check dir name - it may or may not be the same as the theme name from our spices data
                // Regardless, this will end up being the installed theme name, whether it matched or not
                let temp_path = os.path.join(dirname, title);
                if (!os.path.exists(temp_path)) {
                    title = os.listdir(dirname)[0]; // We assume only a single folder, the theme name
                    temp_path = os.path.join(dirname, title);
                }
                // Test for correct folder structure - look for cinnamon.css
                let file = open(os.path.join(temp_path, "cinnamon", "cinnamon.css"), 'r');
                file.close();

                let md = {};
                md["last-edited"] = edited_date;
                md["uuid"] = uuid;
                let raw_meta = json.dumps(md, indent=4);
                file = open(os.path.join(temp_path, "cinnamon", "metadata.json"), 'w+');
                file.write(raw_meta);
                file.close();
                let final_path = os.path.join(dest, title);
                if (os.path.exists(final_path))
                    shutil.rmtree(final_path);
                shutil.copytree(temp_path, final_path);
                shutil.rmtree(dirname);
                os.remove(filename);

            } catch(e) {
                ui_thread_do(this.progress_window.hide);
                try {
                    shutil.rmtree(dirname);
                    os.remove(filename);
                } catch(e) {}
                if (!this.themes)
                    obj = uuid;
                else
                    obj = title;
                if (!this.abort_download) {
                    let msg = _("An error occurred during installation or updating. \
                              You may wish to report this incident to the developer of %s.\n\n\
                              If this was an update, the previous installation is unchanged").format(obj);
                    this.errorMessage(msg, detail.toString());
                }
                return false;
            }
        }
        ui_thread_do(this.progress_button_abort.set_sensitive, false);
        ui_thread_do(this.progress_window.show);
        return true;
    },

    ui_installing_xlet: function(title) {
        this.progress_window.show();
        this.progresslabel.set_text(_("Installing %s...").format(title));
        this.progressbar.set_fraction(0);
    },

    uninstall: function(uuid, name, schema_filename, onFinished=null) {
        ui_thread_do(this.ui_uninstalling_xlet, name);

        try {
            if (!this.themes) {
                if (schema_filename != "") {
                    let sentence = _("Please enter your password to remove the settings schema for %s").format(uuid);
                    if (os.path.exists("/usr/bin/gksu") && os.path.exists("/usr/share/cinnamon/cinnamon-settings/bin/removeSchema.py")) {
                        let launcher = "gksu  --message \"<b>%s</b>\"".format(sentence);
                        let tool = "/usr/share/cinnamon/cinnamon-settings/bin/removeSchema.py %s".format(schema_filename);
                        let command = "%s %s".format(launcher, tool);
                        this._systemCall(command);
                    } else {
                        this.errorMessage(_("Could not remove the settings schema for %s. \
                                             You will have to perform this step yourthis. \
                                             This is not a critical error.").format(uuid));
                    }
                }
                shutil.rmtree(os.path.join(this.install_folder, uuid));

                // Uninstall spice localization files, if any
                if (os.path.exists(locale_inst)) {
                    let i19_folders = os.listdir(locale_inst);
                    for (i19_folder in i19_folders) {
                        if (os.path.isfile(os.path.join(locale_inst, i19_folder, 'LC_MESSAGES', "%s.mo".format(uuid)))) {
                            os.remove(os.path.join(locale_inst, i19_folder, 'LC_MESSAGES', "%s.mo".format(uuid)));
                        }
                        // Clean-up this locale folder
                        removeEmptyFolders(os.path.join(locale_inst, i19_folder));
                    }
                }

                // Uninstall settings file, if any
                if (os.path.exists(os.path.join(settings_dir, uuid)))
                    shutil.rmtree(os.path.join(settings_dir, uuid));
            } else {
                shutil.rmtree(os.path.join(this.install_folder, name));
            }
        } catch(e) {
            ui_thread_do(this.progress_window.hide);
            this.errorMessage(_("Problem uninstalling %s.  You may need to manually remove it.").format(uuid), detail);
        }
        ui_thread_do(this.progress_window.hide);
        ui_thread_do(onFinished, uuid);
        //thread.exit();
    },

    ui_uninstalling_xlet: function(name) {
        this.progresslabel.set_text(_("Uninstalling %s...").format(name));
        this.progress_window.show();
        this.progress_bar_pulse();
    },

    on_abort_clicked: function(button) {
        this.abort_download = ABORT_USER;
        this.progress_window.hide();
        return;
    },

    // download_with_progressbar: function(outfd, outfile, caption, waitForClose) { //caption='Please wait..', waitForClose=true
    //     this.progressbar.set_fraction(0);
    //     this.progressbar.set_text('0%');
    //     this.progresslabel.set_text(caption);
    //     this.progress_window.show();

    //     while Gtk.events_pending() {
    //         Gtk.main_iteration();
    //     }

    //     this.progress_bar_pulse();
    //     this.download(outfd, outfile);

    //     if (!waitForClose) {
    //         time.sleep(0.5);
    //         this.progress_window.hide();
    //     } else {
    //         this.progress_button_abort.set_sensitive(false);
    //     }
    // },

    progress_bar_pulse: function() {
        let count = 0;
        this.progressbar.set_pulse_step(0.1);
        while (count < 1) {
            time.sleep(0.1);
            this.progressbar.pulse();
            count += 1;
            while (Gtk.events_pending()) {
                Gtk.main_iteration();
            }
        }
    },

    download: function(outfd, outfile, url) {
        ui_thread_do(this.progress_button_abort.set_sensitive, true);
        try {
            this.url_retrieve(url, outfd, this.reporthook);
        } catch(ge) {
            try {
                os.remove(outfile);
            } catch(e) {}
            ui_thread_do(this.progress_window.hide);
            if (this.abort_download == ABORT_ERROR)
                this.errorMessage(_("An error occurred while trying to access the server.  Please try again in a little while."), this.error);
            throw Exception(_("Download aborted."));
        }
        return outfile;
    },

    reporthook: function(count, blockSize, totalSize) {
        let fraction = 0
        if (this.download_total_files > 1) {
            fraction = 1.0 - (float(this.download_manager.get_n_jobs()) / float(this.download_total_files));
            this.progressbar.set_text("%s - %d / %d files".format(parseInt(fraction*100).toString() + '%', this.download_total_files - this.download_manager.get_n_jobs(), this.download_total_files));
        } else {
            fraction = count * blockSize / float((totalSize / blockSize + 1) * (blockSize));
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

    url_retrieve: function(url, f, reporthook) {
        //Like the one in urllib. Unlike urllib.retrieve url_retrieve
        //can be interrupted. KeyboardInterrupt exception is rasied when
        //interrupted.
        let count = 0;
        let blockSize = 1024 * 8;
        try {
            let urlobj = urllib2.urlopen(url);
            //assert urlobj.getcode() == 200;
            let data;
            let totalSize = parseInt(urlobj.info()['content-length']);
            try {
                while (this.abort_download == ABORT_NONE) {
                    data = urlobj.read(blockSize);
                    count += 1;
                    if (!data)
                        break;
                    f.write(data);
                    ui_thread_do(reporthook, count, blockSize, totalSize);
                }
            } catch(e) {
                f.close();
                this.abort_download = ABORT_USER;
            }
            //delete urlobj;
        } catch(e) {
            f.close();
            this.abort_download = ABORT_ERROR;
            this.error = detail;
            throw KeyboardInterrupt;
        }

        if (this.abort_download > ABORT_NONE)
            throw KeyboardInterrupt;
        f.close();
    },

    _listdir: function(directory) {
        let info;
        let result = new Array();
        let fileEnum = directory.enumerate_children('standard::name,standard::type', Gio.FileQueryInfoFlags.NONE, null);
        while ((info = fileEnum.next_file(null)) != null) {
            if (info.get_file_type() == Gio.FileType.DIRECTORY) {
                result.push(info.get_name());
            }
        }
        return result;
    },

    scrubConfigDirs: function(enabled_list) {
        let active_list = {};
        let settingsDir, fn, dir_list, id_list, panel, align, order, uuid, id, x, y;
        for (let enabled in enabled_list) {
            if (this.collection_type == "applet") {
                [panel, align, order, uuid, id] = enabled.split(":");
            } else if (this.collection_type == "desklet") {
                [uuid, id, x, y] = enabled.split(":");
            } else {
                uuid = enabled;
                id = 0;
            }
            if (!(uuid in active_list)) {
                id_list = [];
                active_list[uuid] = id_list;
                active_list[uuid].push(id);
            } else {
                active_list[uuid].push(id);
            }
        }
        settingsDir = Gio.file_new_for_path(settings_dir);
        for (let uuid in active_list) {
            if (settingsDir.get_child(uuid).query_exists(null)) {
                dir_list = this._listdir(settingsDir.get_child(uuid));
                fn = "%s.json".format(uuid);
                if ((fn in dir_list) && (dir_list.length == 1))
                    dir_list.remove(fn);
                for (let id in active_list[uuid]) {
                    fn = "%s.json".format(id);
                    if (fn in dir_list)
                        dir_list.remove(fn);
                }
                for (let jetsam in dir_list) {
                    try {
                        settingsDir.get_child(uuid),get_child(jetsam)['delete'](null);
                    } catch(e) {
                        continue;
                    }
                }
            }
        }
    },

    ui_error_message: function(msg, detail) { //detail = null
        let dialog = new Gtk.MessageDialog({
            transient_for: null,
            modal: true,
            message_type: Gtk.MessageType.ERROR,
            buttons: Gtk.ButtonsType.OK
        });
        let markup = msg;
        if (detail != null)
            markup += _("\n\nDetails:  %s").format(detail.toString());
        let esc = cgi.escape(markup);
        dialog.set_markup(esc);
        dialog.show_all();
        response = dialog.run();
        dialog.destroy();
    },

    errorMessage: function(msg, detail) { // detail=null
        ui_thread_do(this.ui_error_message, msg, detail);
    },

    on_progress_close: function(widget, event) {
        this.abort_download = true;
        return widget.hide_on_delete();
    },
});
