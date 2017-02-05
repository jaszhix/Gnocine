const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils.getCurrentExtension();
const MainCinnamon = ExtensionUtils.imports.ui.main;

function init() {
    MainCinnamon.init();
    return true;
}

function enable() {
    return true;
}

function disable() {
    return true;
}
