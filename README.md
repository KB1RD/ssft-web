# ssft-web

Stupid Simple File Transfer - Facilitates 1-1 file transfer via an intermediate
server by piping the upload stream directly into the downstream, while storing
no content on the server. Requires no client side scripting.

Try the demo at https://ssft-web.herokuapp.com/

Simply run `npm start` to run the script. No building required.

Environment Variables
* `PUBLIC_URL` - **Required.** The public URL of the instance.
* `PORT_NUM` - Port to bind to. Defaults to `8080`.
* `RANDOM_LEN` - Length of random share IDs to generate. Defaults to `24`.
