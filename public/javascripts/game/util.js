define(function(require, exports, module){
  var Interpolation = {
    lerp: function(p, n, t){
      var _t = Number(t);
      _t = Math.max(0, Math.min(1, _t)) ; 
      return (p + _t * (n - p));
    },
    v_lerp: function(v, tv, t){
      return { x: this.lerp(v.x, tv.x, t), y:this.lerp(v.y, tv.y, t) }; 
    }
  };
  var windowToCanvas = function(canvas, e) {
    var x = e.x || e.clientX,
        y = e.y || e.clientY,
        bbox = canvas.getBoundingClientRect();
    return { 
      x: x - bbox.left * (canvas.width  / bbox.width),
      y: y - bbox.top  * (canvas.height / bbox.height)
    };
  };
  var maxOrbit = function(x, y) {
    var max = Math.max(x, y),
        diameter = Math.round(Math.sqrt(max * max * 2));
    return diameter / 2;
  };
  var colorToRGB = function(color){
    var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/,
        color = color.toLowerCase(),
        rgb = [];
    if(color && reg.test(color) ){
      if(color.length === 4){
        var temp = "#";
        for(var i=1; i<4; i++){
          temp += color.substring(i,i+1).concat(color.substring(i,i+1));   
        }
        color = temp;
      }
      for(var i=1; i<7; i+=2){
        rgb.push(parseInt("0x"+color.substring(i,i+2)) );
      }
      return "rgb(" + rgb.join(",") + ")";
    }
    else{
      return color;
    }
  };
  exports.Interpolation = Interpolation;
  exports.windowToCanvas = windowToCanvas;
  exports.maxOrbit = maxOrbit;
  exports.colorToRGB = colorToRGB;

});
