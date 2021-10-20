import { writable } from 'svelte/store'
import { browser } from '$app/env'
import { getAuth, onAuthStateChanged, signInWithPopup, signOut as _signOut, GoogleAuthProvider } from "firebase/auth"
import { app } from '../Firebase'
import { goto } from '$app/navigation'


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