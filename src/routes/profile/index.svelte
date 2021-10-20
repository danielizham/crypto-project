<script>
	import { user, isLoggedIn } from "/src/store/authStore"
</script>

<h1>This is the Profile</h1>
{#if $isLoggedIn}
	<!-- content here -->
	<img src={$user.photoURL} alt="Profile Thumbnail" />
	<h2>{$user.displayName}</h2>
{:else}
	<!-- else content here -->
	<h2 class="text-error">Need to Login First</h2>
{/if}
