import React, { useEffect, useRef } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";

export function WebcamPose(props) {
  const { onPose } = props;
  const detector = useRef();
  const video = useRef();
  useEffect(() => {
    createDetector();
  }, []);
  async function createDetector() {
    const d = await poseDetection.createDetector(
      poseDetection.SupportedModels.BlazePose,
      {
        runtime: "tfjs",
        modelType: "heavy",
      }
    );
    detector.current = d;
    activateWebcam();
  }
  function activateWebcam() {
    // Activate the webcam stream.
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          aspectRatio: 16 / 9,
          width: 1280,
          height: 720,
        },
      })
      .then(function (stream) {
        video.current.srcObject = stream;
        video.current.addEventListener("loadeddata", predictWebcam);
      });
  }

  async function predictWebcam() {
    if (!video.current || !detector.current) {
      return;
    }
    const poses = await detector.current.estimatePoses(video.current);
    const pose = poses[0];
    if (pose) {
      const { score, keypoints } = pose;
      if (score > 0.9) {
        onPose(keypoints);
      }
    }
    setTimeout(() => {
      requestAnimationFrame(predictWebcam);
    }, [100]);
  }
  return (
    <video
      ref={video}
      autoPlay
      muted
      width={1280}
      height={720}
      style={{ transform: "scaleX(-1)" }}
    />
  );
}
