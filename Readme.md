# backend with chai  aur code youtube playlist

## npm init
# create public folder and temp folder inside it

## npm i -D nodemon 
# in script add dev: "nodemon src/index.js"

# add type: "module" to use import instead of require

## install prettier (npm i -D prettier) and create a file .prettierrc which contains configuration of prettier     (not important)

# create all folders inside src (controllers, db, middlewares, models, routes, utils) and create index.js, constants.js, app.js(for express)

## npm i mongoose express dotenv

# establish database connection in db folder and import it into main index.js

# initialize express in app.js and listen in index.js

## install cookie-parser cors(cross origin resource sharing)

# utils code (add ApiError, ApiResponse code for standardisation) and also create asyncHandler higher order fun to handle all async function, it basically gives wrapper of error handling over existing asyn fun.