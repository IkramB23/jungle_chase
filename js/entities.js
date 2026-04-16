/* ============================================
   JUNGLE CHASE - Entities (Animals & Player)
   Placeholder meshes, steering AI, player ctrl.
   ============================================ */
var JUNGLE = JUNGLE || {};

JUNGLE.Entities = {
    player: null,
    aiAnimals: [],
    _modelContainers: {},

    /* ==========================================
       Preload all GLB models (animals + env)
       Called during loading screen.
       ========================================== */
    preloadModels: function (scene, onProgress, onComplete) {
        var self = this;
        var animals = JUNGLE.Config.ANIMALS;
        var animalKeys = Object.keys(animals);
        var envModels = JUNGLE.Config.ENV_MODELS || {};
        var envKeys = Object.keys(envModels);
        var total = animalKeys.length + envKeys.length;
        var loaded = 0;

        if (total === 0) { if (onComplete) onComplete(); return; }

        function onLoadDone() {
            loaded++;
            if (onProgress) onProgress(loaded / total);
            if (loaded >= total && onComplete) onComplete();
        }

        animalKeys.forEach(function (key) {
            var modelFile = animals[key].model;
            if (!modelFile) { onLoadDone(); return; }
            BABYLON.SceneLoader.LoadAssetContainer(
                JUNGLE.Config.MODEL_PATH, modelFile, scene,
                function (container) {
                    self._modelContainers[key] = container;
                    onLoadDone();
                },
                null,
                function (scene, message) {
                    console.warn("Failed to load " + modelFile + ": " + message);
                    onLoadDone();
                }
            );
        });

        envKeys.forEach(function (key) {
            var modelFile = envModels[key];
            BABYLON.SceneLoader.LoadAssetContainer(
                JUNGLE.Config.ENV_MODEL_PATH, modelFile, scene,
                function (container) {
                    self._modelContainers["env_" + key] = container;
                    onLoadDone();
                },
                null,
                function (scene, message) {
                    console.warn("Failed to load env " + modelFile + ": " + message);
                    onLoadDone();
                }
            );
        });
    },

    /* ==========================================
       Create an animal mesh (GLB or placeholder)
       ========================================== */
    createAnimalMesh: function (key, scene) {
        var container = this._modelContainers[key];
        if (container) {
            return this._createGLBMesh(key, container, scene);
        }
        return this._createPlaceholderMesh(key, scene);
    },

    /* ==========================================
       Create animal from loaded GLB/glTF container
       ========================================== */
    _createGLBMesh: function (key, container, scene) {
        var cfg = JUNGLE.Config.ANIMALS[key];
        var uid = key + "_" + Math.random().toFixed(4);
        var root = new BABYLON.TransformNode("animal_" + uid, scene);

        var instance = container.instantiateModelsToScene(function (name) {
            return name + "_" + uid;
        });

        // Parent all instantiated root nodes under our transform
        instance.rootNodes.forEach(function (node) {
            node.parent = root;
        });

        // Auto-scale: compute bounding box, normalize to target height
        var targetHeight = cfg.size * 2;
        var min = new BABYLON.Vector3(1e8, 1e8, 1e8);
        var max = new BABYLON.Vector3(-1e8, -1e8, -1e8);
        var childMeshes = root.getChildMeshes(false);
        childMeshes.forEach(function (m) {
            m.refreshBoundingInfo();
            var bi = m.getBoundingInfo();
            min = BABYLON.Vector3.Minimize(min, bi.boundingBox.minimumWorld);
            max = BABYLON.Vector3.Maximize(max, bi.boundingBox.maximumWorld);
        });
        var extents = max.subtract(min);
        var maxExtent = Math.max(extents.x, extents.y, extents.z);
        if (maxExtent > 0.01) {
            var scale = targetHeight / maxExtent;
            root.scaling = new BABYLON.Vector3(scale, scale, scale);
        }

        // Shadow casters
        var sg = scene.shadowGenerator;
        if (sg) {
            childMeshes.forEach(function (m) { sg.addShadowCaster(m); });
        }

        // Build animation map by name keywords
        var animMap = { idle: null, walk: null, run: null, attack: null, death: null };
        var groups = instance.animationGroups || [];
        groups.forEach(function (ag) {
            var n = ag.name.toLowerCase();
            if (n.indexOf('idle') !== -1) animMap.idle = ag;
            else if (n.indexOf('walk') !== -1 && !animMap.walk) animMap.walk = ag;
            else if (n.indexOf('run') !== -1 || n.indexOf('gallop') !== -1) animMap.run = ag;
            else if (n.indexOf('attack') !== -1 || n.indexOf('bite') !== -1 || n.indexOf('kick') !== -1) animMap.attack = ag;
            else if (n.indexOf('death') !== -1 || n.indexOf('die') !== -1) animMap.death = ag;
        });
        // Fallback: if no walk, use first non-idle; if no idle, use first
        if (!animMap.walk && groups.length > 1) animMap.walk = groups[1];
        if (!animMap.idle && groups.length > 0) animMap.idle = groups[0];
        if (!animMap.run) animMap.run = animMap.walk;

        // Stop all, play idle
        groups.forEach(function (ag) { ag.stop(); });
        if (animMap.idle) animMap.idle.start(true);

        // Store on root
        root._animMap = animMap;
        root._allAnimGroups = groups;
        root._currentAnim = 'idle';

        return root;
    },

    /* ==========================================
       Switch animation on a mesh root
       ========================================== */
    _playAnim: function (root, animName) {
        if (!root._animMap || root._currentAnim === animName) return;
        var target = root._animMap[animName];
        if (!target) return;
        // Stop all animations
        root._allAnimGroups.forEach(function (ag) { ag.stop(); });
        var loop = (animName !== 'attack' && animName !== 'death');
        target.start(loop);
        root._currentAnim = animName;
    },

    /* ==========================================
       Placeholder mesh (fallback if GLB fails)
       ========================================== */
    _createPlaceholderMesh: function (key, scene) {
        var cfg = JUNGLE.Config.ANIMALS[key];
        var s = cfg.size;
        var col = new BABYLON.Color3(cfg.color[0], cfg.color[1], cfg.color[2]);

        var root = new BABYLON.TransformNode("animal_" + key + "_" + Math.random().toFixed(4), scene);

        var body = BABYLON.MeshBuilder.CreateBox("body", { width: s * 2, height: s, depth: s * 1.2 }, scene);
        body.position.y = s * 0.8;
        body.parent = root;
        var bodyMat = new BABYLON.StandardMaterial("bodyMat_" + key, scene);
        bodyMat.diffuseColor = col;
        body.material = bodyMat;

        var head = BABYLON.MeshBuilder.CreateSphere("head", { diameter: s * 0.8, segments: 8 }, scene);
        head.position.set(s * 1.1, s * 1.1, 0);
        head.parent = root;
        var headMat = new BABYLON.StandardMaterial("headMat_" + key, scene);
        headMat.diffuseColor = col.scale(1.15);
        head.material = headMat;

        var eyeL = BABYLON.MeshBuilder.CreateSphere("eyeL", { diameter: s * 0.15 }, scene);
        eyeL.position.set(s * 1.35, s * 1.25, s * 0.2);
        eyeL.parent = root;
        var eyeMat = new BABYLON.StandardMaterial("eyeMat", scene);
        eyeMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        eyeL.material = eyeMat;
        var eyeR = eyeL.clone("eyeR");
        eyeR.position.z = -s * 0.2;
        eyeR.parent = root;

        var legGeo = { height: s * 0.7, diameter: s * 0.25, tessellation: 6 };
        var legMat = new BABYLON.StandardMaterial("legMat_" + key, scene);
        legMat.diffuseColor = col.scale(0.8);
        var offsets = [
            [s * 0.6, 0, s * 0.4],
            [s * 0.6, 0, -s * 0.4],
            [-s * 0.6, 0, s * 0.4],
            [-s * 0.6, 0, -s * 0.4]
        ];
        offsets.forEach(function (o, idx) {
            var leg = BABYLON.MeshBuilder.CreateCylinder("leg" + idx, legGeo, scene);
            leg.position.set(o[0], s * 0.35, o[2]);
            leg.material = legMat;
            leg.parent = root;
        });

        var tail = BABYLON.MeshBuilder.CreateCylinder("tail", { height: s * 1.2, diameter: s * 0.12, tessellation: 5 }, scene);
        tail.position.set(-s * 1.3, s * 0.9, 0);
        tail.rotation.z = Math.PI / 4;
        tail.material = legMat;
        tail.parent = root;

        var sg = scene.shadowGenerator;
        if (sg) {
            root.getChildMeshes().forEach(function (m) { sg.addShadowCaster(m); });
        }

        return root;
    },

    /* ==========================================
       Player Controller
       ========================================== */
    createPlayer: function (key, scene) {
        var mesh = this.createAnimalMesh(key, scene);
        var cfg = JUNGLE.Config.ANIMALS[key];

        // Spawn position
        var half = JUNGLE.Config.TERRAIN_SIZE / 4;
        mesh.position.set(
            (Math.random() - 0.5) * half,
            0,
            (Math.random() - 0.5) * half
        );

        // Add highlight ring underneath player
        var ring = BABYLON.MeshBuilder.CreateTorus("playerRing", {
            diameter: cfg.size * 3.5, thickness: 0.15, tessellation: 32
        }, scene);
        ring.parent = mesh;
        ring.position.y = 0.1;
        var ringMat = new BABYLON.StandardMaterial("playerRingMat", scene);
        ringMat.emissiveColor = new BABYLON.Color3(0.2, 0.7, 1);
        ringMat.alpha = 0.5;
        ring.material = ringMat;
        ring.isPickable = false;

        var player = {
            mesh: mesh,
            key: key,
            cfg: cfg,
            speed: cfg.speed,
            velocity: new BABYLON.Vector3(0, 0, 0),
            stamina: JUNGLE.Config.STAMINA_MAX,
            isHidden: false,
            hideTimer: 0,
            hideCooldownUntil: 0,
            alive: true
        };

        this.player = player;
        return player;
    },

    /* ==========================================
       Player movement (called each frame)
       ========================================== */
    updatePlayer: function (dt, inputMap, camera, scene) {
        var p = this.player;
        if (!p || !p.alive) return;

        var speed = p.cfg.speed;
        var sprinting = inputMap["ShiftLeft"] || inputMap["ShiftRight"];

        // Stamina management
        if (sprinting && p.stamina > 0) {
            speed *= JUNGLE.Config.SPRINT_MULTIPLIER;
            p.stamina = Math.max(0, p.stamina - JUNGLE.Config.STAMINA_DRAIN * dt);
        } else {
            sprinting = false;
            p.stamina = Math.min(JUNGLE.Config.STAMINA_MAX, p.stamina + JUNGLE.Config.STAMINA_REGEN * dt);
        }

        // Direction from camera
        var camForward = camera.getForwardRay().direction;
        var forward = new BABYLON.Vector3(camForward.x, 0, camForward.z).normalize();
        var right = BABYLON.Vector3.Cross(BABYLON.Axis.Y, forward).normalize();

        var moveDir = BABYLON.Vector3.Zero();
        if (inputMap["ArrowUp"]) moveDir.addInPlace(forward);
        if (inputMap["ArrowDown"]) moveDir.subtractInPlace(forward);
        if (inputMap["ArrowLeft"]) moveDir.subtractInPlace(right);
        if (inputMap["ArrowRight"]) moveDir.addInPlace(right);

        if (moveDir.lengthSquared() > 0.001) {
            moveDir.normalize();
            var targetVel = moveDir.scale(speed);
            // Smooth acceleration
            p.velocity = BABYLON.Vector3.Lerp(p.velocity, targetVel, dt * 8);
            // Rotate to face direction
            var angle = Math.atan2(moveDir.x, moveDir.z);
            var currentY = p.mesh.rotation.y;
            var diff = angle - currentY;
            // Normalise to [-PI, PI]
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            p.mesh.rotation.y += diff * dt * p.cfg.turnSpeed * 3;
            // Un-hide on move
            if (p.isHidden) this.unhidePlayer();
            // Animation: run if sprinting, walk otherwise
            this._playAnim(p.mesh, sprinting ? 'run' : 'walk');
        } else {
            p.velocity = BABYLON.Vector3.Lerp(p.velocity, BABYLON.Vector3.Zero(), dt * 6);
            // Animation: idle when not moving
            if (p.velocity.lengthSquared() < 0.1) {
                this._playAnim(p.mesh, 'idle');
            }
        }

        // Apply velocity
        p.mesh.position.addInPlace(p.velocity.scale(dt));

        // Clamp to terrain
        var half = JUNGLE.Config.TERRAIN_SIZE / 2 - 2;
        p.mesh.position.x = Math.max(-half, Math.min(half, p.mesh.position.x));
        p.mesh.position.z = Math.max(-half, Math.min(half, p.mesh.position.z));

        // Terrain height
        p.mesh.position.y = JUNGLE.Environment.getTerrainHeight(p.mesh.position.x, p.mesh.position.z);

        // Hiding logic timer
        if (p.isHidden) {
            p.hideTimer -= dt;
            if (p.hideTimer <= 0) {
                this.unhidePlayer();
            }
        }
    },

    tryHidePlayer: function () {
        var p = this.player;
        if (!p || p.isHidden) return false;
        var now = performance.now() / 1000;
        if (now < p.hideCooldownUntil) return false;

        var spots = JUNGLE.Environment.hidingSpots;
        for (var i = 0; i < spots.length; i++) {
            var s = spots[i];
            var dx = p.mesh.position.x - s.position.x;
            var dz = p.mesh.position.z - s.position.z;
            if (dx * dx + dz * dz < s.radius * s.radius) {
                p.isHidden = true;
                p.hideTimer = JUNGLE.Config.HIDE_MAX_DURATION;
                document.getElementById('hud-hiding').classList.remove('hidden');
                return true;
            }
        }
        return false;
    },

    unhidePlayer: function () {
        var p = this.player;
        if (!p) return;
        p.isHidden = false;
        p.hideCooldownUntil = performance.now() / 1000 + JUNGLE.Config.HIDE_COOLDOWN;
        document.getElementById('hud-hiding').classList.add('hidden');
    },

    /* ==========================================
       AI Animals
       ========================================== */
    spawnAIAnimals: function (scene, playerMode) {
        var self = this;
        this.aiAnimals = [];
        var half = JUNGLE.Config.TERRAIN_SIZE / 2 - 15;

        // Determine which AI animals to spawn
        var predatorKeys = Object.keys(JUNGLE.Config.ANIMALS).filter(function (k) {
            return JUNGLE.Config.ANIMALS[k].type === 'predator';
        });
        var preyKeys = Object.keys(JUNGLE.Config.ANIMALS).filter(function (k) {
            return JUNGLE.Config.ANIMALS[k].type === 'prey';
        });

        // Spawn predators
        for (var i = 0; i < JUNGLE.Config.NUM_AI_PREDATORS; i++) {
            var pk = predatorKeys[i % predatorKeys.length];
            self.spawnOneAI(pk, 'predator', half, scene);
        }

        // Spawn prey
        for (var j = 0; j < JUNGLE.Config.NUM_AI_PREY; j++) {
            var rk = preyKeys[j % preyKeys.length];
            self.spawnOneAI(rk, 'prey', half, scene);
        }
    },

    spawnOneAI: function (key, role, half, scene) {
        var mesh = this.createAnimalMesh(key, scene);
        var cfg = JUNGLE.Config.ANIMALS[key];
        var x = (Math.random() - 0.5) * 2 * half;
        var z = (Math.random() - 0.5) * 2 * half;

        mesh.position.set(x, 0, z);

        var ai = {
            mesh: mesh,
            key: key,
            cfg: cfg,
            role: role,
            speed: cfg.speed,
            velocity: new BABYLON.Vector3(0, 0, 0),
            wanderAngle: Math.random() * Math.PI * 2,
            state: 'wander',   // wander | chase | flee
            stateTimer: 0,
            alive: true
        };

        this.aiAnimals.push(ai);
    },

    /* ==========================================
       AI Update (steering behaviours)
       ========================================== */
    updateAI: function (dt, playerMode, scene) {
        var self = this;
        var player = this.player;
        if (!player) return;
        var pp = player.mesh.position;

        this.aiAnimals.forEach(function (ai) {
            if (!ai.alive) return;

            var pos = ai.mesh.position;
            var toPlayer = pp.subtract(pos);
            var distToPlayer = toPlayer.length();

            // Determine state based on role vs player mode
            var isPredatorAI = (ai.role === 'predator');
            var detectionRange = JUNGLE.Config.AI_DETECTION_RANGE;

            if (playerMode === 'prey') {
                // AI predators chase the player
                if (isPredatorAI && distToPlayer < detectionRange && !player.isHidden) {
                    ai.state = 'chase';
                } else if (!isPredatorAI && distToPlayer < detectionRange * 0.6) {
                    // AI prey flees from player if it gets close (they're spooked)
                    ai.state = 'flee';
                } else {
                    ai.state = 'wander';
                }
            } else {
                // Player is predator: AI prey flees, AI predators wander or compete
                if (!isPredatorAI && distToPlayer < detectionRange) {
                    ai.state = 'flee';
                } else {
                    ai.state = 'wander';
                }
            }

            // Calculate steering force
            var steer = BABYLON.Vector3.Zero();

            switch (ai.state) {
                case 'chase':
                    steer = self.steerSeek(pos, pp, ai.speed);
                    break;
                case 'flee':
                    steer = self.steerFlee(pos, pp, ai.speed);
                    break;
                default:
                    steer = self.steerWander(ai, dt);
                    break;
            }

            var effectiveSpeed = ai.speed;

            // Apply steering
            steer.y = 0;
            if (steer.lengthSquared() > 0) {
                steer = steer.normalize().scale(effectiveSpeed);
            }
            ai.velocity = BABYLON.Vector3.Lerp(ai.velocity, steer, dt * 4);
            pos.addInPlace(ai.velocity.scale(dt));

            // Clamp to terrain
            var half = JUNGLE.Config.TERRAIN_SIZE / 2 - 2;
            pos.x = Math.max(-half, Math.min(half, pos.x));
            pos.z = Math.max(-half, Math.min(half, pos.z));
            pos.y = JUNGLE.Environment.getTerrainHeight(pos.x, pos.z);

            // Rotate to face velocity
            if (ai.velocity.lengthSquared() > 0.01) {
                var angle = Math.atan2(ai.velocity.x, ai.velocity.z);
                var curY = ai.mesh.rotation.y;
                var diff = angle - curY;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                ai.mesh.rotation.y += diff * dt * ai.cfg.turnSpeed * 2;
            }

            // AI animation: chase/flee → run, wander → walk, stopped → idle
            if (ai.velocity.lengthSquared() > 0.5) {
                var animName = (ai.state === 'chase' || ai.state === 'flee') ? 'run' : 'walk';
                self._playAnim(ai.mesh, animName);
            } else {
                self._playAnim(ai.mesh, 'idle');
            }
        });
    },

    /* ---------- Steering helpers ---------- */
    steerSeek: function (current, target, maxSpeed) {
        var desired = target.subtract(current);
        desired.y = 0;
        if (desired.lengthSquared() < 0.01) return BABYLON.Vector3.Zero();
        return desired.normalize().scale(maxSpeed);
    },

    steerFlee: function (current, threat, maxSpeed) {
        var desired = current.subtract(threat);
        desired.y = 0;
        if (desired.lengthSquared() < 0.01) return BABYLON.Vector3.Zero();
        return desired.normalize().scale(maxSpeed);
    },

    steerWander: function (ai, dt) {
        var jitter = JUNGLE.Config.AI_WANDER_JITTER;
        ai.wanderAngle += (Math.random() - 0.5) * jitter * dt * 10;
        var radius = JUNGLE.Config.AI_WANDER_RADIUS;
        var dist = JUNGLE.Config.AI_WANDER_DISTANCE;

        var forward = new BABYLON.Vector3(
            Math.sin(ai.mesh.rotation.y),
            0,
            Math.cos(ai.mesh.rotation.y)
        );
        var circleCenter = ai.mesh.position.add(forward.scale(dist));
        var offset = new BABYLON.Vector3(
            Math.cos(ai.wanderAngle) * radius,
            0,
            Math.sin(ai.wanderAngle) * radius
        );
        var target = circleCenter.add(offset);
        return this.steerSeek(ai.mesh.position, target, ai.speed);
    },

    /* ---------- Cleanup ---------- */
    dispose: function () {
        if (this.player && this.player.mesh) this.player.mesh.dispose();
        this.aiAnimals.forEach(function (ai) {
            if (ai.mesh) ai.mesh.dispose();
        });
        this.player = null;
        this.aiAnimals = [];
    }
};
