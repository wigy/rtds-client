import React, { useState } from 'react';
import { client, useDataRead, useLoginStatus, useDataCreation, useDataUpdate, useDataDelete } from 'rtds-client';

/**
 * Page for simulating login.
 */
function LoginPage() {
  return <div>
    <h1>Live Query Example</h1>
    <button onClick={() => client.login({user: 'anything', password: 'pass'}).then(() => (document.location = '/'))}>
      Login
    </button>
  </div>;
}

/**
 * A component rendering todo with a status toggle.
 */
function Todo(props) {
  // A target todo as a prop.
  const { todo } = props;
  // Get hooks for updating or deleting todo.
  const update = useDataUpdate();
  const del = useDataDelete();

  return <li>
    #{todo.id} {todo.title}
    <input type="checkbox"
           checked={todo.done}
           onChange={(e) => update({todos: {id: todo.id, done: e.target.checked ? 1 : 0}})}
    />
    <button onClick={() => del({todos: {id: todo.id}})}>Del</button>
  </li>;
}

/**
 * A page listing all todos.
 */
function TodosPage() {
  // Make a state and automatically query all entries from live query server.
  const [todos, setTodos] = useState([]);
  useDataRead('todos', setTodos);

  // State for editing title and get hook to call entry creation.
  const [title, setTitle] = useState('');
  const create = useDataCreation();

  return <div>
    <input value={title} onChange={(e) => setTitle(e.target.value)}/>
    <button onClick={() => {create({todos: {title}}); setTitle('');}}>Add</button>
    <ul>
      {todos.map(todo => <Todo key={todo.id} todo={todo} />)}
    </ul>
  </div>;
}

/**
 * Simple example application with basic CRUD-operations.
 */
function App() {
  // Configure the client setting the port of the live query server.
  client.configure({port: 2999});
  // If not logged in for socket, show login page.
  const isLoggedIn = useLoginStatus();
  if (!isLoggedIn) {
    return LoginPage();
  }
  // Otherwise show our main page.
  return (
    <div>
      <h1>Live Query Example</h1>
      <TodosPage />
      <br/>
      <button onClick={() => client.logout().then(() => (document.location = '/'))}>Log Out</button>
    </div>
  );
}

export default App;
