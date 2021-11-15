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
    await checkConnection()
}

async function checkConnection() {
    if (get(connectionRoom) == {}) {
        await createConnection()
    } else {
        loadMessages()
    }
}

async function createConnection() {
    const connectionRef = await addDoc(collection(db, 'connections'), {
        createdOn: new Date().getTime(),
        userEmails: [currentUserEmail, otherUserEmail],
        encryptedSharedKey: "TeTeTeTe"
    })
    let connectionInformation = await getDoc(connectionRef)
    connectionRoom.set({ connection: connectionInformation.data(), connectionID: connectionRef.id })
}

function loadMessages() {
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

/*
    == Key Exchange ==
    - Create room if it doesnt exist (contain the users' IDs) -
    - create the shared key, encrypt it and then push it to the room - => fetch (machine) getSharedKey(other public_key) => he returns the shared key
                                                                          fetch (Server) updateRoomSharedKey()
    - if it exists: update other person's info -
        asks for the shared from the other end
    - Room exists:  -

    == Asking for shared keys ==
    >
    >
    >
    ==  Sending  ==
    fetch (machine) (plaintext) => he returns the (cipher, nounce, sign_len)
    fetch (server) (cipher, nounce, sign_len) => returns ok

    == Recieving ==
    fetch (server) that (cipher, nounce, sign_len, other public_key) => returns ok
    fetch (machine) to this pc, (cipher, nounce, sign_len, other public_key) => he returns the decrypted message
*/


export { addMessage, messages, deleteMessages, initiateConnection, secondParty, connectionRoom }