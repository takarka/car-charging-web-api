FROM node:18.7.0-alpine

RUN apk update
RUN apk add nginx
RUN apk add supervisor

RUN rm -f /etc/nginx/http.d/default.conf
ADD ./docker/nginx/http.d/default.conf /etc/nginx/http.d/default.conf

COPY ./docker/supervisord.conf /etc/supervisor/supervisord.conf
COPY ./docker/supervisor.conf /etc/supervisor/conf.d/supervisor.conf


RUN mkdir -p /home/www/node/node_modules && chown -R node:node /home/www/node
RUN mkdir -p /var/log/supervisor && chown -R node:node /var/log/supervisor

WORKDIR /home/www/node
COPY package*.json ./
RUN npm install
RUN npm ci --only=production
COPY --chown=node:node . ./
EXPOSE 4000

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/supervisord.conf"]