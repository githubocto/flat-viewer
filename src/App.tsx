import React from "react";
import { useIsFetching } from "react-query";
import { HeadProvider, Title } from "react-head";
import { QueryParamProvider } from "use-query-params";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import { RepoDetail } from "./components/repo-detail";
import { OrgListing } from "./components/org-listing";
import { Home } from "./components/home";
import { useProgressBar } from "./hooks";

function App() {
  const isFetching = useIsFetching();
  useProgressBar(isFetching);

  return (
    <HeadProvider>
      <Title>Flat-View</Title>
      <Router>
        <QueryParamProvider ReactRouterRoute={Route}>
          <Switch>
            <Route exact path="/" component={Home} />
            <Route exact path="/:org/" component={OrgListing} />
            <Route path="/:owner/:name" component={RepoDetail} />
          </Switch>
        </QueryParamProvider>
      </Router>
    </HeadProvider>
  );
}

export default App;
