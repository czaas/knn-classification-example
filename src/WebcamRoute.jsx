import React, { useEffect, useRef } from "react";

export function WebcamRoute() {
  const video = useRef();
  useEffect(() => {
    if (video.current) {
      console.log("activating camera");
      activateWebcam();
    }
  }, [video.current]);
  function activateWebcam() {
    video = document.querySelector("video");
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
      .then(function (_stream) {
        stream = _stream;
        video.current.srcObject = _stream;
        video.current.addEventListener("loadeddata", predictWebcam);
      });
  }

  async function predictWebcam() {
    if (!video) {
      return;
    }
    const poses = await detector.estimatePoses(video);
    if (poses && !hasReceivedData) {
      console.log("4. Receiving data");
      hasReceivedData = true;
    }
    const currentDataSets = {
      timeStamp: new Date(),
      poses: poses[0],
    };
    if (collectData) {
      data[currentDataPoint] = [...data[currentDataPoint], currentDataSet];
    }
    drawPose(currentDataSet, canvas);
    animation = requestAnimationFrame(predictWebcam);
  }
  return (
    <>
      <h1>Test Neural Network with Webcam</h1>
      <video ref={video} />
    </>
  );
}
