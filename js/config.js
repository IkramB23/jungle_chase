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
    BONUS_MODEL: "Star Coin.glb",
    ENV_MODEL_PATH: "assets/textures/",
    ENV_MODELS: {
        tree: "Nature.glb",
        bush: "Hedge.glb"
    },

    // Entity counts
    NUM_AI_PREDATORS: 3,
    NUM_AI_PREY: 6,

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
        wolf: {
            name: "Loup",
            emoji: "🐺",
            type: "predator",
            speed: 5.5,
            turnSpeed: 3.5,
            size: 1.5,
            color: [0.45, 0.45, 0.50],
            model: "Wolf.gltf",
            description: "Chasseur en meute. Rapide et rusé.",
            strength: 4,
            agility: 5
        },
        husky: {
            name: "Husky",
            emoji: "🐕",
            type: "predator",
            speed: 5.0,
            turnSpeed: 3.0,
            size: 1.3,
            color: [0.70, 0.70, 0.75],
            model: "Husky.gltf",
            description: "Endurant et tenace. Ne lâche jamais sa proie.",
            strength: 3,
            agility: 4
        },
        fox: {
            name: "Renard",
            emoji: "🦊",
            type: "predator",
            speed: 5.2,
            turnSpeed: 4.0,
            size: 1.2,
            color: [0.90, 0.45, 0.10],
            model: "Fox.gltf",
            description: "Agile et malin. Attaque par surprise.",
            strength: 3,
            agility: 5
        },
        stag: {
            name: "Cerf",
            emoji: "🦌",
            type: "prey",
            speed: 6.0,
            turnSpeed: 4.0,
            size: 1.5,
            color: [0.65, 0.45, 0.25],
            model: "Stag.gltf",
            description: "Majestueux et rapide. Expert en évasion.",
            strength: 2,
            agility: 5
        },
        deer: {
            name: "Biche",
            emoji: "🦌",
            type: "prey",
            speed: 5.8,
            turnSpeed: 4.2,
            size: 1.3,
            color: [0.72, 0.55, 0.35],
            model: "Deer.gltf",
            description: "Gracieuse et vive. Difficile à attraper.",
            strength: 1,
            agility: 5
        },
        horse: {
            name: "Cheval",
            emoji: "🐴",
            type: "prey",
            speed: 6.5,
            turnSpeed: 3.0,
            size: 1.8,
            color: [0.55, 0.35, 0.15],
            model: "Horse.gltf",
            description: "Le plus rapide. Puissant en ligne droite.",
            strength: 3,
            agility: 3
        },
        horse_white: {
            name: "Cheval Blanc",
            emoji: "🐴",
            type: "prey",
            speed: 6.2,
            turnSpeed: 3.2,
            size: 1.8,
            color: [0.95, 0.95, 0.95],
            model: "Horse_White.gltf",
            description: "Élégant et endurant. Galope sans fin.",
            strength: 3,
            agility: 4
        },
        cow: {
            name: "Vache",
            emoji: "🐄",
            type: "prey",
            speed: 4.0,
            turnSpeed: 2.5,
            size: 1.8,
            color: [0.90, 0.88, 0.85],
            model: "Cow.gltf",
            description: "Lente mais résistante. Difficile à abattre.",
            strength: 4,
            agility: 1
        },
        alpaca: {
            name: "Alpaga",
            emoji: "🦙",
            type: "prey",
            speed: 4.5,
            turnSpeed: 3.5,
            size: 1.4,
            color: [0.92, 0.87, 0.78],
            model: "Alpaca.gltf",
            description: "Doux et rusé. Se cache facilement.",
            strength: 1,
            agility: 4
        },
        donkey: {
            name: "Âne",
            emoji: "🫏",
            type: "prey",
            speed: 4.2,
            turnSpeed: 3.0,
            size: 1.5,
            color: [0.55, 0.50, 0.45],
            model: "Donkey.gltf",
            description: "Têtu et endurant. Ne se laisse pas faire.",
            strength: 3,
            agility: 2
        },
        bull: {
            name: "Taureau",
            emoji: "🐂",
            type: "prey",
            speed: 5.0,
            turnSpeed: 2.5,
            size: 2.0,
            color: [0.35, 0.20, 0.10],
            model: "Bull.gltf",
            description: "Puissant et imposant. Charge quand il est en colère.",
            strength: 5,
            agility: 2
        },
        shiba: {
            name: "Shiba Inu",
            emoji: "🐕",
            type: "prey",
            speed: 5.5,
            turnSpeed: 4.5,
            size: 1.1,
            color: [0.90, 0.65, 0.30],
            model: "ShibaInu.gltf",
            description: "Petit mais agile. Esquive tout !",
            strength: 1,
            agility: 5
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
            var isPredator = a.type === 'predator';
            var isPrey = a.type === 'prey';
            var available = (mode === 'predator' && isPredator) || (mode === 'prey' && isPrey);

            var card = document.createElement('div');
            card.className = 'animal-card' + (available ? '' : ' disabled');
            card.setAttribute('data-key', key);
            if (available) {
                card.addEventListener('click', function () { self.selectAnimal(key); });
            }

            var badgeClass = isPredator ? 'badge-predator' : 'badge-prey';
            var typeName = isPredator ? 'Prédateur' : 'Proie';

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
