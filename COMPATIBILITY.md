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
  *  Notes:
    *  Menu entries do not point to Gnome equivalents.

* calendar
  *  Status: Working
  *  Notes:
    *  Date and Time Settings menu entry doesn't point to Gnome Shell equivalent.

* notifications
  *  Status: Loads, not working

* removable-drives
  *  Status: Untested

* slideshow
  *  Status: Loads, not working

* window-list
  *  Status: Working

* expo
  *  Status: Working
  *  Notes:
    *  Cinnamon expo not working. Version included with Gnocine was modified to trigger the Gnome Activities view.

* nvidia-prime
  *  Status: Untested

* scale
  *  Status: Working

* sound
  *  Status: Working
    *  Notes:
    *  ```imports.gi.Cvc``` was changed to ```imports.gi.Gvc```.

* windows-quick-list
  *  Status: Working

* inhibit
  *  Status: Loads, but menu toggles likely have no effect in Gnome Shell because Cinnamon notifications are different.

* on-screen-keyboard
  *  Status: Working

* separator
  *  Status: Working

* spacer
  *  Status: Working

* workspace-switcher
  *  Status: Partially working
  *  Notes:
    *  St.DrawingArea API: Only usable if "Simple buttons" option is enabled, otherwise buttons don't render correctly.

* keyboard
  *  Status: Working
  *  Notes:
    *  ```load_file_to_cairo_surface``` patched with ```__load_file_to_cairo_surface```.

* panel-launchers
  *  Status: Partially working
  *  Notes:
    *  Options menu items not working.

* settings
  *  Status: Untested

* systray
  *  Status: Partially working
  *  Notes:
    *  Systray icon click events do not work.
    *  Icons only appear after a new process is launched. Does not load icons for existing processes.

* xrandr
*  Status: Crashes GNOME Shell

* menu
  *  Status: Partially working
  *  Notes:
    *  Left panel width is wide.

* power
  *  Status: Untested

* trash
  *  Status: Working

### Non-default Applets

* IcingTaskManager@json
  *  Status: Partially working
  *  Notes: 
    *  Not all options are tested yet.

* weather@mockturtl
  *  Status: Working

## Extensions

## Desklets