/* ============================================
   JUNGLE CHASE - Environment Builder
   Creates terrain, river, vegetation, hiding
   spots, bonus items, skybox, lighting, fog.
   ============================================ */
var JUNGLE = JUNGLE || {};

JUNGLE.Environment = {
    river: null,
    riverPath: [],
    hidingSpots: [],
    bonusItems: [],
    trees: [],
    ground: null,

    /* ---------- Master create ---------- */
    create: function (scene) {
        this.createLights(scene);
        this.createSky(scene);
        this.createTerrain(scene);
        this.createRiver(scene);
        this.createVegetation(scene);
        this.createHidingSpots(scene);
        this.createBonusItems(scene);
        this.createFog(scene);
    },

    /* ---------- Sky ---------- */
    createSky: function (scene) {
        var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
        var skyMat = new BABYLON.StandardMaterial("skyMat", scene);
        skyMat.backFaceCulling = false;
        skyMat.disableLighting = true;

        // Procedural gradient via vertex colors
        var positions = skybox.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        var colors = [];
        for (var i = 0; i < positions.length; i += 3) {
            var y = positions[i + 1];
            var t = (y + 500) / 1000; // 0 at bottom, 1 at top
            // Sky gradient: warm horizon → blue top
            var r = 0.45 + (1 - t) * 0.45;
            var g = 0.65 + (1 - t) * 0.2;
            var b = 0.85 + t * 0.1;
            colors.push(r * 0.8, g * 0.85, b, 1);
        }
        skybox.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
        skyMat.emissiveColor = new BABYLON.Color3(1, 1, 1);
        skybox.material = skyMat;
        skybox.infiniteDistance = true;
        skybox.isPickable = false;
    },

    /* ---------- Lights ---------- */
    createLights: function (scene) {
        // Ambient hemisphere
        var hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
        hemi.intensity = 0.55;
        hemi.diffuse = new BABYLON.Color3(1, 0.95, 0.8);
        hemi.groundColor = new BABYLON.Color3(0.15, 0.25, 0.1);

        // Directional sun + shadows
        var sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-1, -2, -1), scene);
        sun.position = new BABYLON.Vector3(50, 80, 50);
        sun.intensity = 0.75;
        sun.diffuse = new BABYLON.Color3(1, 0.92, 0.75);

        var sg = new BABYLON.ShadowGenerator(1024, sun);
        sg.useBlurExponentialShadowMap = true;
        sg.blurKernel = 16;
        scene.shadowGenerator = sg;
    },

    /* ---------- Terrain ---------- */
    createTerrain: function (scene) {
        var S = JUNGLE.Config.TERRAIN_SIZE;
        var ground = BABYLON.MeshBuilder.CreateGround("ground", {
            width: S, height: S,
            subdivisions: JUNGLE.Config.TERRAIN_SUBDIVISIONS,
            updatable: true
        }, scene);

        // Gentle height variation + vertex colours
        var pos = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        var colors = [];
        for (var i = 0; i < pos.length; i += 3) {
            var x = pos[i], z = pos[i + 2];
            var h = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 2
                  + Math.sin(x * 0.09 + z * 0.07) * 0.6;
            pos[i + 1] = h;
            // Green with random variation
            var gr = 0.28 + Math.random() * 0.18;
            colors.push(0.12 + Math.random() * 0.08, gr, 0.04 + Math.random() * 0.04, 1);
        }
        ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, pos);
        ground.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);

        var mat = new BABYLON.StandardMaterial("groundMat", scene);
        mat.diffuseColor = new BABYLON.Color3(0.28, 0.50, 0.13);
        mat.specularColor = new BABYLON.Color3(0.04, 0.04, 0.04);
        ground.material = mat;
        ground.receiveShadows = true;
        ground.checkCollisions = true;

        this.ground = ground;
        scene.ground = ground;
    },

    /* ---------- River ---------- */
    createRiver: function (scene) {
        var half = JUNGLE.Config.TERRAIN_SIZE / 2;
        var pts = [
            new BABYLON.Vector3(-half, 0.25, -25),
            new BABYLON.Vector3(-half * 0.6, 0.25, -8),
            new BABYLON.Vector3(-half * 0.25, 0.25, 18),
            new BABYLON.Vector3(0, 0.25, 4),
            new BABYLON.Vector3(half * 0.3, 0.25, -12),
            new BABYLON.Vector3(half * 0.55, 0.25, 12),
            new BABYLON.Vector3(half * 0.8, 0.25, -4),
            new BABYLON.Vector3(half, 0.25, 18)
        ];
        var spline = BABYLON.Curve3.CreateCatmullRomSpline(pts, 20, false);
        var center = spline.getPoints();
        var w = JUNGLE.Config.RIVER_WIDTH / 2;
        var left = [], right = [];

        for (var i = 0; i < center.length; i++) {
            var p = center[i];
            var tan;
            if (i < center.length - 1) tan = center[i + 1].subtract(p).normalize();
            else tan = p.subtract(center[i - 1]).normalize();
            var perp = new BABYLON.Vector3(-tan.z, 0, tan.x);
            left.push(p.add(perp.scale(w)));
            right.push(p.subtract(perp.scale(w)));
        }

        var river = BABYLON.MeshBuilder.CreateRibbon("river", {
            pathArray: [left, right],
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, scene);

        var wMat = new BABYLON.StandardMaterial("waterMat", scene);
        wMat.diffuseColor = new BABYLON.Color3(0.08, 0.30, 0.58);
        wMat.specularColor = new BABYLON.Color3(0.4, 0.45, 0.55);
        wMat.alpha = 0.72;
        wMat.backFaceCulling = false;
        river.material = wMat;
        river.isPickable = false;

        this.river = river;
        this.riverPath = center;

        // Subtle water shimmer
        var t0 = performance.now();
        scene.registerBeforeRender(function () {
            var t = (performance.now() - t0) * 0.001;
            wMat.diffuseColor.g = 0.30 + Math.sin(t * 1.2) * 0.04;
            wMat.diffuseColor.b = 0.58 + Math.sin(t * 0.8) * 0.06;
        });
    },

    /* ---------- Vegetation (GLB models with procedural fallback) ---------- */
    createVegetation: function (scene) {
        var half = JUNGLE.Config.TERRAIN_SIZE / 2 - 10;
        var sg = scene.shadowGenerator;
        var self = this;

        // ===== TREES (Nature.glb or procedural fallback) =====
        var treeContainer = JUNGLE.Entities._modelContainers["env_tree"];
        var treeGLB = false;

        if (treeContainer) {
            try {
                // Instantiate once to get source meshes
                var treeSource = treeContainer.instantiateModelsToScene(function (name) {
                    return "treeSource_" + name;
                });
                // Collect all meshes with geometry
                var treeMeshes = [];
                treeSource.rootNodes.forEach(function (rn) {
                    rn.getChildMeshes(false).forEach(function (m) {
                        if (m.getTotalVertices() > 0) treeMeshes.push(m);
                    });
                    // Include node itself if it's a mesh
                    if (rn.getTotalVertices && rn.getTotalVertices() > 0) treeMeshes.push(rn);
                });
                if (treeMeshes.length > 0) {
                    var treeMerge = BABYLON.Mesh.MergeMeshes(treeMeshes, true, false, null, false, true);
                    if (treeMerge) {
                        // Auto-scale to ~6 units tall
                        treeMerge.refreshBoundingInfo();
                        var tbi = treeMerge.getBoundingInfo();
                        var th = tbi.boundingBox.maximumWorld.y - tbi.boundingBox.minimumWorld.y;
                        if (th > 0.01) {
                            var tScale = 6 / th;
                            treeMerge.scaling = new BABYLON.Vector3(tScale, tScale, tScale);
                            treeMerge.bakeCurrentTransformIntoVertices();
                        }
                        treeMerge.isVisible = false;
                        if (sg) sg.addShadowCaster(treeMerge);

                        for (var i = 0; i < JUNGLE.Config.NUM_TREES; i++) {
                            var px = (Math.random() - 0.5) * 2 * half;
                            var pz = (Math.random() - 0.5) * 2 * half;
                            if (self.isInRiver(px, pz)) { i--; continue; }
                            var inst = treeMerge.createInstance("tree_" + i);
                            inst.position.set(px, 0, pz);
                            var s = 0.7 + Math.random() * 0.8;
                            inst.scaling.set(s, s + Math.random() * 0.4, s);
                            inst.rotation.y = Math.random() * Math.PI * 2;
                            self.trees.push(inst);
                        }
                        treeGLB = true;
                    }
                }
                // Clean up source nodes that weren't merged
                treeSource.rootNodes.forEach(function (rn) {
                    if (rn && !rn.isDisposed()) rn.dispose(false, true);
                });
            } catch (e) {
                console.warn("Tree GLB failed, using procedural fallback:", e);
            }
        }

        if (!treeGLB) {
            // Procedural tree fallback
            var trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", { height: 5, diameter: 0.6, tessellation: 8 }, scene);
            trunk.position.y = 2.5;
            var trunkMat = new BABYLON.StandardMaterial("trunkMat", scene);
            trunkMat.diffuseColor = new BABYLON.Color3(0.40, 0.26, 0.13);
            trunk.material = trunkMat;
            var canopy = BABYLON.MeshBuilder.CreateSphere("canopy", { diameter: 4.5, segments: 6 }, scene);
            canopy.position.y = 5.5;
            canopy.scaling = new BABYLON.Vector3(1, 0.75, 1);
            var canopyMat = new BABYLON.StandardMaterial("canopyMat", scene);
            canopyMat.diffuseColor = new BABYLON.Color3(0.10, 0.45, 0.08);
            canopy.material = canopyMat;
            var treeMergeFB = BABYLON.Mesh.MergeMeshes([trunk, canopy], true, false, null, false, true);
            treeMergeFB.isVisible = false;
            if (sg) sg.addShadowCaster(treeMergeFB);
            for (var ti = 0; ti < JUNGLE.Config.NUM_TREES; ti++) {
                var tInst = treeMergeFB.createInstance("tree_" + ti);
                var tpx = (Math.random() - 0.5) * 2 * half;
                var tpz = (Math.random() - 0.5) * 2 * half;
                if (self.isInRiver(tpx, tpz)) { ti--; continue; }
                tInst.position.set(tpx, 0, tpz);
                var ts = 0.7 + Math.random() * 0.8;
                tInst.scaling.set(ts, ts + Math.random() * 0.4, ts);
                tInst.rotation.y = Math.random() * Math.PI * 2;
                self.trees.push(tInst);
            }
        }

        // ===== BUSHES (Hedge.glb or procedural fallback) =====
        var bushContainer = JUNGLE.Entities._modelContainers["env_bush"];
        var bushGLB = false;

        if (bushContainer) {
            try {
                var bushSource = bushContainer.instantiateModelsToScene(function (name) {
                    return "bushSource_" + name;
                });
                var bushMeshes = [];
                bushSource.rootNodes.forEach(function (rn) {
                    rn.getChildMeshes(false).forEach(function (m) {
                        if (m.getTotalVertices() > 0) bushMeshes.push(m);
                    });
                    if (rn.getTotalVertices && rn.getTotalVertices() > 0) bushMeshes.push(rn);
                });
                if (bushMeshes.length > 0) {
                    var bushMerge = BABYLON.Mesh.MergeMeshes(bushMeshes, true, false, null, false, true);
                    if (bushMerge) {
                        bushMerge.refreshBoundingInfo();
                        var bbi = bushMerge.getBoundingInfo();
                        var bh = bbi.boundingBox.maximumWorld.y - bbi.boundingBox.minimumWorld.y;
                        if (bh > 0.01) {
                            var bScale = 2 / bh;
                            bushMerge.scaling = new BABYLON.Vector3(bScale, bScale, bScale);
                            bushMerge.bakeCurrentTransformIntoVertices();
                        }
                        bushMerge.isVisible = false;

                        for (var j = 0; j < JUNGLE.Config.NUM_BUSHES; j++) {
                            var bx = (Math.random() - 0.5) * 2 * half;
                            var bz = (Math.random() - 0.5) * 2 * half;
                            if (self.isInRiver(bx, bz)) { j--; continue; }
                            var bi = bushMerge.createInstance("bush_" + j);
                            bi.position.set(bx, 0.2, bz);
                            var bs = 0.8 + Math.random() * 0.6;
                            bi.scaling.set(bs * 1.3, bs * 0.7, bs * 1.3);
                        }
                        bushGLB = true;
                    }
                }
                bushSource.rootNodes.forEach(function (rn) {
                    if (rn && !rn.isDisposed()) rn.dispose(false, true);
                });
            } catch (e) {
                console.warn("Bush GLB failed, using procedural fallback:", e);
            }
        }

        if (!bushGLB) {
            var bushFB = BABYLON.MeshBuilder.CreateSphere("bush", { diameter: 2.2, segments: 5 }, scene);
            bushFB.scaling = new BABYLON.Vector3(1.3, 0.7, 1.3);
            bushFB.position.y = 0.7;
            var bushMatFB = new BABYLON.StandardMaterial("bushMat", scene);
            bushMatFB.diffuseColor = new BABYLON.Color3(0.13, 0.38, 0.08);
            bushFB.material = bushMatFB;
            bushFB.isVisible = false;
            for (var bj = 0; bj < JUNGLE.Config.NUM_BUSHES; bj++) {
                var biFB = bushFB.createInstance("bush_" + bj);
                var bxFB = (Math.random() - 0.5) * 2 * half;
                var bzFB = (Math.random() - 0.5) * 2 * half;
                if (self.isInRiver(bxFB, bzFB)) { bj--; continue; }
                biFB.position.set(bxFB, 0.2, bzFB);
                var bsFB = 0.8 + Math.random() * 0.6;
                biFB.scaling.set(bsFB * 1.3, bsFB * 0.7, bsFB * 1.3);
            }
        }

        // --- Rock template (procedural, no GLB) ---
        var rock = BABYLON.MeshBuilder.CreateSphere("rock", { diameter: 2, segments: 4 }, scene);
        rock.scaling = new BABYLON.Vector3(1.4, 0.6, 1.2);
        rock.position.y = 0.4;
        var rockMat = new BABYLON.StandardMaterial("rockMat", scene);
        rockMat.diffuseColor = new BABYLON.Color3(0.42, 0.40, 0.38);
        rock.material = rockMat;
        rock.isVisible = false;

        for (var k = 0; k < JUNGLE.Config.NUM_ROCKS; k++) {
            var ri = rock.createInstance("rock_" + k);
            var rx = (Math.random() - 0.5) * 2 * half;
            var rz = (Math.random() - 0.5) * 2 * half;
            ri.position.set(rx, 0.2, rz);
            var rs = 0.5 + Math.random() * 1.2;
            ri.scaling.set(rs * 1.4, rs * 0.6, rs * 1.2);
            ri.rotation.y = Math.random() * Math.PI * 2;
        }
    },

    /* ---------- Hiding Spots ---------- */
    createHidingSpots: function (scene) {
        var half = JUNGLE.Config.TERRAIN_SIZE / 2 - 15;
        var spotRadius = 4;

        for (var i = 0; i < JUNGLE.Config.NUM_HIDING_SPOTS; i++) {
            var x = (Math.random() - 0.5) * 2 * half;
            var z = (Math.random() - 0.5) * 2 * half;
            if (this.isInRiver(x, z)) { i--; continue; }

            // Visual: cluster of dark-green bushes + glow ring
            var cluster = BABYLON.MeshBuilder.CreateSphere("hide_bush_" + i, { diameter: 3.5, segments: 5 }, scene);
            cluster.position.set(x, 0.8, z);
            cluster.scaling.set(1.8, 0.9, 1.8);
            var cm = new BABYLON.StandardMaterial("hideMat_" + i, scene);
            cm.diffuseColor = new BABYLON.Color3(0.06, 0.30, 0.04);
            cm.alpha = 0.9;
            cluster.material = cm;

            // Glow ring indicator
            var ring = BABYLON.MeshBuilder.CreateTorus("hideRing_" + i, {
                diameter: spotRadius * 2, thickness: 0.2, tessellation: 32
            }, scene);
            ring.position.set(x, 0.15, z);
            var rm = new BABYLON.StandardMaterial("ringMat_" + i, scene);
            rm.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
            rm.emissiveColor = new BABYLON.Color3(0.1, 0.5, 0.1);
            rm.alpha = 0.4;
            ring.material = rm;
            ring.isPickable = false;

            this.hidingSpots.push({
                position: new BABYLON.Vector3(x, 0, z),
                radius: spotRadius,
                mesh: cluster,
                ring: ring,
                cooldownUntil: 0
            });
        }
    },

    /* ---------- Bonus Items ---------- */
    createBonusItems: function (scene) {
        var half = JUNGLE.Config.TERRAIN_SIZE / 2 - 15;

        var template = BABYLON.MeshBuilder.CreateSphere("bonus", { diameter: 1.2, segments: 8 }, scene);
        var bm = new BABYLON.StandardMaterial("bonusMat", scene);
        bm.diffuseColor = new BABYLON.Color3(1, 0.85, 0.1);
        bm.emissiveColor = new BABYLON.Color3(0.6, 0.5, 0.0);
        template.material = bm;
        template.isVisible = false;

        for (var i = 0; i < JUNGLE.Config.NUM_BONUS_ITEMS; i++) {
            var bx = (Math.random() - 0.5) * 2 * half;
            var bz = (Math.random() - 0.5) * 2 * half;
            if (this.isInRiver(bx, bz)) { i--; continue; }

            var inst = template.createInstance("bonus_" + i);
            inst.position.set(bx, 1.8, bz);

            this.bonusItems.push({
                position: new BABYLON.Vector3(bx, 0, bz),
                mesh: inst,
                collected: false
            });
        }

        // Rotate bonus items
        scene.registerBeforeRender(function () {
            var t = performance.now() * 0.001;
            JUNGLE.Environment.bonusItems.forEach(function (b) {
                if (!b.collected) {
                    b.mesh.rotation.y = t * 2;
                    b.mesh.position.y = 1.8 + Math.sin(t * 3 + b.position.x) * 0.4;
                }
            });
        });
    },

    /* ---------- Fog ---------- */
    createFog: function (scene) {
        scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        scene.fogDensity = 0.006;
        scene.fogColor = new BABYLON.Color3(0.55, 0.7, 0.45);
    },

    /* ---------- Helpers ---------- */
    isInRiver: function (x, z) {
        if (!this.riverPath || this.riverPath.length === 0) return false;
        var w = JUNGLE.Config.RIVER_WIDTH / 2 + 2;
        for (var i = 0; i < this.riverPath.length; i++) {
            var p = this.riverPath[i];
            var dx = x - p.x, dz = z - p.z;
            if (dx * dx + dz * dz < w * w) return true;
        }
        return false;
    },

    getTerrainHeight: function (x, z) {
        // Approximate height from the noise formula used in createTerrain
        return Math.sin(x * 0.04) * Math.cos(z * 0.04) * 2
             + Math.sin(x * 0.09 + z * 0.07) * 0.6;
    },

    isNearRiver: function (x, z, threshold) {
        threshold = threshold || JUNGLE.Config.RIVER_WIDTH;
        if (!this.riverPath || this.riverPath.length === 0) return false;
        for (var i = 0; i < this.riverPath.length; i += 3) {
            var p = this.riverPath[i];
            var dx = x - p.x, dz = z - p.z;
            if (dx * dx + dz * dz < threshold * threshold) return true;
        }
        return false;
    },

    /* ---------- Reset (for replay) ---------- */
    reset: function (scene) {
        // Re-scatter bonus items
        var half = JUNGLE.Config.TERRAIN_SIZE / 2 - 15;
        this.bonusItems.forEach(function (b) {
            b.collected = false;
            b.mesh.isVisible = true;
            b.position.x = (Math.random() - 0.5) * 2 * half;
            b.position.z = (Math.random() - 0.5) * 2 * half;
            b.mesh.position.x = b.position.x;
            b.mesh.position.z = b.position.z;
        });
        this.hidingSpots.forEach(function (h) {
            h.cooldownUntil = 0;
        });
    }
};
