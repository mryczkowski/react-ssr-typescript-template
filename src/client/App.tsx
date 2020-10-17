import { hot } from 'react-hot-loader/root';
import React from 'react';
import { Link, Route, Switch } from 'react-router-dom';
import { Helmet } from "react-helmet";

import './App.css';
import Logo from './logo.svg';

export function App() {
    return (
        <div className="App">
            <Switch>
                <Route path="/about">
                    <Helmet>
                        <title>About</title>
                    </Helmet>
                    <h2>About Page</h2>
                    <Link to="/">Home</Link>
                </Route>
                <Route path="/">
                    <Helmet>
                        <title>Home</title>
                    </Helmet>
                    <header className="App-header">
                        <Logo className="App-logo" alt="logo" />
                        <p>
                            React SSR Typescript template
                        </p>
                        <Link to="/about">About</Link>
                    </header>
                </Route>
            </Switch>
        </div>
    );
}

export default hot(App);