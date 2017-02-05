# Xlet Compatibility List

## Contents
- [Applets](#applets)
- [Extensions](#extensions)
- [Desklets](#desklets)

## Applets

### Default Applets

* a11y@cinnamon.org
  *  Status: Untested

* network@cinnamon.org
  *  Status: Partially Working

* recent@cinnamon.org
  *  Status: Untested

* show-desktop@cinnamon.org
  *  Status: Working

* user@cinnamon.org
  *  Status: Partially working
  *  Issues:
    *  Menu entries do not point to Gnome equivalents.

* calendar@cinnamon.org
  *  Status: Working
  *  Issues:
    *  Date and Time Settings menu entry doesn't point to Gnome Shell equivalent.

* notifications@cinnamon.org
  *  Status: Loads, not working

* removable-drives@cinnamon.org
  *  Status: Untested

* slideshow@cinnamon.org
*  Status: Untested

* window-list@cinnamon.org
*  Status: Working

* expo@cinnamon.org
  *  Status: Working
  *  Issues:
    *  Cinnamon expo not working. Version included with Classic Gnome was modified to trigger the Gnome Activities view.

* nvidia-prime@cinnamon.org
  *  Status: Untested

* scale@cinnamon.org
  *  Status: Untested

* sound@cinnamon.org
  *  Status: Working
    *  Issues:
    *  ```imports.gi.Cvc``` was changed to ```imports.gi.Gvc```.

* windows-quick-list@cinnamon.org
  *  Status: Working

* inhibit@cinnamon.org
  *  Status: Loads, but menu toggles likely have no effect in Gnome Shell because Cinnamon notifications are different.

* on-screen-keyboard@cinnamon.org
  *  Status: Untested

* separator@cinnamon.org
  *  Status: Untested

* spacer@cinnamon.org
  *  Status: Untested

* workspace-switcher@cinnamon.org
  *  Status: Partially working
  *  Issues:
    *  St.DrawingArea API: Only usable if "Simple buttons" option is enabled, otherwise buttons don't render correctly.

* keyboard@cinnamon.org
  *  Status: Untested

* panel-launchers@cinnamon.org
  *  Status: Partially working
  *  Issues:
    *  Options menu items not working.

* settings@cinnamon.org
  *  Status: Untested

* systray@cinnamon.org
  *  Status: Partially working
  *  Issues:
    *  Systray icon click events do not work.
    *  Icons only appear after a new process is launched. Does not load icons for existing processes.

* xrandr@cinnamon.org
*  Status: Untested

* menu@cinnamon.org
  *  Status: Partially working
  *  Issues:
    *  Left panel width is wide.

* power@cinnamon.org
  *  Status: Untested

* trash@cinnamon.org
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