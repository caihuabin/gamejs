requirejs.config({
    baseUrl: '/javascripts/lib',
    paths: {
        app: '../app',
        'socket.io': '/socket.io',
        game: '../game'
    }
});

requirejs(['app/main']);