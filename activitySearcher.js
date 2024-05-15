const path = require("path");
const fs = require("fs");
const express = require("express"); /* Accessing express module */
const app = express(); /* app is a request handler function */
const bodyParser = require("body-parser"); /* To handle post parameters */
const portNumber = process.env.PORT || 4000;
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = {
  db: process.env.MONGO_DB_NAME,
  collection: process.env.MONGO_COLLECTION,
};
const { MongoClient, ServerApiVersion } = require("mongodb");
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
const axios = require("axios");

// ------------------------------------------------------------------
// INPUT HANDLING
// ------------------------------------------------------------------
if (process.argv.length !== 2) {
  console.error("Usage: summerCampServer.js");
  process.exit(1);
}
app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);
const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.setEncoding("utf8");

process.stdin.on("readable", () => {
  let input = process.stdin.read();
  if (input !== null) {
    input = input.trim().toLowerCase();
    if (input === "stop") {
      console.log("Shutting down the server");
      process.exit(0);
    } else {
      console.log(`Invalid Command: ${input}`);
    }
    process.stdout.write(prompt);
    process.stdin.resume();
  }
});
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// EXPRESS PATHWAYS
// ------------------------------------------------------------------
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response) => {
  response.render("index");
});
// -----------------
app.use(bodyParser.urlencoded({ extended: false }));
app.post("/getCategory", async (request, response) => {
  let newActivity = await getActivity();
  response.render("results", {
    activity: newActivity.activity,
    category: newActivity.type,
  });
});
// -----------------
app.post("/activityList", async (request, response) => {
  const list = {
    name: request.body.name,
    time: request.body.time,
  };
  await insert(list);
  let finalList = await activityList();
  response.render("myList", { activityTable: finalList });
});
// ------------------------------------------------------------------

// ------------------------------------------------------------------
// MANIPULATION OF DATA
// ------------------------------------------------------------------
async function insert(activity) {
  try {
    await client.connect();
    await client
      .db(databaseAndCollection.db)
      .collection(databaseAndCollection.collection)
      .insertOne(activity);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
async function getActivity() {
    try {
        const response = await axios.get('http://www.boredapi.com/api/activity/');
        return response.data;
      } catch (error) {
        console.error('Error:', error);
      }
}
async function activityList() {
  try {
    await client.connect();
    const cursor = client
      .db(databaseAndCollection.db)
      .collection(databaseAndCollection.collection)
      .find();
    const result = await cursor.toArray();
    let start =
      "<table border=1><thead><tr><th>Name</th><th>Time</th></tr></thead><tbody>";
    result.forEach((item) => {
      start = start + `<tr><td>${item.name}</td><td>${item.time}</td></tr>`;
    });
    start = start + "</tbody></table>";
    return start;
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
