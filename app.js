const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
//DELETE register API
app.delete("/register/", async (request, response) => {
  const { username } = request.query;
  const deleteQuery = `DELETE FROM user WHERE username='${username}';`;
  await db.run(deleteQuery);
  console.log("successfully deleted");
});
// POST register API
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  //console.log(hashedPassword);
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
    console.log("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(password, 9);
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      const postQuery = `INSERT INTO 
    user(username,name,password,gender,location)
    VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(postQuery);
      response.status(200);
      response.send("User created successfully");
      console.log("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
      console.log("User already exists");
    }
  }
});

//API 2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbQuery = await db.get(selectUserQuery);
  if (dbQuery === undefined) {
    response.status(400);
    response.send("Invalid user");
    console.log("Invalid user");
  } else {
    const comparePass = await bcrypt.compare(password, dbQuery.password);
    console.log(comparePass);
    if (comparePass === true) {
      response.status(200);
      response.send("Login success!");
      console.log("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
      console.log("Invalid password");
    }
  }
});

//API 3
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getSelectedQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbQuery = await db.get(getSelectedQuery);
  const isPasswordMatch = await bcrypt.compare(oldPassword, dbQuery.password);
  if (isPasswordMatch === false) {
    response.status(400);
    response.send("Invalid current password");
    console.log("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
      console.log("Password is too short");
    } else {
      const updateHashPassword = await bcrypt.hash(newPassword, 8);
      const updateQuery = `UPDATE user SET password='${updateHashPassword}';`;
      await db.run(updateQuery);
      response.status(200);
      response.send("Password updated");
      console.log("Password updated");
    }
  }
});

module.exports = app;
