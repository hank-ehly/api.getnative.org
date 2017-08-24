FROM node:latest
EXPOSE 3000
WORKDIR /var/www/api.getnativelearning.com
RUN apt-get update && apt-get install -y build-essential libav-tools

COPY run /usr/local/bin/run
RUN chmod +x /usr/local/bin/run

CMD ["/usr/local/bin/run"]
