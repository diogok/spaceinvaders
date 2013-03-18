var game = (function(){
    var game = this, started=false, hCenter, vCenter;

    var play = function() {

        var player, aliens, level=0, lifes=3, limit = jaws.height - 35 ;

        this.setup = function() {
            if(started) return;
            started = true;

            jaws.preventDefaultKeys(['left','right','space']);

            player = new jaws.Sprite({image: 'player.png', y: jaws.height-(26),x:hCenter - 15});
            player.fired = false;
            player.bullets = new jaws.SpriteList();

            aliens = new jaws.SpriteList();
            for(var line in levels[level]) {
                for(var n in levels[level][line]) {
                    aliens.push(makeAlien(line,n,levels[level][line][n]));
                }
            }
            aliens.bullets = new jaws.SpriteList();

            aliens.move = 4 ;
            aliens.timer = makeAliensMove(50);
            aliens.shooter = makeAliensShoot();
        };

        this.update = function() {
            if(isGameOver() || playerWon()) {
                clearInterval(aliens.timer);
                clearInterval(aliens.shooter);
                if(jaws.pressed('space')) {
                    started=false;
                    jaws.switchGameState(play);
                }
                return;
            }
            if(jaws.pressed('left')) player.x -= 2;
            if(jaws.pressed('right')) player.x += 2;
            if(jaws.pressed('space')) {
                if(!player.fired) {
                    player.fired = true;
                    player.bullets.push(makeBullet(player,'blue',-1.7));
                    setTimeout(function(){ player.fired = false},500);
                }
            }
            insideCanvas(player);
            player.bullets.removeIf(outsideCanvas);
            aliens.removeIf(alienGotHit);
            player.bullets.removeIf(bulletHit);
            aliens.bullets.removeIf(playerGotHit);
            aliens.bullets.removeIf(outsideCanvas);

            if(aliens.sprites.length <= 3 && aliens.interval > 10)  {
                //clearInterval(aliens.timer);
                //aliens.timer = makeAliensMove(10);
            } else if(aliens.sprites.length <= 7 && aliens.interval > 20)  {
                clearInterval(aliens.timer);
                aliens.timer = makeAliensMove(20);
            } else if(aliens.sprites.length <= 14 && aliens.interval > 30)  {
                clearInterval(aliens.timer);
                aliens.timer = makeAliensMove(30);
            } else if(aliens.sprites.length <= 21 && aliens.interval > 40)  {
                clearInterval(aliens.timer);
                aliens.timer = makeAliensMove(40);
            } 
        };

        this.draw = function() {
            jaws.context.clearRect(0,0,jaws.width,jaws.height);
            jaws.context.fillStyle = "black";
            jaws.context.fillRect(0,0,jaws.width,jaws.height);

            jaws.context.strokeStyle = "red";
            jaws.context.lineWidth = 1;
            jaws.context.beginPath();
            jaws.context.moveTo(10,limit);
            jaws.context.lineTo(jaws.width - 10,limit);
            jaws.context.stroke();

            jaws.context.font = "normal 12pt monospace";
            jaws.context.lineWidth = 10;
            jaws.context.fillStyle = "#006700";
            jaws.context.fillText("Lifes: "+ lifes, jaws.width - 100, 20);

            player.draw();
            player.bullets.draw();
            aliens.draw();
            aliens.bullets.draw();

            if(isGameOver()) {
                jaws.context.font = "normal 36pt monospace";
                jaws.context.lineWidth = 10;
                jaws.context.fillStyle = "#006700";
                jaws.context.fillText("Game Over!", hCenter - 120, vCenter );
            }

            if(playerWon()) {
                jaws.context.font = "normal 36pt monospace";
                jaws.context.lineWidth = 10;
                jaws.context.fillStyle = "#006700";
                jaws.context.fillText("You Won!", hCenter - 100, vCenter );
            }
        };

        function alienGotHit(alien) {
            for(var i in player.bullets.sprites) {
                var bullet = player.bullets.sprites[i];
                if(alien.rect().collideRect(bullet.rect())) {
                    bullet.hit=true;
                    return true;
                }
            }
            return false;
        }

        function bulletHit(bullet) {
            return bullet.hit;
        }

        function playerGotHit(bullet) {
            if(player.rect().collideRect(bullet.rect())) {
                bullet.hit = true;
                lifes -= 1;
                return true;
            }
            return false;
        }

        function isGameOver() {
            if(lifes <= 0) return true;
            for(var i in aliens.sprites) {
                if(aliens.sprites[i].y + aliens.sprites[i].height >= limit) {
                    return true;
                }
            }
            return false;
        }

        function playerWon() {
            return aliens.sprites.length == 0;
        }

        function insideCanvas(item) {
            if(item.x < 5) { item.x = 5 ;}
            if(item.x + item.width > ( jaws.width - 5)) { item.x = jaws.width - item.width - 5;}
            if(item.y < 0) { item.y = 0 ;}
            if(item.y + item.height > jaws.height) { item.y = jaws.height - item.height; }
        }

        function outsideCanvas(el) {
            return (el.y < 5 || el.y > jaws.height -5 ) ;
        }

        function makeBullet(player, color,dest) {
            var bullet = {};
            bullet.x = player.x + (player.width / 2) - 3;
            bullet.y = player.y + ( player.height * dest ) ;
            bullet.hit = false;
            bullet.draw = function() {
                jaws.context.drawImage(jaws.assets.get("bullet_"+color+".png"), bullet.x, bullet.y);
            };
            bullet.timer = setInterval(function(){
                bullet.y += 4 * dest;
                if(bullet.y <= 5) {
                    clearInterval(bullet.timer);
                }
            }, 25) ;
            bullet.rect = function() {
                return {x: bullet.x, 
                        y: bullet.y,
                        height: 20, 
                        width: 6, 
                        right: bullet.x + 6 ,
                        bottom: bullet.y + 20
                    };
            }
            return bullet;
        }

        function makeAlien(line,n,type) {
            var alien = new jaws.Sprite({image: 'alien_'+type+'.png', y: line * 30 + 10, x: (n * 50) + 30 });
            alien.type = type;
            alien.x -= alien.width / 2;
            return alien;
        }

        function makeAliensShoot() {
            return setInterval(function(){
                var lastRow = [];
                for(var i in aliens.sprites) {
                    var alienA = aliens.sprites[i];
                    var keep = false;
                    for(var ii in aliens.sprites) {
                        var alienB = aliens.sprites[ii];
                        if(alienA == alienB) continue;
                        if(alienA.x == alienB.x) {
                            if(alienA.y > alienB.y) {
                                keep = true;
                            } else {
                                keep = false;
                            }
                        }
                    }
                    if(keep) {
                        lastRow.push(alienA);
                    }
                }
                for(var i in lastRow) {
                    var rand =Math.floor(Math.random()*10);
                    if(rand <= 1) {
                        aliens.bullets.push(makeBullet(lastRow[i],lastRow[i].type,1));
                    }
                }
            },1000);
        }

        function makeAliensMove(time) {
            aliens.interval = time;
            return setInterval(function() {
                var lefty = aliens.sprites[0] , righty = aliens.sprites[0]; 

                for(var i in aliens.sprites) {
                    var a = aliens.sprites[i];
                    if(a.x < lefty.x) lefty = a;
                    if(a.x > righty.x) righty = a;
                }

                if(righty.x + 36 >= jaws.width - 10) {
                    aliens.move = -4 ;
                    for(var i in aliens.sprites) {
                        aliens.sprites[i].y += 20 ;
                    }
                } else if(lefty.x <= 10){
                    aliens.move = 4;
                    for(var i in aliens.sprites) {
                        aliens.sprites[i].y += 20 ;
                    }
                }

                for(var i in aliens.sprites) {
                    aliens.sprites[i].x += aliens.move;
                }

            },time);
        }
    };

    var intro = function() {

        var fading = 64, fader ;

        this.setup = function() {
            jaws.on_keydown(['enter','space'],function(){
                fader = setInterval(function() {
                    fading -= 2;
                    if(fading <= 0) {
                        clearInterval(fader);
                        jaws.switchGameState(play);
                    }
                },25);
            });
        };

        this.draw = function() {
            jaws.context.clearRect(0,0,jaws.width,jaws.height);

            jaws.context.fillStyle = "black";
            jaws.context.strokeStyle="black";
            jaws.context.fillRect(0,0,jaws.width,jaws.height);

            jaws.context.font = "normal 16pt monospace";
            jaws.context.lineWidth = 10;
            jaws.context.fillStyle = "#00"+fading+"00";
            jaws.context.fillText("Pressione 'espaço' para iniciar...", 10 , jaws.height - 10 );

            if(fading <= 0) {
            }
        };
    };

    game.start = function() {
        jaws.assets.add(['player.png']);
        jaws.assets.add(['alien_blue.png','alien_purple.png','alien_green.png']);
        jaws.assets.add(['bullet_blue.png','bullet_purple.png','bullet_green.png']);
        jaws.start(intro);

        hCenter = jaws.width/2;
        vCenter =jaws.height/2;
    };

    return game;
})();
