import firestore from "../../lib/firebase";

export default async (request, response) => {
  if (request.method === "POST") {
    const todo = JSON.parse(request.body);
    try {
      const persisted = await firestore
        .doc(`todos/${todo.id}`)
        .set(todo, { merge: true });
      response.json({ persisted });
    } catch (e) {
      response.status(400).json({ error: JSON.stringify(e) });
    }
  } else if (request.method === "GET") {
    try {
      const snapshot = await firestore.collection("todos").get();
      const todos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      response.json(todos);
    } catch (e) {
      response.status(400).json({ error: JSON.stringify(e) });
    }
  } else if (request.method === "DELETE") {
    const todo = JSON.parse(request.body);
    try {
      const deleted = firestore.doc(`todos/${todo.id}`).delete();
      response.json({ deleted });
    } catch (e) {
      response.status(400).json({ error: JSON.stringify(e) });
    }
  } else {
    response.status(400).json({ error: "nothing to do" });
  }
};
