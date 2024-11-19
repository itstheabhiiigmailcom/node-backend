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

# write user and video models
## npm install mongoose-aggregate-paginate-v2 (to write aggregation queries of mongodb)

## npm i bcrypt (core bcrypt not bycript.js) to hash apssword

## npm i jsonwebtoken ( an open standard used to securely transmit information between two parties, typically used for authentication and authorization in web applications by providing a self-contained, digitally signed token that carries user identity and permissions data, eliminating the need to store session information on the server;)

# add middleware in user model to encrypt password

# adding or injecting some methods in userSchema model like to generateAccessToken to generateRefreshToken and a method isPassowrdCorrect to check whether password entered by user is correct or not