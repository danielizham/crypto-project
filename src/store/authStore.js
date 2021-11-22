import { db } from "../Firebase"
import { app } from '../Firebase'
import { browser } from '$app/env'
import { goto } from '$app/navigation'
import { writable } from 'svelte/store'
import { getAuth, onAuthStateChanged, signInWithPopup, signOut as _signOut, GoogleAuthProvider } from "firebase/auth"
import { addDoc, collection, doc, getDocs, query, setDoc, where } from "@firebase/firestore"


const addUserInfo = async (userEmail, userId, publicKey) => {
    let q = query(collection(db, "users"), where('userEmail', "==", userEmail))
    let queryDocs = await getDocs(q)
    const userRef = await setDoc(doc(db, 'users', userId), {
        userId,
        userEmail,
        publicKey: `${publicKey}`,
    })
}


const init_user = async (username) => {
    await fetch(`http://localhost:5000/set-name/${username}`, {
        mode: 'cors'
    })
    let response_2 = await fetch('http://localhost:5000/my-pub-key', {
        mode: 'cors',
        method: "GET",
    })
    let pub_key = await response_2.json()
    console.log(pub_key);

    return pub_key
}

const createAuth = () => {
    const { subscribe, set } = writable({ user: null, known: false })

    async function listen() {
        const auth = getAuth(app)
        let public_key = await init_user(auth.currentUser.displayName)
        addUserInfo(auth.currentUser.email, auth.currentUser.uid, public_key.data)
        onAuthStateChanged(auth,
            user => set({ user, known: true }),
            err => console.error(err.message),
        )
    }

    if (browser) {
        listen()
    } else {
        set({ user: null, known: true })
    }

    function providerFor(name) {
        switch (name) {
            case 'google':
                return new GoogleAuthProvider()
            default:
                throw 'unknown provider ' + name
        }
    }

    async function signInWith(name) {
        const auth = getAuth(app)
        const provider = providerFor(name)
        await signInWithPopup(auth, provider)
        goto("/profile")
    }

    async function signOut() {
        const auth = getAuth(app)
        await _signOut(auth)
    }

    return {
        subscribe,
        signInWith,
        signOut,
    }
}

export const auth = createAuth()