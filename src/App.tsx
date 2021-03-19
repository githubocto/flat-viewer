import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import { RepoDetail } from "./components/repo-detail";
import { Home } from "./components/home";

function App() {
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
