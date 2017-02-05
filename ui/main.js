// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

// This is an hybrid module.
// We need to hack Gnome Shell and Cinnamon API here.

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const St = imports.gi.St;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const Main = imports.ui.main;
// Try catch to prevent a crash when Gnome Shell remove some Main modules,
// const are global objects, so not matter.
// The override modules need to be renamed ---Shell.
try { const AccessDialog = imports.ui.accessDialog; } catch(e) {}
try { const AudioDeviceSelection = imports.ui.audioDeviceSelection; } catch(e) {}
try { const Components = imports.ui.components; } catch(e) {}
try { const CtrlAltTab = imports.ui.ctrlAltTab; } catch(e) {}
try { const EndSessionDialog = imports.ui.endSessionDialog; } catch(e) {}
try { const Environment = imports.ui.environment; } catch(e) {}
try { const ExtensionSystemShell = imports.ui.extensionSystem; } catch(e) {}// override
try { const ExtensionDownloader = imports.ui.extensionDownloader; } catch(e) {}
try { const Keyboard = imports.ui.keyboard; } catch(e) {}
try { const LegacyTray = imports.ui.legacyTray; } catch(e) {}
try { const MessageTray = imports.ui.messageTray; } catch(e) {}
try { const ModalDialog = imports.ui.modalDialog; } catch(e) {}
try { const OsdWindow = imports.ui.osdWindow; } catch(e) {}
try { const OsdMonitorLabeler = imports.ui.osdMonitorLabeler; } catch(e) {}
try { const Overview = imports.ui.overview; } catch(e) {}
try { const PadOsd = imports.ui.padOsd; } catch(e) {}
try { const PanelShell = imports.ui.panel; } catch(e) {}// override
try { const Params = imports.misc.params; } catch(e) {}
try { const RunDialog = imports.ui.runDialog; } catch(e) {}
try { const LayoutShell = imports.ui.layout; } catch(e) {}// override
try { const LoginManager = imports.misc.loginManager; } catch(e) {}
try { const LookingGlass = imports.ui.lookingGlass; } catch(e) {}
try { const NotificationDaemon = imports.ui.notificationDaemon; } catch(e) {}
try { const WindowAttentionHandler = imports.ui.windowAttentionHandler; } catch(e) {}
try { const Screencast = imports.ui.screencast; } catch(e) {}
try { const ScreenShield = imports.ui.screenShield; } catch(e) {}
try { const Scripting = imports.ui.scripting; } catch(e) {}
try { const SessionMode = imports.ui.sessionMode; } catch(e) {}
try { const ShellDBus = imports.ui.shellDBus; } catch(e) {}
try { const ShellMountOperation = imports.ui.shellMountOperation; } catch(e) {}
try { const WindowManager = imports.ui.windowManager; } catch(e) {}
try { const Magnifier = imports.ui.magnifier; } catch(e) {}
try { const XdndHandler = imports.ui.xdndHandler; } catch(e) {}
try { const Util = imports.misc.util; } catch(e) {}


const A11Y_SCHEMA = Main.A11Y_SCHEMA;
const STICKY_KEYS_ENABLE = Main.STICKY_KEYS_ENABLE;
const GNOMESHELL_STARTED_MESSAGE_ID = Main.GNOMESHELL_STARTED_MESSAGE_ID;

let componentManager = Main.componentManager;
//let panel = Main.panel; //This was override
let overview = Main.overview;
let runDialog = Main.runDialog;
let lookingGlass = Main.lookingGlass;
let wm = Main.wm;
let legacyTray = Main.legacyTray;
let messageTray = Main.messageTray;
let screenShield = Main.screenShield;
let notificationDaemon = Main.notificationDaemon;
let windowAttentionHandler = Main.windowAttentionHandler;
let ctrlAltTabManager = Main.ctrlAltTabManager;
let padOsdService = Main.padOsdService;
let osdWindowManager = Main.osdWindowManager;
let osdMonitorLabeler = Main.osdMonitorLabeler;
let sessionMode = Main.sessionMode;
let shellAccessDialogDBusService = Main.shellAccessDialogDBusService;
let shellAudioSelectionDBusService = Main.shellAudioSelectionDBusService;
let shellDBusService = Main.shellDBusService;
let shellMountOpDBusService = Main.shellMountOpDBusService;
let screenSaverDBus = Main.screenSaverDBus;
let screencastService = Main.screencastService;
let modalCount = Main.modalCount;
let actionMode = Main.actionMode;
let modalActorFocusStack = Main.modalActorFocusStack;
let uiGroup = Main.uiGroup;
let magnifier = Main.magnifier;
let xdndHandler = Main.xdndHandler;
let keyboard = Main.keyboard;
let layoutManager = Main.layoutManager;
let _startDate = Main._startDate;
let _defaultCssStylesheet = Main._defaultCssStylesheet;
let _cssStylesheet = Main._cssStylesheet;
let _a11ySettings = Main._a11ySettings;
let _themeResource = Main._themeResource;

//It's better do not add this function, we have an init for it.
//function start() {}

function _sessionUpdated() {
    if(Main._sessionUpdated)
        Main._sessionUpdated();
}

function _initializeUI() {
    if(Main._initializeUI)
        Main._initializeUI();
}

function _getStylesheet(name) {
    if(Main._getStylesheet)
        return Main._getStylesheet();
    return null;
}

function _getDefaultStylesheet() {
    if(Main._getDefaultStylesheet)
        return Main._getDefaultStylesheet();
    return stylesheet;
}

function _loadDefaultStylesheet() {
    if(Main._loadDefaultStylesheet)
        Main._loadDefaultStylesheet();
}

function getThemeStylesheet() {
    return Main._cssStylesheet;
}

function setThemeStylesheet(cssStylesheet) {
    if(Main.setThemeStylesheet)
        Main.setThemeStylesheet(cssStylesheet);
}

function reloadThemeResource() {
    if(Main.reloadThemeResource)
        Main.reloadThemeResource();
}

function loadTheme() {
    if(Main.loadTheme)
        Main.loadTheme();
}

function notify(msg, details) {
    if(Main.notify)
        Main.notify(msg, details);
}

function notifyError(msg, details) {
    if(Main.notifyError)
        Main.notifyError(msg, details);
}

function _findModal(actor) {
    if(Main._findModal)
        return Main._findModal(actor);
    return -1;
}

function pushModal(actor, params) {
    if(params && !Array.isArray(params))
        params = { timestamp: params };
    if(Main.pushModal)
        return Main.pushModal(actor, params);
    return false;
}

function popModal(actor, timestamp) {
    if(Main.popModal)
        Main.popModal(actor, timestamp);
}

function createLookingGlass() {
    if(Main.createLookingGlass)
        Main.createLookingGlass();
    return null;
}

function openRunDialog() {
    if(Main.openRunDialog)
        Main.openRunDialog();
}

function activateWindow(window, time, workspaceNum) {
    if(Main.activateWindow)
        Main.activateWindow(window, time, workspaceNum);
}

// TODO - replace this timeout with some system to guess when the user might
// be e.g. just reading the screen and not likely to interact.
const DEFERRED_TIMEOUT_SECONDS = Main.DEFERRED_TIMEOUT_SECONDS;
var _deferredWorkData = Main._deferredWorkData;
// Work scheduled for some point in the future
var _deferredWorkQueue = Main._deferredWorkQueue;
// Work we need to process before the next redraw
var _beforeRedrawQueue = Main._beforeRedrawQueue ;
// Counter to assign work ids
var _deferredWorkSequence = Main._deferredWorkSequence;
var _deferredTimeoutId = Main._deferredTimeoutId;

function _runDeferredWork(workId) {
    if(Main._runDeferredWork)
        Main._runDeferredWork(workId);
}

function _runAllDeferredWork() {
    if(Main._runAllDeferredWork)
        Main._runAllDeferredWork();
}

function _runBeforeRedrawQueue() {
    if(Main._runBeforeRedrawQueue)
        Main._runBeforeRedrawQueue();
}

function _queueBeforeRedraw(workId) {
    if(Main._queueBeforeRedraw)
        Main._queueBeforeRedraw(workId);
}

function initializeDeferredWork(actor, callback, props) {
    if(Main.initializeDeferredWork)
        return Main.initializeDeferredWork(actor, callback, props);
    return null;
}

function queueDeferredWork(workId) {
    if(Main.queueDeferredWork)
        return Main.queueDeferredWork(workId);
    return null;
}

//This is a class:
const RestartMessage = Main.RestartMessage

function showRestartMessage(message) {
    if(Main.showRestartMessage)
        Main.showRestartMessage(message);
}

//***************** Cinnamon ******************//
const ExtensionUtils = imports.misc.extensionUtils.getCurrentExtension();
ExtensionUtils.imports.ui.environment.init();

const Cinnamon = global.loadCinnamon();
//const MessageTray = cimports.ui.messageTray;
const Expo = cimports.ui.expo;
//const Overview = cimports.ui.overview;
//const SearchProviderManager = cimports.ui.searchProviderManager;
//const DeskletManager = cimports.ui.deskletManager;
const ThemeManager = cimports.ui.themeManager;
const Panel = cimports.ui.panel;
const Layout = cimports.ui.layout;
const Settings = cimports.ui.settings;
const CinnamonDBus = cimports.ui.cinnamonDBus;
const AppletManager = cimports.ui.appletManager;
const ExtensionSystem = cimports.ui.extensionSystem;
const PlacesManager = cimports.ui.placesManager;
const Keybindings = cimports.ui.keybindings;
const StatusIconDispatcher = cimports.ui.statusIconDispatcher;
const Systray = cimports.ui.systray;
const IndicatorManager = cimports.ui.indicatorManager;

//Our new variables
let workspace_names, dynamicWorkspaces, wmSettings, expo,
    _errorLogStack, lookingGlass, can_log, lg_log_file,
    settingsManager, cinnamonDBusService, panelManager,
    themeManager, placesManager, keybindingManager,
    statusIconDispatcher, systrayManager, indicatorManager;

// Override panel property to set the shell panel as a cinnamon one.
Object.defineProperty(this, "panel", {
    get: function() {
        return Main.panel;
    },
    set: function(newPanel) {
        Main.panel = newPanel;
    }
});

// Here init all.
function init() {
    _errorLogStack = [];
    lookingGlass = null;
    can_log = false;
    lg_log_file = null;
    dynamicWorkspaces = false; // This should be configurable
    placesManager = new PlacesManager.PlacesManager(); 
    keybindingManager = new Keybindings.KeybindingManager();
    statusIconDispatcher = new StatusIconDispatcher.StatusIconDispatcher();
    systrayManager = new Systray.SystrayManager();
    indicatorManager = new IndicatorManager.IndicatorManager();

    //Thats bad, we don't resolve gSettings yet.
    let wmSettings = new Gio.Settings({schema_id: "org.cinnamon.desktop.wm.preferences"});
    //global.screen.connect('notify::n-workspaces', _nWorkspacesChanged);
    //workspace_names = wmSettings.get_strv("workspace-names")
    workspace_names = [];
    _nWorkspacesChanged();

    //FIXME: override

    wm.moveToWorkspace = Main.wm.actionMoveWorkspace

    //layoutManager = new Layout.LayoutManager();
    //overview = new Overview.Overview();
    //overview.init();
    expo = new Expo.Expo();
    expo.init();
    //messageTray = new MessageTray.MessageTray();
    themeManager = new ThemeManager.ThemeManager();
    settingsManager = new Settings.SettingsManager();
    cinnamonDBusService = new CinnamonDBus.CinnamonDBus();
    panelManager = new Panel.PanelManager();
    panelManager.enablePanels();
    ExtensionSystem.init();
    AppletManager.init();
}

function _makeDefaultWorkspaceName(index) {
    return _("WORKSPACE") + " " + (index + 1).toString();
}

function setWorkspaceName(index, name) {
    name.trim();
    if (name != getWorkspaceName(index)) {
        _fillWorkspaceNames(index);
        workspace_names[index] = (name == _makeDefaultWorkspaceName(index) ? "" : name);
        _trimWorkspaceNames();
        wmSettings.set_strv("workspace-names", workspace_names);
    }
}

function getWorkspaceName(index) {
    let wsName = index < workspace_names.length ?  workspace_names[index] : "";
    wsName.trim();
    return wsName.length > 0 ? wsName : _makeDefaultWorkspaceName(index);
}

function _queueCheckWorkspaces() {
    if (!dynamicWorkspaces)
        return false;
    if (_checkWorkspacesId == 0)
        _checkWorkspacesId = Meta.later_add(Meta.LaterType.BEFORE_REDRAW, _checkWorkspaces);
    return true;
}

function _checkWorkspaces() {
    if (!dynamicWorkspaces)
        return false;
    let i;
    let emptyWorkspaces = [];

    for (let i = 0; i < _workspaces.length; i++) {
        let lastRemoved = _workspaces[i]._lastRemovedWindow;
        if (lastRemoved &&
            (lastRemoved.get_window_type() == Meta.WindowType.SPLASHSCREEN ||
             lastRemoved.get_window_type() == Meta.WindowType.DIALOG ||
             lastRemoved.get_window_type() == Meta.WindowType.MODAL_DIALOG))
                emptyWorkspaces[i] = false;
        else
            emptyWorkspaces[i] = true;
    }

    let windows = global.get_window_actors();
    for (let i = 0; i < windows.length; i++) {
        let win = windows[i];

        if (win.get_meta_window().is_on_all_workspaces())
            continue;

        let workspaceIndex = win.get_workspace();
        emptyWorkspaces[workspaceIndex] = false;
    }

    // If we don't have an empty workspace at the end, add one
    if (!emptyWorkspaces[emptyWorkspaces.length -1]) {
        global.screen.append_new_workspace(false, global.get_current_time());
        emptyWorkspaces.push(false);
    }

    let activeWorkspaceIndex = global.screen.get_active_workspace_index();
    let removingCurrentWorkspace = (emptyWorkspaces[activeWorkspaceIndex] &&
                                    activeWorkspaceIndex < emptyWorkspaces.length - 1);
    // Don't enter the overview when removing multiple empty workspaces at startup
    let showOverview  = (removingCurrentWorkspace &&
                         !emptyWorkspaces.every(function(x) { return x; }));

    if (removingCurrentWorkspace) {
        // "Merge" the empty workspace we are removing with the one at the end
        wm.blockAnimations();
    }

    // Delete other empty workspaces; do it from the end to avoid index changes
    for (let i = emptyWorkspaces.length - 2; i >= 0; i--) {
        if (emptyWorkspaces[i])
            global.screen.remove_workspace(_workspaces[i], global.get_current_time());
    }

    if (removingCurrentWorkspace) {
        global.screen.get_workspace_by_index(global.screen.n_workspaces - 1).activate(global.get_current_time());
        wm.unblockAnimations();
    }

    _checkWorkspacesId = 0;
    return false;
}

function _nWorkspacesChanged() {
    if (!dynamicWorkspaces)
        return false;
    let oldNumWorkspaces = _workspaces.length;
    let newNumWorkspaces = global.screen.n_workspaces;
    if (oldNumWorkspaces == newNumWorkspaces)
        return false;
    let lostWorkspaces = [];
    if (newNumWorkspaces > oldNumWorkspaces) {
        // Assume workspaces are only added at the end
        for (let w = oldNumWorkspaces; w < newNumWorkspaces; w++)
            _workspaces[w] = global.screen.get_workspace_by_index(w);
        for (let w = oldNumWorkspaces; w < newNumWorkspaces; w++) {
            let workspace = _workspaces[w];
            workspace._windowAddedId = workspace.connect('window-added', _queueCheckWorkspaces);
            workspace._windowRemovedId = workspace.connect('window-removed', _windowRemoved);
        }
    } else {
        // Assume workspaces are only removed sequentially
        // (e.g. 2,3,4 - not 2,4,7)
        let removedIndex;
        let removedNum = oldNumWorkspaces - newNumWorkspaces;
        for (let w = 0; w < oldNumWorkspaces; w++) {
            let workspace = global.screen.get_workspace_by_index(w);
            if (_workspaces[w] != workspace) {
                removedIndex = w;
                break;
            }
        }
        let lostWorkspaces = _workspaces.splice(removedIndex, removedNum);
        lostWorkspaces.forEach(function(workspace) {
            workspace.disconnect(workspace._windowAddedId);
            workspace.disconnect(workspace._windowRemovedId);
        });
    }
    _queueCheckWorkspaces();
    return false;
}

function _reparentActor(actor, newParent) {
    let parent = actor.get_parent();
    if (parent)
        parent.remove_actor(actor);
    if(newParent)
        newParent.add_actor(actor);
}

function isInteresting(metaWindow) {
    if (metaWindow.get_title() == "JavaEmbeddedFrame")
        return false;
    let tracker = Cinnamon.WindowTracker.get_default();
    if (tracker.is_window_interesting(metaWindow)) {
        // The nominal case.
        return true;
    }
    // The rest of this function is devoted to discovering "orphan" windows
    // (dialogs without an associated app, e.g., the Logout dialog).
    if (tracker.get_window_app(metaWindow)) {
        // orphans don't have an app!
        return false;
    }
    let type = metaWindow.get_window_type();
    return type === Meta.WindowType.DIALOG || type === Meta.WindowType.MODAL_DIALOG;
}

/**
 * notify:
 * @msg (string): A message
 * @details (string): Additional information to be
 *
 * Sends a notification
 */
/* FIXME: override
function notify(msg, details) {
    let source = new MessageTray.SystemNotificationSource();
    messageTray.add(source);
    let notification = new MessageTray.Notification(source, msg, details);
    notification.setTransient(true);
    source.notify(notification);
}
*/
/**
 * criticalNotify:
 * @msg: A critical message
 * @details: Additional information
 */
function criticalNotify(msg, details, icon) {
    let source = new MessageTray.SystemNotificationSource();
    messageTray.add(source);
    let notification = new MessageTray.Notification(source, msg, details, { icon: icon });
    notification.setTransient(false);
    notification.setUrgency(MessageTray.Urgency.CRITICAL);
    source.notify(notification);
}

/**
 * warningNotify:
 * @msg: A warning message
 * @details: Additional information
 */
function warningNotify(msg, details, icon) {
    let source = new MessageTray.SystemNotificationSource();
    messageTray.add(source);
    let notification = new MessageTray.Notification(source, msg, details, { icon: icon });
    notification.setTransient(false);
    notification.setUrgency(MessageTray.Urgency.WARNING);
    source.notify(notification);
}

/**
 * notifyError:
 * @msg (string): An error message
 * @details (string): Additional information
 *
 * See cinnamon_global_notify_problem().
 */
/* FIXME: override
function notifyError(msg, details) {
    // Also print to stderr so it's logged somewhere
    if (details) {
        _logInfo('error: ' + msg + ': ' + details);
    } else {
        _logInfo('error: ' + msg);
    }
    notify(msg, details);
}
*/
/**
 * _log:
 * @category (string): string message type ('info', 'error')
 * @msg (string): A message string
 * @...: Any further arguments are converted into JSON notation,
 *       and appended to the log message, separated by spaces.
 *
 * Log a message into the LookingGlass error
 * stream.  This is primarily intended for use by the
 * extension system as well as debugging.
 */
function _log(category, msg) {
    let text = msg;
    if (arguments.length > 2) {
        text += ': ';
        for (let i = 2; i < arguments.length; i++) {
            text += JSON.stringify(arguments[i]);
            if (i < arguments.length - 1) {
                text += ' ';
            }
        }
    }
    let out = {timestamp: new Date().getTime().toString(),
                         category: category,
                         message: text };
    _errorLogStack.push(out);
    if (lookingGlass) {
        lookingGlass.emitLogUpdate();
    }
    if (can_log) {
        lg_log_file.write(renderLogLine(out), null);
    }
}

/**
 * isError:
 * @obj (Object): the object to be tested
 * 
 * Tests whether @obj is an error object
 * 
 * Returns (boolean): whether @obj is an error object
 */
function isError(obj) {
    return typeof(obj) == 'object' && 'message' in obj && 'stack' in obj;
}

/**
 * _LogTraceFormatted:
 * @stack (string): the stack trace
 * 
 * Prints the stack trace to the LookingGlass
 * error stream in a predefined format
 */
function _LogTraceFormatted(stack) {
    _log('trace', '\n<----------------\n' + stack + '---------------->');
}

/**
 * _logTrace:
 * @msg (Error): An error object
 *
 * Prints a stack trace of the given object.
 *
 * If msg is an error, its stack-trace will be
 * printed. Otherwise, a stack-trace of the call
 * will be generated
 *
 * If you want to print the message of an Error
 * as well, use the other log functions instead.
 */
function _logTrace(msg) {
    if(isError(msg)) {
        _LogTraceFormatted(msg.stack);
    } else {
        try {
            throw new Error();
        } catch (e) {
            // e.stack must have at least two lines, with the first being
            // _logTrace() (which we strip off), and the second being
            // our caller.
            let trace = e.stack.substr(e.stack.indexOf('\n') + 1);
            _LogTraceFormatted(trace);
        }
    }
}

/**
 * _logWarning:
 * @msg (Error/string): An error object or the message string
 *
 * Logs the message to the LookingGlass error
 * stream.
 *
 * If msg is an error, its stack-trace will be
 * printed.
 */
function _logWarning(msg) {
    if(isError(msg)) {
        _log('warning', msg.message);
        _LogTraceFormatted(msg.stack);
    } else {
        _log('warning', msg);
    }
}

/**
 * _logError:
 * @msg (string): (optional) The message string
 * @error (Error): (optional) The error object
 * 
 * Logs the following (if present) to the
 * LookingGlass error stream:
 * - The message from the error object
 * - The stack trace of the error object
 * - The message @msg
 * 
 * It can be called in the form of either _logError(msg),
 * _logError(error) or _logError(msg, error).
 */
function _logError(msg, error) {
    if(error && isError(error)) {
        _log('error', error.message);
        _LogTraceFormatted(error.stack);
        _log('error', msg);
    } else if(isError(msg)) {
        _log('error', msg.message);
        _LogTraceFormatted(msg.stack);
    } else {
        _log('error', msg);
    }
}

// If msg is an Error, its message will be printed as 'info' and its stack-trace will be printed as 'trace'
/**
 * _logInfo:
 * @msg (Error/string): The error object or the message string
 * 
 * Logs the message to the LookingGlass
 * error stream. If @msg is an Error object, 
 * its stack trace will also be printed
 */

function _logInfo(msg) {
    if(isError(msg)) {
        _log('info', msg.message);
        _LogTraceFormatted(msg.stack);
    } else {
        _log('info', msg);
    }
}

/**
 * formatTime:
 * @d (Date): date object to be formatted
 *
 * Formats a date object into a ISO-8601 format (YYYY-MM-DDTHH:MM:SSZ) in UTC+0
 *
 * Returns (string): a formatted string showing the date
 */
function formatTime(d) {
    return d.toISOString();
}

/**
 * renderLogLine:
 * @line (dictionary): a log line
 * 
 * Converts a log line object into a string
 *
 * Returns (string): line in the format CATEGORY t=TIME MESSAGE
 */
function renderLogLine(line) {
    return line.category + ' t=' + formatTime(new Date(parseInt(line.timestamp))) + ' ' + line.message + '\n';
}

/**
 * logStackTrace:
 * @msg (string): message
 *
 * Logs the message @msg to stdout with backtrace
 */
function logStackTrace(msg) {
    try {
        throw new Error();
    } catch (e) {
        // e.stack must have at least two lines, with the first being
        // logStackTrace() (which we strip off), and the second being
        // our caller.
        let trace = e.stack.substr(e.stack.indexOf('\n') + 1);
        _logInfo(msg ? (msg + '\n' + trace) : trace);
    }
}

/* FIXME: override
function activateWindow(window, time, workspaceNum) {
    let activeWorkspaceNum = global.screen.get_active_workspace_index();
    let windowWorkspaceNum = (workspaceNum !== undefined) ? workspaceNum : window.get_workspace().index();

    if (!time)
        time = global.get_current_time();

    if (windowWorkspaceNum != activeWorkspaceNum) {
        let workspace = global.screen.get_workspace_by_index(windowWorkspaceNum);
        workspace.activate_with_focus(window, time);
    } else {
        window.activate(time);
        Mainloop.idle_add(function() {
            window.foreach_transient(function(win) {
                win.activate(time);
            });
        });
    }

    overview.hide();
    expo.hide();
}
*/
