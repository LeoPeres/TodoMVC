import { Machine, assign, sendParent } from "xstate";
import { persistTodo } from "./Todos";

export const todoMachine = Machine({
  id: "todo",
  initial: "idle",
  context: {
    id: undefined,
    title: "",
    completed: false,
    prevTitle: "",
  },
  states: {
    idle: {
      on: {
        TOGGLE: {
          target: "togglePersist",
          actions: [
            assign({ completed: (context) => !context.completed }),
            sendParent((context) => ({ type: "TODO_UPDATE", todo: context })),
          ],
        },
        TOGGLE_COMPLETED: {
          actions: [
            assign({ completed: true }),
            sendParent((context) => ({
              type: "TODO_UPDATE",
              todo: { ...context, completed: true },
            })),
          ],
          target: "togglePersist",
        },
        TOGGLE_ACTIVE: {
          actions: [
            assign({ completed: false }),
            sendParent((context) => ({
              type: "TODO_UPDATE",
              todo: { ...context, completed: false },
            })),
          ],
          target: "togglePersist",
        },
        DELETE: "deleted",
        EDIT: {
          target: "editing",
        },
      },
    },
    completed: {
      on: {
        TOGGLE: {
          target: "pending",
          actions: [
            assign({ completed: (context) => !context.completed }),
            sendParent((context) => ({ type: "TODO_UPDATE", todo: context })),
          ],
        },
        TOGGLE_COMPLETED: {
          actions: [
            assign({ completed: true }),
            sendParent((context) => ({
              type: "TODO_UPDATE",
              todo: { ...context, completed: true },
            })),
          ],
          target: "togglePersist",
        },
        TOGGLE_ACTIVE: {
          actions: [
            assign({ completed: false }),
            sendParent((context) => ({
              type: "TODO_UPDATE",
              todo: { ...context, completed: false },
            })),
          ],
          target: "togglePersist",
        },
        DELETE: "deleted",
      },
    },
    pending: {
      on: {
        TOGGLE: {
          target: "completed",
          actions: [
            assign({ completed: (context) => !context.completed }),
            sendParent((context) => ({ type: "TODO_UPDATE", todo: context })),
          ],
          target: "togglePersist",
        },
        TOGGLE_COMPLETED: {
          actions: [
            assign({ completed: true }),
            sendParent((context) => ({
              type: "TODO_UPDATE",
              todo: { ...context, completed: true },
            })),
          ],
          target: "togglePersist",
        },
        TOGGLE_ACTIVE: {
          actions: [
            assign({ completed: false }),
            sendParent((context) => ({
              type: "TODO_UPDATE",
              todo: { ...context, completed: false },
            })),
          ],
          target: "togglePersist",
        },
        DELETE: "deleted",
      },
    },
    editing: {
      onEntry: assign({ prevTitle: (context) => context.title }),
      on: {
        CHANGE: {
          actions: assign({
            title: (_, event) => event.value,
          }),
        },
        BLUR: {
          target: "idle",
          actions: sendParent((context) => ({
            type: "TODO_UPDATE",
            todo: context,
          })),
          target: "togglePersist",
        },
        SAVE: {
          target: "togglePersist",
          actions: sendParent((context) => ({
            type: "TODO_UPDATE",
            todo: context,
          })),
          cond: (context) => context.title.trim().length > 0,
        },
        CANCEL: {
          target: "idle",
          actions: assign({ title: (context) => context.prevTitle }),
        },
      },
    },
    deleted: {
      onEntry: sendParent((context) => ({
        type: "TODO_DELETE",
        todo: context,
      })),
    },
    togglePersist: {
      invoke: {
        id: "togglePersist",
        src: (context) => persistTodo(context),
        onDone: "idle",
        onError: "error",
      },
    },
    error: {},
  },
});
