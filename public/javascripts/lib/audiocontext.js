      window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
      // HTML5 Audio API detection
      this.audioContext = typeof AudioContext === "function" ? new AudioContext() : null;
      if (this.audioContext)
      {
         this.audioGain = this.audioContext.createGain();
         this.audioGain.gain.value = 0.333;
         this.audioComp = this.audioContext.createDynamicsCompressor();
         this.audioGain.connect(this.audioComp);
         this.audioComp.connect(this.audioContext.destination);
      }

      /**
    * Load sound helper
    */
   loadSound: function(url, id)
   {
      if (this.hasAudio())
      {
         var request = new XMLHttpRequest();
         request.open("GET", url, true);
         request.responseType = "arraybuffer";  // fancy binary XHR2 request
         var me = this;
         request.onload = function() {
            me.audioContext.decodeAudioData(request.response, function(buffer) {
               me.sounds[id] = buffer;
            });
         };
         request.send();
      }
   },
   
   /**
    * Play sound helper
    */
   playSound: function(id)
   {
      if (this.soundEnabled && this.hasAudio() && this.sounds[id])
      {
         var source = this.audioContext.createBufferSource();
         source.buffer = this.sounds[id];
         source.connect(this.audioGain);
         source.start(0);
      }
   }