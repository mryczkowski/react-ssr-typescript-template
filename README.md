# React-SSR-Typescript-Template
An example of a static app with react server side rendering, and hot reload enabled. Great for marketing sites, but can be easily extended to handle 
API requests and more complex state management as well (eg. Redux).

## Usage

1. Copy `.env.example` as `.env`
2. `npm install`
3. `docker-compose build`
4. `docker-compose up`, and visit [http://localhost:3000](http://localhost:3000) to view it in the browser.
When you right click -> "View Page Source" you should see the server-rendered html.

Alternatively, you can run without docker using this command `npm run dev`

### Running a production build

Run `npm build`, then start the server with `npm start`

## How it works

A lot of the webpack config is influenced or even copied from create-react-app, except it is set up to make bundles for the client and server separately.
A webpack-dev-server is run for the client to allow for hot reloading, and webpack --watch is run to bundle the server. `nodemon` is then run
to serve the static files. When webpack bundles the server code, css and other style imports are ignored, and image or other media files are not written to disk.
If you'd like more details, it's all in the `webpack.config.js`.

The routing is handled with react-router and SEO tags are handled with react-helmet.

**License:** [MIT License](https://opensource.org/licenses/mit-license.php)

