# Based on official nginx Dockerfile
# https://github.com/nginxinc/docker-nginx/blob/master/Dockerfile

FROM debian:wheezy

RUN apt-key adv --keyserver pgp.mit.edu --recv-keys 573BFD6B3D8FBC641079A6ABABF5BD827BD9BF62
RUN echo "deb http://nginx.org/packages/mainline/debian/ wheezy nginx" >> /etc/apt/sources.list

ENV NGINX_VERSION 1.7.9-1~wheezy

RUN \
  apt-get update && \
  apt-get upgrade -y && \
  apt-get install -y nginx=${NGINX_VERSION} && \
  ln -sf /dev/stdout /var/log/nginx/access.log && \
  ln -sf /dev/stderr /var/log/nginx/error.log

COPY ./ /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]