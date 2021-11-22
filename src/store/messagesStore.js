import { addDoc, collection, query, onSnapshot, limit, orderBy, getDocs, deleteDoc, where, doc, getDoc } from "@firebase/firestore";
import { writable, get } from "svelte/store";
import { db } from "../Firebase"

const messages = writable([])
const secondParty = writable({})
const connectionRoom = writable({})

async function addMessage(userId, userEmail, message, username) {
    try {
        const connectionRef = await addDoc(collection(db, `connections/${get(connectionRoom)['connectionID']}/messages`), {
            createdOn: new Date().getTime(),
            userId: `${userId}`,
            userEmail,
            username,
            message
        })
    } catch (e) {
        console.log(e);
    }
}

async function initiateConnection(currentUserEmail) {
    let otherUserEmail = prompt("Enter The Other Party's Email", "Everyone")
    switch (otherUserEmail) {
        case "Everyone":
            alert("It Wont be secure if you can hear everyone.")
            break
        case "":
            alert("Please provide an email")
            break
        default:
            listenToOtherPerson(currentUserEmail, otherUserEmail)
            break
    }
}

async function listenToOtherPerson(currentUserEmail, otherUserEmail) {
    const userQuery = query(collection(db, 'users'), where('userEmail', "==", otherUserEmail))
    const otherUser = await getDocs(userQuery)
    otherUser.docs.map(d => secondParty.set(d.data()))

    const connectionQuery = query(collection(db, 'connections'))
    const connectionSnap = await getDocs(connectionQuery)
    connectionSnap.forEach(connection => {
        let connectionExists = connection.data().userEmails.includes(currentUserEmail) && connection.data().userEmails.includes(otherUserEmail)
        if (connectionExists) {
            connectionRoom.set({ connection: connection.data(), connectionID: connection.id })
        }
    })
    await checkConnection(currentUserEmail, otherUserEmail)
    await fetch(`http://localhost:5000/other-pub-key/${get(secondParty)["publicKey"]}`, {
        mode: "cors"
    })
}

async function checkConnection(currentUserEmail, otherUserEmail) {
    if (get(connectionRoom).connectionID == undefined) {
        await createConnection(currentUserEmail, otherUserEmail)
    } else {
        await loadMessages()
    }
}

async function createConnection(currentUserEmail, otherUserEmail) {
    let res = await fetch(`http://localhost:5000/send-shared-key/`, {
        mode: "cors"
    })
    let shared_key = await res.json()
    const connectionRef = await addDoc(collection(db, 'connections'), {
        encryptedSharedKey: shared_key.data,
        createdOn: new Date().getTime(),
        userEmails: [currentUserEmail, otherUserEmail],
    })
    let connectionInformation = await getDoc(connectionRef)
    connectionRoom.set({ connection: connectionInformation.data(), connectionID: connectionRef.id })
}

async function loadMessages() {
    let res = await fetch(`http://localhost:5000/shared-key/${get(connectionRoom).connection.encryptedSharedKey}/`, {
        mode: "cors"
    })
    const q = query(collection(db, `connections/${get(connectionRoom)['connectionID']}/messages`), orderBy("createdOn", "desc"))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        messages.set([])
        querySnapshot.forEach((doc) => {
            messages.update(mesgs => [...mesgs, doc.data()])
        })
    })
}

async function deleteMessages(userId) {
    const q = query(collection(db, `connections/${get(connectionRoom)['connectionID']}/messages`), where('userId', "==", userId))
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, `connections/${get(connectionRoom)['connectionID']}/messages`, document.id))
    });
}

export { addMessage, messages, deleteMessages, initiateConnection, secondParty, connectionRoom }