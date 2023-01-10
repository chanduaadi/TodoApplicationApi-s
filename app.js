const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
// const bcrypt = require("bcrypt");
const app = express();
const isValid = require("date-fns/isValid");

const databasePath = path.join(__dirname, "todoApplication.db");

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const checkDatefun = (dateObj) => {
  const date = new Date(dateObj);
  if (date.getMonth() > 12 && date.getMonth() < 1) {
    return false;
  } else {
    return true;
  }
};

const forDueDate = (dateObj) => {
  return {
    id: dateObj.id,
    todo: dateObj.todo,
    priority: dateObj.priority,
    status: dateObj.status,
    category: dateObj.category,
    dueDate: dateObj.due_date,
  };
};

// API 1 con
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategeryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategeryAndProorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const checkStaus = (status) => {
  return status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE";
};

const checkPrority = (priority) => {
  return priority !== "HIGH" && priority !== "LOW" && priority !== "MEDIUM";
};

const checkCategory = (category) => {
  return category !== "WORK" && category !== "LEARNING" && category !== "HOME";
};

// API 1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      if (checkStaus(status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else if (checkPrority(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      if (checkPrority(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      if (checkStaus(status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      if (checkCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategeryAndStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
        AND status = '${status}';`;
      if (checkCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (checkStaus(status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategeryAndProorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
         AND category = '${category}'
         AND priority = '${priority}';`;
      if (checkCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else if (checkProority(status)) {
        response.status(400);
        response.send("Invalid Todo Proority");
      }
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data.map((eachItem) => forDueDate(eachItem)));
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQueary = `SELECT * FROM todo WHERE id = ${todoId};`;

  const todoList = await database.get(getTodoQueary);
  response.send(forDueDate(todoList));
});
// API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (checkDatefun(date)) {
    const dueDateQuery = `SELECT * FROM todo WHERE due_date = '${date}';`;
    const todoList = await database.all(dueDateQuery);
    response.send(forDueDate(todoList));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const putQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date)
    VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;

  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (checkDatefun(dueDate) !== true) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const inserttodoList = await database.run(putQuery);
    response.send("Todo Successfully Added");
  }
});

// API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQueay = `SELECT * FROM todo WHERE id = ${todoId};`;
  const priviousTodo = await database.get(getTodoQueay);
  const body = request.body;

  let status = priviousTodo.status;
  let priority = priviousTodo.priority;
  let todo = priviousTodo.todo;
  let category = priviousTodo.category;
  let dueDate = priviousTodo.due_date;

  let res;
  if (body.status !== undefined) {
    status = body.status;
    res = "Status Updated";
    if (
      body.status !== "TO DO" &&
      body.status !== "IN PROGRESS" &&
      body.status !== "DONE"
    ) {
      res = "Invalid Todo Status";
      response.status(400);
    }
  } else if (body.priority !== undefined) {
    priority = body.priority;
    res = "Priority Updated";
    if (priority !== "HIGH" && priority !== "MEDIUM" && priority !== "LOW") {
      res = "Invalid Todo Priority";
      response.status(400);
    }
  } else if (body.todo !== undefined) {
    todo = body.todo;
    res = "Todo Updated";
  } else if (body.category !== undefined) {
    category = body.category;
    res = "Category Updated";
    if (category !== "WORK" && category !== "HOME" && category !== "LEARING") {
      res = "Invalid Todo Category";
      response.status(400);
    }
  } else if (body.dueDate !== undefined) {
    dueDate = body.dueDate;
    res = "Due Date Updated";
    if (checkDatefun(dueDate) !== true) {
      response.status(400);
      res = "Invalid Due Date";
    }
  }

  const updateQueary = `
   UPDATE todo 
   SET 
     todo = '${todo}',
     priority = '${priority}',
     status = '${status}',
     category = '${category}',
     due_date = '${dueDate}'
    WHERE  id = ${todoId};
   `;

  await database.run(updateQueary);
  response.send(res);
});

// API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  const delTodo = await database.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
