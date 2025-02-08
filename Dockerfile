# ビルドステージ
FROM node:22-alpine AS build

# 作業ディレクトリを作成
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm install -g typescript
RUN npm run build

# 実行ステージ
FROM node:22-alpine

# 作業ディレクトリを作成
WORKDIR /app

# ビルド成果物のみをコピー
COPY --from=build /app /app

# アプリケーションを実行
CMD ["npm", "start"]

# コンテナがリッスンするポートを指定
EXPOSE 3000
