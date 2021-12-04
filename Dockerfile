FROM nikolaik/python-nodejs:python3.9-nodejs17-slim

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm install
ADD ./static ./static
ADD ./src ./src
COPY ./svelte.config.js ./jsconfig.json \
    ./postcss.config.cjs ./tailwind.config.cjs \
    ./
RUN npm run build

COPY ./requirements.txt .
RUN pip install -r requirements.txt
COPY ./secure_messaging.py .
COPY ./server.py .

CMD ["python", "server.py"]
