#!/usr/bin/gjs
/* ========================================================================================================
 * xlet-settings.js - An application to display the Gnocine xlet settings -
 * ========================================================================================================
 *
 * General Usage Order (don't repeat the category when it's the same of the module i.e.: applets applets):
 *    sidepage module category uuid instanceId
 *
 * Modules: applets desklets extensions themes settings
 *
 * Categories: applets desklets extensions themes
 *
 * Examples:
 *    - Settings: "xlet-settings.js settings applet menu@cinnamon.org"
 *    - Applets: "xlet-settings.js applets menu@cinnamon.org"
 */


imports.gi.versions.Clutter = '1.0';
imports.gi.versions.Gio = '2.0';
imports.gi.versions.Gdk = '3.0';
imports.gi.versions.GdkPixbuf = '2.0';
imports.gi.versions.Gtk = '3.0';
imports.gi.versions.GDesktopEnums = '3.0';
imports.gi.versions.GnomeDesktop = '3.0';

const Gettext = imports.gettext;
const Lang  = imports.lang;
const Format = imports.format;
const Gtk   = imports.gi.Gtk;
const Gio   = imports.gi.Gio;
const GLib  = imports.gi.GLib;
const Pango = imports.gi.Pango;
const GObject = imports.gi.GObject;

const _ = Gettext.gettext;

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
        //cinnamon_settings: imports.convenience.getSettings("org.cinnamon");
        cinnamon_settings: new Gio.Settings({ schema_id: "org.cinnamon" }),

        rootdatadir: rootFile.get_path(),
        userclassicdatadir: GLib.build_filenamev([GLib.get_user_data_dir(), imports.misc.config.USER_INSTALL_FOLDER]),
    };

    String.prototype.format = Format.format;
}

initEnvironment();
const ModulesLoader = imports.settings.modulesLoader;

const PopWidget = function (properties) {
    let label = new Gtk.Label({ label: properties.label });
    let image = new Gtk.Image ({ icon_name: 'pan-down-symbolic', icon_size: Gtk.IconSize.SMALL_TOOLBAR });
    let widget = new Gtk.Grid();
    widget.attach(label, 0, 0, 1, 1);
    widget.attach(image, 1, 0, 1, 1);

    this.pop = new Gtk.Popover();
    this.button = new Gtk.ToggleButton();
    this.button.add(widget);
    this.button.connect ('clicked', () => { 
        if (this.button.get_active()) { this.pop.show_all(); }
    });
    this.pop.connect ('closed', () => { 
        if (this.button.get_active()) { this.button.set_active(false); }
    });
    this.pop.set_relative_to(this.button);
    this.pop.set_size_request(-1, -1);
    this.pop.set_border_width(8);
    this.pop.add(properties.widget);
};

const Application = new Lang.Class({
    Name: 'Application',
    _init: function() {
        this.title = "Gnocine";
        this.subTitle = "The Gnocine settings";
        GLib.set_prgname(this.title);

        this.modulesManager = new ModulesLoader.ModulesManager();
        this.modulesRequierd = ["get_side_page", "can_load_with_arguments"];

        this.application = new Gtk.Application({
            application_id: 'org.gnome.shell.Gnocine',
            flags: Gio.ApplicationFlags.HANDLES_COMMAND_LINE
        });
        this.application.connect('activate', Lang.bind(this, this._onActivate));
        this.application.connect('command-line', Lang.bind(this, this._onCommandLine));
        this.application.connect('startup', Lang.bind(this, this._onStartup));
    },

    run: function (ARGV) {
        this.argv = ARGV;
        this.application.run(ARGV);
    },

    _onActivate: function () {
        if(this.window) {
           //this.window.present();
           this.window.show_all();
        }
    },

    _onStartup: function() {
        // Here is the commond place tho build the ui,
        // but why create a windows for a command line action
        // or if we detected an error loading our side page?
        this._loadModules();
    },

    _loadModules: function() {
        let modulePath = GLib.build_filenamev([global.rootdatadir, 'tools', 'modules']);
        this.modulesManager.scan(modulePath, "cg_", this.modulesRequierd);
    },

    _onCommandLine: function(app, commandLine) {
        this.argv = commandLine.get_arguments();
        if (this.argv.length > 0) {
            this.module = this.modulesManager.getInstance(this.argv[0]);
            //"applet", "desklet", "extension", "install", "unnstall", "update"
            //global.log("enter" + this.argv[0] + this.module.can_load_with_arguments(this.argv));
            if(this.module && this.module.can_load_with_arguments(this.argv)) {
                this._buildUI();
                app.activate();
                if(this.sidePage) {
                    this.module.on_module_selected();
                }
            }
        } else {
            //this._loadModule();
        }
        return 0;
    },

    _loadModule: function() {
        //if (!this._extensionAvailable(uuid))
        //    return;

        //let extension = ExtensionUtils.extensions[uuid];
        //let widget;

        try {
            //let prefsModule = this._getExtensionPrefsModule(extension);
            //widget = prefsModule.buildPrefsWidget();
        } catch (e) {
            //widget = this._buildErrorUI(extension, e);
        }

        let dialog = new Gtk.Dialog({
            use_header_bar: true,
            modal: true,
            title: "test"
        });//extension.metadata.name 

        if (this._skipMainWindow) {
            this.application.add_window(dialog);
            if (this.window)
                this.window.destroy();
            this.window = dialog;
            this.window.window_position = Gtk.WindowPosition.CENTER;
        } else {
            //dialog.transient_for = this._window;
        }

        dialog.set_default_size(600, 400);
        dialog.get_content_area().add(widget);
        dialog.show();
    },

    _buildErrorUI: function(extension, exc) {
        let box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
        let label = new Gtk.Label({
            label: _("There was an error loading the preferences dialog for %s:").format(extension.metadata.name)
        });
        box.add(label);

        let errortext = '';
        errortext += exc;
        errortext += '\n\n';
        errortext += 'Stack trace:\n';

        // Indent stack trace.
        errortext += exc.stack.split('\n').map(function(line) {
            return '  ' + line;
        }).join('\n');

        let scroll = new Gtk.ScrolledWindow({ vexpand: true });
        let buffer = new Gtk.TextBuffer({ text: errortext });
        let textview = new Gtk.TextView({ buffer: buffer });
        textview.override_font(Pango.font_description_from_string('monospace'));
        scroll.add(textview);
        box.add(scroll);

        box.show_all();
        return box;
    },

    _buildUI: function() {
        if(this.module) {
            this.window = new Gtk.ApplicationWindow({
                application: this.application,
                default_height: 300,
                default_width: 720,
                window_position: Gtk.WindowPosition.CENTER
            });

            try {
                this.sidePage = this.module.get_side_page(this.argv, this.window);
                if(this.sidePage) {
                    this.subTitle = this.sidePage.name;
                    try {
                        this.window.set_icon_name(this.sidePage.icon);
                    } catch (e) {
                        this.window.set_icon_name('application-x-executable');
                    }
                }
                this.window.set_titlebar(this.getHeader(this.sidePage));
                this.window.add(this.sidePage.content_box);
            } catch(e) {
                global.logError("Can not create a side page for this module, %s".format(e.message));
            }

            this.window.set_default_size(800, 600);
            //this.window.set_size_request(800, 500);

            //this.scroll_content_box = new Gtk.ScrolledWindow({
            //    hscrollbar_policy: Gtk.PolicyType.NEVER,
            //    shadow_type: Gtk.ShadowType.IN,
            //    halign: Gtk.Align.CENTER,
            //    //propagate_natural_width: true, FIXME: Property not aviable
            //    margin: 18
            //});
            //this.window.add(this.scroll_content_box);

            //this.extensionSelector = new Gtk.ListBox({ selection_mode: Gtk.SelectionMode.NONE });
            //this.extensionSelector.set_sort_func(Lang.bind(this, this._sortList));
            //this.extensionSelector.set_header_func(Lang.bind(this, this._updateHeader));*/

            //this.button_back = self.builder.get_object("button_back");
            //this.button_back.set_tooltip_text(_("Back to all settings"));
            //let [m, n] = this.button_back.get_preferred_width();
            //this.stack_switcher.set_margin_right(n);
            //this.button_back.connect('clicked', Lang.bind(this, this.back_to_icon_view));
        }
    },

    /*_back_to_icon_view: function(widget, event) {
        this.window.set_title(_("System Settings"))
        this.window.resize(WIN_WIDTH, WIN_HEIGHT);
        let children = this.content_box.get_children();
        for (let child in children) {
            child.hide();
            if (child.get_name() == "c_box") {
                let c_widgets = child.get_children();
                for (c_widget in c_widgets) {
                    c_widget.hide();
                }
            }
        }
        this.main_stack.set_visible_child_name("side_view_page");
        this.header_stack.set_visible_child_name("side_view");
        this.search_entry.grab_focus();
        this.current_sidepage = null;
    },*/

    getHeader: function () {
        let headerBar, headerStart, imageNew, buttonNew, popMenu, imageMenu, buttonMenu;

        headerBar = new Gtk.HeaderBar();
        headerBar.set_title(this.title);
        headerBar.set_subtitle(this.subTitle);
        headerBar.set_show_close_button(true);

        headerStart = new Gtk.Grid({ column_spacing: headerBar.spacing });
        //this.widgetOpen = new PopWidget({ label: "Open", widget: this.getPopOpen() });
        //headerStart.attach(this.widgetOpen.button, 0, 0, 1, 1);

        //imageNew = new Gtk.Image ({ icon_name: 'tab-new-symbolic', icon_size: Gtk.IconSize.SMALL_TOOLBAR });
        //buttonNew = new Gtk.Button({ image: imageNew });
        //buttonNew.connect ('clicked', () => { global.log('Button new'); });
        //headerStart.attach(buttonNew, 1, 0, 1, 1);

        headerBar.pack_start(headerStart);
        popMenu = new Gtk.Popover();
        imageMenu = new Gtk.Image ({ icon_name: 'open-menu-symbolic', icon_size: Gtk.IconSize.SMALL_TOOLBAR });
        buttonMenu = new Gtk.MenuButton({ image: imageMenu });
        buttonMenu.set_popover(popMenu);
        popMenu.set_size_request(-1, -1);
        buttonMenu.set_menu_model(this.getMenu());

        headerBar.pack_end(buttonMenu);

        return headerBar;
    },

    getPopOpen: function () { // Widget popover
        let widget = new Gtk.Grid(),
            label = new Gtk.Label({ label: "Label 1" }),
            button = new Gtk.Button({ label: "Other Documents ..." });

        button.connect ('clicked', () => { 
            this.widgetOpen.pop.hide();
            global.log('Open other documents');
        });
        button.set_size_request(200, -1);

        widget.attach(label, 0, 0, 1, 1);
        widget.attach(button, 0, 1, 1, 1);
        widget.set_halign(Gtk.Align.CENTER);

        return widget;
    },

    getMenu: function () { /* GMenu popover */
        let menu, section, submenu;

        menu = new Gio.Menu();

        section = new Gio.Menu();
        section.append("Save As...", 'app.saveAs');
        section.append("Save All", 'app.saveAll');
        menu.append_section(null, section);

        section = new Gio.Menu();
        submenu = new Gio.Menu();
        section.append_submenu('View', submenu);
        submenu.append("View something", 'app.toggle');
        submenu = new Gio.Menu();
        section.append_submenu('Select', submenu);
        submenu.append("Selection 1", 'app.select::one');
        submenu.append("Selection 2", 'app.select::two');
        submenu.append("Selection 3", 'app.select::thr');
        menu.append_section(null, section);

        section = new Gio.Menu();
        section.append("Close All", 'app.close1');
        section.append("Close", 'app.close2');
        menu.append_section(null, section);

        // Set menu actions
        let actionSaveAs = new Gio.SimpleAction ({ name: 'saveAs' });
        actionSaveAs.connect('activate', () => {
            global.log('Action save as');
        });
        this.application.add_action(actionSaveAs);

        let actionSaveAll = new Gio.SimpleAction ({ name: 'saveAll' });
        actionSaveAll.connect('activate', () => {
            global.log('Action save all');
        });
        this.application.add_action(actionSaveAll);

        let actionClose1 = new Gio.SimpleAction ({ name: 'close1' });
        actionClose1.connect('activate', () => {
            global.log('Action close all');
        });
        this.application.add_action(actionClose1);

        let actionClose2 = new Gio.SimpleAction ({ name: 'close2' });
        actionClose2.connect('activate', () => {
            global.log('Action close');
        });
        this.application.add_action(actionClose2);

        let actionToggle = new Gio.SimpleAction ({ name: 'toggle', state: new GLib.Variant('b', true) });
        actionToggle.connect('activate', (action) => {
            let state = action.get_state().get_boolean();
            if (state) {
                action.set_state(new GLib.Variant('b', false));
            } else {
                action.set_state(new GLib.Variant('b', true));
            }
            global.log('View ' + state);
        });
        this.application.add_action(actionToggle);

        let variant = new GLib.Variant('s', 'one');
        let actionSelect = new Gio.SimpleAction ({ name: 'select', state: variant, parameter_type: variant.get_type() });
        actionSelect.connect('activate', (action, parameter) => {
            let str = parameter.get_string()[0];
            if (str === 'one') {
                action.set_state(new GLib.Variant('s', 'one'));
            }
            if (str === 'two') {
                action.set_state(new GLib.Variant('s', 'two'));
            }
            if (str === 'thr') {
                action.set_state(new GLib.Variant('s', 'thr'));
            }
            global.log('Selection ' + str);
        });
        this.application.add_action(actionSelect);

        return menu;
    },
});

// Run the application
let app = new Application();
app.run(ARGV);
