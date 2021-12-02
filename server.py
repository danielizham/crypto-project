from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask import request
from flask import jsonify
from secure_messaging import User

app = Flask(__name__)
CORS(app)


def res(data, status):
    """
    Named poorly to not type alot, originaly was create_response
    """
    return jsonify({"data": str(data), "status": status})


# Path for our main Svelte page
@app.route("/", methods=["GET", "POST"])
def base():
    return send_from_directory("./build", "index.html")


# Path for all the static files (compiled JS/CSS, etc.)
@app.route("/<path:path>", methods=["GET", "POST"])
def home(path):
    return send_from_directory("./build", path)


@app.route("/set-name/<name>", methods=["GET", "POST"])
def set_name(name):
    user.name = name
    return {"name": name, "status": "ok"}


@app.route("/get-name/", methods=["GET", "POST"])
def get_name():
    if user.name is None:
        return res("Username not set", "not-ok")
    return res(user.name, "ok")


################
# Key Exchange #
################
# TO FRONTEND
@app.route("/send-shared-key/", methods=["GET", "POST"])
def send_shared_key():
    return res(user.send_key_exchange(), "ok")


# FROM FRONTEND
@app.route("/other-pub-key/<other_pub_key>", methods=["GET", "POST"])
def set_other_pub_key(other_pub_key):
    user.other_public_key = other_pub_key
    return res(other_pub_key, "ok")


@app.route("/shared-key/<received_shared_key>/", methods=["GET", "POST"])
def receive_shared_key(received_shared_key):
    user.receive_key_exchange(received_shared_key)
    return res(received_shared_key, "ok")


######################
# Message Encryption #
######################
# TO FRONTEND
@app.route("/my-pub-key", methods=["GET", "POST"])
def my_pub_key():
    return res(user.key.public.hex(), "ok")


@app.route("/encrypt-message", methods=["GET", "POST"])
def encrypt_message():
    message = request.json
    ciphertext, nonce, sign_len = user.encrypt(message)
    return {"ciphertext": ciphertext, "nonce": nonce, "sign_len": sign_len}


######################
# Message Decryption #
######################
# TO FRONTEND
@app.route("/decrypt-message/<owner>", methods=["GET", "POST"])
def decrypt_message(owner):
    ciphertext = request.json["ciphertext"]
    nonce = request.json["nonce"]
    sign_len = request.json["sign_len"]
    message = user.decrypt(ciphertext, nonce, sign_len, owner)
    if message:
        return res(message, "ok")

    return res("", "not-ok")


if __name__ == "__main__":
    user = User()
    app.run()
