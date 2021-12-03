<script>
	import { messages, addMessage, deleteMessages, initiateConnection, secondParty } from "../../store/messagesStore"
	import { auth } from "../../store/authStore"
	let messageContent = ""
	function submitMessage() {
		if (messageContent !== "") {
			addMessage($auth.user.uid, $auth.user.email, messageContent, $auth.user.displayName)
			messageContent = ""
		}
	}
	const clickedKey = (e) => {
		if (e.charCode === 13) submitMessage()
	}
	// onMount(() => {
	// 	listenToMesseges()
	// })
</script>

{#if $auth.user}
	<!-- <h3>Second Party: {$secondParty.userEmail || "Not Assigned"}</h3> -->
	<div class="grid place-content-center">
		<div class="shadow-lg stats">
			<div class="stat bg-gray-800 place-items-center place-content-center">
				<div class="stat-title">Connected With</div>
				<div class="stat-value text-sm">{$secondParty.userEmail || "Not Assigned"}</div>
			</div>
		</div>
	</div>
	<div
		class="flex flex-col-reverse mx-auto bg-gray-600 m-5 rounded-xl p-3 min-w-max md:max-w-4xl"
		style="max-height:30rem; overflow-y: auto;"
	>
		{#each $messages as messageObj}
			{#if messageObj.userId == $auth.user.uid}
				<h2
					class="rounded-2xl rounded-br-none alert-success m-4 p-4 md:ml-auto md:w-72 relative"
					style="overflow-wrap: break-word;"
				>
					{messageObj.message}
					<br />
					<div class="badge badge-accent text-black absolute left-0 -bottom-3">{messageObj.username}</div>
				</h2>
			{:else}
				<h2 class="rounded-2xl rounded-bl-none alert-info m-4 p-4 md:w-72 relative" style="overflow-wrap: break-word;">
					{messageObj.message}
					<br />
					<div class="badge badge-accent text-black absolute right-0 -bottom-3">{messageObj.username}</div>
				</h2>
			{/if}
		{/each}
	</div>
	<input
		class="flex mx-auto mb-5 input input-accent w-full md:w-1/2"
		placeholder="Enter Your Text"
		on:keypress={clickedKey}
		bind:value={messageContent}
		type="text"
	/>
	<div class="flex gap-5 flex-wrap justify-center max-w-4xl mx-auto">
		<div class="btn btn-sm btn-accent" on:click={submitMessage}>Send Messege</div>
		<div class="btn btn-sm btn-accent" on:click={initiateConnection($auth.user.email)}>Connect</div>
		<div class="btn btn-sm btn-error" on:click={deleteMessages($auth.user.uid)}>Delete Messeges</div>
	</div>
{:else}
	<!-- else content here -->
	<h2 class="text-error">Need to Login First</h2>
{/if}
