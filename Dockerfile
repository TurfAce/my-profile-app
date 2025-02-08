# ビルドステージ
FROM node:14-alpine AS build

# 作業ディレクトリを作成
WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install
RUN npm install --save-dev @babel/plugin-proposal-private-property-in-object
RUN npm install @fortawesome/fontawesome-svg-core

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm run build

# 実行ステージ
FROM node:14-alpine

# 作業ディレクトリを作成
WORKDIR /app

# ビルド成果物のみをコピー
COPY --from=build /app /app

# アプリケーションを実行
CMD ["npm", "start"]

# コンテナがリッスンするポートを指定
EXPOSE 3000
