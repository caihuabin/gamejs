define(function(require){
  var Enemy = require('./gameEnemies').Enemy;
  var enemyShipPainter = require('./gameRender').enemyShipPainter;

  var Config = require('./config');
  var eventEmitter = Config.eventEmitter;
  var CONSTANT = Config.CONSTANT;

  var GameEffects = require('./gameEffects');
  var EnemyExplosion = GameEffects.EnemyExplosion;
  var EnemyImpact = GameEffects.EnemyImpact;
  var BulletImpactEffect = GameEffects.BulletImpactEffect;
  var PlayerExplosion = GameEffects.PlayerExplosion;
  var ScoreIndicator = GameEffects.ScoreIndicator;
  var GameScene = function(){
    this.waves = [
      {
        enemyMax: 5,
        enemyWeighting: ['E', 'F', 'G'],
        lifetime: 20
      },
      {
        enemyMax: 5,
        enemyWeighting: ['A', 'A', 'B', 'B', 'C', 'D'],
        lifetime: 20
      },
      {
        enemyMax: 5,
        enemyWeighting: ['C'],
        lifetime: 10
      },
      {
        enemyMax: 8,
        enemyWeighting: ['A', 'B', 'B', 'C', 'C', 'D', 'D'],
        lifetime: 20
      },
      {
        enemyMax: 8,
        enemyWeighting: ['D'],
        lifetime: 10
      },
      {
        enemyMax: 10,
        enemyWeighting: ['B', 'C', 'F'],
        lifetime: 20
      },
      {
        enemyMax: 10,
        enemyWeighting: ['B', 'B', 'C', 'C', 'D', 'F'],
        lifetime: 20
      },
      {
        enemyMax: 10,
        enemyWeighting: ['C', 'E', 'G'],
        lifetime: 10
      },
      {
        enemyMax: 10,
        enemyWeighting: ['B', 'B', 'C', 'C', 'E', 'F'],
        lifetime: 20
      },
      {
        enemyMax: 10,
        enemyWeighting: ['D', 'E', 'G'],
        lifetime: 10
      },
      {
        enemyMax: 10,
        enemyWeighting: ['E', 'F', 'G'],
        lifetime: 20
      },
      // infinite last wave!
      {
        enemyMax: 12,
        enemyWeighting: ['B', 'C', 'D', 'E', 'F', 'G'],
        lifetime: 0
      }
    ];
    // generate the actors and add the actor sub-lists to the main actor list
    this.enemies = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.effects = [];
    this.collectables = [];
    /**
     * Displayed score (animates towards actual score)
     */
    this.scoredisplay = 0;
    this.currentWave = 0;
    this.enemyKills = 0;
    this.timeInScene = Date.now();
    this.skipLevel = false;

    this.frameMultipler = 1;
    this.scoreMultiplier = 1;
  };
  GameScene.prototype = {
    start: function(){
      this.timeInScene = Date.now();
    },
    animate: function(self_sprite, context, sprites, frameTime){
      var wave = this.waves[this.currentWave],
          now = Date.now();
      if (wave.lifetime !== 0 && (now > this.timeInScene + (wave.lifetime * 1000) || this.skipLevel)){
        this.skipLevel = false;
        // increment wave
        wave = this.waves[++this.currentWave];
        this.timeInScene = now;
      }
      while (this.enemies.length < wave.enemyMax){
        this.enemies.push(new Enemy(
          'enemy' + Math.random(), 
          enemyShipPainter, 
          null,
          {
            type: wave.enemyWeighting[randomInt(0, wave.enemyWeighting.length-1)] 
          } 
        ));
      }
      var index = this.enemies.length - 1,
          enemy;
      while(index > -1){
        enemy = this.enemies[index];
        enemy.render(context);
        enemy.update(self_sprite, this.enemyBullets);
        if(enemy.expired()){
          this.enemies.splice(index, 1);
        }
        else{
          enemy.position.add(enemy.vector.nscale(this.frameMultipler));
        }
        --index;
      }
      
      var index = this.enemyBullets.length - 1,
          world = {x_min: 0, x_max: CONSTANT.WORLD_WIDTH, y_min: 0, y_max: CONSTANT.WORLD_HEIGHT},
          bullet = null;
      while(index > -1){
        bullet = this.enemyBullets[index];
        bullet.render(context, world, frameTime);
        bullet.update(self_sprite);
        if(bullet.expired()){
          this.enemyBullets.splice(index, 1);
        }
        else{
          bullet.position.add(bullet.vector.nscale(this.frameMultipler));
        }
        --index;
      }

      this.collisionDetectPlayer(self_sprite);

      CONSTANT.BULLET_HUE += 0.5;
      sprites.forEach(function(sprite){
        var bullets = sprite.bullets,
          index = bullets.length-1,
          bullet = null;
        while(index > -1){
          bullet = bullets[index];
          bullet.render(context);
          bullet.update();

          if(bullet.expired()){
            bullets.splice( index, 1 );
          }
          else{
            bullet.position.add(bullet.vector.nscale(this.frameMultipler));
          }
          --index;
        }
      }.bind(this));

      this.collisionDetectBullets(self_sprite, sprites);

      var index = this.effects.length - 1,
          effect;
      while(index > -1){
        effect = this.effects[index];
        effect.render(context);
        effect.update(self_sprite);
        if(effect.expired()){
          this.effects.splice(index, 1);
        }
        else{
          effect.position.add(effect.vector.nscale(this.frameMultipler));
        }
        --index;
      }
    },

    /**
     * Detect player collisions with various actor classes
     * including Enemies, bullets and collectables etc.
     */
    collisionDetectPlayer: function collisionDetectPlayer(player){
      var playerRadius = player.radius;
      var playerPos = player.position;
      for (var n = 0, m = this.enemies.length; n < m; n++){
        var enemy = this.enemies[n];
        if (playerPos.distance(enemy.position) <= playerRadius + enemy.radius){
          player.damageBy(enemy.playerDamage);
          // apply impact to player from the enemy vector due to collision
          player.vector.add(enemy.vector.nscale(0.5));
          // destroy enemy from impact - no score though for this!
          enemy.damageBy(-1);
          
          this.destroyEnemy(enemy, player.vector, false);
          if (!player.alive){
            eventEmitter.emitEvent('play-sound', ['player-explosion']);
            // replace player with explosion
            /*var boom = new PlayerExplosion(player.position.clone(), player.vector.clone());
            this.effects.push(boom);*/
          }
        }
      }
       
      // test intersection with each enemy bullet
      for (var i = 0; i < this.enemyBullets.length; i++){
        var bullet = this.enemyBullets[i];
        if (playerPos.distance(bullet.position) <= playerRadius + bullet.radius){
          // remove this bullet from the actor list as it has been destroyed
          this.enemyBullets.splice(i, 1);
          player.damageBy(bullet.playerDamage);
          // apply impact to player from the enemy vector due to collision
          player.vector.add(bullet.vector.nscale(0.2));
          // show an effect for the bullet impact
          this.effects.push(new BulletImpactEffect(bullet.position.clone(), bullet.vector.nscale(0.5)));
          if (!player.alive){
            // replace player with explosion
            var boom = new PlayerExplosion(player.position.clone(), player.vector.clone());
            this.effects.push(boom);
          }
        }
      }
      for (var i = 0; i < this.collectables.length; i++){
        var item = this.collectables[i];
        // calculate distance between the two circles
        if (playerPos.distance(item.position) <= playerRadius + item.radius){
          // collision detected - remove item from play and activate it
          this.collectables.splice(i, 1);
          item.collected(this.game, this.player, this);
        }
      }
    },
    /**
      * Detect bullet collisions with enemy actors.
    */
    collisionDetectBullets: function collisionDetectBullets(player, sprites){
    	var self = this;
      var bullet, bulletRadius, bulletPos;
      var playerBullets = player.bullets;
      for (var i = 0; i < playerBullets.length; i++){
        bullet = playerBullets[i];
        bulletRadius = bullet.radius;
        bulletPos = bullet.position;
        // test circle intersection with each enemy actor
        for (var n = 0, m = this.enemies.length, enemy, z; n < m; n++){
          enemy = this.enemies[n];
          // test the distance against the two radius combined
          if (bulletPos.distance(enemy.position) <= bulletRadius + enemy.radius){
            // impact the enemy with the bullet - may destroy it or just damage it
            if (enemy.damageBy(bullet.power())){
              this.destroyEnemy(enemy, bullet.vector, player);
              /*this.generateMultiplier(enemy);
              this.generatePowerUp(enemy);*/
            }
            else{
              eventEmitter.emitEvent('play-sound', ['enemy-hit']);
              // add bullet impact effect to show the bullet hit
              var effect = new EnemyImpact(bullet.position.clone(), bullet.vector.nscale(0.5 + Rnd() * 0.5), enemy);
              this.effects.push(effect);
            }
            bullet.alive = false;
            playerBullets.splice(i, 1);
            break;
          }
        }
      }

      sprites.forEach(function(item){
        var playerBullets = item.bullets;
        var bullet, bulletRadius, bulletPos;
        for(var i = 0; i < playerBullets.length; i++){
          bullet = playerBullets[i];
          bulletRadius = bullet.radius;
          bulletPos = bullet.position;
          for(var j = 0; j < sprites.length; j++){
            if(sprites[j] !== item){
              if(bulletPos.distance(sprites[j].position) <= sprites[j].radius + bulletRadius){
                
                sprites[j].vector.add(bullet.vector.nscale(0.2));
                self.effects.push(new BulletImpactEffect(bullet.position.clone(), bullet.vector.nscale(0.5)));
                
                if(sprites[j].damageBy(bullet.power())){
                  self.effects.push(new PlayerExplosion(sprites[j].position.clone(), sprites[j].vector.clone()) );
                }
                sprites[j].input.damage = true;
                item.input.score = true;
                bullet.alive = false;
                break;
              }
            }
          }
        }
      });
    },
    /**
     * Destroy an enemy. Replace with appropriate effect.
     * Also applies the score for the destroyed item if the player caused it.
     * 
     * @param enemy {Game.Enemy} The enemy to destory and add score for
     * @param parentVector {Vector} The vector of the item that hit the enemy
     * @param player {boolean} If true, the player was the destroyer
     */
    destroyEnemy: function(enemy, parentVector, player){
      // add an explosion actor at the enemy position and vector
      var vec = enemy.vector.clone();
      // add scaled parent vector - to give some momentum from the impact
      vec.add(parentVector.nscale(0.2));
      this.effects.push(new EnemyExplosion(enemy.position.clone(), vec, enemy));
      // play a sound
      eventEmitter.emitEvent('play-sound', ['enemy-bomb' + randomInt(1,4)]);
      if (player){
        // increment score
        var inc = (enemy.scoretype + 1) * 5 * this.scoreMultiplier;
        player.score += inc;
        // generate a score effect indicator at the destroyed enemy position
        var vec = new Vector(0, -5.0).add(enemy.vector.nscale(0.5));
        this.effects.push(new ScoreIndicator(new Vector(enemy.position.x, enemy.position.y - 16), vec, inc));
        // call event handler for enemy
        enemy.onDestroyed(this, player);
      }
      this.enemyKills++;
    },
    /**
       * Generate score multiplier(s) for player to collect after enemy is destroyed
       */
      generateMultiplier: function generateMultiplier(enemy)
      {
         if (enemy.dropsMutliplier)
         {
            var count = randomInt(1, (enemy.type < 5 ? enemy.type : 4));
            for (var i=0; i<count; i++)
            {
               this.collectables.push(new Arena.Multiplier(enemy.position.clone(),
                  enemy.vector.nscale(0.2).rotate(Rnd() * TWOPI)));
            }
         }
      },
      
      /**
       * Generate powerup for player to collect after enemy is destroyed
       */
      generatePowerUp: function generatePowerUp(enemy)
      {
         if (this.player.energy < this.player.ENERGY_INIT && Rnd() < 0.1)
         {
            // only allow a fixed max number of powerup collectables visible at once
            for (var i = 0, j = this.collectables.length, count = 0; i<j; i++)
            {
               if (this.collectables[i] instanceof Arena.EnergyBoostPowerup)
               {
                  count++;
               }
            }
            if (count < 2)
            {
               this.collectables.push(new Arena.EnergyBoostPowerup(enemy.position.clone(),
                  enemy.vector.nscale(0.5).rotate(Rnd() * TWOPI)));
            }
         }
      },
  };

  return GameScene;
});