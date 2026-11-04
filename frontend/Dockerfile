# syntax=docker/dockerfile:1
# Nginx "unprivileged": läuft als Nicht-Root-Benutzer auf Port 8080 (Least Privilege).
FROM nginxinc/nginx-unprivileged:1.30-alpine
# Adresse des Backends, wird beim Start in die Nginx-Konfiguration eingesetzt.
ENV BACKEND_UPSTREAM=http://backend:3000
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY index.html /usr/share/nginx/html/index.html
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/nginx-health || exit 1
