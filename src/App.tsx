import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import { RepoDetail } from "./components/repo-detail";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/:owner/:name" component={RepoDetail} />
      </Switch>
    </Router>
  );
}

export default App;
