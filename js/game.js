/* ============================================
   JUNGLE CHASE - Game Manager
   Score, lives, timer, collisions, HUD, minimap.
   ============================================ */
var JUNGLE = JUNGLE || {};

JUNGLE.Game = {
    state: 'menu',   // menu | playing | paused | over
    mode: 'prey',    // prey | predator
    score: 0,
    lives: 3,
    timeLeft: 180,
    elapsed: 0,
    tickAccum: 0,     // for periodic scoring
    lastCatch: 0,

    /* ---------- Start ---------- */
    start: function (mode, animalKey, scene) {
        this.state = 'playing';
        this.mode = mode;
        this.score = 0;
        this.lives = JUNGLE.Config.INITIAL_LIVES;
        this.timeLeft = JUNGLE.Config.GAME_DURATION;
        this.elapsed = 0;
        this.tickAccum = 0;

        // Hide menu, show HUD
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');

        // Create player & AI
        JUNGLE.Entities.createPlayer(animalKey, scene);
        JUNGLE.Entities.spawnAIAnimals(scene, mode);
        JUNGLE.Environment.reset(scene);

        // Update HUD
        this.updateHUD();
        this.showMessage("C'est parti !", 2);
    },

    /* ---------- Per-frame update ---------- */
    update: function (dt, inputMap, camera, scene) {
        if (this.state !== 'playing') return;

        // Timer
        this.timeLeft -= dt;
        this.elapsed += dt;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            if (this.mode === 'prey') {
                this.win(scene);
            } else {
                this.lose("Le temps est écoulé !", scene);
            }
            return;
        }

        // Periodic score for prey
        this.tickAccum += dt;
        if (this.tickAccum >= JUNGLE.Config.SCORE_TICK_INTERVAL) {
            this.tickAccum -= JUNGLE.Config.SCORE_TICK_INTERVAL;
            if (this.mode === 'prey') {
                this.score += JUNGLE.Config.SCORE_SURVIVE_TICK;
            }
        }

        // Hide attempt
        if (inputMap["Space"]) {
            inputMap["Space"] = false; // Consume
            var hidden = JUNGLE.Entities.tryHidePlayer();
            if (hidden) {
                this.score += JUNGLE.Config.SCORE_HIDE_BONUS;
                this.showMessage("🌿 Caché ! +" + JUNGLE.Config.SCORE_HIDE_BONUS + " pts", 1.5);
            }
        }

        // Update entities
        JUNGLE.Entities.updatePlayer(dt, inputMap, camera, scene);
        JUNGLE.Entities.updateAI(dt, this.mode, scene);

        // Proximity indicator
        this.updateProximityIndicator();

        // Collisions
        this.checkCollisions(scene);

        // HUD
        this.updateHUD();

        // Minimap
        this.drawMinimap();
    },

    /* ---------- Collisions ---------- */
    checkCollisions: function (scene) {
        var player = JUNGLE.Entities.player;
        if (!player || !player.alive || player.isHidden) return;
        var pp = player.mesh.position;
        var catchDist = JUNGLE.Config.AI_CATCH_DISTANCE;

        if (this.mode === 'prey') {
            // Check if any AI predator caught the player
            var self = this;
            JUNGLE.Entities.aiAnimals.forEach(function (ai) {
                if (!ai.alive) return;
                if (ai.role !== 'predator') return;
                var d = BABYLON.Vector3.Distance(pp, ai.mesh.position);
                if (d < catchDist) {
                    self.playerCaught(scene);
                }
            });
        } else {
            // Predator mode: check if player caught an AI prey
            var self2 = this;
            JUNGLE.Entities.aiAnimals.forEach(function (ai) {
                if (!ai.alive) return;
                if (ai.role !== 'prey') return;
                var d = BABYLON.Vector3.Distance(pp, ai.mesh.position);
                if (d < catchDist) {
                    self2.preyCaught(ai, scene);
                }
            });
        }

        // Bonus items
        var self3 = this;
        JUNGLE.Environment.bonusItems.forEach(function (b) {
            if (b.collected) return;
            var d = BABYLON.Vector3.Distance(pp, b.position);
            if (d < 4) {
                b.collected = true;
                b.mesh.isVisible = false;
                self3.score += JUNGLE.Config.SCORE_BONUS_PICKUP;
                self3.showMessage("⭐ +" + JUNGLE.Config.SCORE_BONUS_PICKUP + " pts", 1);
            }
        });
    },

    playerCaught: function (scene) {
        this.lives--;
        if (this.lives <= 0) {
            this.lose("Tu as été dévoré !", scene);
        } else {
            this.showMessage("💀 Attrapé ! Vies restantes: " + this.lives, 2);
            // Respawn player at random safe location
            var half = JUNGLE.Config.TERRAIN_SIZE / 4;
            JUNGLE.Entities.player.mesh.position.set(
                (Math.random() - 0.5) * half,
                0,
                (Math.random() - 0.5) * half
            );
        }
    },

    preyCaught: function (ai, scene) {
        ai.alive = false;
        ai.mesh.setEnabled(false);
        this.score += JUNGLE.Config.SCORE_PER_CATCH;
        this.showMessage("🎯 " + ai.cfg.name + " attrapé ! +" + JUNGLE.Config.SCORE_PER_CATCH + " pts", 1.5);

        // Check if all prey caught
        var preyLeft = JUNGLE.Entities.aiAnimals.filter(function (a) {
            return a.role === 'prey' && a.alive;
        }).length;
        if (preyLeft === 0) {
            this.win(scene);
        }
    },

    /* ---------- Win / Lose ---------- */
    win: function (scene) {
        this.state = 'over';
        var title = document.getElementById('gameover-title');
        title.textContent = "🏆 VICTOIRE !";
        title.className = "gameover-title win";
        var msg = this.mode === 'prey'
            ? "Tu as survécu à la jungle pendant " + this.formatTime(this.elapsed) + " !"
            : "Tu as chassé toutes tes proies !";
        document.getElementById('gameover-message').textContent = msg;
        this.showGameOver();
    },

    lose: function (reason, scene) {
        this.state = 'over';
        var title = document.getElementById('gameover-title');
        title.textContent = "💀 GAME OVER";
        title.className = "gameover-title lose";
        document.getElementById('gameover-message').textContent = reason;
        this.showGameOver();
    },

    showGameOver: function () {
        document.getElementById('gameover-score').textContent = this.score;
        document.getElementById('gameover-time').textContent = this.formatTime(this.elapsed);
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('game-over').classList.remove('hidden');
    },

    /* ---------- Pause ---------- */
    togglePause: function () {
        if (this.state === 'playing') {
            this.state = 'paused';
            document.getElementById('pause-menu').classList.remove('hidden');
        } else if (this.state === 'paused') {
            this.resume();
        }
    },

    resume: function () {
        this.state = 'playing';
        document.getElementById('pause-menu').classList.add('hidden');
    },

    /* ---------- HUD ---------- */
    updateHUD: function () {
        document.getElementById('hud-score-value').textContent = this.score;
        document.getElementById('hud-timer-value').textContent = this.formatTime(this.timeLeft);

        // Timer flash when low
        var timerEl = document.getElementById('hud-timer-value');
        timerEl.style.color = this.timeLeft < 30 ? '#e74c3c' : '#fff';

        // Lives
        var hearts = '';
        for (var i = 0; i < this.lives; i++) hearts += '❤️';
        for (var j = this.lives; j < JUNGLE.Config.INITIAL_LIVES; j++) hearts += '🖤';
        document.getElementById('hud-lives-value').textContent = hearts;

        // Stamina
        if (JUNGLE.Entities.player) {
            var pct = (JUNGLE.Entities.player.stamina / JUNGLE.Config.STAMINA_MAX) * 100;
            document.getElementById('stamina-fill').style.width = pct + '%';
        }
    },

    /* ---------- Minimap ---------- */
    drawMinimap: function () {
        var canvas = document.getElementById('minimap');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        var W = canvas.width, H = canvas.height;
        var S = JUNGLE.Config.TERRAIN_SIZE;

        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#1a3a1a';
        ctx.fillRect(0, 0, W, H);

        // River
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 3;
        ctx.beginPath();
        JUNGLE.Environment.riverPath.forEach(function (p, i) {
            var mx = (p.x / S + 0.5) * W;
            var my = (0.5 - p.z / S) * H;
            if (i === 0) ctx.moveTo(mx, my);
            else ctx.lineTo(mx, my);
        });
        ctx.stroke();

        // Hiding spots
        ctx.fillStyle = 'rgba(46,204,113,0.5)';
        JUNGLE.Environment.hidingSpots.forEach(function (hs) {
            var mx = (hs.position.x / S + 0.5) * W;
            var my = (0.5 - hs.position.z / S) * H;
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Bonus items
        ctx.fillStyle = '#f0c040';
        JUNGLE.Environment.bonusItems.forEach(function (b) {
            if (b.collected) return;
            var mx = (b.position.x / S + 0.5) * W;
            var my = (0.5 - b.position.z / S) * H;
            ctx.beginPath();
            ctx.arc(mx, my, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // AI animals
        JUNGLE.Entities.aiAnimals.forEach(function (ai) {
            if (!ai.alive) return;
            var mx = (ai.mesh.position.x / S + 0.5) * W;
            var my = (0.5 - ai.mesh.position.z / S) * H;
            ctx.fillStyle = (ai.role === 'predator') ? '#e74c3c' : '#2ecc71';
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Player
        if (JUNGLE.Entities.player) {
            var p = JUNGLE.Entities.player.mesh.position;
            var px = (p.x / S + 0.5) * W;
            var py = (0.5 - p.z / S) * H;
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, W, H);
    },

    /* ---------- Proximity indicator ---------- */
    updateProximityIndicator: function () {
        var el = document.getElementById('hud-proximity');
        if (!el) return;
        var player = JUNGLE.Entities.player;
        if (!player || !player.alive) { el.classList.add('hidden'); return; }

        var pp = player.mesh.position;
        var alertDist = JUNGLE.Config.AI_CATCH_DISTANCE * 3;
        var closest = null;
        var closestDist = Infinity;

        if (this.mode === 'predator') {
            JUNGLE.Entities.aiAnimals.forEach(function (ai) {
                if (!ai.alive || ai.role !== 'prey') return;
                var d = BABYLON.Vector3.Distance(pp, ai.mesh.position);
                if (d < alertDist && d < closestDist) {
                    closest = ai;
                    closestDist = d;
                }
            });
            if (closest) {
                var catchDist = JUNGLE.Config.AI_CATCH_DISTANCE;
                if (closestDist < catchDist * 1.5) {
                    el.textContent = '🎯 Très proche ! Fonce !';
                    el.className = 'hud-proximity very-close';
                } else {
                    el.textContent = '👁️ ' + closest.cfg.name + ' repéré(e) à proximité !';
                    el.className = 'hud-proximity close';
                }
            } else {
                el.classList.add('hidden');
            }
        } else {
            // Prey mode: warn of approaching predators
            JUNGLE.Entities.aiAnimals.forEach(function (ai) {
                if (!ai.alive) return;
                if (ai.role !== 'predator') return;
                var d = BABYLON.Vector3.Distance(pp, ai.mesh.position);
                if (d < alertDist && d < closestDist) {
                    closest = ai;
                    closestDist = d;
                }
            });
            if (closest) {
                var catchDist2 = JUNGLE.Config.AI_CATCH_DISTANCE;
                if (closestDist < catchDist2 * 2) {
                    el.textContent = '⚠️ DANGER ! ' + closest.cfg.name + ' tout proche !';
                    el.className = 'hud-proximity danger';
                } else {
                    el.textContent = '⚠️ ' + closest.cfg.name + ' approche...';
                    el.className = 'hud-proximity warning';
                }
            } else {
                el.classList.add('hidden');
            }
        }
    },

    /* ---------- Message popup ---------- */
    showMessage: function (text, duration) {
        var el = document.getElementById('hud-message');
        el.textContent = text;
        el.classList.add('show');
        clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(function () {
            el.classList.remove('show');
        }, (duration || 2) * 1000);
    },

    /* ---------- Helpers ---------- */
    formatTime: function (seconds) {
        var m = Math.floor(Math.max(0, seconds) / 60);
        var s = Math.floor(Math.max(0, seconds) % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }
};
