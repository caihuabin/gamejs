( function (window) {
    var frame_time = 1000/60;
    var timeout = 0;
    var vendors = [ 'ms', 'moz', 'webkit', 'o' ];
    for ( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++ x ) {
        window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
        window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ] || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
    }
    if ( !window.requestAnimationFrame ) {
        window.requestAnimationFrame = function ( callback, element ) {
            var start,
                finish;

            var id = window.setTimeout( function () {
               start = +new Date();
               callback(start);
               finish = +new Date();

               timeout = frame_time - (finish - start);

            }, timeout);
            return id;

        };
    }
    if ( !window.cancelAnimationFrame ) {
        window.cancelAnimationFrame = function ( id ) { clearTimeout( id ); };
    }
    window.requestNextAnimationFrame = window.requestAnimationFrame;
})(window);