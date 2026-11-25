/**
 * HitAyu YogaAI Inference & Pose Classification Engine
 *
 * Integrates with Chakra_yoga's 82-class SVM model (pose_classifier.pkl).
 * Uses a persistent Python worker process so the 13MB SVM model is loaded once
 * and subsequent landmark classifications execute in milliseconds.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

class YogaInferenceService {
  constructor() {
    this.modelPath = path.resolve(__dirname, '../../vendor/Chakra_yoga/pose_classifier.pkl');
    this.poseListPath = path.resolve(__dirname, '../../vendor/Chakra_yoga/pose_list.txt');
    this.poses = [];
    this.isModelAvailable = false;
    this.worker = null;
    this.workerReady = false;
    this.pendingQueue = [];

    this.loadPoseList();
    this.checkModelAvailability();
  }

  loadPoseList() {
    try {
      if (fs.existsSync(this.poseListPath)) {
        const content = fs.readFileSync(this.poseListPath, 'utf8');
        this.poses = content
          .split(/\r?\n/)
          .map((p) => p.trim())
          .filter(Boolean);
        console.log(`[Yoga Inference] Loaded ${this.poses.length} verified poses from Chakra_yoga pose_list.txt`);
      }
    } catch (err) {
      console.warn('[Yoga Inference] Could not read pose_list.txt:', err.message);
    }
  }

  checkModelAvailability() {
    if (fs.existsSync(this.modelPath)) {
      this.isModelAvailable = true;
      console.log('[Yoga Inference] Verified Chakra_yoga pose_classifier.pkl presence.');
    } else {
      console.warn('[Yoga Inference] pose_classifier.pkl not found at expected location.');
    }
  }

  ensureWorker() {
    if (this.worker && !this.worker.killed) return;

    const escapedPath = this.modelPath.replace(/\\/g, '\\\\');
    const workerScript = `
import sys, json, pickle, warnings
warnings.filterwarnings("ignore")
import numpy as np

with open(r"${escapedPath}", "rb") as f:
    model = pickle.load(f)

print(json.dumps({"ready": True}), flush=True)

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        data = json.loads(line)
        features = np.array([data["features"]], dtype=np.float32)
        probs = model.predict_proba(features)[0]
        pred_idx = int(np.argmax(probs))
        pred_conf = float(probs[pred_idx])
        target_idx = data.get("targetPoseIndex")
        target_conf = float(probs[target_idx]) if target_idx is not None and 0 <= target_idx < len(probs) else pred_conf
        print(json.dumps({
            "success": True,
            "predictedIndex": pred_idx,
            "predictedConfidence": round(pred_conf * 100, 1),
            "targetIndex": target_idx,
            "targetConfidence": round(target_conf * 100, 1)
        }), flush=True)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), flush=True)
`;

    this.worker = spawn('python', ['-u', '-c', workerScript], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const rl = readline.createInterface({ input: this.worker.stdout });
    rl.on('line', (line) => {
      try {
        const msg = JSON.parse(line);
        if (msg.ready) {
          this.workerReady = true;
          return;
        }
        const resolver = this.pendingQueue.shift();
        if (resolver) {
          if (msg.success) {
            msg.poseName = this.poses[msg.predictedIndex] || `Pose_${msg.predictedIndex}`;
          }
          resolver(msg);
        }
      } catch {
        // Ignore non-JSON lines
      }
    });

    this.worker.on('exit', () => {
      this.worker = null;
      this.workerReady = false;
      while (this.pendingQueue.length > 0) {
        const r = this.pendingQueue.shift();
        r({ success: false, error: 'Inference worker exited unexpectedly', confidence: 0 });
      }
    });
  }

  /**
   * Run landmark inference using the pre-trained SVM model
   * @param {Array<number>} features - 48 numeric values (16 landmarks * [x, y, z])
   * @param {number} targetPoseIndex - 0 to 81
   */
  async classifyPose(features, targetPoseIndex = null) {
    if (!Array.isArray(features) || features.length !== 48) {
      return {
        success: false,
        error: `Expected 48 feature values (got ${features?.length || 0})`,
        predictedIndex: null,
        poseName: null,
        confidence: 0,
      };
    }

    if (!this.isModelAvailable) {
      return {
        success: false,
        error: 'Chakra_yoga pose_classifier.pkl model file is unavailable.',
        predictedIndex: null,
        poseName: null,
        confidence: 0,
      };
    }

    this.ensureWorker();

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        const idx = this.pendingQueue.indexOf(wrappedResolve);
        if (idx !== -1) this.pendingQueue.splice(idx, 1);
        resolve({ success: false, error: 'Inference timed out', confidence: 0 });
      }, 15000);

      const wrappedResolve = (res) => {
        clearTimeout(timer);
        resolve(res);
      };

      this.pendingQueue.push(wrappedResolve);
      this.worker.stdin.write(JSON.stringify({ features, targetPoseIndex }) + '\n');
    });
  }
}

module.exports = new YogaInferenceService();
