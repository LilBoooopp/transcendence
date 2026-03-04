Eval 1

limits quiry?

Data bas structure : many-to-many

register:
make first validation in front to be sure all the info are given
+ good format for mail and password
In subject: all form must be validated in frontend and backend. 
! mail with @ but no .com like "gbonle@gmail"

node can verify if a mail existw without sending a verification mail


USER:
default image and possibility to change in the settings. 
Automatically save the game?? -> not in our  project?
how to change different things in the same time in settings? (name, photo,...)
! what happens if we enter the same values than the existing one (like same name). Should frontend handle it?
how to look for new friends? 
Add a friend after you play a game with a random player. 

see action react/router form

we can do something in 

access token 10minutes. -> see documentation or good practice

test:
what does happen when the database is down? Does it crash?? Can we refresh?

check if user online: is logout? websocket or last action in db more than 2 minutes?
! not logout when close the browser

Eval 2

all computera on school's network have an associated dns

make up, make down, make dev, make prod

V: Lots of questions about backend, ORM, tables, datastructure, entrée objet

never have player1 and player2 (one-to-many) Not scalable -> many to many. Keep the players info in the match data (like the project we do in school)

Do we save info on DB at the beginning and end of games? -> I think yes in our project. Then it is websockets. 

Can we play without being friend? -> yes, see how to connect (Charlie)

V: Show the API routes. How is it referenced? 

Ok if the password check is a bit light

Loggin with google: !!!! Check what happens if the name + mail is not already used. if not -> DB crashes if it is not well handled.

See payload definition and use

routes defined on fastify (express with nest.js)


V: Can we change the password?

never send back a crypted password

V: Do you keep the old avatars? It is better to remove it
But always keep a base avatar

T
