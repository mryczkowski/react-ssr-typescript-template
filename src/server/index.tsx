import fs from 'fs';
import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router';
import Helmet from 'react-helmet';
import Mustache from 'mustache';

import { App } from '../client/App';

dotenv.config();

const app: express.Application = express();

// Put before all other routes
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.get('*', (req, res) => {
    const indexFile = path.join(__dirname, 'public/index.html');
    fs.readFile(indexFile, 'utf8', (err, data) => {
        if (err) {
            console.log(err)
            return res.status(500).send('something went wrong')
        }
        
        const context = {};
        const appHtml = ReactDOMServer.renderToString(
            <StaticRouter location={req.url} context={context}>
                <App />
            </StaticRouter>
        );
        const helmet = Helmet.renderStatic();

        const renderedTemplate = Mustache.render(data, {
            extraMetaTags: helmet.meta.toString(),
            extraLinkTags: helmet.link.toString(),
            titleTag: helmet.title.toString(),
            appRoot: appHtml,
        });

        return res.send(renderedTemplate);
    })
});

// Start server
const port = process.env.SERVER_PORT;
app.listen(port, function () {
    console.log(`App listening on port ${port}!`);
});