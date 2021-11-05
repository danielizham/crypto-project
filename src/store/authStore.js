import { db } from "../Firebase"
import { app } from '../Firebase'
import { browser } from '$app/env'
import { goto } from '$app/navigation'
import { writable } from 'svelte/store'
import { getAuth, onAuthStateChanged, signInWithPopup, signOut as _signOut, GoogleAuthProvider } from "firebase/auth"
import { addDoc, collection, getDocs, query, where } from "@firebase/firestore"


const addUserInfo = async(userEmail, userId) => {
    let q = query(collection(db, "users"), where('userEmail', "==", userEmail))
    let queryDocs = await getDocs(q)
    if (queryDocs.empty) {
        try {
            const userRef = await addDoc(collection(db, 'users'), {
                createdOn: new Date().getTime(),
                userEmail,
                publicKey: "BlaBlaBla",
                userId,
            })
        } catch (error) {
            console.log(error);
        }
    }
}

const createAuth = () => {
    const { subscribe, set } = writable({ user: null, known: false })

    async function listen() {
        const auth = getAuth(app)
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
        addUserInfo(auth.currentUser.email, auth.currentUser.uid)
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