// Stopwatch..................................................................
//
// Like the real thing, you can start and stop a stopwatch, and you can
// find out the elapsed time the stopwatch has been running. After you stop
// a stopwatch, it's getElapsedTime() method returns the elapsed time
// between the start and stop.
//
// Stopwatches are used primarily for timing animations.

var Stopwatch = function ()  {
};

// You can get the elapsed time while the timer is running, or after it's
// stopped.

Stopwatch.prototype = {
   startTime: 0,
   running: false,
   elapsed: undefined,

   start: function () {
      this.startTime = +new Date();
      this.elapsedTime = undefined;
      this.running = true;
   },

   stop: function () {
      this.elapsed = (+new Date()) - this.startTime;
      this.running = false;
   },

   getElapsedTime: function () {
      if (this.running) {
         return (+new Date()) - this.startTime;
      }
      else {
        return this.elapsed;
      }
   },

   isRunning: function() {
      return this.running;
   },

   reset: function() {
     this.elapsed = 0;
   }
};

if( 'undefined' != typeof global ) {
   module.exports = global.GameServer = GameServer;
}