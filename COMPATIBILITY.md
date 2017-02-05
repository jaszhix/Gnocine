# Xlet Compatibility List

## Contents
- [Applets](#applets)
- [Extensions](#extensions)
- [Desklets](#desklets)

## Applets

### Default Applets

* a11y
  *  Status: Loads, menu items not working

* network
  *  Status: Partially Working

* recent
  *  Status: Untested

* show-desktop
  *  Status: Working

* user
  *  Status: Partially working
  *  Issues:
    *  Menu entries do not point to Gnome equivalents.

* calendar
  *  Status: Working
  *  Issues:
    *  Date and Time Settings menu entry doesn't point to Gnome Shell equivalent.

* notifications
  *  Status: Loads, not working

* removable-drives
  *  Status: Untested

* slideshow
*  Status: Untested

* window-list
*  Status: Working

* expo
  *  Status: Working
  *  Issues:
    *  Cinnamon expo not working. Version included with Classic Gnome was modified to trigger the Gnome Activities view.

* nvidia-prime
  *  Status: Untested

* scale
  *  Status: Untested

* sound
  *  Status: Working
    *  Issues:
    *  ```imports.gi.Cvc``` was changed to ```imports.gi.Gvc```.

* windows-quick-list
  *  Status: Working

* inhibit
  *  Status: Loads, but menu toggles likely have no effect in Gnome Shell because Cinnamon notifications are different.

* on-screen-keyboard
  *  Status: Untested

* separator
  *  Status: Working

* spacer
  *  Status: Working

* workspace-switcher
  *  Status: Partially working
  *  Issues:
    *  St.DrawingArea API: Only usable if "Simple buttons" option is enabled, otherwise buttons don't render correctly.

* keyboard
  *  Status: Untested

* panel-launchers
  *  Status: Partially working
  *  Issues:
    *  Options menu items not working.

* settings
  *  Status: Untested

* systray
  *  Status: Partially working
  *  Issues:
    *  Systray icon click events do not work.
    *  Icons only appear after a new process is launched. Does not load icons for existing processes.

* xrandr
*  Status: Untested

* menu
  *  Status: Partially working
  *  Issues:
    *  Left panel width is wide.

* power
  *  Status: Untested

* trash
  *  Status: Working

### Non-default Applets

* IcingTaskManager@json
  *  Status: Partially working
  *  Issues: 
    *  Not all options are tested yet.

* weather@mockturtl
  *  Status: Working

## Extensions

## Desklets