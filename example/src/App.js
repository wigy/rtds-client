import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Link, useHistory } from "react-router-dom";
import { client, useDataRead, useLoginStatus, useDataCreation, useDataUpdate, useDataDelete } from 'rtds-client';

function LoginPage() {
  const history = useHistory();
  return <div>
    <button onClick={
      () => client.login({user: 'anything', password: 'pass'})
            .then(() => history.push('/'))}>
      Login
    </button>
  </div>;
}

function TodosPage() {
  const [todos, setTodos] = useState([]);
  useDataRead('todos', setTodos);
  console.log(todos);
  return <div>
    <input /><button>Add</button>
  </div>;
}

function App() {
  client.configure({port: 2999});
  const isLoggedIn = useLoginStatus();
  if (!isLoggedIn) {
    return LoginPage();
  }

  return (
    <div>
      <Router>
        <Link to="/">Home</Link>
        <hr />
        <Switch>
          <Route path="/" component={TodosPage} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
