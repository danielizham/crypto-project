<script>
	import "../app.css"
	import { isLoggedIn, user } from "../store/authStore"
	import { auth, googleProvider } from "/src/Firebase"
	import { signInWithPopup, signOut } from "@firebase/auth"
	import { goto } from "$app/navigation"

	const login = async () => {
		try {
			const res = await signInWithPopup(auth, googleProvider)
			$user = res.user
			console.log(res.user)
			$isLoggedIn = true
			goto("/profile")
		} catch (error) {
			console.log(error)
		}
	}

	const logout = () => {
		signOut(auth)
		$user = {}
		$isLoggedIn = !$isLoggedIn
	}
</script>

<nav class="navbar bg-blue-600 justify-between sticky top-0 shadow-lg p-5">
	<div class="navbar-start">
		<span class="text-lg font-bold"> Crypt Messenger </span>
	</div>
	<div class="navbar-center">
		<a class="btn btn-accent px-11 mr-10" href="/">Home</a>
		<a class="btn btn-accent px-11 mr-10" href="/profile">Profile</a>
	</div>
	<div class="navbar-end">
		{#if $isLoggedIn}
			<a class="btn btn-error px-11" href="/" on:click={logout}>Logout</a>
		{:else}
			<a class="btn btn-error px-11" href="/" on:click={login}>Log In</a>
		{/if}
	</div>
</nav>

<div class="pt-10 px-10 min-h-screen text-warning">
	<slot />
</div>
