/* ============================================
   JUNGLE CHASE - Main Entry Point
   Engine, scene, camera, render loop,
   input handling, screen transitions.
   ============================================ */
var JUNGLE = JUNGLE || {};

JUNGLE.Main = {
    engine: null,
    scene: null,
    camera: null,
    inputMap: {},

    /* ---------- Boot ---------- */
    init: function () {
        var canvas = document.getElementById('renderCanvas');
        var engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
        this.engine = engine;

        // Create scene & environment (done once, reused)
        var scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.35, 0.55, 0.3, 1);
        scene.collisionsEnabled = true;
        this.scene = scene;

        // Camera
        var camera = new BABYLON.ArcRotateCamera("cam",
            -Math.PI / 2, Math.PI / 3.2, 30,
            new BABYLON.Vector3(0, 0, 0), scene);
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 60;
        camera.lowerBetaLimit = 0.3;
        camera.upperBetaLimit = Math.PI / 2.2;
        camera.wheelPrecision = 15;
        camera.panningSensibility = 0;
        camera.attachControl(canvas, true);
        this.camera = camera;

        // Build the environment
        JUNGLE.Environment.create(scene);

        // Input
        this.setupInput(scene);

        // Render loop
        var self = this;
        var lastTime = performance.now();
        engine.runRenderLoop(function () {
            var now = performance.now();
            var dt = Math.min((now - lastTime) / 1000, 0.1); // Cap delta
            lastTime = now;

            if (JUNGLE.Game.state === 'playing') {
                JUNGLE.Game.update(dt, self.inputMap, self.camera, scene);

                // Camera follows player
                if (JUNGLE.Entities.player) {
                    var target = JUNGLE.Entities.player.mesh.position;
                    self.camera.target = BABYLON.Vector3.Lerp(
                        self.camera.target, target, dt * 5
                    );
                }
            }

            scene.render();
        });

        // Resize
        window.addEventListener('resize', function () { engine.resize(); });

        // Loading complete → show menu
        this.finishLoading();
    },

    /* ---------- Input ---------- */
    setupInput: function (scene) {
        var self = this;
        scene.actionManager = new BABYLON.ActionManager(scene);

        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
                self.inputMap[evt.sourceEvent.code] = true;
            }
        ));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
                self.inputMap[evt.sourceEvent.code] = false;

                // Escape → pause
                if (evt.sourceEvent.code === 'Escape') {
                    JUNGLE.Game.togglePause();
                }
            }
        ));
    },

    /* ---------- Loading → Menu transition (preloads GLB models) ---------- */
    finishLoading: function () {
        var fill = document.getElementById('loader-fill');
        var loaderText = document.querySelector('.loader-text');
        var self = this;

        fill.style.width = '10%';
        loaderText.textContent = 'Chargement des modèles 3D...';

        JUNGLE.Entities.preloadModels(this.scene,
            function (progress) {
                var pct = 10 + progress * 80;
                fill.style.width = pct + '%';
                loaderText.textContent = 'Chargement des modèles 3D... ' + Math.round(pct) + '%';
            },
            function () {
                fill.style.width = '100%';
                loaderText.textContent = 'Prêt !';
                setTimeout(function () {
                    document.getElementById('loading-screen').classList.add('hidden');
                    document.getElementById('main-menu').classList.remove('hidden');
                    JUNGLE.UI.buildAnimalGrid();
                }, 400);
            }
        );
    },

    /* ---------- Start game ---------- */
    startGame: function () {
        var mode = JUNGLE.UI.selectedMode;
        var animalKey = JUNGLE.UI.selectedAnimal;
        if (!animalKey) return;

        // Clean up previous entities if any
        JUNGLE.Entities.dispose();

        // Lock pointer for better camera control
        var canvas = document.getElementById('renderCanvas');
        canvas.focus();

        JUNGLE.Game.start(mode, animalKey, this.scene);
    },

    /* ---------- Restart ---------- */
    restartGame: function () {
        JUNGLE.Entities.dispose();
        document.getElementById('game-over').classList.add('hidden');
        JUNGLE.Game.start(JUNGLE.Game.mode, JUNGLE.UI.selectedAnimal, this.scene);
    },

    /* ---------- Back to menu ---------- */
    goToMenu: function () {
        JUNGLE.Game.state = 'menu';
        JUNGLE.Entities.dispose();
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        JUNGLE.UI.selectedAnimal = null;
        JUNGLE.UI.buildAnimalGrid();
        document.getElementById('start-btn').classList.add('disabled');
        // Reset camera
        this.camera.target = BABYLON.Vector3.Zero();
    }
};

/* ---------- Auto-start on DOM ready ---------- */
window.addEventListener('DOMContentLoaded', function () {
    JUNGLE.Main.init();
});
