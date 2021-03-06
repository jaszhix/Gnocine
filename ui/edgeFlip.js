// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;

const Main = cimports.ui.main;


function EdgeFlipper(side, func){
    this._init(side, func);
}

EdgeFlipper.prototype = {
    _init: function(side, func){
        this.side = side;
        this.func = func;

        this.enabled = true;
        this.delay = 1000;
        this.entered = false;
        this.activated = false;

        this._checkOver();
    },

    _checkOver: function(){
        if (this.enabled) {
            let mask;
            [this.xMouse, this.yMouse, mask] = global.get_pointer();
            if (!(mask & Clutter.ModifierType.BUTTON1_MASK)) {
                if (this.side == St.Side.RIGHT){
                    if (this.xMouse + 2 > global.screen_width){
                        this._onMouseEnter();
                    } else {
                        this._onMouseLeave();
                    }
                } else if (this.side == St.Side.LEFT){
                    if (this.xMouse < 2 ){
                        this._onMouseEnter();
                    } else {
                        this._onMouseLeave();
                    }
                } else if (this.side == St.Side.BOTTOM){
                    if (this.yMouse + 2 > global.screen_height) {
                        this._onMouseEnter();
                    } else {
                        this._onMouseLeave();
                    }
                } else if (this.side == St.Side.TOP){
                    if (this.yMouse < 2){
                        this._onMouseEnter();
                    } else {
                        this._onMouseLeave();
                    }
                }
            }
            Mainloop.timeout_add(Math.max(this.delay, 200), Lang.bind(this, this._checkOver));
        }
    },

    _onMouseEnter: function(){
        this.entered = true;
        Mainloop.timeout_add(this.delay, Lang.bind(this, this._check));
    },

    _check: function(){
        if (this.entered && this.enabled && !this.activated){
            this.func();
            this.activated = true;
        }
    },

    _onMouseLeave: function(){
        this.entered = false;
        this.activated = false;
    }
};
