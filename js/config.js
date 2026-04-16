/* ============================================
   JUNGLE CHASE - Configuration
   ============================================ */
var JUNGLE = JUNGLE || {};

JUNGLE.Config = {
    // Terrain
    TERRAIN_SIZE: 200,
    TERRAIN_SUBDIVISIONS: 64,

    // River
    RIVER_WIDTH: 14,

    // Game timing & rules
    GAME_DURATION: 180,         // seconds (3 minutes)
    INITIAL_LIVES: 3,
    SPRINT_MULTIPLIER: 1.8,
    STAMINA_MAX: 100,
    STAMINA_DRAIN: 30,          // per second while sprinting
    STAMINA_REGEN: 15,          // per second while not sprinting
    HIDE_MAX_DURATION: 8,       // max seconds in a hiding spot
    HIDE_COOLDOWN: 10,          // seconds before re-hide

    // Scoring
    SCORE_PER_CATCH: 150,
    SCORE_SURVIVE_TICK: 10,     // points every SCORE_TICK_INTERVAL seconds
    SCORE_TICK_INTERVAL: 5,
    SCORE_HIDE_BONUS: 50,
    SCORE_BONUS_PICKUP: 30,

    // Model paths
    MODEL_PATH: "assets/models/",
    ENV_MODEL_PATH: "assets/textures/",
    ENV_MODELS: {
        tree: "Nature.glb",
        bush: "Hedge.glb"
    },

    // Entity counts
    NUM_AI_PREDATORS: 3,
    NUM_AI_PREY: 6,
    NUM_WATER_ANIMALS: 3,

    // Environment counts
    NUM_TREES: 70,
    NUM_BUSHES: 25,
    NUM_ROCKS: 15,
    NUM_HIDING_SPOTS: 10,
    NUM_BONUS_ITEMS: 8,

    // AI behaviour
    AI_DETECTION_RANGE: 35,
    AI_CHASE_RANGE: 50,
    AI_CATCH_DISTANCE: 3.5,
    AI_WANDER_RADIUS: 5,
    AI_WANDER_DISTANCE: 10,
    AI_WANDER_JITTER: 2,

    // Animal catalogue
    ANIMALS: {
        lion: {
            name: "Lion",
            emoji: "🦁",
            type: "predator",
            speed: 5.0,
            turnSpeed: 3.0,
            size: 1.2,
            color: [0.85, 0.65, 0.13],
            model: "Lion.glb",
            description: "Roi de la jungle. Puissant et rapide.",
            strength: 5,
            agility: 3
        },
        tiger: {
            name: "Tigre",
            emoji: "🐅",
            type: "predator",
            speed: 5.5,
            turnSpeed: 3.5,
            size: 1.1,
            color: [0.9, 0.55, 0.1],
            model: "Tiger.glb",
            description: "Féroce et agile. Chasseur silencieux.",
            strength: 4,
            agility: 5
        },
        gazelle: {
            name: "Gazelle",
            emoji: "🦌",
            type: "prey",
            speed: 6.0,
            turnSpeed: 4.0,
            size: 0.8,
            color: [0.76, 0.60, 0.42],
            model: "Stag.glb",
            description: "Rapide et gracieuse. Experte en évasion.",
            strength: 1,
            agility: 5
        },
        zebra: {
            name: "Zèbre",
            emoji: "🦓",
            type: "prey",
            speed: 5.5,
            turnSpeed: 3.5,
            size: 1.0,
            color: [0.95, 0.95, 0.95],
            model: "Zebra.glb",
            description: "Endurant et résistant. Court-il est zébré !",
            strength: 2,
            agility: 4
        },
        crocodile: {
            name: "Crocodile",
            emoji: "🐊",
            type: "water_predator",
            speed: 3.0,
            waterSpeed: 6.0,
            turnSpeed: 2.0,
            size: 1.3,
            color: [0.18, 0.42, 0.14],
            model: "Crocodile.glb",
            description: "Terreur des rivières. Mortel dans l'eau.",
            strength: 5,
            agility: 2
        },
        hippo: {
            name: "Hippopotame",
            emoji: "🦛",
            type: "water",
            speed: 2.5,
            waterSpeed: 4.5,
            turnSpeed: 1.5,
            size: 1.8,
            color: [0.55, 0.47, 0.52],
            model: "Hippopotamus.glb",
            description: "Massif et territorial. Ne pas déranger !",
            strength: 5,
            agility: 1
        }
    }
};

/* ============================================
   UI helpers (menu logic)
   ============================================ */
JUNGLE.UI = {
    selectedMode: "prey",
    selectedAnimal: null,

    selectMode: function (mode) {
        this.selectedMode = mode;
        document.querySelectorAll('.mode-btn').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-mode') === mode);
        });
        this.selectedAnimal = null;
        this.buildAnimalGrid();
        document.getElementById('start-btn').classList.add('disabled');
    },

    selectAnimal: function (key) {
        this.selectedAnimal = key;
        document.querySelectorAll('.animal-card').forEach(function (c) {
            c.classList.toggle('selected', c.getAttribute('data-key') === key);
        });
        document.getElementById('start-btn').classList.remove('disabled');
    },

    buildAnimalGrid: function () {
        var grid = document.getElementById('animal-grid');
        grid.innerHTML = '';
        var animals = JUNGLE.Config.ANIMALS;
        var mode = this.selectedMode;
        var self = this;

        Object.keys(animals).forEach(function (key) {
            var a = animals[key];
            var isPredator = a.type === 'predator' || a.type === 'water_predator';
            var isPrey = a.type === 'prey' || a.type === 'water';
            var available = (mode === 'predator' && isPredator) || (mode === 'prey' && isPrey);

            var card = document.createElement('div');
            card.className = 'animal-card' + (available ? '' : ' disabled');
            card.setAttribute('data-key', key);
            if (available) {
                card.addEventListener('click', function () { self.selectAnimal(key); });
            }

            var badgeClass = isPredator ? 'badge-predator' : (a.type === 'water' ? 'badge-water' : 'badge-prey');
            var typeName = isPredator ? 'Prédateur' : (a.type === 'water' ? 'Aquatique' : 'Proie');

            card.innerHTML =
                '<span class="animal-emoji">' + a.emoji + '</span>' +
                '<div class="animal-name">' + a.name + '</div>' +
                '<span class="animal-type-badge ' + badgeClass + '">' + typeName + '</span>' +
                '<div class="animal-desc">' + a.description + '</div>' +
                '<div class="animal-stats">' +
                    '<div class="stat-row stat-speed"><span class="stat-name">Vitesse</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:' + (a.speed / 7 * 100) + '%"></div></div></div>' +
                    '<div class="stat-row stat-strength"><span class="stat-name">Force</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:' + (a.strength / 5 * 100) + '%"></div></div></div>' +
                    '<div class="stat-row stat-agility"><span class="stat-name">Agilité</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:' + (a.agility / 5 * 100) + '%"></div></div></div>' +
                '</div>';

            grid.appendChild(card);
        });
    }
};
