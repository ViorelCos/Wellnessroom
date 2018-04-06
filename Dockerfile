FROM node:latest
RUN npm install -g gulp
CMD npm install && \
    gulp server
