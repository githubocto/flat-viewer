import React from "react";
import { useIsFetching } from "react-query";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import { RepoDetail } from "./components/repo-detail";
import { Home } from "./components/home";
import { useProgressBar } from "./hooks";

function App() {
  const isFetching = useIsFetching();
  useProgressBar(isFetching);

  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/:owner/:name" component={RepoDetail} />
      </Switch>
    </Router>
  );
}

export default App;
