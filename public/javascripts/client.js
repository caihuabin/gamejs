var game = {};
window.onload = function(){
	game = new game_core();
	game.viewport = document.getElementById('viewport');
	game.viewport.width = game.world.width;
	game.viewport.height = game.world.height;
	game.ctx = game.viewport.getContext('2d');
		//Set the draw style for the font
	game.ctx.font = '11px "Helvetica"';
		//Finally, start the loop
	game.update( new Date().getTime() );
};