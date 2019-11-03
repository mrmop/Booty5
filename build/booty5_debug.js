/*
 * RequestAnimationFrame polyfill
 */
(function() {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                 || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
      window.requestAnimationFrame = function(callback, element) {
          var currTime = new Date().getTime();
          var timeToCall = Math.max(0, 16 - (currTime - lastTime));
          var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
            timeToCall);
          lastTime = currTime + timeToCall;
          return id;
      };

  if (!window.cancelAnimationFrame)
      window.cancelAnimationFrame = function(id) {
          clearTimeout(id);
      };
}());

// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(valueToFind, fromIndex) {

      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n ≥ 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(valueToFind, elementK) is true, return true.
        if (sameValueZero(o[k], valueToFind)) {
          return true;
        }
        // c. Increase k by 1. 
        k++;
      }

      // 8. Return false
      return false;
    }
  });
}

if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function(search, pos) {
            pos = !pos || pos < 0 ? 0 : +pos;
            return this.substring(pos, pos + search.length) === search;
        }
    });
}

// Add Page Visibility API support to old browsers by focus/blur hack.
//
// Include this script _before_ Visibility.js.
//
// Note, that this hack doesn’t correctly emulate Page Visibility API:
// when user change focus from browser to another window (browser and your
// page may stay visible), this hack will decide, that you page is hidden.
//
// For Firefox 5–9 it will be better to use MozVisibility hack without
// this issue. See <https://github.com/private-face/mozvisibility>.
;(function (document) {
    if ( document.visibilityState || document.webkitVisibilityState ) {
        return;
    }

    document.hidden = false;
    document.visibilityState = 'visible';

    var event = null
    var i = 0
    var fireEvent = function () {
        if( document.createEvent ) {
            if ( !event ) {
                event = document.createEvent('HTMLEvents');
                event.initEvent('visibilitychange', true, true);
            }
            document.dispatchEvent(event);
        } else {
            if ( typeof(Visibility) == 'object' ) {
                Visibility._change.call(Visibility, { });
            }
        }
    }

    var onFocus = function () {
        document.hidden = false;
        document.visibilityState = 'visible';
        fireEvent();
    };
    var onBlur  = function () {
        document.hidden = true;
        document.visibilityState = 'hidden';
        fireEvent();
    }

    if ( document.addEventListener ) {
        window.addEventListener('focus', onFocus, true);
        window.addEventListener('blur',  onBlur,  true);
    } else {
        document.attachEvent('onfocusin',  onFocus);
        document.attachEvent('onfocusout', onBlur);
    }
})(document);

;(function (global) {
    var lastId = -1;

    // Visibility.js allow you to know, that your web page is in the background
    // tab and thus not visible to the user. This library is wrap under
    // Page Visibility API. It fix problems with different vendor prefixes and
    // add high-level useful functions.
    var self = {

        // Call callback only when page become to visible for user or
        // call it now if page is visible now or Page Visibility API
        // doesn’t supported.
        //
        // Return false if API isn’t supported, true if page is already visible
        // or listener ID (you can use it in `unbind` method) if page isn’t
        // visible now.
        //
        //   Visibility.onVisible(function () {
        //       startIntroAnimation();
        //   });
        onVisible: function (callback) {
            var support = self.isSupported();
            if ( !support || !self.hidden() ) {
                callback();
                return support;
            }

            var listener = self.change(function (e, state) {
                if ( !self.hidden() ) {
                    self.unbind(listener);
                    callback();
                }
            });
            return listener;
        },

        // Call callback when visibility will be changed. First argument for
        // callback will be original event object, second will be visibility
        // state name.
        //
        // Return listener ID to unbind listener by `unbind` method.
        //
        // If Page Visibility API doesn’t supported method will be return false
        // and callback never will be called.
        //
        //   Visibility.change(function(e, state) {
        //       Statistics.visibilityChange(state);
        //   });
        //
        // It is just proxy to `visibilitychange` event, but use vendor prefix.
        change: function (callback) {
            if ( !self.isSupported() ) {
                return false;
            }
            lastId += 1;
            var number = lastId;
            self._callbacks[number] = callback;
            self._listen();
            return number;
        },

        // Remove `change` listener by it ID.
        //
        //   var id = Visibility.change(function(e, state) {
        //       firstChangeCallback();
        //       Visibility.unbind(id);
        //   });
        unbind: function (id) {
            delete self._callbacks[id];
        },

        // Call `callback` in any state, expect “prerender”. If current state
        // is “prerender” it will wait until state will be changed.
        // If Page Visibility API doesn’t supported, it will call `callback`
        // immediately.
        //
        // Return false if API isn’t supported, true if page is already after
        // prerendering or listener ID (you can use it in `unbind` method)
        // if page is prerended now.
        //
        //   Visibility.afterPrerendering(function () {
        //       Statistics.countVisitor();
        //   });
        afterPrerendering: function (callback) {
            var support   = self.isSupported();
            var prerender = 'prerender';

            if ( !support || prerender != self.state() ) {
                callback();
                return support;
            }

            var listener = self.change(function (e, state) {
                if ( prerender != state ) {
                    self.unbind(listener);
                    callback();
                }
            });
            return listener;
        },

        // Return true if page now isn’t visible to user.
        //
        //   if ( !Visibility.hidden() ) {
        //       VideoPlayer.play();
        //   }
        //
        // It is just proxy to `document.hidden`, but use vendor prefix.
        hidden: function () {
            return !!(self._doc.hidden || self._doc.webkitHidden);
        },

        // Return visibility state: 'visible', 'hidden' or 'prerender'.
        //
        //   if ( 'prerender' == Visibility.state() ) {
        //       Statistics.pageIsPrerendering();
        //   }
        //
        // Don’t use `Visibility.state()` to detect, is page visible, because
        // visibility states can extend in next API versions.
        // Use more simpler and general `Visibility.hidden()` for this cases.
        //
        // It is just proxy to `document.visibilityState`, but use
        // vendor prefix.
        state: function () {
            return self._doc.visibilityState       ||
                   self._doc.webkitVisibilityState ||
                   'visible';
        },

        // Return true if browser support Page Visibility API.
        // refs: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
        //
        //   if ( Visibility.isSupported() ) {
        //       Statistics.startTrackingVisibility();
        //       Visibility.change(function(e, state)) {
        //           Statistics.trackVisibility(state);
        //       });
        //   }
        isSupported: function () {
            return self._doc.hidden !== undefined || self._doc.webkitHidden !== undefined;
        },

        // Link to document object to change it in tests.
        _doc: document || {},

        // Callbacks from `change` method, that wait visibility changes.
        _callbacks: { },

        // Listener for `visibilitychange` event.
        _change: function(event) {
            var state = self.state();

            for ( var i in self._callbacks ) {
                self._callbacks[i].call(self._doc, event, state);
            }
        },

        // Set listener for `visibilitychange` event.
        _listen: function () {
            if ( self._init ) {
                return;
            }

            var event = 'visibilitychange';
            if ( self._doc.webkitVisibilityState ) {
                event = 'webkit' + event;
            }

            var listener = function () {
                self._change.apply(self, arguments);
            };
            if ( self._doc.addEventListener ) {
                self._doc.addEventListener(event, listener);
            } else {
                self._doc.attachEvent(event, listener);
            }
            self._init = true;
        }

    };

    if ( typeof(module) != 'undefined' && module.exports ) {
        module.exports = self;
    } else {
        global.Visibility = self;
    }

})(this);

;(function (window) {
    var lastTimer = -1;

    var install = function (Visibility) {

        // Run callback every `interval` milliseconds if page is visible and
        // every `hiddenInterval` milliseconds if page is hidden.
        //
        //   Visibility.every(60 * 1000, 5 * 60 * 1000, function () {
        //       checkNewMails();
        //   });
        //
        // You can skip `hiddenInterval` and callback will be called only if
        // page is visible.
        //
        //   Visibility.every(1000, function () {
        //       updateCountdown();
        //   });
        //
        // It is analog of `setInterval(callback, interval)` but use visibility
        // state.
        //
        // It return timer ID, that you can use in `Visibility.stop(id)` to stop
        // timer (`clearInterval` analog).
        // Warning: timer ID is different from interval ID from `setInterval`,
        // so don’t use it in `clearInterval`.
        //
        // On change state from hidden to visible timers will be execute.
        Visibility.every = function (interval, hiddenInterval, callback) {
            Visibility._time();

            if ( !callback ) {
                callback = hiddenInterval;
                hiddenInterval = null;
            }

            lastTimer += 1;
            var number = lastTimer;

            Visibility._timers[number] = {
                visible:  interval,
                hidden:   hiddenInterval,
                callback: callback
            };
            Visibility._run(number, false);

            if ( Visibility.isSupported() ) {
                Visibility._listen();
            }
            return number;
        };

        // Stop timer from `every` method by it ID (`every` method return it).
        //
        //   slideshow = Visibility.every(5 * 1000, function () {
        //       changeSlide();
        //   });
        //   $('.stopSlideshow').click(function () {
        //       Visibility.stop(slideshow);
        //   });
        Visibility.stop = function(id) {
            if ( !Visibility._timers[id] ) {
                return false;
            }
            Visibility._stop(id);
            delete Visibility._timers[id];
            return true;
        };

        // Callbacks and intervals added by `every` method.
        Visibility._timers = { };

        // Initialize variables on page loading.
        Visibility._time = function () {
            if ( Visibility._timed ) {
                return;
            }
            Visibility._timed     = true;
            Visibility._wasHidden = Visibility.hidden();

            Visibility.change(function () {
                Visibility._stopRun();
                Visibility._wasHidden = Visibility.hidden();
            });
        };

        // Try to run timer from every method by it’s ID. It will be use
        // `interval` or `hiddenInterval` depending on visibility state.
        // If page is hidden and `hiddenInterval` is null,
        // it will not run timer.
        //
        // Argument `runNow` say, that timers must be execute now too.
        Visibility._run = function (id, runNow) {
            var interval,
                timer = Visibility._timers[id];

            if ( Visibility.hidden() ) {
                if ( null === timer.hidden ) {
                    return;
                }
                interval = timer.hidden;
            } else {
                interval = timer.visible;
            }

            var runner = function () {
                timer.last = new Date();
                timer.callback.call(window);
            }

            if ( runNow ) {
                var now  = new Date();
                var last = now - timer.last ;

                if ( interval > last ) {
                    timer.delay = setTimeout(function () {
                        timer.id = setInterval(runner, interval);
                        runner();
                    }, interval - last);
                } else {
                    timer.id = setInterval(runner, interval);
                    runner();
                }

            } else {
              timer.id = setInterval(runner, interval);
            }
        };

        // Stop timer from `every` method by it’s ID.
        Visibility._stop = function (id) {
            var timer = Visibility._timers[id];
            clearInterval(timer.id);
            clearTimeout(timer.delay);
            delete timer.id;
            delete timer.delay;
        };

        // Listener for `visibilitychange` event.
        Visibility._stopRun = function (event) {
            var isHidden  = Visibility.hidden(),
                wasHidden = Visibility._wasHidden;

            if ( (isHidden && !wasHidden) || (!isHidden && wasHidden) ) {
                for ( var i in Visibility._timers ) {
                    Visibility._stop(i);
                    Visibility._run(i, !isHidden);
                }
            }
        };

        return Visibility;
    }

    if ( typeof(module) != 'undefined' && module.exports ) {
        module.exports = install(require('./visibility.core'));
    } else {
        install(window.Visibility || require('./visibility.core'))
    }

})(window);


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
//

/**
 * Booty5 base namespace
 *
 *
 * @class b5
 *
 */
var b5 = {
};

/**
 * The {@link b5.App} that is currently running
 */
b5.app =  null;

/**
 * The b5 data area
 */
b5.data =  {};

/**
 * Current version of Booty5
 * @type {number}
 */
b5.version = 1.54;

/*
 * RequestAnimationFrame polyfill
 */
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Easing functions, used by the animation system to ease between key frames
//
/**
 * Provides easing functions, used by the animation system to ease between key frames
 *
 * @class b5.Ease
 * @constructor
 *
 */
b5.Ease = function Ease() {};
/**
 * Linear easing
 * @type {number}
 */
b5.Ease.linear = 0;
/**
 * Quadratic in easing
 * @type {number}
 */
b5.Ease.quadin = 1;
/**
 * Quadratic out easing
 * @type {number}
 */
b5.Ease.quadout = 2;
/**
 * Cubic in easing
 * @type {number}
 */
b5.Ease.cubicin = 3;
/**
 * Cubic out easing
 * @type {number}
 */
b5.Ease.cubicout = 4;
/**
 * Quartic in easing
 * @type {number}
 */
b5.Ease.quartin = 5;
/**
 * Quartic out easing
 * @type {number}
 */
b5.Ease.quartout = 6;
/**
 * Sin In easing
 * @type {number}
 */
b5.Ease.sin = 7;    // Backward compatibility
b5.Ease.sinin = 7;
/**
 * Sin Out easing
 * @type {number}
 */
b5.Ease.sinout = 8;
/**
 * Sin InOut easing
 * @type {number}
 */
b5.Ease.sininout = 9;
/**
 * Quadratic inout easing
 * @type {number}
 */
b5.Ease.quadinout = 10;
/**
 * Cubic inout easing
 * @type {number}
 */
b5.Ease.cubicinout = 11;
/**
 * Quartic inout easing
 * @type {number}
 */
b5.Ease.quarticinout = 12;
/**
 * Bounce in easing
 * @type {number}
 */
b5.Ease.bouncein = 13;
/**
 * Bounce out easing
 * @type {number}
 */
b5.Ease.bounceout = 14;
/**
 * Bounce inout easing
 * @type {number}
 */
b5.Ease.bounceinout = 15;
/**
 * Back in easing
 * @type {number}
 */
b5.Ease.backin = 16;
/**
 * Back out easing
 * @type {number}
 */
b5.Ease.backout = 17;
/**
 * Back inout easing
 * @type {number}
 */
b5.Ease.backinout = 18;
/**
 * Circ in easing
 * @type {number}
 */
b5.Ease.circin = 19;
/**
 * Circ  out easing
 * @type {number}
 */
b5.Ease.circout = 20;
/**
 * Circ  inout easing
 * @type {number}
 */
b5.Ease.circinout = 21;
/**
 * Exp in easing
 * @type {number}
 */
b5.Ease.expin = 22;
/**
 * Exp out easing
 * @type {number}
 */
b5.Ease.expout = 23;
/**
 * Exp inout easing
 * @type {number}
 */
b5.Ease.expinout = 24;

b5.Ease.easingFuncs = [
    function(d)
    {
        return d;                       // Linear
    },
    function(d)
    {
        return d * d;                   // Quadratic in
    },
    function(d)
    {
        return d * (2 - d);             // Quadratic out
    },
    function(d)
    {
        return d * d * d;               // Cubic in
    },
    function(d)
    {
        d -= 1;
        return d * d * d + 1;           // Cubic out
    },
    function(d)
    {
        return d * d * d * d;           // Quartic in
    },
    function(d)
    {
        d -= 1;
        return -(d * d * d * d - 1);    // Quartic out
    },
    function(d)
    {
        return 1 - Math.cos(d * Math.PI / 2);    // Sin In
    },
    function(d)
    {
        return Math.sin(d * Math.PI / 2);    // Sin Out
    },
    function(d)
    {
        return 0.5 * (1 - Math.cos(Math.PI * d));    // Sin InOut
    },
    function(d)
    {
        return (d < 0.5) ? 2 * d * d : -1 + (4 - 2 * d) * d;                   // Quadratic in / out
    },
    function(d)
    {
        return (d < 0.5) ? 4 * d * d * d : (d - 1) * (2 * d - 2) * (2 * d - 2) + 1; // Cubic in / out
    },
    function(d)
    {
        return (d < 0.5) ?  8 * d * d * d * d : 1 - 8 * (--d) * d * d * d;      // Quartic in / out
    },
    function(d)
    {
        return 1 - b5.Ease.easingFuncs[b5.Ease.bounceout](1 - d);        // Bounce in
    },
    function(d)
    {
        if (d < (1 / 2.75))
        {
            return 7.5625 * d * d;
        }
        else if (d < (2 / 2.75))
        {
            return 7.5625 * (d -= (1.5 / 2.75)) * d + 0.75;
        }
        else if (d < (2.5 / 2.75))
        {
            return 7.5625 * (d -= (2.25 / 2.75)) * d + 0.9375;
        }
        else
        {
            return 7.5625 * (d -= (2.625 / 2.75)) * d + 0.984375;
        }
    },
    function(d)
    {
        if (d < 0.5)                                // Bounce in / out
            return b5.Ease.easingFuncs[b5.Ease.bounceout](d * 2) * 0.5;
        else
            return b5.Ease.easingFuncs[b5.Ease.bounceout](d * 2 - 1) * 0.5 + 0.5;
    },
    function(d)
    {
        var s = 1.70158;
        return d * d * ((s + 1) * d - s);           // Back in
    },
    function(d)
    {
        var s = 1.70158;
        return --d * d * ((s + 1) * d + s) + 1;     // Back out
    },
    function(d)
    {
        var s = 1.70158 * 1.525;                    // Back in / out
        if ((d *= 2) < 1)
            d = 0.5 * (d * d * ((s + 1) * d - s));
        else
            d = 0.5 * ((d -= 2) * d * ((s + 1) * d + s) + 2);
    },
    function(d)
    {
        return 1 - Math.sqrt(1 - d * d);            // Circ in
    },
    function(d)
    {
        return Math.sqrt(1 - (--d * d));            // Circ out
    },
    function(d)                                     // Circ in / out
    {
        d *= 2;
        if (d < 1)
            d = -0.5 * (Math.sqrt(1 - d * d) - 1);
        else
            d = 0.5 * (Math.sqrt(1 - (d -= 2) * d) + 1);
    },
    function(d)
    {
        return (d == 0) ? 0 : Math.pow(1024, d - 1);    // Exp in
    },
    function(d)
    {
        return (d == 1) ? d : 1 - Math.pow(2, -10 * d); // Exp out
    },
    function(d)
    {
        if (d == 0)                                     // Exp in / out
            return 0;
        if (d == 1)
            return 1;
        if ((d *= 2) < 1)
            return 0.5 * Math.pow(1024, d - 1);
        else
            return 0.5 * (-Math.pow(2, -10 * (d - 1)) + 2);
    },
];

/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * An animation is a collection of key frames that are tweened and applied to a target objects property. A key
 * frame consists of frames and times. Frames are values that the property should be set to and times are the times
 * at which the property should be those values. The values are tweened over the provided times and written to the
 * target objects property.
 *
 * Generally animations are created and added to a {@link b5.Timeline} object which then processes them all automatically.
 *
 * Animations have the following features:
 *
 * - Tweens between multiple key frames with each key frame having its own time value
 * - Automatically deleted when animation reaches end unless destroy is set to false
 * - Can be paused, played and restarted
 * - Easing can be applied between each individual key frame
 * - Can repeat a specified number of times or forever
 * - Can be played back at different speeds using time scale
 * - Can call a user supplied function when an animation repeats or ends
 * - Actions can be called when the end of a specific key frame is reached
 * - Playback can be delayed by setting time to a negative value
 *
 * Supports the following event handlers:
 *
 * - onEnd() - Called when the animation ends
 * - onRepeat() - Called when the animation repeats
 *
 * <b>Examples</b>
 *
 * Example showing how to create an animation
 *
 *      var anim = new b5.Animation(null, actor1, “_x”, [0, 200], [0, 2], 0, [b5.Ease.quartin]);
 *
 * For a complete overview of Animation see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/animation-lets-dance/ Booty5 Animation Overview}
 *
 * @class b5.Animation
 * @constructor
 * @returns {b5.Animation} The created animation
 * @param timeline (b5.Timeline)            The parent Timeline that will manage this animation
 * @param target {object}                   The target object that will have its properties animated
 * @param property {string}                 The name of the property that will be animated
 * @param frames {object[]}                 An array of key frame values that represent the value of the property at each time slot
 * @param times {number[]}                  An array of time values that represent the time at which each key frame should be used
 * @param repeat {number}                   The total number of times that the animation should repeat (0 for forever)
 * @param easing {number[]}                 An array of easing values (optional) (see {@link b5.Ease})
 *
 * @property {b5.Timeline}      timeline                                - Parent timeline (internal)
 * @property {number}           state                                   - State of playback (default b5.Animation.AS_playing} (internal)
 * @property {number}           time                                    - Current time (internal)
 * @property {number}           repeats_left                            - Number of repeats left to play (internal)
 * @property {number}           index                                   - Optimisation to prevent searching through all frames (internal)
 * @property {string}           name                                    - Animation name
 * @property {object}           target                                  - Target object to tween
 * @property {string}           property                                - Property to tween
 * @property {number[]|string[]|boolean[]}   frames                     - Key frame data (array of key frame values)
 * @property {number[]}         times                                   - Key frame times (array of key frame times)
 * @property {number[]}         easing                                  - Key frame easing functions (array of Tween functions) (see {@link b5.Ease})
 * @property {number}           repeat                                  - Total number of times to repeat animation (0 for forever)
 * @property {boolean}          destroy                                 - If true then animation will be destroyed when it finishes playing (default is true)
 * @property {function[]}       actions                                 - Array of action functions (called when frame is reached)
 * @property {number}           time_scale                              - Amount to scale time (default is 1.0)
 * @property {boolean}          tween                                   - If true then frames will be tweened (default is true)
 * @property {boolean}          deactivate                              - When set to true deactivates and hides target actor when its done (default false), should only be used with actors
 */
b5.Animation = function(timeline, target, property, frames, times, repeat, easing)
{
    // Internal variables
    this.timeline = timeline;                   // Parent timeline
    this.state = b5.Animation.AS_playing;       // State of playback
    this.time = -0.000001;                      // Current time
    this.repeats_left = repeat;                 // Number of repeats left to play
    this.index = -1;                            // Optimisation to prevent searching through all frames

    // Public variables
    this.name = null;                           // Animation name
    this.target = target;                       // Target object to tween
    this.property = property;                   // Property to tween
    this.frames = frames;                       // Key frame data (array of key frame values)
    this.times = times;                         // Key frame times (array of key frame times)
    this.easing = easing;                       // Key frame easing functions (array of Tween functions)
    this.repeat = repeat;                       // Total number of times to repeat animation (0 for forever)
    this.destroy = true;                        // If true then animation will be destroyed when it finishes playing (default is true)
    this.actions = [];                          // Array of action functions (called when frame is reached)
    this.time_scale = 1.0;                      // Amount to scale time (default is 1.0)
    this.delay = -0.001;                        // Start delay in seconds
    this.tween = true;                          // if true then frames will be tweened
    this.deactivate = false;                    // When set to true deactivates and hides target actor when its done
};

/**
 * Animation is playing
 * @type {number}
 */
b5.Animation.AS_playing = 0;
/**
 * Animation is paused
 * @type {number}
 */
b5.Animation.AS_paused = 1;

/**
 * Changes between relative and absolute animation
 * @param enable {boolean}                  Set to true to make frames relative animation, false for absolute
 */
b5.Animation.prototype.setRelative = function(enable)
{
    if (enable)
        this.initial_value = this.target[this.property];
    else
        this.initial_value = undefined;
};

/**
 * Pause animation playback
 */
b5.Animation.prototype.pause = function()
{
    this.state = b5.Animation.AS_paused;
};

/**
 * Play animation
 */
b5.Animation.prototype.play = function()
{
    this.state = b5.Animation.AS_playing;
};

/**
 * Restart the animation from the beginning
 */
b5.Animation.prototype.restart = function()
{
    this.state = b5.Animation.AS_playing;
    this.time = this.delay;
    this.index = -1;
    this.repeats_left = this.repeat;
};

/**
 * Per frame update of the animation, carries out tweening, automatically called by the timeline that manages it.
 * If the animation ends and is set to destroy then it will be removed from its timeline parent when it finishes.
 * @param dt {number} Time that has passed since this animation was last updated in seconds
 */
b5.Animation.prototype.update = function(dt)
{
    if (this.state !== b5.Animation.AS_playing)
        return false;
    dt *= this.time_scale;

    // Update time
    var time = this.time + dt;

    // Calculate tweened frame data
    var times = this.times;
    var frames = this.frames;
    var count = times.length;
    var start = this.index;
    if (time < 0)
    {
        var val = frames[0];
        if (this.initial_value !== undefined)
            val += this.initial_value;
        this.target[this.property] = val;
		this.time = time;
		return true;
    }
    if (count <= 1)
        return false;
    for (var t = start; t < count; t++)
    {
        // Find next frame
        var t1 = times[t];
        if (time < t1)
        {
            this.index = t;
            if (time >= times[0])
            {
                // Check to see if we need to call an action
                if (this.index !== start)
                {
                    var action = this.actions[this.index - 1];
                    if (action !== undefined)
                        action();
                }
                var t2 = times[t - 1];
                var fstart = frames[t - 1];
                var ddt = time - t2;
                if (ddt !== 0)
                {
                    var val;
                    if (this.tween)
                    {
                        var dtime = t1 - t2;
                        var dframe = frames[t] - fstart;
                        if (this.easing !== undefined)
                            val = fstart + dframe * b5.Ease.easingFuncs[this.easing[t - 1]](ddt / dtime);
                        else
                            val = fstart + (dframe * ddt) / dtime;
                    }
                    else
                        val = fstart;
                    if (this.initial_value !== undefined)
                        val += this.initial_value;
                    this.target[this.property] = val;
                }
            }
            break;
        }
    }

    // Handle repeat / end animation
    var duration = times[times.length - 1];
    if (time > duration)
    {
        if (this.repeat > 0)
            this.repeats_left--;
        if (this.repeat === 0 || this.repeats_left > 0)
        {
            while (time >= duration)
                time -= duration;

            if (this.onRepeat !== undefined)
                this.onRepeat(this);

            // Reset target property to frame 0 data
            var val = frames[0];
            if (this.initial_value !== undefined)
                val += this.initial_value;
            this.target[this.property] = val;
        }
        else
        {
            var val = frames[times.length - 1];
            if (this.initial_value !== undefined)
                val += this.initial_value;
            this.target[this.property] = val;
            this.state = b5.Animation.AS_paused;
            if (this.destroy)
                this.timeline.remove(this); // Destroy timeline
            if (this.onEnd !== undefined)
            {
                this.onEnd(this);
            }
            if (this.deactivate)
            {
                this.target._av = false;
            }
        }
        this.index = -1;
    }
    this.time = time;
    return true;
};

/**
 * Set the current time of the animation
 * @param time {number} Time in seconds
 */
b5.Animation.prototype.setTime = function(time)
{
    this.time = time;
    this.index = -1;
    this.update(0);
};

/**
 * Sets a function to be caled when the animation reaches the specified frame
 * @param index {number} Index of frame
 * @param action_function {function} A function to call
 */
b5.Animation.prototype.setAction = function(index, action_function)
{
    this.actions[index] = action_function;
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * Animation is accomplished using timelines, a Timeline manages a collection of {@link b5.Animation}'s. A timeline is
 * a collection of animations with each animation targeting a specific property of a specific object. Multiple frames
 * of animation can be attached to the same animation.
 *
 * Once an animation has been created it should be added to either an actor / scene {@link b5.TimelineManager} or the
 * global app {@link b5.TimelineManager} in order for it to be processed. This enables fone control of animation on an
 * actor / scene basis.
 *
 * <b>Examples</b>
 *
 * Example of creating a simple fire and forget timeline with 4 key frames
 *
 *      timeline = new b5.Timeline(my_object, "x", [0, 100, 300, 400], [0, 5, 10, 15], 0, [b5.Ease.quartin, b5.Ease.quartin, b5.Ease.quartin]);
 *
 * The above creates a timeline that targets the x property of my_object with 4 key frames spaced out every 5 seconds and
 * using QuarticIn easing to ease between each frame
 *
 * Example of creating a more complex timeline animation:
 *
 *      var timeline = new b5.Timeline();
 *      var anim = timeline.add(this, "x", [0, 100, 300, 400], [0, 5, 10, 15], 0, [b5.Ease.quartin, b5.Ease.quartin, b5.Ease.quartin]);
 *      anim.setAction(0,function() { console.log("Hit frame 0"); });
 *      anim.setAction(1,function() { console.log("Hit frame 1"); });
 *      anim.setAction(2,function() { console.log("Hit frame 2"); });
 *      anim.onEnd = function() { console.log("Animation ended"); };
 *      anim.onRepeat = function() { console.log("Animation repeated"); };
 *
 * The above creates a timeline that targets the x property of my_object with 4 key frames spaced out every 5 seconds and using
 * QurticIn easing to ease between each frame. A callback function will be called each time the timeline hits a specific
 * frame, callbacks functions will also be called when the animation ends and repeats

 * For a complete overview of Animation see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/animation-lets-dance/ Booty5 Animation Overview}
 *
 * @class b5.Timeline
 * @constructor
 * @returns {b5.Timeline}                   The created timline
 * @param target {object}                   The target object that will have its properties animated
 * @param property {string}                 The name of the property that will be animated
 * @param frames {object[]}                 An array of key frame values that represent the value of the property at each time slot
 * @param times {number[]}                  An array of time values that represent the time at which each key frame should be used
 * @param repeat {number}                   The total number of times that the animation should repeat (0 for forever)
 * @param easing {number[]}                 An array of easing values (optional) (see {@link b5.Ease})
 *
 * @property {b5.Animation[]}       anims                                   - Array of animations (internal)
 * @property {b5.TimelineManager}   manager                                 - Parent timeline manager that manages this timeline
 * @property {string}               name                                    - Name of timeline
 * @property {boolean}              playing                                 - True if playing
 */
b5.Timeline = function(target, property, frames, times, repeat, easing)
{
    // Public variables
    this.anims = [];                    // Animations
    this.manager = null;                // Parent timeline manager
    this.name = null;					// Name of timeline
    this.playing = false;

    if (target !== undefined)
        this.add(target, property, frames, times, repeat, easing);
};

/**
 * Changes all animations in this timeline between relative and absolute animation
 * @param enable {boolean}                  Set to true to make frames relative animation, false for absolute
 */
b5.Timeline.prototype.setRelative = function(enable)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        anims[t].setRelative(enable);
    }
};

/**
 * Changes the repeat count of all animations within the timeline
 * @param repeats {number}                  Number of repeats
 */
b5.Timeline.prototype.setRepeats = function(repeats)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        anims[t].repeat = repeats;
        anims[t].repeats_left = repeats;
    }
};

/**
 * Creates and adds an animation to the timeline
 * @param target {object}                   The target object that will have its properties animated
 * @param property {string}                 The name of the property that will be animated
 * @param frames {object[]}                 An array of key frame values that represent the value of the property at each time slot
 * @param times {number[]}                  An array of time values that represent the time at which each key frame should be used
 * @param repeat {number}                   The total number of times that the animation should repeat (0 for forever)
 * @param easing {number[]}                 An array of easing values (optional) (see {@link b5.Ease})
 * @returns {b5.Animation}                  The created animation
 */
b5.Timeline.prototype.add = function(target, property, frames, times, repeat, easing)
{
    if (arguments.length == 1)  // Single parameter version classes target as an animation
    {
        target.timeline = this;
        this.anims.push(target);
        return target;
    }
    var anim = new b5.Animation(this, target, property, frames, times, repeat, easing);
    this.anims.push(anim);
    return anim;
};

/**
 * Removes the specified animation from the timeline
 * @param animation {b5.Animation}  The animation to remove
 */
b5.Timeline.prototype.remove = function(animation)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        if (anims[t] === animation)
        {
            anims.splice(t, 1);
            return;
        }
    }
};

/**
 * Changes the timeline target
 * @param target {object} The new target
 */
b5.Timeline.prototype.changeTarget = function(target)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        anims[t].target = target; 
    }
};

/**
 * Searches the timeline for the named animation
 * @param name {string} The name of the animation to find
 * @returns {b5.Animation} The animation ot null if not found
 */
b5.Timeline.prototype.find = function(name)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        if (anims[t].name === name)
            return anims[t];
    }
    return null;
};

/**
 * Sets the amount of time in seconds to delay all animations in the timeline
 * @param delay {number} Number of seconds to delay animations
 */
b5.Timeline.prototype.setDelay = function(delay)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        anims[t].delay = -delay;
        anims[t].time = -delay;
    }
};

/**
 * Pauses playback of the timeline and all of its contained animations
 */
b5.Timeline.prototype.pause = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
        this.anims[t].pause();
};

/**
 * Sets the timeline playing the timeline playing all contained animations, if timeline is paused then it will be un-paused
 */
b5.Timeline.prototype.play = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
        this.anims[t].play();
};

/**
 * Restarts the timeline restarting all animations contained within the it from their beginning
 */
b5.Timeline.prototype.restart = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
        this.anims[t].restart();
};

/**
 * Prints out the timeline (debugging)
 * @private
 */
b5.Timeline.prototype.print = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
    {
        console.log(this.anims[t]);
    }
};

/**
 * Updates all animations that are managed by this timeline, automatically called by the timeline manager that manages it.
 * If the timeline has no animations left then it will remove itself ftrom its parent manager.
 * @param dt {number} Time that has passed since this timeline was last updated in seconds
 */
b5.Timeline.prototype.update = function(dt)
{
    // Remove timeline from manager if no animations left to update
    var count = this.anims.length;
    if (count === 0 && this.manager !== undefined)
    {
        this.manager.remove(this);
        return true;
    }

    // Update animations
    this.playing = false;
    for (var t = count - 1; t >= 0; t--)
    {
        if (this.anims[t].update(dt))
            this.playing = true;
    }
    return this.playing;
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A TimelineManager manages a collection of {@link b5.Timeline}'s. The app and each actor / scene has its own timeline manager that have lifetime scope
 * tied to the lifetime of those objects. This allows you to for example add a number of animations to an actor then when the actor is destroyed those
 * animations will be cleaned up.
 *
 * For a complete overview of Animation see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/animation-lets-dance/ Booty5 Animation Overview}
 *
 * @class b5.TimelineManager
 * @constructor
 * @returns {b5.TimelineManager}            The created timeline manager
 * @param timelines {b5.Timeline[]}         Array of timelines that are managed by this manager
 *
 * @property {b5.Timeline[]}    timelines                       - Array of timelines that are managed by this manager
 * @property {boolean}          playing                         - True if playing
*/
b5.TimelineManager = function()
{
    // Public variables
    this.timelines = [];                  // Array of timelines (internal)
    this.playing = false;
};

/**
 * Adds the supplied timeline to the manager
 * @param timeline {b5.Timeline} The timeline to add
 * @returns {b5.Timeline} The added timeline
 */
b5.TimelineManager.prototype.add = function(timeline)
{
    this.timelines.push(timeline);
    timeline.manager = this;
    return timeline;
};

/**
 * Removes the supplied timeline from the manager
 * @param timeline {b5.Timeline} The timeline to remove, ommit to remove all timelines
 */
b5.TimelineManager.prototype.remove = function(timeline)
{
    if (timeline === undefined)
    {
        this.timelines = [];
        return;
    }
    var timelines = this.timelines;
    var count = timelines.length;
    for (var t = 0; t < count; t++)
    {
        if (timelines[t] === timeline)
        {
            timelines.splice(t, 1);
            return;
        }
    }
};

/**
 * Changes all timelines target
 * @param target {object} The new target
 */
b5.TimelineManager.prototype.changeTarget = function(target)
{
    var timelines = this.timelines;
    var count = timelines.length;
    for (var t = 0; t < count; t++)
    {
        timelines[t].changeTarget(target); 
    }
};


/**
 * Searches the timeline manager for the named timeline
 * @param name {string} Name of timeline to find
 * @returns {b5.Timeline} Found timeline or null if not found
 */
b5.TimelineManager.prototype.find = function(name)
{
    var timelines = this.timelines;
    var count = timelines.length;
    for (var t = 0; t < count; t++)
    {
        if (timelines[t].name === name)
            return timelines[t];
    }
    return null;
};

/**
 * Changes the repeat count of all timelines within the timeline manager
 * @param repeats {number}                  Number of repeats
 */
b5.TimelineManager.prototype.setRepeats = function(repeats)
{
    var timelines = this.timelines;
    var count = timelines.length;
    for (var t = 0; t < count; t++)
    {
        timelines[t].setRepeats(repeats);
    }
};

/**
 * Pauses playback of the timeline manager and all of its contained timelines
 */
b5.TimelineManager.prototype.pause = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        this.timelines[t].pause();
};

/**
 * Sets the timeline manager playing the timeline playing all contained timelines, if timeline manager is paused then it will be un-paused
 */
b5.TimelineManager.prototype.play = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        this.timelines[t].play();
};

/**
 * Restarts the timeline manager restarting all timlines contained within the manager from their beginning
 */
b5.TimelineManager.prototype.restart = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        this.timelines[t].restart();
};

/**
 * Prints out the timeline manager (debugging)
 * @private
 */
b5.TimelineManager.prototype.print = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        console.log(this.timelines[t]);
};

/**
 * Updates all timelines that are managed by this manager, automatically called by the app, scene or actor that manages it
 * @param dt {number} Time that has passed since this timeline manager was last updated in seconds
 */
b5.TimelineManager.prototype.update = function(dt)
{
    // Update timelines
    var count = this.timelines.length;
    if (count === 0)
        return false;
    this.playing = false;
    for (var t = count - 1; t >= 0; t--)
    {
        if (this.timelines[t].update(dt))
            this.playing = true;
    }
    return this.playing;
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * The ActionsRegister contains a list of all available actions. new action creators are added to this register.
 *
 * The ActionsRegister is used by the Xoml system to instantiate actions lists from JSON.
 *
 * Below is an example that shows how to register an action that can be used from the Xoml system:
 *
 *      b5.ActionsRegister.register("ChangeActions", function(p) { return new b5.A_ChangeActions(p[1], p[2]); });
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.ActionsRegister
 *
 */
b5.ActionsRegister =
{
    creators: [],                                   // Array of actions creator functions
    /**
     * Registers a new action creator
     * @param action_name {string}      The action name, e.g. A_Sound
     * @param creator_func {function}   Function that creates an instance of the action
     */
    register: function(action_name, creator_func)
    {
        b5.ActionsRegister.creators[action_name] = creator_func;
    },
    /**
     * Creates an action from the supplied name and parameters
     * @param action_name {string}      The action name, e.g. A_Sound
     * @param params {any[]}            Array of parameters to pass to creation function
     * @returns {object}                Created action
     */
    create: function(action_name, params)
    {
        return b5.ActionsRegister.creators[action_name](params);
    }
};

/**
 * An action is a single unit of functionality that can be applied to an object.
 * Generally actions are chained together and added to a {@link b5.Actor} or {@link b5.Scene} to modify their behaviour
 * Each action has a set of initial parameters which are supplied externally as well as the following event handlers:
 *
 * - onInit - Called when the action is first initialised, usually when the action is added to an object
 * - onTick - Called when the action is updated (each game frame)
 *
 * If the onTick handler is not supplied then the action system will assume that it instantly exits and moves to the
 * next action in the actions list
 *
 * An ActionsList contains a list of actions that are executed in sequence. Each action must fully complete (return
 * false from its onTick method) before the next action can be executed. An action list can be executed a finite
 * number of times or indefinitely.
 *
 * Each time an actions list is repeated, all actions within the list will be re-initialised.
 *
 * Example showing how to add two sequential actions to an actor:
 *
 *      var actions_list = new b5.ActionsList("moveme", 0);
 *      actions_list.add(new b5.ActionMoveTo(actor,100,100,2,b5.Ease.sin,b5.Ease.sin));
 *      actions_list.add(new b5.ActionMoveTo(actor,0,0,2,b5.Ease.sin,b5.Ease.sin));
 *      actor.actions.add(actions_list).play();
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.ActionsList
 * @constructor
 * @returns {b5.ActionsList}                The created actions list
 * @param name {string}                     Name of actions list
 * @param repeat {boolean}                  Number of times that the actions list should repeat (0 for forever)
 *
 * @property {number}                   repeats_left    - Number of repeats left before action list ends (interval)
 * @property {b5.ActionsListManager}    manager         - Parent actions list manager
 * @property {string}                   name            - Name of this actions list
 * @property {boolean}                  repeat          - Number of times the actions list should repeat
 * @property {object[]}                 actions         - List of actions to sequentially execute
 * @property {number}                   current         - Current executing action index
 * @property {boolean}                  destroy         - If true then actions list will be destroyed when it finishes playing (default is true)
 * @property {boolean}                  playing         - Playing state (default is false)
 */
b5.ActionsList = function(name, repeat)
{
    // Internal variables
    this.repeats_left = repeat;     // Number of repeats left to play

    // Public variables
    this.manager = null;            // Parent container
    this.name = name;               // Name of actions list
    this.repeat = repeat;           // Number of times to repeat this actions list (0 for forever)
    this.actions = [];		        // List of actions to sequentially execute
    this.current = 0;               // Current executing action index
    this.destroy = true;            // If true then actions list will be destroyed when it finishes playing (default is true)
    this.playing = false;           // Playing state
};

/**
 * Add the specified action to the actions list
 * @param action {object}   Action to add
 * @returns {object}        The added action
 */
b5.ActionsList.prototype.add = function(action)
{
    this.actions.push(action);
    action.parent = this;
    return action;
};

/**
 * Removes the specified action from the actions list
 * @param action {object}  The action to remove
 */
b5.ActionsList.prototype.remove = function(action)
{
    var actions = this.actions;
    var count = actions.length;
    for (var t = 0; t < count; t++)
    {
        if (actions[t] === action)
        {
            actions.splice(t, 1);
            return;
        }
    }
};

/**
 * Executes this actions list, automatically called by the actions list manager
 * @returns {boolean} True if the action is still processing, false if it has stopped
 */
b5.ActionsList.prototype.execute = function()
{
    if (!this.playing)
        return true;
    var actions = this.actions;
    var count = actions.length;
    if (count === 0)
        return false;

    var action = actions[this.current];
    // Initialise action if not already initialised
    if (action.initialised !== true)
    {
        if (action.onInit !== undefined)
            action.onInit();
        action.initialised = true;
    }
    // Execute actions per frame update tick handler
    if (action.onTick === undefined || !action.onTick())
    {
        action.initialised = false;
        this.current++;
        if (this.current >= count)
        {
            this.current = 0;
            if (this.repeat !== 0)
            {
                this.repeats_left--;
                if (this.repeats_left <= 0)
                {
                    this.playing = false;
                    this.repeats_left = this.repeat;
                    return false;
                }
            }
        }
    }

    return true;
};

/**
 * Pauses playback of the actions list
 */
b5.ActionsList.prototype.pause = function()
{
    this.playing = false;
};

/**
 * Sets the actions list playing, if actions list is paused then it will be un-paused
 */
b5.ActionsList.prototype.play = function()
{
    this.playing = true;
};

/**
 * Restarts the actions list restarting all actions contained within it
 */
b5.ActionsList.prototype.restart = function()
{
    var actions = this.actions;
    var count = actions.length;
    for (var t = 0; t < count; t++)
        actions[t].initialised = false;
    this.repeats_left = this.repeat;
    this.play();
};

/**
 * An ActionsListManager manages a collection of {@link b5.ActionsList}'s. The App and each Actor / Scene has its own ActionsListManager
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.ActionsListManager
 * @constructor
 * @returns {b5.ActionsListManager}             The created actions list manager
 *
 * @property {b5.ActionsList[]} actions         - Array of action lists that are managed by this manager
 */
b5.ActionsListManager = function()
{
    // Public variables
    this.actions = [];                  // Array of action lists
};


/**
 * Adds the supplied actions list to the manager
 * @param actionlist {b5.ActionsList} The actions list to add
 * @returns {b5.ActionsList} The added actions list
 */
b5.ActionsListManager.prototype.add = function(actionlist)
{
    this.actions.push(actionlist);
    actionlist.manager = this;
    return actionlist;
};

/**
 * Removes the supplied actions list from the manager
 * @param actionlist {b5.ActionsList} The actions list to remove
 */
b5.ActionsListManager.prototype.remove = function(actionlist)
{
    var actions = this.actions;
    var count = actions.length;
    for (var t = 0; t < count; t++)
    {
        if (actions[t] === actionlist)
        {
            actions.splice(t, 1);
            return;
        }
    }
};

/**
 * Searches the actions list manager for the named actions list
 * @param name {string} Name of actions list to find
 * @returns {b5.ActionsList} Found actions list or null if not found
 */
b5.ActionsListManager.prototype.find = function(name)
{
    var actions = this.actions;
    var count = actions.length;
    for (var t = 0; t < count; t++)
    {
        if (actions[t].name === name)
            return actions[t];
    }
    return null;
};

/**
 * Executes all actions within this actions list, automatically called by parent app, actor or scene
 */
b5.ActionsListManager.prototype.execute = function()
{
    // Update action lists
    var removals = [];
    var actions = this.actions;
    var count = actions.length;
    for (var t = 0; t < count; t++)
    {
        if (!actions[t].execute())
        {
            if (actions[t].destroy)
                removals.push(actions[t]);
        }
    }
    // Remove destroyed action lists
    for (var t = 0; t < removals.length; t++)
        this.remove(removals[t]);
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * An events manager can be attached to an object and used to handle named user event subscription and notification. 
 *
 * Example showing how to subscribe and raise events:
 *
 *      var app = b5.app;
 *      app.events.on("Hello", function(event)
 *      {
 *          console.log("Hello event was raised by app");
 *          console.log(event);
 *      }, this);
 *	
 *      app.events.dispatch("Hello");
 *	
 *      var scene = b5.Utils.findObjectFromPath("gamescene");
 *      scene.events.on("Hello", function(event)
 *      {
 *          console.log("Hello event was raised by scene");
 *          console.log(event);
 *      }, this);
 *
 *      scene.events.dispatch("Hello");
 *
 * @class b5.EventManager
 * @constructor
 * @returns {b5.EventManager}               The created events manager
 *
 * @property {object[]}                 events          - Evenst list
 */
b5.EventsManager = function()
{
    // Internal variables
    this.events = [];               // Events
};

/**
 * Add the specified named event and function pair to the events manager
 * @param event_name {string}           Name of event to listen to
 * @param event_function {function}     Function to call when this event is raised
 * @param event_data {object}           Data to pass to the function   
 */
b5.EventsManager.prototype.on = function(event_name, event_function, event_data)
{
    this.events.push({ name:event_name, func:event_function, data:event_data });
};

/**
 * Removes the specified event from the events manager
 * @param event_name {string}   Name of event to remove
 */
b5.EventsManager.prototype.remove = function(event_name)
{
    var events = this.events;
    var count = events.length;
    this.events = array.filter(function(element)
    {
        return element.name !== event_name;
    });
};

/**
 * Removes all events from the manager
 */
b5.EventsManager.prototype.clear = function()
{
    this.events = [];
};

/**
 * Dispatches the specified event calling the attached functions
 * @param event_name {string}   Name of event to dispatch
 */
b5.EventsManager.prototype.dispatch = function(event_name)
{
    var events = this.events;
    var count = events.length;
    for (var t = 0; t < count; t++)
    {
        if (events[t].name === event_name)
        {
            events[t].func(events[t]);
            return;
        }
    }
};



/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A Task is a function that is ran every game update that can be paused, played and stopped.
 *
 * @class b5.Task
 * @constructor
 * @returns {b5.Task}                   - The created task
 *
 * @property {string} name              - The name of the task
 * @property {function} func            - The function to call each update
 * @property {object} data              - User supplied data which is passed back
 * @property {number} state             - Current state of the task
 * @property {number} running_time      - The amount of time the task has been running in seconds
 * @property {number} delay             - Amount of time to wait before starting the task, pass -1 to run once then stop but not destroy itself
 * @property {number} loops             - The number of times the task has been ran
 * @property {number} repeat            - Number of times to run task, pass 0 to run forever, note that the task will be removed from the list when it runs out
 * @property {number} last_time         - The amount of time that has passed since the last time the task was ran 
 * @property {number} wait              - The amount of time to wait before calling this task again 
 * @property {number} onComplete        - A callback that will be called when the task has completed
 */
b5.Task = function(name, delay, repeat, func, data)
{
    this.name = name;
    this.func = func;
    this.data = data;
    this.state = b5.Task.Stopped;
    this.running_time = 0;
    this.delay = delay;
    this.loops = 0;
    this.repeat = repeat;
    this.last_time = 0;
    this.wait = 0;
    
    this.pause = function()
    {
        this.state = b5.Task.Paused;
    };
    this.play = function()
    {
        this.state = b5.Task.Running;
    };
    this.stop = function()
    {
        this.state = b5.Task.Stopped;
    };

    if (delay === 0)
        this.play();
    else
        this.state = b5.Task.Dormant;
};

/**
 * The task is in a dormant state (waiting to be ran)
 * @constant
 */
b5.Task.Dormant = 0;
/**
 * The task is in a running state
 * @constant
 */
b5.Task.Running = 1;
/**
 * The task is in a paused state
 * @constant
 */
b5.Task.Paused = 2;
/**
 * The task is in astopped state
 * @constant
 */
b5.Task.Stopped = 3;

/**
 * A TasksQ manages a collection of Tasks that are ran in serial. Only the first task in the queue is ran, once that tasks is
 * complete the next task in the queue is ran.
 * 
 *  var taskq = new b5.TasksQ();
 *  taskq.onComplete = function()
 *  {
 *      console.log("TaskQ completed");
 *  };
 *  taskq.add("t1", 2, 1, function(task)
 *  {
 *      console.log("Running task" + task.data);
 *  }, 1);
 *  taskq.add("t2", 2, 1, function(task)
 *  {
 *      console.log("Running task" + task.data);
 *  }, 2);
 *  taskq.add("t3", 2, 1, function(task)
 *  {
 *      console.log("Running task" + task.data);
 *  }, 3);
 *
 * @class b5.TasksQ
 * @constructor
 * @returns {b5.TasksQ}               - The created tasks queue
 *
 * @property {b5.Task[]} tasks        - Array of tasks that will be ran
 */
b5.TasksQ = function()
{
    // Public variables
    this.q = true;
    this.tasks = [];                  // Array of tasks
};

/**
 * Adds the named task to the queue
 * @param task_name {string}        The name of the task
 * @param delay_start {number}      Amount of time to wait before starting the task, pass -1 to run once then stop but not destroy itself
 * @param repeats {number}          Number of times to repeat the task before destroying it, pass -1 to run forever
 * @param task_function {function}  The task function to call
 * @param task_data {object}        Data that is passed to the task function when called
 * @returns {b5.Task}               The added task
 */
b5.TasksQ.prototype.add = function(task_name, delay_start, repeats, task_function, task_data)
{
    var task = new b5.Task(task_name, delay_start, repeats, task_function, task_data);
    this.tasks.push(task);
    return task;
};

/**
 * Removes the task at a specific index in the queue
 * @param which {number}            The index in the qeuue of the task to remove
 */
b5.TasksQ.prototype.removeAt = function(which)
{
    this.tasks.splice(which, 1);
};

/**
 * Removes the named task from the queue
 * @param task_name {string}        The name of the task
 */
b5.TasksQ.prototype.remove = function(task_name)
{
    var tasks = this.tasks;
    var count = tasks.length;
    for (var t = 0; t < count; t++)
    {
        if (tasks[t].name === task_name)
        {
            tasks.splice(t, 1);
            return;
        }
    }
};

/**
 * Removes the task from the queue
 * @param task {string}             The task to remove
 */
b5.TasksQ.prototype.removeTask = function(task)
{
    var tasks = this.tasks;
    var count = tasks.length;
    for (var t = 0; t < count; t++)
    {
        if (tasks[t] === task)
        {
            tasks.splice(t, 1);
            return;
        }
    }
};

/**
 * Finds the named task
 * @param task_name {string}        The name of the task
 * @returns {b5.Task}               The found task or null if not found
 */
b5.TasksQ.prototype.find = function(task_name)
{
    var tasks = this.tasks;
    var count = tasks.length;
    for (var t = 0; t < count; t++)
    {
        if (tasks[t].name === task_name)
        {
            return tasks[t];
        }
    }
    return null;
};

/**
 * Removes all tasks from the queue
 */
b5.TasksQ.prototype.clear = function()
{
    this.tasks = [];
};

/**
 * Executes the current task
 */
b5.TasksQ.prototype.execute = function()
{
    var dt = b5.app.dt;
    var tasks = this.tasks;
    var count = tasks.length;
    if (count === 0) return 0;
    var task = tasks[0];
    if (task.state === b5.Task.Dormant)
    {
        task.running_time += dt;
        if (task.running_time >= task.delay)
        {
            task.play();
            task.running_time -= dt;
        }
    }
    if (task.state === b5.Task.Running)
    {
        var run = true;
        if (task.wait !== 0)
        {
            task.last_time += dt;
            if (task.last_time >= task.wait)
                task.last_time -= task.wait;
            else
                run = false;
        }
        if (run === true)
        {
            task.func(task);
            task.running_time += dt;
            if (task.delay < 0)
            {
                task.stop();
            }
            else if (task.repeat > 0)
            {
                task.loops++;
                if (task.loops >= task.repeat)
                {
                    task.stop();
                    if (task.onComplete !== undefined)
                        task.onComplete(this);
                    this.removeTask(task);
                }
            }
        }
    }
    return tasks.length;
};

/**
 * A TasksManager manages a collection of Tasks. The App and each Actor / Scene has its own TasksManager
 *
 *      // An example showing how to create a task that starts after 3 seconds and runs 10 times
 *      var app = b5.app;
 *      var task = app.tasks.add("task1", 3, 10, function(task)
 *      {
 *          console.log("Task ran");
 *          console.log(task);
 *      }, this);
 *
 *      // An example showing how to create a task that starts after 3 seconds and runs 10 times every 2 seconds
 *      var app = b5.app;
 *      app.tasks.add("task1", 3, 10, function(task)
 *      {
 *          console.log("Task ran");
 *          console.log(task);
 *      }, this).wait = 2;
 *
 * @class b5.TasksManager
 * @constructor
 * @returns {b5.TasksManager}               - The created tasks manager
 *
 * @property {b5.Task[]} tasks              - Array of tasks that are managed by this manager
 */
b5.TasksManager = function()
{
    // Public variables
    this.tasks = [];                  // Array of tasks
};

/**
 * Adds the named task to the manager
 * @param task_name {string}        The name of the task
 * @param delay_start {number}      Amount of time to wait before starting the task
 * @param repeats {number}          Number of times to repeat the task before destroying it, pass -1 to run forever
 * @param task_function {function}  The task function to call
 * @param task_data {object}        Data that is passed to the task function when called
 * @returns {b5.Task}               The added task
 */
b5.TasksManager.prototype.add = function(task_name, delay_start, repeats, task_function, task_data)
{
    var task = new b5.Task(task_name, delay_start, repeats, task_function, task_data);
    this.tasks.push(task);
    return task;
};

/**
 * Removes the task at a specific index in the list
 * @param which {number}            The index in the qeuue of the task to remove
 */
b5.TasksManager.prototype.removeAt = function(which)
{
    this.tasks.splice(which, 1);
};

/**
 * Removes the named task from the manager
 * @param task_name {string}        The name of the task
 */
b5.TasksManager.prototype.remove = function(task_name)
{
    var tasks = this.tasks;
    var count = tasks.length;
    for (var t = 0; t < count; t++)
    {
        if (tasks[t].name === task_name)
        {
            tasks.splice(t, 1);
            return;
        }
    }
};

/**
 * Removes the task from the manager
 * @param task {string}             The task to remove
 */
b5.TasksManager.prototype.removeTask = function(task)
{
    var tasks = this.tasks;
    var count = tasks.length;
    for (var t = 0; t < count; t++)
    {
        if (tasks[t] === task)
        {
            tasks.splice(t, 1);
            return;
        }
    }
};

/**
 * Finds the named task
 * @param task_name {string}        The name of the task
 * @returns {b5.Task}               The found task or null if not found
 */
b5.TasksManager.prototype.find = function(task_name)
{
    var tasks = this.tasks;
    var count = tasks.length;
    for (var t = 0; t < count; t++)
    {
        if (tasks[t].name === task_name)
        {
            return tasks[t];
        }
    }
    return null;
};

/**
 * Removes all tasks from the manager
 */
b5.TasksManager.prototype.clear = function()
{
    this.tasks = [];            // Concurrent tasks
};

/**
 * Executes all running tasks within this tasks manager, automatically called by parent app or scene
 */
b5.TasksManager.prototype.execute = function()
{
    var removals = [];
    var dt = b5.app.dt;
    var tasks = this.tasks;
    var count = tasks.length;
    for (var t = 0; t < count; t++)
    {
        var task = tasks[t]; 
        if (task.q)
        {
            if (task.execute() === 0)
            {
                if (task.onComplete !== undefined)
                    task.onComplete(this);
                removals.push(task);
            }
        }
        else
        {
            if (task.state === b5.Task.Dormant)
            {
                task.running_time += dt;
                if (task.running_time >= task.delay)
                {
                    task.play();
                    task.running_time -= dt;
                }
            }
            if (task.state === b5.Task.Running)
            {
                var run = true;
                if (task.wait !== 0)
                {
                    task.last_time += dt;
                    if (task.last_time >= task.wait)
                        task.last_time -= task.wait;
                    else
                        run = false;
                }
                if (run)
                {
                    task.func(task);
                    task.running_time += dt;
                    if (task.delay < 0)
                    {
                        task.stop();
                    }
                    else if (task.repeat > 0)
                    {
                        task.loops++;
                        if (task.loops >= task.repeat)
                        {
                            removals.push(task);
                            task.stop();
                            if (task.onComplete !== undefined)
                                task.onComplete(this);
                        }
                    }
                }
            }
        }
    }
    // Remove destroyed tasks
    for (var t = 0; t < removals.length; t++)
        this.removeTask(removals[t]);
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * An Actor is a basic game object that carries our game logic and rendering. The base Actor has the following features:
 *
 * - Position, size, scale, rotation
 * - Absolute (pixel coordinate) and relative (based on visible size) origins
 * - Layering
 * - Support for cached rendering
 * - 3D depth (allows easy parallax scrolling)
 * - Angular, linear and depth velocity
 * - Box2D physics support (including multiple fixtures and joints)
 * - Bitmap frame animation
 * - Timeline animation manager
 * - Actions list manager
 * - Tasks manager
 * - Sprite atlas support
 * - Child hierarchy
 * - Angular gradient fills
 * - Shadows
 * - Composite operations
 * - Begin, end and move touch events (when touchable is true), also supports event bubbling
 * - Canvas edge docking with dock margins
 * - Child stacking
 * - Can move in relation to camera or be locked in place
 * - Can be made to wrap with scene extents on x and y axis
 * - Clip children against the extents of the parent with margins and shapes
 * - Supports opacity
 * - Can be represented visually by arcs, rectangles, polygons, bitmaps and labels
 * - Support for a virtual canvas that can scroll content around
 *
 * Supports the following event handlers:
 *
 * - onCreate() - Called just after Actor has been created (only called from Xoml)
 * - onDestroy() - Called just before Actor is destroyed
 * - onTick(delta_time) - Called each time the Actor is updated (every frame)
 * - onTapped(touch_pos) - Called when the Actor is tapped / clicked
 * - onDblTapped(touch_pos) - Called when the Actor is double tapped / clicked
 * - onBeginTouch(touch_pos) - Called if the user begins to touch this actor
 * - onEndTouch(touch_pos) - Called when the user stops touching display and this actor was beneath last touch point
 * - onLostTouchFocus(touch_pos) - Called if actor was touched on initial begin touch event when the user stops touching display, even if this actor is not under touch point
 * - onMoveTouch(touch_pos) - Called when a touch is moved over the Actor
 * - onHover(touch_pos) - Called if the user hovers over this actor
 * - onHoverEnd(touch_pos) - Called if the user stops hovering over this actor
 * - onCollisionStart(contact) - Called when the Actor started colliding with another
 * - onCollisionEnd(contact) - Called when the Actor stopped colliding with another
 * - onAVChanged(visible) - Called when the active-visible state of an actor changes via the _av property
 * - onAnimEnd() - Called when the playing bitmap ends
 *
 * For an actor to be processed and rendered you must add it to a {@link b5.Scene} or another {@link b5.Actor}
 * that is part of a scene hierarchy
 *
 * <b>Examples</b>
 *
 *
 * Example showing how to create a basic actor:
 *
 *      var actor = new b5.Actor();
 *      actor.x = 100;
 *      actor.y = 100;
 *      actor.w = 200;
 *      actor.h = 200;
 *      actor.bitmap = my_bitmap;
 *      scene.addActor(actor);   // Add to scene
 *
 * Adding a bitmap image to the actor example
 *
 *      bg.bitmap = new b5.Bitmap("background", "images/background.jpg", true);
 *
 * Adding a bitmap image from the scene resources to an actor example
 *
 *      bg.bitmap = scene.findResource("background", "bitmap");
 *
 * Adding basic physics to a basic actor example
 *
 *      actor.initBody("dynamic", false, false);    // Initialise physics body
 *      actor.addFixture({type: Shape.TypeBox, width: actor.w, height: actor.h}); // Add a physics fixture
 *
 * Adding bitmap animation to an actor example
 *
 *      actor.atlas = new b5.ImageAtlas("sheep", new b5.Bitmap("sheep", "images/sheep.png", true)); // Create an image atlas from a bitmap image
 *      actor.atlas.addFrame(0,0,86,89);     // Add frame 1 to the atlas
 *      actor.atlas.addFrame(86,0,86,89);    // Add frame 2 to the atlas
 *      actor.current_frame = 0;             // Set initial animation frame
 *      actor.frame_speed = 1;               // Set animation playback speed
 *
 * Adding collection of bitmap animation to an actor example
 *
 *      actor.atlas = new ImageAtlas("sheep", new Bitmap("sheep", "images/sheep.png", true));
 *      actor.atlas.addFrame(0,0,32,32,0,0);    // Add frame 1 to the atlas
 *      actor.atlas.addFrame(32,0,32,32,0,0);   // Add frame 2 to the atlas
 *      actor.atlas.addFrame(64,0,32,32,0,0);   // Add frame 3 to the atlas
 *      actor.atlas.addFrame(96,0,32,32,0,0);   // Add frame 4 to the atlas
 *      actor.atlas.addFrame(128,0,32,32,0,0);   // Add frame 5 to the atlas
 *      actor.atlas.addFrame(160,0,32,32,0,0);   // Add frame 6 to the atlas
 *      actor.atlas.addAnim("walk", [0, 1, 2, 3], 10);
 *      actor.atlas.addAnim("idle", [4, 5], 10);
 *      actor.playAnim("walk");
 * 
 * Add a child actor example
 *
 *      var child_actor = new b5.Actor();
 *      actor.addActor(child_actor);
 *
 * Adding an onTick event handler to an actor example
 *
 *      Actor.onTick = function(dt) {
 *          this.x++;
 *      };
 *
 * Adding touch event handlers to an actor example
 *
 *      actor.touchable = true ; // Allow actor to be tested for touches
 *      actor.onTapped = function(touch_pos) {
 *          console.log("Actor tapped");
 *      };
 *      actor.onBeginTouch = function(touch_pos) {
 *          console.log("Actor touch begin");
 *      };
 *      actor.onEndTouch = function(touch_pos) {
 *          console.log("Actor touch end");
 *      };
 *      actor.onMoveTouch = function(touch_pos) {
 *          console.log("Actor touch move");
 *      };
 *
 * Docking an actor to the edges of the scene example
 *
 *      actor.dock_x = Actor.Dock_Left;
 *      actor.dock_y = Actor.Dock_Top;
 *      actor.ignore_camera = true;
 *
 * Self clipped actor example
 *
 *      // Create a clip shape
 *      var shape = new b5.Shape();
 *      shape.type = b5.Shape.TypePolygon;
 *      shape.vertices = [0, -20, 20, 20, -20, 20];
 *
 *      // Set clip shape and enable self clipping
 *      actor.self_clip = true;
 *      actor.clip_shape = shape;
 *
 * Adding a physics joint example
 *
 *      actor1.addJoint({ type: "weld", actor_b: actor2, anchor_a: { x: 0, y: 0 }, anchor_b: { x: 0, y: 0 }, self_collide: true });
 *
 * Handling collision example
 *
 *      actor1.onCollisionStart = function (contact) {
 *           var actor1 = contact.GetFixtureA().GetBody().GetUserData();
 *           var actor2 = contact.GetFixtureB().GetBody().GetUserData();
 *           console.log(actor1.name + " hit " + actor2.name);
 *      };
 *
 * Apply force and torque example
 *
 *      var b2Vec2 = Box2D.Common.Math.b2Vec2;
 *      var pos = actor.body.GetWorldPoint(new b2Vec2(0,0));
 *      actor.body.ApplyForce(new b2Vec2(fx, fy), pos);
 *
 * Changing velocity and applying impulses example
 *
 *      var b2Vec2 = Box2D.Common.Math.b2Vec2;
 *      actor.body.SetLinearVelocity(new b2Vec2(vx, vy));
 *      actor.body.SetAngularVelocity(vr);
 *      actor.body.ApplyImpulse(new b2Vec2(ix, iy), pos);
 *
 * Creating and adding a timeline animation example
 *
 *      // Create a timeline that targets the x property of my_object with 4 key frames spaced out every 5 seconds and using
 *      // QuarticIn easing to ease between each frame
 *      var timeline = new b5.Timeline(my_object, "_x", [0, 100, 300, 400], [0, 5, 10, 15], 0, [b5.Ease.quartin, b5.Ease.quartin, b5.Ease.quartin]);
 *      my_object.timelines.add(timeline); // Add to timeline manager to be processed
 *
 * For a complete overview of the Actor class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actors/ Booty5 Actor Overview}
 *
 * @class b5.Actor
 * @param virtual {boolean} If true then this Actor will support a virtual scrollable canvas
 * @constructor
 * @returns {b5.Actor} The created Actor
 *
 * @property {number}                   type                - Type of actor (internal)
 * @property {b5.Scene}                 scene               - Parent scene (internal)
 * @property {b5.Actor}                 parent              - Parent actor (If null then this actor does not belong to an actor hierarchy) (internal)
 * @property {b5.Actor[]}               actors              - Array of child actors (internal)
 * @property {b5.Actor[]}               removals            - Array of actors that should be deleted at end of frame (internal)
 * @property {object[]}                 joints              - Array of Box2D physics joints that weer created by this actor (internal)
 * @property {b5.TimelineManager}       timelines           - Actor local animation timelines (internal)
 * @property {b5.ActionsListManager}    actions             - Actions list manager (internal)
 * @property {b5.TasksManager}          tasks               - Tasks manager (internal)
 * @property {number}                   frame_count         - Number of frames that this actor has been running (internal)
 * @property {number}                   accum_scale_x       - Accumulated X scale (internal)
 * @property {number}                   accum_scale_y       - Accumulated Y scale (internal)
 * @property {number}                   accum_opacity       - Accumulative opacity (internal)
 * @property {Box2DBody}                body                - Box2D body (null if none attached) (internal)
 * @property {number[]}                 transform           - Current visual transform (internal)
 * @property {boolean}                  transform_dirty     - If set to true then transforms will be rebuilt next update (internal)
 * @property {number}                   touch_et        	- Time when the actor last received an end touch (internal)
 * @property {boolean}                  touching            - Set to true when user touching (internal)
 * @property {boolean}                  touchmove           - Set to true when touch is moving on this actor (internal)
 * @property {number}                   layer               - Visible layer, negative layer causes hte actor to be rendered beneath parent (set via property _layers) (internal)
 * @property {boolean}                  order_changed       - Set to true when child actors change order (internal)
 * @property {Canvas}                   cache_canvas        - The HTML5 Canvas object that is used to cache rendering (internal)

 * @property {string}                   name                - Name of actor (used to find actors in the scene)
 * @property {string}                   tag                 - Tag (used to find groups of actors in the scene)
 * @property {number}                   id                  - User defined ID (default is -1)
 * @property {boolean}                  active              - Active state, inactive actors will not be updated (default is true)
 * @property {boolean}                  visible             - Visible state, invisible actors will not be drawn (default is true)
 * @property {boolean}                  touchable           - If true then can be touched (default false)
 * @property {boolean}                  hit           		- If true then will be included io hit testing (default true)
 * @property {number}                   layer               - Actor sorting layer, set via _layer (default is 0)
 * @property {number}                   x                   - X position in scene, set via _x (default is 0)
 * @property {number}                   y                   - Y position in scene, set via _y (default is 0)
 * @property {number}                   x2                  - X offset
 * @property {number}                   y2                  - Y offset
 * @property {number}                   w                   - Width of actor (default is 0)
 * @property {number}                   h                   - Height of actor (default is 0)
 * @property {number}                   ox                  - X origin (between -1 and 1), set via _ox, if value falls outside that range then origin will be interpreted as pixels (default is 0)
 * @property {number}                   oy                  - Y origin (between -1 and 1), set via _oy, if value falls outside that range then origin will be interpreted as pixels (default is 0)
 * @property {boolean}                  ignore_atlas_size   - If true then the actor will not change size top match the size of the sub image from the atlas
 * @property {boolean}                  absolute_origin     - If true then origin will be taken as absolute coordinates, otherwise it will be taken as a proportion of actors size (default is true)
 * @property {number}                   rotation            - Rotation in radians, set via _rotation (default is 0)
 * @property {number}                   scale_x             - X scale, set via _scale_x or _scale (default is 1)
 * @property {number}                   scale_y             - Y scale, set via _scale_y or _scale (default is 1)
 * @property {number}                   depth               - Z depth (3D depth), set via _depth, 0 represents no depth  (default is 0)
 * @property {number}                   opacity             - Opacity (between 0 and 1) (default is 1)
 * @property {boolean}                  use_parent_opacity  - Scale opacity by parent opacity if true  (default is true)
 * @property {number}                   current_frame       - Current bitmap animation frame  (default is 0)
 * @property {number}                   frame_speed         - Bitmap animation playback speed in seconds  (default is 0)
 * @property {number[]}                 anim_frames         - Array of animation frame indices, if not set then frames will be used in order specified in the atlas  (default is null)
 * @property {boolean}                  frames_repeat       - True if the bitmap animation should repeat
 * @property {b5.Bitmap}                bitmap              - Bitmap (used if no atlas defined), if set via _bitmap then instance of bitmap or string based path to bitmap can be used (default is null)
 * @property {b5.ImageAtlas}            atlas               - Image atlas, if set via _bitmap then instance of atlas or string based path to atlas can be used (default is null)
 * @property {number}                   vr                  - Rotational velocity (when no body attached) (default is 0)
 * @property {number}                   vx                  - X velocity (when no body attached) (default is 0)
 * @property {number}                   vy                  - Y velocity (when no body attached) (default is 0)
 * @property {number}                   vd                  - Depth velocity, rate at which depth changes (default is 0)
 * @property {number}                   vr_damping          - Rotational damping (when no body attached) (default is 1)
 * @property {number}                   vx_damping          - X velocity damping (when no body attached) (default is 1)
 * @property {number}                   vy_damping          - Y velocity damping (when no body attached) (default is 1)
 * @property {number}                   vd_damping          - Depth velocity damping (default is 1)
 * @property {boolean}                  ignore_camera       - If set to true them then this actor will not use camera translation (default is false)
 * @property {boolean}                  wrap_position       - If true then actor will wrap at extents of scene (default is false)
 * @property {number}                   dock_x              - X-axis docking (0 = none, 1 = left, 2 = right) (default is 0)
 * @property {number}                   dock_y              - Y-axis docking (0 = none, 1 = top, 2 = bottom) (default is 0)
 * @property {number}                   dock_screen         - If true then docking will be to screen edge instead of scene edge
 * @property {number[]}                 margin              - Margin to leave around docked actors [left, right, top, bottom] (default is [0,0,0,0])
 * @property {boolean}                  bubbling            - If true then touch events will be allowed to bubble up to parents (default is false)
 * @property {boolean}                  clip_children       - If set to true then child actors will be clipped against extents of this actor (default is false)
 * @property {number[]}                 clip_margin         - Margin to leave around clipping [left, top, right, bottom] (default is [0,0,0,0])
 * @property {b5.Shape}                 clip_shape          - Shape to clip this actor and / or its children against, if set via _clip_shape then instance of shape or string based path to shape can be used (default is null)
 * @property {boolean}                  self_clip           - If set to true then this actor will be clipped against its own clipping shape (default is false)
 * @property {boolean}                  orphaned            - If set to true then this actor will not use its parent actors transform, scene transform will be used instead (default is false)
 * @property {boolean}                  virtual             - If true then actor will be classed as a container with a virtual canvas that can scroll and stack its content (default is false)
 * @property {boolean}                  stacking            - Stacking method to used to stack child actors
 * @property {boolean}                  clip_virtual        - f true then children with virtual actors will be clipped by rect
 * @property {boolean}                  shadow              - If set to true then shadow will be added to text (default is false)
 * @property {number}                   shadow_x            - Shadow x axis offset (default is 0)
 * @property {number}                   shadow_y            - Shadow y axis offset (default is 0)
 * @property {number}                   shadow_blur         - Shadow blur (default is 0)
 * @property {string}                   shadow_colour       - Shadow colour (default is "#000000")
 * @property {string}                   composite_op        - Composite operation (default is null)
 * @property {boolean}                  cache               - If true then resource will be rendered to a cached canvas (default is false)
 * @property {boolean}                  merge_cache         - If true then resource will be rendered to parent cached canvas (default is false)
 * @property {boolean}                  cached              - Cached if true
 * @property {boolean}                  round_pixels        - If set to true then vertices will be rounded before rendered which can boost performance, but there will be a loss in precision (default is false)
 * @property {number}                   padding             - Text padding (used when caching)
 * @property {number}                   scale_method        - Scale method used to fit actor to screen
 * @property {bool}                   	draw_reverse        - If set to true children are drawn in reverse order
 *
 *
 */
b5.Actor = function(virtual)
{
	// Internal variables
	this.type = b5.Actor.Type_Image; // Type of actor
	this.scene = null;				// Parent scene
	this.parent = null;				// Parent actor (If null then this actor does not belong to an actor hierarchy)
	this.actors = [];				// Array of child actors
	this.removals = [];             // Array of actors that should be deleted at end of frame
	this.joints = [];				// Array of physics joints that weer created by this actor
	this.timelines = new b5.TimelineManager();  // Actor local animation timelines
	if (b5.ActionsListManager !== undefined)
		this.actions = new b5.ActionsListManager(); // Actions list manager
	this.tasks = new b5.TasksManager(); 		// Tasks manager
	this.frame_count = 0;			// Number of frames that this actor has been running
	this.accum_scale_x = 1;			// Accumulated X scale
	this.accum_scale_y = 1;			// Accumulated Y scale
	this.accum_opacity = 1.0;		// Accumulative opacity
	this.body = null;				// Box2D body
	this.transform = [];			// Current transform
	this.transform_dirty = true;	// If set to true then transforms will be rebuilt next update
	this.layout_dirty = true;		// If set to true then layout will ne updated
	this.touch_et = null;
	this.touching = false;			// Set to true when user touching
	this.touchmove = false;			// Set to true when touch is moving on this actor
	this.layer = 0;                 // Visible layer (set via property _layers)
	this.order_changed = true;      // Set to true when child actors change order
	this.cache_canvas = null;       // Used to cache rendering

	// Public variables
	this.name = "";					// Name of actor (used to find actors in the scene)
	this.tag = "";					// Tag (used to find groups of actors in the scene)
	this.id = -1;					// User defined ID
	this.active = true;				// Active state, inactive actors will not be updated
	this.visible = true;			// Visible state, invisible actors will not be drawn
	this.touchable = false;			// True to make touchable
	this.hit = true;				// True to include this actor in hit test
	this.x = 0;						// X position in scene, set via _x
	this.y = 0;						// Y position in scene, set via _y
	this.x2 = 0;					// X offset
	this.y2 = 0;					// Y offset
	this.w = 0;						// Width of actor
	this.h = 0;						// Height of actor
	this.ox = 0;					// X origin (between -1 and 1), set via _ox, if value falls outside that range then origin will be interpreted as pixels
	this.oy = 0;					// Y origin (between -1 and 1), set via _oy, if value falls outside that range then origin will be interpreted as pixels
	this.ignore_atlas_size = false;	// If true then the actor will not change size top match the size of the sub image from the atlas
	this.absolute_origin = true;	// If true then origin will be taken as absolute coordinates, otherwise it will be taken as a proportion of actors size
	this.rotation = 0;				// Rotation in radians, set via _rotation
	this.scale_x = 1;				// X scale, set via _scale_x or _scale
	this.scale_y = 1;				// Y scale, set via _scale_y or _scale
	this.depth = 0;					// Z depth (3D depth), set via _depth, 0 represents no depth
	this.opacity = 1.0;				// Opacity (between 0 and 1)
	this.use_parent_opacity = true;	// Scale opacity by parent opacity fi true
	this.current_frame = 0;			// Current bitmap animation frame
	this.prev_frame = 0;			// Previous  bitmap animation frame
	this.frame_speed = 0;			// Bitmap animation playback speed in seconds
	this.anim_frames = null;        // Array of animation frame indices, if not set then frames will be used in order specified in the atlas
	this.frames_repeat = false;		// Tre if bitmap animation should repeat
	this.bitmap = null;				// Bitmap (used if no atlas defined), if set via _bitmap then instance of bitmap or string based path to bitmap can be used
	this.atlas = null;				// Image atlas, if set via _atlas then instance of atlas or string based path to atlas can be used
	this.vr = 0;					// Rotational velocity (when no body attached)
	this.vx = 0;					// X velocity (when no body attached)
	this.vy = 0;					// Y velocity (when no body attached)
	this.vd = 0;					// Depth velocity, rate at which depth changes
	this.vr_damping = 1;			// Rotational damping (when no body attached)
	this.vx_damping = 1;			// X velocity damping (when no body attached)
	this.vy_damping = 1;			// Y velocity damping (when no body attached)
	this.vd_damping = 1;			// Depth velocity damping
	this.ignore_camera = false;		// If set to true them then this actor will not use camera translation
	this.wrap_position = false;		// If true then actor will wrap at extents of scene
	this.dock_x = 0;				// X-axis docking (0 = none, 1 = left, 2 = right)
	this.dock_y = 0;				// Y-axis docking (0 = none, 1 = top, 2 = bottom)
	this.dock_screen = false;		// If true then docking will be to screen edge instead of scene edge
	this.margin = [0,0,0,0];		// Margin to leave around docked actors [left, right, top, bottom]
	this.bubbling = false;			// If true then touch events will be allowed to bubble up to parents
	this.clip_children = false;		// If set to true then child actors will be clipped against extents of this actor
	this.clip_margin = [0,0,0,0];	// Margin to leave around clipping [left, top, right, bottom]
	this.clip_shape = null;         // Shape to clip this actor and / or its children against, if set via _clip_shape then instance of shape or string based path to shape can be used
	this.self_clip = false;		    // If set to true then this actor will be clipped against its own clipping shape
	this.orphaned = false;          // If set to true then this actor will not use its parent actors transform, scene transform will be used instead
	this.virtual = false;           // If true then actor will be classed as a container with a virtual canvas that can scroll and stack its content
	this.stacking = 0;            	// Stacking method to used to stack child actors
	this.clip_virtual = true;		// If true then children with virtual actors will be clipped by rect
	this.shadow = false;            // If set to true then shadow will be added to text
	this.shadow_x = 0;              // Shadow x axis offset
	this.shadow_y = 0;              // Shadow y axis offset
	this.shadow_blur = 0;           // Shadow blur
	this.shadow_colour = "#000000"; // Shadow colour
	this.composite_op = null;       // Composite operation
	this.cache = false;             // If true then resource will be rendered to a cached canvas
	this.cached = false;
	this.merge_cache = false;       // If true then resource will be rendered to parent cached canvas
	this.round_pixels = false;      // If set to true then vertices will be rounded before rendered which can boost performance, but there will be a loss in precision
    this.padding = 0;	            // Amount of pixel padding to add around the actor when caching
	this.scale_method = 0;	        // Method of scaling used to scale this actor to the screen
	this.draw_reverse = false; 		// If set to truechildren are drawn in reverse order
	
	if (virtual === true)
		this.makeVirtual();
};

// Actor scaling methods
b5.Actor.FitNone = 0;
b5.Actor.FitPP = 1;
b5.Actor.FitX = 2;
b5.Actor.FitY = 3;
b5.Actor.FitBest = 4;
b5.Actor.FitAverage = 5;
b5.Actor.FitGreatest = 6;
b5.Actor.FitSmallest = 7;
b5.Actor.FitSize = 8;
b5.Actor.FitBest2 = 9;

/**
 * Actor is not docked
 * @constant
 */
b5.Actor.Dock_None = 0;
/**
 * Actor is docked against top of scene / actor on y-axis
 * @constant
 */
b5.Actor.Dock_Top = 1;
/**
 * Actor is docked against bottom of scene / actor on y-axis
 * @constant
 */
b5.Actor.Dock_Bottom = 2;
/**
 * Actor is docked against middle of scene / actor on y-axis
 * @constant
 */
b5.Actor.Dock_Middle = 3;
/**
 * Actor is docked against left of scene / actor on x-axis
 * @constant
 */
b5.Actor.Dock_Left = 1;
/**
 * Actor is docked against right of scene / actor on x-axis
 * @constant
 */
b5.Actor.Dock_Right = 2;
/**
 * Actor is docked against centre of scene / actor on x-axis
 * @constant
 */
b5.Actor.Dock_Centre = 3;

/**
 * Actor is an image based actor
 * @constant
 */
b5.Actor.Type_Image = 0;
/**
 * Actor is a label based actor
 * @constant
 */
b5.Actor.Type_Label = 1;
/**
 * Actor is a rectangular based actor
 * @constant
 */
b5.Actor.Type_Rect = 2;
/**
 * Actor is an arc based actor
 * @constant
 */
b5.Actor.Type_Arc = 3;
/**
 * Actor is a polygon based actor
 * @constant
 */
b5.Actor.Type_Polygon = 4;
/**
 * Actor is a particle based actor
 * @constant
 */
b5.Actor.Type_Particle = 5;
/**
 * Actor is a tiled map based actor
 * @constant
 */
b5.Actor.Type_Map = 6;

/**
 * Child actors are not stacked
 * @constant
 */
b5.Actor.Stack_None = 0;
/**
 * Child actors are stacked horizontally
 * @constant
 */
b5.Actor.Stack_H = 1;
/**
 * Child actors are stacked vertically
 * @constant
 */
b5.Actor.Stack_V = 2;


//
// Properties
//
Object.defineProperty(b5.Actor.prototype, "_x", {
	get: function() { return this.x; },
	set: function(value) { if (this.x !== value) { this.x = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_y", {
	get: function() { return this.y; },
	set: function(value) { if (this.y !== value) { this.y = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_x2", {
	get: function() { return this.x2; },
	set: function(value) { if (this.x2 !== value) { this.x2 = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_y2", {
	get: function() { return this.y2; },
	set: function(value) { if (this.y2 !== value) { this.y2 = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_ox", {
	get: function() { return this.ox; },
	set: function(value) { if (this.ox !== value) { this.ox = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_oy", {
	get: function() { return this.oy; },
	set: function(value) { if (this.oy !== value) { this.oy = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_rotation", {
	get: function() { return this.rotation; },
	set: function(value) { if (this.rotation !== value) { this.rotation = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_scale_x", {
	get: function() { return this.scale_x; },
	set: function(value) { if (this.scale_x !== value) { this.scale_x = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_scale_y", {
	get: function() { return this.scale_y; },
	set: function(value) { if (this.scale_y !== value) { this.scale_y = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_scale", {
	set: function(value) { this._scale_x = value; this._scale_y = value; this.dirty(); }
});
Object.defineProperty(b5.Actor.prototype, "_depth", {
	get: function() { return this.depth; },
	set: function(value) { if (this.depth !== value) { this.depth = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_layer", {
	get: function() { return this.layer; },
	set: function(value) { if (this.layer !== value) { this.layer = value; if (this.parent !== null) this.parent.order_changed = true; else this.scene.order_changed = true; } }
});
Object.defineProperty(b5.Actor.prototype, "_atlas", {
	get: function() { return this.atlas; },
	set: function(value) { if (this.atlas !== value)
		{
			if (value === null)
			{
				this.atlas = null;
				return;
			}
			this.atlas = b5.Utils.resolveResource(value, "brush");
			if (!this.ignore_atlas_size)
			{
				this.ow = this.atlas.frames[0].w;
				this.oh = this.atlas.frames[0].h;
			}
		}
	}
});
Object.defineProperty(b5.Actor.prototype, "_bitmap", {
	get: function() { return this.bitmap; },
	set: function(value) { if (this.bitmap !== value) { this.atlas = null; this.bitmap = b5.Utils.resolveResource(value, "bitmap"); } }
});
Object.defineProperty(b5.Actor.prototype, "_clip_shape", {
	get: function() { return this.clip_shape; },
	set: function(value) { if (this.clip_shape !== value) { this.clip_shape = b5.Utils.resolveResource(value, "shape"); } }
});
Object.defineProperty(b5.Actor.prototype, "_av", {
	set: function(value)
	{
		if (value !== this.visible && this.onAVChanged !== undefined)
			this.onAVChanged(value);
		this.visible = value; this.active = value;
		this.setBodyActive(this.active);
	}
});

/**
 * Sets the active body state of the actor (applies to all child actors)
 * @param active {boolean} Active state
 */
b5.Actor.prototype.setBodyActive = function(active)
{
	if (this.body !== null)
		this.body.SetActive(active);
	var children = this.actors;
	var count = children.length;
	for (var t = 0; t < count; t++)
	{
		children[t].setBodyActive(active);
	}
};

/**
 * Sets the actors scene position
 * @param x {number} X coordinate
 * @param y {number} Y coordinate
 */
b5.Actor.prototype.setPosition = function(x, y)
{
	if (this.x !== x || this.y !== y)
	{
		this.x = x;
		this.y = y;
		this.dirty();
		if (this.body !== null)
		{
			var b2Vec2 = Box2D.Common.Math.b2Vec2;
			var ws = this.scene.world_scale;
			this.body.SetPosition(new b2Vec2(x / ws, y / ws));
		}
	}
};
b5.Actor.prototype.setPositionPhysics = function(x, y) // Deprecated and will be removed, use setPosition instead
{
	this.setPosition(x, y);
};
/**
 * Sets the size of the actor
 * @param w {number} New width
 * @param h {number} new height
 */
b5.Actor.prototype.setSize = function(w, h)
{
	if (this.w !== w || this.h !== h)
	{
		this.ignore_atlas_size = true;
		this.w = w;
		this.h = h;
		this.dirty();
		if (this.virtual)
		{
			this.layout_dirty = true;
			this.Virtual_updateLayout(true);
		}
	}
};

/**
 * Sets the actors render origin
 * @param x {number} X coordinate
 * @param y {number} Y coordinate
 */
b5.Actor.prototype.setOrigin = function(x, y)
{
	if (this.ox !== x || this.oy !== y)
	{
		this.ox = x;
		this.oy = y;
		this.dirty();
	}
};
/**
 * Sets the actors scale
 * @param x {number} X scale
 * @param y {number} Y scale
 */
b5.Actor.prototype.setScale = function(x, y)
{
	if (this.scale_x !== x || this.scale_y !== y)
	{
		this.scale_x = x;
		this.scale_y = y;
		this.dirty();
	}
};
/**
 * Sets the actors rotation
 * @param angle {number} Angle in radians
 */
b5.Actor.prototype.setRotation = function(angle)
{
	if (this.rotation !== angle)
	{
		this.rotation = angle;
		this.dirty();
		if (this.body !== null)
			this.body.SetAngle(angle);
	}
};
b5.Actor.prototype.setRotationPhysics = function(angle) // Deprecated and will be removed, use setRotation instead
{
	this.setRotation(angle);
};
/**
 * Sets the actors 3D depth
 * @param depth {number} 3D depth, use 0 to disable depth projection
 */
b5.Actor.prototype.setDepth = function(depth)
{
	if (this.depth !== depth)
	{
		this.depth = depth;
		this.dirty();
	}
};

/**
 * Plays the named animation of the attached b5.ImageAtlas brush on this actor
 * @param name {string} Name of animation to play
 * @param repeat {boolean} True if animation should repeat
 */
b5.Actor.prototype.playAnim = function(name, repeat)
{
	if (!this.active)
	{
		this._av = true;
	}
	if (this.atlas !== null)
	{
		var anim = this.atlas.getAnim(name);
		if (anim !== null)
		{
			this.current_frame = 0;
			this.anim_frames = anim.indices;
			this.frame_speed = anim.speed;
			this.frames_repeat = repeat;
			this.dirty();
		}
		else
		{
            if (this.app.debug)
                console.log("Warning: Could not find brush anim '" + name + "' for actor '" + this.name + "'");
		}
	}
};

/**
 * Finds and plays the named timeline animation
 * @param name {string}		 	Name of animation to play
 * @param recurse {boolean} 	If true then will play all timelines in the hierarchy
 * @return {object}				The timeline
 */
b5.Actor.prototype.playTimeline = function(name, recurse)
{
    var timeline = this.timelines.find(name);
    if (timeline !== null)
    {
		if (!this.active)
		{
			this._av = true;
		}
        timeline.restart();
		timeline.update(0);
    }
    if (recurse)
	{
		var children = this.actors;
		var count = children.length;
		for (var t = 0; t < count; t++)
		{
			children[t].playTimeline(name, recurse);
		}
	}
    return timeline;
};

/**
 * Creates and adds a temporary timeline that tweens from the current property value to the target value
 * @param property {string} Property name to animate
 * @param to_value {any} The target value
 * @param duration {number} The time to tween over
 * @param easing {b5.ease} The easing method to use during TweenTo
 * @param wipe {boolean} Set true to wipe out any existing timelines running on the actor
 * @param delay {number} Number of seconds to delay playback
 * @return {object}	The timeline
 */
b5.Actor.prototype.TweenTo = function(property, to_value, duration, easing, wipe, delay)
{
    if (wipe === true)
        this.timelines.remove();
    var timeline = new b5.Timeline(this, property, [this[property], to_value], [0, duration], 1, [easing])
    if (delay !== undefined)
        timeline.setDelay(delay);
	this.timelines.add(timeline);
	return timeline;
};

/**
 * Creates and adds a temporary timeline that tweens from the current property value to the target value
 * @param property {string} Property name to animate
 * @param to_value {any} The target value
 * @param duration {number} The time to tween over
 * @param easing {b5.ease} The easing method to use during TweenTo
 * @param wipe {boolean} Set true to wipe out any existing timelines running on the actor
 * @param delay {number} Number of seconds to delay playback
 * @param on_end {function} Callback that is called when the tween ends
 * @return {object}	The timeline
 */
b5.Actor.prototype.TweenToWithEnd = function(property, to, duration, easing, wipe, delay, on_end)
{
    var timeline = this.TweenTo(property, to, duration, easing, wipe, delay);
    if (on_end != undefined)
		timeline.anims[0].onEnd = on_end;
	return timeline;
};

/**
 * Creates and adds a number of temporary tweens
 * @param tweens {array} Array of tweens
 */
b5.Actor.prototype.TweenToMany = function(tweens)
{
    for (var t = 0; t < tweens.length; t++)
    {
        var tween = tweens[t];
        var wipe = (t === 0) ? tween.wipe : false;
        this.TweenToWithEnd(tween.property, tween.to, tween.duration, tween.easing, wipe, tween.delay, tween.onend);
    }
};

/**
 * Creates and adds a temporary timeline that tweens from the target value to the current property value
 * @param property {string} Property name to animate
 * @param from_value {any} The target value
 * @param duration {number} The time to tween over in seconds
 * @param easing {b5.ease} The easing method to use during TweenTo
 * @param wipe {boolean} Set true to wipe out any existing timelines running on the actor
 */
b5.Actor.prototype.TweenFrom = function(property, from_value, duration, easing, wipe)
{
    if (wipe === true)
        this.timelines.remove();
	this.timelines.add(new b5.Timeline(this, property, [from_value, this[property]], [0, duration], 1, [easing]));
};

/**
 * Creates and adds a task to the actors task list
 * @param task_name {string} Task name
 * @param delay_start {number} The amount o time to wait in seconds before running the task
 * @param repeats {number} The number of times to run the task before destroying itself
 * @param task_function {function} The function call each time the task is executed
 * @param task_data {any} User data to pass to the task function
 */
b5.Actor.prototype.addTask = function(task_name, delay_start, repeats, task_function, task_data)
{
    this.tasks.add(task_name, delay_start, repeats, task_function, task_data);
};

/**
 * Removes the specified task from the task manager
 * @param task_name {string} Task name
 */
b5.Actor.prototype.removeTask = function(task_name)
{
    this.tasks.remove(task_name);
};

/**
 * Releases the actor, calling the actors onDestroy() handler and releases physics, does not remove actor from the scene
 */
b5.Actor.prototype.release = function()
{
	for (var t = 0; t < this.actors.length; t++)
	{
		this.actors[t].release();
	}
	if (this.onDestroy !== undefined)
		this.onDestroy();
	this.releaseJoints();
	this.releaseBody();
};

/**
 * Destroys the actor, removing it from the scene
 */
b5.Actor.prototype.destroy = function()
{
	if (this.parent !== null)
		this.parent.removeActor(this);
	else
	if (this.scene !== null)
		this.scene.removeActor(this);
};

/**
 * Removes the actor from its current parent and places it into a new parent
 * @param parent {b5.Actor|b5.Scene} New parent
 */
b5.Actor.prototype.changeParent = function(parent)
{
	var acts;
	if (this.parent !== null)
		acts = this.parent.actors;
	else
		acts = this.scene.actors;
	var count = acts.length;
	for (var t = 0; t < count; t++)
	{
		if (this === acts[t])
		{
			acts.splice(t, 1);
			parent.addActor(this);
			break;
		}
	}
};


//
// Child actors
//
/**
 * Adds the specified actor to this actors child list, placing the specified actor under control of this actor
 * @param actor {b5.Actor} An actor
 * @return {b5.Actor} The supplied actor
 */
b5.Actor.prototype.addActor = function(actor)
{
	if (this.scene === null)
		this.scene = b5.app.focus_scene;

	this.actors.push(actor);
	actor.parent = this;
	actor.scene = this.scene;
	this.layout_dirty = true;
	return actor;
};

/**
 * Removes the specified actor from this actors child list
 * @param actor {b5.Actor} An actor
 */
b5.Actor.prototype.removeActor = function(actor)
{
	this.removals.push(actor);
	this.layout_dirty = true;
};

/**
 * Removes all actors from this actors child list that match the specified tag
 * @param tag {string} Actor tag
 */
b5.Actor.prototype.removeActorsWithTag = function(tag)
{
	var acts = this.actors;
	var count = acts.length;
	var total = 0;
	var removals = this.removals;
	for (var t = 0; t < count; t++)
	{
		if (acts[t].tag === tag)
		{
			removals.push(acts[t]);
			total++;
		}
	}
	this.layout_dirty = true;
	return total;
};

/**
 * Removes all actors from this actors child list
 */
b5.Actor.prototype.removeAllActors = function()
{
	var acts = this.actors;
	var count = acts.length;
	var removals = this.removals;
	for (var t = 0; t < count; t++)
	{
		removals.push(acts[t]);
	}
	this.layout_dirty = true;
};
/**
 * Cleans up all child actors that were destroyed this frame
 * @private
 */
b5.Actor.prototype.cleanupDestroyedActors = function()
{
	var dcount = this.removals.length;
	if (dcount > 0)
	{
		var removals = this.removals;
		var acts = this.actors;
		var count = acts.length;
		for (var s = 0; s < dcount; s++)
		{
			var dact = removals[s];
			for (var t = 0; t < count; t++)
			{
				if (dact === acts[t])
				{
					dact.release();
					acts.splice(t, 1);
					count--;
					break;
				}
			}
		}
	}
	this.removals = [];
};

/**
 * Searches the actors children to find the named actor
 * @param name {string} Name of actor to find
 * @param recursive {boolean} If true then this actors entire child actor hierarchy will be searched
 * @returns {b5.Actor} The found actor or null if not found
 */
b5.Actor.prototype.findActor = function(name, recursive)
{
	if (recursive === undefined)
		recursive = false;
	var acts = this.actors;
	var count = acts.length;
	for (var t = 0; t < count; t++)
	{
		if (acts[t].name === name)
			return acts[t];
		else if (recursive)
		{
			var act = acts[t].findActor(name, recursive);
			if (act !== null)
				return act;
		}
	}
	return null;
};

/**
 * Searches the actors children to find the actor by its id
 * @param id {number} Id of actor to find
 * @param recursive {boolean} If true then this actors entire child actor hierarchy will be searched
 * @returns {b5.Actor} The found actor or null if not found
 */
b5.Actor.prototype.findActorById = function(id, recursive)
{
	if (recursive === undefined)
		recursive = false;
	var acts = this.actors;
	var count = acts.length;
	for (var t = 0; t < count; t++)
	{
		if (acts[t].id === id)
			return acts[t];
		else if (recursive)
		{
			var act = acts[t].findActorById(id, recursive);
			if (act !== null)
				return act;
		}
	}
	return null;
};

/**
 * Search up the actors parent hierarchy for the first actor parent of this actor
 * @returns {b5.Actor} The found actor or null if not found
 */
b5.Actor.prototype.findFirstParent = function()
{
	var ac = this;
	while (ac !== null)
	{
		if (ac.parent === null)
			return ac;
		ac = ac.parent;
	}
	return null;
};

/**
 * Search up the actors parent hierarchy for the first actor that is cached
 * @returns {b5.Actor} The found actor or null if not found
 */
b5.Actor.prototype.findFirstCachedParent = function()
{
	var ac = this.parent;
	while (ac !== null)
	{
		if (ac.cache_canvas !== null)
			return ac;
		ac = ac.parent;
	}
	return null;
};

/**
 * Updates the transforms of all parents of this actor
 */
b5.Actor.prototype.updateParentTransforms = function()
{
	var parents = [];
	var ac = this;
	while (ac !== null)
	{
		parents.push(ac);
		ac = ac.parent;
	}

	for (var t = parents.length - 1; t >= 0; t--)
		parents[t].updateTransform();
};

/**
 * Get the actors slot index in the parents child list
 */
b5.Actor.prototype.getSlot = function()
{
	var acts;
	if (this.parent !== null)
		acts = this.parent.actors;
	else
		acts = this.scene.actors;
	var count = acts.length;
	for (var t = 0; t < count; t++)
	{
		if (acts[t] === this)
		{
			return t;
		}
	}
};

/**
 * Moves the actor to a specific slot in the parents child list from its old slot, pushing others down
 */
b5.Actor.prototype.moveToSlot = function(new_slot)
{
	var acts;
	if (this.parent !== null)
		acts = this.parent.actors;
	else
		acts = this.scene.actors;
	var old_slot = this.getSlot();
	if (old_slot === new_slot)
		return;
	acts.splice(new_slot, 0, this);
	if (new_slot < old_slot)
		old_slot++;
	acts.splice(old_slot, 1);
};

/**
 * Moves the actor to the end of its parents child list, effectively rendering it on top of all other actors that have the same depth
 */
b5.Actor.prototype.bringToFront = function()
{
	var acts;
	if (this.parent !== null)
		acts = this.parent.actors;
	else
		acts = this.scene.actors;
	var count = acts.length;
	var i = -1;
	for (var t = 0; t < count; t++)
	{
		if (acts[t] === this)
		{
			i = t;
			break;
		}
	}
	if (i >= 0)
	{
		acts.splice(i, 1);
		acts.push(this);
	}
};

/**
 * Moves the actor to the start of its parents child list, effectively rendering behind all other actors that have the same depth
 */
b5.Actor.prototype.sendToBack = function()
{
	var acts;
	if (this.parent !== null)
		acts = this.parent.actors;
	else
		acts = this.scene.actors;
	var count = acts.length;
	var i = -1;
	for (var t = 0; t < count; t++)
	{
		if (acts[t] === this)
		{
			i = t;
			break;
		}
	}
	if (i >= 0)
	{
		acts.splice(i, 1);
		acts.unshift(this);
	}
};

//
// Touch events
//
/**
 * Called by the main app object when the user begins to touch this actor, provided that this actor is marked as touchable
 * Calls a user supplied onBeginTouch() method if one is supplied
 * @param touch_pos {object} x,y position of touch
 */
b5.Actor.prototype.onBeginTouchBase = function(touch_pos)
{
	this.touching = true;
	// Bubble event to parent if enabled
	if (this.bubbling && this.parent !== null)
		this.parent.onBeginTouchBase(touch_pos);
	if (this.onBeginTouch !== undefined)
		this.onBeginTouch(touch_pos);
};

/**
 * Called by the main app object when the user stops touching this actor, provided that this actor is marked as touchable
 * Calls a user supplied onEndTouch() method if one is supplied
 * @param touch_pos {object} x,y position of touch
 */
b5.Actor.prototype.onEndTouchBase = function(touch_pos)
{
	if (this.touching && this.onTapped !== undefined)
	{
		this.onTapped(touch_pos);
		if (this.onDblTapped !== undefined)
		{
			if (this.touch_et === null)
			{
				this.touch_et = Date.now();
			}
			else
			{
				var now = Date.now();
				var dt = now - this.touch_et;
				if (dt < 500)
					this.onDblTapped(touch_pos);
				this.touch_et = now;
			}
		}
	}
	this.touching = false;
	this.touchmove = false;
	// Bubble event to parent if enabled
	if (this.bubbling && this.parent !== null)
		this.parent.onEndTouchBase(touch_pos);
	if (this.onEndTouch !== undefined)
		this.onEndTouch(touch_pos);
};

/**
 * Called by the main app object when the user moves their finger or mouse whilst touching this actor, provided that this actor is marked as touchable
 * Calls a user supplied onEndTouch() method if one is supplied
 * @param touch_pos {object} x,y position of touch
 */
b5.Actor.prototype.onMoveTouchBase = function(touch_pos)
{
	if (this.touching)
		this.touchmove = true;
	// Bubble event to parent if enabled
	if (this.bubbling && this.parent !== null)
		this.parent.onMoveTouchBase(touch_pos);
	if (this.virtual)
		this.Virtual_onMoveTouch(touch_pos);
	if (this.onMoveTouch !== undefined)
		this.onMoveTouch(touch_pos);
};

//
// Physics
//
/**
 * Releases this actors physics body destroying the body, taking control of the actor from the Box2D physics system
 */
b5.Actor.prototype.releaseBody = function()
{
	if (this.body !== null)
	{
		this.scene.world.DestroyBody(this.body);
		this.body = null;
	}
};

/**
 * Releases all joints that this actor created, destroying the joints
 */
b5.Actor.prototype.releaseJoints = function()
{
	if (this.body !== null)
	{
		for (var t = 0; t < this.joints.length; t++)
			this.scene.world.DestroyJoint(this.joints[t]);
		this.joints = null;
	}
};

/**
 * Creates and attached a physics body 5to this actor, placing this actor under control of the Box2D physics system
 * @param body_type {string} Type of body, can be static, dynamic or kinematic.
 * @param fixed_rotation {boolean} If set to true then the physics body will be prevented from rotating
 * @param is_bullet {boolean} If set to true then the physics body will be marked as a bullet which can be useful for very fast moving objects
 * @returns {object} The created body
 */
b5.Actor.prototype.initBody = function(body_type, fixed_rotation, is_bullet)
{
	if (!this.scene.app.box2d)
		return null;
	var scene = this.scene;
	var body_def = new Box2D.Dynamics.b2BodyDef;
	var ws = scene.world_scale;
	if (body_type === "static")
		body_def.type = Box2D.Dynamics.b2Body.b2_staticBody;
	else
	if (body_type === "kinematic")
		body_def.type = Box2D.Dynamics.b2Body.b2_kinematicBody;
	else
		body_def.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
	body_def.position.Set(this.x / ws, this.y / ws);
	body_def.angle = this.rotation;
	body_def.fixedRotation = fixed_rotation;
	body_def.bullet = is_bullet;
	this.body = scene.world.CreateBody(body_def);
	this.body.SetUserData(this);
    return this.body;
};

/**
 * Adds a new fixture to this actors physics body
 * @param options {object} An object describing the fixtures properties:
 * - type {number} – Type of fixture (Shape.TypeBox, Shape.TypeCircle or Shape.TypePolygon)
 * - density {number} – Fixture density
 * - friction {number} – Fixture friction
 * - restitution {number} – Fixture restitution
 * - is_sensor {boolean} – true if this fixture is a sensor
 * - width {number} – Width and height of box (if type is box)
 * - height {number} – Width and height of box (if type is box)
 * - radius {number} – Radius of shape (if type is circle)
 * - material {b5.Material} – A Material resource, if passed then density, friction, restitution will be taken from the material resource
 * - shape {b5.Shape} – A Shape resource, if passed then width, height, type and vertices will be taken from the shape resource
 * @returns {object} The created fixture or in the case of a multi-fixture shape an array of fixtures
 */
b5.Actor.prototype.addFixture = function(options)
{
	if (this.body === null)
		return null;
	var fix_def;
	var shape = options;
	var material = options;
	if (options.shape !== undefined)
		shape = options.shape;
	if (options.material !== undefined)
		material = options.material;
	var ws = this.scene.world_scale;
	var sx = this.scale_x;
	var sy = this.scale_y;
	var b2Vec2 = Box2D.Common.Math.b2Vec2;

	if (shape.type === b5.Shape.TypeBox)
	{
		fix_def = new Box2D.Dynamics.b2FixtureDef;
		fix_def.shape = new Box2D.Collision.Shapes.b2PolygonShape;
		var w = shape.width / (2 * ws) * sx;
		var h = shape.height / (2 * ws) * sy;
		fix_def.shape.SetAsOrientedBox(w, h, new b2Vec2(shape.width / ws * this.ox, shape.height / ws * this.oy), 0);
	}
	else if (shape.type === b5.Shape.TypeCircle)
	{
		fix_def = new Box2D.Dynamics.b2FixtureDef;
		fix_def.shape = new Box2D.Collision.Shapes.b2CircleShape(shape.width / ws * sx);
	}
	else if (shape.type === b5.Shape.TypePolygon)
	{
		if (shape.convexVertices !== undefined && shape.convexVertices.length > 0)
		{
			var fixture_defs = [];
			var pc = shape.convexVertices.length;
			for (var s = 0; s < pc; s++)
			{
				fix_def = new Box2D.Dynamics.b2FixtureDef;
				fix_def.shape = new Box2D.Collision.Shapes.b2PolygonShape();

				var points = shape.convexVertices[s];
				var verts = [];
				var count = points.length;
				for (var t = 0; t < count; t += 2)
					verts.push({x: points[t] / ws * sx, y: points[t + 1] / ws * sy});
				fix_def.shape.SetAsArray(verts, verts.length);

				if (material.density !== undefined)
					fix_def.density = material.density;
				if (material.friction !== undefined)
					fix_def.friction = material.friction;
				if (material.restitution !== undefined)
					fix_def.restitution = material.restitution;
				if (options.is_sensor !== undefined)
					fix_def.isSensor = options.is_sensor;
				if (options.collision_category !== undefined)
					fix_def.filter.categoryBits = options.collision_category;
				if (options.collision_mask !== undefined)
					fix_def.filter.maskBits = options.collision_mask;
				if (options.collision_group !== undefined)
					fix_def.filter.groupIndex = options.collision_group;
				fixture_defs.push(this.body.CreateFixture(fix_def));
			}
			return fixture_defs;
		}
		else
		{
			fix_def = new Box2D.Dynamics.b2FixtureDef;
			fix_def.shape = new Box2D.Collision.Shapes.b2PolygonShape();

			var points = shape.vertices;
			var verts = [];
			var count = points.length;
			for (var t = 0; t < count; t += 2)
				verts.push({x: points[t] / ws * sx, y: points[t + 1] / ws * sy});

			fix_def.shape.SetAsArray(verts, verts.length);
		}
	}
	if (material.density !== undefined)
		fix_def.density = material.density;
	if (material.friction !== undefined)
		fix_def.friction = material.friction;
	if (material.restitution !== undefined)
		fix_def.restitution = material.restitution;
	if (material.is_sensor !== undefined)
		fix_def.isSensor = material.is_sensor;
	if (options.collision_category !== undefined)
		fix_def.filter.categoryBits = options.collision_category;
	if (options.collision_mask !== undefined)
		fix_def.filter.maskBits = options.collision_mask;
	if (options.collision_group !== undefined)
		fix_def.filter.groupIndex = options.collision_group;
	return this.body.CreateFixture(fix_def);
};

/**
 * Adds a new joint to this actor
 * @param options {object} An object describing the joints properties:
 * - type {string} – Type of joint to create (weld, distance, revolute, prismatic, pulley, wheel, mouse)
 * - actor_b ({@link b5.Actor}) – The other actor that this joint attaches to
 * - anchor_a {object} - The joints x, y anchor point on this body
 * - anchor_b {object} - The joints x, y anchor point on actor_b’s body
 * - self_collide {boolean} – If set to true then actors that are connected via the joint will collide with each other
 * - frequency {number} – Oscillation frequency in Hertz (distance joint)
 * - damping {number} – Oscillation damping ratio (distance and wheel joints)
 * - limit_joint {boolean} – If true then joint limits will be applied (revolute, prismatic, wheel joints)
 * - lower_limit {number} – Lower limit of joint (revolute, prismatic, wheel joints)
 * - upper_limit {number} – Upper limit of joint (revolute, prismatic, wheel joints)
 * - motor_enabled {boolean} – If true then the joints motor will be enabled (revolute, prismatic, wheel joints)
 * - motor_speed {number} – Motor speed (revolute, prismatic, wheel joints)
 * - max_motor_torque {number} – Motors maximum torque (revolute joints)
 * - max_motor_force {number} – Motors maximum force (prismatic, wheel, mouse joints)
 * - axis {object} – Movement x, y axis (prismatic, wheel joints)
 * - ground_a {object} – Ground x, y offset for this actor (pulley joints)
 * - ground_b {object} – Ground x, y offset for actor_b (pulley joints)
 * @returns {object} The created joint
 */
b5.Actor.prototype.addJoint = function(options)
{
	if (this.body === null)
		return null;
	var joint_def;
	var scene = this.scene;
	var world = scene.world;
	var ws = scene.world_scale;
	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	var body_a = this.body;
	var body_b = options.actor_b.body;
	var body_a_centre = body_a.GetWorldCenter();
	var body_b_centre = body_b.GetWorldCenter();
	var lpa = new b2Vec2(body_a_centre.x, body_a_centre.y);
	lpa.x += options.anchor_a.x / ws;
	lpa.y += options.anchor_a.y / ws;
	var lpb = new b2Vec2(body_b_centre.x, body_b_centre.y);
	lpb.x += options.anchor_b.x / ws;
	lpb.y += options.anchor_b.y / ws;
	if (options.type === "weld")
	{
		joint_def = new Box2D.Dynamics.Joints.b2WeldJointDef;
		joint_def.Initialize(body_a, body_b, lpa);
//		joint_def.referenceAngle = options.actor_b.body.GetAngle() - this.body.GetAngle();
		joint_def.collideConnected = options.self_collide;
	}
	else if (options.type === "distance")
	{
		joint_def = new Box2D.Dynamics.Joints.b2DistanceJointDef;
		joint_def.Initialize(body_a, body_b, lpa, lpb);
//		joint_def.referenceAngle = options.actor_b.body.GetAngle() - this.body.GetAngle();
		joint_def.collideConnected = options.self_collide;
		joint_def.frequencyHz = options.frequency;
		joint_def.dampingRatio = options.damping;
	}
	else if (options.type === "revolute")
	{
		joint_def = new Box2D.Dynamics.Joints.b2RevoluteJointDef;
		joint_def.Initialize(body_a, body_b, lpa);
//		joint_def.referenceAngle = options.actor_b.body.GetAngle() - this.body.GetAngle();
		joint_def.collideConnected = options.self_collide;

		if (options.limit_joint)
		{
			joint_def.enableLimit = true;
			joint_def.lowerAngle = options.lower_limit * (Math.PI / 180);
			joint_def.upperAngle = options.upper_limit * (Math.PI / 180);
		}
		if (options.motor_enabled)
		{
			joint_def.enableMotor = true;
			joint_def.motorSpeed = options.motor_speed;
			joint_def.maxMotorTorque = options.max_motor_torque;
		}
	}
	else if (options.type === "prismatic")
	{
		joint_def = new Box2D.Dynamics.Joints.b2PrismaticJointDef;
		joint_def.Initialize(body_a, body_b, lpa, new b2Vec2(options.axis.x, options.axis.y));
//		joint_def.referenceAngle = options.actor_b.body.GetAngle() - this.body.GetAngle();
		joint_def.collideConnected = options.self_collide;

		if (options.limit_joint)
		{
			joint_def.enableLimit = true;
			joint_def.lowerTranslation = options.lower_limit / ws;
			joint_def.upperTranslation = options.upper_limit / ws;
		}
		if (options.motor_enabled)
		{
			joint_def.enableMotor = true;
			joint_def.motorSpeed = options.motor_speed;
			joint_def.maxMotorForce = options.max_motor_force;
		}
	}
	else if (options.type === "pulley")
	{
		var ga = new b2Vec2(body_a_centre.x, body_a_centre.y);
		ga.x += options.ground_a.x / ws;
		ga.y += options.ground_a.y / ws;
		var gb = new b2Vec2(body_b_centre.x, body_b_centre.y);
		gb.x += options.ground_b.x / ws;
		gb.y += options.ground_b.y / ws;
		joint_def = new Box2D.Dynamics.Joints.b2PulleyJointDef;
		joint_def.Initialize(body_a, body_b, ga, gb, lpa, lpb, options.ratio);
		joint_def.collideConnected = options.self_collide;
	}
	else if (options.type === "wheel")
	{
		joint_def = new Box2D.Dynamics.Joints.b2LineJointDef;
		joint_def.Initialize(body_a, body_b, lpa, options.axis);
		joint_def.collideConnected = options.self_collide;

		if (options.limit_joint)
		{
			joint_def.enableLimit = true;
			joint_def.lowerTranslation = options.lower_limit / ws;
			joint_def.upperTranslation = options.upper_limit / ws;
		}
		if (options.motor_enabled)
		{
			joint_def.enableMotor = true;
			joint_def.motorSpeed = options.motor_speed;
			joint_def.maxMotorForce  = options.max_motor_force;
		}
	}
	else if (options.type === "mouse")
	{
		joint_def = new Box2D.Dynamics.Joints.b2MouseJointDef;
		joint_def.collideConnected = options.self_collide;
		joint_def.bodyA = body_a;
		joint_def.bodyB = body_b;
		joint_def.collideConnected = options.self_collide;
		joint_def.maxForce = options.max_motor_force;
		joint_def.dampingRatio = options.damping;
	}

	var joint = world.CreateJoint(joint_def);
	this.joints.push(joint);
	return joint;
};

/**
 * Removes and destroys the specified joint
 * @param joint {object} The joint to remove
 */
b5.Actor.prototype.removeJoint = function(joint)
{
	var joints = this.joints;
	var count = joints.length;
	for (var t = 0; t < count; t++)
	{
		if (joints[t] === joint)
		{
			world.DestroyJoint(joint);
			joints.splice(t, 1);
			return;
		}
	}
};

/**
 * Calculate how much to scale the x and y scaling factors to make the object fit to the required scaling method
 * @returns joint {object} x and y scaling factor
 */
b5.Actor.prototype.getScaleFromMethod = function(method)
{
	var app = b5.app;
	var sx = app.global_scale;
	var sy = app.global_scale;
	if (!app.disable_dock_screen)
	{
		var sm = method;
		if (sm !== b5.Actor.FitNone)
		{
			var cs = 1 / app.canvas_scale;
			var dsx = (app.inner_width / app.design_width) * cs;
			var dsy = (app.inner_height / app.design_height) * cs;
			if (sm === b5.Actor.FitBest)
			{
				if (dsx > dsy) { sx *= dsx; sy *= dsx; }
				else { sx *= dsy; sy *= dsy; }
			}
			else if (sm === b5.Actor.FitBest2)
			{
				if (dsx < dsy) { sx *= dsx; sy *= dsx; }
				else { sx *= dsy; sy *= dsy; }
			}
			else if (sm === b5.Actor.FitX)
			{
				sx *= dsx;
				sy *= dsx;
			}
			else if (sm === b5.Actor.FitY)
			{
				sx *= dsy;
				sy *= dsy;
			}
			else if (sm === b5.Actor.FitAverage)
			{
				var ds = (dsx + dsy) * 0.5;
				sx *= ds;
				sy *= ds;
			}
			else if (sm === b5.Actor.FitGreatest)
			{
				var ds;
				if (app.inner_width > app.inner_height)
					ds = dsx;
				else
					ds = dsy;
				sx *= ds;
				sy *= ds;
			}
			else if (sm === b5.Actor.FitSmallest)
			{
				var ds;
				if (app.inner_width < app.inner_height)
					ds = dsx;
				else
					ds = dsy;
				sx *= ds;
				sy *= ds;
			}
			else if (sm === b5.Actor.FitSize)
			{
				sx *= dsx;
				sy *= dsy;
			}
			else
			if (sm === b5.Actor.FitPP)
			{
				sx *= cs;
				sy *= cs;
			}
		}
	}
	return { x: sx, y: sy };
};

//
// Transform update
//
/**
 * Checks if this actors visual transform is dirty and if so rebuilds the transform and mark the transform as clean
 */
b5.Actor.prototype.updateTransform = function()
{
	if (this.transform_dirty)
	{
		var trans = this.transform;
		var scene = this.scene;
		var r = this.rotation;
		var sx = this.scale_x;
		var sy = this.scale_y;
		var x = this.x + this.x2;
		var y = this.y + this.y2;
		if (this.parent === null)
		{
			sx *= scene.scale;
			sy *= scene.scale;
		}
		var sm = this.scale_method;
		if (sm !== 0)
		{
			var s = this.getScaleFromMethod(sm);
			sx *= s.x;
			sy *= s.y;
		}
		
		var parent = this.parent;
		if (parent === null || this.orphaned)
		{
			this.accum_scale_x = sx;
			this.accum_scale_y = sy;
		}
		else
		{
			this.accum_scale_x = sx * parent.accum_scale_x;
			this.accum_scale_y = sy * parent.accum_scale_y;
		}
		var cos = Math.cos(r);
		var sin = Math.sin(r);
		if (this.depth !== 0 && this.depth !== 1)
		{
			var ooa = 1 / this.depth;
			sx *= ooa;
			sy *= ooa;
			trans[4] = (x - scene.camera_x) * ooa;
			trans[5] = (y - scene.camera_y) * ooa;
		}
		else
		{
			this.transform_dirty = false;
			trans[4] = x;
			trans[5] = y;
		}
		trans[0] = cos * sx;
		trans[1] = sin * sx;
		trans[2] = -sin * sy;
		trans[3] = cos * sy;
		var src = null;
		var atlas = this.atlas;
		if (atlas !== null)
		{
			if (this.anim_frames !== null)
				src = atlas.getFrame(this.anim_frames[this.current_frame | 0]);
			else
				src = atlas.getFrame(this.current_frame | 0);
		}
		// Apply origin
		var ox = this.ox;
		var oy = this.oy;
		if (ox !== 0 || oy !== 0 || src !== null)
		{
			if (!this.absolute_origin)
			{
				ox *= this.ow;
				oy *= this.oh;
			}
			// Apply frame offset
			if (src !== null)
			{
				ox -= src.ox;
				oy -= src.oy;
			}
			trans[4] += ((ox * trans[0]) + (oy * trans[2]));
			trans[5] += ((ox * trans[1]) + (oy * trans[3]));
		}
//		[0][2][4]		[0][2][4]
//		[1][3][5]		[1][3][5]
//		[x][x][1]		[x][x][1]
		if (parent !== null && !this.orphaned)
		{
			b5.Maths.mulMatrix(trans, parent.transform);
		}
	}

};

//
// Rendering
//
/**
 * Renders this actors children
 */
b5.Actor.prototype.drawChildren = function(post)
{
	var count = this.actors.length;
	var drawn = 0;
	if (count > 0)
	{
		var acts = this.actors;
		if (this.draw_reverse)
		{
			for (var t = count - 1; t >= 0; t--)
			{
				var layer = acts[t].layer;
				if (post)
				{
					if (layer >= 0)
					{
						acts[t].draw();
						drawn++;
					}
				}
				else
				{
					if (layer < 0)
					{
						acts[t].draw();
						drawn++;
					}
				}
			}
		}
		else
		{
			for (var t = 0; t < count; t++)
			{
				var layer = acts[t].layer;
				if (post)
				{
					if (layer >= 0)
					{
						acts[t].draw();
						drawn++;
					}
				}
				else
				{
					if (layer < 0)
					{
						acts[t].draw();
						drawn++;
					}
				}
			}
		}
	}
	return drawn === count;
};

/**
 * Renders this actor and all of its children, called by the base app render loop. You can derive your own actor types from Actor and implement draw() to provide your own custom rendering
 */
b5.Actor.prototype.draw = function()
{
	if (!this.visible)
		return;

	if (this.cache)
	{
		this.drawToCache();
		this.cache = false;
	}
	if (this.merge_cache)   // If merged into parent cache then parent will have drawn so no need to draw again
	{
		this.drawChildren(false);
		this.drawChildren(true);
		return;
	}

	var cache = this.cache_canvas;
	var scene = this.scene;
	var app = scene.app;
	var dscale = app.canvas_scale;
	var disp = app.display;
	var ps = b5.app.pixel_ratio;
	if (cache === null)
		ps = 1;

	// Get source image coordinates from the atlas
	var src = null;
	if (cache === null)
	{
		var atlas = this.atlas;
		if (atlas !== null)
		{
			if (this.anim_frames !== null)
				src = atlas.getFrame(this.anim_frames[this.current_frame | 0]);
			else
				src = atlas.getFrame(this.current_frame | 0);
			if (!this.ignore_atlas_size)
			{
				this.w = src.w;
				this.h = src.h;
			}
			if ((this.prev_frame | 0) !== (this.current_frame | 0))
				this.dirty();
			this.prev_frame = this.current_frame;
		}
	}
	var mx = app.canvas_cx + scene.x * dscale / ps;
	var my = app.canvas_cy + scene.y * dscale / ps;
	if (this.ow === undefined)
	{
		this.ow = this.w;
		this.oh = this.h;
	}
	var cx = this.ow / 2;
	var cy = this.oh / 2;

	if (!this.ignore_camera && (this.depth === 0 || this.depth === 1))
	{
		mx -= scene.camera_x * dscale;
		my -= scene.camera_y * dscale;
	}

	this.updateTransform();
	// Draw child actors
	var drawn_all = this.drawChildren(false);

	this.preDraw();
	var self_clip = this.self_clip;
	var clip_children = this.clip_children;
	var trans = this.transform;
	var tx = trans[4] * dscale + mx;
	var ty = trans[5] * dscale + my;

	if (this.round_pixels)
	{
		cx = (cx + 0.5) | 0;
		cy = (cy + 0.5) | 0;
		tx = (tx + 0.5) | 0;
		ty = (ty + 0.5) | 0;
	}
	disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, tx, ty);

	if (self_clip)
		this.setClipping(0,0);

	if (cache === null)
	{
		if (atlas !== null)
			disp.drawAtlasImage(atlas.bitmap.image, src.x, src.y, src.w, src.h, -cx, -cy, this.w + 1, this.h + 1);	// +1 closes small gaps
		else
		if (this.bitmap !== null)
			disp.drawImage(this.bitmap.image, -cx, -cy, this.w, this.h);
	}
	else
		disp.drawImage(cache, -cache.width >> 1, -cache.height >> 1);
	this.postDraw();

	if (clip_children)
	{
		if (!self_clip)
			this.setClipping(-cx, -cy);
	}
	else
	if (self_clip)
		disp.restoreContext();

	// Draw child actors
	if (!drawn_all)
		this.drawChildren(true);
	if (clip_children)
		disp.restoreContext();
};

/**
 * Enables caching on an actor
 */
b5.Actor.prototype.enableCache = function(merge)
{
	this.cache = true;
	this.cached = true;
	this.merge_cache = merge;
};

/**
 * Reset cache state of actor and all children
 */
b5.Actor.prototype.resetCache = function()
{
	if (!this.cached)
		return;
	this.cache = true;
	var count = this.actors.length;
	if (count > 0)
	{
		var acts = this.actors;
		for (var t = 0; t < count; t++)
			acts[t].resetCache();
	}
};

/**
 * Renders this actor to a cache which can speed up rendering it the next frame
 */
/*b5.Actor.prototype.drawToCache = function()
{
	var disp = b5.app.display;
	var cache = null;
	var ox = 0;
	var oy = 0;
	if (this.merge_cache)
	{
		var parent = this.findFirstCachedParent();
		if (parent !== null)
		{
			cache = parent.cache_canvas;
			ox = this.x + cache.width / 2 - this.w/2;
			oy = this.y + cache.height / 2 - this.h/2;
		}
	}

	// Get source image coordinates from the atlas
	var src = null;
	var atlas = this.atlas;
	if (atlas !== null)
	{
		if (this.anim_frames !== null)
			src = atlas.getFrame(this.anim_frames[this.current_frame << 0]);
		else
			src = atlas.getFrame(this.current_frame << 0);
	}

	if (cache === null)
	{
		cache = disp.createCache();
		cache.width = this.w;
		cache.height = this.h;
	}
	disp.setCache(cache);

	if (this.self_clip)
	{
		this.setClipping(ox + this.ow / 2, oy + this.oh / 2);
	}

	this.preDrawCached();
	
	if (atlas !== null)
		disp.drawAtlasImage(atlas.bitmap.image, src.x, src.y, src.w, src.h, ox, oy, this.w, this.h);
	else
	if (this.bitmap !== null)
		disp.drawImage(this.bitmap.image, ox, oy, this.w, this.h);

	this.postDrawCached();
	if (this.self_clip)
		disp.restoreContext();

	disp.setCache(null);

	this.cache_canvas = cache;
};*/
b5.Actor.prototype.drawToCache = function()
{
	var disp = b5.app.display;
	var cache = null;
	var parent = null;
	if (this.merge_cache)
	{
		var parent = this.findFirstCachedParent();
		if (parent !== null)
		{
			cache = parent.cache_canvas;
		}
	}

	// Get source image coordinates from the atlas
	var src = null;
	var atlas = this.atlas;
	if (atlas !== null)
	{
		if (this.anim_frames !== null)
			src = atlas.getFrame(this.anim_frames[this.current_frame << 0]);
		else
			src = atlas.getFrame(this.current_frame << 0);
	}

	var ps = b5.app.pixel_ratio;
	if (cache === null)
	{
        cache = disp.createCache();
        cache.width = (this.ow * ps) | 0;
        cache.height = (this.oh * ps) | 0;
	}
	disp.setCache(cache);

	var cx = this.ow / 2;
	var cy = this.oh / 2;
	var scene = this.scene;
	var trans = [];
	var r = this.rotation;
	var cos = Math.cos(r);
	var sin = Math.sin(r);
	var dscale = 1 / ps;
	var sx = this.scale_x;
	var sy = this.scale_y;
	trans[0] = cos * sx;
	trans[1] = sin * sx;
	trans[2] = -sin * sy;
	trans[3] = cos * sy;
	trans[4] = this.x + cache.width / 2 - this.ox * this.ow;
	trans[5] = this.y + cache.height / 2 - this.oy * this.oh;
	var pre_mat = [1, 0, 0, 1, this.ox * this.ow, this.oy * this.oh];
	b5.Maths.preMulMatrix(trans, pre_mat);

	if (this.self_clip)
	{
		disp.setTransform(1,0,0,1, 0,0);
		this.setClipping(trans[4], trans[5]);
	}

	this.preDrawCached();
	

	disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, trans[4], trans[5]);
	
	if (atlas !== null)
		disp.drawAtlasImage(atlas.bitmap.image, src.x, src.y, src.w, src.h, -cx, -cy, this.w, this.h);
	else
	if (this.bitmap !== null)
		disp.drawImage(this.bitmap.image, -cx, -cy, this.w, this.h);
	this.postDrawCached();
	if (this.self_clip)
		disp.restoreContext();

	disp.setCache(null);

	if (this.cached && !this.merge_cache)
		this.cache_canvas = cache;
};

/**
 * Called before rendering the actor to perform various pre-draw activities such as setting opacity, shadows and composite operations
 */
b5.Actor.prototype.preDraw = function()
{
	var disp = b5.app.display;
	if (this.parent === null || !this.use_parent_opacity)
		this.accum_opacity = this.opacity * this.scene.opacity;
	else
		this.accum_opacity = this.parent.accum_opacity * this.opacity;
	if (this.type === b5.Actor.Type_Image)
		disp.setGlobalAlpha(this.accum_opacity);
	else
		disp.setGlobalAlpha(1);
	
	if (this.shadow)
		disp.setShadow(this.shadow_x, this.shadow_y, this.shadow_colour, this.shadow_blur);
	if (this.composite_op !== null)
		disp.setGlobalCompositeOp(this.composite_op);
};

/**
 * Called after rendering the actor to perform various post-draw activities such as disabling shadows and resetting composite operations
 */
b5.Actor.prototype.postDraw = function()
{
	var disp = b5.app.display;
	if (this.shadow) disp.setShadowOff();
	if (this.composite_op !== null)
		disp.setGlobalCompositeOp("source-over");
};

/**
 * Called before rendering the cached actor to perform various pre-draw activities such as setting opacity, shadows and composite operations
 */
b5.Actor.prototype.preDrawCached = function()
{
	var disp = b5.app.display;
	if (this.shadow)
		disp.setShadow(this.shadow_x, this.shadow_y, this.shadow_colour, this.shadow_blur);
	if (this.composite_op !== null)
		disp.setGlobalCompositeOp(this.composite_op);
};

/**
 * Called after rendering the cached actor to perform various post-draw activities such as disabling shadows and resetting composite operations
 */
b5.Actor.prototype.postDrawCached = function()
{
	var disp = b5.app.display;
	if (this.shadow) disp.setShadowOff();
	if (this.composite_op !== null)
		disp.setGlobalCompositeOp("source-over");
};

//
// Update
//
/**
 * Main base actor update method that is called by the main app object each logic loop. Performs many actions including:
 * - Calling onTick() callback
 * - Updating local timelines manager
 * - Updating local actions manager
 * - Updating local tasks manager
 * - Providing virtual canvas functionality
 * - Updating bitmap animation
 * - Updating position / rotation from physics or updating arcade physics
 * - Scene edge wrapping
 * - Applying docking
 * - Updating child hierarchy
 * - Cleaning up destroyed child actors
 * - Sorting child actor layers
 * @param dt {number} Time that has passed since this actor was last updated in seconds
 */
b5.Actor.prototype.baseUpdate = function(dt)
{
	if (!this.active)
		return;
	
	if (this.onTick !== undefined)
		this.onTick(dt);

	this.timelines.update(dt);
	if (this.actions !== undefined)
		this.actions.execute();
	this.tasks.execute();

	if (this.virtual)
		this.Virtual_update(dt);

	var scene = this.scene;

	// Update the frame
	if (this.atlas !== null)
	{
		this.current_frame += this.frame_speed * dt;
		var max;
		if (this.anim_frames !== null)
			max = this.anim_frames.length;
		else
			max = this.atlas.getMaxFrames();
		if (this.frames_repeat)
		{
			if (this.current_frame < 0)
			{
				while (this.current_frame < 0)
					this.current_frame += max;
			}
			else
			{
				while (this.current_frame >= max)
					this.current_frame -= max;
			}
		}
		else
		{
			if (this.current_frame >= max)
			{
				if (this.onAnimEnd !== undefined)
					this.onAnimEnd();
				this.current_frame = max - 1;
			}
			else
			if (this.current_frame < 0)
			{
				if (this.onAnimEnd !== undefined)
					this.onAnimEnd();
				this.current_frame = 0;
			}
		}
	}
	var x = this.x;
	var y = this.y;
	// Update from physics
	var body = this.body;
	if (body !== null)
	{
		var pos = body.GetPosition();
		var ws = scene.world_scale;
		this.setRotation(body.GetAngle());
		this.setPosition(pos.x * ws, pos.y * ws);
	}
	else
	{
		// Apply velocities
		this.rotation += this.vr * dt;
		this.vr *= this.vr_damping;
		this.x += this.vx * dt;
		this.vx *= this.vx_damping;
		this.y += this.vy * dt;
		this.vy *= this.vy_damping;
	}
	if (this.vd !== 0)
	{
		this.depth += this.vd * dt;
		this.vd *= this.vd_damping;
	}

	if (this.wrap_position)
	{
		// Wrap position with extents of scene
		var left = scene.extents[0];
		var right = (left + scene.extents[2]);
		var top = scene.extents[1];
		var bottom = (top + scene.extents[3]);
		if (this.x < left)
			this.x = right;
		else if (this.x > right)
			this.x = left;
		if (this.y < top)
			this.y = bottom;
		else if (this.y > bottom)
			this.y = top;
	}

	// Apply docking
	if (this.parent === null || !this.parent.virtual)
	{
		if (this.dock_screen && !b5.app.disable_dock_screen)
		{
			var sm = this.scale_method;
			var sx = 1;
			var sy = 1;
			if (sm !== 0)
			{
				var s = this.getScaleFromMethod(sm);
				sx = s.x;
				sy = s.y;
			}
			if (this.dock_x !== 0)
			{
				var s = this.getScaleFromMethod(2);
				if (this.dock_x === b5.Actor.Dock_Left)
					this.x = -scene.w * s.x / 2 + (((this.w + this.margin[0] * 2) * this.scale_x * sx) / 2);
				else if (this.dock_x === b5.Actor.Dock_Right)
					this.x = scene.w * s.x / 2 - (((this.w + this.margin[1] * 2) * this.scale_x * sx) / 2);
				else if (this.dock_x === b5.Actor.Dock_Centre)
					this.x = (((this.w + this.margin[0] * 2) * this.scale_x * sx) / 2);
			}
			if (this.dock_y !== 0)
			{
				var s = this.getScaleFromMethod(3);
				if (this.dock_y === b5.Actor.Dock_Top)
					this.y = -scene.h * s.y / 2 + (((this.h + this.margin[2] * 2) * this.scale_y * sy) / 2);
				else if (this.dock_y === b5.Actor.Dock_Bottom)
					this.y = scene.h * s.y / 2 - (((this.h + this.margin[3] * 2) * this.scale_y * sy) / 2);
				else if (this.dock_y === b5.Actor.Dock_Middle)
					this.y = (((this.h + this.margin[2] * 2) * this.scale_y * sy) / 2);
			}
		}
		else
		{
			if (this.dock_x !== 0)
			{
				if (this.dock_x === b5.Actor.Dock_Left)
					this.x = -scene.w / 2 + (this.w * this.scale_x)/ 2 + this.margin[0];
				else if (this.dock_x === b5.Actor.Dock_Right)
					this.x = scene.w / 2 - (this.w * this.scale_x) / 2 + this.margin[1];
				else if (this.dock_x === b5.Actor.Dock_Centre)
					this.x = (this.w * this.scale_x) / 2 + this.margin[0];
			}
			if (this.dock_y !== 0)
			{
				if (this.dock_y === b5.Actor.Dock_Top)
					this.y = -scene.h / 2 + (this.h * this.scale_y) / 2 + this.margin[2];
				else if (this.dock_y === b5.Actor.Dock_Bottom)
					this.y = scene.h / 2 - (this.h * this.scale_y) / 2 + this.margin[3];
				else if (this.dock_y === b5.Actor.Dock_Middle)
					this.y = (this.h * this.scale_y) / 2 + this.margin[2];
			}
		}
	}

	if (this.x !== x || this.y !== y || (body === null && this.vr !== 0))
		this.dirty();

	// Update child actors
	var count = this.actors.length;
	if (count > 0)
	{
		var acts = this.actors;
		for (var t = 0; t < count; t++)
			acts[t].update(dt);
	}

	this.cleanupDestroyedActors();

	// Re-sort actors if layers changed
	if (this.order_changed)
	{
		this.order_changed = false;
		b5.Utils.sortLayers(this.actors);
	}

	this.frame_count++;
};

/**
 * Main actor update method that is called by the main app object each logic loop. If you derive your own Actor class
 * then you should override this method to provide your own functionality, but remember to call baseUpdate() if you
 * would like to keep the existing base Actor functionality
 * @param dt {number} Time that has passed since this actor was last updated in seconds
 */
b5.Actor.prototype.update = function(dt)
{
	this.baseUpdate(dt);
};

/**
 *  Copies actor velocities to the physics body
 */
b5.Actor.prototype.updateToPhysics = function()
{
	if (this.body === null)
		return;
	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	this.body.SetLinearVelocity(new b2Vec2(this.vx, this.vy));
	this.body.SetAngularVelocity(this.vr);
	this.body.SetAwake(true);
};

/**
 * Dirties this actor and all child actor transforms forcing them to be rebuilt
 */
b5.Actor.prototype.dirty = function()
{
	this.transform_dirty = true;
	var a = this.actors;
	var count = a.length;
	for (var t = 0; t < count; t++)
		a[t].dirty();
};

//
// Virtual canvas
//
/**
 * Attaches a virtual canvas providing new actor properties:
 *
 * - prev_scroll_pos_x {number} - Previous canvas scroll X position
 * - prev_scroll_pos_y {number} - Previous canvas scroll Y position
 * - scroll_pos_x {number} - Canvas scroll X position
 * - scroll_pos_y {number} - Canvas scroll Y position
 * - scroll_vx {number} - Canvas scroll X velocity
 * - scroll_vy {number} - Canvas scroll Y velocity
 * - scroll_range {array} - Scrollable range of canvas (left, top, width, height)
 *
 * Child actors that apply docking will be docked to this container instead of the scene
 */
b5.Actor.prototype.makeVirtual = function()
{
	this.prev_scroll_pos_x = 0;				// Previous canvas scroll X position
	this.prev_scroll_pos_y = 0;				// Previous canvas scroll Y position
	this.scroll_pos_x = 0;					// Canvas scroll X position
	this.scroll_pos_y = 0;					// Canvas scroll Y position
	this.scroll_vx = 0;						// Canvas scroll X velocity
	this.scroll_vy = 0;						// Canvas scroll Y velocity
	this.scroll_range = [0,0,0,0];			// Scrollable range of canvas (left, top, width, height)
	this.virtual = true;
};

/**
 * Handles virtual canvas onMouseTouch handling
 * @private
 * @param touch_pos {object} The touched position
*/
b5.Actor.prototype.Virtual_onMoveTouch = function(touch_pos)
{
	if (this.touching && (this.scroll_range[2] !== 0 || this.scroll_range[3] !== 0))
	{
		var app = this.scene.app;
		this.prev_scroll_pos_x = this.scroll_pos_x;
		this.prev_scroll_pos_y = this.scroll_pos_y;
		this.scroll_vx = app.touch_drag_x;
		this.scroll_pos_x += app.touch_drag_x;
		this.scroll_vy = app.touch_drag_y;
		this.scroll_pos_y += app.touch_drag_y;
		if (this.scroll_vx !== 0 || this.scroll_vy !== 0)
		{
			this.Virtual_scrollRangeCheck();
			this.layout_dirty = true;
			this.Virtual_updateLayout();
		}
	}
};

/**
 * Handles virtual canvas per logic loop update
 * @private
 * @param dt {number} Amount of time that has passed since last called by the logic loop in seconds
 */
b5.Actor.prototype.Virtual_update = function(dt)
{
	if (!this.touching)
	{
		this.prev_scroll_pos_x = this.scroll_pos_x;
		this.prev_scroll_pos_y = this.scroll_pos_y;
		this.scroll_pos_x += this.scroll_vx;
		this.scroll_pos_y += this.scroll_vy;
		if (this.scroll_vx !== 0 || this.scroll_vy !== 0)
		{
			this.Virtual_scrollRangeCheck();
			this.layout_dirty = true;
			this.Virtual_updateLayout();
		}
		this.scroll_vx *= 0.9;
		this.scroll_vy *= 0.9;
		if (this.scroll_vx > -0.5 && this.scroll_vx < 0.5)
			this.scroll_vx = 0;
		if (this.scroll_vy > -0.5 && this.scroll_vy < 0.5)
			this.scroll_vy = 0;
	}
//	this.Virtual_updateLayout();
};

/**
 * Handles virtual canvas scroll range check
 * @private
 */
b5.Actor.prototype.Virtual_scrollRangeCheck = function()
{
	// Prevent from moving outside extents
	// Note that scroll position is inverted
	var x = this.scroll_pos_x;
	var y = this.scroll_pos_y;
	var left = -this.scroll_range[0];
	var right = left - this.scroll_range[2];
	var top = -this.scroll_range[1];
	var bottom = top - this.scroll_range[3];
	if (x < right)
	{
		x = right;
		this.scroll_vx = 0;
	}
	else if (x > left)
	{
		x = left;
		this.scroll_vx = 0;
	}
	if (y < bottom)
	{
		y = bottom;
		this.scroll_vy = 0;
	}
	else if (y > top)
	{
		y = top;
		this.scroll_vy = 0;
	}
	this.scroll_pos_x = x;
	this.scroll_pos_y = y;
};


b5.Actor.prototype.Virtual_clipLayout = function(act, w, h)
{
	if (this.clip_virtual)
	{
		var aw = act.w / 2;
		var ah = act.h / 2;
		if (act.y < -h - ah || act.y > h + ah || act.x < -w - aw || act.x > w + aw)
		{
			act._av = false;
		}
		else
		{
			act._av = true;
		}
	}
	if (Math.abs(this.scroll_vx) > 1 || Math.abs(this.scroll_vy) > 1)
		act.touching = false;
	act.dirty();
}

/**
 * Updates the virtual canvas layout
 * @private
 */
b5.Actor.prototype.Virtual_updateLayout = function(recurse)
{
	if (!this.layout_dirty)
		return;
	this.layout_dirty = false;
	var dx = this.prev_scroll_pos_x - this.scroll_pos_x;
	var dy = this.prev_scroll_pos_y - this.scroll_pos_y;
	// Update child actors
	var count = this.actors.length;
	var w = this.w * this.scale_x / 2;
	var h = this.h * this.scale_y / 2;
	if (count > 0)
	{
		var stack = this.stacking;
		var act;
		var acts = this.actors;
		if (stack === b5.Actor.Stack_None)
		{
			for (var t = 0; t < count; t++)
			{
				act = acts[t];
				// Apply docking
				if (act.dock_x !== 0)
				{
					if (act.dock_x === b5.Actor.Dock_Left)
						act.x = -w + act.w * act.scale_x / 2 + act.margin[0];
					else if (act.dock_x === b5.Actor.Dock_Right)
						act.x = w - act.w * act.scale_x / 2 + act.margin[1];
				}
				else
					act.x += dx;
				if (act.dock_y !== 0)
				{
					if (act.dock_y === b5.Actor.Dock_Top)
						act.y = -h + act.h * act.scale_y / 2 + act.margin[2];
					else if (act.dock_y === b5.Actor.Dock_Bottom)
						act.y = h - act.h * act.scale_y / 2 + act.margin[3];
				}
				else
					act.y += dy;
				// Disable actors out of range
				this.Virtual_clipLayout(act, w, h);
			}			
		}
		else if (stack === b5.Actor.Stack_H)
		{
			act = acts[0];
			var x = -w + act.w * act.scale_x / 2;
			for (var t = 0; t < count; t++)
			{
				act = acts[t];
				act.x = x + act.margin[0];
				x += act.w * act.scale_x + act.margin[1];
				this.Virtual_clipLayout(act, w, h);
			}			
		}
		else if (stack === b5.Actor.Stack_V)
		{
			act = acts[0];
			var y = -h + act.h * act.scale_y / 2;
			for (var t = 0; t < count; t++)
			{
				act = acts[t];
				act.y = y + act.margin[2];
				y += act.h * act.scale_y + act.margin[3];
				// Disable actors out of range
				this.Virtual_clipLayout(act, w, h);
			}			
		}
	}
	if (recurse)
	{
		var a = this.actors;
		for (var t = 0; t < a.length; t++)
			a[t].Virtual_updateLayout(true);
	}
};

/**
 * Check if actor inside virtual actor is clipped out of visible range
 * @public
 */
b5.Actor.prototype.Virtual_isClipped = function(actor)
{
	if (!this.clip_virtual)
		return false;

	var w = this.w * this.scale_x / 2;
	var h = this.h * this.scale_y / 2;
	var aw = actor.w / 2;
	var ah = actor.h / 2;
	if (actor.y < -h - ah || actor.y > h + ah || actor.x < -w - aw || actor.x > w + aw)
	{
		return true;
	}
	return false;
};

/**
 * Tests to see if the supplied position has hit the actor or any of its children. This function does not work with
 * actors that have been rotated around any point except their centre, also does not work with actors that have depth.
 * @param position {object} The x,y position to be tested
 * @returns {b5.Actor} The actor that was hit or null if no actor was hit
 */
b5.Actor.prototype.hitTest = function(position)
{
	if (!this.touchable || !this.active)
		return null;

	// Check child actors
	var count = this.actors.length;
	var act;
	if (count > 0)
	{
		var acts = this.actors;
	    for (var t = count - 1; t >=0 ; t--)
		{
			act = acts[t].hitTest(position);
			if (act !== null)
				return act;
		}
	}

	if (this.hit)
	{
		var scene = this.scene;
		var trans = this.transform;
		var cx = trans[4] + scene.x;
		var cy = trans[5] + scene.y;
		if (!this.ignore_camera)
		{
			cx -= scene.camera_x;
			cy -= scene.camera_y;
		}
		var sx = this.accum_scale_x;
		var sy = this.accum_scale_y;
		var px = (position.x - cx) / sx;
		var py = (position.y - cy) / sy;
		var tx = px * trans[0] + py * trans[1];
		var ty = px * trans[2] + py * trans[3];
		var hw = (this.w * sx) / 2;
		var hh = (this.h * sy) / 2;
		if (tx >= -hw && tx <= hw && ty >= -hh && ty <= hh)
			return this;
	}
	
	return null;
};

/**
 * Transforms supplied point by actors visual transform
 * @param x {number} X coordinate local to actor
 * @param y {number} Y coordinate local to actor
 * @returns {object} Transformed point
 */
b5.Actor.prototype.transformPoint = function(x, y)
{
	return b5.Maths.vecMulMatrix(x, y, this.transform);
};

/**
 * Sets the clipping
 * @private
 * @param x {number} X coordinate
 * @param y {number} Y coordinate
 */
b5.Actor.prototype.setClipping = function(x, y)
{
	var disp = b5.app.display;
	disp.saveContext();

	var clip_margin = this.clip_margin;
	var shape = this.clip_shape;
	if (shape === null)
	{
		var type = this.type;
		if (type === b5.Actor.Type_Arc)
			disp.clipArc(x + clip_margin[0], y + clip_margin[1], this.radius, 0, 2 * Math.PI);
		else
		if (type === b5.Actor.Type_Polygon)
			disp.clipPolygon(this.points);
		else
			disp.clipRect(x + clip_margin[0], y + clip_margin[1], this.w - clip_margin[2] - clip_margin[0], this.h - clip_margin[3] - clip_margin[1]);
	}
	else
	{
		var type = shape.type;
		if (type === b5.Shape.TypeBox)
			disp.clipRect(x + clip_margin[0], y + clip_margin[1], shape.width - clip_margin[2] - clip_margin[0], shape.height - clip_margin[3] - clip_margin[1]);
		else
		if (type === b5.Shape.TypeCircle)
			disp.clipArc(x + clip_margin[0], y + clip_margin[1], shape.width, 0, 2 * Math.PI);
		else
		if (type === b5.Shape.TypePolygon)
			disp.clipPolygon(shape.vertices);
	}
};

/**
 * Basic test to see if actors overlap (no scaling, rotation, origin or shape currently taken into account)
 * @param other {b5.Actor} Other actor to test overlap with
 * @returns {boolean} true if overlapping, false if not
 */
b5.Actor.prototype.overlaps = function(other)
{
	var x = this.x + this.x2;
	var y = this.y + this.y2;
	var w1 = this.w;
	var h1 = this.h;
	var w2 = other.w;
	var h2 = other.h;
	var x1 = x - w1 / 2;
	var y1 = y - h1 / 2;
	var x2 = other.x - w2 / 2;
	var y2 = other.y - h2 / 2;

	return !((y1 + h1 < y2) || (y1 > y2 + h2) || (x1 > x2 + w2) || (x1 + w1 < x2));
};
b5.Actor.prototype.overlapsRect = function(rect)
{
	var x = this.x + this.x2;
	var y = this.y + this.y2;
	var w1 = this.w;
	var h1 = this.h;
	var w2 = rect.x2 - rect.x1;
	var h2 = rect.y2 - rect.y1;
	var x1 = x - w1 / 2;
	var y1 = y - h1 / 2;
	var x2 = rect.x1;
	var y2 = rect.y1;

	return !((y1 + h1 < y2) || (y1 > y2 + h2) || (x1 > x2 + w2) || (x1 + w1 < x2));
};

/**
 * Basic test to see if actors overlap (no scaling, rotation, origin or shape currently taken into account).
 * Assumes this actor is circular
 * @param other {b5.Actor} Other actor to test overlap with
 * @returns {boolean} true if overlapping, false if not
 */
b5.Actor.prototype.circleOverlaps = function(other)
{
	var rx1 = other.x - other.w / 2;
	var ry1 = other.y - other.h / 2;
	var rx2 = other.x + other.w / 2;
	var ry2 = other.y + other.h / 2;
	var x = this.x + this.x2;
	var y = this.y + this.y2;
	var closex = (x < rx1) ? rx1 : ((x > rx2) ? rx2 : x);
	var closey = (y < ry1) ? ry1 : ((y > ry2) ? ry2 : y);
	var dx = x - closex;
	var dy = y - closey;
	var d = (dx * dx) + (dy * dy);
	return d < (this.w / 2 * this.w / 2);
}
b5.Actor.prototype.circleOverlapsRect = function(rect)
{
	var rx1 = rect.x1;
	var ry1 = rect.y1;
	var rx2 = rect.x2;
	var ry2 = rect.y2;
	var x = this.x + this.x2;
	var y = this.y + this.y2;
	var closex = (x < rx1) ? rx1 : ((x > rx2) ? rx2 : x);
	var closey = (y < ry1) ? ry1 : ((y > ry2) ? ry2 : y);
	var dx = x - closex;
	var dy = y - closey;
	var d = (dx * dx) + (dy * dy);
	return d < (this.w / 2 * this.w / 2);
}

b5.Actor.fullCircleOverlapTest = function(act1, act2)
{
	var p1 = act1.transformPoint(0, 0);
	var p2 = act2.transformPoint(0, 0);
	
	var dx = p2.x - p1.x;
	var dy = p2.y - p1.y;
	var d1 = dx * dx + dy * dy;
	var d2 = (act1.w * act1.w / 2) + (act2.w * act2.w / 2)

	if (d1 <= d2)
		return true;
	
	return false;
};

/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
//
/**
 * An ArcActor is derived from a {@link b5.Actor} that displays an arc (or circle) shaped game object instead of an
 * image and inherits all properties, methods and so forth from its parent. An ArcActor should be added to a
 * {@link b5.Scene} or another {@link b5.Actor} that is part of a scene hierarchy
 *
 * <b>Examples</b>
 *
 * Example showing how to create an ArcActor:
 *
 *      var actor = new b5.ArcActor();
 *      actor.x = 100;
 *      actor.y = 0;
 *      actor.fill_style = "#00ffff";
 *      actor.start_angle = 0;
 *      actor.end_angle = 2 * Math.PI;
 *      actor.radius = 50;
 *      actor.filled = true;
 *      scene.addActor(actor);    // Add actor to scene to be processed and drawn
 *
 * For a complete overview of the Actor class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actors/ Booty5 Actor Overview}
 *
 * @class b5.ArcActor
 * @augments b5.Actor
 * @constructor
 * @returns {b5.ArcActor} The created ArcActor
 *
 * @property {string}                   fill_style                          - Style used to fill the arc (default is #ffffff)
 * @property {string}                   stroke_style                        - Stroke used to draw none filled arc (default is #ffffff)
 * @property {number}                   stroke_thickness                    - Stroke thickness for none filled (default is #ffffff)
 * @property {number}                   radius                              - Radius of arc (default is 1)
 * @property {number}                   start_angle                         - Start angle of arc in radians (default is 0)
 * @property {number}                   end_angle                           - End angle of arc in radians (default is 2*PI)
 * @property {boolean}                  filled                              - if true then arc interior will be filled otherwise empty (default is true)
 * @property {boolean}                  stroke_filled                       - If true then stroke will be drawn (default is true)
 *
 */
b5.ArcActor = function()
{
    // Public variables
    this.fill_style = "#ffffff";            // Style used to fill the arc
    this.stroke_style = "#ffffff";          // Stroke used to draw none filled arc
    this.stroke_thickness = 1;              // Stroke thickness for none filled
    this.radius = 1;				        // Radius of arc
    this.start_angle = 0;			        // Start angle of arc in radians
    this.end_angle = 2 * Math.PI;	        // End angle of arc in radians
    this.filled = true;				        // if true then arc interior will filled otherwise empty
    this.stroke_filled = false;				// if true then a stroke will be drawn
    
    // Call constructor
    b5.Actor.call(this);

    this.type = b5.Actor.Type_Arc;     // Type of actor
};
b5.ArcActor.prototype = new b5.Actor();
b5.ArcActor.prototype.constructor = b5.ArcActor;
b5.ArcActor.prototype.parent = b5.Actor.prototype;

b5.ArcActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

/**
 * Overrides the base {@link b5.Actor}.draw() method to draw an arc instead of an image
 */
b5.ArcActor.prototype.draw = function()
{
    if (!this.visible)
        return;

    if (this.cache)
    {
        this.drawToCache();
        this.cache = false;
    }
    if (this.merge_cache)   // If merged into parent ache then parent will have drawn so no need to draw again
    {
		this.drawChildren(false);
		this.drawChildren(true);
        return;
    }
    
    this.updateTransform();
	// Draw child actors
    var drawn_all = this.drawChildren(false);
    
    // Render the actor
    var cache = this.cache_canvas;
    var scene = this.scene;
    var app = scene.app;
    var dscale = app.canvas_scale;
    var disp = app.display;
    if (cache === null)
    {
        if (this.filled && this.fill_style !== "")
            disp.setFillStyle(this.fill_style);
        if (this.stroke_filled && this.stroke_style !== "")
            disp.setStrokeStyle(this.stroke_style);
        if (this.stroke_filled)
            disp.setLineWidth(this.stroke_thickness);
    }

    var mx = app.canvas_cx + scene.x * dscale;
    var my = app.canvas_cy + scene.y * dscale;

    if (!this.ignore_camera && (this.depth === 0 || this.depth === 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }

    this.preDraw();
    
    var self_clip = this.self_clip;
    var clip_children = this.clip_children;
    var trans = this.transform;
    var tx = trans[4] * dscale + mx;
    var ty = trans[5] * dscale + my;
    if (this.round_pixels)
    {
        tx = (tx + 0.5) | 0;
        ty = (ty + 0.5) | 0;
    }
    disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, tx, ty);

    if (self_clip)
        this.setClipping(0,0);

    if (cache === null)
        disp.drawArc(0,0, this.radius, this.start_angle, this.end_angle, this.filled);
    else
        disp.drawImage(cache, -cache.width >> 1, -cache.height >> 1);
    this.postDraw();

    if (clip_children)
    {
        if (!self_clip)
            this.setClipping(0,0);
    }
    else
    if (self_clip)
        disp.restoreContext();

	// Draw child actors
	if (!drawn_all)
		this.drawChildren(true);
    if (clip_children)
        disp.restoreContext();
};

/**
 * Overrides the base {@link b5.Actor}.drawToCache() method to draw an arc to a cache
 */
b5.ArcActor.prototype.drawToCache = function()
{
    var disp = b5.app.display;
    var cache = null;
    var pad = this.padding * 2;
    var w = this.w + pad;
    var h = this.h + pad;
    var ox = 0;
    var oy = 0;
    if (this.merge_cache)
    {
        var parent = this.findFirstCachedParent();
        if (parent !== null)
        {
            cache = parent.cache_canvas;
            ox = this.x + cache.width / 2 - w/2;
            oy = this.y + cache.height / 2 - h/2;
        }
    }
    if (cache === null)
    {
        var pr = b5.app.pixel_ratio;
        cache = disp.createCache();
/*        if (this.stroke_filled && this.stroke_style !== "")
        {
            w += this.stroke_thickness;
            h += this.stroke_thickness;
            ox = (this.stroke_thickness / 2 + 0.5) << 0;
            oy = (this.stroke_thickness / 2 + 0.5) << 0;
        }*/
        cache.width = (w * pr) | 0;
        cache.height = (h * pr) | 0;
    }
    
    disp.setCache(cache);
	this.preDrawCached();
    // Render the actor
    if (this.filled && this.fill_style !== "")
        disp.setFillStyle(this.fill_style);
    if (this.stroke_filled && this.stroke_style !== "")
        disp.setStrokeStyle(this.stroke_style);
    if (this.stroke_filled)
        disp.setLineWidth(this.stroke_thickness);

    disp.setTransform(1,0,0,1, ox + w/2, oy + h/2);
    disp.drawArc(0,0, this.radius, this.start_angle, this.end_angle, this.filled);
	this.postDrawCached();
    
    disp.setCache(null);

    this.cache_canvas = cache;
};

/**
 * Overrides the base {@link b5.Actor}.hitTest() method to test against a circle
 */
b5.ArcActor.prototype.hitTest = function(position)
{
    if (!this.touchable)
        return null;

    // Check child actors
    var count = this.actors.length;
    var act;
    if (count > 0)
    {
        var acts = this.actors;
        for (var t = 0; t < count; t++)
        {
            act = acts[t].hitTest(position);
            if (act !== null)
                return act;
        }

    }

    var scene = this.scene;
    var trans = this.transform;
    var cx = trans[4] + scene.x;
    var cy = trans[5] + scene.y;
    if (!this.ignore_camera)
    {
        cx -= scene.camera_x;
        cy -= scene.camera_y;
    }
    var sx = this.accum_scale_x;
    var sy = this.accum_scale_y;
    var px = (position.x - cx) / sx;
    var py = (position.y - cy) / sy;
    var tx = px * trans[0] + py * trans[1];
    var ty = px * trans[2] + py * trans[3];
    var r = this.radius * sx;
    r *= r;
    var d = tx * tx + ty * ty;
    if (d <= r)
        return this;

    return null;
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * A LabelActor is derived from a {@link b5.Actor} that displays text game objects instead of an image and inherits all
 * properties, methods and so forth from its parent. A LabelActor should be added to a {@link b5.Scene} or another
 * {@link b5.Actor} that is part of a scene hierarchy
 *
 * <b>Examples</b>
 *
 * Example showing how to create a LabelActor:
 *
 *      var actor = new b5.LabelActor();
 *      actor.font = "16pt Calibri";     // Set font
 *      actor.text_align = "center";     // Set horizontal alignment
 *      actor.text_baseline = "middle";  // Set vertical alignment
 *      actor.fill_style = "#ffffff";    // Set fill style
 *      actor.text = "Hello World";      // Set some text
 *      scene.addActor(actor);           // Add to scene for processing and drawing
 *
 * For a complete overview of the Actor class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actors/ Booty5 Actor Overview}
 *
 * @class b5.LabelActor
 * @augments b5.Actor
 * @constructor
 * @returns {b5.LabelActor} The created LabelActor
 *
 * @property {string}                   text                                - The text to display
 * @property {string}                   font                                - The font to display the text in (e.g. 16px Calibri)
 * @property {string}                   text_align                          - Text horizontal alignment (left, right or center)
 * @property {string}                   text_baseline                       - Text vertical alignment (top, middle or bottom)
 * @property {string}                   fill_style                          - Style used to fill the label (default is #ffffff)
 * @property {string}                   stroke_style                        - Stroke used to draw none filled label (default is #ffffff)
 * @property {number}                   stroke_thickness                    - Stroke thickness for none filled (default is #ffffff)
 * @property {number}                   line_height                         - Height of line (default 16)
 * @property {number}                   max_width                           - Maximum width of line (default 0 = no word wrapping)
 * @property {boolean}                  filled                              - If true then label interior will be filled otherwise empty (default is true)
 * @property {boolean}                  stroke_filled                       - If true then stroke will be drawn (default is true)
 *
 */

b5.LabelActor = function()
{
    // Public variables
    this.text = "";                     // The text to display
    this.font = "16pt Calibri";         // The font to display the text in
    this.text_align = "center";         // Text horizontal alignment
    this.text_baseline = "middle";      // Text vertical alignment
    this.fill_style = "#ffffff";        // Fill style
    this.stroke_style = "#ffffff";      // Stroke used to draw none filled
    this.stroke_thickness = 1;          // Stroke thickness for none filled
    this.line_height = 16;              // Height of a line of text
    this.max_width = 0;                 // Maximum line width
    this.filled = true;                 // If true then text will be drawn filled, otherwise none filled
    this.stroke_filled = false;	        // if true then a stroke will be drawn
    
    // Call constructor
    b5.Actor.call(this);

    this.type = b5.Actor.Type_Label;       // Type of actor
};
b5.LabelActor.prototype = new b5.Actor();
b5.LabelActor.prototype.constructor = b5.LabelActor;
b5.LabelActor.prototype.parent = b5.Actor.prototype;

//
// Properties
//
Object.defineProperty(b5.LabelActor.prototype, "_text", {
	get: function() { return this.text; },
	set: function(value) { if (this.text !== value) { this.text = "" + value; if (this.cache_canvas !== null) this.cache = true; } }
});

b5.LabelActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

/**
 * Overrides the base {@link b5.Actor}.draw() method to draw a label instead of an image
 */
b5.LabelActor.prototype.draw = function()
{
    if (!this.visible || this.text === "")
        return;

    if (this.cache)
    {
        this.drawToCache();
        this.cache = false;
    }
    if (this.merge_cache)   // If merged into parent cache then parent will have drawn so no need to draw again
	{
		this.drawChildren(false);
		this.drawChildren(true);
		return;
	}

    this.updateTransform();
	// Draw child actors
    var drawn_all = this.drawChildren(false);
    this.preDraw();

    // Render the actor
    var cache = this.cache_canvas;
    var scene = this.scene;
    var app = scene.app;
    var dscale = app.canvas_scale;
    var disp = app.display;
    if (cache === null)
    {
        if (this.font !== "")
            disp.setFont(this.font);
        if (this.textAlign !== "")
            disp.setTextAlign(this.text_align);
        if (this.textBaseline !== "")
            disp.setTextBaseline(this.text_baseline);
        if (this.filled && this.fill_style !== "")
            disp.setFillStyle(this.fill_style);
        if (this.stroke_filled && this.stroke_style !== "")
            disp.setStrokeStyle(this.stroke_style);
        if (this.stroke_filled)
            disp.setLineWidth(this.stroke_thickness);
    }
	var ps = b5.app.pixel_ratio;
	if (cache === null)
		ps = 1;

    var mx = app.canvas_cx + scene.x * dscale / ps;
    var my = app.canvas_cy + scene.y * dscale / ps;

    if (!this.ignore_camera && (this.depth === 0 || this.depth === 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }

    var trans = this.transform;
    var tx = trans[4] * dscale + mx;
    var ty = trans[5] * dscale + my;
        //tx -= this.padding / 2;
        //ty -= this.padding / 2;
    if (this.round_pixels)
    {
        tx = (tx + 0.5) | 0;
        ty = (ty + 0.5) | 0;
    }
	dscale /= ps;
    disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, tx, ty);
    if (cache === null)
    {
		if (this.stroke_filled)
			disp.drawTextWrap(this.text, 0,0, this.max_width, this.line_height, false, this.text_baseline);
		if (this.filled)
			disp.drawTextWrap(this.text, 0,0, this.max_width, this.line_height, true, this.text_baseline);
    }
    else
    {
        var x = -cache.width / 2;
        var y = -cache.height / 2;
        
        disp.drawImage(cache, x, y);
    }
    this.postDraw();

	// Draw child actors
	if (!drawn_all)
		this.drawChildren(true);
};

/**
 * Overrides the base {@link b5.Actor}.drawToCache() method to draw a label to a cache
 */
b5.LabelActor.prototype.drawToCache = function()
{
    var disp = b5.app.display;
    var cache = null;
    var pad = this.padding * 2;
    var w = this.w + pad;
    var h = this.h + pad;
    var ox = 0;
    var oy = 0;
    if (this.merge_cache)
    {
        var parent = this.findFirstCachedParent();
        if (parent !== null)
        {
            cache = parent.cache_canvas;
            ox = this.x + cache.width / 2 - w/2;
            oy = this.y + cache.height / 2 - h/2;
        }
    }
    if (cache === null)
    {
        var pr = b5.app.pixel_ratio;
        cache = disp.createCache();
        cache.width = (w * pr) | 0;
        cache.height = (h * pr) | 0;
    }

    disp.setCache(cache);
    // Render the actor
	this.preDrawCached();
    if (this.font !== "")
        disp.setFont(this.font);
    if (this.textAlign !== "")
        disp.setTextAlign(this.text_align);
    if (this.textBaseline !== "")
        disp.setTextBaseline(this.text_baseline);

    if (this.filled && this.fill_style !== "")
        disp.setFillStyle(this.fill_style);
    if (this.stroke_filled && this.stroke_style !== "")
        disp.setStrokeStyle(this.stroke_style);
    if (this.stroke_filled)
        disp.setLineWidth(this.stroke_thickness);
    disp.setTransform(1,0,0,1, 0,0);
    if (this.text_align === "center")
        ox += w/2;
    else if (this.text_align === "right")
        ox += w;
    if (this.text_baseline === "middle")
        oy += h/2;
    else if (this.text_baseline === "bottom")
        oy += h;
	if (this.merge_cache)
    {
        var scene = this.scene;
        var trans = [];
        var r = this.rotation;
        var cos = Math.cos(r);
        var sin = Math.sin(r);
        var dscale = 1;
        var sx = this.scale_x;
        var sy = this.scale_y;
        trans[0] = cos * sx;
        trans[1] = sin * sx;
        trans[2] = -sin * sy;
        trans[3] = cos * sy;
            trans[4] = this.x + cache.width / 2 - this.ox * this.ow;
        trans[5] = this.y + cache.height / 2 - this.oy * this.oh;
        var pre_mat = [1, 0, 0, 1, this.ox * this.ow, this.oy * this.oh];
        b5.Maths.preMulMatrix(trans, pre_mat);
        disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, trans[4], trans[5]);
        if (this.stroke_filled)
            disp.drawTextWrap(this.text, 0, 0, this.max_width, this.line_height, false, this.text_baseline);
        if (this.filled)
            disp.drawTextWrap(this.text, 0, 0, this.max_width, this.line_height, true, this.text_baseline);
        disp.setTransform(1,0,0,1, 0, 0);
    }
    else
    {
        disp.setTransform(1,0,0,1, 0, 0);
        if (this.stroke_filled)
            disp.drawTextWrap(this.text, ox, oy, this.max_width, this.line_height, false, this.text_baseline);
        if (this.filled)
            disp.drawTextWrap(this.text, ox, oy, this.max_width, this.line_height, true, this.text_baseline);
    }
	this.postDrawCached();
    
    disp.setCache(null);

    this.cache_canvas = cache;
};



/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * A ParticleActor is derived from a {@link b5.Actor} and is an actor that can generate and display particles
 * (a particle system), a particle can be an actor of any kind, including another particle actor. To use a particle
 * system actor you create an instance of ParticleActor then create and add individual actor particles, specifying
 * a life span (the amount of time the particle exists), a spawn delay (the amount of time to wait before spawning
 * the particle) and the total number of times the particle can be reborn. When a particle system has no particles
 * left alive it will be destroyed. A ParticleActor should be added to a {@link b5.Scene} or another {@link b5.Actor}
 * that is part of a scene hierarchy
 *
 * Supports the following event handlers:
 *
 * - onParticlesEnd() - Called when The particle system has finished and no particles are left
 * - onParticleLost(particle) - Called each time a particle is lost, if this function returns false then the particle
 * will not be destroyed
 *
 * Note that when an actor is added to a particle actor it is given the following additional properties:
 * - vo - Opacity velocity
 * - vsx - X axis scale velocity
 * - vsy - Y axis scale velocity
 *
 * Example of creating a particle system particle by particle:
 *
 *      var particles = new b5.ParticleActor();
 *      particles.gravity = 40;
 *      my_scene.addActor(particles);   // Add particle system actor to scene for processing
 *      for (var t = 0; t < 20; t++)
 *      {
 *          var particle = new b5.Actor();
 *          particle.fill_style = "#FFFF00";
 *          particle.radius = 30;
 *          particle.vx = Math.random() * 200 - 100;
 *          particle.vy = Math.random() * 200 - 100;
 *          particle.vo = -1 / 2;
 *          particles.addParticle(particle, 2, 0, t * 0.1);
 *      }
 *
 * Example of creating a particle explosion using the utility method:
 *
 *      var particles = new b5.ParticleActor();
 *      my_scene.addActor(particles);     // Add particle system actor to scene for processing
 *      particles.generateExplosion(50, b5.ArcActor, 2, 50, 10, 1, 0.999, {
 *          fill_style: "#ffff00",
 *          radius: 30
 *      );
 *
 * Example of creating a particle system that represents a smoke plume using a utility method:
 *
 *      var particles = new b5.ParticleActor();
 *      my_scene.addActor(particles);     // Add particle system actor to scene for processing
 *      particles.generatePlume(20, b5.ArcActor, 3, 40, 10, 0.25, 1, {
 *          fill_style: "#ffff00",
 *          radius: 20,
 *          vsx: 0.6,
 *          vsy: 0.6
 *      });
 *
 * <b>Examples</b>
 *
 * For a complete overview of the Actor class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actors/ Booty5 Actor Overview}
 *
 * @class b5.ParticleActor
 * @augments b5.Actor
 * @constructor
 * @returns {b5.ParticleActor} The created ParticleActor
 *
 * @property {number}                   gravity                             - Amount of gravity to apply to particles (default is 0)
 *
 */


//
b5.ParticleActor = function()
{
    // Call constructor
    b5.Actor.call(this);

    // Internal variables

    // public variables
    this.type = b5.Actor.Type_Particle; // Type of actor
    this.gravity = 0;                   // Gravity applied to particles
    this.added_callback = null;         // Callback that is called when a particle is added
    this.reset_callback = null;         // Callback that is called when a particle is reset
};
b5.ParticleActor.prototype = new b5.Actor();
b5.ParticleActor.prototype.constructor = b5.ParticleActor;
b5.ParticleActor.prototype.parent = b5.Actor.prototype;

/**
 * Resets the particle to its initial spawn state
 * @private
 * @param actor
 */
b5.ParticleActor.prototype.resetParticle = function(actor)
{
    actor.life_time = 0;
    if (actor.orphaned)
    {
        var tpos = this.transformPoint(actor.org_x + this.x, actor.org_y + this.y);
        actor.x = tpos.x;
        actor.y = tpos.y;
    }
    else
    {
        actor.x = actor.org_x;
        actor.y = actor.org_y;
    }
    actor.rotation = actor.org_rotation;
    actor.scale_x = actor.org_scale_x;
    actor.scale_y = actor.org_scale_y;
    actor.depth = actor.org_depth;
    actor.opacity = actor.org_opacity;
    actor.current_frame = actor.org_current_frame;
    actor.vr = actor.org_vr;
    actor.vx = actor.org_vx;
    actor.vy = actor.org_vy;
    actor.vd = actor.org_vd;
    actor.vo = actor.org_vo;
    actor.vsx = actor.org_vsx;
    actor.vsy = actor.org_vsy;
    if (this.reset_callback !== null)
        this.reset_callback(actor);
};

/**
 * Adds an actor to the particle system as a particle
 * @param actor {b5.Actor} The actor to add as a particle, can be any derived actor type
 * @param life_span {number} The life span of the particle in seconds
 * @param num_lives{number} The number of times a particle will respawn before it is destroyed (0 for infinite)
 * @param spawn_delay{number} The number of seconds to wait before spawning this particle
 * @returns {b5.Actor} The created actor particle
 */
b5.ParticleActor.prototype.addParticle = function(actor, life_span, num_lives, spawn_delay)
{
    this.addActor(actor);

    if (actor.vo === undefined) actor.vo = 0;
    if (actor.vsx === undefined) actor.vsx = 0;
    if (actor.vsy === undefined) actor.vsy = 0;

    actor.life_time = -spawn_delay;     // Current life time (set initially to a negative time to delay spawning)
    actor.life_span = life_span;        // Amount of time the particle will be alive
    actor.num_lives = num_lives;        // Total number of times the particle will respawn (0 for infinite)
    if (actor.life_time < 0)
    {
        actor.active = false;
        actor.visible = false;
    }
    actor.org_num_lives = actor.num_lives
    actor.org_x = actor.x;
    actor.org_y = actor.y;
    actor.org_rotation = actor.rotation;
    actor.org_scale_x = actor.scale_x;
    actor.org_scale_y = actor.scale_y;
    actor.org_depth = actor.depth;
    actor.org_opacity = actor.opacity;
    actor.org_current_frame = actor.current_frame;
    actor.org_vr = actor.vr;
    actor.org_vx = actor.vx;
    actor.org_vy = actor.vy;
    actor.org_vd = actor.vd;
    actor.org_vo = actor.vo;
    actor.org_vsx = actor.vsx;
    actor.org_vsy = actor.vsy;
    if (actor.orphaned)
    {
        var tpos = this.transformPoint(actor.org_x + this.x, actor.org_y + this.y);
        actor.x = tpos.x;
        actor.y = tpos.y;
    }

    if (this.added_callback !== null)
        this.added_callback(actor);
    
    return actor;
};

/**
 * Overrides the base {@link b5.Actor}.update() method to perform particle system update
 * @param dt {number} Time that has passed since this actor was last updated in seconds
 */
b5.ParticleActor.prototype.update = function(dt)
{
    var particles = this.actors;
    var count = particles.length;

    // Destroy actor if no particles left
    if (count === 0)
    {
        if (this.onParticlesEnd !== undefined)
            this.onParticlesEnd();
        this.destroy();
    }
    else
    {
        // Update particles
        for (var t = count - 1; t >=0 ; t--)
        {
            var p = particles[t];
            p.life_time += dt;

            var life_time = p.life_time;
            if (life_time >= 0)
            {
                if (life_time - dt < 0 && life_time >= 0)
                {
                    p.active = true;
                    p.visible = true;
                }

                if (p.active)
                {
                    p.scale_x += p.vsx * dt;
                    p.scale_y += p.vsy * dt;
                    p.opacity += p.vo * dt;
                    if (p.opacity < 0)
                        p.opacity = 0;
                    p.vy += this.gravity * dt;
                    p.update(dt);

                    if (life_time >= p.life_span)
                    {
                        if (p.num_lives > 0)
                            p.num_lives--;
                        if (p.num_lives > 0 || p.org_num_lives === 0)
                            this.resetParticle(p);

                        else
                        {
                            if (this.onParticleLost !== undefined) {
                                if (this.onParticleLost(p))
                                    p.destroy();
                            }
                            else
                                p.destroy();
                        }
                    }
                }
            }
        }
    }

    return this.baseUpdate(dt);
};

/**
 * Utility method to create a basic explosion particle system
 * @param count {number} Total number of particles to create
 * @param type {object|string} The actor type of each particle created, for example b5.ArcActor or "ArcActor"
 * @param duration {number} The total duration of the particle system in seconds
 * @param speed {number} The speed at which the particles blow apart
 * @param spin_speed {number} The speed at which particles spin
 * @param rate {number} The rate at which particles are created
 * @param damping {number} A factor to reduce velocity of particles each frame, values greater than 1 will increase velocities
 * @param properties {object} A collection of actor specific property / value pairs that will be assigned to each created particle
 */
b5.ParticleActor.prototype.generateExplosion = function(count, type, duration, speed, spin_speed, rate, damping, properties)
{
    this.updateParentTransforms();
    for (var t = 0; t < count; t++)
    {
        var p;
        if (typeof type === "string")
            p = new b5[type]();
        else
            p = new type();
        for (var prop in properties)
            p[prop] = properties[prop];
        p.vr += Math.random() * spin_speed;
        p.vx += Math.random() * speed - speed/2;
        p.vy += Math.random() * speed - speed/2;
        p.vx_damping = damping;
        p.vy_damping = damping;
        p.vo = -1 / duration;
        this.addParticle(p, duration, 1, t / (count * rate));
    }
};

/**
 * Utility method to create a basic smoke plume particle system
 * @param count {number} Total number of particles to create
 * @param type {object|string} The actor type of each particle created, for example b5.ArcActor or "ArcActor"
 * @param duration {number} The total duration of the particle system in seconds
 * @param speed {number} The speed at which the particles rise
 * @param spin_speed {number} The speed at which particles spin
 * @param rate {number} The rate at which particles are created
 * @param damping {number} A factor to reduce velocity of particles each frame, values greater than 1 will increase velocities
 * @param properties {object} A collection of actor specific property / value pairs that will be assigned to each created particle
 */
b5.ParticleActor.prototype.generatePlume = function(count, type, duration, speed, spin_speed, rate, damping, properties)
{
    this.updateParentTransforms();
    for (var t = 0; t < count; t++)
    {
        var p;
        if (typeof type === "string")
            p = new b5[type]();
        else
            p = new type();
        for (var prop in properties)
            p[prop] = properties[prop];
        p.vr += Math.random() * spin_speed;
        p.vx += Math.random() * speed - speed / 2;
        p.vy += Math.random() * -speed - speed / 2;
        p.vx_damping = damping;
        p.vy_damping = damping;
        p.vo = -1 / duration;
        this.addParticle(p, duration, 0, t / (count * rate));
    }
};

/**
 * Utility method to create a basic rain particle system
 * @param count {number} Total number of particles to create
 * @param type {object|string} The actor type of each particle created, for example b5.ArcActor or "ArcActor"
 * @param duration {number} The total duration of the particle system in seconds
 * @param speed {number} The speed at which the particles fall
 * @param spin_speed {number} The speed at which particles spin
 * @param rate {number} rate at which particles are created
 * @param damping {number} A factor to reduce velocity of particles each frame, values greater than 1 will increase velocities
 * @param width {number} The width of the area over which to generate particles
 * @param properties {object} A collection of actor specific property / value pairs that will be assigned to each created particle
 */
b5.ParticleActor.prototype.generateRain = function(count, type, duration, speed, spin_speed, rate, damping, width, properties)
{
    this.updateParentTransforms();
    for (var t = 0; t < count; t++)
    {
        var p;
        if (typeof type === "string")
            p = new b5[type]();
        else
            p = new type();
        for (var prop in properties)
            p[prop] = properties[prop];
        p.x = Math.random() * width - width / 2;
        p.vr += Math.random() * spin_speed;
        p.vy += Math.random() * speed + speed / 2;
        p.vx_damping = damping;
        p.vy_damping = damping;
        p.vo = -1 / duration;
        this.addParticle(p, duration, 0, t / (count * rate));
    }
};



/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * A PolygonActor is derived from a {@link b5.Actor} that displays a polygon shaped game object instead of an image and
 * inherits all properties, methods and so forth from its parent. A PolygonActor should be added to a {@link b5.Scene}
 * or another {@link b5.Actor} that is part of a scene hierarchy
 *
 * <b>Examples</b>
 *
 * Example showing how to create a polygon based actor
 *
 *      var actor = new b5.PolygonActor();
 *      actor.name = "polygon1";
 *      actor.points = [0, -50, 50, 50, -50, 50];    // Set actors shape
 *      actor.fill_style = "#804fff";                // Set fill style
 *      actor.filled = true;                         // Set filled
 *      scene.addActor(actor);                       // Add actor to scene for processing and drawing
 *
 * For a complete overview of the Actor class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actors/ Booty5 Actor Overview}
 *
 * @class b5.PolygonActor
 * @augments b5.Actor
 * @constructor
 * @returns {b5.PolygonActor} The created PolygonActor
 *
 * @property {string}                   fill_style                          - Style used to fill the polygon (default is #ffffff)
 * @property {string}                   stroke_style                        - Stroke used to draw none filled polygon (default is #ffffff)
 * @property {number}                   stroke_thickness                    - Stroke thickness for none filled (default is #ffffff)
 * @property {boolean}                  filled                              - if true then polygon interior will be filled otherwise empty (default is true)
 * @property {boolean}                  stroke_filled                       - If true then stroke will be drawn (default is true)
 * @property {number[]}                 points                              - An array of points that describe the shape of the actor in the form [x1,y1,x2,y2,....]
 *
 *
 */

b5.PolygonActor = function()
{
    // Public variables
    this.fill_style = "#ffffff";            // Style used to fill the arc
    this.stroke_style = "";                 // Stroke used to draw none filled arc
    this.stroke_thickness = 1;              // Stroke thickness for none filled
    this.filled = true;				        // if true then polygons interior will filled otherwise empty
    this.stroke_filled = false;				// if true then a stroke will be drawn
    this.points = null;				        // List of points to draw

    // Call constructor
    b5.Actor.call(this);

    this.type = b5.Actor.Type_Polygon; // Type of actor
};
b5.PolygonActor.prototype = new b5.Actor();
b5.PolygonActor.prototype.constructor = b5.PolygonActor;
b5.PolygonActor.prototype.parent = b5.Actor.prototype;

b5.PolygonActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

/**
 * Overrides the base {@link b5.Actor}.draw() method to draw a polygon instead of an image
 */
b5.PolygonActor.prototype.draw = function()
{
    if (!this.visible || this.points === null)
        return;

    if (this.cache)
    {
        this.drawToCache();
        this.cache = false;
    }
    if (this.merge_cache)   // If merged into parent ache then parent will have drawn so no need to draw again
	{
		this.drawChildren(false);
		this.drawChildren(true);
		return;
	}

    this.updateTransform();
	// Draw child actors
    var drawn_all = this.drawChildren(false);
    
    // Render the actor
    var cache = this.cache_canvas;
    var scene = this.scene;
    var app = scene.app;
    var disp = app.display;
    if (cache === null)
    {
        if (this.filled && this.fill_style !== "")
            disp.setFillStyle(this.fill_style);
        if (this.stroke_filled && this.stroke_style !== "")
            disp.setStrokeStyle(this.stroke_style);
        if (this.stroke_filled)
            disp.setLineWidth(this.stroke_thickness);
    }

    var dscale = app.canvas_scale;
    var mx = app.canvas_cx + this.scene.x * dscale;
    var my = app.canvas_cy + this.scene.y * dscale;

    if (!this.ignore_camera && (this.depth === 0 || this.depth === 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }

    this.preDraw();
    
    var self_clip = this.self_clip;
    var clip_children = this.clip_children;
    var trans = this.transform;
    var tx = trans[4] * dscale + mx;
    var ty = trans[5] * dscale + my;
    if (this.round_pixels)
    {
        tx = (tx + 0.5) | 0;
        ty = (ty + 0.5) | 0;
    }
    disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, tx, ty);

    if (self_clip)
        this.setClipping(0,0);

    if (cache === null)
        disp.drawPolygon(0,0, this.points, this.filled);
    else
        disp.drawImage(cache, -cache.width >> 1, -cache.height >> 1);
    this.postDraw();

    if (clip_children)
    {
        if (!self_clip)
            this.setClipping(0,0);
    }
    else
    if (self_clip)
        disp.restoreContext();

	// Draw child actors
	if (!drawn_all)
		this.drawChildren(true);

    if (clip_children)
        disp.restoreContext();
};

/**
 * Overrides the base {@link b5.Actor}.drawToCache() method to draw a polygon to a cache
 */
b5.PolygonActor.prototype.drawToCache = function()
{
    var disp = b5.app.display;
    var cache = null;
    var pad = this.padding * 2;
    var w = this.w + pad;
    var h = this.h + pad;
    var ox = 0;
    var oy = 0;
    if (this.merge_cache)
    {
        var parent = this.findFirstCachedParent();
        if (parent !== null)
        {
            cache = parent.cache_canvas;
            ox = this.x + cache.width / 2 - w/2;
            oy = this.y + cache.height / 2 - h/2;
        }
    }
    if (cache === null)
    {
        var pr = b5.app.pixel_ratio;
        cache = disp.createCache();
/*        if (!this.filled && this.stroke_style !== "")
        {
            w += this.stroke_thickness;
            h += this.stroke_thickness;
        }*/
        cache.width = (w * pr) | 0;
        cache.height = (h * pr) | 0;
    }

    disp.setCache(cache);
    // Render the actor
	this.preDrawCached();
    if (this.filled && this.fill_style !== "")
        disp.setFillStyle(this.fill_style);
    if (this.stroke_filled && this.stroke_style !== "")
        disp.setStrokeStyle(this.stroke_style);
    if (this.stroke_filled)
        disp.setLineWidth(this.stroke_thickness);
    disp.setTransform(1,0,0,1, ox + w / 2, oy + h / 2);
    disp.drawPolygon(0,0, this.points, this.filled);
	this.postDrawCached();
    
    disp.setCache(null);

    this.cache_canvas = cache;
};


// TODO: Add polygon specific version of hitTest


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * A RectActor is derived from a {@link b5.Actor} that displays a rectangle / rounded rectangle shaped game object
 * instead of an image and inherits all properties, methods and so forth from its parent. A RectActor should be added
 * to a {@link b5.Scene} or another {@link b5.Actor} that is part of a scene hierarchy
 *
 * <b>Examples</b>
 *
 * Example showing how to create a rectangle based actor
 *
 *       var actor = new b5.RectActor();
 *       actor.fill_style = "#40ff4f";   // Set fill style
 *       actor.filled = true;            // Set filled
 *       actor.w = 100;
 *       actor.h = 100;
 *       actor.corner_radius = 10;       // Set corner radius
 *       scene.addActor(actor);          // Add actor to scene for processing and drawing
 *
 * For a complete overview of the Actor class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actors/ Booty5 Actor Overview}
 *
 * @class b5.RectActor
 * @augments b5.Actor
 * @constructor
 * @returns {b5.RectActor} The created RectActor
 *
 * @property {string}                   fill_style                          - Style used to fill the rect (default is #ffffff)
 * @property {string}                   stroke_style                        - Stroke used to draw none filled rect (default is #ffffff)
 * @property {number}                   stroke_thickness                    - Stroke thickness for none filled (default is #ffffff)
 * @property {boolean}                  filled                              - If true then rect interior will be filled otherwise empty (default is true)
 * @property {boolean}                  stroke_filled                       - If true then stroke will be drawn (default is true)
 * @property {number[]}                 corner_radius                       - The radius iof the rectangles corners
 *
 *
 */
b5.RectActor = function()
{
    // Public variables
    this.fill_style = "#ffffff";            // Style used to fill the arc
    this.stroke_style = "#ffffff";          // Stroke used to draw none filled arc
    this.stroke_thickness = 1;              // Stroke thickness for none filled
    this.corner_radius = 0;                 // Corner radius
    this.filled = true;				        // if true then interior will filled otherwise empty
    this.stroke_filled = false;				// if true then a stroke will be drawn
    
    // Call constructor
    b5.Actor.call(this);

    this.type = b5.Actor.Type_Rect;    // Type of actor
};
b5.RectActor.prototype = new b5.Actor();
b5.RectActor.prototype.constructor = b5.RectActor;
b5.RectActor.prototype.parent = b5.Actor.prototype;

b5.RectActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

/**
 * Overrides the base {@link b5.Actor}.draw() method to draw an rectangle instead of an image
 */
b5.RectActor.prototype.draw = function()
{
    if (!this.visible)
        return;

    if (this.cache)
    {
        this.drawToCache();
        this.cache = false;
    }
    if (this.merge_cache)   // If merged into parent ache then parent will have drawn so no need to draw again
	{
		this.drawChildren(false);
		this.drawChildren(true);
		return;
	}

    this.updateTransform();
	// Draw child actors
    var drawn_all = this.drawChildren(false);
    
    // Render the actor
    var cache = this.cache_canvas;
    var scene = this.scene;
    var app = scene.app;
    var dscale = app.canvas_scale;
    var disp = app.display;
    if (cache === null)
    {
        if (this.filled && this.fill_style !== "")
            disp.setFillStyle(this.fill_style);
        if (this.stroke_filled && this.stroke_style !== "")
            disp.setStrokeStyle(this.stroke_style);
        if (this.stroke_filled)
            disp.setLineWidth(this.stroke_thickness);
    }

    var mx = app.canvas_cx + scene.x * dscale;
    var my = app.canvas_cy + scene.y * dscale;

    var cx = this.w / 2;
    var cy = this.h / 2;

    if (!this.ignore_camera && (this.depth === 0 || this.depth === 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }

    this.preDraw();
    
    var self_clip = this.self_clip;
    var clip_children = this.clip_children;
    var trans = this.transform;
    var tx = trans[4] * dscale + mx;
    var ty = trans[5] * dscale + my;
    if (this.round_pixels)
    {
        cx = (cx + 0.5) | 0;
        cy = (cy + 0.5) | 0;
        tx = (tx + 0.5) | 0;
        ty = (ty + 0.5) | 0;
    }
    disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, tx, ty);

    if (self_clip)
        this.setClipping(-cx, -cy);

    if (cache === null)
    {
        if (this.corner_radius !== 0)
            disp.drawRoundRect(-cx, -cy, this.w, this.h, this.corner_radius, this.filled);
        else
            disp.drawRect(-cx, -cy, this.w, this.h, this.filled);
    }
    else
        disp.drawImage(cache, -cache.width >> 1, -cache.height >> 1);
    this.postDraw();

    if (clip_children)
    {
        if (!self_clip)
            this.setClipping(-cx, -cy);
    }
    else
    if (self_clip)
        disp.restoreContext();

	// Draw child actors
	if (!drawn_all)
		this.drawChildren(true);

    if (clip_children)
        disp.restoreContext();
};

/**
 * Overrides the base {@link b5.Actor}.drawToCache() method to draw a rectangle to a cache
 */
b5.RectActor.prototype.drawToCache = function()
{
    var disp = b5.app.display;
    var cache = null;
    var pad = this.padding * 2;
    var w = this.w + pad;
    var h = this.h + pad;
    var ox = 0;
    var oy = 0;
    if (this.merge_cache)
    {
        var parent = this.findFirstCachedParent();
        if (parent !== null)
        {
            cache = parent.cache_canvas;
            ox = this.x + cache.width / 2 - w/2;
            oy = this.y + cache.height / 2 - h/2;
        }
    }
    if (cache === null)
    {
        var pr = b5.app.pixel_ratio;
        cache = disp.createCache();
/*        if (this.stroke_filled && this.stroke_style !== "")
        {
            w += this.stroke_thickness;
            h += this.stroke_thickness;
            ox = this.stroke_thickness >> 1;
            oy = this.stroke_thickness >> 1;
        }*/
        cache.width = (w * pr) | 0;
        cache.height = (h * pr) | 0;
    }

    disp.setCache(cache);
    // Render the actor
	this.preDrawCached();
    if (this.filled && this.fill_style !== "")
        disp.setFillStyle(this.fill_style);
    if (this.stroke_filled && this.stroke_style !== "")
        disp.setStrokeStyle(this.stroke_style);
    if (this.stroke_filled)
        disp.setLineWidth(this.stroke_thickness);

    disp.setTransform(1,0,0,1, ox + w / 2, oy + h / 2);
    if (this.corner_radius !== 0)
        disp.drawRoundRect(-w / 2, -h / 2, this.w, this.h, this.corner_radius, this.filled);
    else
        disp.drawRect(-w / 2, -h / 2, this.w, this.h, this.filled);
	this.postDrawCached();
    disp.setCache(null);

    this.cache_canvas = cache;
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * A MapActor is derived from a {@link b5.Actor} that displays tiled map game objects instead of a single image and
 * inherits all properties, methods and so forth from its parent. A MapActor should be added to a {@link b5.Scene}
 * or another {@link b5.Actor} that is part of a scene hierarchy
 *
 * <b>Examples</b>
 *
 * Example showing how to create a MapActor:
 *
 *      var map = new b5.MapActor();         // Create instance of actor
 *      map.map_width = 100;                 // Set map width in cells
 *      map.map_height = 100;                // Set map height in cells
 *      map.display_width = 16;              // Set how many cells to display on x axis
 *      map.display_height = 16;             // Set how many cells to display on y axis
 *      map.generateTiles(32, 64, 64, 256);  // Generate the tile set
 *      map.bitmap = new b5.Bitmap("tiles", "testmap.png", true);   // Set tile set bitmap
 *      for (var t = 0; t &lt; map.map_width * map.map_height; t++) // Generate a random map
 *      map.map.push((Math.random() * 32) &lt;&lt; 0);
 *      scene.addActor(map);                  // Add to scene for processing and drawing
 *
 * For a complete overview of the Actor class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actors/ Booty5 Actor Overview}
 *
 * @class b5.MapActor
 * @augments b5.Actor
 * @constructor
 * @returns {b5.MapActor} The created MapActor
 *
 * @property {object[]}                 tiles                               - Array of tiles (tiles contain x,y offsets of each tile in source bitmap)
 * @property {number[]}                 map                                 - Array of tile indices, each index is an index into the tile set
 * @property {number[]}                 collision_map                       - Array of collision tile indices
 * @property {number}                   tile_width                          - Width of each tile
 * @property {number}                   tile_height                         - Height of each tiles
 * @property {number}                   map_width                           - Width of map in tiles
 * @property {number}                   map_height                          - Height of map in tiles
 * @property {number}                   display_width                       - Map display width in tiles
 * @property {number}                   display_height                      - Map display height in tiles
 *
 */

b5.MapActor = function()
{
    // Public variables
    this.tiles = [];                        // Array of tiles (tiles contain x,y offsets of each tile in source bitmap)
    this.map = [];                          // Array of tile indices
    this.collision_map = [];                // Array of collision tile indices
    this.tile_width = 32;                   // Width of each tile
    this.tile_height = 32;                  // Height of each tiles
    this.map_width = 0;                     // Width of map in tiles
    this.map_height = 0;                    // Height of map in tiles
    this.display_width = 8;                 // Map display width in tiles
    this.display_height = 8;                // Map display height in tiles

    // Call constructor
    b5.Actor.call(this);

    this.type = b5.Actor.Type_Map;    // Type of actor
};
b5.MapActor.prototype = new b5.Actor();
b5.MapActor.prototype.constructor = b5.MapActor;
b5.MapActor.prototype.parent = b5.Actor.prototype;

b5.MapActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

/**
 * Generates a group of tiles (a tile set) from the supplied parameters
 * @param count {number}    Total number of tiles to generate
 * @param tile_w {number}   Width of each tile
 * @param tile_h {number}   Height of each tile
 * @param bitmap_w {number} Width of tile set bitmap
 */
b5.MapActor.prototype.generateTiles = function(count, tile_w, tile_h, bitmap_w)
{
    var px = 0.5;
    var py = 0.5;
    for (var t = 0; t < count; t++)
    {
        this.tiles[t] = {x: px, y:py};
        px += tile_w;
        if (px >= bitmap_w)
        {
            px = 0.5;
            py += tile_h;
        }
    }
    this.tile_width = tile_w;
    this.tile_height = tile_h;
};

/**
 * Sets the tile at map cell x,y
 * @param x {number} Map horizontal cell coordinate
 * @param y {number} Map vertical cell coordinate
 * @param tile {number} Tile number to set to cell
 * @param collision {boolean} If true then tile in the collision map will be written instead of visual map
 */
b5.MapActor.prototype.setTile = function(x, y, tile, collision)
{
    var mapw = this.map_width;
    var maph = this.map_height;
    if (x < 0 || x >= mapw)
        return;
    if (y < 0 || y >= maph)
        return;

    if (collision !== undefined && collision)
        this.collision_map[y * mapw + x] = tile;
    else
        this.map[y * mapw + x] = tile;
};

/**
 * Gets the tile index at map cell x,y
 * @param x {number} Map horizontal cell coordinate
 * @param y {number} Map vertical cell coordinate
 * @param collision {boolean} If true then returned tile will be taken from collision map instead of visual map
 * @returns {number} The tile index
 */
b5.MapActor.prototype.getTile = function(x, y, collision)
{
    var mapw = this.map_width;
    var maph = this.map_height;
    if (x < 0 || x >= mapw)
        return -1;
    if (y < 0 || y >= maph)
        return -1;

    if (collision !== undefined && collision)
        return this.collision_map[y * mapw + x];

    return this.map[y * mapw + x];
};

/**
 * Converts the supplied scene coordinate to a map cell coordinate
 * @param x {number} x-axis coordinate in scene space
 * @param y {number} y-axis coordinate in scene space
 * @returns {{x: number, y: number}} Map cell coordinate {x, y}
 */
b5.MapActor.prototype.getTileXY = function(x, y)
{
    var mapw = this.map_width;
    var maph = this.map_height;
    var tilew = this.tile_width;
    var tileh = this.tile_height;

    return {
        x: Math.round((x - tilew / 2) / tilew) + (mapw >> 1),
        y: Math.round((y - tileh / 2) / tileh) + (maph >> 1)
    };
};

/**
 * Calculates the scene coordinate for the specified edge of a tile. The supplied position can be one of the following:
 *
 * @param x {number} x-axis coordinate in scene space
 * @param y {number} y-axis coordinate in scene space
 * @param position {string} Can be one of the following strings:
 *
 * - "t" - Returns coordinate of top edge of tile
 * - "m" - Returns coordinate of middle of tile
 * - "b" - Returns coordinate of bottom edge of tile
 * - "l" - Returns coordinate of left edge of tile
 * - "c" - Returns coordinate of centre of tile
 * - "r" - Returns coordinate of right edge of tile
 *
 * @returns {{x: number, y: number}} The tiles coordinate {x, y}
 */
b5.MapActor.prototype.getTilePosition = function(x, y, position)
{
    var tilew = this.tile_width;
    var tileh = this.tile_height;
    var xy = this.getTileXY(x, y);
    xy.x -= this.map_width >> 1;
    xy.y -= this.map_height >> 1;
    xy.x *= tilew;
    xy.y *= tileh;

    if (position === "m")
        xy.y += tileh / 2;
    else if (position === "b")
        xy.y += tileh;
    else if (position === "c")
        xy.x += tilew / 2;
    else if (position === "r")
        xy.x += tilew;

    return xy;
};

/**
 * Gets the map tile at cell position x, y
 * @param {number} x Scene coordinate on x-axis
 * @param {number} y Scene coordinate on y-axis
 * @param collision {boolean} If true then returned tile will be taken from collision map instead of visual map
 * @returns {number|*}
 */
b5.MapActor.prototype.getTileFromPosition = function(x, y, collision)
{
    var xy = this.getTileXY(x, y);
    return this.getTile(xy.x, xy.y, collision);
};

/**
 * Overrides the base {@link b5.Actor}.draw() method to draw a tiled map instead of an image
 */
b5.MapActor.prototype.draw = function()
{
    if (!this.visible)
        return;

    var scene = this.scene;
    var app = scene.app;
    var dscale = app.canvas_scale;
    var disp = app.display;

    var mx = app.canvas_cx + scene.x * dscale;
    var my = app.canvas_cy + scene.y * dscale;

    if (!this.ignore_camera && (this.depth === 0 || this.depth === 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }
    this.updateTransform();
	// Draw child actors
    var drawn_all = this.drawChildren(false);
    this.preDraw();
    
    var trans = this.transform;
    var tx = trans[4] * dscale + mx;
    var ty = trans[5] * dscale + my;
    if (this.round_pixels)
    {
        tx = (tx + 0.5) | 0;
        ty = (ty + 0.5) | 0;
    }
    disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, tx, ty);

    var x, y, ti, tile;
    var mapw = this.map_width;
    var maph = this.map_height;
    var tilew = this.tile_width;
    var tileh = this.tile_height;
    var map = this.map;
    var tiles = this.tiles;
    var bitmap;
    if (this.bitmap !== null)
        bitmap = this.bitmap;
    else
    if (this.atlas !== null)
        bitmap = this.atlas.bitmap;
    var image = bitmap.image;

    var dx = this.display_width;
    var dy = this.display_height;

    // Calculate tile at top left hand corner of visible map area
    if (dx !== mapw)
        mx = ((((scene.camera_x - this.x) / tilew) - (dx >> 1)) + 0.5) | 0;
    else
        mx = -dx >> 1;
    var omx = mx;
    if (dy !== maph)
        my = ((((scene.camera_y - this.y) / tileh) - (dy >> 1)) + 0.5) | 0;
    else
        my = -dy >> 1;

    // Calculate offset in scene
    var sx = mx * tilew;
    var osx = sx;
    var sy = my * tileh;

    // Centre map
    mx += mapw >> 1;
    omx = mx;
    my += maph >> 1;

    // Draw tiles
    for (y = 0; y < dy; y++)
    {
        if (my >= 0 && my < maph)
        {
            mx = omx;
            sx = osx;
            for (x = 0; x < dx; x++)
            {
                if (mx >= 0)
                {
                    ti = map[my * mapw + mx];
                    tile = tiles[ti];
                    disp.drawAtlasImage(image, tile.x, tile.y, tilew - 1, tileh - 1, sx, sy, tilew + 1, tileh + 1);
                }
                sx += tilew;
                mx++;
                if (mx >= mapw)
                    break;
            }
        }
        sy += tileh;
        my++;
        if (my >= maph)
            break;
    }

    this.postDraw();

	// Draw child actors
	if (!drawn_all)
		this.drawChildren(true);
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * App is the main application controller and is responsible for general housekeeping and {@link b5.Scene} processing, You should
 * create a single instance of App object and assign it to b5.app. Scenes should then be created to hold your
 * content then added to this instance of the app. App has the following features:
 *
 * - Manages global resources
 * - Manages a collection of Scenes
 * - Manages a collection of Action Lists
 * - Manages an events manager for global events
 * - Manages a task manager
 * - Handles touch input and keyboard
 * - Finds which Actor was touched when user touches / clicks the screen
 * - Logic loop processing
 * - Render loop processing
 * - Manages global animation Timelines via a TimelineManager
 * - Controls rescaling of canvas to best fit to different display sizes
 * - Tracks time and measures frame rate
 *
 * <b>Examples</b>
 *
 * Example showing how to set up the main app:
 *
 *      window.onload = function()
 *      {
 *          // Create the app
 *          var app = new b5.App(document.getElementById('mycanvas'));
 *          app.debug = false;
 *          app.setCanvasScalingMethod(b5.App.FitBest);
 *          // Start main loop
 *          app.start();
 *      };
 *
 * Example showing how to set up the main app using a loading screen:
 *
 *      window.onload = function()
 *      {
 *          // Create the app
 *          var app = new b5.App(document.getElementById('mycanvas'));
 *          app.debug = false;
 *          app.setCanvasScalingMethod(b5.App.FitBest);
 *          // Wait for resources to load then start app
 *          app.waitForResources();
 *      };
 *
 * Adding a global app resource example
 *
 *      var material = new b5.Material("static_bounce");
 *      material.restitution = 1;
 *      b5.app.addResource(material, "Material");
 *
 * Finding a global app resource example
 *
 *      var material = b5.app.findResource("static_bounce", "Material");
 *
 * Destroying a global app resource example
 *
 *      // If we do not have a reference to the resource then we can find and remove it
 *      b5.app.destroyResource("static_bounce", "Material");
 *
 *      // If we already have reference to the material then we can destroy it through itself
 *      material.destroy();
 *
 * Setting up a loading screen example
 *
 *      // Set up a loading screen object
 *      b5.app.loading_screen = {
 *           background_fill: "#fffff",         // Loading background fill style
 *           background_image: "loading.png",   // Loading background image
 *           bar_background_fill: "#8080ff",    // Loading bar background fill style
 *           bar_fill: "#ffffff"                // Loading bar fill style
 *      };
 *
 *
 * For a complete overview of the App class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/theapp/ Booty5 App Overview}
 *
 * @class App
 * @param canvas {object}       The HTML5 canvas that will receive the apps rendering
 * @param web_audio {boolean}   If true then web audio will be used if available
 * @constructor
 * @returns {b5.App} The created App
 *
 * @property {b5.Scene[]}              removals                     - Array of scenes that were deleted last frame (internal)
 * @property {object}                  timer                        - Logic main loop timer (internal)
 * @property {number}                  pixel_ratio                  - Device pixel ratio (internal)
 * @property {number}                  design_width                 - The design width of the virtual canvas (internal)
 * @property {number}                  design_height                - The design height of the virtual canvas (internal)
 * @property {number}                  display_width                - The width of the rendering area (internal)
 * @property {number}                  display_height               - The height of the rendering area (internal)
 * @property {number}                  canvas_scale_method          - Virtual canvas scaling method (internal)
 * @property {number}                  canvas_scale                 - Canvas to client scaling (internal)
 * @property {number}                  canvas_cx                    - Canvas x axis centre on display (internal)
 * @property {number}                  canvas_cy                    - Canvas y axis centre on display (internal)
 * @property {boolean}                 order_changed                - Set to true when scenes change order (internal)
 * @property {object}                  last_time                    - Time of last frame (internal)
 * @property {b5.Scene[]}              scenes                       - An array of all Scenes (internal)
 * @property {object}                  canvas                       - The HTML5 canvas (internal)
 * @property {b5.Bitmap[]}             bitmaps                      - Bitmap resources (internal)
 * @property {object[]}                brushes                      - Brush resources (internal)
 * @property {b5.Shape[]}              shapes                       - Shape resources (internal)
 * @property {b5.Material[]}           materials                    - Material resources (internal)
 * @property {b5.Sound[]}              sounds                       - Audio resources (internal)
 * @property {b5.Font[]}               fonts                        - Font resources (internal)
 * @property {b5.Raw[]}                raw                          - Raw JSON resources (internal)
 * @property {number}                  avg_time                     - Total time since last measure (internal)
 * @property {number}                  avg_frame                    - Counter used to measure average frame rate (internal)
 * @property {bool}                    mobile                       - True if mobile platform
 * @property {string}                  platform                     - Client platform
 *
 * @property {boolean}                 touch_supported              - If true then touch input is supported
 * @property {boolean}                 allow_touchables             - if true then app will search to find Actor that was touched (default is true)
 * @property {boolean}                 touched                      - true if the screen is being touched, false otherwise
 * @property {object}                  touch_pos                    - x, y  position of last screen touch
 * @property {number}                  touch_drag_x                 - Amount touch position was last dragged on x axis
 * @property {number}                  touch_drag_y                 - Amount touch position was last dragged on y axis
 * @property {b5.Scene}                focus_scene                  - Scene that has current input focus, if set via _focus_scene then instance of Scene or string based path to Scene can be used
 * @property {b5.Scene}                focus_scene2                 - Scene that has will receive touch events if focus scene does not process them, if set via _focus_scene2 then instance of Scene or string based path to Scene can be used
 * @property {b5.Actor}                touch_focus                  - The Actor that has the current touch focus
 * @property {number}                  global_scale                 - Global scale
 * @property {booean}                  prevent_default              - Set to true to prevent bropwser from receiving touch events
 * @property {booean}                  fill_screen                  - Set to true to fill client window
 * @property {boolean}                 disable_dock_screen          - If true then screen docking is disabled
 * @property {number}                  dt                           - Last frame time delta
 * @property {number}                  avg_fps                      - Average frames per second of app
 * @property {number}                  total_loaded                 - Total pre-loadable resources that have been loaded
 * @property {number}                  total_load_errors            - Total pre-loadable resource load errors
 * @property {number}                  target_frame_rate            - Frame rate at which to update the game (0 for measured) (default is 50)
 * @property {boolean}                 adaptive_physics             - When true physics update will be ran more than once if frame rate falls below target (default is true)
 * @property {boolean}                 debug                        - Can be used to enable / disable debug trace info (default is false)
 * @property {boolean}                 box2d                        - True if Box2D module is present
 * @property {b5.TimelineManager}      timelines                    - Global animation timeline manager
 * @property {b5.ActionsListManager}   actions                      - Global actions list manager
 * @property {b5.EventsManager}        events                       - Global events manager
 * @property {b5.TasksManager}         tasks                        - Global tasks manager
 * @property {object}                  loading_screen               - Loading screen object
 *      @property {String}                  loading_screen.background_fill               - Loading screen background fill (default is #ffffff)
 *      @property {String}                  loading_screen.background_image              - Loading screen background image (default is loading.png)
 *      @property {String}                  loading_screen.bar_background_fill           - Loading screen loading bar background fill (default is #8080ff)
 *      @property {String}                  loading_screen.bar_fill                      - Loading screen loading bar fill (default is #ffffff)
 * @property {b5.Display}              display                      - Rendering module
 * @property {boolean}                 clear_canvas                 - If true then canvas will be cleared each frame (default is false)
 * @property {boolean}                 use_web_audio                - If true then Web Audio will be used if its available (default is true)
 * @property {boolean}                 shared_world                 - If true then box2d world is shared across all scenes
 * @property {number}                  time_step                    - Physics time step used when using global box2d world
 * @property {function}                started                      - Function that will be called when the app starts
 * @property {number}                  num_logic                    - Number of times that the logic loop has been ran since app start
 * @property {number}                  num_draw                     - Number of times that the draw loop has been ran since app start
 * @property {function}                onAppPaused                  - Called when application enters a paused state or resumes from a paused state
 *
 */
b5.App = function(canvas, web_audio)
{
    b5.app = this;

    // Internal variables
    this.removals = [];             // Array of scenes that were deleted last frame
    this.touched = false;           // true if the screen is being touched, false otherwise
    this.touch_pos = {x:0, y:0};    // Position of last screen touch
    this.touch_drag_x = 0;          // Amount touch position was last dragged on x axis
    this.touch_drag_y = 0;          // Amount touch position was last dragged on y axis
    this.timer = null;				// Logic main loop timer
    this.last_time = Date.now();    // Time of last frame in ms
    this.dt = 0;                    // Last frame time delta
    this.avg_time = 0;              // Total time since last measure
    this.avg_fps = 60;              // Average frames per second of app
    this.avg_frame = 0;             // Counter used to measure average frame rate
    this.canvas_scale = 1;                      // Canvas to client scaling
    this.pixel_ratio = 1;                       // Device pixel ratio
    this.design_width = canvas.width;           // The width of the virtual canvas
    this.design_height = canvas.height;         // The height of the virtual canvas
    this.display_width = canvas.width;          // The width of the rendering area
    this.display_height = canvas.height;        // The height of the rendering area
    this.canvas_cx = this.design_width >> 1;    // Canvas x axis centre on display
    this.canvas_cy = this.design_height >> 1;   // Canvas y axis centre on display
    this.order_changed = true;      // Set to true when scenes change order
    this.total_loaded = 0;          // Total pre-loadable resources that have been loaded
    this.total_load_errors = 0;     // Total pre-loadable resource load errors
	this.inner_width = b5.Display.getWidth();
    this.inner_height = b5.Display.getHeight();
    this.fill_screen = false;       // Set to true to fill client window
    this.disable_dock_screen = false;
    this.started = null;            // Function callback which is called when the app starts
    this.num_logic = 0;             // Number of times the logic loop has been ran since app start
    this.num_draw = 0;              // Number of times the draw  loop has been ran since app start
    this.world = null;
    
    // Public variables
    this.scenes = [];               // An array of Scenes
    this.canvas = canvas;			// The HTML5 canvas
    this.canvas_scale_method = b5.App.FitNone;  // Virtual canvas scaling method
    this.touch_supported = this.isTouchSupported();
    this.allow_touchables = true;	// if true then app will search to find Actor that was touched
    this.target_frame_rate = 60;	// Frame rate at which to update the game (o for measured)
    this.adaptive_physics = false;  // When true physics update will be ran more than once if frame rate falls below target
    this.focus_scene = null;		// Scene that has current input focus
    this.focus_scene2 = null;		// Scene that has will receive touch events if focus scene does not process them
    this.hover_focus = null;        // Actor with current hover focus
    this.clear_canvas = false;		// If true then canvas will be cleared each frame
    this.touch_focus = null;		// The Actor that has the current touch focus
    this.global_scale = 1;          // 
    this.prevent_default = false;   // Set to true to prevent bropwser from receiving touch events
    this.debug = false;				// Can be used to enable / disable debug trace info
    this.timelines = new b5.TimelineManager();	// Global animation timeline manager
    if (b5.ActionsListManager !== undefined)
        this.actions = new b5.ActionsListManager(); // Global actions list manager
    this.events = new b5.EventsManager();       // Global events manager
    this.tasks = new b5.TasksManager();         // Global tasks manager
    this.box2d = typeof Box2D != "undefined";   // True if Box2D module is present
    this.instants = typeof FBInstant != "undefined";    // True for Facebook Instant Game
    this.loading_screen = {
        background_fill: "#fffff",              // Loading background fill style
        background_image: "loading.png",        // Loading background image
        bar_background_fill: "#8080ff",         // Loading bar background fill style
        bar_fill: "#ffffff"                     // Loading bar fill style
    };

    this.use_web_audio = web_audio || true;     // If true then Web Audio will be used if its available (default is true)
    this.shared_world = false;
    this.time_step = 0.03333;
    this.mobile = b5.Utils.IsMobile();
    this.platform = b5.Utils.GetPlatform();
    
    // Resources
    this.bitmaps = {};				// Bitmap resources
    this.brushes = {};				// Brush resources
    this.shapes = {};				// Shape resources
    this.materials = {};			// Material resources
    this.sounds = {};				// Audio resources
    this.fonts = {};				// Font resources
    this.raw = {};				    // Raw JSON resources
    this.onResourceLoaded = function(resource, error)
    {
        this.onResourceLoadedBase(resource, error);
    };

    // Create the 2D canvas
    this.display = new b5.Display(this.canvas);

    // Init audio
    this.use_web_audio = b5.Sound.init(this);

    // Set up touch / mouse event handlers
    if (window.navigator.msPointerEnabled)
    {   // WP8
        canvas.addEventListener("MSPointerDown", this.onTouchStart, false);
        canvas.addEventListener("MSPointerMove", this.onTouchMove, false);
        canvas.addEventListener("MSPointerUp", this.onTouchEnd, false);
    }
    else
    {
//    if (this.touch_supported)
//    {
        canvas.addEventListener("touchstart", this.onTouchStart, false);
        canvas.addEventListener("touchmove", this.onTouchMove, false);
        canvas.addEventListener("touchend", this.onTouchEnd, false);
/*    }
    else
    {*/
        canvas.addEventListener("mousedown", this.onTouchStart, false);
        canvas.addEventListener("mousemove", this.onTouchMove, false);
        canvas.addEventListener("mouseup", this.onTouchEnd, false);
        canvas.addEventListener("mouseout", this.onTouchEnd, false);
//    }
    }
    var wheel_event =   "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
                        document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
                        "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox
    canvas.addEventListener(wheel_event, this.onWheel, false);
    window.addEventListener("keypress", this.onKeyPress, false);
    window.addEventListener("keydown", this.onKeyDown, false);
    window.addEventListener("keyup", this.onKeyUp, false);

    Visibility.change(function (e, state) {
        if (b5.app.onAppPaused !== undefined)
        {
            if (state === "hidden")
                b5.app.onAppPaused(true);
            else
            if (state === "visible")
                b5.app.onAppPaused(false);
        }
    });

/*    this.resize = function(event)
    {
        b5.app.setCanvasScalingMethod();
    };
    this.orientationChange = function(event)
    {
        b5.app.setCanvasScalingMethod();
    };
    window.addEventListener("resize", this.resize);
    window.addEventListener("orientationchange", this.orientationChange);*/
};

Object.defineProperty(b5.App.prototype, "_focus_scene", {
    get: function() { return this.focus_scene; },
    set: function(value) { if (this.focus_scene !== value) { this.focus_scene = b5.Utils.resolveObject(value); } }
});
Object.defineProperty(b5.App.prototype, "_focus_scene2", {
    get: function() { return this.focus_scene2; },
    set: function(value) { if (this.focus_scene2 !== value) { this.focus_scene2 = b5.Utils.resolveObject(value); } }
});


// Virtual canvas scaling methods
/**
 * No scaling of rendering or resizing of canvas.
 * @constant
 */
b5.App.FitNone = 0;
/**
 * The canvas is resized to fit the client area. Rendering is scaled to fit best on the x-axis.
 * @constant
 */
b5.App.FitX = 1;
/**
 * The canvas is resized to fit the client area. Rendering is scaled to fit best on the y-axis.
 * @constant
 */
b5.App.FitY = 2;
/**
 * The canvas is resized to fit the client area. Rendering is scaled to fit either the x or y axis depending on which retains most information.
 * @constant
 */
b5.App.FitBest = 3;
/**
 * The canvas is resized to fit the client area. rendering is not scaled.
 * @constant
 */
b5.App.FitSize = 4;
/**
 * The canvas is resized to fit the greatest of the client areas axis.
 * @constant
 */
b5.App.FitGreatest = 5;
/**
 * The canvas is resized to fit the smallest of the client areas axis.
 * @constant
 */
b5.App.FitSmallest = 6;
/**
 * The canvas is resized to fit the client area. Rendering is scaled to fit either the x or y axis depending on which retains least information.
 * @constant
 */
b5.App.FitBest2 = 7;

//
// Keyboard handling
//
/**
 * Callback that is called when the user presses a key, key event is passed onto the current focus scene
 * @private
 * @param event {object} The key event
 */
b5.App.prototype.onKeyPress = function(event)
{
    var app = b5.app;
    if (app.focus_scene != null)
        app.focus_scene.onKeyPressBase(event);
};
/**
 * Callback that is called when the user presses down a key, key event is passed onto the current focus scene
 * @private
 * @param event {object} The key event
 */
b5.App.prototype.onKeyDown = function(event)
{
    var app = b5.app;
    if (app.focus_scene != null)
        app.focus_scene.onKeyDownBase(event);
};
/**
 * Callback that is called when the user releases a key, key event is passed onto the current focus scene
 * @private
 * @param event {object} The key event
 */
b5.App.prototype.onKeyUp = function(event)
{
    var app = b5.app;
    if (app.focus_scene != null)
        app.focus_scene.onKeyUpBase(event);
};

//
// Touch handling
//
/**
 * Utility method that checks to see if touch input is supported
 * @private
 * @returns {boolean} true if touch is supported, false if not
 */
b5.App.prototype.isTouchSupported = function()
{
    var msTouchEnabled = window.navigator.msMaxTouchPoints;
//    var generalTouchEnabled = "ontouchstart" in document.createElement("div");
    var generalTouchEnabled = "ontouchstart" in this.canvas;

    if (msTouchEnabled || generalTouchEnabled)
        return true;
    return false;
};

/**
 * Callback that is called when the user touches the screen, touch position is passed onto focus and secondary focus
 * scenes. If user touched an actor then the actors onBeginTouchBase callback handler will be called.
 * @private
 * @param e {object} Touch event object
 */
b5.App.prototype.onTouchStart = function(e)
{
    var app = b5.app;
    if (app.touch_supported)
    {
        e.stopPropagation();
        if (app.prevent_default)
            e.preventDefault();
    }

    // Get touch pos
    var focus1 = app.focus_scene;
    var focus2 = app.focus_scene2;
    var display = app.display;
    app.touched = true;
    if (app.touch_supported && e.changedTouches !== undefined)
        app.touch_pos = display.getCanvasPoint(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
    else
        app.touch_pos = display.getCanvasPoint(e.pageX, e.pageY);

    // Handle scene touch
    if (focus1 != null)
        focus1.onBeginTouchBase(app.touch_pos);
    if (focus2 != null)
        focus2.onBeginTouchBase(app.touch_pos);

    // Handle actor touch
    if (app.allow_touchables)
    {
        var actor = app.findHitActor(app.touch_pos);
        if (actor != null)
        {
            app.touch_focus = actor;
            actor.onBeginTouchBase(app.touch_pos);
        }
    }
};

/**
 * Callback that is called when the user stops touches the screen, touch position is passed onto focus and secondary
 * focus scenes. If user is touching an actor then the actors onEndTouchBase callback handler will be called.
 * If the touched actor has the current touch focus then the actors onLostTouchFocus callback will be called
 * @private
 * @param e {object} Touch event object
 */
b5.App.prototype.onTouchEnd = function(e)
{
    var app = b5.app;
	b5.Sound.unblock();
    if (app.touch_supported)
    {
        e.stopPropagation();
        if (app.prevent_default)
            e.preventDefault();
    }

    // Get touch pos
    var focus1 = app.focus_scene;
    var focus2 = app.focus_scene2;
    var display = app.display;
    app.touched = false;
    if (app.touch_supported && e.changedTouches !== undefined)
        app.touch_pos = display.getCanvasPoint(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
    else
        app.touch_pos = display.getCanvasPoint(e.pageX, e.pageY);

    // Handle scene touch
    if (focus1 != null)
        focus1.onEndTouchBase(app.touch_pos);
    if (focus2 != null)
        focus2.onEndTouchBase(app.touch_pos);

    // Handle actor touch
    if (app.allow_touchables)
    {
        var actor = app.findHitActor(app.touch_pos);
        if (actor != null)
            actor.onEndTouchBase(app.touch_pos);
        if (app.touch_focus != null)
        {
            if (app.touch_focus.onLostTouchFocus !== undefined)
                app.touch_focus.onLostTouchFocus(app.touch_pos);
            app.touch_focus = null;
        }
    }
};
/**
 * Callback that is called when the user moves a touch on the screen, touch position is passed onto focus and secondary
 * focus scenes. If user is touchimg an actor then the actors onMoveTouchBase callback handler will be called.
 * @private
 * @param e {object} Touch event object
 */
b5.App.prototype.onTouchMove = function(e)
{
    var app = b5.app;
    if (app.touch_supported)
    {
        e.stopPropagation();
        if (app.prevent_default)
            e.preventDefault();
    }
    // Get touch pos and drag
    var focus1 = app.focus_scene;
    var focus2 = app.focus_scene2;
    var old_x = app.touch_pos.x;
    var old_y = app.touch_pos.y;
    var display = app.display;
    if (app.touch_supported && e.changedTouches !== undefined)
        app.touch_pos = display.getCanvasPoint(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
    else
        app.touch_pos = display.getCanvasPoint(e.pageX, e.pageY);
    app.raw_touch_x = e.pageX;
    app.raw_touch_y = e.pageY;
    app.touch_drag_x = old_x - app.touch_pos.x;
    app.touch_drag_y = old_y - app.touch_pos.y;

    // Handle scene touch
    if (focus1 != null)
        focus1.onMoveTouchBase(app.touch_pos);
    if (focus2 != null)
        focus2.onMoveTouchBase(app.touch_pos);

    // Handle actor touch (could be performance hog)
    if (app.allow_touchables)
    {
        var actor = app.findHitActor(app.touch_pos);
        if (actor != null)
            actor.onMoveTouchBase(app.touch_pos);
        if (app.hover_focus !== null)
        {
            if (app.hover_focus.onHover !== undefined)
                app.hover_focus.onHoverEnd(app.touch_pos);
        }
        app.hover_focus = actor;
        if (actor !== null && actor.onHover !== undefined)
            actor.onHover(app.touch_pos);
    }
};

/**
 * Callback that is called when the mouse wheel is used
 * @private
 * @param e {object} Touch event object
 */
b5.App.prototype.onWheel = function(e)
{
    var app = b5.app;
    if (app.touch_supported)
    {
        e.stopPropagation();
        if (app.prevent_default)
            e.preventDefault();
    }

    // Get touch pos
    var focus1 = app.focus_scene;
    var focus2 = app.focus_scene2;

    // Handle scene touch
    if (focus1 != null)
        focus1.onWheelBase(e);
    if (focus2 != null)
        focus2.onWheelBase(e);
};

//
// Scene management
//
/**
 * Adds a scene to this App for processing and display
 * @param scene {b5.Scene} The scene to add
 * @returns {object} The added scene
 */
b5.App.prototype.addScene = function(scene)
{
    this.scenes.push(scene);
    scene.app = this;
    return scene;
};

/**
 * Removes the specified scene from the app destroying it. Note that the scene is not removed immediately, instead it is removed when the end of the frame is reached
 * @param scene {b5.Scene} The scene to add
 */
b5.App.prototype.removeScene = function(scene)
{
    if (this.focus_scene == scene)
        this.focus_scene = null;
    this.removals.push(scene);
};

/**
 * Cleans up all destroyed scenes, this is called by the app to clean up any removed scenes at the end of its update cycle
 * @private
 */
b5.App.prototype.cleanupDestroyedScenes = function()
{
    var dcount = this.removals.length;
    if (dcount > 0)
    {
        var removals = this.removals;
        var scenes = this.scenes;
        var count = scenes.length;
        for (var s = 0; s < dcount; s++)
        {
            var dscene = removals[s];
            for (var t = 0; t < count; t++)
            {
                if (dscene == scenes[t])
                {
                    dscene.release();
                    scenes.splice(t, 1);
                    count--;
                    break;
                }
            }
        }
    }
    this.removals = [];
};

/**
 * Searches this App for the named scene
 * @param name {string} Name of the scene to find
 * @returns {b5.Scene}The found scene object or null for scene not found
 */
b5.App.prototype.findScene = function(name)
{
    var scenes = this.scenes;
    var count = scenes.length;
    for (var t = 0; t < count; t++)
    {
        if (scenes[t].name == name)
            return scenes[t];
    }
    return null;
};

//
// Resource management
//
/**
 * Adds a resource to the global app resource manager
 * @param resource {object} The resource to add
 * @param type {string} Type of resource to add (brush, sound, shape, material, bitmap or geometry)
 */
b5.App.prototype.addResource = function(resource, type)
{
    var res = b5.Utils.getResFromType(this, type);
    if (res != null)
    {
        //res.push(resource);
        res[resource.name] = resource;
        resource.parent = this;
    }
};

/**
 * Removes a resource from the global app resource manager
 * @param resource {object} The resource to remove
 * @param type {string} Type of resource to add (brush, sound, shape, material, bitmap or geometry)
 */
b5.App.prototype.removeResource = function(resource, type)
{
    var res = b5.Utils.getResFromType(this, type);
    if (res != null)
    {
        res[resource.name] = undefined;
        /*var count = res.length;
        for (var t = 0; t < count; t++)
        {
            if (res[t] == resource)
            {
                res.parent = null;
                res.splice(t, 1);
                return;
            }
        }*/
    }
};

/**
 * Searches the global app resource manager for the named resource
 * @param name {string} Name of resource to find
 * @param type {string} Type of resource to add (brush, sound, shape, material, bitmap or geometry)
 * @returns {object} The found resource or null if not found
 */
b5.App.prototype.findResource = function(name, type)
{
    var res = b5.Utils.getResFromType(this, type);
    if (res == null)
        return null;

/*    var count = res.length;
    for (var t = 0; t < count; t++)
    {
        if (res[t].name === name)
            return res[t];
    }*/
    var r = res[name];
    if (r === undefined)
    {
        if (this.debug)
            console.log("resource '" + name + "' (" + type + ") not found");
        return null;
    }

    return r;
};

/**
 * Returns how many resources that are marked as preloaded still need to be loaded
 * @param include_scenes {boolean} If true then resources within scenes will also be counted
 * @returns {number} Number of resources that still need to loaded
 */
b5.App.prototype.countResourcesNeedLoading = function(include_scenes)
{
    var total = 0;
    var res = this.bitmaps;
    for (var r in res)
    {
        if (res[r].preload)
            total++;
    }

    res = this.sounds;
    for (var r in res)
    {
        if (res[r].preload)
            total++;
    }

    res = this.fonts;
    for (var r in res)
    {
        if (res[r].preload)
            total++;
    }

    res = this.raw;
    for (var r in res)
    {
        if (res[r].preload)
            total++;
    }
    
/*    if (include_scenes)
    {
        var scenes = this.scenes;
        count = scenes.length;
        for (t = 0; t < count; t++)
            total += scenes[t].countResourcesNeedLoading();
    }*/
    return total;
};

/**
 * Callback which is called when a preloaded resource is loaded
 * @param resource {object} The resource that was loaded
 * @param error {boolean} true if there was an error during the loading of the resource
 * @private
 */
b5.App.prototype.onResourceLoadedBase = function(resource, error)
{
    if (resource.preload)
        b5.app.total_loaded++;
    if (error)
    {
        if (resource.preload)
        {
            b5.app.total_load_errors++;
        }
        console.log("Error loading resource " + resource.name);
    }
    else
    {
        if (this.debug)
            console.log("Resource loaded " + resource.name);
    }
    resource.loaded = true;
};

/**
 * Waits for all preloaded resources to load before starting the app, also displays a loading screen and loading bar. Use this in place of calling app.start() directly.
 */
b5.App.prototype.waitForResources = function(update_callback)
{
    // Draw background
    var app = this;
	if (app.loading_screen !== null)
	{
		var disp = app.display;
		var dscale = app.canvas_scale;
		var load_w = 400;
		var load_h = 80;
		disp.setTransform(1, 0, 0, 1, 0, 0);
		disp.setFillStyle(app.loading_screen.background_fill);
		disp.drawRect(0, 0, app.display_width, app.display_height);
		var bg = new Image();
		bg.src = app.loading_screen.background_image;
		bg.onload = function() {
			disp.setTransform(dscale, 0, 0, dscale, app.canvas_cx, app.canvas_cy);
			disp.drawImage(bg, -bg.width >> 1, -bg.height >> 1, bg.width, bg.height);
			disp.setFillStyle(app.loading_screen.bar_background_fill);
			disp.drawRoundRect(-load_w >> 1, (app.canvas_height >> 2) - (load_h >> 1), load_w, load_h, 20, true);
		};
	}

    var total = app.countResourcesNeedLoading(true);
    var tmr = setInterval(function()
    {
        var loaded = b5.app.total_loaded;
        if (loaded >= total)
        {
            if (b5.app.debug)
            {
                console.log("Total resources loaded " + loaded + " of " + total);
                console.log("Total resource load errors " + b5.app.total_load_errors);
            }
            if (update_callback !== undefined)
            {
                update_callback(loaded, total);                
            }

            clearInterval(tmr);
            var tmr2 = setInterval(function()
            {
                // Start main loop
                if (update_callback !== undefined)
                {
                    update_callback(total, total);
                }
                app.start();
                clearInterval(tmr2);
            }, 1000);
        }
		if (app.loading_screen !== null)
		{
			var w = load_w - 20;
			var h = load_h - 20;
			var perc = loaded / total; if (perc > 1) perc = 1;
			var cw = (w * perc) << 0;
			disp.setFillStyle(app.loading_screen.bar_fill);
			disp.drawRoundRect(-w >> 1, (app.canvas_height >> 2) - (h >> 1), cw, h, 10, true);
		}
    }, 100);
};

//
// Rendering
//
/**
 * Renders the app and all of its contained scenes
 */
b5.App.prototype.draw = function()
{
    var scenes = this.scenes;
    var count = scenes.length;
    for (var t = 0; t < count; t++)
        scenes[t].draw();
};

//
// Update
//
/**
 * Updates the app and all of its contained scenes
 * @param dt {number} The amount of time that has passed since this app was last updated
 */
b5.App.prototype.update = function(dt)
{
    var app = b5.app;
    var scenes = this.scenes;
    var count = scenes.length;
    app.dt = dt;
    app.timelines.update(dt);
    if (app.actions !== undefined)
        app.actions.execute();
    app.tasks.execute();
    if (this.world !== null)
    {
        if (this.time_step === 0)
            this.world.Step(dt, 10, 10);		// frame-rate, velocity iterations, position iterations
        else
        {
            var run_count = 1;
            if (this.adaptive_physics)
            {
                run_count = (this.target_frame_rate / this.avg_fps + 0.5) << 0;
                if (run_count < 1)
                    run_count = 1;
                else if (run_count > 3)
                    run_count = 3;
            }
            for (var t = 0; t < run_count; t++)
                this.world.Step(this.time_step, 10, 10);
        }
        if (this.world !== null)
            this.world.ClearForces();
    }
    for (var t = 0; t < count; t++)
        scenes[t].update(dt);
    this.cleanupDestroyedScenes();

    // Re-sort scenes if layers changed
    if (this.order_changed)
    {
        this.order_changed = false;
        b5.Utils.sortLayers(this.scenes);
    }
};

/*b5.App.prototype.mainLoop = function()
{
    if (app.clear_canvas)
        app.display.clear(true);
    app.update(1 / app.target_frame_rate);
    app.draw();
};*/

/**
 * The main app logic loop that updates the apps logic, this is ran on a timer at a rate determined by target_frame_rate
 * @private
 */
b5.App.prototype.mainLogic = function()
{
    var app = b5.app;
    var now = Date.now();
    var delta = now - app.last_time;
    app.last_time = now;
    app.adt = delta / 1000;
	var dt;
    if (app.target_frame_rate === 0)
        dt = app.adt;
    else
        dt = 1 / app.target_frame_rate;
    if (dt > 0.1) dt = 0.1;
	app.update(dt);
    app.avg_time += delta;
    app.avg_frame++;
    if (app.avg_frame == 60)
    {
        app.avg_frame = 0;
        app.avg_fps = 60000 / app.avg_time;
        app.avg_time = 0;
    }
    app.num_logic++;
//    if ((app.avg_frame & 59) == 0)
//        console.log(app.avg_fps);
};

/**
 * The main rendering loop that renders the app, this is called each frame by requestAnimationFrame
 * @private
 */
b5.App.prototype.mainDraw = function()
{
    var app = b5.app;
    var sw = b5.Display.getWidth();
    var sh = b5.Display.getHeight();
    var iw = app.inner_width;
    var ih = app.inner_height;
    var dx = (sw - iw) | 0;
    var dy = (sh - ih) | 0;
    if (dx !== 0 || dy !== 0)
	{
        app.setCanvasScalingMethod();
	}
    app.mainLogic();
	
    if (app.clear_canvas)
        app.display.clear(true);
    app.draw();
    app.num_draw++;
    if (dx !== 0 || dy !== 0)
    {
        if (app.onResize)
            app.onResize(sw, sh, iw, ih);
    }
    requestAnimationFrame(app.mainDraw);
};

/**
 * Starts the app running
 */
b5.App.prototype.start = function()
{
    if (this.started !== null)
        this.started();
//    this.timer = setInterval(this.mainLogic, 1000 / this.target_frame_rate);
    this.mainDraw();
    this.dirty();
};

//
// Utility
//
/**
 * Searches all touchable actors in all app scenes to see if the supplied position hits them
 * @param position {object} The position to hit test
 * @returns {b5.Actor} The actor that was hit or null for no hit
 */
b5.App.prototype.findHitActor = function(position)
{
    var act = null;
    if (this.focus_scene !== null)
        act = this.focus_scene.findHitActor(position);
    if (act === null && this.focus_scene2 !== null)
        act = this.focus_scene2.findHitActor(position);
    return act;
};

/**
 * Dirties the scene and all child actors transforms, forcing them to be rebuilt
 */
b5.App.prototype.dirty = function()
{
    var s = this.scenes;
    var count = s.length;
    for (var t = 0; t < count; t++)
        s[t].dirty();
};

/**
 * Sets the method of scaling rendering to the canvas and how the canvas fits to the client area
 * @param method {number} The method of scaling to use, can be {@link b5.App.FitNone}, {@link b5.App.FitX}, {@link b5.App.FitY}, {@link b5.App.FitBest}, {@link b5.App.FitSize}, {@link b5.App.FitGreatest} or {@link b5.App.FitSmallest}
 */
b5.App.prototype.setCanvasScalingMethod = function(method)
{
    if (method !== undefined)
        this.canvas_scale_method = method;
    var sw = this.design_width;
    var sh = this.design_height;
    var iw = b5.Display.getWidth();
    var ih = b5.Display.getHeight();

    if (!this.fill_screen)
    {
        var major_x = true;
        switch (this.canvas_scale_method)
        {
            case b5.App.FitX:
                major_x = true;
                break;
            case b5.App.FitY:
                major_x = false;
                break;
            case b5.App.FitBest:
                major_x = (iw / sw) < (ih / sh) ? true : false;
                break;
            case b5.App.FitGreatest:
                major_x = (iw > ih) ? true : false;
                break;
            case b5.App.FitSmallest:
                major_x = (iw < ih) ? true : false;
                break;
            case b5.App.FitBest2:
                major_x = (iw / sw) > (ih / sh) ? true : false;
                break;
        }
        if (major_x)
        {
            ih = iw * this.design_height / this.design_width;
        }
        else
        {
            iw = ih * this.design_width / this.design_height;
        }
    }

	this.inner_width = iw;
	this.inner_height = ih;
    var dw = sw;
    var dh = sh;
    var sx = 1;
    var sy = 1;
    this.canvas_scale = this.global_scale;
    if (this.canvas_scale_method === b5.App.FitNone)
    {
    }
    else
    if (this.canvas_scale_method === b5.App.FitSize)
    {
        dw = iw;
        dh = ih;
    }
    else
    {
        dw = iw;
        dh = ih;
        sx = dw / sw;
        sy = dh / sh;
        var scale = 1;
        switch (this.canvas_scale_method)
        {
            case b5.App.FitX:
                scale = sx;
                break;
            case b5.App.FitY:
                scale = sy;
                break;
            case b5.App.FitBest:
                scale = sx < sy ? sx : sy;
                break;
            case b5.App.FitGreatest:
				if (dw > dh)
					scale = sx;
				else
					scale = sy;
                break;
            case b5.App.FitSmallest:
				if (dw < dh)
					scale = sx;
				else
					scale = sy;
                break;
            case b5.App.FitBest2:
                scale = sx > sy ? sx : sy;
                break;
        }
        this.canvas_scale = scale * this.global_scale;
    }

	var nw = (dw * this.pixel_ratio) | 0;
	var nh = (dh * this.pixel_ratio) | 0;
	this.canvas.width = nw;
	this.canvas.height = nh;
	this.canvas.style.width = dw + "px";
	this.canvas.style.height = dh + "px";
	
	//    this.canvas_cx = this.canvas.width >> 1;
//    this.canvas_cy = this.canvas.height >> 1;
    this.canvas_cx = dw / 2;
    this.canvas_cy = dh / 2;

    this.display_width = dw;
    this.display_height = dh;
    this.dirty();
};

b5.App.prototype.parseAndSetFocus = function(scene_name)
{
    new b5.Xoml(this).parseResources(this, [b5.data[scene_name]]);
    this.order_changed = true;
    this.focus_scene = this.findScene(scene_name);
};

//
// Tasks
//
b5.App.prototype.addTask = function(task_name, delay_start, repeats, task_function, task_data)
{
    return this.tasks.add(task_name, delay_start, repeats, task_function, task_data);
};

b5.App.prototype.removeTask = function(task_name)
{
    this.tasks.remove(task_name);
};

//
// Physics
//
/**
 * Creates and initialises a Box2D world and attaches it to the scene. Note that all scenes that contain Box2D physics
 * objects must also contain a Box2D world
 * @param gravity_x {number} X axis gravity
 * @param gravity_y {number} Y axis gravity
 * @param allow_sleep {boolean} If set to true then actors with physics attached will be allowed to sleep which will
 * speed up the processing of physics considerably
 */
b5.App.prototype.initWorld = function(gravity_x, gravity_y, allow_sleep)
{
    if (!this.box2d)
        return;
    this.world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(gravity_x, gravity_y), allow_sleep);

    var listener = new Box2D.Dynamics.b2ContactListener;
    listener.BeginContact = function(contact)
    {
        var actor = contact.GetFixtureA().GetBody().GetUserData();
        if (actor.onCollisionStart !== undefined)
            actor.onCollisionStart(contact);
        actor = contact.GetFixtureB().GetBody().GetUserData();
        if (actor.onCollisionStart !== undefined)
            actor.onCollisionStart(contact);
    };
    listener.EndContact = function(contact)
    {
        var actor = contact.GetFixtureA().GetBody().GetUserData();
        if (actor.onCollisionEnd !== undefined)
            actor.onCollisionEnd(contact);
        actor = contact.GetFixtureB().GetBody().GetUserData();
        if (actor.onCollisionEnd !== undefined)
            actor.onCollisionEnd(contact);
    };
/*	listener.PostSolve = function(contact, impulse)
    {
    }
    listener.PreSolve = function(contact, oldManifold)
    {
    }*/
    this.world.SetContactListener(listener);

/*	var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
    var debugDraw = new b2DebugDraw();
    var context = this.app.display.context;
    debugDraw.SetSprite(context);
    debugDraw.SetDrawScale(this.world_scale);
    debugDraw.SetFillAlpha(0.5);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    this.world.SetDebugDraw(debugDraw);*/
};
/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * A Scene is a container for game objects. You should create scenes to hold your content (Actors and resources) then
 * add them to App to be processed and rendered. You can add logic to the scene via its update() method and or by
 * attaching an onTick event handler. A Scene has the following features:
 *
 * - Manages scene local resources
 * - Manages scene local Timeline animations using a TimelineManager
 * - Manages a collection of local action lists using an ActionsListManager
 * - Manages an events manager for scene wide events
 * - Manages a task manager
 * - Manages a collection of Actors
 * - Supports a camera
 * - Camera can target actors and follow them on x and y axis
 * - Position and scaling
 * - Touch panning (user can drag the camera around)
 * - Box2D world physics
 * - Extents which limit camera movement
 * - Can detect when an actor in the scene has been touched
 * - Clipping of child actors against scene, also supports clipping shapes
 * - Scene wide opacity
 * - Layer ordering
 *
 * Supports the following event handlers:
 *
 * - onCreate() - Called just after Scene has been created
 * - onDestroy() - Called just before Scene is destroyed
 * - onTick(dt) - Called each time the Scene is updated (every frame)
 * - onBeginTouch(touch_pos) - Called when the Scene is touched
 * - onEndTouch(touch_pos) - Called when the Scene has stop being touched
 * - onMoveTouch(touch_pos) - Called when a touch is moved over the Scene
 * - onWheel(event) - Called when hte mouse wheel is used
 * - onKeyPress(event) - Called when a key is pressed and this scene has focus
 * - onKeyDown(event) - Called when a key is pressed down and this scene has focus
 * - onKeyUp(event) - Called when a key is released and this scene has focus
 *
 * <b>Examples</b>
 *
 * Example that shows how to create a scene with optional extras
 *
 *      var scene = new b5.Scene();
 *      scene.name = "my_scene";     // Name the scene
 *      b5.app.addScene(scene);      // Add the scene to the app for processing
 *      b5.app.focus_scene = scene;  // Set our scene as the focus scene
 *
 * Enable scene touch panning example
 *
 *      scene.touch_pan_x = true;
 *      scene.touch_pan_y = true;
 *
 * Add clipper to scene example
 *
 *      var clipper = new b5.Shape();
 *      clipper.type = b5.Shape.TypeCircle;
 *      clipper.width = 300;
 *      scene.clip_shape = clipper;
 *
 * Add a scene update (onTick) handler example
 *
 *      scene.onTick = function(dt) {
 *          this.x++;
 *      };
 *
 * Add touch handlers to a scene example
 *
 *      scene.onBeginTouch = function(touch_pos) {
 *          console.log("Scene touch begin");
 *      };
 *      scene.onEndTouch = function(touch_pos) {
 *          console.log("Scene touch end");
 *      };
 *      scene.onMoveTouch = function(touch_pos) {
 *          console.log("Scene touch move");
 *      };
 *
 * Make scene camera follow a target actor example
 *
 *      scene.target_x = player_actor;
 *      scene.target_y = player_actor;
 *
 * Create a resource and add it to the scenes resource manager then later find it and destroy it
 *
 *      var material = new b5.Material("static_bounce");
 *      material.restitution = 1;
 *      scene.addResource(material, "Material");
 *      // Find resource
 *      var material = b5.Utils.findResourceFromPath("scene1.material1", "material");
 *      material.destroy();
 *
 * Add a physics world to a scene
 *
 *      scene.initWorld(gravity_x, gravity_y, do_sleep);
 *
 * Add an actions list to a scene
 *
 *      // Create actions list
 *      var actions_list = new b5.ActionsList("turn", 0);
 *      // Add an action to actions list
 *      actions_list.add(new b5.A_SetProps(actor, "vr", 2 / 5));
 *      // Add actions list to the scenes actions list manager
 *      scene.actions.add(actions_list);
 *
 * Add an animation timeline to a scene
 *
 *      // Create a timeline that scales actor1
 *      var timeline = new b5.Timeline(actor1, "_scale", [1, 1.5, 1], [0, 0.5, 1], 1, [b5.Ease.quartin, b5.Ease.quartout]);
 *      // Add timeline to the scene for processing
 *      scene.timelines.add(timeline);
 *
 * For a complete overview of the Scene class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/scenes/ Booty5 Scene Overview}
 *
 * @class Scene
 * @constructor
 * @returns {b5.Scene} The created Scene
 *
 * @property {b5.App}                   app                     - Parent app (internal)
 * @property {b5.Actor[]}               actors = [];			- Array of top level actors (internal)
 * @property {b5.Actor[]}               removals                - Array of actors that should be deleted at end of frame (internal) (internal)
 * @property {object}                   world                   - Box2D world (internal)
 * @property {b5.TimelineManager}       timelines               - Actor local animation timelines (internal)
 * @property {b5.ActionsListManager}    actions                 - Actions list manager (internal)
 * @property {number}                   order_changed           - Set to true when child actors change order (internal)
 * @property {b5.Bitmap[]}              bitmaps                 - Bitmap resources (internal)
 * @property {object[]}                 brushes                 - Brush resources (internal)
 * @property {b5.Shape[]}               shapes                  - Shape resources (internal)
 * @property {b5.Material[]}            materials               - Material resources (internal)
 * @property {b5.Sound[]}               sounds                  - Audio resources (internal)
 * @property {b5.Font[]}                fonts                   - Font resources (internal)
 * @property {b5.Raw[]}                 raw                     - Raw JSON resources (internal)

 * @property {b5.EventsManager}         events                  - Events manager
 * @property {b5.TasksManager}          tasks                   - Tasks manager (internal)
 * @property {string}                   name                    - Name of the scene (used to find scenes in the app)
 * @property {string}                   tag                     - Tag (used to find groups of scenes in the app)
 * @property {boolean}                  active                  - Active state, inactive scenes will not be updated (default true)
 * @property {boolean}                  visible                 - Visible state, invisible scenes will not be drawn (default true)
 * @property {number}                   layer                   - Visible layer (set via property _layers) (default 0)
 * @property {number}                   x                       - Scene x axis position
 * @property {number}                   y                       - Scene y axis position
 * @property {number}                   w                       - Scene width (default 1024)
 * @property {number}                   h                       - Scene canvas height (default 768)
 * @property {number}                   scale                   - Amount to scale scene
 * @property {boolean}                  clip_children           - If set to true then actors will be clipped against extents of this scene (default true)
 * @property {b5.Shape}                 clip_shape              - If none null and clipping is enabled then children will be clipped against shape (clip origin is at centre of canvas), if set via _clip_shape then instance of shape or string based path to shape can be used (default is null)
 * @property {number}                   camera_x                - Camera x position
 * @property {number}                   camera_y                - Camera y position
 * @property {number}                   camera_vx               - Camera x velocity
 * @property {number}                   camera_vy               - Camera y velocity
 * @property {number}                   vx_damping              - Camera x velocity damping (default 1)
 * @property {number}                   vy_damping              - Camera y velocity damping (default 1)
 * @property {number}                   follow_speed_x          - Camera target follow speed x axis (default 0.3)
 * @property {number}                   follow_speed_y          - Camera target follow speed y axis (default 0.3)
 * @property {b5.Actor}                 target_x                - Camera actor target on x axis (default null)
 * @property {b5.Actor}                 target_y                - Camera actor target on y axis (default null)
 * @property {boolean}                  touch_pan_x             - If true then scene will be touch panned on x axis (default false)
 * @property {boolean}                  touch_pan_y             - If true then scene will be touch panned on y axis (default false)
 * @property {boolean}                  panning                 - Set to true if scene is currently being panned
 * @property {number}                   min_panning             - Minimum distance that a touch moves to be classed a as a pan (squared)
 * @property {number}                   world_scale             - Scaling from graphical world to Box2D world (default 20)
 * @property {number}                   time_step               - Physics time step in seconds (use 0 for based on frame rate) (default 0)
 * @property {number[]}                 extents                 - Scene camera extents [left, top, width, height]
 * @property {number}                   opacity                 - Scene opacity (default 1)
 * @property {number}                   frame_count             - Number of frames that this scene has been running
 * @property {boolean}                  touching                - Set to true when user touching in the scene
 * @property {boolean}                  touchmove               - Set to true when touch is moving in this scene
 * @property {bool}                   	draw_reverse            - If set to true children are drawn in reverse order
 *
 */
b5.Scene = function()
{
    // Internal variables
    this.app = null;				// Parent app
    this.actors = [];				// Array of actors
    this.removals = [];             // Array of actors that were deleted last frame
    this.world = null;				// Box2D world
    this.timelines = new b5.TimelineManager();  // Scene local animation timelines
	if (b5.ActionsListManager !== undefined)
        this.actions = new b5.ActionsListManager(); // Actions list manager
    this.tasks = new b5.TasksManager();         // Tasks manager
    this.events = new b5.EventsManager();       // Events manager
    this.order_changed = true;      // Set to true when child actors change order

    // Public variables
    this.name = "";					// Name of the scene (used to find scenes in the app)
    this.tag = "";					// Tag (used to find groups of scenes in the app)
    this.active = true;				// Active state, inactive scenes will not be updated
    this.visible = true;			// Visible state, invisible scenes will not be drawn
    this.layer = 0;                 // Visible layer (set via property _layers)
    this.x = 0;						// Scene x axis position
    this.y = 0;						// Scene y axis position
    this.w = 1024;					// Scene canvas width
    this.h = 768;					// Scene canvas height
    this.scale = 1;					// Amount to scale scene
    this.clip_children = true;		// If set to true then actors will be clipped against extents of this scene
    this.clip_shape = null;         // If none null and clipping is enabled then children will be clipped against shape (clip origin is at centre of canvas)
    this.camera_x = 0;				// Camera x position
    this.camera_y = 0;				// Camera y position
    this.camera_vx = 0;				// Camera x velocity
    this.camera_vy = 0;				// Camera y velocity
    this.vx_damping = 1;			// Camera x velocity damping
    this.vy_damping = 1;			// Camera y velocity damping
    this.follow_speed_x = 0.3;		// Camera target follow speed x axis
    this.follow_speed_y = 0.3;		// Camera target follow speed y axis
    this.target_x = null;			// Camera actor target on x axis
    this.target_y = null;			// Camera actor target on y axis
    this.touch_pan_x = false;		// If true then scene will be touch panned on x axis
    this.touch_pan_y = false;		// If true then scene will be touch panned on y axis
    this.panning = false;           // Set to true if scene is currently being panned
    this.min_panning = 0;           // Minimum distance that a touch moves to be classed a as a pan (squared)
    this.world_scale = 20;			// Scaling from graphical world to Box2D world
    this.time_step = 0;             // Physics time step in seconds (use 0 for based on frame rate)
    this.extents = [0,0,0,0];	    // Scene camera extents [left, top, width, height]
    this.opacity = 1.0;				// Scene opacity
    this.frame_count = 0;			// Number of frames that this scene has been running
    this.touching = false;			// Set to true when user touching in the scene
    this.touchmove = false;			// Set to true when touch is moving in this scene
	this.draw_reverse = false;       // If set to true children are drawn in reverse order
    
    // Resources
    this.bitmaps = [];				// Bitmap resources
    this.brushes = [];				// Brush resources
    this.shapes = [];				// Shape resources
    this.materials = [];			// Material resources
    this.sounds	= [];				// Audio resources
    this.fonts	= [];				// Font resources
    this.raw	= [];				// Raw JSON resources
};

Object.defineProperty(b5.Scene.prototype, "_x", {
    get: function() { return this.x; },
    set: function(value) { if (this.x !== value) { this.x = value; } }
});
Object.defineProperty(b5.Scene.prototype, "_y", {
    get: function() { return this.y; },
    set: function(value) { if (this.y !== value) { this.y = value; } }
});
Object.defineProperty(b5.Scene.prototype, "_layer", {
    get: function() { return this.layer; },
    set: function(value) { if (this.layer !== value) { this.layer = value; this.app.order_changed = true; } }
});
Object.defineProperty(b5.Scene.prototype, "_clip_shape", {
    get: function() { return this.clip_shape; },
    set: function(value) { if (this.clip_shape !== value) { this.clip_shape = b5.Utils.resolveResource(value, "shape"); } }
});
Object.defineProperty(b5.Scene.prototype, "_av", {
	set: function(value) { this.visible = value; this.active = value; }
});

/**
 * Releases this scene, destroying any attached physics world and child actors. If the scene has the onDestroy
 * callback defined then it will be called
 */
b5.Scene.prototype.release = function()
{
	for (var t = 0; t < this.actors.length; t++)
	{
		this.actors[t].release();
	}
    if (this.onDestroy !== undefined)
        this.onDestroy();
    this.world = null;
    this.actors = null;
};

/**
 * Destroys the scene and all of its contained actors and resources
 */
b5.Scene.prototype.destroy = function()
{
    this.app.removeScene(this);
};


//
// Children
//

/**
 * Adds the specified actor to this scenes child list, placing the specified actor under control of this scene
 * @param actor {b5.Actor} An actor
 * @return {b5.Actor} The supplied actor
 */
b5.Scene.prototype.addActor = function(actor)
{
    this.actors.push(actor);
    actor.scene = this;
    return actor;
};

/**
 * Removes the specified actor from this scenes child list
 * @param actor {b5.Actor} An actor
 */
b5.Scene.prototype.removeActor = function(actor)
{
    this.removals.push(actor);
};

/**
 * Removes all actors from this scenes child list that match the specified tag
 * @param tag {String} Actor tag
 */
b5.Scene.prototype.removeActorsWithTag = function(tag)
{
    var acts = this.actors;
    var count = acts.length;
    var removals = this.removals;
    for (var t = 0; t < count; t++)
    {
        if (acts[t].tag === tag)
            removals.push(acts[t]);
    }
};

/**
 * Cleans up all child actors that were destroyed this frame
 * @private
 */
b5.Scene.prototype.cleanupDestroyedActors = function()
{
    var dcount = this.removals.length;
    if (dcount > 0)
    {
        var removals = this.removals;
        var acts = this.actors;
        var count = acts.length;
        for (var s = 0; s < dcount; s++)
        {
            var dact = removals[s];
            for (var t = 0; t < count; t++)
            {
                if (dact === acts[t])
                {
                    dact.release();
                    acts.splice(t, 1);
                    count--;
                    break;
                }
            }
        }
    }
    this.removals = [];
};

/**
 * Searches the scenes children to find the named actor
 * @param name {String} Name of actor to find
 * @param recursive {boolean} If true then this scenes entire child actor hierarchy will be searched
 * @returns {b5.Actor} The found actor or null if not found
 */
b5.Scene.prototype.findActor = function(name, recursive)
{
    if (recursive === undefined)
        recursive = false;
    var acts = this.actors;
    var count = acts.length;
    for (var t = 0; t < count; t++)
    {
        if (acts[t].name === name)
            return acts[t];
        else if (recursive)
        {
            var act = acts[t].findActor(name, recursive);
            if (act !== null)
                return act;
        }
    }
    return null;
};

/**
 * Searches the scenes children to find the actor by its id
 * @param id {number} Id of actor to find
 * @param recursive {boolean} If true then this scenes entire child actor hierarchy will be searched
 * @returns {b5.Actor} The found actor or null if not found
 */
b5.Scene.prototype.findActorById = function(id, recursive)
{
    if (recursive === undefined)
        recursive = false;
    var acts = this.actors;
    var count = acts.length;
    for (var t = 0; t < count; t++)
    {
        if (acts[t].id === id)
            return acts[t];
        else if (recursive)
        {
            var act = acts[t].findActorById(id, recursive);
            if (act !== null)
                return act;
        }
    }
    return null;
};

/**
 * Moves the scene to the end of the apps child list, effectively rendering it on top of all other scenes that have the
 * same depth
 */
b5.Scene.prototype.bringToFront = function()
{
    var scenes = this.app.scenes;
    var count = scenes.length;
    var i = -1;
    for (var t = 0; t < count; t++)
    {
        if (scenes[t] === this)
        {
            i = t;
            break;
        }
    }
    if (i >= 0)
    {
        scenes.splice(i, 1);
        scenes.push(this);
    }
};

/**
 * Moves the scene to the start of the apps child list, effectively rendering behind all other scenes that have the
 * same depth
 */
b5.Scene.prototype.sendToBack = function()
{
    var scenes = this.app.scenes;
    var count = scenes.length;
    var i = -1;
    for (var t = 0; t < count; t++)
    {
        if (scenes[t] === this)
        {
            i = t;
            break;
        }
    }
    if (i >= 0)
    {
        scenes.splice(i, 1);
        scenes.unshift(this);
    }
};

//
// Key events
//
/**
 * Callback that is called by the App when the user presses a key and this scene has the primary focus
 * @private
 * @param event {object} The key event
 */
b5.Scene.prototype.onKeyPressBase = function(event)
{
    if (this.onKeyPress !== undefined)
        this.onKeyPress(event);
};
/**
 * Callback that is called by the App when the user presses down a key and this scene has the primary focus
 * @private
 * @param event {object} The key event
 */
b5.Scene.prototype.onKeyDownBase = function(event)
{
    if (this.onKeyDown !== undefined)
        this.onKeyDown(event);
};
/**
 * Callback that is called by the App when the user releases a key and this scene has the primary focus
 * @private
 * @param event {object} The key event
 */
b5.Scene.prototype.onKeyUpBase = function(event)
{
    if (this.onKeyUp !== undefined)
        this.onKeyUp(event);
};

//
// Touch events
//

/**
 * Callback that is called when the user touches the screen, provided that this scene has primary or secondary focus
 * @private
 * @param e {object} Touch event object
 */
b5.Scene.prototype.onBeginTouchBase = function(touch_pos)
{
    this.touching = true;
    if (this.onBeginTouch !== undefined)
        this.onBeginTouch(touch_pos);
};
/**
 * Callback that is called when the user stops touching the screen, provided that this scene has primary or secondary
 * focus
 * @private
 * @param e {object} Touch event object
 */
b5.Scene.prototype.onEndTouchBase = function(touch_pos)
{
    if (this.touching && this.onTapped !== undefined)
        this.onTapped(touch_pos);
    this.touching = false;
    this.touchmove = false;
    if (this.onEndTouch !== undefined)
        this.onEndTouch(touch_pos);
    this.panning = false;
};
/**
 * Callback that is called when the user moves a touch around the screen, provided that this scene has primary or
 * secondary focus
 * @param e {object} Touch event object
 */
b5.Scene.prototype.onMoveTouchBase = function(touch_pos)
{
    this.touchmove = true;
    if (this.onMoveTouch !== undefined)
        this.onMoveTouch(touch_pos);

    if (this.touching)
    {
        var app = this.app;
        var d = 0;
        if (this.touch_pan_x)
        {
            d = app.touch_drag_x;
            this.camera_vx = d * app.target_frame_rate;
            this.camera_x += d;
        }
        if (this.touch_pan_y)
        {
            d = app.touch_drag_y;
            this.camera_vy = d * app.target_frame_rate;
            this.camera_y += d;
        }
        if ((app.touch_drag_x * app.touch_drag_x + app.touch_drag_y * app.touch_drag_y) > this.min_panning)
            this.panning = true;
    }
};
/**
 * Callback that is called when the mouse wheel is used
 * @private
 * @param e {object} Wheel event object
 */
b5.Scene.prototype.onWheelBase = function(e)
{
    if (this.onWheel !== undefined)
        this.onWheel(e);
};

//
// Physics
//
/**
 * Creates and initialises a Box2D world and attaches it to the scene. Note that all scenes that contain Box2D physics
 * objects must also contain a Box2D world
 * @param gravity_x {number} X axis gravity
 * @param gravity_y {number} Y axis gravity
 * @param allow_sleep {boolean} If set to true then actors with physics attached will be allowed to sleep which will
 * speed up the processing of physics considerably
 */
b5.Scene.prototype.initWorld = function(gravity_x, gravity_y, allow_sleep)
{
    if (!this.app.box2d)
        return;
    if (this.app.shared_world)
    {
        if (this.app.world === null)
            this.app.initWorld(gravity_x, gravity_y, allow_sleep);
        this.world = this.app.world;
        return;
    }
    else
    {
        this.world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(gravity_x, gravity_y), allow_sleep);
    }

    var listener = new Box2D.Dynamics.b2ContactListener;
    listener.BeginContact = function(contact)
    {
        var actor = contact.GetFixtureA().GetBody().GetUserData();
        if (actor.onCollisionStart !== undefined)
            actor.onCollisionStart(contact);
        actor = contact.GetFixtureB().GetBody().GetUserData();
        if (actor.onCollisionStart !== undefined)
            actor.onCollisionStart(contact);
    };
    listener.EndContact = function(contact)
    {
        var actor = contact.GetFixtureA().GetBody().GetUserData();
        if (actor.onCollisionEnd !== undefined)
            actor.onCollisionEnd(contact);
        actor = contact.GetFixtureB().GetBody().GetUserData();
        if (actor.onCollisionEnd !== undefined)
            actor.onCollisionEnd(contact);
    };
/*	listener.PostSolve = function(contact, impulse)
    {
    }
    listener.PreSolve = function(contact, oldManifold)
    {
    }*/
    this.world.SetContactListener(listener);

/*	var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
    var debugDraw = new b2DebugDraw();
    var context = this.app.display.context;
    debugDraw.SetSprite(context);
    debugDraw.SetDrawScale(this.world_scale);
    debugDraw.SetFillAlpha(0.5);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    this.world.SetDebugDraw(debugDraw);*/
};

//
// Rendering
//
/**
 * Renders the scene and all of its contained actors
 */
b5.Scene.prototype.draw = function()
{
    if (!this.visible)
        return;

    var app = this.app;
    var dscale = app.canvas_scale * this.scale;
    var disp = app.display;
    if (this.clip_children)
    {
        var x = app.canvas_cx + this.x;
        var y = app.canvas_cy + this.y;
        disp.setTransform(dscale, 0, 0, dscale, x, y);
        disp.saveContext();
        if (this.clip_shape === null)
            disp.clipRect(-this.w/2, -this.h/2, this.w, this.h);
        else
        {
            var shape = this.clip_shape;
            if (this.clip_shape.type === b5.Shape.TypeBox)
                disp.clipRect(0, 0, shape.width, shape.height);
            else
            if (this.clip_shape.type === b5.Shape.TypeCircle)
                disp.clipArc(0, 0, shape.width, 0, 2 * Math.PI);
            else
            if (this.clip_shape.type === b5.Shape.TypePolygon)
                disp.clipPolygon(shape.vertices);
        }
    }

    var acts = this.actors;
    var count = acts.length;
    if (this.draw_reverse)
    {
        for (var t = count - 1; t >= 0; t--)
            acts[t].draw();
    }
    else
    {
        for (var t = 0; t < count; t++)
            acts[t].draw();
    }

    if (this.clip_children)
        disp.restoreContext();
};

//
// Update
//
/**
 * Main base scene update method that is called by the main app object each logic loop. Performs many actions including:
 * - Calling onTick() callback
 * - Updating local timelines manager
 * - Updating local actions manager
 * - Update child actor hierarchy
 * - Update physics world
 * - Cleaning up destroyed child actors
 * - Sorting child actor layers
 * @param dt {number} Time that has passed since this scene was last updated in seconds
 */
b5.Scene.prototype.baseUpdate = function(dt)
{
    if (!this.active)
        return false;

    if (this.onTick !== undefined)
        this.onTick(dt);

    this.timelines.update(dt);
	if (this.actions !== undefined)
        this.actions.execute();
    this.tasks.execute();

    // Update camera;
    this.updateCamera(dt);

    var acts = this.actors;
    var count = acts.length;
    for (var t = 0; t < count; t++)
    {
        acts[t].update(dt);
    }

    if (this.world !== null && b5.app.world === null)
    {
        var app = b5.app;
        if (this.time_step === 0)
            this.world.Step(dt, 10, 10);		// frame-rate, velocity iterations, position iterations
        else
        {
            var run_count = 1;
            if (app.adaptive_physics)
            {
                run_count = (app.target_frame_rate / app.avg_fps + 0.5) << 0;
                if (run_count < 1)
                    run_count = 1;
                else if (run_count > 3)
                    run_count = 3;
            }
            for (var t = 0; t < run_count; t++)
                this.world.Step(this.time_step, 10, 10);
        }
        if (this.world !== null)
            this.world.ClearForces();
    }

    this.frame_count++;

    this.cleanupDestroyedActors();

    // Re-sort actors if layers changed
    if (this.order_changed)
    {
        this.order_changed = false;
        b5.Utils.sortLayers(this.actors);
    }

    return true;
};

/**
 * Updates the scene and all of its contained actors
 * @param dt {number} The amount of time that has passed since this scene was last updated in seconds
 */
b5.Scene.prototype.update = function(dt)
{
    return this.baseUpdate(dt);

};

//
// Utility
//
/**
 * Updates the scenes camera
 * @param dt The amount of time that has passed since this scene was last updated in seconds
 */
b5.Scene.prototype.updateCamera = function(dt)
{
    // Follow target
    if (this.target_x !== null)
    {
        if (this.follow_speed_x === 0)
        {
            this.camera_x = this.target_x.x;
            this.camera_vx = 0;
        }
        else
            this.camera_vx += (this.target_x.x - this.camera_x) * this.follow_speed_x;
    }
    if (this.target_y !== null)
    {
        if (this.follow_speed_y === 0)
        {
            this.camera_y = this.target_y.y;
            this.camera_vy = 0;
        }
        else
            this.camera_vy += (this.target_y.y - this.camera_y) * this.follow_speed_y;
    }

    if (!this.touching)
    {
        this.camera_x += this.camera_vx * dt;
        this.camera_y += this.camera_vy * dt;
        this.camera_vx *= this.vx_damping;
        this.camera_vy *= this.vy_damping;
    }
/*	if (this.camera_vx > -0.01 && this.camera_vx < 0.01)
        this.camera_vx = 0;
    if (this.camera_vy > -0.01 && this.camera_vy < 0.01)
        this.camera_vy = 0;*/

    // Keep camera within extents
    if (this.camera_x !== 0 || this.camera_y !== 0)
    {
        var ew = this.extents[2];
        var eh = this.extents[3];
        var sw = this.app.design_width;
        var sh = this.app.design_height;
        if (ew !== 0 && sw <= ew)
        {
            var cx = sw / 2;
            var left = this.extents[0] + cx;
            var right = (this.extents[0] + ew) - cx;
            if (this.camera_x < left)
            {
                this.camera_x = left;
                this.camera_vx = 0;
            }
            if (this.camera_x > right)
            {
                this.camera_x = right;
                this.camera_vx = 0;
            }
        }
        if (sw > ew)
            this.camera_x = 0;
        if (eh !== 0 && sh <= eh)
        {
            var cy = sh / 2;
            var top = this.extents[1] + cy;
            var bottom = (this.extents[1] + eh) - cy;
            if (this.camera_y < top)
            {
                this.camera_y = top;
                this.camera_vy = 0;
            }
            if (this.camera_y > bottom)
            {
                this.camera_y = bottom;
                this.camera_vy = 0;
            }
        }
        if (sh > eh)
            this.camera_y = 0;
    }
};

/**
 * Traverses the actor hierarchy testing touchable actors to see if the supplied position lies within their bounds
 * @param position {object} The x,y position to be tested
 * @returns {b5.Actor} The actor that was hit or null if no actor was hit
 */
b5.Scene.prototype.findHitActor = function(position)
{
    var acts = this.actors;
    var count = acts.length;
    var hit = null;
    for (var t = count - 1; t >=0 ; t--)
    {
        hit = acts[t].hitTest(position);
        if (hit !== null)
            return hit;
    }
    return hit;
};

/**
 * Dirties all child actor transforms forcing them to be rebuilt
 */
b5.Scene.prototype.dirty = function()
{
    var a = this.actors;
    var count = a.length;
    for (var t = 0; t < count; t++)
        a[t].dirty();
};

//
// Resource management
//
/**
 * Adds a resource to the this scenes local resource manager
 * @param resource {object} The resource to add
 * @param type {string} Type of resource to add (brush, sound, shape, material, bitmap or geometry)
 */
b5.Scene.prototype.addResource = function(resource, type)
{
	if (type === undefined)
		throw "Resource type not specified";
    var res = b5.Utils.getResFromType(this, type);
    if (res !== null)
    {
        res.push(resource);
        resource.parent = this;
    }
};

/**
 * Removes a resource from this scenes local resource manager
 * @param resource {object} The resource to remove
 * @param type {string} Type of resource to add (brush, sound, shape, material, bitmap or geometry)
 */
b5.Scene.prototype.removeResource = function(resource, type)
{
    var res = b5.Utils.getResFromType(this, type);
    if (res !== null)
    {
        var count = res.length;
        for (var t = 0; t < count; t++)
        {
            if (res[t] === resource)
            {
                res.parent = null;
                res.splice(t, 1);
                return;
            }
        }
    }
};

/**
 * Finds and plays the named timeline animation
 * @param name {string} Name of animation to play
 */
b5.Scene.prototype.playTimeline = function(name)
{
	if (!this.active)
	{
		this.active = true;
		this.visible = true;
	}
    var timeline = this.timelines.find(name);
    if (timeline !== null)
    {
        timeline.restart();
    }
};

/**
 * Creates and adds a task to the scenes task list
 * @param task_name {string} Task name
 * @param delay_start {number} The amount of time to wait in seconds before running the task
 * @param repeats {number} The number of times to run the task before destroying itself
 * @param task_function {function} The function call each time the task is executed
 * @param task_data {any} User data to pass to the task function
 */
b5.Scene.prototype.addTask = function(task_name, delay_start, repeats, task_function, task_data)
{
    this.tasks.add(task_name, delay_start, repeats, task_function, task_data);
};

/**
 * Removes the specified task from the task manager
 * @param task_name {string} Task name
 */
b5.Scene.prototype.removeTask = function(task_name)
{
    this.tasks.remove(task_name);
};


/**
 * Searches the scenes local resource manager for the named resource. If the resource is not found within the scene
 * then the app global resource space will be searched
 * @param name {string} Name of resource to find
 * @param type {string} Type of resource to add (brush, sound, shape, material, bitmap or geometry)
 * @returns {object} The found resource or null if not found
 */
b5.Scene.prototype.findResource = function(name, type)
{
    var res = b5.Utils.getResFromType(this, type);
    if (res === null)
        return null;

    var count = res.length;
    for (var t = 0; t < count; t++)
    {
        if (res[t].name === name)
            return res[t];
    }

    return this.app.findResource(name, type);	// Check parent app (globals) for resource as it was not found in this scene
};

/**
 * Checks the scenes resources to see if all preloaded resources have been loaded
 * @returns {boolean} true if all scene preloaded resources have been loaded, otherwise false
 */
b5.Scene.prototype.areResourcesLoaded = function()
{
    var res = this.bitmaps;
    var count = res.length;
    for (var t = 0; t < count; t++)
    {
        if (res[t].preload && !res[t].loaded)
            return false;
    }

    return true;
};

/**
 * Returns how many resources that are marked as preloaded in this scene still need to be loaded
 * @returns {number} Number of resources that still need to loaded
 */
b5.Scene.prototype.countResourcesNeedLoading = function()
{
    var total = 0;
    var res = this.bitmaps;
    var count = res.length;
    for (var t = 0; t < count; t++)
    {
        if (res[t].preload)
            total++;
    }

    res = this.sounds;
    count = res.length;
    for (t = 0; t < count; t++)
    {
        if (res[t].preload)
            total++;
    }

    res = this.fonts;
    count = res.length;
    for (t = 0; t < count; t++)
    {
        if (res[t].preload)
            total++;
    }

    res = this.raw;
    count = res.length;
    for (t = 0; t < count; t++)
    {
        if (res[t].preload)
            total++;
    }

    return total;
};


/**
/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * The Xoml class loads XOML format JSON (exported from the Booty5 game editor) and turns it into Booty5 compatible objects
 *
 * Xoml format data looks as follows:
 *
 *      b5.data.globals = [
 *           {
 *               "RT": "Geometry",
 *               "N": "rect3762",
 *               "GT": "Poly",
 *               "A": false,
 *               "V": [-126.336,-106.399, -42.018,-90.992, 153.614,46.411, -66.468,106.4, -153.614,-7.28]
 *           },
 *           {
 *               "RT": "Shape",
 *               "N": "rect3761",
 *               "ST": "Polygon",
 *               "W": 0,
 *               "H": 0,
 *               "A": false,
 *               "V": [-126.336,-106.399, -42.018,-90.992, 153.614,46.411, -66.468,106.4, -153.614,-7.28]
 *           }
 *      ];
 *
 * <b>Examples</b>
 *
 * Example showing code that loads JSON and converts it to Booty5 objects:
 *
 *      // Create XOML loader
 *      var xoml = new b5.Xoml(app);
 *
 *      // Parse and create global resources placing them into the app
 *      xoml.parseResources(app, xoml_globals);
 *
 * Example showing how to dynamically create an actor from XOML template
 *
 *      var app = b5.app;
 *
 *      // This scene will receive a copy of ball object
 *      var game_scene = app.findScene("gamescene");
 *
 *      // Search Xoml gamescene for ball icon actor resource
 *      var ball_template = b5.Xoml.findResource(b5.data.gamescene, "ball", "icon");
 *
 *      // Create ball from the Xoml template and add it to game_scene
 *      var xoml = new b5.Xoml(app);
 *      xoml.current_scene = game_scene;	// Xoml system needs to know current scene so it knows where to look for dependent resources
 *      var ball = xoml.parseResource(game_scene, ball_template);
 *      ball.setPosition(0, -350);
 *      ball.vx = 4;
 *      ball.fill_style = "rgb(" + ((Math.random() * 255) &lt;&lt; 0) + "," + ((Math.random() * 255) &lt;&lt; 0) + "," + ((Math.random() * 255) &lt;&lt; 0) + ")";
 *
 * For a complete overview of XOML see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/xoml-booty5-editor-data/ Booty5 XOML Overview}
 *
 * @class b5.Xoml
 * @param app (b5.App) The main app
 * @constructor
 * @returns {b5.Xoml} The created Xoml parser
 *
 */
b5.Xoml = function(app)
{
    // Internal variables
    this.current_scene = null;      // Current scene
    this.app = app;                 // The parent app
};

b5.Xoml.prototype.parseScene = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Scene " + item.Name);

    // Create a scene
    var scene = new b5.Scene();

    if (parent !== null)
    {
        parent.addScene(scene);
        if (item.Current)
            parent.focus_scene = scene;
        else
        if (item.Current2)
            parent.focus_scene2 = scene;
    }

    this.current_scene = scene;
    scene.name = item.Name;
    if (item.Tag !== undefined) scene.tag = item.Tag;
    scene.x = item.Position[0];
    scene.y = item.Position[1];
    if (item.CanvasSize !== undefined)
    {
        scene.w = item.CanvasSize[0];
        scene.h = item.CanvasSize[1];
    }
    if (item.Layer !== undefined) scene.layer = item.Layer;
    if (item.Visible !== undefined) scene.visible = item.Visible;
    if (item.Active !== undefined) scene.active = item.Active;
    if (item.Physics !== undefined && item.Physics)
    {
        scene.initWorld(item.Gravity[0], item.Gravity[1], item.DoSleep);
        if (item.PhysicsTimestep !== undefined)
            scene.time_step = item.PhysicsTimestep;
        if (item.WorldScale !== undefined)
            scene.world_scale = item.WorldScale;
    }
    if (item.ClipChildren !== undefined)
        scene.clip_children = item.ClipChildren;

    if (item.TouchPan === "Both")
    {
        scene.touch_pan_x = true;
        scene.touch_pan_y = true;
    }
    else if (item.TouchPan === "X")
        scene.touch_pan_x = true;
    else if (item.TouchPan === "Y")
        scene.touch_pan_y = true;
    scene.extents[0] = item.Extents[0];
    scene.extents[1] = item.Extents[1];
    scene.extents[2] = item.Extents[2];
    scene.extents[3] = item.Extents[3];

    scene.follow_speedx = item.FollowSpeed[0];
    scene.follow_speedy = item.FollowSpeed[1];

    // Parse user properties
    var user_props = item.UserProps;
    if (user_props !== undefined)
    {
        for (var t = 0; t < user_props.length; t++)
            scene[user_props[t].N] = user_props[t].V;
    }

    // Parse pre-defined animation timelines
    var tc = item.TimelineCollection;
    if (tc !== undefined)
    {
        for (var t = 0; t < tc.length; t++)
            this.parseTimeline(scene, tc[t]);
    }

    // Parse actions lists
    var al = item.ActionsList;
    if (al !== undefined)
    {
        for (var t = 0; t < al.length; t++)
            this.parseActionsList(scene, al[t]);
    }

    if (item.Alpha !== undefined) scene.opacity = item.Alpha;

    if (!(item.Cn === undefined))
        this.parseResources(scene, item.Cn);

    if (item.ClipShape !== undefined && item.ClipShape !== "")
        scene.clip_shape = scene.findResource(item.ClipShape, "shape");

    if (item.TargetX !== "")
        scene.target_x = scene.findActor(item.TargetX);
    if (item.TargetY !== "")
        scene.target_y = scene.findActor(item.TargetY);
    if (item.VelocityDamping !== undefined)
    {
        scene.vx_damping = item.VelocityDamping[0];
        scene.vy_damping = item.VelocityDamping[1];
    }

    // Parse actions
    if (item.OnCreate !== undefined)
        scene.onCreate = Function(item.OnCreate);
    if (item.OnDestroy !== undefined)
        scene.onDestroy = Function(item.OnDestroy);
    if (item.OnTick !== undefined)
        scene.onTick = Function("dt", item.OnTick);
    if (item.OnTapped !== undefined)
        scene.onTapped = Function("touch_pos", item.OnTapped);
    if (item.OnBeginTouch !== undefined)
        scene.onBeginTouch = Function("touch_pos", item.OnBeginTouch);
    if (item.OnEndTouch !== undefined)
        scene.onEndTouch = Function("touch_pos", item.OnEndTouch);
    if (item.OnMoveTouch !== undefined)
        scene.onMoveTouch = Function("touch_pos", item.OnMoveTouch);
    if (item.OnWheel !== undefined)
        scene.onWheel = Function("event", item.OnWheel);
    if (item.OnKeyPress !== undefined)
        scene.onKeyPress = Function("event", item.OnKeyPress);
    if (item.OnKeyDown !== undefined)
        scene.onKeyDown = Function("event", item.OnKeyDown);
    if (item.OnKeyUp !== undefined)
        scene.onKeyUp = Function("event", item.OnKeyUp);

    if (scene.onCreate !== undefined)
        scene.onCreate();

    return scene;
};
b5.Xoml.prototype.parseBrush = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Brush " + item.N);
    var brush;
    if (item.BT === 0)
    {
        var rect = item.RC;
        var bitmap = parent.findResource(item.I, "bitmap")
        var frames = item.F;
        if (frames.length === 0)
            brush = new b5.ImageAtlas(item.N, bitmap, rect[0], rect[1], rect[2], rect[3], rect[4], rect[5]);
        else
        {
            // Parse frames
            brush = new b5.ImageAtlas(item.N, bitmap);
            for (var t = 0; t < frames.length; t++)
            {
                var frame = frames[t];
                brush.addFrame(frame[0], frame[1], frame[2], frame[3], frame[5], frame[6]);
            }
        }
        // Parse named anims
        var anims = item.AN;
        if (anims !== undefined && anims.length !== 0)
        {
            for (var t = 0; t < anims.length; t++)
            {
                brush.addAnim(anims[t].N, anims[t].F, anims[t].S);
            }
        }
    }
    else
    {
        // Parse colour stops
        var stops = item.ST;
        brush = new b5.Gradient(item.N);
        brush.rad_radius = item.RR;
        if (brush.rad_radius !== undefined)
            brush.rad_pos = [0, 0, 0, 0];
        if (item.RP !== undefined)
            brush.rad_pos = item.RP;
        for (var t = 0; t < stops.length; t++)
        {
            var stop = stops[t];
            brush.addColourStop(stop.c, stop.o);
        }
        if (item.Angle !== undefined)
            brush.angle = item.Angle;
    }
    parent.addResource(brush, "brush");

    return brush;
};
b5.Xoml.prototype.parseRaw = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Raw " + item.N);
    var raw = new b5.Raw(item.N, item.Loc, item.P);
    parent.addResource(raw, "raw");

    return raw;
};
b5.Xoml.prototype.parseImage = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Image " + item.N);
    var bitmap;
    if (item.Loc2 !== undefined && b5.app.mobile)
        bitmap = new b5.Bitmap(item.N, item.Loc2, item.P);
    else
        bitmap = new b5.Bitmap(item.N, item.Loc, item.P);
    parent.addResource(bitmap, "bitmap");

    return bitmap;
};
b5.Xoml.prototype.parseSound = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Sound " + item.N);
    var sound = new b5.Sound(item.N, item.Loc, item.R);
    if (item.P !== undefined)
        sound.preload = item.P == 1;
    if (item.A !== undefined)
        sound.auto_play = item.A == 1;
    if (item.Loc2 !== undefined)
        sound.location2 = item.Loc2;
    if (item.L !== undefined)
        sound.loop = item.L == 1;
    if (sound.preload) sound.load();
    parent.addResource(sound, "sound");

    return sound;
};
b5.Xoml.prototype.parseFont = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Font " + item.Name);
    var font = new b5.Font(item.Name, item.Name, item.Preload);
    parent.addResource(font, "font");
};
b5.Xoml.prototype.parseShape = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Shape " + item.N);
    var shape = new b5.Shape(item.N);
    shape.width = item.W;
    shape.height = item.H;
    if (item.ST === "Circle")
        shape.type = b5.Shape.TypeCircle;
    else if (item.ST === "Box")
        shape.type = b5.Shape.TypeBox;
    else if (item.ST === "Polygon")
    {
        shape.type = b5.Shape.TypePolygon;
        // Get vertices (use by clipping and visuals)
        var vertices = item.V;
        var count = vertices.length;
        for (var t = 0; t < count; t++)
            shape.vertices.push(vertices[t]);
        // Get convex vertices (used by physics fixtures)
        if (item.CV !== undefined)
        {
            var pc = item.CV.length;
            for (var t = 0; t < pc; t++)
            {
                var ov = [];
                var vertices = item.CV[t];
                count = vertices.length;
                for (var s = 0; s < count; s++)
                    ov.push(vertices[s]);
                shape.convexVertices.push(ov);
            }
        }
    }

    parent.addResource(shape, "shape");

    return shape;
};
b5.Xoml.prototype.parseMaterial = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Material " + item.N);

    var material = new b5.Material();
    material.name = item.N;
    material.type = item.MT;
    material.density = item.D;
    material.friction = item.F;
    material.restitution = item.R;
    material.gravity_scale = item.GS;
    material.fixed_rotation = item.FR;
    material.is_bullet = item.IB;

    parent.addResource(material, "material");

    return material;
};

b5.Xoml.prototype.parseTimeline = function(parent, item)
{
    var timeline = new b5.Timeline();
    if (item.N !== undefined) timeline.name = item.N;
    var count = item.A.length;
    for (var t = 0; t < count; t++)
    {
        var animation = item.A[t];
        var anim = new b5.Animation(timeline, parent, animation.P, animation.V, animation.TI, 0, animation.E);
        if (animation.T !== undefined)
            anim.tween = animation.T;
        if (animation.D !== undefined)
            anim.destroy = animation.D;
        if (animation.R !== undefined)
            anim.repeat = animation.R;
        anim.repeats_left = anim.repeat;
        if (animation.TS !== undefined)
            anim.time_scale = animation.TS;
        if (animation.DA !== undefined)
            anim.deactivate = animation.DA;
        if (animation.DE !== undefined)
            anim.delay = -animation.DE;
        if (animation.A === false)
            anim.pause();
        if (animation.OnE !== undefined)
            anim.onEnd = Function(animation.OnE);
        if (animation.OnR !== undefined)
            anim.onRepeat = Function(animation.OnR);
            
        if (animation.AC !== undefined)
        {
            for (var t2 = 0; t2 < animation.AC.length; t2++)
            {
                if (animation.Actions[t2] !== "")
                {
                    var act = animation.AC[t2];
                    anim.setAction(t2, Function(act));
                }
            }
        }
        timeline.anims.push(anim);
    }
    parent.timelines.add(timeline);
};

b5.Xoml.prototype.parseActionsList = function(parent, item)
{
    var al = new b5.ActionsList();
    if (item.N !== undefined) al.name = item.N;
    if (item.R !== undefined)
    {
        al.repeats_left = item.R;
        al.repeat = item.R;
    }
    al.destroy = false;
    var actions = item.A;
    var count = actions.length;
    for (var t = 0; t < count; t++)
    {
        var action;
        var name = actions[t][0];
        if (name === "Custom")
        {
            name = actions[t][1];
            actions[t].splice(0, 1);
        }
        action = b5.ActionsRegister.create(name, actions[t]);
        al.actions.push(action);
    }
    if (item.P !== undefined && item.P)
        al.play();
    parent.actions.add(al);
};

b5.Xoml.prototype.parseActor = function(actor, parent, item)
{
    var brush = null;
    actor.scene = this.current_scene;
    if (item.N !== undefined) actor.name = item.N;
    if (item.T !== undefined) actor.tag = item.T;
    if (item.V !== undefined) actor.visible = item.V;
    if (item.Ac !== undefined) actor.active = item.Ac;
    if (item.L !== undefined) actor.layer = item.L;
    if (item.P !== undefined)
    {
        actor.x = item.P[0];
        actor.y = item.P[1];
    }
    if (item.S !== undefined)
    {
        actor.scale_x = item.S[0];
        actor.scale_y = item.S[1];
    }
    if (item.SM !== undefined) actor.scale_method = item.SM;
    if (item.St !== undefined) actor.stacking = item.St;
    if (item.FX !== undefined && item.FX) actor.scale_x = -actor.scale_x;
    if (item.FY !== undefined && item.FY) actor.scale_y = -actor.scale_y;
    if (item.Or !== undefined) actor.orphaned = item.Or;
    if (item.A !== undefined) actor.rotation = item.A;
    if (item.C !== undefined) actor.fill_style = item.C;
    if (item.SC !== undefined) actor.stroke_style = item.SC;
    if (item.F !== undefined) actor.filled = item.F;
    if (item.FS !== undefined) actor.stroke_filled = item.FS;
    if (item.Th !== undefined) actor.stroke_thickness = item.Th;
    if (item.Sz !== undefined)
    {
        actor.w = item.Sz[0];
        actor.h = item.Sz[1];
        actor.ow = item.Sz[0];
        actor.oh = item.Sz[1];
    }
    if (item.O !== undefined)
    {
        actor.ox = item.O[0];
        actor.oy = item.O[1];
    }
    if (actor.ox <= -1 || actor.ox >= 1 || actor.oy <= -1 || actor.oy >= 1) actor.absolute_origin = true; else actor.absolute_origin = false;
    if (item.Al !== undefined) actor.opacity = item.Al;
    if (item.SAl !== undefined) actor.stroke_opacity = item.SAl;
    if (item.UPO !== undefined) actor.use_parent_opacity = item.UPO;
    if (item.D !== undefined) actor.depth = item.D;
    actor.use_transform = true;
    if (item.Ve !== undefined)
    {
        actor.vx = item.Ve[0];
        actor.vy = item.Ve[1];
    }
    if (item.AV !== undefined) actor.vr = item.AV;
    if (item.VD !== undefined)
    {
        actor.vx_damping = item.VD[0];
        actor.vy_damping = item.VD[1];
    }
    if (item.AVD !== undefined) actor.vr_damping = item.AVD;
    if (item.WP !== undefined)	actor.wrap_position = item.WP;
    if (item.IC !== undefined)	actor.ignore_camera = item.IC;
    if (item.CC !== undefined)	actor.clip_children = item.CC;
    if (item.To !== undefined) actor.touchable = item.To;
    if (item.Ht !== undefined) actor.hit = item.Ht;
    if (item.Bu !== undefined)	actor.bubbling = item.Bu;
    if (item.Do !== undefined)
    {
        var docking = item.Do;
        if (item.Dse !== undefined)
            actor.dock_screen = item.Dse;
        if (docking === "top" || docking === "topleft" || docking === "topright" || docking === "topcentre")
            actor.dock_y = b5.Actor.Dock_Top;
        else if (docking === "bottom" || docking === "bottomleft" || docking === "bottomright" || docking === "bottomcentre")
            actor.dock_y = b5.Actor.Dock_Bottom;
        else if (docking === "middleleft" || docking === "middleright" || docking === "middlecentre")
            actor.dock_y = b5.Actor.Dock_Middle;
        if (docking === "left" || docking === "topleft" || docking === "bottomleft" || docking === "middleleft")
            actor.dock_x = b5.Actor.Dock_Left;
        else if (docking === "right" || docking === "topright" || docking === "bottomright" || docking === "middleright")
            actor.dock_x = b5.Actor.Dock_Right;
        else if (docking === "topcentre" || docking === "bottomcentre" || docking === "middlecentre")
            actor.dock_x = b5.Actor.Dock_Centre;
    }
    if (item.M !== undefined)
    {
        actor.margin[0] = item.M[0];
        actor.margin[1] = item.M[1];
        actor.margin[2] = item.M[2];
        actor.margin[3] = item.M[3];
    }
    if (item.CM !== undefined)
    {
        actor.clip_margin[0] = item.CM[0];
        actor.clip_margin[1] = item.CM[1];
        actor.clip_margin[2] = item.CM[2];
        actor.clip_margin[3] = item.CM[3];
    }
    if (item.Sh !== undefined)
        actor.shadow = item.Sh;
    if (item.ShO !== undefined)
    {
        actor.shadow_x = item.ShO[0];
        actor.shadow_y = item.ShO[1];
    }
    if (item.ShB !== undefined)
        actor.shadow_blur = item.ShB;
    if (item.ShC !== undefined)
        actor.shadow_colour = item.ShC;
    if (item.CO !== undefined)
        actor.composite_op = item.CO;
    if (item.BG !== undefined)
    {
        brush = this.current_scene.findResource(item.BG, "brush");
        if (brush.stops !== undefined)
        {
            var gs = {x:0,y:0};
            var ge = {x:0,y:1};
            if (item.GS !== undefined) { gs.x = item.GS[0]; gs.y = item.GS[1]; }
            if (item.GE !== undefined) { ge.x = item.GE[0]; ge.y = item.GE[1]; }
            var grad = brush.createStyle(actor.w, actor.h, gs, ge);
            if (actor.filled)
                actor.fill_style = grad;
            else
            if (actor.stroke_filled)
                actor.stroke_style = grad;
        }
        else
            actor.atlas = brush;
    }

    if (item.Pd !== undefined)
        actor.padding = item.Pd;

    if (item.DA !== undefined && brush !== null)
    {
        actor.playAnim(item.DA);
    }

    // Load tile map info
    if (item.RA === 3)
    {
        var tiles_x = item.TX;
        var tiles_y = item.TY;
        actor.map_width = item.MW;
        actor.map_height = item.MH;
        actor.tile_width = item.TW;
        actor.tile_height = item.TH;
        actor.display_width = item.DW;
        actor.display_height = item.DH;
        actor.map = item.Map;
        actor.collision_map = item.CMap;
        actor.generateTiles(tiles_x * tiles_y, actor.tile_width, actor.tile_height, actor.tile_width * tiles_x);
    }

    if (parent !== null)
        parent.addActor(actor);

    // Parse actions
    if (item.OnC !== undefined)
        actor.onCreate = Function(item.OnC);
    if (item.OnD !== undefined)
        actor.onDestroy = Function(item.OnD);
    if (item.OnTi !== undefined)
        actor.onTick = Function("dt", item.OnTi);
    if (item.OnT !== undefined)
    {
        actor.touchable = true;
        actor.onTapped = Function("touch_pos", item.OnT);
    }
    if (item.OnB !== undefined)
    {
        actor.touchable = true;
        actor.onBeginTouch = Function("touch_pos", item.OnB);
    }
    if (item.OnE !== undefined)
    {
        actor.touchable = true;
        actor.onEndTouch = Function("touch_pos", item.OnE);
    }
    if (item.OnM !== undefined)
    {
        actor.touchable = true;
        actor.onMoveTouch = Function("touch_pos", item.OnM);
    }
    if (item.OnL !== undefined)
    {
        actor.touchable = true;
        actor.onLostTouchFocus = Function("touch_pos", item.OnL);
    }
    if (item.OnH !== undefined)
        actor.onHover = Function("touch_pos", item.OnH);
    if (item.OnHE !== undefined)
        actor.onHoverEnd = Function("touch_pos", item.OnHE);
    if (item.OnCS !== undefined)
        actor.onCollisionStart = Function("contact", item.OnCS);
    if (item.OnCE !== undefined)
        actor.onCollisionEnd = Function("contact", item.OnCE);

    // Parse user properties
    var user_props = item.UP;
    if (user_props !== undefined)
    {
        for (var t = 0; t < user_props.length; t++)
            actor[user_props[t].N] = user_props[t].V;
    }

    // Parse physics fixtures
    var fixtures = item.Fxs;
    if (fixtures !== undefined)
    {
        for (var t = 0; t < fixtures.length; t++)
        {
            var options = {};
            var material = null;
            var shape = null;
            if (fixtures[t].M !== undefined && fixtures[t].M !== "")
                material = this.current_scene.findResource(fixtures[t].M, "material");
            if (fixtures[t].S !== undefined && fixtures[t].S !== "")
                shape = this.current_scene.findResource(fixtures[t].S, "shape");
            if (t === 0)
                actor.initBody(material.type, material.fixed_rotation, material.is_bullet);
            // NOTE: if no physics shape attached bu the actor is under control of physics then a default fixture will
            // be attached. if the actor is circular in shape then a circular fixture will be used otherwise a box
            // shape will be used.
            if (shape === null)
            {
                if (item.RA === 1)
                {
                    options.type = b5.Shape.TypeCircle;
                    options.width = actor.w / 2;
                }
                else
                {
                    options.type = b5.Shape.TypeBox;
                    options.width = actor.w;
                    options.height = actor.h;
                }
            }
            else
                options.shape = shape;
            if (material !== null)
                options.material = material;
            options.is_sensor = fixtures[t].R;
            if (fixtures[t].C !== undefined)
            {
                options.collision_category = fixtures[t].C[0];
                options.collision_mask = fixtures[t].C[1];
                options.collision_group = fixtures[t].C[2];
            }
            actor.addFixture(options);
        }
    }

    // Parse physics joints
    var joints = item.Jts;
    if (joints !== undefined)
    {
        for (var t = 0; t < joints.length; t++)
        {
            var options = [];
            var actor_b = this.current_scene.findActor(joints[t].AB);
            options.type = joints[t].T;
            options.actor_b = actor_b;
            options.anchor_a = {x:joints[t].OA[0], y:joints[t].OA[1]};
            options.anchor_b = {x:joints[t].OB[0], y:joints[t].OB[1]};
            options.self_collide = joints[t].SC;
            options.damping = joints[t].D;
            options.frequency = joints[t].F;
            options.limit_joint = joints[t].LJ;
            options.lower_limit = joints[t].LL;
            options.upper_limit = joints[t].UL;
            options.motor_enabled = joints[t].ME;
            options.motor_speed = joints[t].MS;
            options.max_motor_torque = joints[t].MT;
            options.max_motor_force = joints[t].MF;
            options.ground_a = {x:joints[t].GA[0], y:joints[t].GA[1]};
            options.ground_b = {x:joints[t].GB[0], y:joints[t].GB[1]};
            options.axis = {x:joints[t].A[0], y:joints[t].A[1]};
            options.ratio = joints[t].R;
            actor.addJoint(options);
        }
    }

    // Parse pre-defined animation timelines
    var tc = item.TC;
    if (tc !== undefined)
    {
        for (var t = 0; t < tc.length; t++)
            this.parseTimeline(actor, tc[t]);
    }

    // Parse actions lists
    var al = item.AL;
    if (al !== undefined)
    {
        for (var t = 0; t < al.length; t++)
            this.parseActionsList(actor, al[t]);
    }

    if (actor.body !== null)
    {
        var b2Vec2 = Box2D.Common.Math.b2Vec2;
        actor.body.SetLinearVelocity(new b2Vec2(actor.vx, actor.vy));
        actor.body.SetAngularVelocity(actor.vr);
        actor.body.SetLinearDamping(actor.vx_damping);
        actor.body.SetAngularDamping(actor.vr_damping);
    }

    if (item.Cn !== undefined)
        this.parseResources(actor, item.Cn);

    actor.setBodyActive(actor.active);

    return actor;
};
b5.Xoml.prototype.parseIcon = function(parent, item, template)
{
    if (this.app.debug)
        console.log("Parsing Icon " + item.N);

    var actor;
    var render_as = 0;
    if (item.RA !== undefined)
        render_as = item.RA;
    if (template !== true)
    {
        if (item.Tmp)
            return null;
    }

    if (render_as === 1)	// Circle
        actor = new b5.ArcActor();
    else if (render_as === 2)	// Rectangle
        actor = new b5.RectActor();
    else if (render_as === 3)	// Tile Map
        actor = new b5.MapActor();
    else if (render_as === 0)	// Normal
    {
        if (item.Geo !== undefined)
        {
            actor = new b5.PolygonActor();
            var shape = this.current_scene.findResource(item.Geo, "shape");
            if (shape !== null)
                actor.points = shape.vertices;
        }
        else
            actor = new b5.Actor();
    }
    if (item.CR !== undefined) actor.corner_radius = item.CR;

    this.parseActor(actor, parent, item);

    if (render_as === 1)	// Circle
        actor.radius = actor.w / 2;

    if (item.Vi !== undefined && item.Vi) 	// Has virtual canvas
    {
        actor.makeVirtual();
        if (item.SR !== undefined)
        {
            actor.scroll_range[0] = item.SR[0];
            actor.scroll_range[1] = item.SR[1];
            actor.scroll_range[2] = item.SR[2];
            actor.scroll_range[3] = item.SR[3];
        }
        if (item.SPos !== undefined)
        {
            actor.scroll_pos_x = item.SPos[0];
            actor.scroll_pos_y = item.SPos[1];
        }
    }
    if (item.ClV !== undefined)
        actor.clip_virtual = item.ClV;
    if (item.IAS !== undefined)
        actor.ignore_atlas_size = item.IAS;
    if (item.SCl !== undefined)
        actor.self_clip = item.SCl;
    if (item.CS !== undefined)
        actor.clip_shape = this.current_scene.findResource(item.CS, "shape");

    if (item.Ca === true)
    {
        actor.cached = true;
        actor.cache = true;
    }
    if (item.Me === true)
        actor.merge_cache = true;
    if (item.Rd === true)
        actor.round_pixels = true;

    if (actor.onCreate !== undefined)
        actor.onCreate();

    return actor;
};
b5.Xoml.prototype.parseLabel = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Label " + item.N);

    var actor = new b5.LabelActor();
    actor.text = item.Text;
    actor.font = item.Font;
    actor.text_align = item.AlignH;
    actor.text_baseline = item.AlignV;
    this.parseActor(actor, parent, item);

    if (item.Lh !== undefined)
        actor.line_height = item.Lh;
    if (item.Ca === true)
    {
        actor.cached = true;
        actor.cache = true;
    }
    if (item.Me === true)
        actor.merge_cache = true;
    if (item.Rd === true)
        actor.round_pixels = true;
    if (item.Mw !== undefined)
        actor.max_width = item.Mw;

    if (actor.onCreate !== undefined)
        actor.onCreate();

    return actor;
};

/**
 * Recursively parses all XOML JSON resource instantiating all Booty5 objects that it contains
 * @param parent {object} Object that will receive the created objects, for example the app or a scene
 * @param resource {object} XOML JSON object to parse
 */
b5.Xoml.prototype.parseResources = function(parent, objects)
{
    var count = objects.length;
    for (var t = 0; t < count; t++)
        this.parseResource(parent, objects[t]);
};

/**
 * Parses a specific XOML JSON resource and instantiates all Booty5 objects that it contains
 * @param parent {object} Object that will receive the created objects, for example the app or a scene
 * @param resource {object} XOML JSON object to parse
 * @param template {boolean} Template insantiation, true when instantiating template
 * @returns {object} Created object (may also contain sub objects / resources)
 */
b5.Xoml.prototype.parseResource = function(parent, resource, template)
{
    var res_type = resource.RT;
    if (res_type === "Scene")
        return this.parseScene(parent, resource);
    else if (res_type === "Brush")
        return this.parseBrush(parent, resource);
    else if (res_type === "Image")
        return this.parseImage(parent, resource);
    else if (res_type === "Sound")
        return this.parseSound(parent, resource);
    else if (res_type === "Font")
        return this.parseFont(parent, resource);
    else if (res_type === "Shape")
        return this.parseShape(parent, resource);
    else if (res_type === "Material")
        return this.parseMaterial(parent, resource);
    else if (res_type === "Icon")
        return this.parseIcon(parent, resource, template);
    else if (res_type === "Label")
        return this.parseLabel(parent, resource);
    else if (res_type === "GFile")
        return this.parseRaw(parent, resource);
    return null;
};

/**
 * Searches the XOML resource collection to find a specific resource
 * @param objects {object}  The XOML JSON object
 * @param name {string}     The namke of the resource / object to find
 * @param type {string}     Type of resource / object (Scene, Brush, Image, Sound, Shape, Material, Icon, label)
 * @returns {object}        The found object or null if not found
 */
b5.Xoml.findResource = function(objects, name, type)
{
    // If object has children then search child list instead
    if (objects.Cn !== undefined)
        objects = objects.Cn;

    var count = objects.length;
    for (var t = 0; t < count; t++)
    {
        if (objects[t].RT.toLowerCase() === type && objects[t].N === name)
            return objects[t];
    }
    return null;
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * The Math class provides basic math utility functionality
 *
 * @class b5.Maths
 *
 */
b5.Maths = function()
{
};

/**
 * Multiplies two 3x2 matrices, placing the result into mat1 (mat1 = mat1 * mat2)
 * @param mat1 {number[]} First matrix
 * @param mat2 {number[]} First matrix
 */
b5.Maths.mulMatrix = function(mat1, mat2)
{
    var m0 = mat2[0];
    var m1 = mat2[1];
    var m2 = mat2[2];
    var m3 = mat2[3];
    var m4 = mat2[4];
    var m5 = mat2[5];
    var n0 = mat1[0];
    var n1 = mat1[1];
    var n2 = mat1[2];
    var n3 = mat1[3];
    var n4 = mat1[4];
    var n5 = mat1[5];
    mat1[0] = m0 * n0 + m2 * n1;
    mat1[1] = m1 * n0 + m3 * n1;
    mat1[2] = m0 * n2 + m2 * n3;
    mat1[3] = m1 * n2 + m3 * n3;
    mat1[4] = m0 * n4 + m2 * n5 + m4;
    mat1[5] = m1 * n4 + m3 * n5 + m5;
};

/**
 * Pre-multiplies two 3x2 matrices, placing the result into mat1 (mat1 = mat2 * mat1)
 * @param mat1 {number[]} First matrix
 * @param mat2 {number[]} First matrix
 */
b5.Maths.preMulMatrix = function(mat1, mat2)
{
    var m0 = mat1[0];
    var m1 = mat1[1];
    var m2 = mat1[2];
    var m3 = mat1[3];
    var m4 = mat1[4];
    var m5 = mat1[5];
    var n0 = mat2[0];
    var n1 = mat2[1];
    var n2 = mat2[2];
    var n3 = mat2[3];
    var n4 = mat2[4];
    var n5 = mat2[5];
    mat1[0] = m0 * n0 + m2 * n1;
    mat1[1] = m1 * n0 + m3 * n1;
    mat1[2] = m0 * n2 + m2 * n3;
    mat1[3] = m1 * n2 + m3 * n3;
    mat1[4] = m0 * n4 + m2 * n5 + m4;
    mat1[5] = m1 * n4 + m3 * n5 + m5;
};

/**
 * Multiplies a vector by the supplied 3z2 matrix
 * @param x {number} X coordinate
 * @param y {number} Y coordinate
 * @param mat {number[]} The matrix to multiple the vector by
 * @returns {{x: *, y: *}} The result x,y
 */
b5.Maths.vecMulMatrix = function(x, y, mat)
{
    var tx = x * mat[0] + y * mat[2] + mat[4];
    var ty = x * mat[1] + y * mat[3] + mat[5];
    return {x: tx, y: ty };
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Display is the display abstraction layer
//
b5.Display = function(canvas)
{
    // Internal variables
    this.canvas = canvas;                       // The HTML5 canvas object
    this.cache_ctx = null;                      // Current cached object context
    this.context = canvas.getContext("2d");     // The canvas context

    // Set defaults
    this.context.lineWidth = 1;
    this.context.strokeStyle = "black";
    this.context.fillStyle = "black";
    this.context.globalAlpha = 1.0;
    this.context.lineJoin = "round";
    this.context.lineCap = "round";

    // Pixel ratio for mobile devices
    var device_pr = b5.Utils.GetDevicePixelRatio();
    var backstore_pr =  b5.Utils.GetBackingStorePixelRatio(this.context);
    var ratio = device_pr / backstore_pr;
    if (device_pr !== backstore_pr)
    {
        b5.app.pixel_ratio = ratio;
    }

};

b5.Display.getWidth = function()
{
//	return window.innerWidth;
	return document.documentElement.clientWidth;
}

b5.Display.getHeight = function()
{
//	return window.innerHeight;
	return document.documentElement.clientHeight;
}

b5.Display.prototype.getCanvasPoint = function(x_pos, y_pos)
{
    var app = b5.app;
    var scale = app.canvas_scale;
    return {
        x: (x_pos - this.canvas.offsetLeft - app.canvas_cx) / scale,
        y: (y_pos - this.canvas.offsetTop - app.canvas_cy) / scale
    };
};

b5.Display.prototype.clear = function(transparent)
{
    var app = b5.app;
    var ctx = this.context;
	var pr = b5.app.pixel_ratio;
    ctx.setTransform(pr, 0, 0, pr, 0, 0);
    ctx.clearRect(0, 0, app.display_width, app.display_height);
/*	if (transparent)
    {
        this.ctx.fillStyle = "transparent";
        this.ctx.fillRect(0, 0, this.design_width, this.design_height);
    }*/
};

b5.Display.prototype.drawPolygon = function(x, y, points, fill)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    var count = points.length;
    ctx.beginPath();
    ctx.moveTo(points[0] + x, points[1] + y);
    for (var i = 2; i < count; i += 2)
        ctx.lineTo(points[i] + x, points[i + 1] + y);
    if (fill)
        ctx.fill();
    else
    {
        ctx.lineTo(points[0] + x, points[1] + y);
        ctx.stroke();
    }
    return this;
};

b5.Display.prototype.drawLine = function(x1, y1, x2, y2)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    return this;
};

b5.Display.prototype.drawRect = function(x, y, w, h, fill)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    if (fill)
        ctx.fillRect(x, y, w, h);
    else
        ctx.strokeRect(x, y, w, h);
    return this;
};

b5.Display.prototype.drawRoundRect = function(x, y, w, h, radius, fill)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill)
        ctx.fill();
    else
        ctx.stroke();
};

b5.Display.prototype.drawArc = function(x, y, radius, start_angle, end_angle, fill)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.beginPath();
    ctx.arc(x, y, radius, start_angle, end_angle);
//  ctx.arc(x, y, 100, 0, 2 * Math.PI);
    if (fill)
        ctx.fill();
    else
        ctx.stroke();
    return this;
};

b5.Display.prototype.drawAtlasImage = function(image, src_x, src_y, src_w, src_h, x, y, w, h)
{
    if (image.width <= 0 || image.height <= 0)
        return;
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.drawImage(image, src_x, src_y, src_w, src_h, x, y, w, h);
};

b5.Display.prototype.drawImage = function(image, x, y, w, h)
{
    if (image.width <= 0 || image.height <= 0)
        return;
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    if (w !== undefined)
        ctx.drawImage(image, x, y, w, h);
    else
        ctx.drawImage(image, x, y);
};

b5.Display.prototype.drawText = function(text, x, y, line_height, filled)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    text = "" + text;
    var lines = text.split("\n");
    for (var t = 0; t < lines.length; t++)
    {
        if (filled)
            ctx.fillText(lines[t], x, y);
        else
            ctx.strokeText(lines[t], x, y);
        y += line_height;
    }
};

b5.Display.prototype.drawTextWrap = function(text, x, y, max_width, line_height, filled, text_baseline)
{
    if (max_width === 0)
    {
        this.drawText(text, x, y, line_height, filled);
        return;
    }
    text = "" + text;
	var num_lines = this.measureTextLines(text, max_width);
    if (num_lines > 1)
    {
        if (text_baseline === "middle")
            y -= (line_height * num_lines) / 2 - line_height / 2;
    }
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    var lines = text.split("\n");
    for (var t = 0; t < lines.length; t++)
    {
        var line = "";
        var words = lines[t].split(" ");
        for (var t2 = 0; t2 < words.length; t2++)
        {
            var tline = line + words[t2] + " ";
            var metrics = ctx.measureText(tline);
            if (metrics.width > max_width)
            {
                if (filled)
                    ctx.fillText(line, x, y);
                else
                    ctx.strokeText(line, x, y);
                line = words[t2] + " ";
                y += line_height;
            }
            else
            {
                line = tline;
            }
        }
        if (filled)
            ctx.fillText(line, x, y);
        else
            ctx.strokeText(line, x, y);
        y += line_height;
    }
};

b5.Display.prototype.measureText = function(text)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    return ctx.measureText(text);
};

b5.Display.prototype.measureTextLines = function(text, max_width)
{
    if (max_width === 0)
        return 1;
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    var lines = text.split("\n");
    var count = 0;
    for (var t = 0; t < lines.length; t++)
    {
        var line = "";
        var words = lines[t].split(" ");
        for (var t2 = 0; t2 < words.length; t2++)
        {
            var tline = line + words[t2] + " ";
            var metrics = ctx.measureText(tline);
            if (metrics.width > max_width)
            {
                line = words[t2] + " ";
                count++;
            }
            else
                line = tline;
        }
        count++;
    }
    return count;
};

b5.Display.prototype.setTransform = function(m11, m12, m21, m22, dx, dy)
{
	var pr = b5.app.pixel_ratio;
    m11 *= pr;
    m12 *= pr;
    m21 *= pr;
    m22 *= pr;
    dx *= pr;
    dy *= pr;
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.setTransform(m11, m12, m21, m22, dx, dy);
};

b5.Display.prototype.clipRect = function(x, y, w, h)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
};

b5.Display.prototype.clipArc = function(x, y, radius, start, end)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.beginPath();
    ctx.arc(x,y, radius, start, end);
    ctx.clip();
};

b5.Display.prototype.clipPolygon = function(points)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.beginPath();
    var count = points.length;
    ctx.moveTo(points[0], points[1]);
    for (var i = 2; i < count; i += 2)
        ctx.lineTo(points[i], points[i + 1]);
    ctx.closePath();
    ctx.clip();
};

b5.Display.prototype.saveContext = function()
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.save();
};

b5.Display.prototype.restoreContext = function()
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.restore();
};

b5.Display.prototype.createCache = function()
{
    return document.createElement("canvas");
};

b5.Display.prototype.createCacheWithSize = function(width, height)
{
    var cache = document.createElement("canvas");
    cache.width = width;
    cache.height = height;
    return cache;
};

b5.Display.prototype.setGlobalAlpha = function(alpha)
{
    this.context.globalAlpha = alpha;
};

b5.Display.prototype.setGlobalCompositeOp = function(op)
{
    this.context.globalCompositeOperation = op;
};

b5.Display.prototype.setShadow = function(x, y, colour, blur)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.shadowOffsetX = x;
    ctx.shadowOffsetY = y;
    ctx.shadowColor = colour;
    ctx.shadowBlur = blur;
};

b5.Display.prototype.setShadowOff = function()
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.shadowColor = "transparent";
};

b5.Display.prototype.setFillStyle = function(style)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.fillStyle = style;
};

b5.Display.prototype.setStrokeStyle = function(style)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.strokeStyle = style;
};

b5.Display.prototype.setLineWidth = function(width)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.lineWidth = width;
};

b5.Display.prototype.setFont = function(font)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.font = font;
};

b5.Display.prototype.setTextAlign = function(align)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.textAlign = align;
};

b5.Display.prototype.setTextBaseline = function(baseline)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.textBaseline = baseline;
};

b5.Display.prototype.setSmoothing = function(enable)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.imageSmoothingEnabled = enable;
    ctx.mozImageSmoothingEnabled = enable;
    ctx.oImageSmoothingEnabled = enable;
    ctx.imageSmoothingEnabled = enable;
    ctx.msImageSmoothingEnabled = enable;
};

b5.Display.prototype.setCache = function(cache)
{
    if (cache === null)
        this.cache_ctx = null;
    else
        this.cache_ctx = cache.getContext("2d");
};

/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A raw JSON data object. Generally a Raw should be added to either a {@link b5.Scene} or the global {@link b5.App}'s resources so that it can be
 * managed by them.
 *
 * @class b5.Raw
 * @constructor
 * @returns {b5.Raw}                        The created raw data
 * @param name {string}                     Name of raw resource
 * @param location {string}                 Location of the raw resource
 * @param preload {boolean}                 If true then the raw will be loaded as soon as it is created
 * @param onload {function}                 Callback function that should be called when the raw has finished loading or null
 *
 * @property {object}                   data            - The raw JSON data
 * @property {string}                   name            - Name of this raw resource
 * @property {string}                   location        - Location of the raw resource
 * @property {function}                 onload          - Callback function that should be called when the raw has finished loading or null
 * @property {boolean}                  preload         - If set to true then the raw will be loaded as soon as it is created
 * @property {boolean}                  loaded          - If true then this resource has finished loading
 */
b5.Raw = function(name, location, preload, onload)
{
    // Internal variables
    this.data = null;

    // Public variables
    this.parent = null;                 // Parent container
    this.name = name;					// The raws name
    this.location = location;			// Location of the raw
    this.onload = onload;               // On data loaded callback
    this.preload = preload;             // If true then data will be preloaded
    this.loaded = false;                // Set to true once data has done loading
    this.load_retry = 0;
    
    if (preload)
    {
        this.load();
    }
};

/**
 * Loads the raw, only required if not preloaded
 */
b5.Raw.prototype.load = function()
{
    var that = this;
    b5.Utils.loadJSON(this.location, false, function(data){
        that.data = data;
        if (data !== null)
        {
            that.loaded = true;
            b5.app.onResourceLoaded(that, false);
        }
        else
        {
            that.load_retry++;
            if (that.load_retry > 3)
            {
                b5.app.onResourceLoaded(that, true);
                if (onload !== undefined)
                    onload(data);
            }
            else
                that.load();
        }
    }, false);
};

/**
 * Removes this resource from its resource manager and destroys it
 */
b5.Raw.prototype.destroy = function()
{
    this.data = null;
    if (this.parent !== null)
        this.parent.removeResource(this, "raw");
};


// Fontobserver lib
(function(){function l(a,b){document.addEventListener?a.addEventListener("scroll",b,!1):a.attachEvent("scroll",b)}function m(a){document.body?a():document.addEventListener?document.addEventListener("DOMContentLoaded",function c(){document.removeEventListener("DOMContentLoaded",c);a()}):document.attachEvent("onreadystatechange",function k(){if("interactive"==document.readyState||"complete"==document.readyState)document.detachEvent("onreadystatechange",k),a()})};function r(a){this.a=document.createElement("div");this.a.setAttribute("aria-hidden","true");this.a.appendChild(document.createTextNode(a));this.b=document.createElement("span");this.c=document.createElement("span");this.h=document.createElement("span");this.f=document.createElement("span");this.g=-1;this.b.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.c.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";
this.f.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.h.style.cssText="display:inline-block;width:200%;height:200%;font-size:16px;max-width:none;";this.b.appendChild(this.h);this.c.appendChild(this.f);this.a.appendChild(this.b);this.a.appendChild(this.c)}
function t(a,b){a.a.style.cssText="max-width:none;min-width:20px;min-height:20px;display:inline-block;overflow:hidden;position:absolute;width:auto;margin:0;padding:0;top:-999px;white-space:nowrap;font-synthesis:none;font:"+b+";"}function y(a){var b=a.a.offsetWidth,c=b+100;a.f.style.width=c+"px";a.c.scrollLeft=c;a.b.scrollLeft=a.b.scrollWidth+100;return a.g!==b?(a.g=b,!0):!1}function z(a,b){function c(){var a=k;y(a)&&a.a.parentNode&&b(a.g)}var k=a;l(a.b,c);l(a.c,c);y(a)};function A(a,b){var c=b||{};this.family=a;this.style=c.style||"normal";this.weight=c.weight||"normal";this.stretch=c.stretch||"normal"}var B=null,C=null,E=null,F=null;function G(){if(null===C)if(J()&&/Apple/.test(window.navigator.vendor)){var a=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))(?:\.([0-9]+))/.exec(window.navigator.userAgent);C=!!a&&603>parseInt(a[1],10)}else C=!1;return C}function J(){null===F&&(F=!!document.fonts);return F}
function K(){if(null===E){var a=document.createElement("div");try{a.style.font="condensed 100px sans-serif"}catch(b){}E=""!==a.style.font}return E}function L(a,b){return[a.style,a.weight,K()?a.stretch:"","100px",b].join(" ")}
A.prototype.load=function(a,b){var c=this,k=a||"BESbswy",q=0,D=b||3E3,H=(new Date).getTime();return new Promise(function(a,b){if(J()&&!G()){var M=new Promise(function(a,b){function e(){(new Date).getTime()-H>=D?b():document.fonts.load(L(c,'"'+c.family+'"'),k).then(function(c){1<=c.length?a():setTimeout(e,25)},function(){b()})}e()}),N=new Promise(function(a,c){q=setTimeout(c,D)});Promise.race([N,M]).then(function(){clearTimeout(q);a(c)},function(){b(c)})}else m(function(){function u(){var b;if(b=-1!=
f&&-1!=g||-1!=f&&-1!=h||-1!=g&&-1!=h)(b=f!=g&&f!=h&&g!=h)||(null===B&&(b=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent),B=!!b&&(536>parseInt(b[1],10)||536===parseInt(b[1],10)&&11>=parseInt(b[2],10))),b=B&&(f==v&&g==v&&h==v||f==w&&g==w&&h==w||f==x&&g==x&&h==x)),b=!b;b&&(d.parentNode&&d.parentNode.removeChild(d),clearTimeout(q),a(c))}function I(){if((new Date).getTime()-H>=D)d.parentNode&&d.parentNode.removeChild(d),b(c);else{var a=document.hidden;if(!0===a||void 0===a)f=e.a.offsetWidth,
g=n.a.offsetWidth,h=p.a.offsetWidth,u();q=setTimeout(I,50)}}var e=new r(k),n=new r(k),p=new r(k),f=-1,g=-1,h=-1,v=-1,w=-1,x=-1,d=document.createElement("div");d.dir="ltr";t(e,L(c,"sans-serif"));t(n,L(c,"serif"));t(p,L(c,"monospace"));d.appendChild(e.a);d.appendChild(n.a);d.appendChild(p.a);document.body.appendChild(d);v=e.a.offsetWidth;w=n.a.offsetWidth;x=p.a.offsetWidth;I();z(e,function(a){f=a;u()});t(e,L(c,'"'+c.family+'",sans-serif'));z(n,function(a){g=a;u()});t(n,L(c,'"'+c.family+'",serif'));
z(p,function(a){h=a;u()});t(p,L(c,'"'+c.family+'",monospace'))})})};"object"===typeof module?module.exports=A:(window.FontFaceObserver=A,window.FontFaceObserver.prototype.load=A.prototype.load);}());

/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A font object. Generally afont  should be added to either a {@link b5.Scene} or the global {@link b5.App}'s resources so that it can be
 * managed by them.
 *
 * @class b5.Font
 * @constructor
 * @returns {b5.Font}                       The created font
 * @param name {string}                     Name of font resource
 * @param location {string}                 Location of the font resource
 * @param preload {boolean}                 If true then the font will be loaded as soon as it is created
 * @param onload {function}                 Callback function that should be called when the font has finished loading or null
 *
 * @property {object}                   data            - The font JSON data
 * @property {string}                   name            - Name of this font resource
 * @property {string}                   font_name       - Name of the font face
 * @property {boolean}                  preload         - If set to true then the font will be loaded as soon as it is created
 * @property {boolean}                  loaded          - If true then this resource has finished loading
 */
b5.Font = function(name, font_name, preload)
{
    // Internal variables
    this.data = null;

    // Public variables
    this.parent = null;                 // Parent container
    this.name = name;					// The fonts name
    this.font_name = font_name;			// Font face name
    this.preload = preload;             // If true then data will be preloaded
    this.loaded = false;                // Set to true once data has done loading
    this.load_retry = 0;
    
    if (preload)
    {
        this.load();
    }
};

/**
 * Loads the font, only required if not preloaded
 */
b5.Font.prototype.load = function()
{
    var that = this;
    var font = new FontFaceObserver(this.font_name);
    font.load().then(function()
    {
        that.loaded = true;
        b5.app.onResourceLoaded(that, false);
    }, function()
    {
        that.load_retry++;
        if (that.load_retry > 3)
        {
            b5.app.onResourceLoaded(that, true);
        }
        else
            that.load();
        if (b5.app.debug)
            console.log("Error: Could not load font");
    });
};

/**
 * Removes this resource from its resource manager and destroys it
 */
b5.Font.prototype.destroy = function()
{
    this.data = null;
    if (this.parent !== null)
        this.parent.removeResource(this, "font");
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A Bitmap object represents a bit-mapped image that can be displayed by {@link b5.Actor}'s. Generally a Bitmap should be added to
 * either a {@link b5.Scene} or the global {@link b5.App}'s resources so that it can be managed by them.
 *
 * Example showing how to create a bitmap and add it to the scenes resource manager
 *
 *      var bitmap = new b5.Bitmap("background", "images/background.jpg", true);
 *      scene.addResource(bitmap, "bitmap");    // Add to scenes resource manager so it can be reused
 *
 * For a complete overview of Resources see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/resources-the-stuff-that-games-are-made-of/ Booty5 Resources Overview}
 *
 * @class b5.Bitmap
 * @constructor
 * @returns {b5.Bitmap}                     The created bitmap
 * @param name {string}                     Name of bitmap resource
 * @param location {string}                 Location of the bitmap resource
 * @param preload {boolean}                 If true then the bitmap will be loaded as soon as it is created
 * @param onload {function}                 Callback function that should be called when the bitmap has finished loading or null
 *
 * @property {Image}                    image           - The HTML5 Image that contains the bitmap (internal)
 * @property {string}                   name            - Name of this bitmap resource
 * @property {string}                   location        - Location of the bitmap resource
 * @property {function}                 onload          - Callback function that should be called when the bitmap has finished loading or null
 * @property {boolean}                  preload         - If set to true then the bitmap will be loaded as soon as it is created
 * @property {boolean}                  loaded          - If true then this resource has finished loading
 */
b5.Bitmap = function(name, location, preload, onload)
{
    // Internal variables
    this.image = new Image();			// Image object

    // Public variables
    this.parent = null;                 // Parent container
    this.name = name;					// The bitmaps name
    this.location = location;			// Location of the bitmap
    this.onload = onload;               // On image loaded callback
    this.preload = preload;             // If true then image will be preloaded
    this.loaded = false;                // Set to true once image has done loading
    this.load_retry = 0;
    
    if (preload)
    {
        this.load();
    }
};

/**
 * Loads the bitmap, only required if not preloaded
 */
b5.Bitmap.prototype.load = function()
{
    var that = this;
    this.image.onload = function()
    {
        b5.app.onResourceLoaded(that, false);
        if (that.onload !== undefined)
        {
            if (that.image.width <= 0 || that.image.naturalWidth <= 0 || that.image.naturalHeight <= 0 || !that.image.complete)
                that.onload(that, false);
            else
                that.onload(that, true);
        }
    };
    this.image.onerror = function()
    {
        that.load_retry++;
        if (that.load_retry > 3)
        {
            b5.app.onResourceLoaded(that, true);
            if (that.onload !== undefined)
                that.onload(that, false);
        }
        else
            that.load();
    };
    this.image.src = this.location; // Start the load
};

/**
 * Removes this resource from its resource manager and destroys it
 */
b5.Bitmap.prototype.destroy = function()
{
    this.image = null;
    if (this.parent !== null)
        this.parent.removeResource(this, "bitmap");
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A Gradient object is a brush that represents a collection of colours and offsets of those colours that form a gradient.
 * Generally a Gradient should be added to either a scene or the global {@link b5.App}'s resources so that it can be managed
 * by them. Gradients are not used directly by {@link b5.Actor}'s but they can be used to create stroke and fill styles for them.
 *
 * Example showing how to create a gradient and use it to paint an Actor
 *
 *      // Create a gradient
 *      var gradient = new b5.Gradient();
 *      gradient.addColourStop("#ff0000", 0);
 *      gradient.addColourStop("#00ff00", 0.5);
 *      gradient.addColourStop("#0000ff", 1);
 *
 *      // Create an actor and assign the gradient fill style
 *      var actor = new b5.ArcActor();
 *      actor.x = -100;
 *      actor.w = 100;
 *      actor.radius = 100;
 *      actor.filled = true;
 *      actor.fill_style = gradient.createStyle(actor.w, actor.w, { x: 0, y: 0 }, { x: 1, y: 1 });;
 *      scene.addActor(actor);
 *
 * A colour stop is an object of the form {number, colour}
 *
 * For a complete overview of Resources see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/resources-the-stuff-that-games-are-made-of/ Booty5 Resources Overview}
 *
 * @class b5.Gradient
 * @constructor
 * @returns {b5.Gradient}                   The created Gradient
 * @param name {string}                     Name of gradient resource
 * @param colour_stops {string}             Optional list of colour stops
 *
 * @property {b5.App|b5.Scene}          parent          - Parent resource manager (internal)
 * @property {object[]}                 stops           - Array of colour stops (internal)
 * @property {string}                   name            - Name of this gradient resource
 * @property {number[]}                 rad_pos         - Radial gradient position
 * @property {number[]}                 rad_radius      - Radial gradient radii
 */
b5.Gradient = function(name, colour_stops)
{
    // Internal variables
    this.parent = null;                 // Parent container
    if (colour_stops !== undefined)
        this.stops = colour_stops;	    // Array of colour stops
    else
        this.stops = [];

    // Public variables
    this.name = name;					// Gradient name
};

/**
 * Adds a colour stop to the gradient
 * @param colour {object} A colour for example #ffffff
 * @param offset {number} Gradient offset position
 */
b5.Gradient.prototype.addColourStop = function(colour, offset)
{
    this.stops.push({c: colour, offs: offset});
};

/**
 * Returns the colour stop at the specified index for this gradient
 * @param index {number} Index of colour stop
 * @returns {Object} The colour stop
 */
b5.Gradient.prototype.getColourStop = function(index)
{
    return this.stops[index];
};

/**
 * Get the total number of colour stops in this gradient
 * @returns {Number} Total number of gradient stops
 */
b5.Gradient.prototype.getMaxStops = function()
{
    return this.stops.length;
};

/**
 * Removes this resource from its resource manager and destroys it
 */
b5.Gradient.prototype.destroy = function()
{
    if (this.parent !== null)
        this.parent.removeResource(this, "brush");
};

/**
 * Creates a style that can be used as strokes and fills when rendering a {@link b5.Actor}
 * @param w {number} Width of gradient
 * @param h {number} Height of gradient
 * @param start {object} Start x,y position of gradient
 * @param end {object} End x,y position of gradient
 * @returns {object} Gradient fill style
 */
b5.Gradient.prototype.createStyle = function(w, h, start, end)
{
    if (this.stops !== undefined)
    {
        var x1 = 0, y1 = 0;
        var x2 = 1, y2 = 0;
        if (start !== undefined)
        {
            x1 = start.x;
            y1 = start.y;
        }
        if (end !== undefined)
        {
            x2 = end.x;
            y2 = end.y;
        }
        x1 = x1 * w - w / 2;
        y1 = y1 * h - h / 2;
        x2 = x2 * w - w / 2;
        y2 = y2 * h - h / 2;
        var grad;
        if (this.rad_pos !== undefined)
            grad = b5.app.display.context.createRadialGradient(this.rad_pos[0] * w, this.rad_pos[1] * w, this.rad_radius[0] * w, this.rad_pos[2] * w, this.rad_pos[3] * w, this.rad_radius[1] * w);
        else
            grad = b5.app.display.context.createLinearGradient(x1, y1, x2, y2);
        for (var t = 0; t < this.stops.length; t++)
        {
            var s = this.stops[t];
            grad.addColorStop(s.offs, s.c);
        }
        return grad;
    }

    return null;
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * An ImageAtlas object (also known as an Image Brush) represents a {@link b5.Bitmap} and a collection of sub images
 * within that bitmap. Generally an ImageAtlas should be added to either a {@link b5.Scene} or the global {@link b5.App}'s
 * resources so that it can be managed by them. Image atlases are used by {@link b5.Actor}'s to create frame based
 * bitmap animations.
 *
 * Example showing how to create a bitmap animation and attach it to an Actor
 *
 *      actor.atlas = new ImageAtlas("sheep", new Bitmap("sheep", "images/sheep.png", true));
 *      actor.atlas.addFrame(0,0,86,89,0,0);    // Add frame 1 to the atlas
 *      actor.atlas.addFrame(86,0,86,89,0,0);   // Add frame 2 to the atlas
 *      actor.frame = 0;                        // Set initial animation frame
 *      actor.frame_speed = 0.5;                // Set animation playback speed
 *
 * Example showing how to automatically generate animation frames
 *
 *      var atlas = new ImageAtlas("car_anim", new Bitmap("car_anims", "images/car_anims.png", true));
 *      atlas.generate(0, 0, 64, 32, 10, 2);
 * 
 * You can also add collection of animations to a brush which can be played back on an actor that uses the brush, e.g.:
 * 
 *      actor.atlas = new ImageAtlas("sheep", new Bitmap("sheep", "images/sheep.png", true));
 *      actor.atlas.addFrame(0,0,32,32,0,0);    // Add frame 1 to the atlas
 *      actor.atlas.addFrame(32,0,32,32,0,0);   // Add frame 2 to the atlas
 *      actor.atlas.addFrame(64,0,32,32,0,0);   // Add frame 3 to the atlas
 *      actor.atlas.addFrame(96,0,32,32,0,0);   // Add frame 4 to the atlas
 *      actor.atlas.addFrame(128,0,32,32,0,0);   // Add frame 5 to the atlas
 *      actor.atlas.addFrame(160,0,32,32,0,0);   // Add frame 6 to the atlas
 *      actor.atlas.addAnim("walk", [0, 1, 2, 3], 10);
 *      actor.atlas.addAnim("idle", [4, 5], 10);
 *      actor.playAnim("walk");
 * 
 *
 * For a complete overview of Resources see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/resources-the-stuff-that-games-are-made-of/ Booty5 Resources Overview}
 *
 * @class b5.ImageAtlas
 * @constructor
 * @returns {b5.ImageAtlas}                 The created ImageAtlas
 * @param name {string}                     Name of image atlas resource
 * @param bitmap {b5.Bitmap}                Bitmap that contains frames
 * @param x {number}                        X pixel coordinate of top left hand corner of frame to add
 * @param y {number}                        Y pixel coordinate of top left hand corner of frame to add
 * @param w {number}                        Width of frame in pixels
 * @param h {number}                        Height of frame in pixels
 * @param ox {number}                       Offset of the frame on the x-axis
 * @param oy {number}                       Offset of the frame on the y-axis
 *
 * @property {object[]}                 frames          - Array of atlas frame objects in the form {x, y, w, h} (internal)
 * @property {b5.App|b5.Scene}          parent          - Parent resource manager (internal)
 * @property {string}                   name            - Name of this image atlas resource
 * @property {b5.Bitmap}                bitmap          - The bitmap object that images will be used asa source for sub images
 */
b5.ImageAtlas = function(name, bitmap, x, y, w, h, ox, oy)
{
    // Internal variables
    this.frames = [];                   // Array of atlas frame objects in the form {x, y, w, h}
    this.anims = [];                    // Array of brush animations {indices, speed} (name of animation, brush frame indices, speed of playback in fps), anim name is array index
    this.parent = null;                 // Parent container

    // Public variables
    this.name = name;					// Atlas name
    this.bitmap = bitmap;				// The bitmap object that images will be used asa source for sub images

    if (x !== undefined && y !== undefined && w !== undefined && h !== undefined)
        this.addFrame(x, y, w, h, ox, oy);
};

/**
 * Adds the specified atlas frame
 * @param sx {number} X pixel coordinate of top left hand corner of frame to add
 * @param sy {number} Y pixel coordinate of top left hand corner of frame to add
 * @param sw {number} Width of frame in pixels
 * @param sh {number} Height of frame in pixels
 * @param ox {number} Offset of the frame on the x-axis
 * @param oy {number} Offset of the frame on the y-axis
 */
b5.ImageAtlas.prototype.addFrame = function(sx, sy, sw, sh, ox, oy)
{
    if (ox === undefined)
        ox = 0;
    if (oy === undefined)
        oy = 0;
    this.frames.push({ x: sx, y: sy, w: sw, h: sh, ox: ox, oy: oy });
};

/**
 * Returns the atlas frame at the specified index
 * @param index {number} Atlas frame index
 * @returns {Object} The atlas frame
 */
b5.ImageAtlas.prototype.getFrame = function(index)
{
    return this.frames[index];
};

/**
 * Returns total number of atlas frames int this atlas image
 * @returns {Number} Total number of frames in the atlas image
 */
b5.ImageAtlas.prototype.getMaxFrames = function()
{
    return this.frames.length;
};


/**
 * Adds the specified animation to the atlas
 * @param name {string} Name of the animation to add
 * @param indices {array} Array of frame indices
 * @param speed {number} Speed at which to play the animation in frames per second
 */
b5.ImageAtlas.prototype.addAnim = function(name, indices, speed)
{
    this.anims[name] = { indices: indices, speed: speed };
};

/**
 * Returns the specified animation
 * @param index {numer} Atlas frame index
 * @returns {Object} The atlas frame
 */
b5.ImageAtlas.prototype.getAnim = function(name)
{
    return this.anims[name];
};

/**
 * Generates multiple atlas frames, working from left to right, top to bottom
 * @param start_x {number} X pixel coordinate of top left hand corner of start point
 * @param start_y {number} Y pixel coordinate of top left hand corner of start point
 * @param frame_w {number} Width of each frame in pixels
 * @param frame_h {number} Height of each frame in pixels
 * @param count_x {number} Total frames to generate across the image
 * @param count_y {number} Total frames to generate down the image
 * @param total {number} Optional parameter that can be used to limit total number of generated frames
 */
b5.ImageAtlas.prototype.generate = function(start_x, start_y, frame_w, frame_h, count_x, count_y, total)
{
    if (total !== undefined)
        total = count_x * count_y;
    var fy = start_y;
    for (var y = 0; y < count_y; y++)
    {
        var fx = start_x;
        for (var x = 0; x < count_x; x++)
        {
            this.addFrame(fx, fy, frame_w, frame_h, 0, 0);
            fx += frame_w;
            total--;
            if (total <= 0)
                return;
        }
        fy += frame_h;
    }
};

/**
 * Removes the atlas from the scene / app and destroys it
 */
b5.ImageAtlas.prototype.destroy = function()
{
    if (this.parent !== null)
        this.parent.removeResource(this, "brush");
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A Material represents a physical material and is assigned to {@link b5.Actor} fixtures which modifies their behaviour
 * within the physics engine. Generally a material should be added to either a {@link b5.Scene} or the global {@link b5.App}'s
 * resources so that it can be managed by them.
 *
 * Example showing how to create a physics material
 *
 *      var material = new b5.Material("floor");
 *      material.type = "static";
 *      material.density = 1;
 *      material.friction = 0.1;
 *      material.restitution = 0.5;
 *
 * For a complete overview of Resources see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/resources-the-stuff-that-games-are-made-of/ Booty5 Resources Overview}
 *
 * @class b5.Material
 * @constructor
 * @returns {b5.Material}                   The created material
 * @param name {string}                     Name of material resource
 *
 * @property {b5.App|b5.Scene}          parent          - Parent resource manager (internal)
 * @property {string}                   name            - Name of this image atlas resource
 * @property {string}                   type            - Type of physics material (static, dynamic or kinematic)
 * @property {number}                   density         - Material density, higher values make for heavier objects
 * @property {number}                   friction        - Material friction, lower values make objects more slippery
 * @property {number}                   restitution     - Material restitution, lower values make he object less bouncy
 * @property {number}                   gravity_scale   - Gravity scale, lower values lessen the affects of gravity on the object
 * @property {boolean}                  fixed_rotation  - Set to true to prevent objects from rotating
 * @property {boolean}                  is_bullet       - Set to true if fast moving object
 */
b5.Material = function(name)
{
    // Internal variables
    this.parent = null;                 // Parent container

    // Public variables
    this.name = name;					// The materials name
    this.type = "static";				// Type of material (can be static, dynamic or kinematic)
    this.density = 1;					// Material density, higher values make for heavier objects
    this.friction = 0.1;				// Material friction, lower values make objects more slippery
    this.restitution = 0.1;				// Material restitution, lower values make he object less bouncy
    this.gravity_scale = 1;				// Gravity scale, lower values lessen the affects of gravity on the object
    this.fixed_rotation = false;		// Set to true to prevent objects from rotating
    this.is_bullet = false;				// Set to true if fast moving object
};

/**
 * Removes the material from the scene / app and destroys it
 */
b5.Material.prototype.destroy = function()
{
    if (this.parent !== null)
        this.parent.removeResource(this, "material");
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A Shape object represents a 2D geometric shape. A shape can be used to:
 *
 * - Provide physical shapes that can be attached as fixtures to {@link b5.Actor}s changing their shape in the physics system
 * - Provide visual shape to actors affecting how they are rendered
 * - Provide clipping regions for {@link b4.Scene}s and {@link b5.Actor}s that support child clipping
 *
 * Generally a shape should be added to either a {@link b5.Scene} or the global {@link b5.App}'s resources so that it can be managed by them.
 *
 * Example showing how to add a clipping shape to a scene
 *
 *      var clipper = new b5.Shape();       // Create a circle shape
 *      clipper.type = b5.Shape.TypeCircle;
 *      clipper.width = 100;
 *      scene.clip_shape = clipper;      // Assign the shape as the scenes clip shape
 *
 * For a complete overview of Resources see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/resources-the-stuff-that-games-are-made-of/ Booty5 Resources Overview}
 *
 * @class b5.Shape
 * @constructor
 * @returns {b5.Shape}                      The created shape
 * @param name {string}                     Name of shape resource
 *
 * @property {b5.App|b5.Scene}          parent          - Parent resource manager (internal)
 * @property {string}                   name            - Name of this image atlas resource
 * @property {number}                   type            - Type of shape
 * @property {number}                   width           - Width of shape (or radius if circle)
 * @property {number}                   height          - Height of shape
 * @property {number[]}                 vertices        - Array of vertices for a polygon type shape in the form [x1,y1,x2,y2,....]
 * @property {object[]}                 convexVertices  - If the shape represented by vertices is concave then this property contains a list of convex polygons, each element is an array of vertices
 */
b5.Shape = function(name)
{
    // Internal variables
    this.parent = null;                 // Parent container

    // Public variables
    this.name = name;					// The shapes name
    this.type = b5.Shape.TypeBox;		// Type of shape
    this.width = 0;						// Width of shape (or radius if circle)
    this.height = 0;					// Height of shape
    this.vertices = [];					// Array of vertices for a polygon type shape in the form [x1,y1,x2,y2,....]
    this.convexVertices = [];           // If the shape represented by vertices is concave then this property contains a list of convex polygons, each element is an array of vertices
};

/**
 * Shape is of type box
 * @type {number}
 */
b5.Shape.TypeBox = 0;
/**
 * Shape is of type circle
 * @type {number}
 */
b5.Shape.TypeCircle = 1;
/**
 * Shape is of type polygon
 * @type {number}
 */
b5.Shape.TypePolygon = 2;

/**
 * Converts shape name to shape value
 * @param type_name {string}    Name of shape
 * @returns {number}            Shape type
 */
b5.Shape.prototype.typeToConst = function(type_name)
{
    if (shape.type === "polygon")
        return b5.Shape.TypePolygon;
    else
    if (shape.type === "circle")
        return b5.Shape.TypeCircle;

    return b5.Shape.TypeBox;
};

/**
 * Removes the shape from the scene / app and destroys it
 */
b5.Shape.prototype.remove = function()
{
    if (this.parent !== null)
        this.parent.removeResource(this, "shape");
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A Sound represents a sound effect object and can be used to play back audio
 *
 * Generally a sound should be added to either a {@link b5.Scene} or the global {@link b5.App}'s resources so that it can be managed by them.
 *
 * Example showing how to load and play a sound effect
 *
 *      var sound = new b5.Sound("explosion", "sounds/explosion.mp3", true);
 *      var instance = sound.play();
 *
 * For a complete overview of Resources see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/resources-the-stuff-that-games-are-made-of/ Booty5 Resources Overview}
 *
 * @class b5.Sound
 * @constructor
 * @returns {b5.Sound}                      The created sound
 * @param name {string}                     Name of sound resource
 * @param location {string}                 The sound file location
 * @param reuse {boolean}                   Mark the sound to be re-used (only one single instance will ever be created if true)
 *
 * @property {b5.App|b5.Scene}          parent          - Parent resource manager (internal)
 * @property {object}                   snd             - Sound instance (re-usable sound only) (internal). For Web Audio stores a {source:AudioBufferSourceNode, gain:GainNode} object for auto play sounds
 * @property {object}                   buffer          - AudioBufferSourceNode containing decoded audio data (Web Audio only)
 * @property {string}                   name            - Name of this sound resource
 * @property {string}                   location        - The location of the sound file that is used to create the audio object
 * @property {string}                   location2       - The location of the sound file that is used as a fall back if sound at location does not load
 * @property {boolean}                  reuse           - When set to false the generated sound Audio will be re-used, this can prevent sounds that are currently playing being replayed whilst currently being played but can help resolve audio playback issues (Not used by Web Audio)
 * @property {boolean}                  loop            - If set to true then sound will be looped
 * @property {boolean}                  preload         - If set to true then this sound will be preloaded
 * @property {boolean}                  auto_play         - If set to true then this sound will be preloaded
 * @property {boolean}                  loaded          - If true then this resource has finished loading
 */
b5.Sound = function(name, location, reuse)
{
    // internal variables
    this.parent = null;                 // Parent container
    this.snd = null;                    // Sound instance (re-usable sound only). For Web Audio stores a {AudioBufferSourceNode, GainNode } object for auto play sounds
    this.buffer = null;                 // AudioBufferSourceNode containing decoded audio data (Web Audio only)

    // Public variables
    this.name = name;					// The sound name
    this.location = location;			// Location of the sound
    this.location2 = null;			    // Location of fallback sound
    this.loop = false;                  // If set to true the this sound will replay continuously
    if (reuse !== undefined)
        this.reuse = reuse;			    // When set to true sound effect instance will be reused
    else
        this.reuse = false;
    this.preload = false;               // Set to true to preload sound
    this.loaded = false;                // Set to true once audio cam be played
    this.auto_play = false;             // Set to true to auto play sound when loaded
    this.load_retry = 0;
};

/**
 * AudioContext used by Web Audio API
 * @type {object}
 */
b5.Sound.context = null;
b5.Sound.blocked = false;
b5.Sound.muted = false;

b5.Sound.unblock = function()
{
	if (b5.Sound.blocked)
	{
		b5.Sound.context.resume().then(function()
		{
			b5.Sound.blocked = false;
		});
	}
}

/**
 * Initialises the sound system
 * @parm app {b5.App}   The App that will manage the audio engine
 * @returns {boolean}   true for success or false if error
 */
b5.Sound.init = function(app)
{
    try
    {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (window.AudioContext === undefined)
        {
            return false;
        }
        b5.Sound.context = new AudioContext();

        if (b5.Sound.context.state === "suspended")
        {
            b5.Sound.blocked = true;
        }
    }
    catch(e)
    {
        if (b5.app.instants)
            FBInstant.logEvent('Web audio error');
        return false;
    }
    return true;
};

/**
 * Checks if the supplied audio file type is supported
 * @param  filename {string}    Name of audio file
 * @returns {boolean}           true if probably supported, false if not
 */
b5.Sound.isSupported = function(filename)
{
    return true;
};

/**
 * Loads the sound
 */
b5.Sound.prototype.load = function(force, done_callback)
{
    if (!b5.app.use_web_audio)
    {
        this.snd = new Audio(this.location);
        b5.app.onResourceLoaded(this, true);
        return;
    }
    var debug = b5.app.debug;
    //var snd;
    var that = this;
    var filename = this.location;
    var auto_play = this.auto_play;

    if (!b5.Utils.loadJSON(filename, false, function(data) {
        if (data !== null)
        {
            b5.Sound.context.decodeAudioData(data, function(buffer) {
                that.buffer = buffer;
                b5.app.onResourceLoaded(that, false);
                if (auto_play)
                    that.play(force);
                if (done_callback !== undefined)
                    done_callback(this);
            }, function(e)
            {
                console.log(e)
            });
        }
        else
        {
            that.load_retry++;
            if (that.load_retry > 3)
                b5.app.onResourceLoaded(that, true);
            else
                that.load();
        }
    }, true))
    {
        that.load_retry++;
        if (that.load_retry > 3)
            b5.app.onResourceLoaded(that, true);
        else
            that.load();
    }
};

/**
 * Starts playback of the sound
 * @returns {object} An Audio object representing the playing sound or a {source, gain} object if using Web Audio API
 */
b5.Sound.prototype.play = function(force)
{
    if (force != true && b5.Sound.muted)
        return null;
    if (!b5.app.use_web_audio)
    {
        this.snd.loop = this.loop;
        this.snd.play();
        return;
    }
        
    if (this.buffer === null)
        return null;
    var context = b5.Sound.context;
    var source = context.createBufferSource();
    var gain = context.createGain();
    source.buffer = this.buffer;
    source.loop = this.loop;
    source.connect(gain);
    gain.connect(context.destination);
    gain.gain.value = 1;
    source.start(0);
    if (this.auto_play)
        this.snd = { source: source, gain: gain };
    return { source: source, gain: gain };
};

/**
 * Stops playback of the sound (re-usable sound only)
 */
b5.Sound.prototype.stop = function()
{
    var snd = this.snd;
    if (snd === null || snd === undefined)
        return;
    if (!b5.app.use_web_audio)
    {
        snd.pause();
        return;
    }
        
    snd = snd.source;
    snd.stop();
};

/**
 * Pauses playback of the sound (re-usable sound only)
 */
b5.Sound.prototype.pause = function()
{
    if (!b5.app.use_web_audio)
    {
        snd.pause();
        return;
    }
    var snd = this.snd;
    if (snd === null || snd === undefined)
        return;
//    snd.pause();
};

/**
 * Removes the sound from the scene / app and destroys it
 */
b5.Sound.prototype.destroy = function()
{
};


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * Generic utility functionality
 *
 *
 * @class b5.Utils
 *
 */
b5.Utils = function()
{
};

/**
 * Loads a JSON file
 * @param filename      {string}    File name
 * @param blocking      {boolean}   If true then file will be loaded synchronously, otherwise asynchronously
 * @param callback      (function)  Callback that will be called when the file has been downloaded
 * @param binary        (boolean)   If true then data is returned as binary
 * @returns {boolean}               true if success, false if error
 */
b5.Utils.loadJSON = function(filename, blocking, callback, binary)
{
    var req = new XMLHttpRequest();
    req.open("GET", filename, !blocking);
    req.overrideMimeType("application/json");
    if (binary)
        req.responseType = "arraybuffer";
    if (!blocking)
    {
        req.onreadystatechange = function()
        {
            if (req.readyState === 4)
            {
                if (req.status === 200 || req.status === 0) // 0 for node-webkit
                {
                    if (binary)
                        callback(req.response);
                    else
                        callback(req.responseText);
                }
                else
                    callback(null);
            }
        };
    }
    try
    {
        req.send();
    }
    catch(e)
    {
        return false;
    }

    if (blocking)
    {
        if (req.status === 200)
        {
            if (binary)
                callback(req.response);
            else
                callback(req.responseText);
        }
        else
            callback(null);
    }

    return true;
};

/**
 * Adds a JavaScript file to the head of the document
 * @param filename {string} File name
 */
b5.Utils.loadJS = function(filename)
{
    var fileref = document.createElement('script');
    fileref.setAttribute("type","text/javascript");
    fileref.setAttribute("src", filename);

    if (typeof fileref !== "undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref);
};

/**
 * Sends a get request over http
 * @param url {string} URL + data
 * @parm callback (function) Callback to call when complete
 */
b5.Utils.SendGetRequest = function(url, callback)
{
    var req = new XMLHttpRequest();
    req.onreadystatechange = function()
	{ 
        //if (callback != undefined && req.readyState == 4 && req.status == 200)
            //callback(req.responseText);
        if (callback != undefined)
        {
            callback(req);
        }
    }
    req.open("GET", url, true);
    req.send();
}

/**
 * Sends JSON using a post request over http
 * @param url {string} URL
 * @param json {string} JSON data
 * @parm callback (function) Callback to call when complete
 */
b5.Utils.SendPostJSONRequest = function(url, json, callback)
{
    var req = new XMLHttpRequest();
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.onreadystatechange = function()
	{ 
        //if (callback != undefined && req.readyState == 4 && req.status == 200)
            //callback(req.responseText);
        if (callback != undefined)
        {
            callback(req);
        }
    }
    req.send(JSON.stringify(json));
}

/**
 * Finds an actor, scene, timeline or actions list object from a path of the form scene_name.actor_name....
 * @param path {string}     Path to object,, such as scene1.actor1.timeline1
 * @param type {string}     Type of resource (can be timeline, actions, or undefined for scene or actor)
 * @returns {object}        The found object or null if not found
 */
b5.Utils.findObjectFromPath = function(path, type)
{
    var objs = path.split(".");
    var count = objs.length;
    if (count === 0)
        return null;
    var parent = b5.app.findScene(objs[0]);
    if (count === 1 && type === undefined)
        return parent;
    if (count > 1)
    {
        if (type === undefined)
        {
            for (var t = 1; t < count; t++)
                parent = parent.findActor(objs[t]);
            if (parent === null)
            {
                if (b5.app.debug)
                    console.log("Warning: Could not resolve object with path '" + path + "'");
                return null;
            }
            return parent;
        }
        var c = type.charAt(0);
        if (c == 't' && type === "timeline")
        {
            for (var t = 1; t < count - 1; t++)
                parent = parent.findActor(objs[t]);
            if (parent === null)
            {
                if (b5.app.debug)
                    console.log("Warning: Could not resolve timeline with path '" + path + "'");
                return null;
            }
            return parent.timelines.find(objs[count - 1]);
        }
        if (c == 'a' && type === "actions")
        {
            for (var t = 1; t < count - 1; t++)
                parent = parent.findActor(objs[t]);
            if (parent === null)
            {
                if (b5.app.debug)
                    console.log("Warning: Could not resolve actions with path '" + path + "'");
                return null;
            }
            return parent.actions.find(objs[count - 1]);
        }
    }

    if (b5.app.debug)
        console.log("Warning: Could not resolve object with path '" + path + "'");

    return null;
};

/**
 * Finds a resource object from a path of the form scene_name.resource_name
 * @param path {string} Path to resource, for example scene1.shape1
 * @param type {string} Type of resource (brush, sound, shape, material, bitmap, font)
 * @returns {object}    The found resource or null if not found
 */
b5.Utils.findResourceFromPath = function(path, type)
{
    var objs = path.split(".");
    var count = objs.length;
    if (count === 0)
        return null;
    var parent = b5.app;
    if (count > 1)
        parent = b5.app.findScene(path);

    var res = parent.findResource(objs[count - 1], type);
    if (res !== null)
        return res;

    if (b5.app.debug)
        console.log("Warning: Could not resolve resource for path '" + path + "'");

    return null;
};

/**
 * Takes an object or an object path and returns the found object
 * @param obj_or_path {object|string}   Instance of object or path to object
 * @param type {string}                 Type of resource (can be timeline, actions, or undefined for scene or actor)
 * @returns {object}                    The found object or null
 */
b5.Utils.resolveObject = function(obj_or_path, type)
{
    if (obj_or_path === undefined)
        return null;
    if (typeof obj_or_path === "string")
        return b5.Utils.findObjectFromPath(obj_or_path, type);
    else
        return obj_or_path;
};

/**
 *
 * @param res_or_path {string}  Instance of resource or path to resource, for example scene1.shape1
 * @param type {string}         Type of resource (brush, sound, shape, material, bitmap, font)
 * @returns {object}            The found resource or null if not found
 */
b5.Utils.resolveResource = function(res_or_path, type)
{
    if (res_or_path === undefined)
        return null;
    if (typeof res_or_path === "string")
        return b5.Utils.findResourceFromPath(res_or_path, type);
    else
        return res_or_path;
};

//
/**
 * Returns the correct resource buffer based on resourced type
 * @param parent {object}   Parent resource container
 * @param type {string}     The type of resource
 * @returns {object}        The resource buffer or null if not found
 */
b5.Utils.getResFromType = function(parent, type)
{
    var c = type.charAt(0);
    if (c == 'b')
    {
        if (type === "brush")
            return parent.brushes;
        else if (type === "bitmap")
            return parent.bitmaps;
    }
    else if (c == 's')
    {
        if (type === "sound")
            return parent.sounds;
        else if (type === "shape")
            return parent.shapes;
    }
    else if (c == 'm' && type === "material")
        return parent.materials;
    else if (type === "raw")
        return parent.raw;
    else if (type === "font")
        return parent.fonts;
    
        return null;
};

/**
 * Used by actors and scenes to sort their children into layers
 * @param objs {object} Actor or scene array
 */
b5.Utils.sortLayers = function(objs)
{
    var cnt = objs.length;
    var s, t;
    for (t = 0; t < cnt; t++)
    {
        for (s = t + 1; s < cnt; s++)
        {
            if (objs[t].layer > objs[s].layer)
            {
                var obj = objs[t];
                objs[t] = objs[s];
                objs[s] = obj;
            }
        }
    }
};

/**
 * Creates a HTML5 canvas and adds it to the document
 * @param id {string}       Canvas identifier
 * @param width {nunber}    Width of canvas
 * @param height {nunber}   Height of canvas
 * @param zindex {nunber}   Z-index of canvas
 * @returns {object}        The created canvas
 */
b5.Utils.CreateCanvas = function(id, width, height, zindex)
{
    var canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.width = width;
    canvas.style.width = width + "px";
    canvas.height = height;
    canvas.style.height = height + "px";
    canvas.style.zIndex = zindex;
    canvas.style.position = "fixed";
    canvas.style.display = "block";
    canvas.style.left =	0;
    canvas.style.top = 0;
    canvas.style.right =	0;
    canvas.style.bottom = 0;
    canvas.style.margin = "auto";
    canvas.style.pointerEvents = "auto";
    canvas.style.visibility = "visible";
    //canvas.style.background = "#80ff80";
    //parent.appendChild(canvas);
    document.body.appendChild(canvas);
    return canvas;
};

b5.Utils.GetDevicePixelRatio = function()
{
    if (window.devicePixelRatio !== undefined)
    {
        return window.devicePixelRatio;
    }
    var screen = window.screen;
    return (screen !== undefined && screen.systemXDPI !== undefined && screen.logicalXDPI !== undefined && screen.systemXDPI > screen.logicalXDPI) ? (screen.systemXDPI/screen.logicalXDPI) : 1;
};

b5.Utils.GetBackingStorePixelRatio = function(context)
{
    return context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio || 1;
};

b5.Utils.RunafterTime = function(delay, task_function, task_data)
{
    b5.app.addTask("", delay, 1, task_function, task_data);
};


b5.Utils.SetFullscreen = function(enable)
{
    if (!document.fullscreenEnabled)
    {
        return;
    }

    if (enable)
    {
        if (document.fullscreenElement == null)
        {
            b5.app.canvas.requestFullscreen();
        }
    }
    else
    {
        if (document.fullscreenElement != null)
        {
            document.exitFullscreen();
        }
    }
};

b5.Utils.IsMobile = function()
{
    var ua = navigator.userAgent;
    function IsAndroid() {
        return ua.match(/Android/i);
    }
    function IsBlackBerry() {
        return ua.match(/BlackBerry/i);
    }
    function IsiOS() {
        return ua.match(/iPhone|iPad|iPod/i);
    }
    function IsOpera() {
        return ua.match(/Opera Mini/i);
    }
    function IsWindows() {
        return ua.match(/IEMobile/i);
    }
    return (IsAndroid() || IsBlackBerry() || IsiOS() || IsOpera() || IsWindows());
};

b5.Utils.GetPlatform = function()
{
    var ua = navigator.userAgent;
    if (ua.match(/Android/i))
        return "ANDROID";
    if (ua.match(/BlackBerry/i))
        return "BLACKBERRY";
    if (ua.match(/iPhone|iPad|iPod/i))
        return "IOS";
    if (ua.match(/Opera Mini/i))
        return "OPERA";
    if (ua.match(/IEMobile/i))
        return "WINDOWS"
    return "WEB";
};

"use strict";

var Log = function(message)
{
    if (b5.app.debug)
        console.log(message);
}

b5.Instants = function()
{
    this.onPaused = undefined;
    this.onPaymentsReady = undefined;
    this.videoAdsSupported = false;
    this.interstitialAdsSupported = false;
    this.purchasingSupported = false;
    this.purchasingReady = false;
    this.preloadedVideoAd = null;
    this.preloadedInterAd = null;
    this.adReady = false;
    this.adLoadErrorCode = 0;
    this.adLoadError = "";
    this.adLoadErrorCount = "";
    this.vadReady = false;
    this.vadLoadErrorCode = 0;
    this.vadLoadError = "";
    this.shotCache = null;
    var that = this;
    
    if (FBInstant !== undefined)
    {
        FBInstant.onPause(function() {
            if (that.onPaused !== undefined)
                that.onPaused();
        });
        FBInstant.payments.onReady(function () {
            Log(">>>> Purchasing is ready");
            that.purchasingReady = true;
            if (that.onPaymentsReady !== undefined)
                that.onPaymentsReady();
        });        
    }
};

b5.Instants.prototype.Init = function()
{
    var supportedAPIs = FBInstant.getSupportedAPIs();
    if (supportedAPIs.includes("getInterstitialAdAsync"))
        this.interstitialAdsSupported = true;
    else
        FBInstant.logEvent("Ads inter not supported", 1);
    if (supportedAPIs.includes("getRewardedVideoAsync"))
        this.videoAdsSupported = true;
    else
        FBInstant.logEvent("Ads video not supported", 1);
    
    if (supportedAPIs.includes("payments.purchaseAsync"))
        this.purchasingSupported = true;
};

b5.Instants.prototype.StartInit = function(done_callback)
{
    FBInstant.initializeAsync().then(function()
	{
        FBInstant.logEvent('FB Init Success');
        if (done_callback !== undefined)
            done_callback();
    });
};

b5.Instants.prototype.StartGame = function(done_callback)
{
    FBInstant.startGameAsync().then(function()
    {
        if (b5.app.total_load_errors > 0)
            FBInstant.logEvent('FB Load Errors');
        else
            FBInstant.logEvent('FB Load Finished');
        if (done_callback !== undefined)
            done_callback(true);
    }).catch(function(e) {
        done_callback(false);
    });
};

b5.Instants.prototype.SetLoadingProgress = function(perc)
{
    FBInstant.setLoadingProgress(perc);
};

b5.Instants.prototype.GetLocale = function()
{
    return FBInstant.getLocale();
};

b5.Instants.prototype.GetPlatform = function()
{
    return FBInstant.getPlatform();
};

b5.Instants.prototype.GetEntryPointData = function()
{
    return FBInstant.getEntryPointData();
};

b5.Instants.prototype.GetPlayerID = function()
{
    return FBInstant.player.getID();
};

b5.Instants.prototype.GetPlayerName = function()
{
    return FBInstant.player.getName();
};

b5.Instants.prototype.GetPlayerPhotoURL = function()
{
    return FBInstant.player.getPhoto();
};

b5.Instants.prototype.GetConnectedPlayers = function(done_callback)
{
    FBInstant.player.getConnectedPlayersAsync()
    .then(function(players) {
        if (done_callback !== undefined)
            done_callback(players);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(null);
    });
};

b5.Instants.prototype.GetContext = function()
{
    return FBInstant.context;
};

b5.Instants.prototype.GetContextPlayers = function(done_callback)
{
    FBInstant.context.getPlayersAsync()
    .then(function(players) {
        if (done_callback !== undefined)
            done_callback(players);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(null);
    });
};

b5.Instants.prototype.ChooseContext = function(done_callback)
{
    FBInstant.context.chooseAsync()
    .then(function() {
        if (done_callback !== undefined)
            done_callback(true);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(false, error);
    });
};

b5.Instants.prototype.ChooseContextWithOptions = function(options, done_callback)
{
    FBInstant.context.chooseAsync(options)
    .then(function() {
        if (done_callback !== undefined)
            done_callback(true);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(false, error);
    });
};

b5.Instants.prototype.SwitchContext = function(context_id, done_callback)
{
    FBInstant.context.switchAsync(context_id)
    .then(function() {
        if (done_callback !== undefined)
            done_callback(true);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(false, error);
    });
};

b5.Instants.prototype.CreateContext = function(player_id, done_callback)
{
    FBInstant.context.createAsync(player_id)
    .then(function() {
        if (done_callback !== undefined)
            done_callback(true, FBInstant.context.getID());
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(false, error);
    });
};

b5.Instants.prototype.SetPlayerData = function(data_object, done_callback)
{
    FBInstant.player.setDataAsync(data_object)
    .then(function() {
        if (done_callback !== undefined)
            done_callback(true);
        Log("Player data set");
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(false);
    });
};

b5.Instants.prototype.GetPlayerData = function(property_array, done_callback)
{
    FBInstant.player.getDataAsync(property_array)
    .then(function(data) {
        if (done_callback !== undefined)
            done_callback(data);
        Log("Player data loaded");
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback();
    });
};

b5.Instants.prototype.SetSessionData = function(data_object)
{
    FBInstant.setSessionData(data_object);
};

b5.Instants.prototype.SwitchGame = function(app_id, data, fail_callback)
{
    FBInstant.switchGameAsync(app_id, data).catch(function(e)
    {
        if (fail_callback !== undefined)
            fail_callback(e);
    });
};

b5.Instants.prototype.PostCustomUpdate = function(title, image64, message, custom_template, strategy, data, done_callback)
{
    FBInstant.updateAsync({
        action: "CUSTOM",
        cta: title,
        image: image64,
        text: {
            default: message,
            localizations: {
            }
        },
        template: custom_template,
        data: { myReplayData: data },
        strategy: strategy,
        notification: "NO_PUSH",
    })
    .then(function(){
        Log("Message was sent successfully");
        if (done_callback !== undefined)
            done_callback();
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback();
    });
};

b5.Instants.prototype.PostLeaderboardUpdate = function(leaderboard, message, done_callback)
{
    FBInstant.updateAsync({
        action: "LEADERBOARD",
        name: leaderboard,
        text: message
    })
    .then(function(){
        Log("Leaderboard message was sent successfully");
        if (done_callback !== undefined)
            done_callback();
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback();
    });
};

b5.Instants.prototype.ShareCustom = function(intent, image, message, data, done_callback)
{
    FBInstant.shareAsync({
        intent: intent,
        image: image,
        text: message,
        data: { myReplayData: data },
    })
    .then(function(){
        Log("Shared successfully");
        if (done_callback !== undefined)
            done_callback(true);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(false, error);
    });
};

b5.Instants.prototype.GetLeaderboardEntries = function(leaderboard_name, start, count, done_callback)
{
    FBInstant.getLeaderboardAsync(leaderboard_name)
        .then(function(leaderboard) {
            return leaderboard.getEntriesAsync(count, start);
        }).then(function(entries) {
            Log("Leaderboard retrieved");
            Log(entries);
            if (done_callback != undefined)
                done_callback(entries);
        }).catch(function(error) {
            Log(error)
            if (done_callback != undefined)
                done_callback(null);
        });
};

b5.Instants.prototype.GetConnectedLeaderboardEntries = function(leaderboard_name, start, count, done_callback)
{
    FBInstant.getLeaderboardAsync(leaderboard_name)
        .then(function(leaderboard) {
            return leaderboard.getConnectedPlayerEntriesAsync(count, start);
        }).then(function(entries) {
            Log("Connected leaderboard retrieved");
            Log(entries);
            if (done_callback != undefined)
                done_callback(entries);
        }).catch(function(error) {
            Log(error)
            if (done_callback != undefined)
                done_callback(null);
        });
};

b5.Instants.prototype.SetLeaderboardScore = function(leaderboard_name, score, meta, done_callback)
{
    FBInstant.getLeaderboardAsync(leaderboard_name)
        .then(function(leaderboard) {
            return leaderboard.setScoreAsync(score, meta);
        }).then(function(entry) {
            Log("Score saved");
            Log(entry);
            if (done_callback != undefined)
                done_callback(true, entry);
        }).catch(function(error) {
            Log(error);
            if (done_callback != undefined)
                done_callback(false);
        });
};

b5.Instants.prototype.GetLeaderboardScore = function(leaderboard_name, done_callback)
{
    FBInstant.getLeaderboardAsync(leaderboard_name)
        .then(function(leaderboard)
        {
            return leaderboard.getPlayerEntryAsync();
        }).then(function(entry) {
            Log("Score retrieved");
            Log(entry);
            if (done_callback != undefined)
                done_callback(entry);
        }).catch(function(error) {
            if (done_callback != undefined)
                done_callback(null);
            console.error(error);
        });
};

b5.Instants.prototype.CanMatchPlayer = function(done_callback)
{
    FBInstant.checkCanPlayerMatchAsync()
        .then(function(canMatch) {
            if (done_callback !== undefined)
                done_callback(canMatch);
        }).catch(function(error) {
            Log(error);
            if (done_callback !== undefined)
                done_callback(false);
        });
}

b5.Instants.prototype.MatchPlayer = function(tag, switch_context, done_callback)
{
    FBInstant.matchPlayerAsync(tag, switch_context)
        .then(function() {
            if (done_callback !== undefined)
                done_callback(true);
        }).catch(function(err) {
            if (done_callback !== undefined)
                done_callback(false);
        });
}

b5.Instants.prototype.Quit = function()
{
    FBInstant.quit();
};

b5.Instants.prototype.GetPlayerPhotoURL = function()
{
    return FBInstant.player.getPhoto();
};

b5.Instants.prototype.PreloadVideoAd = function(done_callback, placement_id)
{
    if (!this.videoAdsSupported)
        return;
    var that = this;
    FBInstant.getRewardedVideoAsync(
        placement_id
      ).then(function(rewarded) {
        that.preloadedVideoAd = rewarded;
        return that.preloadedVideoAd.loadAsync();
      }).then(function() {
        that.vadReady = true;
        that.vadLoadError = "";
        that.vadLoadErrorCode = 0;
        Log("Rewarded video preloaded");
        if (done_callback !== undefined)
            done_callback(true);
      }).catch(function(err){
        that.vadReady = false;
        that.vadLoadError = err.message;
        that.vadLoadErrorCode = err.error;
        Log("Rewarded video failed to preload: " + err.message);
        if (done_callback !== undefined)
            done_callback(false, err);
      });
};

b5.Instants.prototype.ReloadVideoAd = function(done_callback)
{
    if (!this.videoAdsSupported)
        return;
    var that = this;
    this.preloadedVideoAd.loadAsync()
      .then(function() {
        that.vadReady = true;
        that.vadLoadError = "";
        that.vadLoadErrorCode = 0;
        Log("Rewarded video preloaded");
        if (done_callback !== undefined)
            done_callback(true);
      }).catch(function(err){
        that.vadReady = false;
        that.vadLoadError = err.message;
        that.vadLoadErrorCode = err.error;
        Log("Rewarded video failed to preload: " + err.message);
        if (done_callback !== undefined)
            done_callback(false, err);
      });
};

b5.Instants.prototype.ShowVideoAd = function(done_callback)
{
    var that = this;
    this.vadReady = false;
    if (!this.videoAdsSupported)
    {
        Log("Rewarded video ads not supported on this device");
        that.vadLoadError = "Not supported";
        that.vadLoadErrorCode = -1;
        if (done_callback !== undefined)
            done_callback(false);
        FBInstant.logEvent("ADVS no support", 1);
        return;
    }
    if (this.preloadedVideoAd === null)
    {
        return;
    }
    this.preloadedVideoAd.showAsync()
    .then(function() {
        if (done_callback !== undefined)
        {
            Log("Rewarded video paid");
            done_callback(true);
        }
    }).catch(function(e) {
        Log("Rewarded video playback error: " + e.message);
        that.vadLoadError = e.message;
        that.vadLoadErrorCode = e.error;
        if (done_callback !== undefined)
            done_callback(false, e);
    });
};

b5.Instants.prototype.PreloadInterstitialAd = function(done_callback, placement_id)
{
    if (!this.interstitialAdsSupported)
        return;
    var that = this;
    FBInstant.getInterstitialAdAsync(
        placement_id
      ).then(function(interstitial) {
        that.preloadedInterAd = interstitial;
        return that.preloadedInterAd.loadAsync();
      }).then(function() {
        that.adReady = true;
        that.adLoadError = "";
        that.adLoadErrorCode = 0;
        Log("Interstitial preloaded");
        if (done_callback !== undefined)
            done_callback(true);
      }).catch(function(err){
        that.adReady = false;
        that.adLoadError = err.message;
        that.adLoadErrorCode = err.error;
        Log("Interstitial failed to preload: " + err.message);
        if (done_callback !== undefined)
            done_callback(false, err);
      });
};

b5.Instants.prototype.ReloadInterstitialAd = function(done_callback)
{
    if (!this.interstitialAdsSupported)
        return;
    var that = this;
    this.preloadedInterAd.loadAsync()
      .then(function() {
        that.adReady = true;
        that.adLoadError = "";
        that.adLoadErrorCode = 0;
        Log("Interstitial preloaded");
        if (done_callback !== undefined)
            done_callback(true);
      }).catch(function(err){
        that.adReady = false;
        that.adLoadError = err.message;
        that.adLoadErrorCode = err.error;
        Log("Interstitial failed to preload: " + err.message);
        if (done_callback !== undefined)
            done_callback(false, err);
      });
};

b5.Instants.prototype.ShowInterstitialAd = function(done_callback)
{
    var that = this;
    this.adReady = false;
    if (!this.interstitialAdsSupported)
    {
        Log("Interstitial ads not supported on this device");
        that.adLoadError = "Not supported";
        that.adLoadErrorCode = -1;
        if (done_callback !== undefined)
            done_callback(false);
        FBInstant.logEvent("ADIS no support", 1);
        return;
    }
    if (this.preloadedInterAd === null)
    {
        if (done_callback !== undefined)
        {
            done_callback(true);
        }
        return;
    }
    this.preloadedInterAd.showAsync()
    .then(function() {
        if (done_callback !== undefined)
        {
            done_callback(true);
        }
    }).catch(function(e) {
        Log("Interstitial playback error: " + e.message);
        that.adLoadError = e.message;
        that.adLoadErrorCode = e.error;
        if (done_callback !== undefined)
            done_callback(false, e);
    });
};

b5.Instants.prototype.CreateScreenshotCache = function(height)
{
    var disp = b5.app.display;
    this.shotCache = disp.createCache();
    if (this.shotCache === null)
        return null;
    var canvas = b5.app.canvas;
    this.shotCache.height = height;
    this.shotCache.width = canvas.width * (this.shotCache.height / canvas.height);
}

b5.Instants.prototype.GetScreenshot = function(image, type, quality)
{
    var disp = b5.app.display;
    if (this.shotCache === null)
        return null;
    try
    {
        var canvas = b5.app.canvas;
        if (image !== undefined)
            canvas = image;
        var scale = (this.shotCache.height / canvas.height) / b5.app.pixel_ratio;
        disp.setCache(this.shotCache);
        disp.setTransform(scale,0,0,scale, 0,0);
        disp.drawImage(canvas, 0, 0);
        disp.setCache(null);
		if (type === "jpeg")
			return this.shotCache.toDataURL("image/jpeg", quality);
		else
			return this.shotCache.toDataURL("image/png");
    }
    catch (ex)
    {
        return null;
    }
}

b5.Instants.prototype.LogEvent = function(name, params, value)
{
    FBInstant.logEvent(name, value, params);
}

b5.Instants.prototype.GetProducts = function(done_callback)
{
    FBInstant.payments.getCatalogAsync().then(function(catalog)
    {
        if (done_callback !== undefined)
            done_callback(catalog);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(null);
    });
}

b5.Instants.prototype.GetUnconsumedProducts = function(done_callback)
{
    FBInstant.payments.getPurchasesAsync().then(function(purchases)
    {
        if (done_callback !== undefined)
            done_callback(purchases);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(null);
    });
}

b5.Instants.prototype.BuyProduct = function(product_id, payload, done_callback)
{
    FBInstant.payments.purchaseAsync(
    {
        productID: product_id,
        developerPayload: payload,
    }).then(function(purchase)
    {
        if (done_callback !== undefined)
            done_callback(purchase);
    }).catch(function(e) {
        Log("Purchase error: " + e.message);
        if (done_callback !== undefined)
            done_callback(null, e);
    });
}

b5.Instants.prototype.ConsumeProduct = function(token, done_callback)
{
    FBInstant.payments.consumePurchaseAsync(token)
    .then(function()
    {
        if (done_callback !== undefined)
            done_callback(true);
    }).catch(function(e) {
        Log("Purchase consumption error: " + e.message);
        if (done_callback !== undefined)
            done_callback(false, e);
    });
}

b5.Instants.prototype.CreateShortcut = function(done_callback)
{
	//console.log(">>>>>> CreateShortcut");
    FBInstant.canCreateShortcutAsync()
    .then(function(canCreateShortcut)
    {
        //console.log("canCreateShortcutAsync = " + canCreateShortcut);
        if (canCreateShortcut)
        {
            FBInstant.createShortcutAsync()
            .then(function() {
                console.log("Shortcut created");
                if (done_callback !== undefined)
                    done_callback(true);
            })
            .catch(function(error) {
                console.log("Shortcut creation error " + error);
                if (done_callback !== undefined)
                    done_callback(false);
            });
        }
        else
        {
            if (done_callback !== undefined)
                done_callback(false);
        }
    });
}

b5.Instants.instance = new b5.Instants();





/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Action List actions are actions that modify action lists
//
// A_ChangeActions      - Changes the named actions list

//
// The A_ChangeActions action changes the state of an actions list then exits
// - actions - Path to actions list or instance of actions list
// - action - Action to perform on the actions list (play, pause or restart)
//

/**
 * Action that changes the state of an actions list then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_ChangeActions
 * @constructor
 * @returns {b5.A_ChangeActions} The created action
 * @param actions {object} Actions list
 * @param action {string} Action to perform on the actions list (play, pause or restart)
 *
 */
b5.A_ChangeActions = function(actions, action)
{
    this.actions = actions;
    this.action = action;
};
b5.A_ChangeActions.prototype.onInit = function()
{
    this.actions = b5.Utils.resolveObject(this.actions, "actions");
    var actions = this.actions;
    if (actions !== null)
    {
        var action = this.action;
        if (action === "play")
            actions.play();
        else if (action === "pause")
            actions.pause();
        else if (action === "restart")
            actions.restart();
    }
};
b5.ActionsRegister.register("ChangeActions", function(p) { return new b5.A_ChangeActions(p[1], p[2]); });


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Actor actions are actions that create / modify actors
//
// A_CreateExplosion    - Creates an explosion particle system actor then exits
// A_CreatePlume        - Creates a plume particle system actor then exits

/**
 * Action that creates an explosion particle system actor then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CreateExplosion
 * @constructor
 * @returns {b5.A_CreateExplosion} The created action
 * @param container {string|b5.Scene|b5.Actor}     Path to scene / actor or instance of scene / actor that will contain the generated particle actor
 * @param count {number}                    Total number of particles to create
 * @param type {object|string}              The actor type of each particle created, for example Actor, ArcActor, LabelActor, PolygonActor etc
 * @param duration {number}                 The total duration of the particle system in seconds
 * @param speed {number}                    The speed at which the particles blow apart
 * @param spin_speed {number}               The speed at which particles spin
 * @param rate {number}                     Rate at which particles are created
 * @param damping {number}                  A factor to reduce velocity of particles each frame, values greater than 1 will increase velocities
 * @param properties {object}               Object that contains property / value pairs that will be set to particles when they are created (e.g. {"vx":0,"vy":0})
 * @param actor {b5.Actor}                  If provided then the generated particle actor will be placed at the same position and orientation as this actor, actor can be an instance of an actor or a path to an actor
 *
 */
b5.A_CreateExplosion = function(container, count, type, duration, speed, spin_speed, rate, damping, properties, actor)
{
    this.container = container;
    this.actor = actor;
    this.count = count;
    this.type = type;
    this.duration = duration;
    this.speed = speed;
    this.spin_speed = spin_speed;
    this.rate = rate;
    this.damping = damping;
    this.properties = properties;
};
b5.A_CreateExplosion.prototype.onInit = function()
{
    this.container = b5.Utils.resolveObject(this.container);
    this.actor = b5.Utils.resolveObject(this.actor);
    var actor = new b5.ParticleActor();
    this.container.addActor(actor);
    actor.generateExplosion(this.count, this.type, this.duration, this.speed, this.spin_speed, this.rate, this.damping, this.properties);
    if (this.actor !== null)
    {
        actor._x = this.actor.x;
        actor._y = this.actor.y;
        actor._rotation = this.actor.rotation;
    }
};
b5.ActionsRegister.register("CreateExplosion", function(p) { return new b5.A_CreateExplosion(p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8],p[9],p[10]); });

/**
 * Action that creates a plume particle system actor then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CreatePlume
 * @constructor
 * @returns {b5.A_CreatePlume} The created action
 * @param container {string|b5.Scene|b5.Actor}     Path to scene / actor or instance of scene / actor that will contain the generated particle actor
 * @param count {number}                    Total number of particles to create
 * @param type {object|string}              The actor type of each particle created, for example Actor, ArcActor, LabelActor, PolygonActor etc
 * @param duration {number}                 The total duration of the particle system in seconds
 * @param speed {number}                    The speed at which the particles blow apart
 * @param spin_speed {number}               The speed at which particles spin
 * @param rate {number}                     Rate at which particles are created
 * @param damping {number}                  A factor to reduce velocity of particles each frame, values greater than 1 will increase velocities
 * @param properties {object}               Object that contains property / value pairs that will be set to particles when they are created (e.g. {"vx":0,"vy":0})
 * @param actor {b5.Actor}                  If provided then the generated particle actor will be placed at the same position and orientation as this actor, actor can be an instance of an actor or a path to an actor
 *
 */
b5.A_CreatePlume = function(container, count, type, duration, speed, spin_speed, rate, damping, properties, actor)
{
    this.container = container;
    this.actor = actor;
    this.count = count;
    this.type = type;
    this.duration = duration;
    this.speed = speed;
    this.spin_speed = spin_speed;
    this.rate = rate;
    this.damping = damping;
    this.properties = properties;
};
b5.A_CreatePlume.prototype.onInit = function()
{
    this.container = b5.Utils.resolveObject(this.container);
    this.actor = b5.Utils.resolveObject(this.actor);
    var actor = new b5.ParticleActor();
    this.container.addActor(actor);
    actor.generatePlume(this.count, this.type, this.duration, this.speed, this.spin_speed, this.rate, this.damping, this.properties);
    if (this.actor !== null)
    {
        actor._x = this.actor.x;
        actor._y = this.actor.y;
        actor._rotation = this.actor.rotation;
    }
};
b5.ActionsRegister.register("CreatePlume", function(p) { return new b5.A_CreatePlume(p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8],p[9],p[10]); });


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Attractor actions are actions that attract or repel other objects
//
// A_AttractX           - Pulls objects towards or repels objects away on the x-axis that are within a specific range
// A_AttractY           - Pulls objects towards or repels objects away on the y-axis that are within a specific range
// A_Attract            - Pulls objects towards or repels objects away on the x and y-axis that are within a specific range

/**
 * Action that pulls objects towards or repels objects away on the x-axis that are within a specific range, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_AttractX
 * @constructor
 * @returns {b5.A_AttractX}             The created action
 * @param target {string:b5.Actor}      Path to or instance of actor object that will attract other objects
 * @param container {b5.Actor|b5.Scene} Path to or instance of object that contains the actors (actors that can be attracted have attract property set to true)
 * @param min_x {number}                Minimum x-axis attraction range
 * @param max_x {number}                Maximum x-axis attraction range
 * @param min_y {number}                Minimum y-axis inclusion range
 * @param max_y {number}                Maximum y-axis inclusion range
 * @param strength {number}             Strength of attraction, negative for repulsion
 * @param stop {boolean}                If set to true then attracted objects will stop when they hit the min distance range
 * @param bounce {boolean}              If set to true then objects when stopped at the min distance range will bounce
 *
 */
b5.A_AttractX = function(target, container, min_x, max_x, min_y, max_y, strength, stop, bounce)
{
    this.target = target;
    this.container = container;
    this.min_x = min_x;
    this.max_x = max_x;
    this.min_y = min_y;
    this.max_y = max_y;
    this.strength = strength;
    this.stop = stop;
    this.bounce = bounce;
};
b5.A_AttractX.prototype.onTick = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.container = b5.Utils.resolveObject(this.container);
    var target = this.target;
    var actors = this.container.actors;
    var count = actors.length;
    var x = target.x;
    var y = target.y;
    var min_x = this.min_x;
    var max_x = this.max_x;
    var min_y = this.min_y;
    var max_y = this.max_y;
    var strength = this.strength;
    var stop = this.stop;
    var bounce = this.bounce;
    for (var t = 0; t < count; t++)
    {
        var actor = actors[t];
        if (actor.attract !== undefined)
        {
            var dy = actor.y - y;
            if (dy > min_y && dy < max_y)
            {
                var dx = x - actor.x;
                if (dx < min_x && dx > -min_x)
                {
                    if (stop)
                    {
                        if (actor.x < x)
                            actor._x = x - min_x;
                        else
                        if (actor.x > x)
                            actor._x = x + min_x;
                        if (bounce)
                            actor.vx = -actor.vx;
                        else
                            actor.vx = 0;
                    }
                }
                else if (dx > min_x && dx < max_x)
                    actor.vx += strength;
                else if (dx > -max_x && dx < -min_x)
                    actor.vx -= strength;
            }
        }
    }

    return true;
};
b5.ActionsRegister.register("AttractX", function(p) { return new b5.A_AttractX(p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8],p[9]); });

/**
 * Action that pulls objects towards or repels objects away on the y-axis that are within a specific range, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_AttractY
 * @constructor
 * @returns {b5.A_AttractY}             The created action
 * @param target {string:b5.Actor}      Path to or instance of actor object that will attract other objects
 * @param container {b5.Actor|b5.Scene} Path to or instance of object that contains the actors (actors that can be attracted have attract property set to true)
 * @param min_y {number}                Minimum y-axis attraction range
 * @param max_y {number}                Maximum y-axis attraction range
 * @param min_x {number}                Minimum x-axis inclusion range
 * @param max_x {number}                Maximum x-axis inclusion range
 * @param strength {number}             Strength of attraction, negative for repulsion
 * @param stop {boolean}                If set to true then attracted objects will stop when they hit the min distance range
 * @param bounce {boolean}              If set to true then objects when stopped at the min distance range will bounce
 *
 */
b5.A_AttractY = function(target, container, min_y, max_y, min_x, max_x, strength, stop, bounce)
{
    this.target = target;
    this.container = container;
    this.min_y = min_y;
    this.max_y = max_y;
    this.min_x = min_x;
    this.max_x = max_x;
    this.strength = strength;
    this.stop = stop;
    this.bounce = bounce;
};
b5.A_AttractY.prototype.onTick = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.container = b5.Utils.resolveObject(this.container);
    var target = this.target;
    var actors = this.container.actors;
    var count = actors.length;
    var x = target.x;
    var y = target.y;
    var min_y = this.min_y;
    var max_y = this.max_y;
    var min_x = this.min_x;
    var max_x = this.max_x;
    var strength = this.strength;
    var stop = this.stop;
    var bounce = this.bounce;
    for (var t = 0; t < count; t++)
    {
        var actor = actors[t];
        if (actor.attract !== undefined)
        {
            var dx = actor.x - x;
            if (dx > min_x && dx < max_x)
            {
                var dy = y - actor.y;
                if (dy < min_y && dy > -min_y)
                {
                    if (stop)
                    {
                        if (actor.y < y)
                            actor._y = y - min_y;
                        else
                        if (actor.y > y)
                            actor._y = y + min_y;
                        if (bounce)
                            actor.vy = -actor.vy;
                        else
                            actor.vy = 0;
                    }
                }
                else if (dy > min_y && dy < max_y)
                    actor.vy += strength;
                else if (dy > -max_y && dy < -min_y)
                    actor.vy -= strength;
            }
        }
    }

    return true;
};
b5.ActionsRegister.register("AttractY", function(p) { return new b5.A_AttractY(p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8],p[9]); });

/**
 * Action that pulls objects towards or repels objects away on the x and y-axis that are within a specific range, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Attract
 * @constructor
 * @returns {b5.A_Attract}              The created action
 * @param target {string:b5.Actor}      Path to or instance of actor object that will attract other objects
 * @param container {b5.Actor|b5.Scene} Path to or instance of object that contains the actors (actors that can be attracted have attract property set to true)
 * @param min_dist {number}             Minimum attraction range
 * @param max_dist {number}             Maximum attraction range
 * @param strength {number}             Strength of attraction, negative for repulsion
 * @param stop {boolean}                If set to true then attracted objects will stop when they hit the min distance range
 * @param bounce {boolean}              If set to true then objects when stopped at the min distance range will bounce
 *
 */
b5.A_Attract = function(target, container, min_dist, max_dist, strength, stop, bounce)
{
    this.target = target;
    this.container = container;
    this.min_dist = min_dist;
    this.max_dist = max_dist;
    this.strength = strength;
    this.stop = stop;
    this.bounce = bounce;
};
b5.A_Attract.prototype.onTick = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.container = b5.Utils.resolveObject(this.container);
    var target = this.target;
    var actors = this.container.actors;
    var count = actors.length;
    var x = target.x;
    var y = target.y;
    var min_dist = this.min_dist;
    var max_dist = this.max_dist;
    var strength = this.strength;
    var stop = this.stop;
    var bounce = this.bounce;
    var d2 = Math.sqrt(min_dist);
    for (var t = 0; t < count; t++)
    {
        var actor = actors[t];
        if (actor.attract !== undefined)
        {
            var dx = actor.x - x;
            var dy = actor.y - y;
            var d = dx * dx + dy * dy;
            if (d > min_dist && d < max_dist)
            {
                d = Math.sqrt(d);
                actor.vx -= strength * dx / d;
                actor.vy -= strength * dy / d;
            }
            else
            if (d < min_dist)
            {
                d = Math.sqrt(d);
                if (stop)
                {
                    actor._x = x + d2 * dx / d;
                    actor._y = y + d2 * dy / d;
                    if (bounce)
                    {
                        actor.vx = -actor.vx;
                        actor.vy = -actor.vy;
                    }
                    else
                    {
                        actor.vx = 0;
                        actor.vy = 0;
                    }
                }

            }
        }
    }

    return true;
};
b5.ActionsRegister.register("Attract", function(p) { return new b5.A_Attract(p[1],p[2],p[3],p[4],p[5],p[6],p[7]); });


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Audio actions are actions that deal with changing audio
//
// A_Sound      - Plays, pauses or stops a sound

//
// The Sound action plays, pauses or stops a sound then exits
// - name - Path to or instance of sound
// - action - Action to perform on sound (play, pause or stop)
//
/**
 * Action that plays, pauses or stops a sound then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Sound
 * @constructor
 * @returns {b5.A_Sound}                The created action
 * @param sound {string:b5.Sound}       Path to or instance of sound resource
 * @param action {string}               Action to perform on sound (play, pause or stop)
 *
 */
b5.A_Sound = function(sound, action)
{
    this.sound = sound;
    this.action = action;
};
b5.A_Sound.prototype.onInit = function()
{
    this.sound = b5.Utils.resolveResource(this.sound, "sound");
    var sound = this.sound;
    if (sound !== null)
    {
        var action = this.action;
        if (action === "play")
            sound.play();
        else if (action === "pause")
            sound.pause();
        else if (action === "stop")
            sound.stop();
    }
};
b5.ActionsRegister.register("Sound", function(p) { return new b5.A_Sound(p[1],p[2]); });

/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Animation actions are actions that deal with changing animation
//
// A_ChangeTimeline - Changes the named timeline

/**
 * Action that changes the state of an animation timeline then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_ChangeTimeline
 * @constructor
 * @returns {b5.A_ChangeTimeline} The created action
 * @param timeline {string|b5.Timeline}     Path to timeline or instance of timeline to change
 * @param action {string}                   Action to perform on the timeline (play, pause or restart)
 *
 */
b5.A_ChangeTimeline = function(timeline, action)
{
    this.timeline = timeline;
    this.action = action;
};
b5.A_ChangeTimeline.prototype.onInit = function()
{
    this.timeline = b5.Utils.resolveObject(this.timeline, "timeline");
    var timeline = this.timeline;
    if (timeline !== null)
    {
        var action = this.action;
        if (action === "play")
            timeline.play();
        else if (action === "pause")
            timeline.pause();
        else if (action === "restart")
            timeline.restart();
    }
};
b5.ActionsRegister.register("ChangeTimeline", function(p) { return new b5.A_ChangeTimeline(p[1],p[2]); });


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// General actions are actions that are generic in nature
//
// A_Wait           - waits for a specified time then exits
// A_SetProps       - sets a property or group of properties of an object to specified values
// A_AddProps       - adds the specified value or array of values onto the specified properties
// A_TweenProps     - Tweens the array of property values over time then exits
// A_Call           - Calls a function with parameters then exits
// A_Create         - Creates an object from a xoml template then exits
// A_Destroy        - Destroys an object then exits
// A_FocusScene     - Sets the current focus scene

/**
 * Action that waits for a specified time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Wait
 * @constructor
 * @returns {b5.A_Wait}                 The created action
 * @param duration {number}             Amount of time to wait in seconds
 *
 */
b5.A_Wait = function(duration)
{
    this.duration = duration;
};
b5.A_Wait.prototype.onInit = function()
{
    this.time = Date.now();
};
b5.A_Wait.prototype.onTick = function()
{
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("Wait", function(p) { return new b5.A_Wait(p[1]); });

/**
 * Action that sets a group of properties of an object to specified values then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_SetProps
 * @constructor
 * @returns {b5.A_SetProps}             The created action
 * @param target {string|object}        Path to or instance of target object to change properties of
 * @param properties {object}           Property / value pairs that will be set (e.g. {"vx":0,"vy":0})
 *
 */
b5.A_SetProps = function(target, properties)
{
    this.target = target;
    this.properties = properties;
};
b5.A_SetProps.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    var props = this.properties;
    for (var prop in props)
        target[prop] = props[prop];
};
b5.ActionsRegister.register("SetProps", function(p) { return new b5.A_SetProps(p[1],p[2]); });

/**
 * Action that adds the specified values onto the specified properties then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_AddProps
 * @constructor
 * @returns {b5.A_AddProps}             The created action
 * @param target {string|object}        Path to or instance of target object to change properties of
 * @param properties {object}           Property / value pairs that will be updated (e.g. {"vx":0,"vy":0})
 *
 */
b5.A_AddProps = function(target, properties)
{
    this.target = target;
    this.properties = properties;
};
b5.A_AddProps.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    var props = this.properties;
    for (var prop in props)
        target[prop] += props[prop];
};
b5.ActionsRegister.register("AddProps", function(p) { return new b5.A_AddProps(p[1],p[2]); });

/**
 * Action that tweens the specified property values over time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_TweenProps
 * @constructor
 * @returns {b5.A_TweenProps}           The created action
 * @param target {string|object}        Path to or instance of target object to change properties of
 * @param properties {string[]}         Array of property names to tween (e.g. ["x", "y"])
 * @param start {number[]}              Array of start values
 * @param end {number[]}                Array of end values
 * @param duration {number}             Amount of time to tween over in seconds
 * @param ease {number[]}               Array of easing functions to apply to tweens (see {@link b5.Ease})
 *
 */
b5.A_TweenProps = function(target, properties, start, end, duration, ease)
{
    this.target = target;
    this.props = properties;
    this.start = start;
    this.end = end;
    this.duration = duration;
    this.ease = ease;
};
b5.A_TweenProps.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
    var target = this.target;
    var props = this.props;
    var start = this.start;
    var count = props.length;
    for (var t = 0; t < count; t++)
        target[props[t]] = start[t];
};
b5.A_TweenProps.prototype.onTick = function()
{
    var dt = Date.now() - this.time;
    var dur = this.duration;
    if (dur !== 0)
    {
        var props = this.props;
        var start = this.start;
        var end = this.end;
        var count = props.length;
        var target = this.target;
        var ease = this.ease;
        var d = dt / (dur * 1000);
        if (d > 1) d = 1;
        for (var t = 0; t < count; t++)
            target[props[t]] = start[t] + (end[t] - start[t]) * b5.Ease.easingFuncs[ease[t]](d);
    }

    return (dt < (dur * 1000));
};
b5.ActionsRegister.register("TweenProps", function(p) { return new b5.A_TweenProps(p[1],p[2],p[3],p[4],p[5],p[6]); });

/**
 * Action that calls a function then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Call
 * @constructor
 * @returns {b5.A_Call}                 The created action
 * @param func {string}                 Function to call
 * @param params {object}               Parameter or pass to the function
 *
 */
b5.A_Call = function(func, params)
{
    this.func = func;
    this.params = params;
};
b5.A_Call.prototype.onInit = function()
{
    window[this.func](this.params);
};
b5.ActionsRegister.register("Call", function(p) { return new b5.A_Call(p[1],p[2]); });

/**
 * Action that creates an object from a xoml template then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Create
 * @constructor
 * @returns {b5.A_Create}               The created action
 * @param objects {object[]}            Collection of objects in XOML JSON format (as exported from Booty5 editor) that contains the template
 * @param scene {string|b5.Scene}       Path to or instance of scene that contains the template and its resources
 * @param template {string}             The name of the object template
 * @param type {string}                 The type of object (e.g. icon, label, scene etc)
 * @param properties {object}           Object that contains property / value pairs that will be set to created object (e.g. {"vx":0,"vy":0})
 *
 */
b5.A_Create = function(objects, scene, template, type, properties)
{
    this.objects = objects;
    this.temp_name = template;
    this.type = type;
    this.scene = scene;
    this.properties = properties;
};
b5.A_Create.prototype.onInit = function()
{
    if (typeof this.objects === "string")
        this.objects = b5.data[this.objects];
    this.scene = b5.Utils.resolveObject(this.scene);
    var template = b5.Xoml.findResource(this.objects, this.temp_name, this.type);
    var xoml = new b5.Xoml(b5.app);
    xoml.current_scene = this.scene;
    var obj = xoml.parseResource(this.scene, template);
    var props = this.properties;
    for (var prop in props)
        obj[prop] = props[prop];
};
b5.ActionsRegister.register("Create", function(p) { return new b5.A_Create(p[1],p[2],p[3],p[4],p[5]); });

/**
 * Action that destroys an object then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Destroy
 * @constructor
 * @returns {b5.A_Destroy}              The created action
 * @param target {string|object}        Path to or instance of object to destroy
 *
 */
b5.A_Destroy = function(target)
{
    this.target = target;
};
b5.A_Destroy.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.target.destroy();
};
b5.ActionsRegister.register("Destroy", function(p) { return new b5.A_Destroy(p[1]); });

/**
 * Action that sets the current focus scene then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_FocusScene
 * @constructor
 * @returns {b5.A_FocusScene}           The created action
 * @param target {string|b5.Scene}      Path to or instance of scene to set as focus
 & @param focus2 {boolean}              Set as secondary focus instead if true
 *
 */
b5.A_FocusScene = function(target, focus2)
{
    this.target = target;
    this.focus2 = focus2;
};
b5.A_FocusScene.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    if (this.focus2 === true)
        b5.app.focus_scene2 = target;
    else
        b5.app.focus_scene = target;
};
b5.ActionsRegister.register("FocusScene", function(p) { return new b5.A_FocusScene(p[1],p[2]); });
/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Movement actions are actions that affect the position, speed or velocity of an object
//
// A_StopMove           - Stops an object from moving, pauses for a duration then exits
// A_Gravity            - Apply gravity to an object, does not exit
// A_Move               - Moves an object dx, dy units over the specified time then exits
// A_MoveTo             - Moves an object to a specific coordinate over the specified time then exits
// A_MoveWithSpeed      - Moves an object at a specific speed in its current direction over the specified time then exits
// A_Follow             - Follows a target object, does not exit
// A_LookAt             - Turns an object to face another object, does not exit
// A_FollowPath         - Follows a path, does not exit
// A_FollowPathVel      - Uses velocities to follow a path, does not exit
// A_LimitMove          - Limits movement of object to within a rectangular area, does not exit
//

/**
 * Action that stops an object from moving then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_StopMove
 * @constructor
 * @returns {b5.A_StopMove}             The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param stop_vx {boolean}             Stops x velocity
 * @param stop_vy {boolean}             Stops y velocity
 * @param stop_vr                       Stops rotational velocity
 * @param duration {number}             Amount of time to wait before stopping in seconds
 *
 */
b5.A_StopMove = function(target, stop_vx, stop_vy, stop_vr, duration)
{
    this.target = target;
    this.stop_vx = stop_vx;
    this.stop_vy = stop_vy;
    this.stop_vr = stop_vr;
    this.duration = duration;
};
b5.A_StopMove.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
};
b5.A_StopMove.prototype.onTick = function()
{
    if (!((Date.now() - this.time) < (this.duration * 1000)))
    {
        var target = this.target;
        if (this.stop_vx)
            target.vx = 0;
        if (this.stop_vy)
            target.vy = 0;
        if (this.stop_vr)
            target.vr = 0;
        return false;
    }
    return true;
};
b5.ActionsRegister.register("StopMove", function(p) { return new b5.A_StopMove(p[1],p[2],p[3],p[4],p[5]); });

/**
 * Action that applies gravity to an object, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Gravity
 * @constructor
 * @returns {b5.A_Gravity}              The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param gravity_x {number}            Gravity strength on x-axis
 * @param gravity_y {number}            Gravity strength on y-axis
 *
 */
b5.A_Gravity = function(target, gravity_x, gravity_y)
{
    this.target = target;
    this.gravity_x = gravity_x;
    this.gravity_y = gravity_y;
};
b5.A_Gravity.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_Gravity.prototype.onTick = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    target.vx += this.gravity_x;
    target.vy += this.gravity_y;
    return false;
};
b5.ActionsRegister.register("Gravity", function(p) { return new b5.A_Gravity(p[1],p[2],p[3]); });

/**
 * Action that moves an object dx, dy units over the specified time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Move
 * @constructor
 * @returns {b5.A_Move      }           The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param dx {number}                   Distance to move on x axis (passing null will not affect the property)
 * @param dy {number}                   Distance to move on y axis (passing null will not affect the property)
 * @param duration {number}             Amount of time to move over in seconds
 *
 */
b5.A_Move = function(target, dx, dy, duration)
{
    this.target = target;
    this.dx = dx;
    this.dy = dy;
    this.duration = duration;
    this.x = target.x;
    this.y = target.y;
};
b5.A_Move.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    if (this.dx != null)
        target.vx = this.dx / this.duration;
    if (this.dy != null)
        target.vy = this.dy / this.duration;
    this.time = Date.now();
};
b5.A_Move.prototype.onTick = function()
{
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("Move", function(p) { return new b5.A_Move(p[1],p[2],p[3],p[4]); });

/**
 * Action that moves an object to a specific coordinate over the specified time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_MoveTo
 * @constructor
 * @returns {b5.A_MoveTo}               The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param x {number}                    Target x-axis position to move to (passing null will not affect the property)
 * @param y {number}                    Target y-axis position to move to (passing null will not affect the property)
 * @param duration {number}             Amount of time to move over in seconds
 * @param ease_x {number}               Easing function to use on x-axis (see {@link b5.Ease})
 * @param ease_y {number}               Easing function to use on y-axis (see {@link b5.Ease})
 *
 */
b5.A_MoveTo = function(target, x, y, duration, ease_x, ease_y)
{
    this.target = target;
    this.duration = duration;
    this.x = x;
    this.y = y;
    this.sx = target.x;
    this.sy = target.y;
    this.ease_x = ease_x || b5.Ease.linear;
    this.ease_y = ease_y || b5.Ease.linear;
};
b5.A_MoveTo.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    this.time = Date.now();
    this.sx = target.x;
    this.sy = target.y;
};
b5.A_MoveTo.prototype.onTick = function()
{
    var target = this.target;
    var dt = Date.now() - this.time;
    var d = dt / (this.duration * 1000);
    if (d > 1) d = 1;
    if (this.x != null)
        target._x = this.sx + (this.x - this.sx) * b5.Ease.easingFuncs[this.ease_x](d);
    if (this.y != null)
        target._y = this.sy + (this.y - this.sy) * b5.Ease.easingFuncs[this.ease_y](d);
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("MoveTo", function(p) { return new b5.A_MoveTo(p[1],p[2],p[3],p[4],p[5],p[6]); });

/**
 * Action that moves an object at specific speed in its current direction over the specified time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_MoveWithSpeed
 * @constructor
 * @returns {b5.A_MoveWithSpeed}        The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param speed {number}                Speed at which to move
 * @param duration {number}             Amount of time to move over in seconds
 * @param ease {number}                 Easing function used to increase to target speed (see {@link b5.Ease})
 *
 */
b5.A_MoveWithSpeed = function(target, speed, duration, ease)
{
    this.target = target;
    this.speed = speed;
    this.duration = duration;
    this.ease = ease;
};
b5.A_MoveWithSpeed.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
    if (this.duration === 0)
    {
        var target = this.target;
        var speed = this.speed;
        var dir = target.rotation;
        target.vx = speed * Math.sin(dir);
        target.vy = -speed * Math.cos(dir);
    }
};
b5.A_MoveWithSpeed.prototype.onTick = function()
{
    var dt = Date.now() - this.time;
    var dur = this.duration;
    if (dur !== 0)
    {
        var target = this.target;
        var dir = target.rotation;
        var d = dt / (dur * 1000);
        if (d > 1) d = 1;
        var speed = this.speed * b5.Ease.easingFuncs[this.ease](d);
        target.vx = speed * Math.sin(dir);
        target.vy = -speed * Math.cos(dir);
    }

    return (dt < (dur * 1000));
};
b5.ActionsRegister.register("MoveWithSpeed", function(p) { return new b5.A_MoveWithSpeed(p[1],p[2],p[3],p[4]); });

/**
 * Action that follows a target, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Follow
 * @constructor
 * @returns {b5.A_Follow}               The created action
 * @param source {string|b5.Actor}      Path to or instance of source object that will follow the target
 * @param target {string|b5.Actor}      Path to or instance of target object to follow
 * @param speed {number}                Speed at which to follow, larger values will catch up with target slower
 * @param distance {number}             Minimum distance allowed between source and target (squared)
 *
 */
b5.A_Follow = function(source, target, speed, distance)
{
    this.source = source;
    this.target = target;
    this.speed = speed;
    this.distance = distance;
};
b5.A_Follow.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.source = b5.Utils.resolveObject(this.source);
};
b5.A_Follow.prototype.onTick = function()
{
    var target = this.target;
    var source = this.source;
    var speed = this.speed;
    var dx = target.x - source.x;
    var dy = target.y - source.y;
    var d = dx * dx + dy * dy;
    if (d < this.distance)
    {
        source.vx = 0;
        source.vy = 0;
    }
    else
    {
        source.vx = dx / speed;
        source.vy = dy / speed;
    }
    return true;
};
b5.ActionsRegister.register("Follow", function(p) { return new b5.A_Follow(p[1],p[2],p[3],p[4]); });

/**
 * Action that turns an object to face another object, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_LookAt
 * @constructor
 * @returns {b5.A_LookAt}               The created action
 * @param source {string|b5.Actor}      Path to or instance of source object that will look at the target
 * @param target {string|b5.Actor}      Path to or instance of target object to look at
 * @param lower {number}                Optional lower limit angle
 * @param upper {number}                Optional upper limit angle
 *
 */
b5.A_LookAt = function(source, target, lower, upper)
{
    this.source = source;
    this.target = target;
    this.lower = lower;
    this.upper = upper;
};
b5.A_LookAt.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.source = b5.Utils.resolveObject(this.source);
};
b5.A_LookAt.prototype.onTick = function()
{
    var target = this.target;
    var source = this.source;
    var angle = Math.atan2(target.y - source.y, target.x - source.x) + Math.PI / 2;
    var lower = this.lower;
    if (lower !== undefined && angle < lower)
        angle = lower;
    var upper = this.upper;
    if (upper !== undefined && angle > upper)
        angle = upper;
    source._rotation = angle;
    return true;
};
b5.ActionsRegister.register("LookAt", function(p) { return new b5.A_LookAt(p[1],p[2],p[3],p[4]); });

/**
 * Action that causes an object follows a path, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_FollowPath
 * @constructor
 * @returns {b5.A_FollowPath}           The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param path {object[]}               Path to follow, array of x,y values that define the path, e.g. [x1,y1,x2,y2,etc..]
 * @param start {number}                Distance to start along the path
 * @param speed {number}                Speed at which to travel down the path
 * @param angle {boolean}               If set to true then angle will adjust to path direction
 *
 */
b5.A_FollowPath = function(target, path, start, speed, angle)
{
    this.target = target;
    this.path = path;
    this.distance = start;
    this.speed = speed;
    this.angle = angle;

    // Calculate distances between each node
    var count = path.length >> 1;
    var total = 0;
    this.distances = [];
    this.angles = [];
    this.distances[0] = 0;
    for (var t = 1; t < count; t++)
    {
        var dx = path[t << 1] - path[(t - 1) << 1];
        var dy = path[(t << 1) + 1] - path[((t - 1) << 1) + 1];
        total += Math.sqrt(dx * dx + dy * dy);
        this.distances[t] = total;
        if (this.angle)
            this.angles[t - 1] = Math.atan2(dy, dx) + Math.PI / 2;
    }
};
b5.A_FollowPath.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_FollowPath.prototype.onTick = function()
{
    var target = this.target;

    // Find path node we are currently on
    var path = this.path;
    var count = path.length >> 1;
    var distances = this.distances;
    var distance = this.distance + this.speed;
    var total_dist = distances[count - 1];
    while (distance >= total_dist)
        distance -= total_dist;
    while (distance < 0)
        distance += total_dist;
    this.distance = distance;
    for (var t = 0; t < count; t++)
    {
        if (distance < distances[t])
        {
            var t2 = t - 1;
            if (t2 >= count)
                t2 = 0;
            var x1 = path[t2 << 1];
            var x2 = path[t << 1];
            var y1 = path[(t2 << 1) + 1];
            var y2 = path[(t << 1) + 1];
            var d = (distance - distances[t2]) / (distances[t] - distances[t2]);
            target._x = x1 + (x2 - x1) * d;
            target._y = y1 + (y2 - y1) * d;
            if (this.angle)
                target._rotation = this.angles[t2];
            break;
        }
    }

    return true;
};
b5.ActionsRegister.register("FollowPath", function(p) { return new b5.A_FollowPath(p[1],p[2],p[3],p[4],p[5]); });

/**
 * Action that causes an object to follow a path using velocity, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_FollowPathVel
 * @constructor
 * @returns {b5.A_FollowPathVel}        The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param path {object[]}               Path to follow, array of x,y values that define the path, e.g. [x1,y1,x2,y2,etc..]
 * @param start {number}                Distance to start along the path
 * @param speed {number}                Speed at which to travel down the path
 * @param catchup_speed {number}        Speed at which object catches up with path target modes
 * @param angle {boolean}               If set to true then angle will adjust to path direction
 *
 */
b5.A_FollowPathVel = function(target, path, start, speed, catchup_speed, angle)
{
    this.target = target;
    this.path = path;
    this.distance = start;
    this.speed = speed;
    this.angle = angle;
    this.catchup_speed = catchup_speed;

    // Calculate distances between each node
    var count = path.length >> 1;
    var total = 0;
    this.distances = [];
    this.distances[0] = 0;
    for (var t = 1; t < count; t++)
    {
        var dx = path[t << 1] - path[(t - 1) << 1];
        var dy = path[(t << 1) + 1] - path[((t - 1) << 1) + 1];
        total += Math.sqrt(dx * dx + dy * dy);
        this.distances[t] = total;
    }
};
b5.A_FollowPathVel.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_FollowPathVel.prototype.onTick = function()
{
    var target = this.target;

    // Find path node we are currently on
    var path = this.path;
    var count = path.length >> 1;
    var distances = this.distances;
    var distance = this.distance + this.speed;
    var total_dist = distances[count - 1];
    while (distance >= total_dist)
        distance -= total_dist;
    while (distance < 0)
        distance += total_dist;
    this.distance = distance;
    for (var t = 0; t < count; t++)
    {
        if (distance < distances[t])
        {
            var t2 = t - 1;
            if (t2 >= count)
                t2 = 0;
            var x1 = path[t2 << 1];
            var x2 = path[t << 1];
            var y1 = path[(t2 << 1) + 1];
            var y2 = path[(t << 1) + 1];
            var d = (distance - distances[t2]) / (distances[t] - distances[t2]);
            var catchup = this.catchup_speed;
            target.vx = ((x1 + (x2 - x1) * d) - target.x) * catchup;
            target.vy = ((y1 + (y2 - y1) * d) - target.y) * catchup;
            if (this.angle)
                target._rotation = Math.atan2(target.vy, target.vx) + Math.PI / 2;
            break;
        }
    }

    return true;
};
b5.ActionsRegister.register("FollowPathVel", function(p) { return new b5.A_FollowPathVel(p[1],p[2],p[3],p[4],p[5],p[6]); });

/**
 * Action that limits movement of object to within a rectangular area, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_LimitMove
 * @constructor
 * @returns {b5.A_LimitMove}            The created action
 * @param target {string|b5.Actor}      Path to or instance of target object that will be limited
 * @param area {number[]}               Rectangular area limit [x,y,w,h]
 * @param hit {string}                  Action to perform when object oversteps boundary (bounce, wrap, stop)
 * @param bounce {number}               Bounce factor
 *
 */
b5.A_LimitMove = function(target, area, hit, bounce)
{
    this.target = target;
    this.area = area;
    if (hit === "bounce")
        this.hit = 0;
    else if (hit === "stop")
        this.hit = 1;
    else if (hit === "wrap")
        this.hit = 2;
    this.bounce = bounce;
};
b5.A_LimitMove.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_LimitMove.prototype.onTick = function()
{
    var target = this.target;
    var x = target.x;
    var y = target.y;
    var hit = this.hit;
    var area = this.area;
    var bounce = this.bounce;
    if (area[2] !== 0)
    {
        var l = area[0];
        var r = l + area[2];
        if (x < l)
        {
            if (hit === 0)
                target.vx = -target.vx * bounce;
            else if (hit === 1)
                target.vx = 0;
            else if (hit === 2)
                target._x = r;
        }
        else
        if (x > r)
        {
            if (hit === 0)
                target.vx = -target.vx * bounce;
            else if (hit === 1)
                target.vx = 0;
            else if (hit === 2)
                target._x = l;
        }
    }
    if (area[3] !== 0)
    {
        var t = area[1];
        var b = t + area[3];
        if (y < t)
        {
            if (hit === 0)
                target.vy = -target.vy * bounce;
            else if (hit === 1)
                target.vy = 0;
            else if (hit === 2)
                target._y = b;
        }
        else
        if (y > b)
        {
            if (hit === 0)
                target.vy = -target.vy * bounce;
            else if (hit === 1)
                target.vy = 0;
            else if (hit === 2)
                target._y = t;
        }
    }
    return false;
};
b5.ActionsRegister.register("LimitMove", function(p) { return new b5.A_LimitMove(p[1],p[2],p[3],p[4]); });





/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Camera actions are actions that affect the scene camera
//
// A_CamStopMove           - Stops a camera from moving, pauses for a duration then exits
// A_CamGravity            - Apply gravity to a camera, does not exit
// A_CamMove               - Moves a camera dx, dy units over the specified time then exits
// A_CamMoveTo             - Moves a camera to a specific coordinate over the specified time then exits
// A_CamFollow             - Camera follows a target object, does not exit
// A_CamFollowPath         - Camera follows a path, does not exit
// A_CamFollowPathVel      - Uses velocities to make camera follow a path, does not exit
// A_CamLimitMove          - Limits movement of camera to within a rectangular area, does not exit
//

/**
 * Action that stops a scene camera from moving then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamStopMove
 * @constructor
 * @returns {b5.A_CamStopMove}          The created action
 * @param target {string|b5.Scene}      Path to or instance of target scene that contains camera
 * @param stop_vx {boolean}             Stops x velocity
 * @param stop_vy {boolean}             Stops y velocity
 * @param duration {number}             Amount of time to wait before stopping in seconds
 *
 */
b5.A_CamStopMove = function(target, stop_vx, stop_vy, duration)
{
    this.target = target;
    this.stop_vx = stop_vx;
    this.stop_vy = stop_vy;
    this.duration = duration;
};
b5.A_CamStopMove.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
};
b5.A_CamStopMove.prototype.onTick = function()
{
    if (!((Date.now() - this.time) < (this.duration * 1000)))
    {
        var target = this.target;
        if (this.stop_vx)
            target.camera_vx = 0;
        if (this.stop_vy)
            target.camera_vy = 0;
        return false;
    }
    return true;
};
b5.ActionsRegister.register("CamStopMove", function(p) { return new b5.A_CamStopMove(p[1],p[2],p[3],p[4]); });

/**
 * Action that applies gravity to a scene camera, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamGravity
 * @constructor
 * @returns {b5.A_CamGravity}           The created action
 * @param target {string|b5.Scene}      Path to or instance of target scene that contains camera
 * @param gravity_x {number}            Gravity strength on x-axis
 * @param gravity_y {number}            Gravity strength on y-axis
 *
 */
b5.A_CamGravity = function(target, gravity_x, gravity_y)
{
    this.target = target;
    this.gravity_x = gravity_x;
    this.gravity_y = gravity_y;
};
b5.A_CamGravity.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_CamGravity.prototype.onTick = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    target.camera_vx += this.gravity_x;
    target.camera_vy += this.gravity_y;
    return false;
};
b5.ActionsRegister.register("CamGravity", function(p) { return new b5.A_CamGravity(p[1],p[2],p[3]); });

/**
 * Action that moves a scene camera dx, dy units over the specified time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamMove
 * @constructor
 * @returns {b5.A_CamMove}              The created action
 * @param target {string|b5.Scene}      Path to or instance of target scene that contains camera
 * @param dx {number}                   Distance to move on x axis (passing null will not affect the property)
 * @param dy {number}                   Distance to move on y axis (passing null will not affect the property)
 * @param duration {number}             Amount of time to move over in seconds
 *
 */
b5.A_CamMove = function(target, dx, dy, duration)
{
    this.target = target;
    this.dx = dx;
    this.dy = dy;
    this.duration = duration;
    this.x = target.x;
    this.y = target.y;
};
b5.A_CamMove.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    if (this.dx != null)
        target.camera_vx = this.dx / this.duration;
    if (this.dy != null)
        target.camera_vy = this.dy / this.duration;
    this.time = Date.now();
};
b5.A_CamMove.prototype.onTick = function()
{
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("CamMove", function(p) { return new b5.A_CamMove(p[1],p[2],p[3],p[4]); });

/**
 * Action that moves a scene camera to a specific coordinate over the specified time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamMoveTo
 * @constructor
 * @returns {b5.A_CamMoveTo}            The created action
 * @param target {string|b5.Scene}      Path to or instance of target scene that contains camera
 * @param x {number}                    Target x-axis position to move to (passing null will not affect the property)
 * @param y {number}                    Target y-axis position to move to (passing null will not affect the property)
 * @param duration {number}             Amount of time to move over in seconds
 * @param ease_x {number}               Easing function to use on x-axis (see {@link b5.Ease})
 * @param ease_y {number}               Easing function to use on y-axis (see {@link b5.Ease})
 *
 */
b5.A_CamMoveTo = function(target, x, y, duration, ease_x, ease_y)
{
    this.target = target;
    this.duration = duration;
    this.x = x;
    this.y = y;
    this.ease_x = ease_x || b5.Ease.linear;
    this.ease_y = ease_y || b5.Ease.linear;
};
b5.A_CamMoveTo.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    this.time = Date.now();
    this.sx = target.camera_x;
    this.sy = target.camera_y;
};
b5.A_CamMoveTo.prototype.onTick = function()
{
    var target = this.target;
    var dt = Date.now() - this.time;
    var d = dt / (this.duration * 1000);
    if (d > 1) d = 1;
    if (this.x != null)
        target.camera_x = this.sx + (this.x - this.sx) * b5.Ease.easingFuncs[this.ease_x](d);
    if (this.y != null)
        target.camera_y = this.sy + (this.y - this.sy) * b5.Ease.easingFuncs[this.ease_y](d);
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("CamMoveTo", function(p) { return new b5.A_CamMoveTo(p[1],p[2],p[3],p[4],p[5],p[6]); });

/**
 * Action that causes scene camera to follow a target, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamFollow
 * @constructor
 * @returns {b5.A_CamFollow}            The created action
 * @param source {string|b5.Scene}      Path to or instance of scene that contains camera that will follow the target
 * @param target {string|b5.Actor}      Path to or instance of target object to follow
 * @param speed {number}                Speed at which to follow, larger values will catch up with target slower
 * @param distance {number}             Minimum distance allowed between source and target (squared)
 *
 */
b5.A_CamFollow = function(source, target, speed, distance)
{
    this.source = source;
    this.target = target;
    this.speed = speed;
    this.distance = distance;
};
b5.A_CamFollow.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.source = b5.Utils.resolveObject(this.source);
};
b5.A_CamFollow.prototype.onTick = function()
{
    var target = this.target;
    var source = this.source;
    var speed = this.speed;
    var dx = target.x - source.camera_x;
    var dy = target.y - source.camera_y;
    var d = dx * dx + dy * dy;
    if (d < this.distance)
    {
        source.camera_vx = 0;
        source.camera_vy = 0;
    }
    else
    {
        source.camera_vx = dx / speed;
        source.camera_vy = dy / speed;
    }
    return true;
};
b5.ActionsRegister.register("CamFollow", function(p) { return new b5.A_CamFollow(p[1],p[2],p[3],p[4]); });

/**
 * Action that causes scene camera to follow a target, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamFollowPath
 * @constructor
 * @returns {b5.A_CamFollowPath}        The created action
 * @param target {string|b5.Scene}      Path to or instance of scene that contains camera that will follow the target
 * @param path {object[]}               Path to follow, array of x,y values that define the path, e.g. [x1,y1,x2,y2,etc..]
 * @param start {number}                Distance to start along the path
 * @param speed {number}                Speed at which to travel down the path
 *
 */
b5.A_CamFollowPath = function(target, path, start, speed)
{
    this.target = target;
    this.path = path;
    this.distance = start;
    this.speed = speed;

    // Calculate distances between each node
    var count = path.length >> 1;
    var total = 0;
    this.distances = [];
    this.distances[0] = 0;
    for (var t = 1; t < count; t++)
    {
        var dx = path[t << 1] - path[(t - 1) << 1];
        var dy = path[(t << 1) + 1] - path[((t - 1) << 1) + 1];
        total += Math.sqrt(dx * dx + dy * dy);
        this.distances[t] = total;
    }
};
b5.A_CamFollowPath.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_CamFollowPath.prototype.onTick = function()
{
    var target = this.target;

    // Find path node we are currently on
    var path = this.path;
    var count = path.length >> 1;
    var distances = this.distances;
    var distance = this.distance + this.speed;
    var total_dist = distances[count - 1];
    while (distance >= total_dist)
        distance -= total_dist;
    while (distance < 0)
        distance += total_dist;
    this.distance = distance;
    for (var t = 0; t < count; t++)
    {
        if (distance < distances[t])
        {
            var t2 = t - 1;
            if (t2 >= count)
                t2 = 0;
            var x1 = path[t2 << 1];
            var x2 = path[t << 1];
            var y1 = path[(t2 << 1) + 1];
            var y2 = path[(t << 1) + 1];
            var d = (distance - distances[t2]) / (distances[t] - distances[t2]);
            target.camera_x = x1 + (x2 - x1) * d;
            target.camera_y = y1 + (y2 - y1) * d;
            break;
        }
    }

    return true;
};
b5.ActionsRegister.register("CamFollowPath", function(p) { return new b5.A_CamFollowPath(p[1],p[2],p[3],p[4]); });

/**
 * Action that causes scene camera to follow a path using velocity, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamFollowPathVel
 * @constructor
 * @returns {b5.A_CamFollowPathVel}     The created action
 * @param target {string|b5.Scene}      Path to or instance of scene that contains camera that will follow the target
 * @param path {object[]}               Path to follow, array of x,y values that define the path, e.g. [x1,y1,x2,y2,etc..]
 * @param start {number}                Distance to start along the path
 * @param speed {number}                Speed at which to travel down the path
 * @param catchup_speed {number}        Speed at which object catches up with path target modes
 *
 */
b5.A_CamFollowPathVel = function(target, path, start, speed, catchup_speed)
{
    this.target = target;
    this.path = path;
    this.distance = start;
    this.speed = speed;
    this.catchup_speed = catchup_speed;

    // Calculate distances between each node
    var count = path.length >> 1;
    var total = 0;
    this.distances = [];
    this.distances[0] = 0;
    for (var t = 1; t < count; t++)
    {
        var dx = path[t << 1] - path[(t - 1) << 1];
        var dy = path[(t << 1) + 1] - path[((t - 1) << 1) + 1];
        total += Math.sqrt(dx * dx + dy * dy);
        this.distances[t] = total;
    }
};
b5.A_CamFollowPathVel.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_CamFollowPathVel.prototype.onTick = function()
{
    var target = this.target;

    // Find path node we are currently on
    var path = this.path;
    var count = path.length >> 1;
    var distances = this.distances;
    var distance = this.distance + this.speed;
    var total_dist = distances[count - 1];
    while (distance >= total_dist)
        distance -= total_dist;
    while (distance < 0)
        distance += total_dist;
    this.distance = distance;
    for (var t = 0; t < count; t++)
    {
        if (distance < distances[t])
        {
            var t2 = t - 1;
            if (t2 >= count)
                t2 = 0;
            var x1 = path[t2 << 1];
            var x2 = path[t << 1];
            var y1 = path[(t2 << 1) + 1];
            var y2 = path[(t << 1) + 1];
            var d = (distance - distances[t2]) / (distances[t] - distances[t2]);
            var catchup = this.catchup_speed;
            target.camera_vx = ((x1 + (x2 - x1) * d) - target.x) * catchup;
            target.camera_vy = ((y1 + (y2 - y1) * d) - target.y) * catchup;
            break;
        }
    }

    return true;
};
b5.ActionsRegister.register("CamFollowPathVel", function(p) { return new b5.A_CamFollowPathVel(p[1],p[2],p[3],p[4],p[5]); });

/**
 * Action that limits movement of scene camera to within a rectangular area, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamLimitMove
 * @constructor
 * @returns {b5.A_CamLimitMove}         The created action
 * @param target {string|b5.Scene}      Path to or instance of scene that contains camera that will be limited
 * @param area {number[]}               Rectangular area limit [x,y,w,h]
 * @param hit {string}                  Action to perform when object oversteps boundary (bounce, wrap, stop)
 * @param bounce {number}               Bounce factor
 *
 */
b5.A_CamLimitMove = function(target, area, hit, bounce)
{
    this.target = target;
    this.area = area;
    if (hit === "bounce")
        this.hit = 0;
    else if (hit === "stop")
        this.hit = 1;
    else if (hit === "wrap")
        this.hit = 2;
    this.bounce = bounce;
};
b5.A_CamLimitMove.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_CamLimitMove.prototype.onTick = function()
{
    var target = this.target;
    var x = target.camera_x;
    var y = target.camera_y;
    var hit = this.hit;
    var area = this.area;
    var bounce = this.bounce;
    if (area[2] !== 0)
    {
        var l = area[0];
        var r = l + area[2];
        if (x < l)
        {
            if (hit === 0)
                target.camera_vx = -target.camera_vx * bounce;
            else if (hit === 1)
                target.camera_vx = 0;
            else if (hit === 2)
                target.camera_x = r;
        }
        else
        if (x > r)
        {
            if (hit === 0)
                target.camera_vx = -target.camera_vx * bounce;
            else if (hit === 1)
                target.camera_vx = 0;
            else if (hit === 2)
                target.camera_x = l;
        }
    }
    if (area[3] !== 0)
    {
        var t = area[1];
        var b = t + area[3];
        if (y < t)
        {
            if (hit === 0)
                target.camera_vy = -target.camera_vy * bounce;
            else if (hit === 1)
                target.camera_vy = 0;
            else if (hit === 2)
                target.camera_y = b;
        }
        else
        if (y > b)
        {
            if (hit === 0)
                target.camera_vy = -target.camera_vy * bounce;
            else if (hit === 1)
                target.camera_vy = 0;
            else if (hit === 2)
                target.camera_y = t;
        }
    }
    return false;
};
b5.ActionsRegister.register("CamLimitMove", function(p) { return new b5.A_CamLimitMove(p[1],p[2],p[3],p[4]); });


/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Physics actions are that modify the physical state of actors
//
// A_SetLinearVelocity          - Sets the linear velocity of an actors body for a specified period of time
// A_SetAngularVelocity         - Sets the angular velocity of an actors body for a specified period of time
// A_ApplyForce                 - Apply a force to actors body for a specified period of time
// A_ApplyImpulse               - Apply an impulse to actors body
// A_ApplyTorque                - Apply a torque to actors body for a specified period of time

/**
 * Action that sets the linear velocity of an actors body for a duration then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_SetLinearVelocity
 * @constructor
 * @returns {b5.A_SetLinearVelocity}    The created action
 * @param target {string|b5.Actor}      Path to or instance of target object that will be affected
 * @param vx {number}                   x-axis velocity
 * @param vy {number}                   y-axis velocity
 * @param duration {number}             Duration of action
 *
 */
b5.A_SetLinearVelocity = function(target, vx, vy, duration)
{
    this.target = target;
    this.vx = vx;
    this.vy = vy;
    this.duration = duration;
};
b5.A_SetLinearVelocity.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
};
b5.A_SetLinearVelocity.prototype.onTick = function()
{
    var target = this.target;
    var body = target.body;
    if (body !== null)
    {
        var b2Vec2 = Box2D.Common.Math.b2Vec2;
        body.SetAwake(true);
        body.SetLinearVelocity(new b2Vec2(this.vx, this.vy));
    }
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("SetLinearVelocity", function(p) { return new b5.A_SetLinearVelocity(p[1], p[2], p[3], p[4]); });

/**
 * Action that sets the angular velocity of an actors body for a duration then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_SetAngularVelocity
 * @constructor
 * @returns {b5.A_SetAngularVelocity}   The created action
 * @param target {string|b5.Actor}      Path to or instance of target object that will be affected
 * @param vr {number}                   Angular velocity
 * @param duration {number}             Duration of action
 *
 */
b5.A_SetAngularVelocity = function(target, vr, duration)
{
    this.target = target;
    this.vr = vr;
    this.duration = duration;
};
b5.A_SetAngularVelocity.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
};
b5.A_SetAngularVelocity.prototype.onTick = function()
{
    var target = this.target;
    var body = target.body;
    if (body !== null)
    {
        body.SetAwake(true);
        body.SetAngularVelocity(this.vr);
    }
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("SetAngularVelocity", function(p) { return new b5.A_SetAngularVelocity(p[1], p[2], p[3]); });

/**
 * Action that applies force to an object over a period of time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_ApplyForce
 * @constructor
 * @returns {b5.A_ApplyForce}           The created action
 * @param target {string|b5.Actor}      Path to or instance of target object that will be affected
 * @param fx {number}                   x-axis force
 * @param fy {number}                   y-axis force
 * @param dx {number}                   x-axis offset to apply force
 * @param dy {number}                   y-axis offset to apply force
 * @param duration {number}             Duration of action
 *
 */
b5.A_ApplyForce = function(target, fx, fy, dx, dy, duration)
{
    this.target = target;
    this.fx = fx;
    this.fy = fy;
    this.dx = dx;
    this.dy = dy;
    this.duration = duration;
};
b5.A_ApplyForce.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
};
b5.A_ApplyForce.prototype.onTick = function()
{
    var target = this.target;
    var body = target.body;
    if (body !== null)
    {
        var ws = target.scene.world_scale;
        var b2Vec2 = Box2D.Common.Math.b2Vec2;
        body.SetAwake(true);
        var pos = body.GetWorldPoint(new b2Vec2(this.dx / ws, this.dy / ws));
        body.ApplyForce(new b2Vec2(this.fx, this.fy), pos);
    }
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("ApplyForce", function(p) { return new b5.A_ApplyForce(p[1], p[2], p[3], p[4], p[5], p[6]); });

/**
 * Action that applies an impulse to an object then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_ApplyImpulse
 * @constructor
 * @returns {b5.A_ApplyImpulse}         The created action
 * @param target {string|b5.Actor}      Path to or instance of target object that will be affected
 * @param ix {number}                   x-axis impulse
 * @param iy {number}                   y-axis impulse
 * @param dx {number}                   x-axis offset to apply force
 * @param dy {number}                   y-axis offset to apply force
 *
 */
b5.A_ApplyImpulse = function(target, ix, iy, dx, dy)
{
    this.target = target;
    this.ix = ix;
    this.iy = iy;
    this.dx = dx;
    this.dy = dy;
};
b5.A_ApplyImpulse.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    var body = target.body;
    if (body !== null)
    {
        var ws = target.scene.world_scale;
        var b2Vec2 = Box2D.Common.Math.b2Vec2;
        body.SetAwake(true);
        var pos = body.GetWorldPoint(new b2Vec2(this.dx / ws, this.dy / ws));
        body.ApplyImpulse(new b2Vec2(this.ix, this.iy), pos);
    }
};
b5.ActionsRegister.register("ApplyImpulse", function(p) { return new b5.A_ApplyImpulse(p[1], p[2], p[2], p[3], p[4]); });

/**
 * Action that applies a torque to an object over a period of time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_ApplyTorque
 * @constructor
 * @returns {b5.A_ApplyTorque}          The created action
 * @param target {string|b5.Actor}      Path to or instance of target object that will be affected
 * @param torque {number}               Amount of Torque to apply
 * @param duration {number}             Duration of action
 *
 */
b5.A_ApplyTorque = function(target, torque, duration)
{
    this.target = target;
    this.torque = torque;
    this.duration = duration;
};
b5.A_ApplyTorque.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
};
b5.A_ApplyTorque.prototype.onTick = function()
{
    var target = this.target;
    var body = target.body;
    if (body !== null)
    {
        body.SetAwake(true);
        body.ApplyTorque(this.torque);
    }
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("ApplyTorque", function(p) { return new b5.A_ApplyTorque(p[1], p[2], p[3]); });
