# CMPS381 Applied Cryptography - Project

## Backend usage

The following code already exists 
in the secure_messaging.py.
Do `python secure_messaging.py` to see the result.

I have made sure that the data sent to 
the frontend are in `str`'s (of hex nibbles)
and expect those coming from the frontend in that format
as well (except for sign_len which should 
be an `int`).

```python
from secure_messaging import User

user1 = User("President Biden")
user2 = User("Sheikh Tamim")

# retrieving each other's public key
user1.other_public_key = user2.key.public.hex()
user2.other_public_key = user1.key.public.hex()

# let's say user1 initiates the key exchange
assert user1.key.shared is None and user2.key.shared is None # proving no shared key initially
encrypted_shared_key = user1.send_key_exchange()
user2.receive_key_exchange(encrypted_shared_key)
# by this point, both of the users should have the same shared key
assert user1.key.shared is not None and user1.key.shared == user2.key.shared # proving secret key is shared

# user2 wants to send a message
message = "Dear President Biden, Enter Islam and you will be safe."
ciphertext, nonce, sign_len = user2.encrypt(message)

# user1 receives and decrypts it 
# if success = integrity, authencity and non-repudiation
# if error = at least one of them is not met
received_message = user1.decrypt(ciphertext, nonce, sign_len)
assert message == received_message # proving the sent message is the same as the received one
print(user1.name, "received a message from", user2.name, ":", received_message)
```

## Frontend usage

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte);

### Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npm init svelte@next

# create a new project in my-app
npm init svelte@next my-app
```

> Note: the `@next` is temporary

### Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

### Building

Before creating a production version of your app, install an [adapter](https://kit.svelte.dev/docs#adapters) for your target environment. Then:

```bash
npm run build
```

> You can preview the built app with `npm run preview`, regardless of whether you installed an adapter. This should _not_ be used to serve your app in production.

## Final complete version

Visit [crypto-app on dockerhub](https://hub.docker.com/r/danielizham/crypto-app)
