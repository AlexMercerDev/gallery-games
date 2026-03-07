import * as THREE from 'three';

export class RollEngine {
    constructor() {
        this.score = 0;
        this.isRunning = false;
        this.isGameOver = false;

        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x100020); // Deep purple void
        this.scene.fog = new THREE.FogExp2(0x100020, 0.02);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 8, 12);
        this.camera.lookAt(0, 0, -5);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(-10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);

        // Player (Puff Sphere)
        this.playerRadius = 1;
        const geometry = new THREE.SphereGeometry(this.playerRadius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00FFFF,
            roughness: 0.1,
            metalness: 0.2,
            emissive: 0x002222
        });
        this.player = new THREE.Mesh(geometry, material);
        this.player.castShadow = true;
        this.player.position.set(0, 5, 0);
        this.scene.add(this.player);

        // Face 
        const eyeGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        this.eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        this.player.add(this.eyeL);
        this.player.add(this.eyeR);
        this.eyeL.position.set(-0.35, 0.2, 0.85);
        this.eyeR.position.set(0.35, 0.2, 0.85);

        // Physics State
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.gravity = -0.015;
        this.friction = 0.98;
        this.speed = 0.04;
        this.maxSpeed = 0.8;
        this.inputVector = { x: 0, y: 0 }; // From joystick

        // Level
        this.platforms = [];
        this.obstacles = []; // { mesh, type }
        this.collectibles = []; // { mesh, active }
        this.nextZ = 0;
        this.createStartPlatform();

        // Input
        this.keys = { ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, w: false, a: false, s: false, d: false };
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        window.addEventListener('resize', () => this.resize());

        this.lastTime = 0;
        this.clock = new THREE.Clock();
    }

    setJoystick(x, y) {
        this.inputVector.x = x;
        this.inputVector.y = y;
    }

    createStartPlatform() {
        const geometry = new THREE.BoxGeometry(10, 1, 40);
        const material = new THREE.MeshStandardMaterial({
            color: 0xFF00FF,
            roughness: 0.5,
            emissive: 0x220022
        });
        const platform = new THREE.Mesh(geometry, material);
        platform.receiveShadow = true;
        platform.position.set(0, -0.5, 0); // Center at 0, extend -20 to +20
        this.scene.add(platform);
        this.platforms.push({ mesh: platform, width: 10, length: 40, z: 0 });

        this.nextZ = -20; // Next segment starts at -20

        // Generate initial path
        for (let i = 0; i < 10; i++) {
            this.addPlatformSegment();
        }
    }

    addPlatformSegment() {
        const width = 6 + Math.random() * 6;
        const length = 15 + Math.random() * 15;
        const gap = 2 + Math.random() * 3;

        // Offset X slightly for winding path
        const prevX = this.platforms.length > 0 ? this.platforms[this.platforms.length - 1].mesh.position.x : 0;
        let xOffset = prevX + (Math.random() - 0.5) * 8;
        // Clamp X
        if (xOffset > 15) xOffset = 15;
        if (xOffset < -15) xOffset = -15;

        this.nextZ -= (gap + length / 2); // Move center forward

        const geometry = new THREE.BoxGeometry(width, 1, length);
        const material = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? 0x00FFFF : 0xFF00FF,
            roughness: 0.4
        });

        const platform = new THREE.Mesh(geometry, material);
        platform.position.set(xOffset, -0.5, this.nextZ);
        platform.receiveShadow = true;
        this.scene.add(platform);
        this.platforms.push({ mesh: platform, width: width, length: length, z: this.nextZ });

        // Add Obstacles?
        if (Math.random() > 0.3) {
            const obsType = Math.random();
            if (obsType > 0.5) {
                // Static Block
                const obsGeo = new THREE.BoxGeometry(2, 2, 2);
                const obsMat = new THREE.MeshStandardMaterial({ color: 0xFF0000, roughness: 0.4 });
                const obs = new THREE.Mesh(obsGeo, obsMat);
                obs.position.set(xOffset + (Math.random() - 0.5) * width * 0.5, 1, this.nextZ);
                obs.castShadow = true;
                this.scene.add(obs);
                this.obstacles.push({ mesh: obs, type: 'block' });
            } else {
                // Collectible
                const gemGeo = new THREE.OctahedronGeometry(0.8);
                const gemMat = new THREE.MeshStandardMaterial({
                    color: 0x00FF00, emissive: 0x00AA00,
                    metalness: 0.8, roughness: 0
                });
                const gem = new THREE.Mesh(gemGeo, gemMat);
                gem.position.set(xOffset + (Math.random() - 0.5) * width * 0.8, 1.5, this.nextZ);
                this.scene.add(gem);
                this.collectibles.push({ mesh: gem, active: true });
            }
        }

        this.nextZ -= length / 2; // Prepare for next
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.clock.start();
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this.animate());

        const dt = Math.min(this.clock.getDelta(), 0.1);
        this.update(dt);
        this.renderer.render(this.scene, this.camera);
    }

    update(dt) {
        if (this.isGameOver) return;

        // Input Forces
        let inputX = 0;
        let inputZ = 0;

        if (this.keys['ArrowUp'] || this.keys['w']) inputZ -= 1;
        if (this.keys['ArrowDown'] || this.keys['s']) inputZ += 1;
        if (this.keys['ArrowLeft'] || this.keys['a']) inputX -= 1;
        if (this.keys['ArrowRight'] || this.keys['d']) inputX += 1;

        // Joystick Override
        if (this.inputVector.x !== 0 || this.inputVector.y !== 0) {
            inputX = this.inputVector.x;
            inputZ = this.inputVector.y;
        }

        this.velocity.z += inputZ * this.speed;
        this.velocity.x += inputX * this.speed;

        // Apply Physics
        this.velocity.y += this.gravity;
        this.velocity.x *= this.friction;
        this.velocity.z *= this.friction;

        // Clamp horizontal speed
        const hSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.z ** 2);
        if (hSpeed > this.maxSpeed) {
            const ratio = this.maxSpeed / hSpeed;
            this.velocity.x *= ratio;
            this.velocity.z *= ratio;
        }

        // Potential New Position
        const nextPos = this.player.position.clone().add(this.velocity);

        // Ground Collision
        let onGround = false;
        let groundLevel = -1000;

        // Simple AABB check against platforms
        // Since platforms are boxes centered at (x, -0.5, z) with (width, 1, length)
        // Top surface is at y = 0.
        // Check if player is above a platform

        for (let p of this.platforms) {
            const minX = p.mesh.position.x - p.width / 2;
            const maxX = p.mesh.position.x + p.width / 2;
            const minZ = p.mesh.position.z - p.length / 2;
            const maxZ = p.mesh.position.z + p.length / 2;

            if (nextPos.x > minX - this.playerRadius * 0.5 && nextPos.x < maxX + this.playerRadius * 0.5 &&
                nextPos.z > minZ - this.playerRadius * 0.5 && nextPos.z < maxZ + this.playerRadius * 0.5) {

                // We are horizontally within this platform bounds
                if (this.player.position.y >= 0 && nextPos.y <= this.playerRadius) {
                    onGround = true;
                    this.velocity.y = 0;
                    this.player.position.y = this.playerRadius; // Snap to surface
                    nextPos.y = this.playerRadius;
                }
            }
        }

        if (!onGround && this.player.position.y <= this.playerRadius) {
            // Falling
        } else if (onGround) {
            // Rolling rotation
            // Rotate around axis perpendicular to velocity
            // Axis = Velocity x Up (0,1,0)
            const axis = new THREE.Vector3(this.velocity.z, 0, -this.velocity.x).normalize();
            const angle = hSpeed / this.playerRadius;
            this.player.rotateOnWorldAxis(axis, angle);
        }

        // Object Collisions (Obstacles & Collectibles)
        const pBox = new THREE.Box3().setFromObject(this.player);

        // Collectibles
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const c = this.collectibles[i];
            if (!c.active) continue;
            c.mesh.rotation.y += dt;
            const cBox = new THREE.Box3().setFromObject(c.mesh);
            if (pBox.intersectsBox(cBox)) {
                this.score += 50; // Bonus
                document.getElementById('score').innerText = this.score;
                this.scene.remove(c.mesh);
                this.collectibles.splice(i, 1);
            }
        }

        // Obstacles
        for (let obs of this.obstacles) {
            const oBox = new THREE.Box3().setFromObject(obs.mesh);
            if (pBox.intersectsBox(oBox)) {
                // Hit obstacle -> Bounce back or Die?
                // Let's bounce hard
                const dx = this.player.position.x - obs.mesh.position.x;
                const dz = this.player.position.z - obs.mesh.position.z;
                this.velocity.x = Math.sign(dx) * 0.5;
                this.velocity.z = Math.sign(dz) * 0.5;
                this.velocity.y = 0.2; // Pop up
            }
        }

        this.player.position.copy(nextPos);

        // Camera Follow
        const targetCamZ = this.player.position.z + 12;
        const targetCamX = this.player.position.x;

        this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.1;
        this.camera.position.x += (targetCamX - this.camera.position.x) * 0.05;
        this.camera.lookAt(targetCamX, 0, this.player.position.z - 5);

        // Score
        const distance = -this.player.position.z;
        if (distance > this.score) {
            this.score = Math.floor(distance);
            document.getElementById('score').innerText = this.score;

            // Generate more road
            if (this.platforms.length > 0 && this.platforms[this.platforms.length - 1].z > this.player.position.z - 100) {
                this.addPlatformSegment();

                // Cleanup old
                if (this.platforms.length > 20) {
                    const old = this.platforms.shift();
                    this.scene.remove(old.mesh);
                    // Remove old obstacles/collectibles too? (Optimization todo)
                }
            }
        }

        // Game Over
        if (this.player.position.y < -10) {
            this.isGameOver = true;
            document.getElementById('game-over').style.display = 'block';
            document.getElementById('final-score').innerText = 'Score: ' + this.score;
        }
    }
}
