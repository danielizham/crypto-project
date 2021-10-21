<script>
	import "../app.css"
	import { auth } from "../store/authStore"

	const login = async () => {
		try {
			auth.signInWith("google")
		} catch (error) {
			console.log(error)
		}
	}

	const logout = () => {
		auth.signOut()
	}
</script>

<nav class="navbar bg-blue-600 justify-between shadow-lg p-5 gap-4 z-10 font-mono">
	<div class="navbar-start">
		<div class="dropdown">
			<div tabindex="0" class="btn btn-md">Crypt Messenger</div>
			<ul tabindex="0" class="p-2 shadow menu dropdown-content bg-base-200 rounded-box w-52">
				<a class="btn btn-accent px-7 mb-5" href="/home">Home</a>
				<a class="btn btn-accent px-7" href="/profile">Profile</a>
			</ul>
		</div>
	</div>
	<div class="navbar-center hidden gap-11 -mb-3 md:block">
		<a class="btn btn-accent px-7" href="/home">Home</a>
		<a class="btn btn-accent px-7" href="/profile">Profile</a>
	</div>
	<div class="navbar-end gap-1">
		{#if $auth.user}
			<a class="btn btn-error px-7" href="/" on:click={logout}>Logout</a>
		{:else}
			<a class="btn btn-error px-7" href="/" on:click={login}>Log In</a>
		{/if}
	</div>
</nav>

<div class="pt-10 px-10">
	<slot />
</div>
