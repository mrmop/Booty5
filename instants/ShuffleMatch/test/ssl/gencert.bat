openssl genrsa 2048 > key.pem
openssl req -x509 -days 1000 -new -key key.pem -out cert.pem