import { addDoc, collection, query, onSnapshot, limit, getDocs, deleteDoc, where, doc, getDoc, setDoc, updateDoc } from "@firebase/firestore";
import { async } from "@firebase/util";
import { writable, get } from "svelte/store";
import { db } from "../Firebase"

const messages = writable([])
const sharedKey = writable([])
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
        order: get(messages).length + 1,
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
    const connectionQuery = query(collection(db, 'connections'))
    const connectionSnap = await getDocs(connectionQuery)
    connectionSnap.forEach(connection => {
        let connectionExists = connection.data().userEmails.includes(currentUserEmail) && connection.data().userEmails.includes(otherUserEmail)
        if (connectionExists) {
            connectionRoom.set({ connection: connection.data(), connectionID: connection.id })
        }
    })

    onSnapshot(doc(db, "users", otherUserEmail), async (document) => {
        console.log(`User Update: ${JSON.stringify(document.data())}`);
        secondParty.set(document.data())
        await fetch(`http://localhost:5000/other-pub-key/${get(secondParty)["publicKey"]}`, {
            mode: "cors"
        })
        let shared_key = { data: "" }
        let res = await fetch(`http://localhost:5000/send-shared-key/`, {
            mode: "cors"
        })
        shared_key = await res.json()
        await updateDoc(doc(db, "connections", get(connectionRoom).connectionID), {
            encryptedSharedKey: shared_key.data
        })
        sharedKey.set(shared_key.data)
    })
    await checkConnection(currentUserEmail, otherUserEmail)
}

async function checkConnection(currentUserEmail, otherUserEmail) {
    if (get(connectionRoom).connectionID == undefined)
        await createConnection(currentUserEmail, otherUserEmail)
    await loadMessages(currentUserEmail)
}

async function createConnection(currentUserEmail, otherUserEmail) {
    const connectionRef = await addDoc(collection(db, 'connections'), {
        encryptedSharedKey: get(sharedKey),
        createdOn: new Date().getTime(),
        userEmails: [currentUserEmail, otherUserEmail],
    })
    let connectionInformation = await getDoc(connectionRef)
    connectionRoom.set({ connection: connectionInformation.data(), connectionID: connectionInformation.id })
}

async function loadMessages(currentUserEmail) {
    onSnapshot(doc(db, "connections", get(connectionRoom).connectionID), async (document) => {
        console.log(`Connection Update: ${JSON.stringify(document.data())}`);
        connectionRoom.set({ connection: document.data(), connectionID: document.id })
        await fetch(`http://localhost:5000/shared-key/${get(sharedKey)}/`, {
            mode: "cors"
        })
    })

    await updateDoc(doc(db, "connections", get(connectionRoom).connectionID), {
        encryptedSharedKey: get(sharedKey)
    })

    const q = query(collection(db, `connections/${get(connectionRoom)['connectionID']}/messages`))
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        messages.set([])
        querySnapshot.forEach((doc) => {
            let owner = doc.data().userEmail == currentUserEmail ? "self" : "other"
            fetch(`http://localhost:5000/decrypt-message/${owner}`, {
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
                        ].sort((a, b) => b.order - a.order))
                    } else if (status == "not-ok" && data == "") {
                        messages.update(mesgs => [
                            ...mesgs, { ...doc.data(), message: "Corrupted Message" }
                        ].sort((a, b) => b.order - a.order))
                    }
                })

        })
    })
}

async function deleteMessages(userId) {
    messages.set([])
    const q = query(collection(db, `connections/${get(connectionRoom)['connectionID']}/messages`), where('userId', "==", userId))
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, `connections/${get(connectionRoom)['connectionID']}/messages`, document.id))
    });
}

export { addMessage, messages, deleteMessages, initiateConnection, secondParty, connectionRoom }