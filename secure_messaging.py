from Crypto.Cipher import AES
from Crypto.PublicKey import ECC
from Crypto.Random import get_random_bytes
import ecies
import coincurve


class User:
    def __init__(self, name=None):
        self._name = name
        self.key = Key()
        self._other_public_key = None

    def sign(self, message):
        return self.key.sign(message)

    def verify(self, signature, message, owner):
        pub_key = self._other_public_key if owner == "other" else self.key.public
        return coincurve.verify_signature(signature, message, pub_key)

    def encrypt(self, message):
        # convert plaintext into bytes
        data = message.encode()

        # Path 1: plaintext -> SHA3-256 -> hash value -> asym encryption w/ private key -> signature
        signature = self.sign(message)

        # Path 2: plaintext -> sym encryption w/ shared key -> ciphertext
        cipher = AES.new(self.key.shared, AES.MODE_CTR)
        nonce = cipher.nonce
        ciphertext = cipher.encrypt(data)

        # After Path 1 & 2: signature || ciphertext -> signed ciphertext
        signed_ciphertext = signature + ciphertext

        return signed_ciphertext.hex(), nonce.hex(), len(signature)

    def decrypt(self, received_message, nonce, sign_len, owner):
        data = bytes.fromhex(received_message)
        nonce = bytes.fromhex(nonce)

        signature = data[:sign_len]
        ciphertext = data[sign_len:]

        # ciphertext -> AES decryption w/ shared key -> plaintext
        cipher = AES.new(self.key.shared, AES.MODE_CTR, nonce=nonce)
        plaintext = cipher.decrypt(ciphertext)

        # asym decryption w/ public key -> extracted hash == hash(plaintext) ?
        is_secure = self.verify(signature, plaintext, owner)

        if is_secure:
            print("The message is authentic.")
            return plaintext.decode()
        else:
            print("The message is not authentic.")
            return False

    def send_key_exchange(self):
        return self.key.send_key_exchange(self._other_public_key)

    def receive_key_exchange(self, cipherkey):
        self.key.receive_key_exchange(cipherkey)

    @property
    def other_public_key(self):
        return self._other_public_key

    @other_public_key.setter
    def other_public_key(self, value):
        if isinstance(value, str):
            self._other_public_key = bytes.fromhex(value)
        elif isinstance(value, (bytes, bytearray)):
            self._other_public_key = value

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        self._name = value


class Key:
    def __init__(self):
        self._ecc_key = ECC.generate(curve="P-256")
        self._coincurve_key = ecies.utils.generate_key().from_pem(
            self._ecc_key.export_key(format="PEM").encode()
        )
        self._shared = None

    @property
    def private(self):
        return self._private(format="bytes")

    def _private(self, format="bytes"):
        if format.lower() == "bytes":
            return self._coincurve_key.secret
        elif format.lower() == "pem":
            return self._ecc_key.export_key(format="PEM")

    @property
    def public(self):
        return self._public(format="bytes")

    def _public(self, format="bytes"):
        if format.lower() == "bytes":
            return self._coincurve_key.public_key.format(True)
        elif format.lower() == "pem":
            return self._ecc_key.public_key().export_key(format="PEM")

    @property
    def shared(self):
        return self._shared

    def send_key_exchange(self, other_public_key):
        self._shared = get_random_bytes(32)
        return ecies.encrypt(other_public_key, self._shared).hex()

    def receive_key_exchange(self, cipherkey):
        self._shared = ecies.decrypt(self.private, bytes.fromhex(cipherkey))

    def sign(self, message):
        return self._coincurve_key.sign(message.encode())


if __name__ == "__main__":
    user1 = User("President Biden")
    user2 = User("Sheikh Tamim")

    # retrieving each other's public key
    user1.other_public_key = user2.key.public.hex()
    user2.other_public_key = user1.key.public.hex()

    # let's say user1 initiates the key exchange
    assert user1.key.shared is None and user2.key.shared is None  # proving no shared key initially
    encrypted_shared_key = user1.send_key_exchange()
    user2.receive_key_exchange(encrypted_shared_key)
    # by this point, both of the users should have the same shared key
    assert (
        user1.key.shared is not None and user1.key.shared == user2.key.shared
    )  # proving secret key is shared

    # user2 wants to send a message
    message = "Dear President Biden, Enter Islam and you will be safe."
    ciphertext, nonce, sign_len = user2.encrypt(message)

    # user1 receives and decrypts it
    # if success = integrity, authencity and non-repudiation
    # if error = at least one of them is not met
    received_message = user1.decrypt(ciphertext, nonce, sign_len)
    assert message == received_message  # proving the sent message is the same as the received one
    print(user1.name, "received a message from", user2.name, ":", received_message)
