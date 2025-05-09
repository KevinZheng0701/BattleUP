"use client";

import { useEffect, useRef } from "react";
import "@tensorflow/tfjs-backend-webgl";
import { setBackend, ready, getBackend } from "@tensorflow/tfjs-core";
import {
  createDetector,
  SupportedModels,
  movenet,
  PoseDetector,
  Keypoint,
} from "@tensorflow-models/pose-detection";

type PushUpCounterProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  gameState: "waiting" | "counting" | "playing" | "ended";
  onPushUpDetected: () => void;
};

export default function PushUpCounter({
  videoRef,
  gameState,
  onPushUpDetected,
}: PushUpCounterProps) {
  const isMountedRef = useRef<boolean>(true); // Close the detection if the component unmounts
  const canvasRef = useRef<HTMLCanvasElement | null>(null); // Canvas for showing the joints
  const detectorRef = useRef<PoseDetector | null>(null); // Reference the pose detector
  const pushUpRef = useRef<"up" | "down">("up");
  const gameStateRef = useRef<"waiting" | "counting" | "playing" | "ended">(
    gameState,
  ); // Game state

  const downThreshold = 90;
  const upThreshold = 160;

  useEffect(() => {
    gameStateRef.current = gameState; // Ensure game state is updated
    // Start detecting poses when the game starts playing
    if (gameStateRef.current === "playing") requestAnimationFrame(detectPose);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    // Load the model with webgl backend
    async function loadModel() {
      if (getBackend() !== "webgl") {
        await setBackend("webgl");
        await ready();
      }

      const detector = await createDetector(SupportedModels.MoveNet, {
        modelType: movenet.modelType.SINGLEPOSE_LIGHTNING,
      });
      detectorRef.current = detector;
    }

    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectPose = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const detector = detectorRef.current;

    if (!isMountedRef.current || !video || !canvas || !ctx || !detector) return;

    // Stop the model once the component unmounts or the game ends
    if (gameStateRef.current !== "playing") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    requestAnimationFrame(detectPose); // Schedule for the next frame

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const poses = await detector.estimatePoses(video);
    if (!poses.length) return;

    const keypoints = poses[0].keypoints;

    const get = (name: string) =>
      keypoints.find((k) => k.name === name && k.score && k.score > 0.5);

    const lS = get("left_shoulder");
    const lE = get("left_elbow");
    const lW = get("left_wrist");
    const rS = get("right_shoulder");
    const rE = get("right_elbow");
    const rW = get("right_wrist");

    if (lS && lE && lW && rS && rE && rW) {
      const leftAngle = calculateAngle(lS, lE, lW);
      const rightAngle = calculateAngle(rS, rE, rW);
      const minAngle = Math.min(leftAngle, rightAngle);

      if (pushUpRef.current === "up" && minAngle < downThreshold) {
        pushUpRef.current = "down";
      }

      if (pushUpRef.current === "down" && minAngle > upThreshold) {
        pushUpRef.current = "up";
        onPushUpDetected();
      }
    }

    drawKeypoints(ctx, keypoints);
  };

  // Use math to find the angle of the 3 points
  const calculateAngle = (A: Keypoint, B: Keypoint, C: Keypoint): number => {
    const AB = { x: A.x! - B.x!, y: A.y! - B.y! };
    const CB = { x: C.x! - B.x!, y: C.y! - B.y! };
    const dot = AB.x * CB.x + AB.y * CB.y;
    const magAB = Math.hypot(AB.x, AB.y);
    const magCB = Math.hypot(CB.x, CB.y);
    return (Math.acos(dot / (magAB * magCB)) * 180) / Math.PI;
  };

  // Draw the keypoints on the canvas
  const drawKeypoints = (
    ctx: CanvasRenderingContext2D,
    keypoints: Keypoint[],
  ) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = video.getBoundingClientRect();
    const scaleX = rect.width / video.videoWidth;
    const scaleY = rect.height / video.videoHeight;
    keypoints.forEach((kp) => {
      if (kp.score && kp.score > 0.5) {
        const x = kp.x! * scaleX;
        const y = kp.y! * scaleY;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      }
    });
  };

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute top-0 left-0 z-1"
    />
  );
}
