FROM node:20

WORKDIR /retailshoppingcartapp

COPY package*.json ./

RUN npm install express

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]