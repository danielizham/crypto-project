import { addDoc, collection, query, onSnapshot, limit, orderBy, getDocs, deleteDoc, where, doc } from "@firebase/firestore";
import { writable } from "svelte/store";
import { db } from "../Firebase"

const messages = writable([])

async function addMessage(userId, message, username) {
    try {
        const messageRef = await addDoc(collection(db, 'messages'), {
            createdOn: Date.now(),
            userId: `${userId}`,
            username,
            message
        })
    } catch (error) {
        console.log(error);
    }
}

function listenToMesseges() {
    const q = query(collection(db, "messages"), orderBy("createdOn", "desc"), limit(7))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        messages.set([])
        querySnapshot.forEach((doc) => {
            messages.update(mesgs => [...mesgs, doc.data()])
        })
    })
}

async function deleteMessages(userId) {
    const q = query(collection(db, 'messages'), where("userId", "==", userId))
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async(document) => {
        await deleteDoc(doc(db, 'messages', document.id))
    });
}

export { addMessage, messages, listenToMesseges, deleteMessages }