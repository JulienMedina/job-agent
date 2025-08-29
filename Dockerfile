# 1) Part de l'image officielle n8n
FROM n8nio/n8n:latest

# 2) Passe en root le temps d'installer les dépendances système + navigateurs
USER root

# 3) Copie ton package.json pour installer tes deps Node (dont playwright)
WORKDIR /project
COPY package*.json ./
RUN npm ci || npm i

# 4) Installe Chromium et ses dépendances système via Playwright
#    (--with-deps nécessite les privilèges root)
RUN npx playwright install chromium --with-deps

# 5) Reviens à l'utilisateur non-root (bonne pratique sécurité)
USER node

# 6) Remets le working dir par défaut d'n8n (l'app n8n lira sa config ici)
WORKDIR /home/node
