define(function(require, exports, module){
  var eventEmitter = require('./config').eventEmitter;

  var Bullet = require('./gameWeapons').Bullet;

  var handleInput = {
    execute: function(sprite, context, time){
      var angle = null;
      if (sprite.input.left)
      {
        sprite.inputs.push({input: 'l', seq: ++sprite.input_seq, time: time});
         if (sprite.input.up) angle = 315;
         else if (sprite.input.down) angle = 225;
         else angle = 270;
      }
      if (sprite.input.right)
      {
        sprite.inputs.push({input: 'r', seq: ++sprite.input_seq, time: time});
         if (sprite.input.up) angle = 45;
         else if (sprite.input.down) angle = 135;
         else angle = 90;
      }
      if (sprite.input.up)
      {
        sprite.inputs.push({input: 'u', seq: ++sprite.input_seq, time: time});
         if (sprite.input.left) angle = 315;
         else if (sprite.input.right) angle = 45;
         else angle = 1;
      }
      if (sprite.input.down)
      {
        sprite.inputs.push({input: 'd', seq: ++sprite.input_seq, time: time});
         if (sprite.input.left) angle = 225;
         else if (sprite.input.right) angle = 135;
         else angle = 181;
      }
      if (!!sprite.input.mouse)
      {
        sprite.inputs.push({input: 'M', data: [sprite.position.x, sprite.position.y, sprite.input.mouse.x, sprite.input.mouse.y], seq: ++sprite.input_seq, time: time});
        sprite.input.mouse = null;
      }
      if(sprite.input.score){
        sprite.inputs.push({input: '+', seq: ++sprite.input_seq, time: time});
        sprite.input.score = false;
      }
      if(sprite.input.damage){
        sprite.inputs.push({input: '-', seq: ++sprite.input_seq, time: time});
        sprite.input.damage = false;
      }

      if (angle !== null)
      {
        sprite.inputs.push({input: 'A', data: angle * RAD, seq: ++sprite.input_seq, time: time});
      }
    }
  };
  var processInput = {
    server_inputs: [],
    execute: function(sprite, context, time){
      
      var x_dir = 0;
      var y_dir = 0;
      var heading = null;

      var server_packet = 'i#';

      var ic = sprite.inputs.length;
      if(ic) {
        for(var j = 0; j < ic; ++j) {
            //don't process ones we already have simulated locally
          if(sprite.inputs[j].seq <= sprite.last_input_seq) continue;
          var item = sprite.inputs[j],
            input = item.input;

          if(sprite.name === 'self_sprite'){
            this.server_inputs.push(item);
          }
          
          switch (input)
          {
            case 'l':
              --x_dir;
              break;
            case 'r':
              ++x_dir;
              break;
            case 'u':
              --y_dir;
              break;
            case 'd':
              ++y_dir;
              break;
            case 'M':
              sprite.bullets.push(new Bullet(item.data[0], item.data[1], item.data[2], item.data[3]) );
              eventEmitter.emitEvent('play-sound', ['shoot2']);
              break;
            case 'A':
              sprite.engineThrust = true;
              heading = item.data;
              break;
            case '+':
              ++sprite.score;
              break;
            default :
              break;
          }
        }
        if(this.server_inputs.length > 0 ){
          server_packet += JSON.stringify(this.server_inputs);
          eventEmitter.emitEvent('socket-send', [server_packet]);
          this.server_inputs = [];
        }
        sprite.last_input_time = sprite.inputs[ic-1].time;
        sprite.last_input_seq = sprite.inputs[ic-1].seq;
        sprite.inputs = [];
      }
      //sprite.top += y_dir * game.pixelsPerFrame(time, sprite.velocityY);
      sprite.position.y += y_dir * sprite.velocityY/60;
      sprite.position.x += x_dir * sprite.velocityX/60;
      if(heading !== null){
        sprite.heading = heading;
      }

    }
  };

  var checkCollision = {
    execute: function(sprite, context, time){
      if(sprite.position.y <= sprite.position_limit.y_min) {
        sprite.position.y = sprite.position_limit.y_min;
      }
      if(sprite.position.y >= sprite.position_limit.y_max ) {
        sprite.position.y = sprite.position_limit.y_max;
      }
      if(sprite.position.x <= sprite.position_limit.x_min) {
        sprite.position.x = sprite.position_limit.x_min;
      }
      if(sprite.position.x >= sprite.position_limit.x_max ) {
        sprite.position.x = sprite.position_limit.x_max;
      }
      if(sprite.heading > Math.PI * 2 || sprite.heading < 0){
        sprite.heading = Math.PI/2;
      }
    }
  };
  exports.handleInput = handleInput;
  exports.processInput = processInput;
  exports.checkCollision = checkCollision;


});
