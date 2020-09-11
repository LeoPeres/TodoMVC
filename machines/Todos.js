import { Machine, assign, spawn } from "xstate";
import { todoMachine } from "./Todo";
import uuid from "uuid-v4";

const apiURL = process.env.VERCEL_URL + "/api/todos";

async function fetchTodos() {
  const todos = await fetch(apiURL);
  return todos.json();
}

export const persistTodo = (todo) =>
  new Promise(async (resolve, reject) => {
    const persistedTodo = await fetch(apiURL, {
      method: "post",
      body: JSON.stringify(todo),
    });
    if (persistedTodo.status === 200) {
      resolve();
    } else {
      reject();
    }
  });

const persistDeleteTodo = (todo) =>
  new Promise(async (resolve, reject) => {
    const persistedTodo = await fetch(apiURL, {
      method: "delete",
      body: JSON.stringify(todo),
    });
    if (persistedTodo.status === 200) {
      resolve();
    } else {
      reject();
    }
  });

const createTodo = (title) => {
  return {
    id: uuid(),
    title: title,
    completed: false,
  };
};

export const todosMachine = Machine({
  id: "todos",
  context: {
    todo: {},
    todos: [],
    error: undefined,
  },
  initial: "idle",
  states: {
    idle: {
      on: {
        FETCH: "loading",
      },
    },
    loading: {
      invoke: {
        id: "getTodos",
        src: () => fetchTodos(),
        onDone: {
          target: "success",
          actions: assign({
            todos: (_, event) =>
              event.data.map((todo) => ({
                ...todo,
                ref: spawn(todoMachine.withContext(todo)),
              })),
          }),
        },
        onError: {
          target: "error",
          actions: assign({ error: (_, event) => event.data }),
        },
      },
    },
    success: {},
    persist: {
      invoke: {
        id: "persistTodo",
        src: (context) => persistTodo(context.todo),
        onDone: "success",
        onError: {
          target: "error",
          actions: assign({
            todo: {},
            todos: (context) =>
              context.todos.filter((todo) => todo.id !== context.todo.id),
          }),
        },
      },
    },
    persistDelete: {
      invoke: {
        id: "persistDelete",
        src: (context) => persistDeleteTodo(context.todo),
        onDone: {
          target: "success",
          actions: assign({ todo: {} }),
        },
        onError: {
          target: "error",
          actions: assign((context) => {
            return {
              todo: {},
              todos: context.todos.concat({
                ...context.todo,
                ref: spawn(todoMachine.withContext(context.todo)),
              }),
            };
          }),
        },
      },
    },
    error: {},
    all: {},
    active: {},
    completed: {},
  },
  on: {
    NEWTODO: {
      actions: [
        assign((context, event) => {
          const newTodo = createTodo(event.value.trim());
          return {
            todo: newTodo,
            todos: context.todos.concat({
              ...newTodo,
              ref: spawn(todoMachine.withContext(newTodo)),
            }),
          };
        }),
      ],
      cond: (_, event) => event.value.trim().length,
      target: "persist",
    },
    TODO_UPDATE: {
      actions: [
        assign((context, event) => ({
          todo: event.todo,
          todos: context.todos.map((todo) => {
            return todo.id === event.todo.id
              ? { ...todo, ...event.todo, ref: todo.ref }
              : todo;
          }),
        })),
      ],
    },
    TODO_DELETE: {
      actions: [
        assign((context, event) => ({
          todo: event.todo,
          todos: context.todos.filter((todo) => {
            return todo.id !== event.todo.id;
          }),
        })),
      ],
      target: "persistDelete",
    },
    "TOGGLE.completed": {
      actions: (context) => {
        context.todos.forEach((todo) => todo.ref.send("TOGGLE_COMPLETED"));
      },
    },
    "TOGGLE.active": {
      actions: (context) => {
        context.todos.forEach((todo) => todo.ref.send("TOGGLE_ACTIVE"));
      },
    },
    "SHOW.all": "all",
    "SHOW.active": "active",
    "SHOW.completed": "completed",
    CLEAR_COMPLETED: {
      actions: (context) =>
        context.todos.forEach(
          (todo) => todo.completed && todo.ref.send("DELETE")
        ),
    },
  },
});
