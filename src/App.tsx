import React from "react";
import { useIsFetching } from "react-query";
import { HeadProvider, Title } from "react-head";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import { RepoDetail } from "./components/repo-detail";
import { Home } from "./components/home";
import { useProgressBar } from "./hooks";

function App() {
  const isFetching = useIsFetching();
  useProgressBar(isFetching);

  return (
    <HeadProvider>
      <Title>Flat</Title>
      <Router>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/:owner/:name" component={RepoDetail} />
        </Switch>
      </Router>
    </HeadProvider>
  );
}

export default App;
