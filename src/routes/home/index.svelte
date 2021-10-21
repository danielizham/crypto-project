<script>
	import { messages, addMessage, listenToMesseges, deleteMessages } from "../../store/messagesStore"
	import { auth } from "../../store/authStore"
	let messageContent = ""
	function submitMessage() {
		if (messageContent !== "") {
			addMessage($auth.user.uid, messageContent, $auth.user.displayName)
			messageContent = ""
		}
	}
	const clickedKey = (e) => {
		if (e.charCode === 13) submitMessage()
	}
</script>

{#if $auth.user}
	<div class="flex flex-col-reverse max-w-4xl mx-auto bg-gray-600 m-5 rounded-xl p-3">
		{#each $messages as messageObj}
			{#if messageObj.userId == $auth.user.uid}
				<!-- content here -->
				<h2
					class="rounded-2xl rounded-br-none alert-success ml-auto m-4 p-4 w-72 relative"
					style="overflow-wrap: break-word;"
				>
					{messageObj.message}
					<br />
					<div class="badge badge-accent text-black absolute left-0 -bottom-3">{messageObj.username}</div>
				</h2>
			{:else}
				<h2 class="rounded-2xl rounded-bl-none alert-info m-4 p-4 w-72 relative" style="overflow-wrap: break-word;">
					{messageObj.message}
					<br />
					<div class="badge badge-accent text-black absolute right-0 -bottom-3">{messageObj.username}</div>
				</h2>
			{/if}
		{/each}
	</div>
	<input
		class="flex w-96 mx-auto mb-5 input input-accent"
		placeholder="Enter Your Text"
		on:keypress={clickedKey}
		bind:value={messageContent}
		type="text"
	/>
	<div class="flex justify-between max-w-4xl mx-auto">
		<div class="btn btn-accent" on:click={submitMessage}>Send Messege</div>
		<div class="btn btn-accent" on:click={listenToMesseges()}>Listen to Messeges</div>
		<div class="btn btn-error" on:click={deleteMessages($auth.user.uid)}>Delete Messeges</div>
	</div>
{:else}
	<!-- else content here -->
	<h2 class="text-error">Need to Login First</h2>
{/if}
