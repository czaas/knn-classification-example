import React, { useContext, useEffect, useRef, useState } from "react";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import { convertKeyPointsToArray } from "./TrainNN";
import { AppContext } from "./app";

export function WebcamRoute() {
  const { nn } = useContext(AppContext);
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
        // inputResolution: {
        //   width: 1280,
        //   height: 720,
        // },
      }
    );
    console.log("detector created");
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
    // console.log(video.current);
    const poses = await detector.current.estimatePoses(video.current);
    // const currentDataSets = {
    //   timeStamp: new Date(),
    //   poses: poses[0],
    // };
    // drawPose(currentDataSet, canvas);
    // console.log(poses[0]);
    const pose = poses[0];
    if (pose) {
      classifiyPose(poses[0]);
    }
    setTimeout(() => {
      requestAnimationFrame(predictWebcam);
    }, [100]);
  }
  const [prediction, setPrediction] = useState("");
  async function classifiyPose(pose) {
    const classCount = nn.getClassExampleCount();
    if (classCount > 0) {
      return;
    }
    // console.log(pose);
    const { score, keypoints } = pose;
    if (score > 0.9) {
      const converted = convertKeyPointsToArray({ poses: { keypoints } });
      const tensor = tf.tensor(converted);
      const prediction = await nn.predictClass(tensor);
      console.log(prediction);
      if (prediction.confidences[prediction.label] > 0.9) {
        setPrediction(prediction.label);
        return;
      }
    }
    // setPrediction("");
  }
  const [count, setCount] = useState(0);
  const [lastPrediction, setLastPrediction] = useState("");
  useEffect(() => {
    if (lastPrediction === "squatting" && prediction === "standing") {
      setCount(count + 1);
      setLastPrediction(prediction);
    } else {
      setLastPrediction(prediction);
    }
  }, [prediction]);
  return (
    <>
      <h1>
        {prediction} {count}
      </h1>
      <video
        ref={video}
        autoPlay
        muted
        width={1280}
        height={720}
        style={{ transform: "scaleX(-1)" }}
      />
    </>
  );
}
