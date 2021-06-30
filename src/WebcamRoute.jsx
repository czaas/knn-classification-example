import React, { useContext, useState } from "react";
import "@tensorflow/tfjs-backend-webgl";
import { AppContext } from "./app";
import { WebcamPose } from "./Components/WebcamPose";
import { convertKeyPointsToArray } from "./TrainNN";
import * as tf from "@tensorflow/tfjs";
import { useRepetition } from "./Components/useRepetition";

export function WebcamRoute() {
  const { nn } = useContext(AppContext);
  const [prediction, setPrediction] = useState("");
  async function handlePose(keypoints) {
    // check that the model has trained classes
    const classCount = nn.getClassExampleCount();
    if (Object.keys(classCount).length < 1) {
      return;
    }

    // then convert the pose to a tensor
    const converted = convertKeyPointsToArray({ poses: { keypoints } });
    const tensor = tf.tensor(converted);
    const prediction = await nn.predictClass(tensor);

    // console.log(prediction);
    if (prediction.confidences[prediction.label] > 0.9) {
      setPrediction(prediction.label);
    }
  }

  const { reps, nextExpectedPose } = useRepetition({
    pose: prediction,
    // poseList: ["standing", "squatting", "standing"],
    poseList: ["pushup", "pushdown", "pushup"],
  });

  return (
    <>
      <ul>
        <li>Current: {prediction}</li>
        <li>Expected: {nextExpectedPose}</li>
        <li>Count: {reps}</li>
      </ul>
      <WebcamPose onPose={handlePose} />
    </>
  );
}
