import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "./app";
import { WebcamPose } from "./Components/WebcamPose";
import { convertKeyPointsToArray } from "./TrainNN";
import * as tf from "@tensorflow/tfjs";
import { useRepetition } from "./Components/useRepetition";
import { Tensorset } from "./Components/Tensornet";
import pushupJson from "./poses/pushups.model.json";
import jumpingJacksJson from "./poses/jumping-jacks.model.json";
import squatsJson from "./poses/squats.model.json";
import "./Styles.module.css";

// what constitues one rep?
const workoutInstructions = {
  ["jumping jacks"]: ["standing", "jumping-jack", "standing"],
  squats: ["standing", "squatting", "standing"],
  pushups: ["pushup", "pushdown", "pushup"],
};

const workoutTitles = Object.keys(workoutInstructions);

export function WebcamRoute() {
  const { nn, availablePoses, setAvailablePoses } = useContext(AppContext);
  const [ready, setReady] = useState(false);

  const [prediction, setPrediction] = useState("");
  async function handlePose(keypoints) {
    // console.log(nn.getClassExampleCount());
    // console.log(nn.getClassifierDataset());
    // check that the model has trained classes
    const classCount = nn.getClassExampleCount();
    if (Object.keys(classCount).length < 1) {
      return;
    }

    // then convert the pose to a tensor
    const converted = convertKeyPointsToArray({ poses: { keypoints } });
    const tensor = tf.tensor(converted);
    const prediction = await nn.predictClass(tensor);
    console.log(prediction);
    if (prediction.confidences[prediction.label] > 0.9) {
      setPrediction(prediction.label);
    }
  }

  const [workoutType, setWorkoutType] = useState(workoutTitles[0]);

  const { reps, nextExpectedPose, reset } = useRepetition({
    pose: prediction,
    poseList: workoutInstructions[workoutType],
  });

  function handleWorkoutChange(e) {
    setWorkoutType(e.target.value);
    reset();
  }

  useEffect(() => {
    if (Object.keys(nn.getClassExampleCount()).length === 0) {
      pretrainNeuralNetwork();
    }
  }, []);
  async function pretrainNeuralNetwork() {
    // Tensornet expects stringified JSON in order to parse it
    const combinedJson = JSON.stringify([
      ...pushupJson,
      ...squatsJson,
      ...jumpingJacksJson,
    ]);

    const combinedSets = await Tensorset.parse(combinedJson);

    const existingDataSet = nn.getClassifierDataset();
    // console.log(existingDataSet, combinedSets);
    const mergedWithExistingDatas = { ...combinedSets, ...existingDataSet };
    // console.log(mergedWithExistingDatas);

    nn.setClassifierDataset(mergedWithExistingDatas);

    const newPoses = [];
    Object.keys(combinedSets).map((key) => {
      if (!availablePoses.includes(key)) {
        newPoses.push(key);
      }
    });
    setAvailablePoses([...availablePoses, ...newPoses]);
  }

  useEffect(() => {
    if (prediction) {
      setReady(true);
    }
  }, [prediction]);

  return (
    <main className="webcamRouteContainer">
      {ready ? (
        <>
          {/* <ul className="exercises">
            <li>Current: {prediction}</li>
            <li>Expected: {nextExpectedPose}</li>
            <li>Count: {reps}</li>
          </ul> */}
          {reps >= 10 ? null : (
            <div className="instruction">Do 10 {workoutType}</div>
          )}
          <div className="repCount" onClick={reset}>
            {reps >= 10 ? "🎉" : reps}
          </div>
          {/* <form>
            {workoutTitles.map((title) => (
              <label key={title}>
                <input
                  type="radio"
                  name="workout"
                  value={title}
                  onChange={handleWorkoutChange}
                  checked={title === workoutType}
                />{" "}
                {title}
              </label>
            ))}
          </form> */}
        </>
      ) : (
        <div className="warmUpIndicator">
          Warming up.
          <br /> Get your whole body in frame.
        </div>
      )}
      <WebcamPose onPose={handlePose} />
    </main>
  );
}
