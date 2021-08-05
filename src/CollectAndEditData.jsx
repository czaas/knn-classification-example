import React, { useEffect, useRef, useState } from "react";
import { WebcamPose } from "./Components/WebcamPose";
import { drawPose } from "./utils/drawing";
import { FileUploader } from "@mbkit/file-uploader";
import "./Styles.module.css";

const tempData = {};
export function CollectAndEditData() {
  const mainCanvas = useRef();
  const playbackCanvas = useRef();

  const [dataLabel, setDataLabel] = useState("");
  const [currentKeypoints, setCurrentKeypoints] = useState([]);
  const [allData, setAllData] = useState({});

  function handlePose(keypoints) {
    if (mainCanvas.current) {
      drawPose(keypoints, mainCanvas.current);
      setCurrentKeypoints(keypoints);
    }
  }
  useEffect(() => {
    if (dataLabel) {
      const oldKeypoints = tempData[dataLabel] || [];
      tempData[dataLabel] = [
        ...oldKeypoints,
        {
          poses: {
            keypoints: currentKeypoints,
          },
        },
      ];
    }
  }, [dataLabel, currentKeypoints]);

  function startCollectingData() {
    const _dataLabel = window.prompt("What is the label for this data set?");
    if (_dataLabel?.trim() !== "") {
      setDataLabel(_dataLabel);
    }
  }
  function stopCollectingData() {
    setAllData(tempData);
    setDataLabel("");
  }
  function playBackData(data) {
    let currentIndex = 0;
    playPose();
    function playPose() {
      const currentDataSet = data[currentIndex];
      const keypoints = currentDataSet?.poses?.keypoints;
      if (keypoints) {
        drawPose(keypoints, playbackCanvas.current);
      }
      if (currentIndex <= data.length) {
        currentIndex = currentIndex + 1;
        requestAnimationFrame(playPose);
      } else {
        clearPlaybackCanvas();
      }
    }
  }
  function clearPlaybackCanvas() {
    playbackCanvas.current
      .getContext("2d")
      .clearRect(
        0,
        0,
        playbackCanvas.current.width,
        playbackCanvas.current.height
      );
  }
  function saveData(label, data) {
    const json = JSON.stringify(data, null, 2);
    const a = document.createElement("a");
    const file = new Blob([json], { type: "application/json" });
    a.href = URL.createObjectURL(file);
    a.download = `${label}.poses.json`;
    a.click();
  }
  function deleteData(label) {
    delete tempData[label];
    setAllData(tempData);
  }

  const [isEditing, setIsEditing] = useState(false);
  const [poseBeingEditedLabel, setPoseBeingEditedLabel] = useState("");
  const [posesBeingEditied, setPosesBeingEditied] = useState(null);
  const [currentRange, setCurrentRange] = useState("0");
  function editData(label) {
    setIsEditing(true);
    setPosesBeingEditied([...allData[label]]);
    setPoseBeingEditedLabel(label);
  }
  function onRangeChange(e) {
    setCurrentRange(e.target.value);
    const currentFrame = posesBeingEditied[Number(e.target.value)];
    drawPose(currentFrame.poses.keypoints, playbackCanvas.current);
  }
  function deleteBeforeSelection() {
    const clone = [...posesBeingEditied];
    const cloneTrimmed = clone.slice(Number(currentRange) - 1);
    setPosesBeingEditied(cloneTrimmed);
    setCurrentRange("0");
  }
  function deleteAfterSelection() {
    let clone = [...posesBeingEditied];

    const cloneTrimmed = clone
      .reverse()
      .slice(clone.length - Number(currentRange))
      .reverse();

    setPosesBeingEditied(cloneTrimmed);
    setCurrentRange(`${cloneTrimmed.length - 1}`);
  }

  function handleEditDone() {
    tempData[poseBeingEditedLabel] = posesBeingEditied;
    setAllData(tempData);
    finishEditing();
  }

  function finishEditing() {
    setIsEditing(false);
    setPosesBeingEditied([]);
    setCurrentRange(0);
    setPoseBeingEditedLabel("");
    clearPlaybackCanvas();
  }

  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    console.log(files);
    const jsonFiles = [];
    files.forEach((file) => {
      if (file.type === "application/json") {
        jsonFiles.push(file);
        validateFileData(file);
      }
    });
    const name = jsonFiles
      .map((file, i) => `${file.name}${i === jsonFiles.length - 1 ? "" : ", "}`)
      .join("");
    setFileName(name);
  }
  function validateFileData(file) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        console.log("file name", file.name);
        const jsonString = event.target.result;

        if (file.name.includes("poses")) {
          // uploading already trained model
          console.log("uploading poses");
          // console.log(jsonString);
          const data = JSON.parse(jsonString);
          tempData[`${file.name}${new Date().toISOString()}`] = data;

          setAllData(tempData);
        }
      } catch (e) {
        console.log(e);
        setFileError(e.message);
      }
    };
    reader.readAsText(file);
  }

  return (
    <>
      <FileUploader
        onChange={handleFileUpload}
        value={fileName}
        invalid={fileError}
        multiple
      />
      <button
        onClick={startCollectingData}
        disabled={dataLabel.trim() !== "" || isEditing}
      >
        Record
      </button>
      <button
        onClick={stopCollectingData}
        disabled={dataLabel.trim() === "" || isEditing}
      >
        Stop Recording
      </button>

      {Object.keys(allData).map((label) => (
        <div key={label}>
          <strong>{label}</strong> - Frames: {allData[label].length}
          <br />
          <button
            onClick={() => playBackData(allData[label])}
            disabled={isEditing}
          >
            Playback
          </button>
          <button
            onClick={() => saveData(label, allData[label])}
            disabled={isEditing}
          >
            Save
          </button>
          <button onClick={() => editData(label)} disabled={isEditing}>
            Edit
          </button>
          <button onClick={() => deleteData(label)} disabled={isEditing}>
            Delete
          </button>
          <hr />
        </div>
      ))}

      <div className={`videoCanvasContainer`}>
        <WebcamPose onPose={handlePose} />
        <canvas ref={mainCanvas} width={1280} height={720} />
      </div>
      <canvas ref={playbackCanvas} width={1280} height={720} />

      {isEditing && (
        <>
          Frame {Number(currentRange) + 1} of {posesBeingEditied.length}
          <input
            type="range"
            min="0"
            max={posesBeingEditied ? posesBeingEditied.length - 1 : 1}
            step="1"
            onChange={onRangeChange}
            value={currentRange}
          />{" "}
          <button onClick={deleteBeforeSelection}>
            Delete frames before selection
          </button>
          <button onClick={deleteAfterSelection}>
            Delete frames after selection
          </button>
          <button onClick={finishEditing}>Cancel</button>
          <button onClick={handleEditDone}>Done</button>
        </>
      )}
    </>
  );
}
