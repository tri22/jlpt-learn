FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Chế độ dev: chạy Vite dev server (HMR). Source được bind-mount lúc runtime
# nên không cần build lại image khi sửa code.
FROM deps AS dev

COPY . .

EXPOSE 80

CMD ["sh", "-c", "if [ ! -d node_modules/vite ]; then npm ci; fi; npm run dev -- --host 0.0.0.0 --port 80 --strictPort"]

FROM deps AS build

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
