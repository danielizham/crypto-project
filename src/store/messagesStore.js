import { addDoc, collection, query, onSnapshot, limit, getDocs, deleteDoc, where, doc, getDoc, setDoc, updateDoc } from "@firebase/firestore";
import { writable, get } from "svelte/store";
import { db } from "../Firebase"

const messages = writable([])
const secondParty = writable({})
const connectionRoom = writable({})

async function addMessage(userId, userEmail, message, username) {

    let res = await fetch(`http://localhost:5000/encrypt-message`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(message),
        mode: "cors"
    })
    let { ciphertext, nonce, sign_len } = await res.json()
    const connectionRef = await addDoc(collection(db, `connections/${get(connectionRoom)['connectionID']}/messages`), {
        createdOn: new Date().getTime(),
        userId: `${userId}`,
        userEmail,
        username,
        ciphertext,
        nonce,
        sign_len
    })
}

async function initiateConnection(currentUserEmail) {
    let otherUserEmail = prompt("Enter The Other Party's Email", "Everyone")
    switch (otherUserEmail) {
        case "Everyone":
            alert("It Wont be secure if you can hear everyone.")
            break
        case null:
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
    console.log(get(secondParty)["publicKey"]);
    await fetch(`http://localhost:5000/other-pub-key/${get(secondParty)["publicKey"]}`, {
        mode: "cors"
    })
    await checkConnection(currentUserEmail, otherUserEmail)
}

async function checkConnection(currentUserEmail, otherUserEmail) {
    console.log(get(connectionRoom).connectionID);
    if (get(connectionRoom).connectionID == undefined)
        await createConnection(currentUserEmail, otherUserEmail)
    await loadMessages()
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
    await fetch(`http://localhost:5000/shared-key/${get(connectionRoom)['connection']['encryptedSharedKey']}/`, {
        mode: "cors"
    })
    const q = query(collection(db, `connections/${get(connectionRoom)['connectionID']}/messages`), limit(7))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        messages.set([])
        querySnapshot.forEach((doc) => {
            fetch(`http://localhost:5000/decrypt-message`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(doc.data()),
                mode: "cors"
            })
                .then(data => data.json())
                .then(({ data, status }) => {
                    if (status == "ok") {
                        messages.update(mesgs => [
                            ...mesgs, { ...doc.data(), message: data }
                        ].sort((a, b) => b.createdOn - a.createdOn))
                    } else if (status == "not-ok" && data == "") {
                        messages.update(mesgs => [
                            ...mesgs, { ...doc.data(), message: "Corrupted Message" }
                        ].sort((a, b) => b.createdOn - a.createdOn))
                    }
                })

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