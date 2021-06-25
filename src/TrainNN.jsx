import React from "react";
import { Link } from "react-router-dom";
import { FileUploader } from "@mbkit/file-uploader";
import { Input } from "@mbkit/input";
import { Label } from "@mbkit/label";
import { Button } from "@mbkit/button";
import { AppContext } from "./app";
import * as tf from "@tensorflow/tfjs";
import "regenerator-runtime/runtime.js";

// returns a 2d tensor
//   part1             part2,...
// [[score0, x0, y0], [score1, x1, y1], ...]
export function convertKeyPointsToArray(pose) {
  const { keypoints } = pose.poses;
  return keypoints.map(({ x, y, score }) => [score, x, y]);
}

export function TrainNeuralNetwork() {
  const { nn, availablePoses, setAvailablePoses } =
    React.useContext(AppContext);
  const [file, setFile] = React.useState();
  const [data, setData] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [classificationLabel, setClassificationLabel] = React.useState("");
  const [training, setTraining] = React.useState(false);

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file && file.type === "application/json") {
      setFile(file);
      setError(null);
      setClassificationLabel("");
    }
  }
  React.useEffect(() => {
    if (file) {
      validateFileData();
    }
  }, [file]);
  function validateFileData() {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonString = event.target.result;
        const json = JSON.parse(jsonString);
        setData(json.map(convertKeyPointsToArray));
      } catch (e) {
        setError(e);
      }
    };
    reader.readAsText(file);
  }

  function handleTrainData() {
    setTraining(true);
    // normalize the data

    console.log(data);
    data.map((pose) => {
      const tensor = tf.tensor(pose);
      nn.addExample(tensor, classificationLabel);
      // console.log(pose);
    });
    const poseAlreadyExists = availablePoses.find(
      (poseLabel) => poseLabel === classificationLabel
    );
    if (!poseAlreadyExists) {
      setAvailablePoses([...availablePoses, classificationLabel]);
    }
    reset();
  }
  function handleTestData() {
    data.map(async (pose) => {
      const tensor = tf.tensor(pose);
      const prediction = await nn.predictClass(tensor);
      console.log(prediction);
    });
    reset();
  }
  function saveDataSet() {
    console.log(nn.getClassifierDataset());
  }
  function reset() {
    setData([]);
    setFile(null);
    setClassificationLabel("");
    setError(null);
    setTraining(false);
  }
  return (
    <>
      <FileUploader
        onChange={handleFileUpload}
        value={file?.name}
        invalid={error}
      />
      {availablePoses.length > 0 && (
        <>
          <ul>
            {availablePoses.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
          <Link to="/webcam">Go test these poses with a webcam</Link>
        </>
      )}
      {error && (
        <>
          <p>There was an error with processing the uploaded data. </p>
          <p>{error.message}</p>
        </>
      )}
      {data.length > 0 && (
        <>
          <p>
            <Label>
              Classification Label
              <Input
                placeholder="What do you want to classify this data as?"
                value={classificationLabel}
                onChange={(e) => setClassificationLabel(e.target.value)}
                disabled={training}
              />
            </Label>
          </p>
          <p>
            <Button
              disabled={classificationLabel.trim() === ""}
              loading={training}
              variant="secondary"
              onClick={handleTrainData}
            >
              Train data
            </Button>
            <Button
              disabled={availablePoses.length === 0}
              loading={training}
              variant="secondary"
              onClick={handleTestData}
            >
              Test data
            </Button>
          </p>
        </>
      )}
      {availablePoses.length > 0 && (
        <Button variant="secondaryOutlined" onClick={saveDataSet}>
          Save
        </Button>
      )}
    </>
  );
}
