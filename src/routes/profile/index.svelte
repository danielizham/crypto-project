<script>
	import { auth } from "/src/store/authStore"
</script>

<h1>This is the Profile</h1>
{#if $auth.user}
	<!-- content here -->
	<img src={$auth.user.photoURL} alt="Profile Thumbnail" />
	<h2>{$auth.user.displayName}</h2>
{:else}
	<!-- else content here -->
	<h2 class="text-error">Need to Login First</h2>
{/if}
