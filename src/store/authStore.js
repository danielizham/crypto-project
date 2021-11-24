import { db } from "../Firebase"
import { app } from '../Firebase'
import { browser } from '$app/env'
import { goto } from '$app/navigation'
import { writable } from 'svelte/store'
import { getAuth, onAuthStateChanged, signInWithPopup, signOut as _signOut, GoogleAuthProvider } from "firebase/auth"
import {  doc, setDoc } from "@firebase/firestore"


const addUserInfo = async (userEmail, username, userId) => {
    fetch(`http://localhost:5000/set-name/${username}`, {
        mode: 'cors'
    })
    let response_2 = await fetch('http://localhost:5000/my-pub-key', {
        mode: 'cors',
    })
    let { data } = await response_2.json()
    const userRef = await setDoc(doc(db, 'users', userId), {
        userId,
        userEmail,
        publicKey: `${data}`,
    })
}

const createAuth = () => {
    const { subscribe, set } = writable({ user: null, known: false })
    async function listen() {
        const auth = getAuth(app)
        onAuthStateChanged(auth,
            user => {
                set({ user, known: true })
                user && addUserInfo(auth.currentUser.email, auth.currentUser.displayName, auth.currentUser.uid)
            },
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