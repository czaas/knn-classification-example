import React, { createContext, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Route, Switch, Link } from "react-router-dom";
import { TrainNeuralNetwork } from "./TrainNN";
import { WebcamRoute } from "./WebcamRoute";
import * as tf from "@tensorflow/tfjs";
import * as mobilenetModule from "@tensorflow-models/mobilenet";
import * as knnClassifier from "@tensorflow-models/knn-classifier";
import { CollectAndEditData } from "./CollectAndEditData";

export const AppContext = createContext({});

function App() {
  const [availablePoses, setAvailablePoses] = React.useState([]);
  const nn = useMemo(() => {
    const classifier = knnClassifier.create();
    return classifier;
  }, []);

  return (
    <>
      <AppContext.Provider value={{ nn, availablePoses, setAvailablePoses }}>
        <Router>
          <nav style={{ display: "flex", gap: 8 }}>
            <Link to="/">Home</Link>
            <Link to="/collect-data">Collect and edit data</Link>
            <Link to="/train-nn">Train or Upload Neural Network</Link>
            <Link to="/webcam">Test Workouts</Link>
          </nav>

          <Switch>
            <Route exact path="/">
              <h1>Train a Neural Network to classify poses</h1>
            </Route>
            <Route path="/train-nn">
              <TrainNeuralNetwork />
            </Route>
            <Route path="/webcam">
              <WebcamRoute />
            </Route>
            <Route path="/collect-data">
              <CollectAndEditData />
            </Route>
            <Route>
              <h1>Not found</h1>
            </Route>
          </Switch>
        </Router>
      </AppContext.Provider>
    </>
  );
}

ReactDOM.render(<App />, document.querySelector("#mount"));
