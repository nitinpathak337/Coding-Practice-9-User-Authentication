const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
let dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(4000, () => {
      console.log("Server is Running");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDB();

//Register API

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `select * 
    from user
    where username='${username}';`;
  const selectUser = await db.get(selectUserQuery);
  if (selectUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const insertUserQuery = `
            Insert into
            user values
            ('${username}','${name}','${hashPassword}','${gender}','${location}');`;
      const insertUser = await db.run(insertUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//Login API

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `select * 
        from user
        where username='${username}';`;
  const selectUser = await db.get(selectUserQuery);
  if (selectUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const compPass = await bcrypt.compare(password, selectUser.password);
    if (compPass === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change passsword API

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `select * 
            from user
            where username='${username}';`;
  const selectUser = await db.get(selectUserQuery);
  const compPass = await bcrypt.compare(oldPassword, selectUser.password);
  if (compPass === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
            update user
            set password='${hashPassword}'
            where username='${username}';`;
      const updatePassword = await db.run(updatePasswordQuery);
      response.send("Password updated");
    }
  }
});

module.exports = app;
